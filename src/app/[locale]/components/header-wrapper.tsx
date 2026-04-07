"use client";

import { useState } from "react";
import { useMountEffect } from "@/hooks/use-mount-effect";

export function HeaderWrapper({ children }: { children: React.ReactNode }) {
  const [scrolled, setScrolled] = useState(false);

  useMountEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 0);
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  });

  return (
    <header
      className={`col-span-2 sticky top-0 z-50 hidden items-center justify-between border-b border-white/25 bg-background/10 px-6 py-3 backdrop-blur-sm backdrop-saturate-150 transition-shadow dark:border-white/10 dark:bg-background/5 md:flex ${
        scrolled ? "shadow-sm" : ""
      }`}
    >
      {children}
    </header>
  );
}
