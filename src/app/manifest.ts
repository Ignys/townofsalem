import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Town of Salem Board Game Companion",
    short_name: "Salem Companion",
    description: "Companion para conduzir partidas presenciais de Town of Salem.",
    start_url: "/",
    display: "standalone",
    background_color: "#111315",
    theme_color: "#7d2330",
    orientation: "any",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
