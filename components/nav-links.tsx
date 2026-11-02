"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense } from "react";
import type { Locale } from "@/lib/i18n/config";
import { HomeIcon, PlusIcon } from "./icons";

type Labels = { dashboard: string; newTeam: string };
type NavProps = { lang: Locale; labels: Labels };
type ViewProps = NavProps & { pathname: string };

function items(lang: Locale, labels: Labels, pathname: string) {
  return [
    { href: `/${lang}`, label: labels.dashboard, Icon: HomeIcon },
    { href: `/${lang}/equipos/nuevo`, label: labels.newTeam, Icon: PlusIcon },
  ].map((item) => ({ ...item, active: pathname === item.href }));
}

// usePathname() en rutas dinámicas solo se conoce en tiempo de petición:
// se prerenderiza sin estado activo y se resuelve dentro de <Suspense>.
function withPathname(View: (props: ViewProps) => React.ReactNode) {
  function Live(props: NavProps) {
    return <View {...props} pathname={usePathname()} />;
  }
  return function Nav(props: NavProps) {
    return (
      <Suspense fallback={<View {...props} pathname="" />}>
        <Live {...props} />
      </Suspense>
    );
  };
}

function SidebarNavView({ lang, labels, pathname }: ViewProps) {
  return (
    <nav className="flex flex-col gap-1">
      {items(lang, labels, pathname).map(({ href, label, Icon, active }) => (
        <Link
          key={href}
          href={href}
          aria-current={active ? "page" : undefined}
          className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
            active ? "bg-accent-soft text-accent" : "text-muted hover:bg-surface-2 hover:text-fg"
          }`}
        >
          <Icon />
          {label}
        </Link>
      ))}
    </nav>
  );
}

function BottomNavView({ lang, labels, pathname }: ViewProps) {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-surface/90 pb-[env(safe-area-inset-bottom)] backdrop-blur-lg lg:hidden">
      <div className="mx-auto grid max-w-md grid-cols-2">
        {items(lang, labels, pathname).map(({ href, label, Icon, active }) => (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={`flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium transition ${
              active ? "text-accent" : "text-muted"
            }`}
          >
            <Icon />
            {label}
          </Link>
        ))}
      </div>
    </nav>
  );
}

export const SidebarNav = withPathname(SidebarNavView);
export const BottomNav = withPathname(BottomNavView);
