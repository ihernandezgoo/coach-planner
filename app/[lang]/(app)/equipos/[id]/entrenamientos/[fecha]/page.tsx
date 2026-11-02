import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ArrowLeftIcon, BellIcon, ClockIcon, TrashIcon } from "@/components/icons";
import { deleteAsistencia } from "@/lib/actions";
import { getAsistencias, getEquipo } from "@/lib/data";
import { diaSemana, isISODate } from "@/lib/fechas";
import { DEFAULT_LOCALE, isLocale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { recordatoriosDelDia } from "@/lib/recordatorios";
import { formatRango } from "@/lib/types";
import { ConfirmDeleteButton } from "../../player-controls";
import { AttendanceForm } from "../training-controls";

export default function AttendancePage({ params }: PageProps<"/[lang]/equipos/[id]/entrenamientos/[fecha]">) {
  return (
    <Suspense
      fallback={
        <div className="animate-pulse">
          <div className="h-5 w-32 rounded bg-surface-2" />
          <div className="card mt-4 h-96" />
        </div>
      }
    >
      <Attendance params={params} />
    </Suspense>
  );
}

async function Attendance({ params }: { params: Promise<{ lang: string; id: string; fecha: string }> }) {
  const { lang: raw, id, fecha } = await params;
  if (!isISODate(fecha)) notFound();
  const lang = isLocale(raw) ? raw : DEFAULT_LOCALE;
  const dict = getDictionary(lang);
  const [equipo, asistencias] = await Promise.all([getEquipo(id), getAsistencias(id, fecha, fecha)]);

  const calendario = `/${lang}/equipos/${id}/entrenamientos?mes=${fecha.slice(0, 7)}`;
  const back = (
    <Link href={calendario} className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-fg">
      <ArrowLeftIcon width={16} height={16} />
      {dict.training.backToCalendar}
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

  const dia = diaSemana(fecha);
  const horario = equipo.horarios.find((h) => h.dia === dia);
  const [y, m, d] = fecha.split("-").map(Number);
  const iniciales = Object.fromEntries(asistencias.map((a) => [a.jugador_id, a.estado]));

  return (
    <div className="mx-auto max-w-3xl">
      {back}
      <header className="mt-4 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-accent">
            {equipo.nombre} · {dict.training.attendance}
          </p>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            {dict.days[dia].long}, {d} {dict.months[m - 1]} {y}
          </h1>
          <div className="mt-2 flex flex-wrap gap-2 text-sm">
            {horario && formatRango(horario) && (
              <span className="inline-flex items-center gap-1.5 rounded-lg bg-surface-2 px-2.5 py-1 tabular-nums">
                <ClockIcon width={14} height={14} />
                {formatRango(horario)}
              </span>
            )}
            {recordatoriosDelDia(dia).map((r) => (
              <span
                key={r.key}
                className="inline-flex items-center gap-1.5 rounded-lg bg-sky-500/12 px-2.5 py-1 text-sky-700 dark:text-sky-300"
              >
                <BellIcon width={14} height={14} />
                {r.hora} · {dict.reminders[r.key]}
              </span>
            ))}
          </div>
        </div>
        {asistencias.length > 0 && (
          <form action={deleteAsistencia}>
            <input type="hidden" name="lang" value={lang} />
            <input type="hidden" name="equipo_id" value={id} />
            <input type="hidden" name="fecha" value={fecha} />
            <ConfirmDeleteButton
              confirmText={dict.training.clearConfirm}
              label={dict.training.clear}
              className="btn-ghost px-3 text-red-600 dark:text-red-400"
            >
              <TrashIcon width={16} height={16} />
            </ConfirmDeleteButton>
          </form>
        )}
      </header>

      {!horario && (
        <p className="mt-4 rounded-xl bg-amber-500/10 px-4 py-3 text-sm text-amber-800 dark:text-amber-300">
          {dict.training.notTrainingDay}
        </p>
      )}

      {equipo.jugadores.length === 0 ? (
        <p className="card mt-6 p-6 text-center text-sm text-muted">{dict.training.noPlayers}</p>
      ) : (
        <AttendanceForm
          // Remontar al cambiar de día para no arrastrar selecciones
          key={fecha}
          equipoId={id}
          fecha={fecha}
          jugadores={equipo.jugadores}
          iniciales={iniciales}
          dict={dict.training}
          status={dict.status}
        />
      )}
    </div>
  );
}
