export interface FormartDurationProps {
    seconds: number;
    format: 'short' | 'long';
}

export const FormatCurrency = (value: number): string => {
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
};

/**
 * Formata o tempo em segundos para o formato de horas e minutos
 * @param seconds - O tempo em segundos
 * @param format - O formato de saída 'short' ou 'long': short = 1h 30m, long = 1 hora e 30 minutos
 * @returns O tempo formatado
 */
export const FormatDuration = ({ seconds, format }: FormartDurationProps): string => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    if (format === 'short') {
        if (h > 0) return `${h}h ${m}m`;
        return `${m}m`;
    }
    if (format === 'long') {
        if (h > 0) return `${h} horas e ${m} minutos`;
        return `${m} minutos`;
    }
    return `${seconds} segundos`;
  };

  /**
   * Formata a data para o formato de data e hora
   * @param dateStr - A data em string
   * @returns A data formatada
   */
  export const FormatDateLabel = (dateStr: string): string => {
    const date = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);

    if (date.toDateString() === today.toDateString()) return 'Hoje';
    if (date.toDateString() === yesterday.toDateString()) return 'Ontem';

    return date.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: 'long',
        year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined
    });
};