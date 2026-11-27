import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/auth";
import { appMetadata, appViewport } from "@/lib/app-metadata";
import { AppShell } from "@/components/app-shell";
import { getNavBadges } from "@/lib/home/badges";

export const metadata = appMetadata;
export const viewport = appViewport;

export default async function AdminShellLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!(await isAdmin())) {
    redirect(`/${locale}/admin/login`);
  }

  return <AppShell badges={await getNavBadges(locale)}>{children}</AppShell>;
}
