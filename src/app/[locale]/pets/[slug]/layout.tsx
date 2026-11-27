import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { getNavBadges } from "@/lib/home/badges";
import { isAdmin } from "@/lib/auth";
import { appMetadata, appViewport } from "@/lib/app-metadata";

export const metadata: Metadata = { ...appMetadata, title: "Pets" };
export const viewport = appViewport;

export default async function PetLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;

  // O proxy já barra; isto cobre renderizações que não passam por ele.
  if (!(await isAdmin())) {
    redirect(`/${locale}/admin/login?next=${encodeURIComponent(`/${locale}/pets/${slug}`)}`);
  }

  return <AppShell badges={getNavBadges(locale)}>{children}</AppShell>;
}
