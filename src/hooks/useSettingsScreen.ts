import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuthStore } from '@/src/modules/auth/store';
import { localDatabase } from '@/src/services/localDatabase';
import { cleanupSyncedData } from '@/src/services/sqlite';
import * as Linking from 'expo-linking';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
    Alert,
    Platform
} from 'react-native';

import { requestNotificationPermissions } from '@/src/utils/notification-permissions';


export default function useSettingsScreen() {
    const router = useRouter();
    const { user, signOut } = useAuthStore();
    const colorScheme = useColorScheme() ?? 'light';
    const theme = Colors[colorScheme];

    const [notifications, setNotifications] = useState(true);
    const [pendingSync, setPendingSync] = useState(0);
    const [vehicle, setVehicle] = useState('Moto');
    const [highPrecision, setHighPrecision] = useState(true);

    useEffect(() => {
        const fetchSyncStatus = async () => {
            const gps = await localDatabase.query('gps_points', 'WHERE synced = 0');
            const events = await localDatabase.query('route_events', 'WHERE synced = 0');
            setPendingSync(gps.length + events.length);
        };
        fetchSyncStatus();
    }, []);

    const handleCleanup = () => {
        Alert.alert(
            'Limpar Cache',
            'Deseja remover dados de GPS com mais de 7 dias que já foram sincronizados?',
            [
                { text: 'Não', style: 'cancel' },
                {
                    text: 'Limpar Agora',
                    onPress: async () => {
                        await cleanupSyncedData();
                        Alert.alert('Sucesso', 'Armazenamento otimizado.');
                    }
                },
            ]
        );
    };

    const openBatterySettings = () => {
        if (Platform.OS === 'android') {
            Linking.openSettings();
        } else {
            Linking.openURL('app-settings:');
        }
    };

    const toggleNotifications = async (value: boolean) => {
        if (value) {
            const granted = await requestNotificationPermissions();
            setNotifications(granted);
        } else {
            Alert.alert(
                'Desativar Alertas',
                'Isso impedirá que você registre eventos diretamente pela barra de notificações. Deseja continuar?',
                [
                    { text: 'Cancelar', style: 'cancel', onPress: () => setNotifications(true) },
                    { text: 'Desativar', style: 'destructive', onPress: () => setNotifications(false) },
                ]
            );
        }
    };


    return {
        router,
        user,
        colorScheme,
        theme,
        notifications,
        pendingSync,
        vehicle,
        highPrecision,
        handleCleanup,
        openBatterySettings,
        toggleNotifications,
        setVehicle,
        setHighPrecision,
        setNotifications,
        setPendingSync,
        signOut,
    }
}