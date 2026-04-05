import { SecondaryScreen } from '@/src/screens/shared/SecondaryScreen';

export default function ExportDataScreen() {
  return (
    <SecondaryScreen
      title="Exportar dados"
      subtitle="Saída estruturada para auditoria, contador e controle próprio."
      icon="download-outline"
      bullets={[
        'Exportação de turnos, rotas e lançamentos.',
        'Preparado para CSV e JSON.',
        'Fluxo pensado para operação offline-first.',
      ]}
    />
  );
}
