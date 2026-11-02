import { fechaCorta } from "@/lib/fechas";
import { ESTADO_EMOJI, type Asistencia, type Jugador } from "@/lib/types";

/**
 * Texto para compartir (WhatsApp…): fechas arriba y una línea por jugador con un emoji por
 * entrenamiento revisado, en orden. Cada día revisado se añade a la derecha del anterior.
 *
 *   📅 03/11 05/11 07/11
 *   ALEX A ✅✅❌
 */
export function exportarAsistencia(
  jugadores: Pick<Jugador, "id" | "nombre" | "apellido">[],
  asistencias: Asistencia[],
  titulo: string,
) {
  const fechas = [...new Set(asistencias.map((a) => a.fecha))].sort();
  if (fechas.length === 0) return "";

  const porClave = new Map(asistencias.map((a) => [`${a.jugador_id}|${a.fecha}`, a.estado]));
  const lineas = jugadores.map((j) => {
    const nombre = `${j.nombre} ${j.apellido}`.trim().toLocaleUpperCase("es");
    const emojis = fechas
      .map((f) => {
        const estado = porClave.get(`${j.id}|${f}`);
        return estado ? ESTADO_EMOJI[estado] : "➖";
      })
      .join("");
    return `${nombre} ${emojis}`;
  });

  return [titulo, `📅 ${fechas.map(fechaCorta).join(" ")}`, "", ...lineas].join("\n");
}
