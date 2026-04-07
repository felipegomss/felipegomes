import { routing } from "@/i18n/routing";
import { contact, UMAMI_WEBSITE_ID } from "@/lib/constants";
import { Analytics } from "@vercel/analytics/react";
import type { Metadata } from "next";
import { Providers } from "./components/providers";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations, setRequestLocale } from "next-intl/server";
import { Geist_Mono, JetBrains_Mono } from "next/font/google";
import Script from "next/script";
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
      languages: {
        ...Object.fromEntries(
          routing.locales.map((l) => [l, `${BASE_URL}/${l}`]),
        ),
        "x-default": `${BASE_URL}/${routing.defaultLocale}`,
      },
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
    description:
      "Full Stack Developer with 5+ years of experience. Specializing in React, TypeScript, Node.js and Next.js. Focused on frontend architecture, design systems and product delivery.",
    address: {
      "@type": "PostalAddress",
      addressLocality: "Salvador",
      addressRegion: "BA",
      addressCountry: "BR",
    },
    sameAs: [
      `https://${contact.linkedin}`,
      `https://${contact.github}`,
    ],
    image: `${BASE_URL}/felipe.jpeg`,
    knowsAbout: [
      "React", "TypeScript", "Next.js", "Node.js", "Angular",
      ".NET", "Go", "PostgreSQL", "AWS", "Docker", "CI/CD",
      "Design Systems", "Frontend Architecture",
    ],
    alumniOf: [
      {
        "@type": "EducationalOrganization",
        name: "USP/Esalq",
        department: "MBA in Software Engineering",
      },
      {
        "@type": "EducationalOrganization",
        name: "Faculdade Estácio",
        department: "Systems Analysis and Development",
      },
    ],
    worksFor: {
      "@type": "Organization",
      name: "Automind",
      address: {
        "@type": "PostalAddress",
        addressLocality: "Salvador",
        addressRegion: "BA",
        addressCountry: "BR",
      },
    },
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
      suppressHydrationWarning
    >
      <head>
        <PersonJsonLd locale={locale} />
        <Script
          defer
          src="/u/script.js"
          data-website-id={UMAMI_WEBSITE_ID}
          strategy="afterInteractive"
        />
        <Script
          id="umami-events"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `document.addEventListener("click",function(e){var t=e.target.closest("[data-umami-event]");if(t&&window.umami){var n=t.dataset.umamiEvent,d={};for(var k in t.dataset)k.startsWith("umamiEvent")&&k!=="umamiEvent"&&(d[k.slice(10).toLowerCase()]=t.dataset[k]);umami.track(n,Object.keys(d).length?d:undefined)}})`,
          }}
        />
      </head>
      <body>
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-99999 focus:rounded focus:bg-background focus:px-4 focus:py-2 focus:text-sm focus:text-foreground focus:shadow-lg"
        >
          Skip to content
        </a>
        <Providers>
          <NextIntlClientProvider messages={messages}>
            <IntroScreen>{children}</IntroScreen>
          </NextIntlClientProvider>
        </Providers>
        <Analytics />
      </body>
    </html>
  );
}
