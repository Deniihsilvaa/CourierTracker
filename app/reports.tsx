import { SecondaryScreen } from '@/src/screens/shared/SecondaryScreen';

export default function ReportsScreen() {
  return (
    <SecondaryScreen
      title="Relatórios"
      subtitle="Exportações e recortes gerenciais preparados para crescer."
      icon="document-text-outline"
      bullets={[
        'Resumo financeiro por período.',
        'Consolidação de turnos e rotas.',
        'Formato preparado para PDF e planilhas.',
      ]}
    />
  );
}
