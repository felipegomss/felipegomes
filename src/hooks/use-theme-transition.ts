"use client";

import { useCallback } from "react";
import { useTheme } from "next-themes";

export function useThemeTransition() {
  const { resolvedTheme, setTheme } = useTheme();

  const toggleTheme = useCallback(() => {
    const next = resolvedTheme === "dark" ? "light" : "dark";

    if (!document.startViewTransition) {
      setTheme(next);
      return;
    }

    document.startViewTransition(() => {
      setTheme(next);
    });
  }, [resolvedTheme, setTheme]);

  return { resolvedTheme, toggleTheme };
}
