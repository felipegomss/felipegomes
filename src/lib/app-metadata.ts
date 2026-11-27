import type { Metadata, Viewport } from "next";

/**
 * Telas de abertura do iPhone (primeiro quadro da animação "CODE → LFNG"),
 * geradas por scripts/generate-app-icons.mjs. O iOS escolhe pela media query.
 * [largura, altura, densidade] em pontos, retrato.
 */
const SPLASHES: [number, number, number][] = [
  [440, 956, 3],
  [430, 932, 3],
  [428, 926, 3],
  [420, 912, 3],
  [402, 874, 3],
  [393, 852, 3],
  [390, 844, 3],
  [375, 812, 3],
  [414, 896, 2],
  [375, 667, 2],
];

const startupImage = SPLASHES.map(([w, h, dpr]) => ({
  url: `/app/splash/splash-${w * dpr}x${h * dpr}.png`,
  media: `(device-width: ${w}px) and (device-height: ${h}px) and (-webkit-device-pixel-ratio: ${dpr}) and (orientation: portrait)`,
}));

/**
 * Metadados do app instalável (PWA). Vão só nas páginas privadas (admin,
 * login e pets), para o portfólio público não oferecer "instalar".
 */
export const appMetadata: Metadata = {
  manifest: "/app.webmanifest",
  robots: { index: false, follow: false },
  appleWebApp: { capable: true, title: "LFNG", statusBarStyle: "black", startupImage },
  icons: {
    icon: [{ url: "/app/icon-192.png", sizes: "192x192", type: "image/png" }],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180" }],
  },
};

export const appViewport: Viewport = {
  themeColor: "#0a0a0a",
};
