import { api } from '@/src/services/api';
import { useAuthStore } from '@/src/modules/auth/store';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useEffect, useMemo, useState, useCallback } from 'react';

export interface WorkSession {
    id: string;
    start_time: string;
    end_time: string | null;
    start_odometer: string | null;
    end_odometer: string | null;
    status: string;
    total_distance_km: number;
    total_active_seconds: number;
    total_idle_seconds: number;
}

export default function useSessions() {
    const [sessions, setSessions] = useState<WorkSession[]>([]);
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [timeFilter, setTimeFilter] = useState<'7d' | '30d' | 'all'>('7d');
    const { user } = useAuthStore();
    const colorScheme = useColorScheme() ?? 'light';
    const theme = Colors[colorScheme];

    const loadSessions = useCallback(async (isRefreshing = false) => {
        if (!user) return;
        
        if (isRefreshing) setRefreshing(true);
        else setLoading(true);

        try {
            const response = await api.get(`/sessions/v1/user/${user.id}`);
            if (response.data.success && Array.isArray(response.data.data)) {
                setSessions(response.data.data);
            }
        } catch (e) {
            console.error('Failed to load sessions from API', e);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [user]);

    useEffect(() => {
        loadSessions();
    }, [loadSessions]);

    const onRefresh = () => loadSessions(true);

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
        return sessions.reduce((acc, curr) => ({
            distance: acc.distance + (curr.total_distance_km || 0),
            duration: acc.duration + (curr.total_active_seconds || 0),
            count: acc.count + 1
        }), { distance: 0, duration: 0, count: 0 });
    }, [sessions]);

    const sections = useMemo(() => {
        const groups: { [key: string]: { title: string, data: WorkSession[], totalKm: number, count: number } } = {};

        const filtered = sessions.filter(s => {
            const date = new Date(s.start_time);
            const diffDays = (Date.now() - date.getTime()) / (1000 * 60 * 60 * 24);
            if (timeFilter === '7d') return diffDays <= 7;
            if (timeFilter === '30d') return diffDays <= 30;
            return true;
        });

        filtered.forEach(session => {
            const label = formatDateLabel(session.start_time);
            if (!groups[label]) {
                groups[label] = { title: label, data: [], totalKm: 0, count: 0 };
            }
            groups[label].data.push(session);
            groups[label].totalKm += (session.total_distance_km || 0);
            groups[label].count += 1;
        });

        return Object.values(groups);
    }, [sessions, timeFilter]);

    return {
        sessions,
        loading,
        refreshing,
        onRefresh,
        totals,
        sections,
        timeFilter,
        setTimeFilter,
        theme
    };
}
