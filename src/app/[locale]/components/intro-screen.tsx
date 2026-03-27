"use client";

import { useDecryptAnimation } from "@/hooks/use-decrypt-animation";
import { contact } from "@/lib/constants";

export function IntroScreen({ children }: { children: React.ReactNode }) {
  const { phase, display, isLocked, isHolding } = useDecryptAnimation();

  if (phase === "done") return children;

  return (
    <>
      <div
        aria-hidden="true"
        className={`fixed inset-0 z-9999 flex items-center justify-center bg-neutral-950 transition-opacity duration-700 ${
          phase === "fading" ? "pointer-events-none opacity-0" : "opacity-100"
        }`}
        suppressHydrationWarning
      >
        <div className="flex gap-0.5" suppressHydrationWarning>
          {display.map((char, i) => (
            <span
              key={i}
              suppressHydrationWarning
              className={`font-heading text-6xl font-black tracking-tight transition-colors duration-150 md:text-9xl ${
                isLocked(i) || isHolding() ? "text-white" : "text-white/20"
              }`}
              style={{
                fontVariantNumeric: "tabular-nums",
                width: "1ch",
                display: "inline-block",
                textAlign: "center",
              }}
            >
              {char}
            </span>
          ))}
        </div>

        <div
          className="absolute bottom-8 text-xs tracking-widest text-white/10"
          lang="pt-BR"
        >
          {contact.name.toUpperCase()}
        </div>
      </div>
      <div
        className={
          phase === "fading"
            ? "opacity-100 transition-opacity duration-700"
            : "opacity-0"
        }
      >
        {children}
      </div>
    </>
  );
}
