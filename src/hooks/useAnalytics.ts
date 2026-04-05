import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuthStore } from '@/src/modules/auth/store';
import { useTrackingStore } from '@/src/modules/tracking/store';
import { analyticsService } from '@/src/services/analytics.service';
import { runFullSync } from '@/src/services/sync';
import { useEffect, useState } from 'react';

function ensureHourlyData(value: unknown): number[] {
    if (!Array.isArray(value)) return new Array(24).fill(0);

    const safe = value.map((item) => Number(item || 0));
    if (safe.length >= 24) return safe.slice(0, 24);

    return [...safe, ...new Array(24 - safe.length).fill(0)];
}

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
        void loadData();
    }, [user]);

    const loadData = async () => {
        if (!user) {
            setDailyStats([]);
            setPerformance([]);
            setHourlyData(new Array(24).fill(0));
            return;
        }

        try {
            console.log('[Analytics] Loading data from API for user:', user.id);

            const summaryData = await analyticsService.getSummary<any>();
            if (summaryData) {
                setSummary({
                    totalKm: Number(summaryData.avg_km_per_day || summaryData.total_distance_km || 0),
                    totalHours: Number(summaryData.avg_hours_per_day || 0) || Number(summaryData.total_active_seconds || 0) / 3600,
                    avgSpeed: Number(summaryData.avg_speed || 0),
                    idlePct: Number(summaryData.idle_percentage || 0),
                    efficiency: Number(summaryData.avg_speed || 0)
                });
            } else {
                setSummary({
                    totalKm: 0,
                    totalHours: 0,
                    avgSpeed: 0,
                    idlePct: 0,
                    efficiency: 0
                });
            }

            const normalizedDailyStats = await analyticsService.getDailyStats<any>();
            setDailyStats(normalizedDailyStats);

            const tripsData = await analyticsService.getTrips<any>();
            if (tripsData.length > 0) {
                const hours = new Array(24).fill(0);
                tripsData.slice(0, 20).forEach((trip: any) => {
                    const startTime = trip?.start_time ? new Date(trip.start_time) : null;
                    const hour = startTime && !Number.isNaN(startTime.getTime()) ? startTime.getHours() : -1;
                    if (hour >= 0 && hour <= 23) {
                        hours[hour] += Number(trip?.distance_km || 0);
                    }
                });
                setHourlyData(ensureHourlyData(hours));
                setPerformance(tripsData);
            } else {
                setHourlyData(new Array(24).fill(0));
                setPerformance([]);
            }
        } catch (e) {
            console.error('[Analytics] Critical data load error:', e);
            setDailyStats([]);
            setPerformance([]);
            setHourlyData(new Array(24).fill(0));
        }
    };

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr + 'T12:00:00');
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
