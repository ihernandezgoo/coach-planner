"use client";

import { useActionState, useRef, useState } from "react";
import { CloseIcon, CopyIcon, UploadIcon } from "@/components/icons";
import { ESTADO_STYLES } from "@/components/status";
import { saveAsistencia } from "@/lib/actions";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import { ESTADOS_JUGADOR, ESTADO_EMOJI, type EstadoJugador, type Jugador } from "@/lib/types";

type TrainingDict = Dictionary["training"];

export function AttendanceForm({
  equipoId,
  fecha,
  jugadores,
  iniciales,
  dict,
  status,
}: {
  equipoId: string;
  fecha: string;
  jugadores: Jugador[];
  iniciales: Record<string, EstadoJugador>;
  dict: TrainingDict;
  status: Dictionary["status"];
}) {
  const [state, action, pending] = useActionState(saveAsistencia, null);
  // Si aún no se ha pasado lista, se parte de "todos han venido"
  const [estados, setEstados] = useState<Record<string, EstadoJugador>>(() =>
    Object.fromEntries(jugadores.map((j) => [j.id, iniciales[j.id] ?? "etorri_da"])),
  );

  const resumen = ESTADOS_JUGADOR.map((e) => ({
    estado: e,
    n: Object.values(estados).filter((v) => v === e).length,
  })).filter((r) => r.n > 0);

  return (
    <form action={action} className="card mt-6 overflow-hidden">
      <input type="hidden" name="equipo_id" value={equipoId} />
      <input type="hidden" name="fecha" value={fecha} />

      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line p-4 sm:px-5">
        <div className="flex flex-wrap gap-1.5">
          {resumen.map((r) => (
            <span
              key={r.estado}
              className={`rounded-full px-2.5 py-1 text-xs font-semibold tabular-nums ${ESTADO_STYLES[r.estado].chip}`}
            >
              {ESTADO_EMOJI[r.estado]} {r.n}
            </span>
          ))}
        </div>
        <button
          type="button"
          onClick={() => setEstados(Object.fromEntries(jugadores.map((j) => [j.id, "etorri_da"])))}
          className="btn-ghost py-1.5 text-xs"
        >
          {dict.allPresent}
        </button>
      </div>

      <ul className="divide-y divide-line">
        {jugadores.map((j) => (
          <li key={j.id} className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:px-5">
            <p className="flex min-w-0 flex-1 items-center gap-2 font-medium">
              <span className="w-6 text-xs text-muted tabular-nums">{j.dorsal ?? "–"}</span>
              <span className="truncate">
                {j.nombre} {j.apellido}
              </span>
            </p>
            <fieldset className="flex gap-1">
              <legend className="sr-only">
                {j.nombre} {j.apellido}
              </legend>
              {ESTADOS_JUGADOR.map((e) => (
                <label key={e} title={status[e]} className="cursor-pointer">
                  <input
                    type="radio"
                    name={`estado_${j.id}`}
                    value={e}
                    checked={estados[j.id] === e}
                    onChange={() => setEstados((prev) => ({ ...prev, [j.id]: e }))}
                    className="peer sr-only"
                  />
                  <span
                    className={`grid size-10 place-items-center rounded-xl border text-lg transition peer-focus-visible:ring-4 peer-focus-visible:ring-ring ${
                      estados[j.id] === e
                        ? `border-transparent ${ESTADO_STYLES[e].chip} scale-105`
                        : "border-line opacity-40 grayscale hover:opacity-80 hover:grayscale-0"
                    }`}
                  >
                    {ESTADO_EMOJI[e]}
                    <span className="sr-only">{status[e]}</span>
                  </span>
                </label>
              ))}
            </fieldset>
          </li>
        ))}
      </ul>

      <div className="sticky bottom-20 flex flex-wrap items-center justify-end gap-3 border-t border-line bg-surface/95 p-4 backdrop-blur sm:px-5 lg:bottom-0">
        {state?.saved && !pending && (
          <p role="status" className="mr-auto text-sm font-medium text-accent">
            {dict.saved}
          </p>
        )}
        {state?.error && !pending && (
          <p role="alert" className="mr-auto text-sm text-red-600 dark:text-red-400">
            {dict.error}
          </p>
        )}
        <button type="submit" disabled={pending} className="btn-primary w-full sm:w-auto">
          {pending ? dict.saving : dict.save}
        </button>
      </div>
    </form>
  );
}

export function ExportDialog({ text, dict, closeLabel }: { text: string; dict: TrainingDict; closeLabel: string }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  }

  return (
    <>
      <button type="button" onClick={() => dialogRef.current?.showModal()} className="btn-ghost">
        <UploadIcon width={16} height={16} />
        {dict.export}
      </button>

      <dialog
        ref={dialogRef}
        aria-labelledby="export-title"
        onClick={(e) => e.target === e.currentTarget && e.currentTarget.close()}
        className="m-auto w-[calc(100%-2rem)] max-w-2xl rounded-2xl border border-line bg-surface p-0 text-fg shadow-2xl backdrop:bg-black/50 backdrop:backdrop-blur-sm"
      >
        <div className="flex max-h-[85dvh] flex-col">
          <div className="flex items-start justify-between gap-4 border-b border-line p-5">
            <div>
              <h2 id="export-title" className="text-lg font-semibold">
                {dict.export}
              </h2>
              <p className="mt-1 text-sm text-muted">{dict.exportHelp}</p>
            </div>
            <button
              type="button"
              onClick={() => dialogRef.current?.close()}
              aria-label={closeLabel}
              className="grid size-9 shrink-0 place-items-center rounded-lg text-muted transition hover:bg-surface-2 hover:text-fg"
            >
              <CloseIcon />
            </button>
          </div>

          <div className="overflow-y-auto p-5">
            {text ? (
              <pre className="overflow-x-auto rounded-xl bg-surface-2 p-4 font-mono text-sm leading-relaxed whitespace-pre">
                {text}
              </pre>
            ) : (
              <p className="rounded-xl bg-surface-2 px-4 py-10 text-center text-sm text-muted">{dict.exportEmpty}</p>
            )}
          </div>

          <div className="flex justify-end gap-2 border-t border-line p-5">
            <button type="button" onClick={copy} disabled={!text} className="btn-primary">
              <CopyIcon width={16} height={16} />
              {copied ? dict.copied : dict.copy}
            </button>
          </div>
        </div>
      </dialog>
    </>
  );
}
