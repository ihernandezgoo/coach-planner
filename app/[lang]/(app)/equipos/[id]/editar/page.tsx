import Link from "next/link";
import { Suspense } from "react";
import { ArrowLeftIcon } from "@/components/icons";
import { getEquipo } from "@/lib/data";
import { DEFAULT_LOCALE, isLocale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { TeamForm } from "../../team-form";

export default function EditTeamPage({ params }: PageProps<"/[lang]/equipos/[id]/editar">) {
  return (
    <div className="mx-auto max-w-2xl">
      <Suspense fallback={<div className="card mt-10 h-96 animate-pulse" />}>
        <EditTeam params={params} />
      </Suspense>
    </div>
  );
}

async function EditTeam({ params }: { params: Promise<{ lang: string; id: string }> }) {
  const { lang: raw, id } = await params;
  const lang = isLocale(raw) ? raw : DEFAULT_LOCALE;
  const dict = getDictionary(lang);
  const equipo = await getEquipo(id);

  return (
    <>
      <Link
        href={`/${lang}/equipos/${id}`}
        className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-fg"
      >
        <ArrowLeftIcon width={16} height={16} />
        {dict.team.back}
      </Link>
      {equipo ? (
        <>
          <h1 className="mt-4 text-2xl font-semibold tracking-tight sm:text-3xl">{dict.team.editTitle}</h1>
          <p className="mt-1 text-muted">{equipo.nombre}</p>
          <TeamForm lang={lang} dict={dict.team} days={dict.days} equipo={equipo} />
        </>
      ) : (
        <p className="card mt-4 p-6 text-muted">{dict.team.notFound}</p>
      )}
    </>
  );
}
