import "./globals.css";
import type { Metadata } from "next";
import { Inter } from "next/font/google";

import { useLocale } from "next-intl";
import { notFound } from "next/navigation";

import { Analytics } from "@vercel/analytics/react";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Felipe Gomes",
  description: "Seu proximo dev front end!",
};

export default function RootLayout({ children, params }: any) {
  const locale = useLocale();

  // Show a 404 error if the user requests an unknown locale
  if (params.locale !== locale) {
    notFound();
  }
  return (
    <html lang={locale}>
      <body className={inter.className}>{children}</body>
      <Analytics />
    </html>
  );
}
