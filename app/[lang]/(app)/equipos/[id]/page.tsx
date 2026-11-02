import Link from "next/link";
import { Suspense } from "react";
import {
  ArrowLeftIcon,
  CalendarIcon,
  ClipboardIcon,
  EditIcon,
  PinIcon,
  TrashIcon,
  UsersIcon,
} from "@/components/icons";
import { deleteEquipo, deleteJugador } from "@/lib/actions";
import { getEquipo } from "@/lib/data";
import { DEFAULT_LOCALE, format, isLocale, type Locale } from "@/lib/i18n/config";
import { getDictionary, type Dictionary } from "@/lib/i18n/dictionaries";
import { formatRango, ordenarHorarios } from "@/lib/types";
import { AddPlayerForm, ConfirmDeleteButton, ImportPlayersDialog } from "./player-controls";

// El id solo se conoce en tiempo de petición, así que toda la página se resuelve dentro de <Suspense>
export default function TeamPage({ params }: PageProps<"/[lang]/equipos/[id]">) {
  return (
    <Suspense
      fallback={
        <div className="animate-pulse">
          <div className="h-5 w-20 rounded bg-surface-2" />
          <div className="card mt-4 h-48" />
        </div>
      }
    >
      <TeamDetail params={params} />
    </Suspense>
  );
}

async function TeamDetail({ params }: { params: Promise<{ lang: string; id: string }> }) {
  const { lang: raw, id } = await params;
  const lang: Locale = isLocale(raw) ? raw : DEFAULT_LOCALE;
  const dict: Dictionary = getDictionary(lang);
  const equipo = await getEquipo(id);

  const back = (
    <Link href={`/${lang}`} className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-fg">
      <ArrowLeftIcon width={16} height={16} />
      {dict.team.back}
    </Link>
  );

  if (!equipo) {
    return (
      <>
        {back}
        <p className="card mt-4 p-6 text-muted">{dict.team.notFound}</p>
      </>
    );
  }

  const subtitle = [equipo.categoria, equipo.temporada].filter(Boolean).join(" · ");
  const horarios = ordenarHorarios(equipo.horarios);

  return (
    <>
      {back}
      <header className="card mt-4 overflow-hidden">
        <div className="h-2 bg-accent" />
        <div className="flex flex-col gap-5 p-5 sm:flex-row sm:items-start sm:p-7">
          <span className="grid size-16 shrink-0 place-items-center rounded-2xl bg-accent text-xl font-bold text-accent-fg">
            {equipo.nombre.slice(0, 2).toUpperCase()}
          </span>
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{equipo.nombre}</h1>
            {subtitle && <p className="mt-1 text-muted">{subtitle}</p>}

            <div className="mt-4 flex flex-wrap gap-2">
              {horarios.length === 0 && (
                <span className="flex items-center gap-2 text-sm text-muted">
                  <CalendarIcon width={16} height={16} />—
                </span>
              )}
              {horarios.map((h) => (
                <span
                  key={h.dia}
                  className="inline-flex items-center gap-2 rounded-lg bg-surface-2 px-2.5 py-1.5 text-sm"
                >
                  <span className="font-semibold">{dict.days[h.dia].long}</span>
                  {formatRango(h) && <span className="text-muted tabular-nums">{formatRango(h)}</span>}
                </span>
              ))}
            </div>
            {equipo.lugar && (
              <p className="mt-3 flex items-center gap-2 text-sm text-muted">
                <PinIcon width={16} height={16} />
                {equipo.lugar}
              </p>
            )}
          </div>

          <div className="flex gap-2">
            <Link href={`/${lang}/equipos/${equipo.id}/editar`} className="btn-ghost">
              <EditIcon width={16} height={16} />
              {dict.team.edit}
            </Link>
            <form action={deleteEquipo}>
              <input type="hidden" name="lang" value={lang} />
              <input type="hidden" name="id" value={equipo.id} />
              <ConfirmDeleteButton
                confirmText={dict.team.deleteConfirm}
                label={dict.team.deleteTeam}
                className="btn-ghost px-3 text-red-600 dark:text-red-400"
              >
                <TrashIcon width={16} height={16} />
              </ConfirmDeleteButton>
            </form>
          </div>
        </div>
      </header>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <section className="card p-4 sm:p-5 lg:col-span-2">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="flex items-center gap-2 font-semibold">
              <UsersIcon className="text-muted" />
              {dict.team.players}
              <span className="ml-1 rounded-full bg-surface-2 px-2 py-0.5 text-xs text-muted">
                {format(dict.team.playersCount, { n: equipo.jugadores.length })}
              </span>
            </h2>
            <div className="flex flex-wrap items-center gap-2">
              <Link href={`/${lang}/equipos/${equipo.id}/entrenamientos`} className="btn-primary py-2">
                <ClipboardIcon width={16} height={16} />
                {dict.training.review}
              </Link>
              <ImportPlayersDialog lang={lang} equipoId={equipo.id} dict={dict.team} />
            </div>
          </div>

          {equipo.jugadores.length === 0 ? (
            <p className="mt-6 rounded-xl bg-surface-2 px-4 py-8 text-center text-sm text-muted">
              {dict.team.noPlayers}
            </p>
          ) : (
            <ul className="mt-4 divide-y divide-line">
              {equipo.jugadores.map((j) => (
                <li key={j.id} className="flex items-center gap-3 py-3">
                  <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-surface-2 text-sm font-semibold tabular-nums">
                    {j.dorsal ?? "–"}
                  </span>
                  <p className="min-w-0 flex-1 truncate font-medium">
                    {j.nombre} {j.apellido}
                  </p>
                  <form action={deleteJugador}>
                    <input type="hidden" name="lang" value={lang} />
                    <input type="hidden" name="id" value={j.id} />
                    <button
                      type="submit"
                      aria-label={dict.team.removePlayer}
                      title={dict.team.removePlayer}
                      className="grid size-9 place-items-center rounded-lg text-muted transition hover:bg-red-500/10 hover:text-red-600"
                    >
                      <TrashIcon width={16} height={16} />
                    </button>
                  </form>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="card h-fit p-4 sm:p-5">
          <h2 className="font-semibold">{dict.team.addPlayer}</h2>
          <AddPlayerForm lang={lang} equipoId={equipo.id} dict={dict.team} />
        </section>
      </div>
    </>
  );
}
