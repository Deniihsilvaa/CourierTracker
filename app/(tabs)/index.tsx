import useDashboardScreen from '@/src/hooks/useDashboardScreen';
import { stylesDashboard } from '@/src/styles';
import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { FloatingActionMenu } from '@/src/components/FloatingActionMenu';

export default function DashboardScreen() {
  const {
    user,
    isTracking,
    isSyncing,
    pendingCount,
    theme,
    handleManualSync,
    handleToggleTracking,
    activeSession,

    // Extracted logic
    sessionData,
    loadingSession,
    sessionTime,
    odometer,
    setOdometer,
    initialOdometer,
    setInitialOdometer,
    isPaused,
    setIsPaused,
    handleSaveOdometer,
    handleStopSession,
    handleDeleteSession,
  } = useDashboardScreen();

  const isDarkMode = theme.background === '#151718';
  const cardBg = isDarkMode ? '#1e1e1e' : '#fff';
  const borderColor = isDarkMode ? '#333' : '#e0e0e0';

  return (
    <View style={[stylesDashboard.container, { backgroundColor: theme.background }]}>
      {/* Header */}
      <View style={stylesDashboard.header}>
        <View>
          <Text style={[stylesDashboard.userName, { color: theme.text }]}>
            {user?.name || user?.email?.split('@')[0]}
          </Text>
        </View>
        <TouchableOpacity
          onPress={handleManualSync}
          style={[stylesDashboard.syncButton, { backgroundColor: isSyncing ? '#e1f5fe' : '#f8f9fa' }]}
        >
          <Ionicons
            name={isSyncing ? "refresh" : (pendingCount > 0 ? "cloud-offline" : "cloud-done")}
            size={20}
            color={isSyncing ? "#007AFF" : (pendingCount > 0 ? "#FFA500" : "#28a745")}
          />
          <Text style={[stylesDashboard.syncText, { color: pendingCount > 0 ? "#FFA500" : "#888" }]}>
            {isSyncing ? "Sinc..." : (pendingCount > 0 ? pendingCount : "OK")}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Floating Banner */}
      {activeSession && (
        <View style={[stylesDashboard.floatingBanner, { backgroundColor: theme.tint }]}>
          <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }}>
            {isTracking ? (
              <ActivityIndicator color="#fff" size="small" style={{ marginRight: 8 }} />
            ) : (
              <Ionicons name="pause-circle" size={24} color="#fff" style={{ marginRight: 8 }} />
            )}
            <View>
              <Text style={stylesDashboard.floatingTitle}>
                {isPaused ? 'Sessão Pausada' : 'Sessão Ativa'}
              </Text>
              <Text style={stylesDashboard.floatingTime}>{sessionTime}</Text>
            </View>
          </View>
          <View style={stylesDashboard.floatingActions}>
            <TouchableOpacity onPress={() => setIsPaused(!isPaused)} style={stylesDashboard.actionButton}>
              <Ionicons name={isPaused ? "play" : "pause"} size={26} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity onPress={handleStopSession} style={stylesDashboard.actionButton}>
              <Ionicons name="stop" size={26} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity onPress={handleDeleteSession} style={stylesDashboard.actionButton}>
              <Ionicons name="trash" size={26} color="#ffebee" />
            </TouchableOpacity>
          </View>
        </View>
      )}

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100, paddingTop: activeSession ? 80 : 0 }}
      >
        {/* Status Card */}
        <View style={[stylesDashboard.card, { backgroundColor: cardBg, borderColor }]}>
          <View style={stylesDashboard.cardHeader}>
            <Ionicons name="time-outline" size={24} color={theme.tint} />
            <Text style={[stylesDashboard.cardTitle, { color: theme.text }]}>Sessão Atual</Text>
          </View>

          {!activeSession ? (
            <View>
              <Text style={[stylesDashboard.cardSubtitle, { color: theme.text + '80', marginBottom: 12 }]}>
                Nenhuma sessão iniciada no momento. Registre seu odômetro inicial (opcional) e inicie a rota.
              </Text>

              <View style={stylesDashboard.inputRow}>
                <Ionicons name="speedometer-outline" size={20} color={theme.text + '80'} style={{ marginRight: 8 }} />
                <TextInput
                  style={[stylesDashboard.input, { color: theme.text, borderColor: isDarkMode ? '#555' : '#ccc', marginBottom: 16 }]}
                  placeholder="Odômetro (Ex: 50000)"
                  placeholderTextColor={theme.text + '50'}
                  keyboardType="numeric"
                  value={initialOdometer}
                  onChangeText={setInitialOdometer}
                />
              </View>

              <TouchableOpacity
                style={[stylesDashboard.startButton, { backgroundColor: theme.tint }]}
                onPress={handleToggleTracking}
              >
                <Ionicons name="location" size={20} color="#fff" style={{ marginRight: 8 }} />
                <Text style={stylesDashboard.startButtonText}>Iniciar Sessão</Text>
              </TouchableOpacity>
            </View>
          ) : loadingSession && !sessionData ? (
            <View style={{ alignItems: 'center', padding: 20 }}>
              <ActivityIndicator size="small" color={theme.tint} />
              <Text style={{ color: theme.text, marginTop: 10 }}>Carregando sessão...</Text>
            </View>
          ) : sessionData ? (
            <View>
              <View style={stylesDashboard.infoRow}>
                <Text style={[stylesDashboard.label, { color: theme.text + '90' }]}>Status:</Text>
                <Text style={[stylesDashboard.value, { color: '#28a745', fontWeight: 'bold' }]}>
                  {isPaused ? 'Pausada' : 'Em andamento'}
                </Text>
              </View>

              <View style={stylesDashboard.infoRow}>
                <Text style={[stylesDashboard.label, { color: theme.text + '90' }]}>Tempo em sessão:</Text>
                <Text style={[stylesDashboard.value, { color: theme.text }]}>{sessionTime}</Text>
              </View>

              {sessionData.start_odometer != null && String(sessionData.start_odometer).trim() !== '' ? (
                <View style={stylesDashboard.infoRow}>
                  <Text style={[stylesDashboard.label, { color: theme.text + '90' }]}>Odômetro inicial:</Text>
                  <Text style={[stylesDashboard.value, { color: theme.text }]}>{sessionData.start_odometer} km</Text>
                </View>
              ) : (
                <View style={[stylesDashboard.odometerContainer, { backgroundColor: isDarkMode ? '#2c2c2c' : '#fff3cd' }]}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                    <Ionicons name="warning" size={18} color="#FFA500" style={{ marginRight: 6 }} />
                    <Text style={[stylesDashboard.alertText, { color: isDarkMode ? '#FFA500' : '#856404' }]}>
                      Odômetro inicial não informado!
                    </Text>
                  </View>
                  <View style={stylesDashboard.inputRow}>
                    <TextInput
                      style={[stylesDashboard.input, { color: theme.text, borderColor: isDarkMode ? '#555' : '#ccc' }]}
                      placeholder="Ex: 50000"
                      placeholderTextColor={theme.text + '50'}
                      keyboardType="numeric"
                      value={odometer}
                      onChangeText={setOdometer}
                    />
                    <TouchableOpacity
                      style={[stylesDashboard.saveButton, { backgroundColor: theme.tint }]}
                      onPress={handleSaveOdometer}
                    >
                      <Text style={stylesDashboard.saveButtonText}>Salvar</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </View>
          ) : (
            <View>
              <View style={stylesDashboard.infoRow}>
                <Text style={[stylesDashboard.label, { color: theme.text + '90' }]}>Status:</Text>
                <Text style={[stylesDashboard.value, { color: theme.tint, fontWeight: 'bold' }]}>
                  {isPaused ? 'Pausada' : 'Em andamento'}
                </Text>
              </View>
              <View style={stylesDashboard.infoRow}>
                <Text style={[stylesDashboard.label, { color: theme.text + '90' }]}>Tempo em sessão:</Text>
                <Text style={[stylesDashboard.value, { color: theme.text }]}>{sessionTime}</Text>
              </View>
              <Text style={[stylesDashboard.cardSubtitle, { color: theme.text + '60' }]}>
                Dados da sessão sendo carregados do servidor...
              </Text>
            </View>
          )}
        </View>

      </ScrollView>

      <FloatingActionMenu onPressItem={(item) => console.log('Selected:', item)} />
    </View>
  );
}

