import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuthStore } from '@/src/modules/auth/store';
import { useTrackingStore } from '@/src/modules/tracking/store';
import { runFullSync } from '@/src/services/sync';
import { analyticsService } from '@/src/services/analytics.service';
import { useEffect, useState } from 'react';

export function useAnalytics() {
    const [dailyStats, setDailyStats] = useState<any[]>([]);
    const [performance, setPerformance] = useState<any[]>([]);
    const [refreshing, setRefreshing] = useState(false);
    const { lastSyncTime } = useTrackingStore();
    const { user } = useAuthStore();

    const colorScheme = useColorScheme() ?? 'light';
    const theme = Colors[colorScheme];
    const [hourlyData, setHourlyData] = useState<number[]>(new Array(24).fill(0));
    const [summary, setSummary] = useState({
        totalKm: 0,
        totalHours: 0,
        avgSpeed: 0,
        idlePct: 0,
        efficiency: 0
    });
    const [routePoints, setRoutePoints] = useState<any[]>([]);

    useEffect(() => {
        loadData();
    }, [user]);

    const loadData = async () => {
        if (!user) return;

        try {
            console.log('[Analytics] Loading data from API for user:', user.id);

            // 1. Fetch Summary (Aggregated metrics)
            const summaryData = await analyticsService.getSummary();
            if (summaryData) {
                setSummary({
                    totalKm: summaryData.avg_km_per_day || summaryData.total_distance_km || 0,
                    totalHours: summaryData.avg_hours_per_day || (summaryData.total_active_seconds / 3600) || 0,
                    avgSpeed: summaryData.avg_speed || 0,
                    idlePct: summaryData.idle_percentage || 0,
                    efficiency: summaryData.avg_speed || 0
                });
            }

            // 2. Fetch Daily Stats
            const statsData = await analyticsService.getDailyStats();
            if (statsData) {
                setDailyStats(statsData);
            }

            // 3. Fetch Trips for hourly activity and performance list
            const tripsData = await analyticsService.getTrips();
            if (tripsData) {
                const hours = new Array(24).fill(0);
                tripsData.slice(0, 20).forEach((trip: any) => {
                    const hour = new Date(trip.start_time).getHours();
                    hours[hour] += (trip.distance_km || 0);
                });
                setHourlyData(hours);
                setPerformance(tripsData);
            }

            // Note: If route points are still needed for a map and not in summary/trips,
            // we might need an extra endpoint or check if trips include them.
            // For now, keeping routePoints empty or assuming they come from a trip detail if selected.

        } catch (e) {
            console.error('[Analytics] Critical data load error:', e);
        }
    };

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr + 'T12:00:00'); // Mid-day to avoid TZ issues
        const today = new Date();
        const yesterday = new Date();
        yesterday.setDate(today.getDate() - 1);

        if (date.toDateString() === today.toDateString()) return 'Hoje';
        if (date.toDateString() === yesterday.toDateString()) return 'Ontem';

        return date.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: 'short' });
    };

    const handleManualSync = async () => {
        setRefreshing(true);
        try {
            await runFullSync();
            await loadData();
        } finally {
            setRefreshing(false);
        }
    };


    return {
        dailyStats,
        performance,
        refreshing,
        summary,
        routePoints,
        hourlyData,
        handleManualSync,
        formatDate,
        theme,
        colorScheme,
        lastSyncTime
    }
}
