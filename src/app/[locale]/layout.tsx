import { routing } from "@/i18n/routing";
import { contact } from "@/lib/constants";
import { Analytics } from "@vercel/analytics/react";
import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations, setRequestLocale } from "next-intl/server";
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

const BASE_URL = "https://lfng.dev";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "metadata" });

  return {
    metadataBase: new URL(BASE_URL),
    title: t("title"),
    description: t("description"),
    alternates: {
      canonical: `${BASE_URL}/${locale}`,
      languages: Object.fromEntries(
        routing.locales.map((l) => [l, `${BASE_URL}/${l}`]),
      ),
    },
    openGraph: {
      title: t("ogTitle"),
      description: t("ogDescription"),
      images: [{ url: `${BASE_URL}/og.png`, width: 1200, height: 630 }],
      type: "website",
      url: `${BASE_URL}/${locale}`,
      siteName: "LFNG",
      locale,
    },
    twitter: {
      card: "summary_large_image",
      title: t("ogTitle"),
      description: t("ogDescription"),
      images: [`${BASE_URL}/og.png`],
    },
  };
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

function PersonJsonLd({ locale }: { locale: string }) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: contact.name,
    url: `${BASE_URL}/${locale}`,
    jobTitle: "Full Stack Developer",
    sameAs: [
      `https://${contact.linkedin}`,
      `https://${contact.github}`,
    ],
    image: `${BASE_URL}/felipe.jpeg`,
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
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
      <head>
        <PersonJsonLd locale={locale} />
        <script
          defer
          src="https://cloud.umami.is/script.js"
          data-website-id="96008e50-f747-41e3-8a97-826e10485213"
          data-auto-track="true"
        />
      </head>
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
