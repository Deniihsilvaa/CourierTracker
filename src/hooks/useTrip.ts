import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuthStore } from '@/src/modules/auth/store';
import { visualization } from '@/src/services/supabase';
import { useEffect, useMemo, useState } from 'react';
import { TripPerformance } from '../types/route-trip';

export default function useTrip() {
    const [trips, setTrips] = useState<TripPerformance[]>([]);
    const [refreshing, setRefreshing] = useState(false);
    const [timeFilter, setTimeFilter] = useState<'7d' | '30d' | 'all'>('7d');
    const { user } = useAuthStore();
    const colorScheme = useColorScheme() ?? 'light';
    const theme = Colors[colorScheme];

    useEffect(() => {
        loadTrips();
    }, [user]);

    const loadTrips = async () => {
        if (!user) return;

        try {
            const { data, error } = await visualization
                .from('trip_performance')
                .select('*')
                .eq('user_id', user.id)
                .order('start_time', { ascending: false });

            if (error) throw error;
            if (data) setTrips(data);
        } catch (e) {
            console.error('Failed to load trips from Supabase', e);
        }
    };

    const onRefresh = async () => {
        setRefreshing(true);
        await loadTrips();
        setRefreshing(false);
    };

    const formatDuration = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}m ${secs}s`;
    };

    const formatDateLabel = (dateStr: string) => {
        const date = new Date(dateStr);
        const today = new Date();
        const yesterday = new Date();
        yesterday.setDate(today.getDate() - 1);

        if (date.toDateString() === today.toDateString()) return 'Hoje';
        if (date.toDateString() === yesterday.toDateString()) return 'Ontem';

        return date.toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: 'long',
            year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined
        });
    };

    const totals = useMemo(() => {
        return trips.reduce((acc, curr) => ({
            distance: acc.distance + curr.distance_km,
            duration: acc.duration + curr.duration_seconds,
            count: acc.count + 1
        }), { distance: 0, duration: 0, count: 0 });
    }, [trips]);

    const sections = useMemo(() => {
        const groups: { [key: string]: { title: string, data: TripPerformance[], totalKm: number, count: number } } = {};

        // Simple filter logic for MVP
        const filtered = trips.filter(t => {
            const date = new Date(t.start_time);
            const diffDays = (Date.now() - date.getTime()) / (1000 * 60 * 60 * 24);
            if (timeFilter === '7d') return diffDays <= 7;
            if (timeFilter === '30d') return diffDays <= 30;
            return true;
        });

        filtered.forEach(trip => {
            const label = formatDateLabel(trip.start_time);
            if (!groups[label]) {
                groups[label] = { title: label, data: [], totalKm: 0, count: 0 };
            }
            groups[label].data.push(trip);
            groups[label].totalKm += trip.distance_km;
            groups[label].count += 1;
        });

        return Object.values(groups);
    }, [trips, timeFilter]);

    return {
        trips,
        refreshing,
        onRefresh,
        formatDuration,
        formatDateLabel,
        totals,
        sections,
        timeFilter,
        setTimeFilter,
        theme
    }
}
