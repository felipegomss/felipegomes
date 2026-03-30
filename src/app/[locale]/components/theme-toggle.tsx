"use client";

import { Sun, Moon } from "lucide-react";
import { useMountEffect } from "@/hooks/use-mount-effect";
import { useThemeTransition } from "@/hooks/use-theme-transition";
import { useState } from "react";

export function ThemeToggle() {
  const { resolvedTheme, toggleTheme } = useThemeTransition();
  const [mounted, setMounted] = useState(false);

  useMountEffect(() => setMounted(true));

  if (!mounted) return <span className="size-4" />;

  return (
    <button
      onClick={toggleTheme}
      aria-label={resolvedTheme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
      className="cursor-pointer text-muted-foreground transition-colors hover:text-foreground"
    >
      {resolvedTheme === "dark" ? (
        <Sun size={14} aria-hidden="true" />
      ) : (
        <Moon size={14} aria-hidden="true" />
      )}
    </button>
  );
}
