import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuthStore } from '@/src/modules/auth/store';
import { endSession, fetchSessionData, startSession, recoverActiveSession } from '@/src/modules/sessions/service';
import { useSessionStore } from '@/src/modules/sessions/store';
import { createRouteEvent } from '@/src/modules/tracking/routeEventService';
import { resetWaitingDetection, startTracking, stopTracking } from '@/src/modules/tracking/service';
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
    const { activeSession, sessionDuration } = useSessionStore();
    
    const [isSyncing, setIsSyncing] = useState(false);
    const [pendingCount, setPendingCount] = useState(0);
    const [loadingSession, setLoadingSession] = useState(false);
    const [sessionData, setSessionData] = useState<any>(null);
    const [odometer, setOdometer] = useState('');
    const [isPaused, setIsPaused] = useState(false);

    const colorScheme = useColorScheme() ?? 'light';
    const theme = Colors[colorScheme];

    const pulseAnim = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        if (isTracking) {
            Animated.loop(
                Animated.sequence([
                    Animated.timing(pulseAnim, { toValue: 1.2, duration: 1000, useNativeDriver: true }),
                    Animated.timing(pulseAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
                ])
            ).start();
        } else {
            pulseAnim.setValue(1);
        }
    }, [isTracking]);

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

        checkPending();
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
                        setSessionData(data);
                        if (data.start_odometer) setOdometer(String(data.start_odometer));
                    }
                })
                .catch(error => logger.error('[Dashboard] Error fetching session:', error))
                .finally(() => setLoadingSession(false));
        } else {
            setSessionData(null);
            setOdometer('');
        }
    }, [activeSession?.id]);

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

    const handleToggleTracking = async () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        try {
            if (isTracking) {
                await stopTracking();
                await endSession();
            } else {
                const odo = odometer ? Number(odometer) : undefined;
                await startSession(odo);
                await startTracking();
            }
        } catch (e) {
            logger.error('[Dashboard] Failed to toggle tracking:', e);
            Alert.alert('Erro', 'Não foi possível processar a ação.');
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
            setSessionData((prev: any) => ({ ...prev, start_odometer: odometer }));
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
        sessionData,
        loadingSession,
        sessionTime: sessionDuration,
        odometer,
        setOdometer,
        isPaused,
        setIsPaused,
        handleSaveOdometer,
        handleManualSync,
        handleToggleTracking,
        handleRouteEvent,
    };
}
