import type { DiaSemana } from "@/lib/types";

// Avisos fijos que aparecen cada semana en los calendarios.
// Para añadir otro: nueva entrada aquí + su texto en `reminders` de los diccionarios.
export const RECORDATORIOS = [{ key: "sendMatch", dia: "miercoles", hora: "18:00" }] as const satisfies readonly {
  key: string;
  dia: DiaSemana;
  hora: string;
}[];

export type RecordatorioKey = (typeof RECORDATORIOS)[number]["key"];

export function recordatoriosDelDia(dia: DiaSemana) {
  return RECORDATORIOS.filter((r) => r.dia === dia);
}
