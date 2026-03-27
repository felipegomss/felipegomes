"use client";

import { useLocale } from "next-intl";
import { useRouter, usePathname } from "@/i18n/navigation";

export function LocaleSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  const next = locale === "pt-BR" ? "en" : "pt-BR";
  const label = locale === "pt-BR" ? "EN" : "PT";
  const ariaLabel =
    locale === "pt-BR"
      ? "Switch language to English"
      : "Mudar idioma para Português";

  return (
    <button
      onClick={() => router.replace(pathname, { locale: next })}
      aria-label={ariaLabel}
      className="rounded px-1 py-0.5 text-xs font-bold text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
    >
      {label}
    </button>
  );
}
