import { SecondaryScreen } from '@/src/screens/shared/SecondaryScreen';

export default function MaintenanceScreen() {
  return (
    <SecondaryScreen
      title="Manutenção"
      subtitle="Controle operacional de serviços, peças e agenda preventiva."
      icon="construct-outline"
      bullets={[
        'Histórico de revisões e despesas.',
        'Lembretes preventivos por quilometragem.',
        'Integração futura com custos do veículo.',
      ]}
    />
  );
}
