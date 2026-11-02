"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { createEquipo, updateEquipo } from "@/lib/actions";
import type { Locale } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import { DIAS_SEMANA, formatHora, type DiaSemana, type Equipo } from "@/lib/types";

type TeamDict = Dictionary["team"];
type Horas = { inicio: string; fin: string };

export function TeamForm({
  lang,
  dict,
  days,
  equipo,
}: {
  lang: Locale;
  dict: TeamDict;
  days: Dictionary["days"];
  equipo?: Equipo; // si viene, el formulario edita en lugar de crear
}) {
  const [state, action, pending] = useActionState(equipo ? updateEquipo : createEquipo, null);
  const error = state?.error ? dict.errors[state.error as keyof TeamDict["errors"]] : null;

  // Horario por día; solo los días presentes en el objeto están marcados
  const [horario, setHorario] = useState<Partial<Record<DiaSemana, Horas>>>(() =>
    Object.fromEntries(
      (equipo?.horarios ?? []).map((h) => [
        h.dia,
        { inicio: formatHora(h.hora_inicio) ?? "", fin: formatHora(h.hora_fin) ?? "" },
      ]),
    ),
  );

  function toggleDia(dia: DiaSemana) {
    setHorario((prev) => {
      const next = { ...prev };
      if (next[dia]) {
        delete next[dia];
      } else {
        // Al marcar un día nuevo, copiar el horario del último día marcado para ahorrar teclear
        const ultimo = DIAS_SEMANA.filter((d) => prev[d]).at(-1);
        next[dia] = ultimo ? { ...prev[ultimo]! } : { inicio: "", fin: "" };
      }
      return next;
    });
  }

  function setHora(dia: DiaSemana, campo: keyof Horas, valor: string) {
    setHorario((prev) => ({ ...prev, [dia]: { ...prev[dia]!, [campo]: valor } }));
  }

  const marcados = DIAS_SEMANA.filter((d) => horario[d]);

  return (
    <form action={action} className="card mt-8 space-y-6 p-5 sm:p-7">
      <input type="hidden" name="lang" value={lang} />
      {equipo && <input type="hidden" name="id" value={equipo.id} />}

      <div>
        <label htmlFor="nombre" className="label">
          {dict.name} *
        </label>
        <input
          id="nombre"
          name="nombre"
          required
          defaultValue={equipo?.nombre}
          placeholder={dict.namePlaceholder}
          className="input"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="categoria" className="label">
            {dict.category}
          </label>
          <input
            id="categoria"
            name="categoria"
            defaultValue={equipo?.categoria ?? ""}
            placeholder={dict.categoryPlaceholder}
            className="input"
          />
        </div>
        <div>
          <label htmlFor="temporada" className="label">
            {dict.season}
          </label>
          <input
            id="temporada"
            name="temporada"
            defaultValue={equipo?.temporada ?? ""}
            placeholder={dict.seasonPlaceholder}
            className="input"
          />
        </div>
      </div>

      <fieldset>
        <legend className="label">{dict.days}</legend>
        <p className="-mt-1 mb-3 text-sm text-muted">{dict.daysHint}</p>
        <div className="grid grid-cols-4 gap-2 sm:grid-cols-7">
          {DIAS_SEMANA.map((dia) => (
            <label key={dia} className="cursor-pointer">
              <input
                type="checkbox"
                name="dias"
                value={dia}
                checked={Boolean(horario[dia])}
                onChange={() => toggleDia(dia)}
                className="peer sr-only"
              />
              <span
                title={days[dia].long}
                className="flex h-11 items-center justify-center rounded-xl border border-line bg-surface text-sm font-semibold text-muted transition peer-checked:border-accent peer-checked:bg-accent peer-checked:text-accent-fg peer-focus-visible:ring-4 peer-focus-visible:ring-ring hover:bg-surface-2"
              >
                {days[dia].short}
              </span>
            </label>
          ))}
        </div>

        {marcados.length > 0 && (
          <div className="mt-4 divide-y divide-line rounded-xl border border-line">
            {marcados.map((dia) => (
              <div key={dia} className="flex flex-wrap items-center gap-3 px-3 py-2.5 sm:flex-nowrap">
                <span className="w-full text-sm font-medium sm:w-28">{days[dia].long}</span>
                <label className="flex flex-1 items-center gap-2 text-xs text-muted">
                  {dict.start}
                  <input
                    type="time"
                    name={`inicio_${dia}`}
                    value={horario[dia]!.inicio}
                    onChange={(e) => setHora(dia, "inicio", e.target.value)}
                    className="input py-2"
                  />
                </label>
                <label className="flex flex-1 items-center gap-2 text-xs text-muted">
                  {dict.end}
                  <input
                    type="time"
                    name={`fin_${dia}`}
                    value={horario[dia]!.fin}
                    onChange={(e) => setHora(dia, "fin", e.target.value)}
                    className="input py-2"
                  />
                </label>
              </div>
            ))}
          </div>
        )}
      </fieldset>

      <div>
        <label htmlFor="lugar" className="label">
          {dict.place}
        </label>
        <input
          id="lugar"
          name="lugar"
          defaultValue={equipo?.lugar ?? ""}
          placeholder={dict.placePlaceholder}
          className="input"
        />
      </div>

      {error && (
        <p role="alert" className="rounded-xl bg-red-500/10 px-3.5 py-2.5 text-sm text-red-600 dark:text-red-400">
          {error}
        </p>
      )}

      <div className="flex flex-col-reverse gap-3 border-t border-line pt-6 sm:flex-row sm:justify-end">
        <Link href={equipo ? `/${lang}/equipos/${equipo.id}` : `/${lang}`} className="btn-ghost">
          {dict.cancel}
        </Link>
        <button type="submit" disabled={pending} className="btn-primary">
          {equipo ? (pending ? dict.saving : dict.save) : pending ? dict.creating : dict.create}
        </button>
      </div>
    </form>
  );
}
