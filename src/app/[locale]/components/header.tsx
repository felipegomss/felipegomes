import { Suspense } from "react";
import Link from "next/link";
import { CommandMenu } from "./command-menu";
import { HeaderWrapper } from "./header-wrapper";
import { LocaleSwitcher } from "./locale-switcher";
import { PageViews } from "./page-views";
import { ThemeToggle } from "./theme-toggle";

export function Header({ locale }: { locale: string }) {
  return (
    <HeaderWrapper>
      <Suspense fallback={null}>
        <PageViews locale={locale} />
      </Suspense>

      <div className="flex items-center gap-3">
        <Link
          href={`/${locale}/blog`}
          className="text-xs text-muted-foreground transition-colors hover:text-foreground"
        >
          blog
        </Link>
        <span className="h-3 w-px bg-border" aria-hidden="true" />
        <ThemeToggle />
        <span className="h-3 w-px bg-border" aria-hidden="true" />
        <LocaleSwitcher />
        <span className="h-3 w-px bg-border" aria-hidden="true" />
        <CommandMenu />
      </div>
    </HeaderWrapper>
  );
}
