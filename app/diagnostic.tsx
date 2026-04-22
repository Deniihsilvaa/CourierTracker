
import DiagnosticRow from '@/src/components/Diagnostic/DiagnosticRow';
import { useDiagnostic } from '@/src/hooks/useDiagnostic';
import { stylesDiagnostic } from '@/src/styles';
import { Ionicons } from '@expo/vector-icons';
import { Stack } from 'expo-router';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';

export default function DiagnosticScreen() {
  const { runDiagnostic, results, isScanning, theme, router } = useDiagnostic();


  return (
    <View style={[stylesDiagnostic.container, { backgroundColor: theme.background }]}>
      <Stack.Screen options={{ title: 'System Check', headerShown: true, headerTintColor: theme.text, headerStyle: { backgroundColor: theme.background } }} />

      <ScrollView contentContainerStyle={stylesDiagnostic.content}>
        <View style={stylesDiagnostic.header}>
          <Ionicons name="shield-checkmark" size={80} color={theme.tint} />
          <Text style={stylesDiagnostic.title}>Diagnóstico de Operação</Text>
          <Text style={stylesDiagnostic.subtitle}>Verificando integridade dos protocolos de rastreamento</Text>
        </View>

        <View style={stylesDiagnostic.scanContainer}>
          <DiagnosticRow label="Permissão GPS (App Aberto)" status={results.gpsForeground} />
          <DiagnosticRow label="Permissão GPS (Background)" status={results.gpsBackground} />
          <DiagnosticRow label="Protocolo de Notificações" status={results.notifications} />
          <DiagnosticRow label="Conectividade de Rede" status={results.network} />
          <DiagnosticRow
            label="Token Mapbox (Busca)"
            status={results.mapboxToken}
            sublabel={results.mapboxToken === 'error' ? 'Variável EXPO_PUBLIC_MAPBOX_TOKEN não encontrada' : 'Configurado'}
          />
          <DiagnosticRow label="Otimização de Bateria" status={results.battery} sublabel="Recomendado: Não Otimizado" />
        </View>

        {results.battery === 'warning' && (
          <View style={stylesDiagnostic.warningBox}>
            <Ionicons name="information-circle" size={20} color="#FF9800" />
            <Text style={stylesDiagnostic.warningText}>
              Atenção: O Android pode suspender o rastreamento para economizar bateria.
              Vá em configurações e desative a otimização para este app.
            </Text>
          </View>
        )}
      </ScrollView>

      <View style={stylesDiagnostic.footer}>
        <TouchableOpacity
          style={[stylesDiagnostic.scanButton, isScanning && stylesDiagnostic.disabledButton]}
          onPress={runDiagnostic}
          disabled={isScanning}
        >
          <Text style={stylesDiagnostic.scanButtonText}>
            {isScanning ? 'ANALISANDO...' : 'INICIAR VARREDURA'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );


}

