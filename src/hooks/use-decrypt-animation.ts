"use client";

import { useRef, useState } from "react";
import { useMountEffect } from "./use-mount-effect";

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

type Phase = "intro" | "fading" | "done";
type Stage = "hold" | "unlock" | "scramble" | "lock";

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

export function useDecryptAnimation() {
  const [phase, setPhase] = useState<Phase>("intro");
  const [display, setDisplay] = useState(() => INITIAL.split(""));
  const lockedRef = useRef(Array.from({ length: TARGET.length }, () => false));
  const stageRef = useRef<Stage>("hold");
  const stageStartRef = useRef(0);
  const rafRef = useRef(0);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  useMountEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      markVisited();
      setDisplay(TARGET.split(""));
      setPhase("done");
      return;
    }

    const t = TIMING[isRevisit() ? "fast" : "slow"];
    const unlocked = Array.from({ length: TARGET.length }, () => false);
    stageStartRef.current = Date.now();

    const tick = () => {
      const now = Date.now();
      const elapsed = now - stageStartRef.current;

      if (stageRef.current === "hold") {
        if (elapsed < t.hold) {
          rafRef.current = requestAnimationFrame(tick);
          return;
        }
        stageRef.current = "unlock";
        stageStartRef.current = now;
      }

      if (stageRef.current === "unlock") {
        const dt = now - stageStartRef.current;
        for (let i = 0; i < INITIAL.length; i++) {
          if (!unlocked[i] && dt >= i * t.unlockStagger) unlocked[i] = true;
        }
        if (unlocked.every(Boolean)) {
          stageRef.current = "scramble";
          stageStartRef.current = now;
        }
      }

      if (stageRef.current === "scramble" && now - stageStartRef.current >= t.scramble) {
        stageRef.current = "lock";
        stageStartRef.current = now;
      }

      const lockDt = stageRef.current === "lock" ? now - stageStartRef.current : -1;
      const next: string[] = [];
      let allLocked = true;

      for (let i = 0; i < TARGET.length; i++) {
        if (lockedRef.current[i]) { next.push(TARGET[i]); continue; }
        if (lockDt >= 0 && lockDt >= i * t.lockStagger) { lockedRef.current[i] = true; next.push(TARGET[i]); continue; }
        if (stageRef.current === "unlock" && !unlocked[i]) { next.push(INITIAL[i]); allLocked = false; continue; }
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

  return {
    phase,
    display,
    isLocked: (i: number) => lockedRef.current[i],
    isHolding: () => stageRef.current === "hold",
  };
}
