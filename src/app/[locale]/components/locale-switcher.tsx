"use client";

import { useLocale } from "next-intl";
import { useRouter, usePathname } from "@/i18n/navigation";

export function LocaleSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  const next = locale === "pt-BR" ? "en" : "pt-BR";
  const label = locale === "pt-BR" ? "EN" : "PT";

  return (
    <button
      onClick={() => router.replace(pathname, { locale: next })}
      className="text-xs font-bold text-muted-foreground transition-colors hover:text-foreground"
    >
      {label}
    </button>
  );
}
