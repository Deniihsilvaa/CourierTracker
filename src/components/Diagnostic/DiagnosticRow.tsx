
import { stylesDiagnostic } from '@/src/styles';
import { Ionicons } from '@expo/vector-icons';
import { Text, View } from 'react-native';

export default function DiagnosticRow({ label, status, sublabel }: any) {
    const StatusIcon = ({ status }: { status: string }) => {
        if (status === 'loading') return <Ionicons name="sync" size={20} color="#007AFF" />;
        if (status === 'success') return <Ionicons name="checkmark-circle" size={24} color="#4CAF50" />;
        if (status === 'error') return <Ionicons name="close-circle" size={24} color="#FF3B30" />;
        if (status === 'warning') return <Ionicons name="warning" size={24} color="#FF9800" />;
        return <Ionicons name="ellipse-outline" size={24} color="#ccc" />;
    };
    return (
        <View style={stylesDiagnostic.row}>
            <View style={stylesDiagnostic.rowInfo}>
                <Text style={stylesDiagnostic.rowLabel}>{label}</Text>
                {sublabel && <Text style={stylesDiagnostic.rowSublabel}>{sublabel}</Text>}
            </View>
            <StatusIcon status={status} />
        </View>
    );
}