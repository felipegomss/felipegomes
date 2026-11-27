import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/auth";
import { AppShell } from "@/components/app-shell";

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

  return <AppShell>{children}</AppShell>;
}
