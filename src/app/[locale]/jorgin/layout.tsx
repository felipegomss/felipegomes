import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { isAdmin } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Jorgin",
  robots: { index: false, follow: false },
};

export default async function JorginLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!(await isAdmin())) {
    redirect(`/${locale}/admin/login?next=${encodeURIComponent(`/${locale}/jorgin`)}`);
  }

  return <AppShell>{children}</AppShell>;
}
