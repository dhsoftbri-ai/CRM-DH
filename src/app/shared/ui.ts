export function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]!.toUpperCase())
    .join('');
}

const TONES = ['#0265CF', '#6750A4', '#00838F', '#B26A00', '#3949AB', '#00796B', '#8E24AA'];
const WON = /ganad|won|convert|cerrad/i;
const LOST = /perdid|lost|junk|basura|no calific|not qualified/i;

/** Color estable por estatus (verde para ganados, rojo para perdidos). */
export function statusColor(status: string, all: string[]): string {
  if (WON.test(status)) return '#2E7D32';
  if (LOST.test(status)) return '#C62828';
  const i = Math.max(0, all.indexOf(status));
  return TONES[i % TONES.length]!;
}

export const PRIORITY_LABEL: Record<string, string> = {
  Highest: 'Urgente',
  High: 'Alta',
  Normal: 'Normal',
  Low: 'Baja',
  Lowest: 'Muy baja',
};

export function whatsappUrl(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  return `https://wa.me/${digits.length === 10 ? '52' + digits : digits}`;
}

/** 'yyyy-MM-dd' → Date local (sin desfase por zona horaria). */
export function parseDateOnly(s: string): Date {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y!, m! - 1, d!);
}

export function dayDiff(dateOnly: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.round((parseDateOnly(dateOnly).getTime() - today.getTime()) / 86_400_000);
}
