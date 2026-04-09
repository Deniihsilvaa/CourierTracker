import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { deleteSessionOnApi, listSessions, updateSessionOnApi } from '@/src/modules/sessions/service';
import { useSessionStore } from '@/src/modules/sessions/store';
import { UpdateSessionPayload, WorkSession } from '@/src/modules/sessions/type';
import { FormatDateLabel } from '@/src/utils/format';
import { useCallback, useEffect, useMemo } from 'react';



export default function useSessions() {
    const {
        history: sessions,
        loading,
        refreshing,
        timeFilter,
        setTimeFilter
    } = useSessionStore();

    const colorScheme = useColorScheme() ?? 'light';
    const theme = Colors[colorScheme];

    const onRefresh = useCallback(() => {
        listSessions(true);
    }, []);

    useEffect(() => {
        listSessions();
    }, []);

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

        filtered.sort((a, b) => new Date(b.start_time).getTime() - new Date(a.start_time).getTime());

        filtered.forEach(session => {
            const label = FormatDateLabel(session.start_time);
            if (!groups[label]) {
                groups[label] = { title: label, data: [], totalKm: 0, count: 0 };
            }
            groups[label].data.push(session as unknown as WorkSession);
            groups[label].totalKm += (session.total_distance_km || 0);
            groups[label].count += 1;
        });

        return Object.values(groups);
    }, [sessions, timeFilter]);

    const deleteSession = useCallback(async (sessionId: string) => {
        try {
            const response = await deleteSessionOnApi(sessionId);
            if (response) {
                listSessions(); // Refresh history
            }
            return response;
        } catch (error) {
            console.error('[Session Hook] Failed to delete session', error);
            return null;
        }
    }, []);

    const updateSession = useCallback(async (sessionId: string, payload: UpdateSessionPayload) => {
        try {

            const response = await updateSessionOnApi(sessionId, payload);
            if (response) {
                listSessions(); // Refresh history
            }
            return response;
        } catch (error) {
            console.error('[Session Hook] Failed to update session', error);
            return null;
        }
    }, []);

    return {
        sessions,
        loading,
        refreshing,
        onRefresh,
        totals,
        sections,
        timeFilter,
        setTimeFilter,
        theme,
        deleteSession,
        updateSession
    };
}
