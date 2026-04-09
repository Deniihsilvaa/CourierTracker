import { PrimaryButton } from "@/components/buttons/primary-button";
import { GlassCard } from "@/components/cards/glass-card";
import { appColors, spacing } from "@/src/theme/colors";
import { combineDateAndTime, formatDisplayDate, formatDisplayTime, isValidSessionInterval, parseISODate } from "@/src/utils/date";
import { FormatDuration } from "@/src/utils/format";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker, { DateTimePickerEvent } from "@react-native-community/datetimepicker";
import React, { useEffect, useState } from "react";
import { Modal, Platform, Text, TextInput, TouchableOpacity, View } from "react-native";
import { stylesEditSessionModal } from "../style";
import { EditSessionModalProps, UpdateSessionPayload } from "../type";
import { SessionMetric } from "./SessionMetric";

export function EditSessionModal({ visible, session, onClose, onSave, isUpdating }: EditSessionModalProps) {
  const [step, setStep] = useState(1);
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  const [startOdometer, setStartOdometer] = useState("");
  const [endOdometer, setEndOdometer] = useState("");
  const [showPicker, setShowPicker] = useState<{ field: 'start' | 'end', mode: 'date' | 'time' } | null>(null);
  const [timeError, setTimeError] = useState<string | null>(null);

  useEffect(() => {
    if (session) {
      setStartDate(parseISODate(session.start_time));
      setEndDate(parseISODate(session.end_time || session.start_time));
      setStartOdometer(String(session.start_odometer || ""));
      setEndOdometer(String(session.end_odometer || ""));
      setStep(1);
      setTimeError(null);
    }
  }, [session, visible]);

  if (!session) return null;

  const handleNext = () => {
    if (step === 2) {
      if (!isValidSessionInterval(startDate, endDate)) {
        setTimeError("O horário de fim deve ser posterior ao de início.");
        return;
      }
      setTimeError(null);
    }
    setStep(prev => prev + 1);
  };

  const handleBack = () => setStep(prev => prev - 1);

  const handleConfirm = () => {
    if (!isValidSessionInterval(startDate, endDate)) {
      setStep(2);
      setTimeError("O horário de fim deve ser posterior ao de início.");
      return;
    }

    const payload: UpdateSessionPayload = {
      start_time: startDate.toISOString(),
      end_time: endDate.toISOString(),
      start_odometer: Number(startOdometer) || 0,
      end_odometer: Number(endOdometer) || 0,
    };
    onSave(payload);
  };

  const onPickerChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowPicker(null);
    }

    if (event.type === 'set' && selectedDate) {
      if (showPicker?.field === 'start') {
        if (showPicker.mode === 'date') {
          setStartDate(combineDateAndTime(selectedDate, startDate));
        } else {
          setStartDate(combineDateAndTime(startDate, selectedDate));
        }
      } else if (showPicker?.field === 'end') {
        if (showPicker.mode === 'date') {
          setEndDate(combineDateAndTime(selectedDate, endDate));
        } else {
          setEndDate(combineDateAndTime(endDate, selectedDate));
        }
      }
      setTimeError(null);
    }
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <View style={{ gap: spacing.xl, paddingVertical: spacing.md }}>
            <View style={{ alignItems: 'center' }}>
              <View style={stylesEditSessionModal.iconContainer}>
                <Ionicons name="stats-chart" size={32} color={appColors.primary} />
              </View>
              <Text style={stylesEditSessionModal.stepTitle}>Resumo da Sessão</Text>
              <Text style={stylesEditSessionModal.stepSubtitle}>Confira os dados coletados antes de editar</Text>
            </View>

            <View style={{ gap: spacing.xl }}>
              <View style={stylesEditSessionModal.metricRow}>
                <SessionMetric
                  label="Duração Ativa"
                  value={FormatDuration({ seconds: session.total_active_seconds || 0, format: "short" })}
                  icon="time-outline"
                />
              </View>
              <View style={stylesEditSessionModal.metricRow}>
                <SessionMetric
                  label="Distância Total"
                  value={`${(session.total_distance_km || 0).toFixed(1)} km`}
                  icon="navigate-outline"
                />
              </View>
            </View>

            <View style={{ marginTop: spacing.md }}>
              <PrimaryButton label="Continuar para Tempos" onPress={handleNext} variant="primary" />
            </View>
          </View>
        );
      case 2:
        return (
          <View style={{ flexDirection: "column", gap: spacing.xxl }}>
            <View>
              <Text style={stylesEditSessionModal.stepTitle}>Ajustar Horários</Text>
              <Text style={stylesEditSessionModal.stepSubtitle}>Defina o período exato de trabalho</Text>
            </View>

            <View style={{ gap: spacing.md }}>
              <View style={{ gap: spacing.xs }}>
                <Text style={stylesEditSessionModal.label}>Horário de Início</Text>
                <View style={stylesEditSessionModal.dateTimeRow}>
                  <TouchableOpacity
                    style={stylesEditSessionModal.pickerTrigger}
                    onPress={() => setShowPicker({ field: 'start', mode: 'date' })}
                  >
                    <Ionicons name="calendar-outline" size={20} color={appColors.primary} />
                    <Text style={stylesEditSessionModal.pickerText}>{formatDisplayDate(startDate)}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={stylesEditSessionModal.pickerTrigger}
                    onPress={() => setShowPicker({ field: 'start', mode: 'time' })}
                  >
                    <Ionicons name="time-outline" size={20} color={appColors.primary} />
                    <Text style={stylesEditSessionModal.pickerText}>{formatDisplayTime(startDate)}</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={{ gap: spacing.xs }}>
                <Text style={stylesEditSessionModal.label}>Horário de Fim</Text>
                <View style={stylesEditSessionModal.dateTimeRow}>
                  <TouchableOpacity
                    style={stylesEditSessionModal.pickerTrigger}
                    onPress={() => setShowPicker({ field: 'end', mode: 'date' })}
                  >
                    <Ionicons name="calendar-outline" size={20} color={appColors.primary} />
                    <Text style={stylesEditSessionModal.pickerText}>{formatDisplayDate(endDate)}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={stylesEditSessionModal.pickerTrigger}
                    onPress={() => setShowPicker({ field: 'end', mode: 'time' })}
                  >
                    <Ionicons name="time-outline" size={20} color={appColors.primary} />
                    <Text style={stylesEditSessionModal.pickerText}>{formatDisplayTime(endDate)}</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {timeError && (
                <View style={stylesEditSessionModal.errorContainer}>
                  <Ionicons name="alert-circle" size={16} color={appColors.danger} />
                  <Text style={stylesEditSessionModal.errorText}>{timeError}</Text>
                </View>
              )}
            </View>

            <View style={stylesEditSessionModal.footer}>
              <TouchableOpacity onPress={handleBack} style={stylesEditSessionModal.backButton}>
                <Text style={{ color: appColors.textSecondary, fontWeight: '600' }}>Voltar</Text>
              </TouchableOpacity>
              <View style={{ flex: 1 }}>
                <PrimaryButton label="Próximo: Odômetros" onPress={handleNext} />
              </View>
            </View>
          </View>
        );
      case 3:
        return (
          <View style={{ gap: spacing.lg }}>
            <View>
              <Text style={stylesEditSessionModal.stepTitle}>Ajustar Odômetros</Text>
              <Text style={stylesEditSessionModal.stepSubtitle}>Verifique os valores do velocímetro</Text>
            </View>

            <View style={{ gap: spacing.md }}>
              <View style={{ gap: spacing.xs }}>
                <Text style={stylesEditSessionModal.label}>Odômetro Inicial (km)</Text>
                <TextInput
                  style={stylesEditSessionModal.input}
                  value={startOdometer}
                  onChangeText={setStartOdometer}
                  keyboardType="numeric"
                  placeholder="0"
                  placeholderTextColor={appColors.textMuted}
                />
              </View>

              <View style={{ gap: spacing.xs }}>
                <Text style={stylesEditSessionModal.label}>Odômetro Final (km)</Text>
                <TextInput
                  style={stylesEditSessionModal.input}
                  value={endOdometer}
                  onChangeText={setEndOdometer}
                  keyboardType="numeric"
                  placeholder="0"
                  placeholderTextColor={appColors.textMuted}
                />
              </View>
            </View>

            <View style={stylesEditSessionModal.footer}>
              <TouchableOpacity onPress={handleBack} style={stylesEditSessionModal.backButton}>
                <Text style={{ color: appColors.textSecondary, fontWeight: '600' }}>Voltar</Text>
              </TouchableOpacity>
              <View style={{ flex: 1 }}>
                <PrimaryButton
                  label={isUpdating ? "Salvando..." : "Salvar Alterações"}
                  onPress={handleConfirm}
                  loading={isUpdating}
                />
              </View>
            </View>
          </View>
        );
      default:
        return null;
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={stylesEditSessionModal.modalOverlay}>
        <GlassCard style={stylesEditSessionModal.card}>
          <View style={stylesEditSessionModal.header}>
            <View style={stylesEditSessionModal.stepIndicatorContainer}>
              {[1, 2, 3].map(i => (
                <View
                  key={i}
                  style={[
                    stylesEditSessionModal.stepIndicator,
                    { backgroundColor: i <= step ? appColors.primary : 'rgba(255,255,255,0.1)' }
                  ]}
                />
              ))}
            </View>
            <TouchableOpacity onPress={onClose} hitSlop={10} style={stylesEditSessionModal.closeButton}>
              <Ionicons name="close" size={24} color={appColors.textSecondary} />
            </TouchableOpacity>
          </View>

          {renderStep()}

          {showPicker && (
            <DateTimePicker
              value={showPicker.field === 'start' ? startDate : endDate}
              mode={showPicker.mode}
              is24Hour={true}
              display="default"
              onChange={onPickerChange}
            />
          )}
        </GlassCard>
      </View>
    </Modal>
  );
}

