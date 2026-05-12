import Link from "next/link";
import { setRequestLocale } from "next-intl/server";
import { ToolsSidebar } from "../components/tools/tools-sidebar";

export default async function ToolsLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <main
      id="main-content"
      className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-12"
    >
      <nav className="mb-6 flex items-center gap-2 text-2xs text-muted-foreground-subtle">
        <Link
          href={`/${locale}`}
          className="transition-colors hover:text-foreground"
        >
          ← lfng.dev
        </Link>
      </nav>

      <div className="lg:grid lg:grid-cols-[220px_1fr] lg:gap-12">
        <aside className="mb-8 lg:sticky lg:top-8 lg:mb-0 lg:h-fit lg:max-h-[calc(100vh-4rem)] lg:overflow-y-auto">
          <ToolsSidebar />
        </aside>
        <div className="min-w-0">{children}</div>
      </div>
    </main>
  );
}
