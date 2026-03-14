import { StyleSheet } from "react-native";

export const stylesDiagnostic = StyleSheet.create({
    container: { flex: 1 },
    content: { padding: 24 },
    header: { alignItems: 'center', marginBottom: 40, marginTop: 20 },
    title: { color: '#fff', fontSize: 22, fontWeight: 'bold', marginTop: 16 },
    subtitle: { color: '#8e8e93', fontSize: 14, textAlign: 'center', marginTop: 8 },
    scanContainer: { backgroundColor: '#1c1c1e', borderRadius: 20, padding: 20 },
    row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#2c2c2e' },
    rowInfo: { flex: 1 },
    rowLabel: { color: '#fff', fontSize: 15, fontWeight: '500' },
    rowSublabel: { color: '#8e8e93', fontSize: 12, marginTop: 2 },
    warningBox: { backgroundColor: 'rgba(255, 152, 0, 0.1)', padding: 16, borderRadius: 12, marginTop: 24, flexDirection: 'row', gap: 12 },
    warningText: { color: '#FF9800', fontSize: 13, flex: 1, lineHeight: 18 },
    footer: { padding: 24, paddingBottom: 40 },
    scanButton: { backgroundColor: '#007AFF', height: 60, borderRadius: 30, justifyContent: 'center', alignItems: 'center', shadowColor: '#007AFF', shadowOpacity: 0.5, shadowRadius: 15, elevation: 10 },
    disabledButton: { opacity: 0.6 },
    scanButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold', letterSpacing: 1 }
});
