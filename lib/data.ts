import { connection } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { Asistencia, EquipoDetalle, EquipoResumen, EstadoJugador } from "@/lib/types";

// connection(): leer siempre en tiempo de petición, nunca congelar los datos en el build

export async function getEquipos(): Promise<EquipoResumen[]> {
  await connection();
  const { data, error } = await createClient()
    .from("equipos")
    .select("*, jugadores(id), horarios:equipo_horarios(*)")
    .order("nombre");
  if (error) throw error;
  return data;
}

export async function getEquipo(id: string): Promise<EquipoDetalle | null> {
  await connection();
  const { data, error } = await createClient()
    .from("equipos")
    .select("*, jugadores(*), horarios:equipo_horarios(*)")
    .eq("id", id)
    .order("dorsal", { referencedTable: "jugadores", nullsFirst: false })
    .order("apellido", { referencedTable: "jugadores" })
    .maybeSingle();
  // id con formato inválido → tratarlo como no encontrado
  if (error && error.code !== "22P02") throw error;
  return data;
}

/** Asistencias de un equipo entre dos fechas (incluidas) */
export async function getAsistencias(equipoId: string, desde: string, hasta: string): Promise<Asistencia[]> {
  await connection();
  const { data, error } = await createClient()
    .from("asistencias")
    .select("jugador_id, fecha, estado")
    .eq("equipo_id", equipoId)
    .gte("fecha", desde)
    .lte("fecha", hasta)
    .order("fecha");
  if (error) throw error;
  return data;
}

/** Estados registrados en todos los equipos entre dos fechas (para el dashboard) */
export async function getEstadosPeriodo(desde: string, hasta: string): Promise<EstadoJugador[]> {
  await connection();
  const { data, error } = await createClient()
    .from("asistencias")
    .select("estado")
    .gte("fecha", desde)
    .lte("fecha", hasta);
  if (error) throw error;
  return data.map((a) => a.estado);
}
