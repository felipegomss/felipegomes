import type { Metadata, Viewport } from "next";

/**
 * Metadados do app instalável (PWA). Vão só nas páginas privadas (admin,
 * login e pets), para o portfólio público não oferecer "instalar".
 */
export const appMetadata: Metadata = {
  manifest: "/app.webmanifest",
  robots: { index: false, follow: false },
  appleWebApp: { capable: true, title: "LFNG", statusBarStyle: "black" },
  icons: {
    icon: [{ url: "/app/icon-192.png", sizes: "192x192", type: "image/png" }],
    apple: [{ url: "/app/apple-touch-icon.png", sizes: "180x180" }],
  },
};

export const appViewport: Viewport = {
  themeColor: "#0a0a0a",
};
