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
      className={`col-span-2 sticky top-0 z-50 hidden items-center justify-between border-b border-foreground/10 bg-background/60 supports-backdrop-filter:bg-background/20 px-6 py-3 backdrop-blur-md backdrop-saturate-150 transition-shadow md:flex ${
        scrolled ? "shadow-sm" : ""
      }`}
    >
      {children}
    </header>
  );
}
