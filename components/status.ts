import type { EstadoJugador } from "@/lib/types";

export const ESTADO_STYLES: Record<EstadoJugador, { bar: string; chip: string }> = {
  etorri_da: {
    bar: "bg-emerald-500",
    chip: "bg-emerald-500/12 text-emerald-700 dark:text-emerald-300",
  },
  falta: {
    bar: "bg-rose-500",
    chip: "bg-rose-500/12 text-rose-700 dark:text-rose-300",
  },
  lesioa: {
    bar: "bg-amber-500",
    chip: "bg-amber-500/15 text-amber-800 dark:text-amber-300",
  },
  gaixo: {
    bar: "bg-orange-500",
    chip: "bg-orange-500/15 text-orange-800 dark:text-orange-300",
  },
  medikua: {
    bar: "bg-violet-500",
    chip: "bg-violet-500/12 text-violet-700 dark:text-violet-300",
  },
  ikasten: {
    bar: "bg-sky-500",
    chip: "bg-sky-500/12 text-sky-700 dark:text-sky-300",
  },
};
