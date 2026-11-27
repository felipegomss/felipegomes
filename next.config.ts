import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
  allowedDevOrigins: ["192.168.18.32"],
  // Metadados sempre no <head> do HTML inicial (sem streaming). O iOS lê o
  // apple-touch-icon do HTML ao "Adicionar à Tela de Início"; com streaming,
  // páginas dinâmicas (pets) mandavam as tags só depois.
  htmlLimitedBots: /.*/,
  experimental: {
    optimizePackageImports: [
      "nucleo-arcade",
      "nucleo-isometric",
      "nucleo-social-media",
      "lucide-react",
      "cmdk",
    ],
  },
  async rewrites() {
    return [
      {
        source: "/u/api/send",
        destination: "https://gateway.umami.is/api/send",
      },
      {
        source: "/u/:path*",
        destination: "https://cloud.umami.is/:path*",
      },
    ];
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
        ],
      },
    ];
  },
};

export default withNextIntl(nextConfig);
