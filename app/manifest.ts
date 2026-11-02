import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "Coach Planner",
    short_name: "Coach Planner",
    description: "Equipos, entrenamientos y asistencia · Taldeak, entrenamenduak eta asistentzia",
    // "/" redirige al idioma guardado (/es o /eu)
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "any",
    background_color: "#17233f",
    theme_color: "#17233f",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
