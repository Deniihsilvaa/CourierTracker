import { SecondaryScreen } from '@/src/screens/shared/SecondaryScreen';

export default function AboutScreen() {
  return (
    <SecondaryScreen
      title="Sobre o app"
      subtitle="Identidade, versão e posicionamento do produto."
      icon="information-circle-outline"
      bullets={[
        'Aplicativo focado em produtividade do motorista.',
        'UI pensada para operação intensa e leitura rápida.',
        'Arquitetura preparada para evolução de módulos.',
      ]}
    />
  );
}
