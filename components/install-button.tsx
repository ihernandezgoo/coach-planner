"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import { CloseIcon, DownloadIcon, ShareIcon } from "./icons";

// Evento que Chrome/Edge/Android lanzan cuando la app se puede instalar (no estándar, sin tipos en TS)
type InstallPromptEvent = Event & { prompt: () => Promise<void> };

const noop = () => () => {};

function subscribeDisplayMode(callback: () => void) {
  const media = matchMedia("(display-mode: standalone)");
  media.addEventListener("change", callback);
  return () => media.removeEventListener("change", callback);
}

function isStandalone() {
  return (
    matchMedia("(display-mode: standalone)").matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

function isIOS() {
  // iPadOS se presenta como Mac, pero con pantalla táctil
  return /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
}

/**
 * Chrome, Edge y Android: abre el diálogo nativo de instalación.
 * iPhone/iPad: Safari no permite instalar desde código, así que se explican los pasos.
 * En el resto de navegadores, o si la app ya está instalada, no se muestra nada.
 */
export function InstallButton({ dict, variant }: { dict: Dictionary["install"]; variant: "full" | "icon" }) {
  const standalone = useSyncExternalStore(subscribeDisplayMode, isStandalone, () => false);
  const ios = useSyncExternalStore(noop, isIOS, () => false);
  const [promptEvent, setPromptEvent] = useState<InstallPromptEvent | null>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const onPrompt = (e: Event) => {
      e.preventDefault(); // guardar el evento para lanzarlo desde nuestro botón
      setPromptEvent(e as InstallPromptEvent);
    };
    const onInstalled = () => setPromptEvent(null);
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  if (standalone || (!promptEvent && !ios)) return null;

  async function install() {
    if (promptEvent) {
      await promptEvent.prompt();
      setPromptEvent(null); // el evento solo se puede usar una vez
    } else {
      dialogRef.current?.showModal();
    }
  }

  return (
    <>
      {variant === "full" ? (
        <button type="button" onClick={install} className="btn-ghost w-full">
          <DownloadIcon width={16} height={16} />
          {dict.button}
        </button>
      ) : (
        <button
          type="button"
          onClick={install}
          aria-label={dict.button}
          title={dict.button}
          className="grid size-10 place-items-center rounded-xl border border-line bg-surface text-muted transition hover:bg-surface-2 hover:text-fg"
        >
          <DownloadIcon />
        </button>
      )}

      {ios && (
        <dialog
          ref={dialogRef}
          aria-labelledby="install-title"
          onClick={(e) => e.target === e.currentTarget && e.currentTarget.close()}
          className="m-auto w-[calc(100%-2rem)] max-w-sm rounded-2xl border border-line bg-surface p-0 text-fg shadow-2xl backdrop:bg-black/50 backdrop:backdrop-blur-sm"
        >
          <div className="flex items-center justify-between gap-4 border-b border-line p-5">
            <h2 id="install-title" className="text-lg font-semibold">
              {dict.iosTitle}
            </h2>
            <button
              type="button"
              onClick={() => dialogRef.current?.close()}
              aria-label={dict.close}
              className="grid size-9 shrink-0 place-items-center rounded-lg text-muted transition hover:bg-surface-2 hover:text-fg"
            >
              <CloseIcon />
            </button>
          </div>
          <ol className="space-y-4 p-5 text-sm">
            {[dict.iosStep1, dict.iosStep2, dict.iosStep3].map((paso, i) => (
              <li key={i} className="flex gap-3">
                <span className="grid size-7 shrink-0 place-items-center rounded-full bg-accent-soft text-xs font-bold text-accent">
                  {i + 1}
                </span>
                <span className="pt-1">
                  {paso}
                  {i === 0 && <ShareIcon width={16} height={16} className="ml-1.5 inline text-sky-500" />}
                </span>
              </li>
            ))}
          </ol>
        </dialog>
      )}
    </>
  );
}
