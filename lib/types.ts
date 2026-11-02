export const DIAS_SEMANA = [
  "lunes",
  "martes",
  "miercoles",
  "jueves",
  "viernes",
  "sabado",
  "domingo",
] as const;
export type DiaSemana = (typeof DIAS_SEMANA)[number];

export const ESTADOS_JUGADOR = [
  "etorri_da",
  "falta",
  "lesioa",
  "gaixo",
  "medikua",
  "ikasten",
] as const;
export type EstadoJugador = (typeof ESTADOS_JUGADOR)[number];

export const ESTADO_EMOJI: Record<EstadoJugador, string> = {
  etorri_da: "✅",
  falta: "❌",
  lesioa: "🤕",
  gaixo: "🤒",
  medikua: "🏥",
  ikasten: "📚",
};

export type Horario = {
  id: string;
  equipo_id: string;
  dia: DiaSemana;
  hora_inicio: string | null;
  hora_fin: string | null;
};

export type Equipo = {
  id: string;
  nombre: string;
  categoria: string | null;
  temporada: string | null;
  lugar: string | null;
  created_at: string;
  horarios: Horario[];
};

export type Jugador = {
  id: string;
  equipo_id: string;
  nombre: string;
  apellido: string;
  dorsal: number | null;
  created_at: string;
};

export type Asistencia = {
  jugador_id: string;
  fecha: string; // YYYY-MM-DD
  estado: EstadoJugador;
};

export type EquipoResumen = Equipo & {
  jugadores: Pick<Jugador, "id">[];
};

export type EquipoDetalle = Equipo & {
  jugadores: Jugador[];
};

export function isDiaSemana(value: string): value is DiaSemana {
  return DIAS_SEMANA.includes(value as DiaSemana);
}

export function isEstadoJugador(value: string): value is EstadoJugador {
  return ESTADOS_JUGADOR.includes(value as EstadoJugador);
}

export function formatHora(hora: string | null) {
  return hora ? hora.slice(0, 5) : null;
}

export function formatRango(h: Pick<Horario, "hora_inicio" | "hora_fin">) {
  if (!h.hora_inicio) return null;
  return h.hora_fin ? `${formatHora(h.hora_inicio)}–${formatHora(h.hora_fin)}` : formatHora(h.hora_inicio);
}

export function ordenarHorarios(horarios: Horario[]) {
  return [...horarios].sort((a, b) => DIAS_SEMANA.indexOf(a.dia) - DIAS_SEMANA.indexOf(b.dia));
}
