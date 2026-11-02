import Link from "next/link";
import { ArrowLeftIcon } from "@/components/icons";
import { DEFAULT_LOCALE, isLocale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { TeamForm } from "../team-form";

export default async function NewTeamPage({ params }: PageProps<"/[lang]/equipos/nuevo">) {
  const { lang: raw } = await params;
  const lang = isLocale(raw) ? raw : DEFAULT_LOCALE;
  const dict = getDictionary(lang);

  return (
    <div className="mx-auto max-w-2xl">
      <Link href={`/${lang}`} className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-fg">
        <ArrowLeftIcon width={16} height={16} />
        {dict.team.back}
      </Link>
      <h1 className="mt-4 text-2xl font-semibold tracking-tight sm:text-3xl">{dict.team.newTitle}</h1>
      <p className="mt-1 text-muted">{dict.team.newSubtitle}</p>

      <TeamForm lang={lang} dict={dict.team} days={dict.days} />
    </div>
  );
}
