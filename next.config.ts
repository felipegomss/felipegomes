import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
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
        source: "/u/:path*",
        destination: "https://cloud.umami.is/:path*",
      },
    ];
  },
};

export default withNextIntl(nextConfig);
