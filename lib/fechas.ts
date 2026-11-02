import { DIAS_SEMANA, type DiaSemana } from "@/lib/types";

// Las fechas viajan como texto "YYYY-MM-DD" y se calculan en UTC para no depender de la zona horaria.

const pad = (n: number) => String(n).padStart(2, "0");

export function toISODate(d: Date) {
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
}

export function parseISODate(fecha: string) {
  const [y, m, d] = fecha.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

export function isISODate(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && toISODate(parseISODate(value)) === value;
}

/** Fecha de hoy según el reloj local del servidor */
export function hoyISO() {
  const now = new Date();
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

export function diaSemana(fecha: string): DiaSemana {
  // getUTCDay(): 0 = domingo; nuestra semana empieza en lunes
  return DIAS_SEMANA[(parseISODate(fecha).getUTCDay() + 6) % 7];
}

/** "2026-11" → { year: 2026, month: 11 } (mes 1-12) */
export function parseMes(value: string | undefined, fallback: string) {
  const match = /^(\d{4})-(\d{2})$/.exec(value ?? "");
  const [y, m] = match ? [Number(match[1]), Number(match[2])] : fallback.split("-").map(Number);
  return { year: y, month: m >= 1 && m <= 12 ? m : 1 };
}

export function mesISO(year: number, month: number) {
  const d = new Date(Date.UTC(year, month - 1, 1));
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}`;
}

export function diasDelMes(year: number, month: number) {
  const total = new Date(Date.UTC(year, month, 0)).getUTCDate();
  return Array.from({ length: total }, (_, i) => `${year}-${pad(month)}-${pad(i + 1)}`);
}

/** "2026-11-04" → "04/11" */
export function fechaCorta(fecha: string) {
  const [, m, d] = fecha.split("-");
  return `${d}/${m}`;
}
