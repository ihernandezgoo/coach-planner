"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense } from "react";
import { LOCALES, LOCALE_COOKIE, type Locale } from "@/lib/i18n/config";

type Props = { lang: Locale; label: string };

export function LangSwitch(props: Props) {
  // Mientras se resuelve la ruta actual, los enlaces apuntan al inicio de cada idioma
  return (
    <Suspense fallback={<LangSwitchView {...props} rest="" />}>
      <LangSwitchLive {...props} />
    </Suspense>
  );
}

function LangSwitchLive(props: Props) {
  const rest = usePathname().split("/").slice(2).join("/");
  return <LangSwitchView {...props} rest={rest} />;
}

function LangSwitchView({ lang, label, rest }: Props & { rest: string }) {
  return (
    <nav
      aria-label={label}
      className="flex h-10 items-center rounded-xl border border-line bg-surface p-1 text-xs font-semibold"
    >
      {LOCALES.map((locale) => (
        <Link
          key={locale}
          href={`/${locale}${rest ? `/${rest}` : ""}`}
          hrefLang={locale}
          aria-current={locale === lang ? "true" : undefined}
          onClick={() => {
            document.cookie = `${LOCALE_COOKIE}=${locale}; path=/; max-age=31536000; SameSite=Lax`;
          }}
          className={`grid h-full place-items-center rounded-lg px-2.5 uppercase transition ${
            locale === lang ? "bg-accent text-accent-fg" : "text-muted hover:text-fg"
          }`}
        >
          {locale}
        </Link>
      ))}
    </nav>
  );
}
