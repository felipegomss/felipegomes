"use client";

import { useState } from "react";
import { Menu, X, Sun, Moon, Globe } from "lucide-react";
import { useThemeTransition } from "@/hooks/use-theme-transition";
import { useRouter } from "@/i18n/navigation";
import { useLocale } from "next-intl";
import { playKeybindSound } from "@/hooks/use-keybind-sound";

export function MobileFab() {
  const [open, setOpen] = useState(false);
  const { resolvedTheme, toggleTheme } = useThemeTransition();
  const router = useRouter();
  const locale = useLocale();

  const actions = [
    {
      icon: resolvedTheme === "dark" ? <Sun size={18} /> : <Moon size={18} />,
      label: resolvedTheme === "dark" ? "Light" : "Dark",
      onClick: () => {
        playKeybindSound();
        toggleTheme();
        setOpen(false);
      },
    },
    {
      icon: <Globe size={18} />,
      label: locale === "pt-BR" ? "EN" : "PT",
      onClick: () => {
        playKeybindSound();
        router.replace("/", { locale: locale === "pt-BR" ? "en" : "pt-BR" });
        setOpen(false);
      },
    },
  ];

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-2 md:hidden">
      {open &&
        actions.map((action) => (
          <button
            key={action.label}
            type="button"
            onClick={action.onClick}
            aria-label={action.label}
            className="flex size-10 items-center justify-center rounded-full border border-border bg-background text-foreground shadow-lg transition-transform animate-in fade-in slide-in-from-bottom-2"
          >
            {action.icon}
          </button>
        ))}

      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label={open ? "Close menu" : "Open menu"}
        className="flex size-12 items-center justify-center rounded-full bg-foreground text-background shadow-lg"
      >
        {open ? <X size={20} /> : <Menu size={20} />}
      </button>
    </div>
  );
}
