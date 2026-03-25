import { fuelLogsService, FuelLog, FuelType } from '@/src/services/fuelLogs.service';
import { useSessionStore } from '@/src/modules/sessions/store';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, Animated, LayoutAnimation } from 'react-native';

export default function useFuelsScreen() {
  const { activeSession } = useSessionStore();

  const [fuelLogs, setFuelLogs] = useState<FuelLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formExpanded, setFormExpanded] = useState(false);

  // Filters state
  const [typeFilter, setTypeFilter] = useState<FuelType | ''>('');
  const [dateFilter, setDateFilter] = useState('');

  // Creation state
  const [amount, setAmount] = useState('');
  const [liters, setLiters] = useState('');
  const [pricePerLiter, setPricePerLiter] = useState('');
  const [odometer, setOdometer] = useState('');
  const [description, setDescription] = useState('');
  const [gasStation, setGasStation] = useState('');
  const [dateCompetition, setDateCompetition] = useState(new Date().toISOString().split('T')[0]);
  const [type, setType] = useState<FuelType>('gasoline');

  // Edit state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editAmount, setEditAmount] = useState('');
  const [editLiters, setEditLiters] = useState('');
  const [editPricePerLiter, setEditPricePerLiter] = useState('');
  const [editOdometer, setEditOdometer] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editGasStation, setEditGasStation] = useState('');
  const [editDateCompetition, setEditDateCompetition] = useState('');
  const [editType, setEditType] = useState<FuelType>('gasoline');

  const rotateAnim = useRef(new Animated.Value(0)).current;

  // Auto-calculate Total (Amount) for Creation
  useEffect(() => {
    if (pricePerLiter && liters && !amount.trim()) {
      const total = (Number(pricePerLiter) * Number(liters)).toFixed(2);
      setAmount(total);
    } else if (pricePerLiter && liters) {
        // Update if already focused or changed
        const total = (Number(pricePerLiter) * Number(liters)).toFixed(2);
        if (total !== amount) setAmount(total);
    }
  }, [pricePerLiter, liters]);

  // Auto-calculate Total (Amount) for Editing
  useEffect(() => {
    if (editingId && editPricePerLiter && editLiters) {
      const total = (Number(editPricePerLiter) * Number(editLiters)).toFixed(2);
      if (total !== editAmount) setEditAmount(total);
    }
  }, [editingId, editPricePerLiter, editLiters]);

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
  }, [dateFilter, typeFilter]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const toggleForm = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    const toExpanded = !formExpanded;
    setFormExpanded(toExpanded);
    Animated.timing(rotateAnim, {
      toValue: toExpanded ? 1 : 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  const handleCreate = async () => {
    if (!amount.trim() || isNaN(Number(amount.trim()))) {
      Alert.alert('Atenção', 'Informe um valor total válido.');
      return;
    }
    if (!liters.trim()) {
      Alert.alert('Atenção', 'Informe a quantidade de litros.');
      return;
    }
    if (!activeSession) {
      Alert.alert('Atenção', 'É necessário uma sessão ativa para registrar abastecimento.');
      return;
    }

    try {
      setSaving(true);
      const created = await fuelLogsService.create({
        amount: Number(amount.trim()),
        liters: liters.trim(),
        pricePerLiter: Number(pricePerLiter.trim()) || 0,
        odometer: odometer.trim(),
        description: description.trim(),
        gasStation: gasStation.trim(),
        type,
        sessionId: activeSession.id,
        dateCompetition: dateCompetition ? new Date(dateCompetition).toISOString() : new Date().toISOString(),
      });
      setFuelLogs(prev => [created, ...prev]);
      // Reset form
      setAmount('');
      setLiters('');
      setPricePerLiter('');
      setOdometer('');
      setDescription('');
      setGasStation('');
      toggleForm();
    } catch (e) {
      Alert.alert('Erro', 'Não foi possível registrar o abastecimento.');
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (item: FuelLog) => {
    setEditingId(item.id);
    setEditAmount(item.amount.toString());
    setEditLiters(item.liters);
    setEditPricePerLiter(item.price_per_liter.toString());
    setEditOdometer(item.odometer);
    setEditDescription(item.description);
    setEditGasStation(item.gas_station);
    setEditDateCompetition(item.date_competition.split('T')[0]);
    setEditType(item.type);
  };

  const handleUpdate = async () => {
    if (!editingId || !activeSession) return;
    
    try {
      setSaving(true);
      const updated = await fuelLogsService.update(editingId, {
        amount: Number(editAmount),
        liters: editLiters,
        pricePerLiter: Number(editPricePerLiter),
        odometer: editOdometer,
        description: editDescription,
        gasStation: editGasStation,
        type: editType,
        sessionId: activeSession.id,
        dateCompetition: new Date(editDateCompetition).toISOString(),
      });
      setFuelLogs(prev => prev.map(log => log.id === editingId ? updated : log));
      setEditingId(null);
    } catch (e) {
      Alert.alert('Erro', 'Não foi possível atualizar o registro.');
    } finally {
      setSaving(false);
    }
  };

  return {
    activeSession,
    fuelLogs,
    loading,
    saving,
    formExpanded,
    typeFilter,
    setTypeFilter,
    dateFilter,
    setDateFilter,
    
    // Form state
    amount, setAmount,
    liters, setLiters,
    pricePerLiter, setPricePerLiter,
    odometer, setOdometer,
    description, setDescription,
    gasStation, setGasStation,
    dateCompetition, setDateCompetition,
    type, setType,

    // Edit state
    editingId, setEditingId,
    editAmount, setEditAmount,
    editLiters, setEditLiters,
    editPricePerLiter, setEditPricePerLiter,
    editOdometer, setEditOdometer,
    editDescription, setEditDescription,
    editGasStation, setEditGasStation,
    editDateCompetition, setEditDateCompetition,
    editType, setEditType,

    rotateAnim,
    toggleForm,
    handleCreate,
    handleUpdate,
    startEdit
  };
}
