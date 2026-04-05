import { SecondaryScreen } from '@/src/screens/shared/SecondaryScreen';

export default function HelpScreen() {
  return (
    <SecondaryScreen
      title="Ajuda"
      subtitle="Suporte ao motorista, permissões e resolução rápida de problemas."
      icon="help-circle-outline"
      bullets={[
        'Guia de permissões e bateria.',
        'Fluxos de sessão, rotas e sincronização.',
        'Canal pronto para FAQ e suporte contextual.',
      ]}
    />
  );
}
