import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import * as Location from 'expo-location';
import * as Network from 'expo-network';
import * as Notifications from 'expo-notifications';
import { useRouter } from 'expo-router';
import { useState } from 'react';

export function useDiagnostic() {
    const router = useRouter();
    const colorScheme = useColorScheme() ?? 'light';
    const theme = Colors[colorScheme];

    const [isScanning, setIsScanning] = useState(false);
    const [results, setStats] = useState({
        gpsForeground: 'pending',
        gpsBackground: 'pending',
        notifications: 'pending',
        network: 'pending',
        battery: 'pending',
        mapboxToken: 'pending'
    });

    const runDiagnostic = async () => {
        setIsScanning(true);

        // Reset
        setStats({
            gpsForeground: 'loading',
            gpsBackground: 'loading',
            notifications: 'loading',
            network: 'loading',
            battery: 'loading'
        });

        // 1. GPS Foreground
        const { status: fg } = await Location.getForegroundPermissionsAsync();
        setStats(prev => ({ ...prev, gpsForeground: fg === 'granted' ? 'success' : 'error' }));
        await delay(600);

        // 2. GPS Background
        const { status: bg } = await Location.getBackgroundPermissionsAsync();
        setStats(prev => ({ ...prev, gpsBackground: bg === 'granted' ? 'success' : 'error' }));
        await delay(600);

        // 3. Notifications
        const { status: notif } = await Notifications.getPermissionsAsync();
        setStats(prev => ({ ...prev, notifications: notif === 'granted' ? 'success' : 'error' }));
        await delay(600);

        // 4. Network
        const net = await Network.getNetworkStateAsync();
        setStats(prev => ({ ...prev, network: net.isConnected ? 'success' : 'error' }));
        await delay(600);

        // 5. Battery (Simulação de check de otimização)
        setStats(prev => ({ ...prev, battery: 'warning' }));
        await delay(600);

        // 6. Mapbox Token
        const mapboxToken = process.env.EXPO_PUBLIC_MAPBOX_TOKEN;
        setStats(prev => ({ ...prev, mapboxToken: (mapboxToken && mapboxToken.startsWith('pk.')) ? 'success' : 'error' }));

        setIsScanning(false);
    };

    const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

    return {
        runDiagnostic,
        results,
        isScanning,
        router,
        theme,

    }
}