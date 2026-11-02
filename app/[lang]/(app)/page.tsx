import Link from "next/link";
import { Suspense, type ReactNode } from "react";
import {
  BellIcon,
  CalendarIcon,
  ChartIcon,
  ChevronRightIcon,
  ClockIcon,
  PinIcon,
  PlusIcon,
  ShieldIcon,
  UsersIcon,
} from "@/components/icons";
import { ESTADO_STYLES } from "@/components/status";
import { getEquipos, getEstadosPeriodo } from "@/lib/data";
import { diaSemana, diasDelMes, hoyISO } from "@/lib/fechas";
import { DEFAULT_LOCALE, format, isLocale, type Locale } from "@/lib/i18n/config";
import { getDictionary, type Dictionary } from "@/lib/i18n/dictionaries";
import { recordatoriosDelDia } from "@/lib/recordatorios";
import {
  DIAS_SEMANA,
  ESTADOS_JUGADOR,
  ESTADO_EMOJI,
  formatRango,
  ordenarHorarios,
  type DiaSemana,
  type EquipoResumen,
} from "@/lib/types";

export default async function DashboardPage({ params }: PageProps<"/[lang]">) {
  const { lang: raw } = await params;
  const lang = isLocale(raw) ? raw : DEFAULT_LOCALE;
  const dict = getDictionary(lang);

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{dict.dashboard.greeting} 👋</h1>
          <p className="mt-1 text-muted">{dict.dashboard.subtitle}</p>
        </div>
        <Link href={`/${lang}/equipos/nuevo`} className="btn-primary">
          <PlusIcon />
          {dict.nav.newTeam}
        </Link>
      </div>

      <Suspense fallback={<DashboardSkeleton />}>
        <DashboardContent lang={lang} dict={dict} />
      </Suspense>
    </>
  );
}

async function DashboardContent({ lang, dict }: { lang: Locale; dict: Dictionary }) {
  const equipos = await getEquipos();

  if (equipos.length === 0) {
    return (
      <div className="card mt-8 flex flex-col items-center px-6 py-16 text-center">
        <span className="grid size-14 place-items-center rounded-2xl bg-accent-soft text-accent">
          <ShieldIcon width={28} height={28} />
        </span>
        <h2 className="mt-5 text-lg font-semibold">{dict.dashboard.emptyTitle}</h2>
        <p className="mt-2 max-w-sm text-sm text-muted">{dict.dashboard.emptyText}</p>
        <Link href={`/${lang}/equipos/nuevo`} className="btn-primary mt-6">
          <PlusIcon />
          {dict.dashboard.createFirst}
        </Link>
      </div>
    );
  }

  const hoyFecha = hoyISO();
  const diasMes = diasDelMes(Number(hoyFecha.slice(0, 4)), Number(hoyFecha.slice(5, 7)));
  const estadosMes = await getEstadosPeriodo(diasMes[0], diasMes.at(-1)!);

  const jugadores = equipos.reduce((total, e) => total + e.jugadores.length, 0);
  const sesiones = equipos.reduce((total, e) => total + e.horarios.length, 0);
  const presentes = estadosMes.filter((e) => e === "etorri_da").length;
  const asistencia = estadosMes.length ? `${Math.round((presentes / estadosMes.length) * 100)}%` : "—";
  const hoy = diaSemana(hoyFecha);

  return (
    <>
      <section className="mt-8 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatCard icon={<ShieldIcon />} label={dict.dashboard.teams} value={equipos.length} />
        <StatCard icon={<UsersIcon />} label={dict.dashboard.players} value={jugadores} />
        <StatCard icon={<CalendarIcon />} label={dict.dashboard.sessions} value={sesiones} />
        <StatCard icon={<ChartIcon />} label={dict.dashboard.attendance} value={asistencia} />
      </section>

      <div className="mt-6 grid gap-6 xl:grid-cols-3">
        <WeekSchedule equipos={equipos} hoy={hoy} lang={lang} dict={dict} />
        <StatusBreakdown estados={estadosMes} dict={dict} />
      </div>

      <section className="mt-8">
        <h2 className="text-lg font-semibold">{dict.dashboard.yourTeams}</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {equipos.map((equipo) => (
            <TeamCard key={equipo.id} equipo={equipo} lang={lang} dict={dict} />
          ))}
        </div>
      </section>
    </>
  );
}

function StatCard({ icon, label, value }: { icon: ReactNode; label: string; value: ReactNode }) {
  return (
    <div className="card p-4 sm:p-5">
      <span className="grid size-9 place-items-center rounded-xl bg-accent-soft text-accent">{icon}</span>
      <p className="mt-4 text-2xl font-semibold tracking-tight tabular-nums sm:text-3xl">{value}</p>
      <p className="mt-0.5 text-xs text-muted sm:text-sm">{label}</p>
    </div>
  );
}

function WeekSchedule({
  equipos,
  hoy,
  lang,
  dict,
}: {
  equipos: EquipoResumen[];
  hoy: DiaSemana;
  lang: Locale;
  dict: Dictionary;
}) {
  return (
    <section className="card p-4 sm:p-5 xl:col-span-2">
      <h2 className="flex items-center gap-2 font-semibold">
        <CalendarIcon className="text-muted" />
        {dict.dashboard.weekly}
      </h2>
      {/* Móvil: lista por días · Escritorio: 7 columnas */}
      <div className="mt-4 grid gap-2 md:grid-cols-7">
        {DIAS_SEMANA.map((dia) => {
          const delDia = equipos
            .flatMap((e) => {
              const h = e.horarios.find((x) => x.dia === dia);
              return h ? [{ equipo: e, horario: h }] : [];
            })
            .sort((a, b) => (a.horario.hora_inicio ?? "99").localeCompare(b.horario.hora_inicio ?? "99"));
          const avisos = recordatoriosDelDia(dia);
          const esHoy = dia === hoy;

          return (
            <div
              key={dia}
              className={`flex gap-3 rounded-xl p-2.5 md:min-h-40 md:flex-col md:gap-2 ${
                esHoy ? "bg-accent-soft ring-1 ring-accent/40" : "bg-surface-2"
              }`}
            >
              <div className="w-12 shrink-0 md:w-auto">
                <p className={`text-xs font-semibold uppercase ${esHoy ? "text-accent" : "text-muted"}`}>
                  {dict.days[dia].short}
                </p>
                {esHoy && <p className="text-[10px] font-medium text-accent">{dict.dashboard.today}</p>}
              </div>
              <div className="flex min-w-0 flex-1 flex-wrap gap-1.5 md:flex-col">
                {delDia.length === 0 && avisos.length === 0 && (
                  <p className="text-xs text-muted/70">{dict.dashboard.noSessions}</p>
                )}
                {delDia.map(({ equipo, horario }) => (
                  <Link
                    key={equipo.id}
                    href={`/${lang}/equipos/${equipo.id}/entrenamientos`}
                    className="min-w-0 rounded-lg border border-line bg-surface px-2 py-1.5 text-xs transition hover:border-accent"
                  >
                    <p className="truncate font-medium">{equipo.nombre}</p>
                    {formatRango(horario) && <p className="text-muted tabular-nums">{formatRango(horario)}</p>}
                  </Link>
                ))}
                {avisos.map((r) => (
                  <p
                    key={r.key}
                    className="flex min-w-0 items-start gap-1 rounded-lg bg-sky-500/12 px-2 py-1.5 text-xs font-medium text-sky-700 dark:text-sky-300"
                  >
                    <BellIcon width={13} height={13} className="mt-px shrink-0" />
                    <span>
                      <span className="tabular-nums">{r.hora}</span> {dict.reminders[r.key]}
                    </span>
                  </p>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function StatusBreakdown({ estados, dict }: { estados: string[]; dict: Dictionary }) {
  const total = estados.length;

  return (
    <section className="card p-4 sm:p-5">
      <h2 className="flex items-center gap-2 font-semibold">
        <UsersIcon className="text-muted" />
        {dict.dashboard.statusTitle}
      </h2>
      {total === 0 ? (
        <p className="mt-4 text-sm text-muted">{dict.dashboard.noAttendance}</p>
      ) : (
        <>
          <div className="mt-5 flex h-3 overflow-hidden rounded-full bg-surface-2">
            {ESTADOS_JUGADOR.map((estado) => {
              const n = estados.filter((e) => e === estado).length;
              return n ? (
                <div
                  key={estado}
                  className={ESTADO_STYLES[estado].bar}
                  style={{ width: `${(n / total) * 100}%` }}
                  title={`${dict.status[estado]}: ${n}`}
                />
              ) : null;
            })}
          </div>
          <ul className="mt-5 space-y-2.5">
            {ESTADOS_JUGADOR.map((estado) => {
              const n = estados.filter((e) => e === estado).length;
              return (
                <li key={estado} className="flex items-center gap-3 text-sm">
                  <span className={`size-2.5 rounded-full ${ESTADO_STYLES[estado].bar}`} />
                  <span className="flex-1">
                    {ESTADO_EMOJI[estado]} {dict.status[estado]}
                  </span>
                  <span className="font-semibold tabular-nums">{n}</span>
                </li>
              );
            })}
          </ul>
        </>
      )}
    </section>
  );
}

function TeamCard({ equipo, lang, dict }: { equipo: EquipoResumen; lang: Locale; dict: Dictionary }) {
  const subtitle = [equipo.categoria, equipo.temporada].filter(Boolean).join(" · ");
  // Horas distintas del equipo (si todos los días son iguales, se muestra una sola)
  const rangos = [...new Set(ordenarHorarios(equipo.horarios).map(formatRango).filter(Boolean))];

  return (
    <Link
      href={`/${lang}/equipos/${equipo.id}`}
      className="card group flex flex-col p-5 transition hover:-translate-y-0.5 hover:border-accent/60 hover:shadow-lg hover:shadow-black/5"
    >
      <div className="flex items-start gap-3">
        <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-accent text-base font-bold text-accent-fg">
          {equipo.nombre.slice(0, 2).toUpperCase()}
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="truncate font-semibold">{equipo.nombre}</h3>
          {subtitle && <p className="truncate text-sm text-muted">{subtitle}</p>}
        </div>
        <ChevronRightIcon className="text-muted transition group-hover:translate-x-0.5 group-hover:text-accent" />
      </div>

      <div className="mt-4 flex flex-wrap gap-1">
        {DIAS_SEMANA.map((dia) => {
          const activo = equipo.horarios.some((h) => h.dia === dia);
          return (
            <span
              key={dia}
              className={`rounded-md px-1.5 py-0.5 text-[11px] font-semibold ${
                activo ? "bg-accent-soft text-accent" : "text-muted/50"
              }`}
            >
              {dict.days[dia].short}
            </span>
          );
        })}
      </div>

      <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1.5 border-t border-line pt-4 text-sm text-muted">
        <span className="flex items-center gap-1.5">
          <UsersIcon width={16} height={16} />
          {format(dict.team.playersCount, { n: equipo.jugadores.length })}
        </span>
        {rangos.length > 0 && (
          <span className="flex items-center gap-1.5 tabular-nums">
            <ClockIcon width={16} height={16} />
            {rangos.join(" · ")}
          </span>
        )}
        {equipo.lugar && (
          <span className="flex min-w-0 items-center gap-1.5">
            <PinIcon width={16} height={16} />
            <span className="truncate">{equipo.lugar}</span>
          </span>
        )}
      </div>
    </Link>
  );
}

function DashboardSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="mt-8 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="card h-32" />
        ))}
      </div>
      <div className="mt-6 grid gap-6 xl:grid-cols-3">
        <div className="card h-64 xl:col-span-2" />
        <div className="card h-64" />
      </div>
    </div>
  );
}
