import { routing } from "@/i18n/routing";
import { Analytics } from "@vercel/analytics/react";
import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";
import { Geist_Mono, JetBrains_Mono } from "next/font/google";
import { notFound } from "next/navigation";
import { IntroScreen } from "./components/intro-screen";
import "./globals.css";

const headingFont = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-heading",
});

const bodyFont = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
});

export const metadata: Metadata = {
  title: "Luis Felipe N. Gomes — Full Stack Developer",
  description:
    "Full Stack · 5+ years · JS/TS, React, Node, Go · Product-minded, ships with CI/CD.",
  openGraph: {
    title: "LFNG — Full Stack Developer",
    description: "Luis Felipe N. Gomes · Full Stack · React, Node, Go, Angular",
    images: [{ url: "https://lfng.dev/og.png", width: 1200, height: 630 }],
    type: "website",
    url: "https://lfng.dev",
    siteName: "LFNG",
  },
  twitter: {
    card: "summary_large_image",
    title: "LFNG — Full Stack Developer",
    description: "Luis Felipe N. Gomes · Full Stack · React, Node, Go, Angular",
    images: ["https://lfng.dev/og.png"],
  },
};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function RootLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!routing.locales.includes(locale as (typeof routing.locales)[number])) {
    notFound();
  }

  setRequestLocale(locale);
  const messages = await getMessages();

  return (
    <html
      lang={locale}
      className={`${bodyFont.variable} ${headingFont.variable}`}
    >
      <body>
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-99999 focus:rounded focus:bg-background focus:px-4 focus:py-2 focus:text-sm focus:text-foreground focus:shadow-lg"
        >
          Skip to content
        </a>
        <NextIntlClientProvider messages={messages}>
          <IntroScreen>{children}</IntroScreen>
        </NextIntlClientProvider>
        <Analytics />
      </body>
    </html>
  );
}
