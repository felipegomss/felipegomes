"use client";

import { useCallback, useRef, useState } from "react";
import { useRouter } from "@/i18n/navigation";
import { useLocale, useTranslations } from "next-intl";
import { useThemeTransition } from "@/hooks/use-theme-transition";
import {
  BookOpen,
  CornerDownLeft,
  Download,
  Globe,
  Headphones,
  Mail,
  Moon,
  Phone,
  Search,
  Sun,
} from "lucide-react";
import { IconOpenAI, IconAnthropic, IconGemini } from "./ai-icons";
import { IconGithub, IconLinkedin, IconWhatsapp, IconXTwitter } from "nucleo-social-media";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command";
import { Kbd } from "@/components/ui/kbd";
import { contact, CV_FILENAME, PLAYLIST_URL } from "@/lib/constants";
import { useMountEffect } from "@/hooks/use-mount-effect";
import { playKeybindSound } from "@/hooks/use-keybind-sound";

export function CommandMenu() {
  const [open, setOpen] = useState(false);
  const [isApplePlatform, setIsApplePlatform] = useState<boolean | null>(null);
  const t = useTranslations("command");
  const locale = useLocale();
  const router = useRouter();
  const { resolvedTheme, toggleTheme } = useThemeTransition();
  const toggleThemeRef = useRef(toggleTheme);
  toggleThemeRef.current = toggleTheme;

  useMountEffect(() => {
    const platform = navigator.platform || navigator.userAgent;
    const applePlatform = /mac|iphone|ipad|ipod/i.test(platform);
    setIsApplePlatform(applePlatform);
    function onKeyDown(e: KeyboardEvent) {
      const key = e.key.toLowerCase();
      const preferenceModifierPressed = applePlatform ? e.ctrlKey && e.metaKey : e.ctrlKey && e.altKey;

      if ((e.metaKey || e.ctrlKey) && key === "k") {
        e.preventDefault();
        playKeybindSound();
        setOpen((o) => !o);
        return;
      }
      if (preferenceModifierPressed && key === "t") {
        e.preventDefault();
        playKeybindSound();
        toggleThemeRef.current();
        return;
      }
      if (preferenceModifierPressed && key === "l") {
        e.preventDefault();
        playKeybindSound();
        const next = document.documentElement.lang === "pt-BR" ? "en" : "pt-BR";
        router.replace("/", { locale: next });
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  });

  const run = useCallback(
    (fn: () => void) => {
      setOpen(false);
      fn();
    },
    [],
  );

  const nextLocale = locale === "pt-BR" ? "en" : "pt-BR";
  const themeShortcutLabel =
    isApplePlatform === null ? "⌃⌘T / Ctrl+Alt+T" : isApplePlatform ? "⌃⌘T" : "Ctrl+Alt+T";
  const localeShortcutLabel =
    isApplePlatform === null ? "⌃⌘L / Ctrl+Alt+L" : isApplePlatform ? "⌃⌘L" : "Ctrl+Alt+L";

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        aria-label="Open command menu (⌘K)"
        className="flex cursor-pointer items-center gap-1.5 text-muted-foreground transition-colors hover:text-foreground"
      >
        <Search size={12} aria-hidden="true" />
        <span className="flex items-center gap-0.5">
          <Kbd>⌘</Kbd>
          <Kbd>K</Kbd>
        </span>
      </button>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder={t("placeholder")} />
        <CommandList>
          <CommandEmpty>{t("empty")}</CommandEmpty>

          <CommandGroup heading={t("navigate")}>
            <CommandItem onSelect={() => run(() => router.push("/blog"))}>
              <BookOpen />
              {t("blogLink")}
            </CommandItem>
          </CommandGroup>

          <CommandSeparator />

          <CommandGroup heading={t("askAi")}>
            <CommandItem onSelect={() => run(() => window.open(`https://chatgpt.com/?q=${encodeURIComponent(t("aiPrompt"))}`, "_blank"))}>
              <IconOpenAI />
              ChatGPT
            </CommandItem>
            <CommandItem onSelect={() => run(() => window.open(`https://claude.ai/new?q=${encodeURIComponent(t("aiPrompt"))}`, "_blank"))}>
              <IconAnthropic />
              Claude
            </CommandItem>
            <CommandItem onSelect={() => run(() => window.open(`https://gemini.google.com/?q=${encodeURIComponent(t("aiPrompt"))}`, "_blank"))}>
              <IconGemini />
              Gemini
            </CommandItem>
            <CommandItem onSelect={() => run(() => window.open(`https://grok.com/?q=${encodeURIComponent(t("aiPrompt"))}`, "_blank"))}>
              <IconXTwitter size={16} />
              Grok
            </CommandItem>
          </CommandGroup>

          <CommandSeparator />

          <CommandGroup heading={t("vibes")}>
            <CommandItem onSelect={() => run(() => window.open(PLAYLIST_URL, "_blank"))}>
              <Headphones />
              Slow Flow — Apple Music
            </CommandItem>
          </CommandGroup>

          <CommandSeparator />

          <CommandGroup heading={t("actions")}>
            <CommandItem onSelect={() => run(() => {
              const a = document.createElement("a");
              a.href = `/cv/${CV_FILENAME}_${locale}.pdf`;
              a.download = "";
              a.click();
            })}>
              <Download />
              {t("downloadCv")}
            </CommandItem>
            <CommandItem onSelect={() => run(() => window.open(`mailto:${locale === "pt-BR" ? "ola" : "hi"}@lfng.dev`))}>
              <Mail />
              {t("sendEmail")}
            </CommandItem>
            <CommandItem onSelect={() => run(() => window.open(`https://wa.me/${contact.phoneDigits}`, "_blank"))}>
              <IconWhatsapp size={16} />
              WhatsApp
            </CommandItem>
            <CommandItem onSelect={() => run(() => window.open(`tel:+${contact.phoneDigits}`))}>
              <Phone />
              {t("call")}
            </CommandItem>
          </CommandGroup>

          <CommandSeparator />

          <CommandGroup heading={t("social")}>
            <CommandItem onSelect={() => run(() => window.open(`https://${contact.linkedin}`, "_blank"))}>
              <IconLinkedin size={16} />
              LinkedIn
            </CommandItem>
            <CommandItem onSelect={() => run(() => window.open(`https://${contact.github}`, "_blank"))}>
              <IconGithub size={16} />
              GitHub
            </CommandItem>
          </CommandGroup>

          <CommandSeparator />

          <CommandGroup heading={t("preferences")}>
            <CommandItem onSelect={() => run(toggleTheme)}>
              {resolvedTheme === "dark" ? <Sun /> : <Moon />}
              {resolvedTheme === "dark" ? t("lightMode") : t("darkMode")}
              <CommandShortcut>{themeShortcutLabel}</CommandShortcut>
            </CommandItem>
            <CommandItem onSelect={() => run(() => router.replace("/", { locale: nextLocale }))}>
              <Globe />
              {t("switchLocale")}
              <CommandShortcut>{localeShortcutLabel}</CommandShortcut>
            </CommandItem>
          </CommandGroup>
        </CommandList>

        <div className="flex items-center justify-between border-t border-border px-3 py-2">
          <span className="font-heading text-xs font-black tracking-tight text-muted-foreground-subtle">
            LFNG
          </span>
          <div className="flex items-center gap-3 text-2xs text-muted-foreground">
            <span className="flex items-center gap-1">
              {t("select")}
              <Kbd><CornerDownLeft size={10} /></Kbd>
            </span>
            <span className="h-3 w-px bg-border" aria-hidden="true" />
            <span className="flex items-center gap-1">
              {t("exit")}
              <Kbd>Esc</Kbd>
            </span>
          </div>
        </div>
      </CommandDialog>
    </>
  );
}
