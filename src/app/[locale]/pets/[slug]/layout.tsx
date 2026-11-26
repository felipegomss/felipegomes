import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { isAdmin } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Pets",
  robots: { index: false, follow: false },
};

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

  return <AppShell>{children}</AppShell>;
}
