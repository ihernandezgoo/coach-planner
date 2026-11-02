"use client";

import { useLayoutEffect } from "react";
import { MoonIcon, SunIcon } from "./icons";

function currentTheme() {
  return document.documentElement.getAttribute("data-theme") === "dark" ? "dark" : "light";
}

export function ThemeToggle({ label }: { label: string }) {
  // React borra el atributo al remontar en desarrollo; lo volvemos a aplicar antes del pintado.
  useLayoutEffect(() => {
    try {
      const saved = localStorage.getItem("theme");
      if (saved === "light" || saved === "dark") {
        document.documentElement.setAttribute("data-theme", saved);
      }
    } catch {}
  }, []);

  function toggle() {
    const next = currentTheme() === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", next);
    try {
      localStorage.setItem("theme", next);
    } catch {}
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={label}
      title={label}
      className="grid size-10 place-items-center rounded-xl border border-line bg-surface text-muted transition hover:bg-surface-2 hover:text-fg focus-visible:ring-4 focus-visible:ring-ring focus-visible:outline-none"
    >
      <SunIcon className="hidden dark:block" />
      <MoonIcon className="block dark:hidden" />
    </button>
  );
}
