import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuthStore } from '@/src/modules/auth/store';
import { endSession, startSession } from '@/src/modules/sessions/service';
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
    const { isTracking, currentLocation, lastSyncTime } = useTrackingStore();
    const { activeSession } = useSessionStore();
    const [isSyncing, setIsSyncing] = useState(false);
    const [pendingCount, setPendingCount] = useState(0);
    const [showDisclosure, setShowDisclosure] = useState(false);

    const colorScheme = useColorScheme() ?? 'light';
    const theme = Colors[colorScheme];

    // Animation for the tracking pulse
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
        const interval = setInterval(checkPending, 10000);
        return () => clearInterval(interval);
    }, [lastSyncTime, isTracking]);

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
        if (isTracking) {
            await stopTracking();
            await endSession();
        } else {
            setShowDisclosure(true);
        }
    };

    const confirmTracking = async () => {
        setShowDisclosure(false);
        await startSession();
        await startTracking();
    };

    const handleRouteEvent = async (type: 'pickup' | 'dropoff' | 'waiting') => {
        if (!activeSession || !user) {
            ToastAndroid.show('Inicie um turno antes de registrar eventos.', ToastAndroid.SHORT);
            return;
        }

        try {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            await createRouteEvent(activeSession.id, user.id, type);

            // Reset automatic waiting detection on manual action
            resetWaitingDetection();

            ToastAndroid.show('Evento registrado.', ToastAndroid.SHORT);
        } catch (e) {
            logger.error('[Dashboard] Failed to create route event', e);
            ToastAndroid.show('Não foi possível registrar o evento.', ToastAndroid.SHORT);
        }
    };

    const formatTime = (seconds: number) => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        return h > 0 ? `${h}h ${m}m` : `${m}m`;
    };
    return {
        user,
        isTracking,
        currentLocation,
        lastSyncTime,
        isSyncing,
        pendingCount,
        showDisclosure,
        theme,
        pulseAnim,
        activeSession,
        handleManualSync,
        handleToggleTracking,
        confirmTracking,
        handleRouteEvent,
        formatTime,
        setShowDisclosure,
    }
}