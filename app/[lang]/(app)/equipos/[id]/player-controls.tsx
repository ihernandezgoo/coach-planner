"use client";

import { useActionState, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { CloseIcon, UploadIcon } from "@/components/icons";
import { addJugador, importJugadores, type FormState } from "@/lib/actions";
import { format, type Locale } from "@/lib/i18n/config";
import { parseListaJugadores } from "@/lib/import-jugadores";
import type { Dictionary } from "@/lib/i18n/dictionaries";

type TeamDict = Dictionary["team"];

export function AddPlayerForm({ lang, equipoId, dict }: { lang: Locale; equipoId: string; dict: TeamDict }) {
  const [state, action, pending] = useActionState(addJugador, null);
  const formRef = useRef<HTMLFormElement>(null);
  const error = state?.error ? dict.errors[state.error as keyof TeamDict["errors"]] : null;

  // Vaciar el formulario tras añadir un jugador con éxito
  useEffect(() => {
    if (!pending && state === null) formRef.current?.reset();
  }, [pending, state]);

  return (
    <form ref={formRef} action={action} className="mt-4 space-y-3">
      <input type="hidden" name="lang" value={lang} />
      <input type="hidden" name="equipo_id" value={equipoId} />
      <div>
        <label htmlFor="nombre" className="label">
          {dict.firstName}
        </label>
        <input id="nombre" name="nombre" required className="input" />
      </div>
      <div>
        <label htmlFor="apellido" className="label">
          {dict.lastName}
        </label>
        <input id="apellido" name="apellido" required className="input" />
      </div>
      <div>
        <label htmlFor="dorsal" className="label">
          {dict.number}
        </label>
        <input id="dorsal" name="dorsal" type="number" min={0} max={999} inputMode="numeric" className="input" />
      </div>
      {error && (
        <p role="alert" className="text-sm text-red-600 dark:text-red-400">
          {error}
        </p>
      )}
      <button type="submit" disabled={pending} className="btn-primary w-full">
        {pending ? dict.adding : dict.add}
      </button>
    </form>
  );
}

export function ImportPlayersDialog({ lang, equipoId, dict }: { lang: Locale; equipoId: string; dict: TeamDict }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [texto, setTexto] = useState("");
  const [state, action, pending] = useActionState(async (prev: FormState, formData: FormData) => {
    const result = await importJugadores(prev, formData);
    if (result?.imported !== undefined) {
      setTexto("");
      dialogRef.current?.close();
    }
    return result;
  }, null);
  const preview = useMemo(() => parseListaJugadores(texto), [texto]);
  const error = state?.error ? dict.errors[state.error as keyof TeamDict["errors"]] : null;

  return (
    <>
      <button type="button" onClick={() => dialogRef.current?.showModal()} className="btn-ghost py-2">
        <UploadIcon width={16} height={16} />
        {dict.importTitle}
      </button>

      {state?.imported !== undefined && (
        <p role="status" className="w-full rounded-xl bg-accent-soft px-3 py-2 text-sm text-accent">
          {format(dict.importDone, { n: state.imported })}
          {state.skipped ? ` ${format(dict.importSkipped, { n: state.skipped })}` : ""}
        </p>
      )}

      {/* Clic fuera (en el fondo) cierra el modal; Esc lo cierra de forma nativa */}
      <dialog
        ref={dialogRef}
        aria-labelledby="import-title"
        onClick={(e) => e.target === e.currentTarget && e.currentTarget.close()}
        className="m-auto w-[calc(100%-2rem)] max-w-3xl rounded-2xl border border-line bg-surface p-0 text-fg shadow-2xl backdrop:bg-black/50 backdrop:backdrop-blur-sm max-sm:mb-4"
      >
        <form action={action} className="flex max-h-[85dvh] flex-col">
          <input type="hidden" name="lang" value={lang} />
          <input type="hidden" name="equipo_id" value={equipoId} />

          <div className="flex items-start justify-between gap-4 border-b border-line p-5">
            <div>
              <h2 id="import-title" className="text-lg font-semibold">
                {dict.importTitle}
              </h2>
              <p className="mt-1 text-sm text-muted">{dict.importHelp}</p>
            </div>
            <button
              type="button"
              onClick={() => dialogRef.current?.close()}
              aria-label={dict.close}
              className="grid size-9 shrink-0 place-items-center rounded-lg text-muted transition hover:bg-surface-2 hover:text-fg"
            >
              <CloseIcon />
            </button>
          </div>

          <div className="overflow-y-auto p-5">
            {/* Móvil: una columna · Escritorio: texto a la izquierda, vista previa a la derecha */}
            <div className="grid gap-4 sm:h-80 sm:grid-cols-2">
              <textarea
                name="lista"
                value={texto}
                onChange={(e) => setTexto(e.target.value)}
                rows={8}
                autoFocus
                spellCheck={false}
                placeholder={dict.importPlaceholder}
                aria-label={dict.importTitle}
                className="input resize-none font-mono sm:h-full"
              />

              <div className="flex min-h-0 flex-col rounded-xl bg-surface-2 p-2">
                <p className="px-1.5 pt-0.5 pb-2 text-xs font-semibold tracking-wide text-muted uppercase">
                  {dict.preview} · {preview.length}
                </p>
                {preview.length === 0 ? (
                  <p className="grid flex-1 place-items-center px-4 py-8 text-center text-sm text-muted">
                    {dict.previewEmpty}
                  </p>
                ) : (
                  <ul className="max-h-60 flex-1 space-y-1 overflow-y-auto text-sm sm:max-h-none">
                    {preview.map((j, i) => (
                      <li key={i} className="flex items-center gap-2 rounded-lg bg-surface px-2.5 py-1.5">
                        <span className="w-6 text-xs text-muted tabular-nums">{j.dorsal ?? "–"}</span>
                        <span className="truncate font-medium">{j.nombre}</span>
                        <span className="text-muted">{j.apellido}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            {error && (
              <p role="alert" className="mt-3 text-sm text-red-600 dark:text-red-400">
                {error}
              </p>
            )}
          </div>

          <div className="flex flex-col-reverse gap-2 border-t border-line p-5 sm:flex-row sm:justify-end">
            <button type="button" onClick={() => dialogRef.current?.close()} className="btn-ghost">
              {dict.cancel}
            </button>
            <button type="submit" disabled={pending || preview.length === 0} className="btn-primary">
              {pending ? dict.importing : format(dict.importButton, { n: preview.length })}
            </button>
          </div>
        </form>
      </dialog>
    </>
  );
}

export function ConfirmDeleteButton({
  confirmText,
  label,
  className,
  children,
}: {
  confirmText: string;
  label?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <button
      type="submit"
      aria-label={label}
      title={label}
      className={className}
      onClick={(e) => {
        if (!confirm(confirmText)) e.preventDefault();
      }}
    >
      {children}
    </button>
  );
}
