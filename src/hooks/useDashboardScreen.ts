import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAnalyticsStore } from '@/src/modules/analytics/store';
import { useAuthStore } from '@/src/modules/auth/store';
import { deleteSession, endSession, fetchSessionData, recoverActiveSession, startSession } from '@/src/modules/sessions/service';
import { useSessionStore } from '@/src/modules/sessions/store';
import { createRouteEvent } from '@/src/modules/tracking/routeEventService';
import { useTrackingStore } from '@/src/modules/tracking/store';
import { localDatabase } from '@/src/services/localDatabase';
import { runFullSync } from '@/src/services/sync';
import { logger } from '@/src/utils/logger';
import * as Haptics from 'expo-haptics';
import { useEffect, useRef, useState } from 'react';
import { Alert, Animated, ToastAndroid } from 'react-native';

export default function useDashboardScreen() {
    const { user } = useAuthStore();
    const { isTracking, lastSyncTime } = useTrackingStore();
    const {
        activeSession,
        sessionDuration,
        odometer,
        setOdometer,
        isLoading: loadingSession,
        setIsLoading: setLoadingSession,
        setActiveSession
    } = useSessionStore();

    const [isSyncing, setIsSyncing] = useState(false);
    const [pendingCount, setPendingCount] = useState(0);

    const {
        financials,
        isLoading: loadingAnalytics,
        fetchFinancialSummary
    } = useAnalyticsStore();

    const colorScheme = useColorScheme() ?? 'light';
    const theme = Colors[colorScheme];

    const pulseAnim = useRef(new Animated.Value(1)).current;

    // Pulse animation removed as tracking is disabled

    // Importação dinâmica para evitar dependência circular
    const { resetWaitingDetection } = require('../modules/tracking/service');

    useEffect(() => {
        const checkPending = async () => {
            try {
                const gpsRows = await localDatabase.query('gps_points', 'WHERE synced = 0 LIMIT 1');
                const sessionRows = await localDatabase.query('work_sessions', 'WHERE synced = 0 LIMIT 1');
                setPendingCount(gpsRows.length + sessionRows.length);
            } catch (e) {
                logger.error('[Dashboard] Error checking pending items:', e);
            }
        };

        const loadAnalytics = async () => {
            fetchFinancialSummary("month");
        };

        checkPending();
        loadAnalytics();
        recoverActiveSession();

        const interval = setInterval(checkPending, 10000);
        return () => clearInterval(interval);
    }, [lastSyncTime, isTracking]);

    useEffect(() => {
        if (activeSession?.id) {
            setLoadingSession(true);
            fetchSessionData(activeSession.id)
                .then(data => {
                    if (data) {
                        // Update activeSession with data from API (odometer, etc)
                        setActiveSession({
                            ...activeSession,
                            ...data,
                            // Ensure snake_case from API maps to interface if needed
                            start_odometer: data.start_odometer || data.startOdometer
                        });
                    }
                })
                .catch(error => logger.error('[Dashboard] Error fetching session:', error))
                .finally(() => setLoadingSession(false));
        }
    }, [activeSession?.id]);

    const [isStopModalVisible, setIsStopModalVisible] = useState(false);
    const [endOdometer, setEndOdometer] = useState('');

    const handleManualSync = async () => {
        if (isSyncing) return;
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setIsSyncing(true);
        try {
            await runFullSync();
        } catch (e: any) {
            if (e.message === 'OFFLINE') {
                Alert.alert('Sem Conexão', 'Não foi possível sincronizar os dados.');
            }
        } finally {
            setIsSyncing(false);
        }
    };

    const handleStartSession = async () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        try {
            const odo = odometer ? Number(odometer) : undefined;
            await startSession(odo);
        } catch (e) {
            logger.error('[Dashboard] Failed to start session:', e);
            Alert.alert('Erro', 'Não foi possível iniciar o turno.');
        }
    };

    const handleStopSession = async () => {
        setEndOdometer('');
        setIsStopModalVisible(true);
    };

    const handleDeleteSession = async () => {
        if (!activeSession) return;

        Alert.alert(
            'Excluir Turno',
            'Deseja realmente excluir este turno? Todos os dados de GPS e tempo serão perdidos permanentemente.',
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Excluir',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            setLoadingSession(true);
                            await deleteSession(activeSession.id);
                            ToastAndroid.show('Turno excluído.', ToastAndroid.SHORT);
                        } catch (e) {
                            Alert.alert('Erro', 'Não foi possível excluir o turno.');
                        } finally {
                            setLoadingSession(false);
                        }
                    }
                }
            ]
        );
    };

    const confirmStopSession = async () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

        const finalOdo = endOdometer.trim() ? Number(endOdometer) : undefined;

        if (finalOdo !== undefined && activeSession?.start_odometer) {
            if (finalOdo < activeSession.start_odometer) {
                Alert.alert('Atenção', 'O odômetro final não pode ser menor que o inicial.');
                return;
            }
        }

        try {
            if (endOdometer.trim()) {
                setOdometer(endOdometer);
            }
            await endSession();
            setIsStopModalVisible(false);
        } catch (e) {
            logger.error('[Dashboard] Failed to stop session:', e);
            Alert.alert('Erro', 'Não foi possível encerrar o turno.');
        }
    };

    const handleRouteEvent = async (type: 'pickup' | 'dropoff' | 'waiting') => {
        if (!activeSession || !user) {
            ToastAndroid.show('Inicie um turno antes de registrar eventos.', ToastAndroid.SHORT);
            return;
        }

        try {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            await createRouteEvent(activeSession.id, user.id, type);
            resetWaitingDetection();
            ToastAndroid.show('Evento registrado.', ToastAndroid.SHORT);
        } catch (e) {
            logger.error('[Dashboard] Failed to create route event', e);
        }
    };

    const handleSaveOdometer = async () => {
        if (!odometer.trim() || !activeSession) return;
        try {
            await localDatabase.update('work_sessions', activeSession.id, {
                start_odometer: odometer
            });

            setActiveSession({
                ...activeSession,
                start_odometer: Number(odometer)
            });

            ToastAndroid.show('Odômetro salvo!', ToastAndroid.SHORT);
        } catch (error) {
            logger.error('[Dashboard] Error saving odometer:', error);
        }
    };

    return {
        user,
        isTracking,
        isSyncing,
        pendingCount,
        theme,
        pulseAnim,
        activeSession,
        loadingSession,
        sessionTime: sessionDuration,
        odometer,
        isStopModalVisible,
        setIsStopModalVisible,
        endOdometer,
        setOdometer,
        setEndOdometer,
        handleSaveOdometer,
        handleManualSync,
        handleStartSession,
        handleStopSession,
        handleDeleteSession,
        confirmStopSession,
        handleRouteEvent,
        fetchFinancialSummary,
        financials,
        loadingAnalytics,
    };
}
