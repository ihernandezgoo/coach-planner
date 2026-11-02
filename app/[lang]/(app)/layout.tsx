import Link from "next/link";
import { LangSwitch } from "@/components/lang-switch";
import { InstallButton } from "@/components/install-button";
import { Logo } from "@/components/logo";
import { BottomNav, SidebarNav } from "@/components/nav-links";
import { ThemeToggle } from "@/components/theme-toggle";
import { DEFAULT_LOCALE, isLocale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";

export default async function AppLayout({ children, params }: LayoutProps<"/[lang]">) {
  const { lang: raw } = await params;
  const lang = isLocale(raw) ? raw : DEFAULT_LOCALE;
  const dict = getDictionary(lang);

  return (
    <div className="lg:flex">
      {/* Escritorio: barra lateral */}
      <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 flex-col border-r border-line bg-surface px-4 py-6 lg:flex">
        <Link href={`/${lang}`} className="px-2">
          <Logo name={dict.appName} />
        </Link>
        <div className="mt-8 flex-1">
          <SidebarNav lang={lang} labels={dict.nav} />
        </div>
        <div className="space-y-3 border-t border-line pt-4">
          <InstallButton dict={dict.install} variant="full" />
          <div className="flex items-center gap-2">
            <LangSwitch lang={lang} label={dict.nav.language} />
            <ThemeToggle label={dict.nav.theme} />
          </div>
        </div>
      </aside>

      {/* Móvil: cabecera superior (respeta la muesca del móvil al abrirse como app instalada) */}
      <header className="sticky top-0 z-30 flex items-center justify-between gap-2 border-b border-line bg-surface/90 px-4 pt-[max(0.75rem,env(safe-area-inset-top))] pb-3 backdrop-blur-lg lg:hidden">
        <Link href={`/${lang}`} className="min-w-0">
          <Logo name={dict.appName} nameClassName="max-[380px]:sr-only" />
        </Link>
        <div className="flex items-center gap-2">
          <InstallButton dict={dict.install} variant="icon" />
          <LangSwitch lang={lang} label={dict.nav.language} />
          <ThemeToggle label={dict.nav.theme} />
        </div>
      </header>

      <main className="min-w-0 flex-1 px-4 pt-6 pb-28 sm:px-6 lg:px-10 lg:py-10">
        <div className="mx-auto max-w-6xl">{children}</div>
      </main>

      <BottomNav lang={lang} labels={dict.nav} />
    </div>
  );
}
