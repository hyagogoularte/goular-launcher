const WEEKDAYS = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
const MONTHS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

const pad = (n: number) => String(n).padStart(2, '0');

/** "23:23" */
export function formatTime(d: Date): string {
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** "Terça, 17 de Nov." — montado à mão para não depender do ICU do WebView. */
export function formatDateLabel(d: Date): string {
  return `${WEEKDAYS[d.getDay()]}, ${d.getDate()} de ${MONTHS[d.getMonth()]}.`;
}

/** Saudação pela hora local. */
export function greetingFor(d: Date): string {
  const h = d.getHours();
  if (h >= 5 && h < 12) return 'Bom dia';
  if (h >= 12 && h < 18) return 'Boa tarde';
  return 'Boa noite';
}

/** Temperatura arredondada com símbolo de grau, ou "--°" quando desconhecida. */
export function formatTemp(t: number | null | undefined): string {
  return t == null || Number.isNaN(t) ? '--°' : `${Math.round(t)}°`;
}
