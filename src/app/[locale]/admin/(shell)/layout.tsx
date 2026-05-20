import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";

export default async function AdminShellLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const session = (await cookies()).get("admin_session");

  if (!session || session.value !== process.env.ADMIN_PASSWORD) {
    redirect(`/${locale}/admin/login`);
  }

  return <AppShell>{children}</AppShell>;
}
