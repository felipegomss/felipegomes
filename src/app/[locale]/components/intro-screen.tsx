"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const TARGET = "LFNG";
const CHARS =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789@#$%&*!?<>{}[]=/\\|~^";
const SESSION_KEY = "lfng-intro-done";

function randomChar() {
  return CHARS[Math.floor(Math.random() * CHARS.length)];
}

function isRevisit() {
  try {
    return sessionStorage.getItem(SESSION_KEY) === "1";
  } catch {
    return false;
  }
}

function markVisited() {
  try {
    sessionStorage.setItem(SESSION_KEY, "1");
  } catch {}
}

export function IntroScreen({ children }: { children: React.ReactNode }) {
  const [phase, setPhase] = useState<"intro" | "fading" | "done">("intro");
  const [display, setDisplay] = useState(() => TARGET.split(""));
  const lockedRef = useRef(new Array(TARGET.length).fill(false) as boolean[]);
  const startRef = useRef(0);
  const rafRef = useRef(0);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const fastRef = useRef(false);

  const animate = useCallback(() => {
    const fast = fastRef.current;
    const scrambleDuration = fast ? 600 : 2000;
    const lockStagger = fast ? 120 : 350;
    const fadeDelay = fast ? 200 : 600;

    const elapsed = Date.now() - startRef.current;

    const next = Array.from({ length: TARGET.length }, (_, i) => {
      if (lockedRef.current[i]) return TARGET[i];
      const lockAt = scrambleDuration + i * lockStagger;
      if (elapsed >= lockAt) {
        lockedRef.current[i] = true;
        return TARGET[i];
      }
      return randomChar();
    });

    setDisplay(next);

    if (lockedRef.current.every(Boolean)) {
      markVisited();
      timersRef.current.push(
        setTimeout(() => setPhase("fading"), fadeDelay),
        setTimeout(() => setPhase("done"), fadeDelay + (fast ? 400 : 800)),
      );
      return;
    }

    rafRef.current = requestAnimationFrame(animate);
  }, []);

  useEffect(() => {
    fastRef.current = isRevisit();
    startRef.current = Date.now();
    rafRef.current = requestAnimationFrame(animate);
    return () => {
      cancelAnimationFrame(rafRef.current);
      timersRef.current.forEach(clearTimeout);
    };
  }, [animate]);

  if (phase === "done") return children;

  return (
    <>
      <div
        className={`fixed inset-0 z-[9999] flex items-center justify-center bg-[#0a0a0a] transition-opacity duration-700 ${
          phase === "fading" ? "pointer-events-none opacity-0" : "opacity-100"
        }`}
        suppressHydrationWarning
      >
        <div className="flex gap-[2px]" suppressHydrationWarning>
          {display.map((char, i) => (
            <span
              key={i}
              suppressHydrationWarning
              className={`font-heading text-6xl font-black tracking-tight transition-colors duration-150 md:text-9xl ${
                lockedRef.current[i] ? "text-white" : "text-white/20"
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

        <div className="absolute bottom-8 text-xs tracking-[0.3em] text-white/10">
          LUIS FELIPE NASCIMENTO GOMES
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
