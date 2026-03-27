"use client";

import { useMountEffect } from "@/hooks/use-mount-effect";
import { useRef, useState } from "react";

const INITIAL = "CODE";
const TARGET = "LFNG";
const CHARS =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789@#$%&*!?<>{}[]=/\\|~^";
const SESSION_KEY = "lfng-intro-done";

/** Animation timing in ms. "fast" runs on revisits within the same session. */
const TIMING = {
  slow: { hold: 500, unlockStagger: 250, scramble: 1200, lockStagger: 300, fadeDelay: 600, fadeOut: 800 },
  fast: { hold: 200, unlockStagger: 100, scramble: 400, lockStagger: 120, fadeDelay: 200, fadeOut: 400 },
} as const;

function randomChar() {
  return CHARS[Math.floor(Math.random() * CHARS.length)];
}

function isRevisit() {
  try {
    return sessionStorage.getItem(SESSION_KEY) === "1";
  } catch {
    // sessionStorage may throw in private/incognito mode; silently degrade.
    return false;
  }
}

function markVisited() {
  try {
    sessionStorage.setItem(SESSION_KEY, "1");
  } catch {
    // sessionStorage may throw in private/incognito mode; silently degrade.
  }
}

export function IntroScreen({ children }: { children: React.ReactNode }) {
  const [phase, setPhase] = useState<"intro" | "fading" | "done">("intro");
  const [display, setDisplay] = useState(() => INITIAL.split(""));
  const lockedRef = useRef([false, false, false, false]);
  const stageRef = useRef<"hold" | "unlock" | "scramble" | "lock">("hold");
  const stageStartRef = useRef(0);
  const rafRef = useRef(0);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  useMountEffect(() => {
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (prefersReducedMotion) {
      markVisited();
      setDisplay(TARGET.split(""));
      setPhase("done");
      return;
    }

    const t = TIMING[isRevisit() ? "fast" : "slow"];

    const unlockedRef = [false, false, false, false];
    stageStartRef.current = Date.now();

    const tick = () => {
      const now = Date.now();
      const elapsed = now - stageStartRef.current;

      // phase 1: hold "CODE" then unlock letter by letter
      if (stageRef.current === "hold") {
        if (elapsed >= t.hold) {
          stageRef.current = "unlock";
          stageStartRef.current = now;
        } else {
          rafRef.current = requestAnimationFrame(tick);
          return;
        }
      }

      // phase 2: unlock CODE letters one by one into scramble
      if (stageRef.current === "unlock") {
        const unlockElapsed = now - stageStartRef.current;
        for (let i = 0; i < INITIAL.length; i++) {
          if (!unlockedRef[i] && unlockElapsed >= i * t.unlockStagger) {
            unlockedRef[i] = true;
          }
        }
        if (unlockedRef.every(Boolean)) {
          stageRef.current = "scramble";
          stageStartRef.current = now;
        }
      }

      // phase 3: pure scramble
      if (stageRef.current === "scramble") {
        if (now - stageStartRef.current >= t.scramble) {
          stageRef.current = "lock";
          stageStartRef.current = now;
        }
      }

      const lockElapsed =
        stageRef.current === "lock" ? now - stageStartRef.current : -1;

      const next: string[] = [];
      let allLocked = true;

      for (let i = 0; i < TARGET.length; i++) {
        if (lockedRef.current[i]) {
          next.push(TARGET[i]);
          continue;
        }

        if (lockElapsed >= 0 && lockElapsed >= i * t.lockStagger) {
          lockedRef.current[i] = true;
          next.push(TARGET[i]);
          continue;
        }

        // during unlock phase, show INITIAL for not-yet-unlocked letters
        if (stageRef.current === "unlock" && !unlockedRef[i]) {
          next.push(INITIAL[i]);
          allLocked = false;
          continue;
        }

        allLocked = false;
        next.push(randomChar());
      }

      setDisplay(next);

      if (allLocked) {
        markVisited();
        timersRef.current.push(
          setTimeout(() => setPhase("fading"), t.fadeDelay),
          setTimeout(() => setPhase("done"), t.fadeDelay + t.fadeOut),
        );
        return;
      }

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(rafRef.current);
      timersRef.current.forEach(clearTimeout);
    };
  });

  if (phase === "done") return children;

  return (
    <>
      <div
        aria-hidden="true"
        className={`fixed inset-0 z-9999 flex items-center justify-center bg-[#0a0a0a] transition-opacity duration-700 ${
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
                lockedRef.current[i] || stageRef.current === "hold"
                  ? "text-white"
                  : "text-white/20"
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
          className="absolute bottom-8 text-xs tracking-[0.3em] text-white/10"
          lang="pt-BR"
        >
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
