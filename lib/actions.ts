"use server";

import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { isISODate } from "@/lib/fechas";
import { DEFAULT_LOCALE, isLocale, type Locale } from "@/lib/i18n/config";
import { parseListaJugadores } from "@/lib/import-jugadores";
import { createClient } from "@/lib/supabase/server";
import { DIAS_SEMANA, isEstadoJugador } from "@/lib/types";

export type FormState = { error?: string; imported?: number; skipped?: number; saved?: boolean } | null;

function getLang(formData: FormData): Locale {
  const lang = String(formData.get("lang") ?? "");
  return isLocale(lang) ? lang : DEFAULT_LOCALE;
}

function text(formData: FormData, key: string) {
  const value = String(formData.get(key) ?? "").trim();
  return value === "" ? null : value;
}

// ---------- Equipos ----------

/** Lee los datos del formulario de equipo; cada día marcado lleva su propio horario */
function leerEquipo(formData: FormData) {
  const nombre = text(formData, "nombre");
  const marcados = new Set(formData.getAll("dias").map(String));
  const horarios = DIAS_SEMANA.filter((dia) => marcados.has(dia)).map((dia) => ({
    dia,
    hora_inicio: text(formData, `inicio_${dia}`),
    hora_fin: text(formData, `fin_${dia}`),
  }));

  let error: string | null = null;
  if (!nombre) error = "name";
  else if (horarios.some((h) => h.hora_inicio && h.hora_fin && h.hora_fin <= h.hora_inicio)) error = "time";

  return {
    error,
    equipo: {
      nombre: nombre ?? "",
      categoria: text(formData, "categoria"),
      temporada: text(formData, "temporada"),
      lugar: text(formData, "lugar"),
    },
    horarios,
  };
}

export async function createEquipo(_prev: FormState, formData: FormData): Promise<FormState> {
  const lang = getLang(formData);
  const { error: invalid, equipo, horarios } = leerEquipo(formData);
  if (invalid) return { error: invalid };

  const supabase = createClient();
  const { data, error } = await supabase.from("equipos").insert(equipo).select("id").single();
  if (error) {
    console.error("[createEquipo]", error);
    return { error: "generic" };
  }

  if (horarios.length > 0) {
    const { error: hError } = await supabase
      .from("equipo_horarios")
      .insert(horarios.map((h) => ({ ...h, equipo_id: data.id })));
    if (hError) console.error("[createEquipo:horarios]", hError);
  }

  redirect(`/${lang}/equipos/${data.id}`);
}

export async function updateEquipo(_prev: FormState, formData: FormData): Promise<FormState> {
  const lang = getLang(formData);
  const id = String(formData.get("id"));
  const { error: invalid, equipo, horarios } = leerEquipo(formData);
  if (invalid) return { error: invalid };

  const supabase = createClient();
  const { error } = await supabase.from("equipos").update(equipo).eq("id", id);
  if (error) {
    console.error("[updateEquipo]", error);
    return { error: "generic" };
  }

  // Reemplazar el horario completo por el del formulario
  const { error: delError } = await supabase.from("equipo_horarios").delete().eq("equipo_id", id);
  const { error: insError } = horarios.length
    ? await supabase.from("equipo_horarios").insert(horarios.map((h) => ({ ...h, equipo_id: id })))
    : { error: null };
  if (delError || insError) {
    console.error("[updateEquipo:horarios]", delError ?? insError);
    return { error: "generic" };
  }

  redirect(`/${lang}/equipos/${id}`);
}

export async function deleteEquipo(formData: FormData) {
  const lang = getLang(formData);
  await createClient().from("equipos").delete().eq("id", String(formData.get("id")));
  redirect(`/${lang}`);
}

// ---------- Jugadores ----------

export async function addJugador(_prev: FormState, formData: FormData): Promise<FormState> {
  const nombre = text(formData, "nombre");
  const apellido = text(formData, "apellido");
  const dorsal = text(formData, "dorsal");
  if (!nombre || !apellido) return { error: "playerName" };

  const { error } = await createClient().from("jugadores").insert({
    equipo_id: String(formData.get("equipo_id")),
    nombre,
    apellido,
    dorsal: dorsal ? Number(dorsal) : null,
  });
  if (error) {
    console.error("[addJugador]", error);
    return { error: "generic" };
  }

  refresh();
  return null;
}

export async function importJugadores(_prev: FormState, formData: FormData): Promise<FormState> {
  const equipoId = String(formData.get("equipo_id"));
  const lista = parseListaJugadores(String(formData.get("lista") ?? ""));
  if (lista.length === 0) return { error: "emptyList" };

  const supabase = createClient();
  const { data: existentes, error: readError } = await supabase
    .from("jugadores")
    .select("nombre, apellido")
    .eq("equipo_id", equipoId);
  if (readError) {
    console.error("[importJugadores]", readError);
    return { error: "generic" };
  }

  // No duplicar jugadores que ya están en el equipo (ni repetidos dentro de la lista)
  const clave = (j: { nombre: string; apellido: string }) =>
    `${j.nombre} ${j.apellido}`.toLocaleLowerCase("es");
  const vistos = new Set(existentes.map(clave));
  const nuevos = lista.filter((j) => !vistos.has(clave(j)) && vistos.add(clave(j)));

  if (nuevos.length > 0) {
    const { error } = await supabase
      .from("jugadores")
      .insert(nuevos.map((j) => ({ ...j, equipo_id: equipoId })));
    if (error) {
      console.error("[importJugadores]", error);
      return { error: "generic" };
    }
  }

  refresh();
  return { imported: nuevos.length, skipped: lista.length - nuevos.length };
}

export async function deleteJugador(formData: FormData) {
  await createClient().from("jugadores").delete().eq("id", String(formData.get("id")));
  refresh();
}

// ---------- Asistencia ----------

/** Guarda la lista de un día: un campo `estado_<jugadorId>` por jugador */
export async function saveAsistencia(_prev: FormState, formData: FormData): Promise<FormState> {
  const equipoId = String(formData.get("equipo_id"));
  const fecha = String(formData.get("fecha"));
  if (!isISODate(fecha)) return { error: "generic" };

  const filas = [...formData.entries()].flatMap(([key, value]) => {
    const estado = String(value);
    if (!key.startsWith("estado_") || !isEstadoJugador(estado)) return [];
    return [{ equipo_id: equipoId, jugador_id: key.slice("estado_".length), fecha, estado }];
  });
  if (filas.length === 0) return { error: "generic" };

  const { error } = await createClient()
    .from("asistencias")
    .upsert(filas, { onConflict: "jugador_id,fecha" });
  if (error) {
    console.error("[saveAsistencia]", error);
    return { error: "generic" };
  }

  refresh();
  return { saved: true };
}

export async function deleteAsistencia(formData: FormData) {
  const lang = getLang(formData);
  const equipoId = String(formData.get("equipo_id"));
  const fecha = String(formData.get("fecha"));
  if (isISODate(fecha)) {
    await createClient().from("asistencias").delete().eq("equipo_id", equipoId).eq("fecha", fecha);
  }
  redirect(`/${lang}/equipos/${equipoId}/entrenamientos?mes=${fecha.slice(0, 7)}`);
}
