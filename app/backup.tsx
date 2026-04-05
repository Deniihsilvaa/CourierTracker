import { SecondaryScreen } from '@/src/screens/shared/SecondaryScreen';

export default function BackupScreen() {
  return (
    <SecondaryScreen
      title="Backup"
      subtitle="Recuperação e proteção de dados locais sensíveis."
      icon="cloud-upload-outline"
      bullets={[
        'Backups manuais e automáticos.',
        'Restauração segura do banco local.',
        'Base pronta para histórico versionado.',
      ]}
    />
  );
}
