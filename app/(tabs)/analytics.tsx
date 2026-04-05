import { SecondaryScreen } from '@/src/screens/shared/SecondaryScreen';

export default function AnalyticsScreen() {
  return (
    <SecondaryScreen
      title="Analytics"
      subtitle="Espaço para visão profunda de operação, produtividade e jornadas."
      icon="analytics-outline"
      bullets={[
        'Comparativos por turno, dia e faixa horária.',
        'Eficiência de rotas e tempo ocioso.',
        'Base pronta para gráficos mais avançados e filtros.',
      ]}
    />
  );
}
