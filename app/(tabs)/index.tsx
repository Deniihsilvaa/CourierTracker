import { LocationDisclosureModal } from '@/src/components/LocationDisclosureModal';
import useDashboardScreen from '@/src/hooks/useDashboardScreen';
import { stylesDashboard } from '@/src/styles';
import { Ionicons } from '@expo/vector-icons';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';

export default function DashboardScreen() {
  const { user, isTracking, currentLocation, isSyncing, pendingCount, showDisclosure, theme, pulseAnim, handleManualSync, handleToggleTracking, confirmTracking, handleRouteEvent, formatTime, setShowDisclosure, activeSession, } = useDashboardScreen();

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

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Status Card */}



      </ScrollView>


      <LocationDisclosureModal
        visible={showDisclosure}
        onConfirm={confirmTracking}
        onCancel={() => setShowDisclosure(false)}
      />
    </View>
  );
}

