import Link from "next/link";
import { Suspense } from "react";
import { ArrowLeftIcon, BellIcon, ChevronLeftIcon, ChevronRightIcon, ClockIcon } from "@/components/icons";
import { exportarAsistencia } from "@/lib/asistencia";
import { getAsistencias, getEquipo } from "@/lib/data";
import { diaSemana, diasDelMes, hoyISO, mesISO, parseMes } from "@/lib/fechas";
import { DEFAULT_LOCALE, isLocale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { recordatoriosDelDia } from "@/lib/recordatorios";
import { DIAS_SEMANA, formatRango, type Horario } from "@/lib/types";
import { ExportDialog } from "./training-controls";

export default function TrainingsPage({ params, searchParams }: PageProps<"/[lang]/equipos/[id]/entrenamientos">) {
  return (
    <Suspense
      fallback={
        <div className="animate-pulse">
          <div className="h-5 w-24 rounded bg-surface-2" />
          <div className="card mt-4 h-[28rem]" />
        </div>
      }
    >
      <Trainings params={params} searchParams={searchParams} />
    </Suspense>
  );
}

type SessionInfo = { fecha: string; horario?: Horario; presentes: number; total: number; revisado: boolean };

async function Trainings({
  params,
  searchParams,
}: {
  params: Promise<{ lang: string; id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [{ lang: raw, id }, query] = await Promise.all([params, searchParams]);
  const lang = isLocale(raw) ? raw : DEFAULT_LOCALE;
  const dict = getDictionary(lang);

  const hoy = hoyISO();
  const { year, month } = parseMes(typeof query.mes === "string" ? query.mes : undefined, hoy.slice(0, 7));
  const dias = diasDelMes(year, month);
  const [equipo, asistencias] = await Promise.all([getEquipo(id), getAsistencias(id, dias[0], dias.at(-1)!)]);

  const base = `/${lang}/equipos/${id}`;
  const back = (
    <Link href={base} className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-fg">
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

  const horarioPorDia = new Map(equipo.horarios.map((h) => [h.dia, h]));
  const registrosPorFecha = Map.groupBy(asistencias, (a) => a.fecha);

  // Un día es de entrenamiento si toca por horario o si ya se pasó lista ese día
  const sesiones = new Map<string, SessionInfo>();
  for (const fecha of dias) {
    const horario = horarioPorDia.get(diaSemana(fecha));
    const registros = registrosPorFecha.get(fecha) ?? [];
    if (!horario && registros.length === 0) continue;
    sesiones.set(fecha, {
      fecha,
      horario,
      revisado: registros.length > 0,
      presentes: registros.filter((r) => r.estado === "etorri_da").length,
      total: registros.length,
    });
  }

  const titulo = `${dict.months[month - 1]} ${year}`;
  const textoExport = exportarAsistencia(equipo.jugadores, asistencias, `${equipo.nombre} · ${titulo}`);
  const huecos = DIAS_SEMANA.indexOf(diaSemana(dias[0]));

  // Agenda: sesiones y avisos del mes, en orden
  const agenda = dias.flatMap((fecha) => {
    const items: { fecha: string; sesion?: SessionInfo; aviso?: string; hora?: string }[] = [];
    const sesion = sesiones.get(fecha);
    if (sesion) items.push({ fecha, sesion });
    for (const r of recordatoriosDelDia(diaSemana(fecha))) {
      items.push({ fecha, aviso: dict.reminders[r.key], hora: r.hora });
    }
    return items;
  });

  return (
    <>
      {back}
      <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-accent">{equipo.nombre}</p>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{dict.training.title}</h1>
        </div>
        <ExportDialog text={textoExport} dict={dict.training} closeLabel={dict.team.close} />
      </div>

      {equipo.horarios.length === 0 && (
        <p className="mt-4 rounded-xl bg-amber-500/10 px-4 py-3 text-sm text-amber-800 dark:text-amber-300">
          {dict.training.noSchedule}{" "}
          <Link href={`${base}/editar`} className="font-semibold underline">
            {dict.team.edit}
          </Link>
        </p>
      )}

      <section className="card mt-6 p-3 sm:p-5">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-lg font-semibold">{titulo}</h2>
          <div className="flex items-center gap-1">
            <Link
              href={`${base}/entrenamientos?mes=${mesISO(year, month - 1)}`}
              aria-label={dict.training.prevMonth}
              title={dict.training.prevMonth}
              className="grid size-9 place-items-center rounded-lg text-muted transition hover:bg-surface-2 hover:text-fg"
            >
              <ChevronLeftIcon />
            </Link>
            <Link
              href={`${base}/entrenamientos`}
              className="rounded-lg px-2.5 py-1.5 text-sm font-medium text-muted transition hover:bg-surface-2 hover:text-fg"
            >
              {dict.training.thisMonth}
            </Link>
            <Link
              href={`${base}/entrenamientos?mes=${mesISO(year, month + 1)}`}
              aria-label={dict.training.nextMonth}
              title={dict.training.nextMonth}
              className="grid size-9 place-items-center rounded-lg text-muted transition hover:bg-surface-2 hover:text-fg"
            >
              <ChevronRightIcon />
            </Link>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-7 gap-1 text-center text-[11px] font-semibold text-muted uppercase sm:gap-2 sm:text-xs">
          {DIAS_SEMANA.map((d) => (
            <div key={d}>{dict.days[d].short}</div>
          ))}
        </div>
        <div className="mt-1.5 grid grid-cols-7 gap-1 sm:gap-2">
          {Array.from({ length: huecos }, (_, i) => (
            <div key={`h${i}`} />
          ))}
          {dias.map((fecha) => {
            const sesion = sesiones.get(fecha);
            const avisos = recordatoriosDelDia(diaSemana(fecha));
            const esHoy = fecha === hoy;
            const pendiente = sesion && !sesion.revisado && fecha <= hoy;
            const contenido = (
              <>
                <span
                  className={`grid size-6 place-items-center rounded-full text-xs font-semibold tabular-nums sm:text-sm ${
                    esHoy ? "bg-accent text-accent-fg" : ""
                  }`}
                >
                  {Number(fecha.slice(8))}
                </span>
                {sesion && (
                  <span className="hidden w-full flex-col gap-0.5 text-left text-[11px] leading-tight md:flex">
                    {sesion.horario && formatRango(sesion.horario) && (
                      <span className="text-muted tabular-nums">{formatRango(sesion.horario)}</span>
                    )}
                    {sesion.revisado ? (
                      <span className="font-semibold text-emerald-700 tabular-nums dark:text-emerald-300">
                        ✅ {sesion.presentes}/{sesion.total}
                      </span>
                    ) : pendiente ? (
                      <span className="font-medium text-amber-700 dark:text-amber-300">{dict.training.pending}</span>
                    ) : null}
                  </span>
                )}
                {/* Móvil: un punto indica el estado */}
                {sesion && (
                  <span
                    className={`size-1.5 rounded-full md:hidden ${
                      sesion.revisado ? "bg-emerald-500" : pendiente ? "bg-amber-500" : "bg-accent"
                    }`}
                  />
                )}
                {avisos.map((r) => (
                  <span
                    key={r.key}
                    title={`${r.hora} · ${dict.reminders[r.key]}`}
                    className="mt-auto flex w-full items-center gap-1 rounded-md bg-sky-500/12 px-1 py-0.5 text-[10px] font-medium text-sky-700 dark:text-sky-300"
                  >
                    <BellIcon width={11} height={11} className="shrink-0" />
                    <span className="hidden truncate md:inline">
                      {r.hora} {dict.reminders[r.key]}
                    </span>
                  </span>
                ))}
              </>
            );

            const clase = `flex min-h-16 flex-col items-center gap-1 rounded-lg border p-1 sm:min-h-24 sm:p-1.5 md:items-start ${
              sesion
                ? "border-accent/40 bg-accent-soft/60 transition hover:border-accent"
                : "border-transparent bg-surface-2/60"
            }`;

            return sesion ? (
              <Link key={fecha} href={`${base}/entrenamientos/${fecha}`} className={clase}>
                {contenido}
              </Link>
            ) : (
              <div key={fecha} className={clase}>
                {contenido}
              </div>
            );
          })}
        </div>
      </section>

      <section className="card mt-6 p-4 sm:p-5">
        <h2 className="font-semibold">{dict.training.sessions}</h2>
        {agenda.length === 0 ? (
          <p className="mt-3 text-sm text-muted">{dict.training.noSessions}</p>
        ) : (
          <ul className="mt-3 divide-y divide-line">
            {agenda.map((item) => {
              const fechaTexto = `${dict.days[diaSemana(item.fecha)].long} ${Number(item.fecha.slice(8))}`;
              if (item.aviso) {
                return (
                  <li key={`${item.fecha}-aviso`} className="flex items-center gap-3 py-3 text-sm">
                    <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-sky-500/12 text-sky-700 dark:text-sky-300">
                      <BellIcon width={16} height={16} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block font-medium">{item.aviso}</span>
                      <span className="text-muted">
                        {fechaTexto} · {item.hora}
                      </span>
                    </span>
                  </li>
                );
              }
              const s = item.sesion!;
              return (
                <li key={item.fecha}>
                  <Link
                    href={`${base}/entrenamientos/${item.fecha}`}
                    className="-mx-2 flex items-center gap-3 rounded-lg px-2 py-3 text-sm transition hover:bg-surface-2"
                  >
                    <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-accent-soft text-accent">
                      <ClockIcon width={16} height={16} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block font-medium">{fechaTexto}</span>
                      {s.horario && formatRango(s.horario) && (
                        <span className="text-muted tabular-nums">{formatRango(s.horario)}</span>
                      )}
                    </span>
                    {s.revisado ? (
                      <span className="rounded-full bg-emerald-500/12 px-2.5 py-1 text-xs font-semibold text-emerald-700 tabular-nums dark:text-emerald-300">
                        ✅ {s.presentes}/{s.total}
                      </span>
                    ) : item.fecha <= hoy ? (
                      <span className="rounded-full bg-amber-500/12 px-2.5 py-1 text-xs font-medium text-amber-800 dark:text-amber-300">
                        {dict.training.pending}
                      </span>
                    ) : null}
                    <ChevronRightIcon width={16} height={16} className="text-muted" />
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </>
  );
}
