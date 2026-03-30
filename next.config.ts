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
};

export default withNextIntl(nextConfig);
