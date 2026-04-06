import { fuelLogsService, FuelLog, FuelType } from '@/src/services/fuelLogs.service';
import { useSessionStore } from '@/src/modules/sessions/store';
import { useAnalyticsStore } from '@/src/modules/analytics/store';
import { listSessions } from '@/src/modules/sessions/service';
import { useCallback, useEffect, useState } from 'react';
import { Alert } from 'react-native';
import { useBaseCrud } from './useBaseCrud';

export default function useFuelsScreen() {
  const { activeSession, history } = useSessionStore();
  const {
      loading, setLoading,
      saving, setSaving,
      formExpanded, toggleForm,
      rotateAnim,
      editingId, setEditingId,
      startEditBase
  } = useBaseCrud();

  const [fuelLogs, setFuelLogs] = useState<FuelLog[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState('');

  // Filters state
  const [typeFilter, setTypeFilter] = useState<FuelType | ''>('');
  const [dateFilter, setDateFilter] = useState('');

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const data = await fuelLogsService.list({ 
        date: dateFilter || undefined,
        type: typeFilter || undefined
      });
      setFuelLogs(data);
    } catch (e) {
      console.warn('[Fuels] LoadData failed', e);
    } finally {
      setLoading(false);
    }
  }, [dateFilter, typeFilter, setLoading]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    void listSessions();
  }, []);

  useEffect(() => {
    if (!selectedSessionId) {
      const preferredSessionId = activeSession?.id || history[0]?.id || '';
      if (preferredSessionId) {
        setSelectedSessionId(preferredSessionId);
      }
    }
  }, [activeSession?.id, history, selectedSessionId]);

  const handleCreate = async (data: any) => {
    if (!data.amount || isNaN(Number(data.amount))) {
      Alert.alert('Atenção', 'Informe um valor total válido.');
      return;
    }
    if (!data.liters) {
      Alert.alert('Atenção', 'Informe a quantidade de litros.');
      return;
    }
    
    const sessionIdToUse = data.sessionId || selectedSessionId;
    
    if (!sessionIdToUse) {
      Alert.alert('Atenção', 'Selecione uma sessão para vincular o abastecimento.');
      return;
    }

    try {
      setSaving(true);
      const created = await fuelLogsService.create({
        amount: Number(data.amount),
        liters: data.liters,
        pricePerLiter: Number(data.price_per_liter) || 0,
        odometer: data.odometer,
        description: data.description || '',
        gasStation: data.gas_station || '',
        type: data.type,
        sessionId: sessionIdToUse,
        dateCompetition: data.date_competition ? new Date(data.date_competition).toISOString() : new Date().toISOString(),
      });
      setFuelLogs(prev => [created, ...prev]);
      toggleForm();
      
      // Refresh dashboard analytics
      useAnalyticsStore.getState().fetchFinancialSummary("month");
    } catch (e) {
      Alert.alert('Erro', 'Não foi possível registrar o abastecimento.');
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (item: FuelLog) => {
    startEditBase(item.id);
  };

  const handleUpdate = async (data: any) => {
    if (!editingId) return;
    
    const sessionIdToUse = data.sessionId || selectedSessionId;
    
    if (!sessionIdToUse) {
      Alert.alert('Atenção', 'Selecione uma sessão para vincular o abastecimento.');
      return;
    }

    try {
      setSaving(true);
      const updated = await fuelLogsService.update(editingId, {
        amount: Number(data.amount),
        liters: data.liters,
        pricePerLiter: Number(data.price_per_liter),
        odometer: data.odometer,
        description: data.description || '',
        gasStation: data.gas_station || '',
        type: data.type,
        sessionId: sessionIdToUse,
        dateCompetition: new Date(data.date_competition).toISOString(),
      });
      setFuelLogs(prev => prev.map(log => log.id === editingId ? updated : log));
      setEditingId(null);
      
      // Refresh dashboard analytics
      useAnalyticsStore.getState().fetchFinancialSummary("month");
    } catch (e) {
      Alert.alert('Erro', 'Não foi possível atualizar o registro.');
    } finally {
      setSaving(false);
    }
  };

  return {
    activeSession,
    sessions: history,
    selectedSessionId,
    setSelectedSessionId,
    fuelLogs,
    loading,
    saving,
    formExpanded,
    typeFilter,
    setTypeFilter,
    dateFilter,
    setDateFilter,
    editingId,
    setEditingId,
    rotateAnim,
    toggleForm,
    handleCreate,
    handleUpdate,
    startEdit
  };
}


