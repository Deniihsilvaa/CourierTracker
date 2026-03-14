import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuthStore } from '@/src/modules/auth/store';
import { useTrackingStore } from '@/src/modules/tracking/store';
import { supabase, visualization } from '@/src/services/supabase';
import { runFullSync } from '@/src/services/sync';
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
            console.log('[Analytics] Loading data for user:', user.id);

            // 1. Fetch RAW Work Sessions for faithful summary
            const { data: rawSessions, error: sessionsError } = await supabase
                .from('work_sessions')
                .select('*')
                .eq('user_id', user.id)
                .order('start_time', { ascending: false });

            if (sessionsError) throw sessionsError;

            // 2. Fetch daily aggregated stats for the list (using view for speed)
            const { data: statsData } = await visualization
                .from('daily_driver_stats')
                .select('*')
                .eq('user_id', user.id)
                .order('work_day', { ascending: false })
                .limit(10);

            // 3. Process Summary from RAW data (Most accurate)
            if (rawSessions && rawSessions.length > 0) {
                // First, group sessions by date to find unique working days
                const workingDays = new Set(rawSessions.map(s => s.start_time.split('T')[0]));
                const numDays = workingDays.size || 1;

                const totalKm = rawSessions.reduce((acc, curr) => acc + (curr?.total_distance_km || 0), 0);
                const totalActiveSeconds = rawSessions.reduce((acc, curr) => acc + (curr?.total_active_seconds || 0), 0);
                const totalIdleSeconds = rawSessions.reduce((acc, curr) => acc + (curr?.total_idle_seconds || 0), 0);

                const totalHours = totalActiveSeconds / 3600;
                const totalIdleHours = totalIdleSeconds / 3600;

                // Speed calculation: Distance / Time (avoid division by zero)
                const avgSpeed = totalHours > 0 ? totalKm / totalHours : 0;
                const idlePct = (totalHours + totalIdleHours) > 0
                    ? (totalIdleHours / (totalHours + totalIdleHours)) * 100
                    : 0;

                setSummary({
                    totalKm: totalKm / numDays, // Show Average KM PER DAY
                    totalHours: totalHours / numDays, // Show Average HOURS PER DAY
                    avgSpeed,
                    idlePct,
                    efficiency: avgSpeed
                });

                // 4. Generate Hourly Activity based on the last 10 trips
                const { data: tripsData } = await visualization
                    .from('trip_performance')
                    .select('*')
                    .eq('user_id', user.id)
                    .order('start_time', { ascending: false })
                    .limit(20);

                if (tripsData) {
                    const hours = new Array(24).fill(0);
                    tripsData.forEach(trip => {
                        const hour = new Date(trip.start_time).getHours();
                        hours[hour] += (trip.distance_km || 0);
                    });
                    setHourlyData(hours);
                    setPerformance(tripsData);
                }

                // 5. Fetch route for map
                const { data: routeData } = await visualization
                    .from('session_route')
                    .select('latitude, longitude')
                    .eq('user_id', user.id)
                    .limit(100)
                    .order('recorded_at', { ascending: false });

                if (routeData) {
                    setRoutePoints(routeData.map(p => ({ latitude: p.latitude, longitude: p.longitude })));
                }
            }

            if (statsData) {
                setDailyStats(statsData);
            }

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
        await runFullSync();
        await loadData();
        setRefreshing(false);
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