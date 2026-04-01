import React from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Button } from '../../ui/button';

interface FuelFormProps {
  initialData?: any;
  onSubmit: (data: any) => void;
  onCancel?: () => void;
  loading?: boolean;
  theme: any;
  brandColor: string;
}

export const FuelForm = ({
  initialData,
  onSubmit,
  onCancel,
  loading,
  theme,
  brandColor
}: FuelFormProps) => {
  const [formData, setFormData] = React.useState({
    amount: initialData?.amount?.toString() || '',
    liters: initialData?.liters?.toString() || '',
    price_per_liter: initialData?.price_per_liter?.toString() || '',
    odometer: initialData?.odometer?.toString() || '',
    gas_station: initialData?.gas_station || '',
    date_competition: initialData?.date_competition || new Date().toISOString().split('T')[0],
    type: initialData?.type || 'gasoline',
    description: initialData?.description || ''
  });

  const updateField = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const isEditing = !!initialData;
  const isDark = theme.text === '#FFFFFF'; // Simple detection
  
  const inputBg = isDark ? '#2a2a2a' : '#f3f4f6';
  const textColor = theme.text;
  const labelColor = isDark ? '#9ca3af' : '#6b7280';

  return (
    <View style={styles.container}>
      {isEditing && (
        <Text style={[styles.editHint, { color: brandColor }]}>Editando Abastecimento</Text>
      )}

      <View style={styles.row}>
        <View style={styles.field}>
          <Text style={[styles.label, { color: labelColor }]}>R$/Litro</Text>
          <TextInput
            value={formData.price_per_liter}
            onChangeText={(v) => updateField('price_per_liter', v)}
            style={[styles.input, { backgroundColor: inputBg, color: textColor }]}
            placeholder="0.00"
            keyboardType="numeric"
            placeholderTextColor={isDark ? '#555' : '#ccc'}
          />
        </View>
        <View style={styles.field}>
          <Text style={[styles.label, { color: labelColor }]}>Litros</Text>
          <TextInput
            value={formData.liters}
            onChangeText={(v) => updateField('liters', v)}
            style={[styles.input, { backgroundColor: inputBg, color: textColor }]}
            placeholder="0.00"
            keyboardType="numeric"
            placeholderTextColor={isDark ? '#555' : '#ccc'}
          />
        </View>
        <View style={styles.field}>
          <Text style={[styles.label, { color: labelColor }]}>Total R$</Text>
          <TextInput
            value={formData.amount}
            onChangeText={(v) => updateField('amount', v)}
            style={[styles.input, { fontWeight: '700', backgroundColor: inputBg, color: textColor }]}
            placeholder="0.00"
            keyboardType="numeric"
            placeholderTextColor={isDark ? '#555' : '#ccc'}
          />
        </View>
      </View>

      <View style={styles.row}>
        <View style={styles.field}>
          <Text style={[styles.label, { color: labelColor }]}>Odômetro</Text>
          <TextInput
            value={formData.odometer}
            onChangeText={(v) => updateField('odometer', v)}
            style={[styles.input, { backgroundColor: inputBg, color: textColor }]}
            placeholder="Km atual"
            keyboardType="numeric"
            placeholderTextColor={isDark ? '#555' : '#ccc'}
          />
        </View>
        <View style={[styles.field, { flex: 1.5 }]}>
          <Text style={[styles.label, { color: labelColor }]}>Posto</Text>
          <TextInput
            value={formData.gas_station}
            onChangeText={(v) => updateField('gas_station', v)}
            style={[styles.input, { backgroundColor: inputBg, color: textColor }]}
            placeholder="Ex: Ipiranga"
            placeholderTextColor={isDark ? '#555' : '#ccc'}
          />
        </View>
      </View>

      <View style={styles.row}>
        <View style={styles.field}>
          <Text style={[styles.label, { color: labelColor }]}>Data</Text>
          <TextInput
            value={formData.date_competition}
            onChangeText={(v) => updateField('date_competition', v)}
            style={[styles.input, { backgroundColor: inputBg, color: textColor }]}
            placeholder="AAAA-MM-DD"
            placeholderTextColor={isDark ? '#555' : '#ccc'}
          />
        </View>
        <View style={styles.field}>
          <Text style={[styles.label, { color: labelColor }]}>Combustível</Text>
          <View style={[styles.typeToggle, { backgroundColor: inputBg }]}>
            <TouchableOpacity
              onPress={() => updateField('type', 'gasoline')}
              style={[styles.typeOption, formData.type === 'gasoline' && { backgroundColor: brandColor }]}
            >
              <Text style={[styles.typeText, formData.type === 'gasoline' ? { color: '#fff' } : { color: labelColor }]}>GAS</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => updateField('type', 'Ethanol')}
              style={[styles.typeOption, formData.type === 'Ethanol' && { backgroundColor: brandColor }]}
            >
              <Text style={[styles.typeText, formData.type === 'Ethanol' ? { color: '#fff' } : { color: labelColor }]}>ETA</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <View style={styles.actions}>
        <Button
          title={isEditing ? "Salvar Alterações" : "Confirmar Abastecimento"}
          onPress={() => onSubmit(formData)}
          loading={loading}
          style={[styles.submitBtn, { backgroundColor: brandColor }]}
        />
        {onCancel && (
          <TouchableOpacity
            onPress={onCancel}
            style={[styles.cancelBtn, { borderColor: isDark ? '#444' : '#e0e0e0', borderWidth: 1 }]}
          >
            <Text style={{ color: textColor, fontWeight: '600', fontSize: 13 }}>Cancelar</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 14,
    paddingVertical: 10,
  },
  editHint: {
    fontSize: 11,
    fontWeight: '800',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  field: {
    flex: 1,
  },
  label: {
    fontSize: 10,
    marginBottom: 6,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  input: {
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 44,
    fontSize: 15,
  },
  typeToggle: {
    flexDirection: 'row',
    borderRadius: 10,
    height: 44,
    overflow: 'hidden',
  },
  typeOption: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  typeText: {
    fontSize: 11,
    fontWeight: '800',
  },
  actions: {
    flexDirection: 'row',
    marginTop: 10,
    gap: 10,
  },
  submitBtn: {
    flex: 2,
    height: 48,
    borderRadius: 12,
  },
  cancelBtn: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
