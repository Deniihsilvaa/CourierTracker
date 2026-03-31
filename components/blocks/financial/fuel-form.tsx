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

  return (
    <View style={styles.container}>
      {isEditing && (
        <Text style={[styles.editHint, { color: brandColor }]}>Editando Abastecimento</Text>
      )}

      <View style={styles.row}>
        <View style={styles.field}>
          <Text style={styles.label}>R$/Litro</Text>
          <TextInput
            value={formData.price_per_liter}
            onChangeText={(v) => updateField('price_per_liter', v)}
            style={[styles.input]}
            placeholder="0.00"
            keyboardType="numeric"
          />
        </View>
        <View style={styles.field}>
          <Text style={styles.label}>Litros</Text>
          <TextInput
            value={formData.liters}
            onChangeText={(v) => updateField('liters', v)}
            style={styles.input}
            placeholder="0.00"
            keyboardType="numeric"
          />
        </View>
        <View style={styles.field}>
          <Text style={styles.label}>Total R$</Text>
          <TextInput
            value={formData.amount}
            onChangeText={(v) => updateField('amount', v)}
            style={[styles.input, { fontWeight: '700' }]}
            placeholder="0.00"
            keyboardType="numeric"
          />
        </View>
      </View>

      <View style={styles.row}>
        <View style={styles.field}>
          <Text style={styles.label}>Odômetro</Text>
          <TextInput
            value={formData.odometer}
            onChangeText={(v) => updateField('odometer', v)}
            style={[styles.input]}
            placeholder="Km atual"
            keyboardType="numeric"
          />
        </View>
        <View style={[styles.field, { flex: 1.5 }]}>
          <Text style={styles.label}>Posto</Text>
          <TextInput
            value={formData.gas_station}
            onChangeText={(v) => updateField('gas_station', v)}
            style={[styles.input]}
            placeholder="Ex: Ipiranga"
          />
        </View>
      </View>

      <View style={styles.row}>
        <View style={styles.field}>
          <Text style={styles.label}>Data</Text>
          <TextInput
            value={formData.date_competition}
            onChangeText={(v) => updateField('date_competition', v)}
            style={[styles.input]}
            placeholder="AAAA-MM-DD"
          />
        </View>
        <View style={styles.field}>
          <Text style={styles.label}>Combustível</Text>
          <View style={styles.typeToggle}>
            <TouchableOpacity
              onPress={() => updateField('type', 'gasoline')}
              style={[styles.typeOption, formData.type === 'gasoline' && { backgroundColor: brandColor }]}
            >
              <Text style={[styles.typeText, formData.type === 'gasoline' && { color: '#fff' }]}>GAS</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => updateField('type', 'Ethanol')}
              style={[styles.typeOption, formData.type === 'Ethanol' && { backgroundColor: brandColor }]}
            >
              <Text style={[styles.typeText, formData.type === 'Ethanol' && { color: '#fff' }]}>ETA</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <View style={styles.actions}>
        <Button
          title={isEditing ? "Salvar" : "Registrar"}
          onPress={() => onSubmit(formData)}
          loading={loading}
          style={styles.submitBtn}
        />
        {onCancel && (
          <Button
            variant="ghost"
            title="Cancelar"
            onPress={onCancel}
            style={styles.cancelBtn}
          />
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 12,
  },
  textInput: {
    color: 'black',
  },
  editHint: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  row: {
    flexDirection: 'row',
    gap: 10,
  },
  field: {
    flex: 1,
  },
  label: {
    fontSize: 11,
    color: '#6b7280',
    marginBottom: 4,
    fontWeight: '600',
  },
  input: {
    backgroundColor: '#f3f4f6',
    color: 'black',
    borderRadius: 8,
    paddingHorizontal: 10,
    height: 40,
    fontSize: 14,
  },
  typeToggle: {
    flexDirection: 'row',
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    height: 40,
    overflow: 'hidden',
  },
  typeOption: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  typeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#6b7280',
  },
  actions: {
    flexDirection: 'row',
    marginTop: 8,
    gap: 10,
  },
  submitBtn: {
    flex: 2,
  },
  cancelBtn: {
    flex: 1,
  },
});
