"use client";

import { useMemo, useState, useRef } from "react";
import { useMountEffect } from "@/hooks/use-mount-effect";

const DURATION = 1200;
const FPS = 30;

interface AnimatedCountProps {
  value: number;
  locale: string;
}

export function AnimatedCount({ value, locale }: AnimatedCountProps) {
  const [current, setCurrent] = useState(0);
  const rafRef = useRef(0);

  const formatter = useMemo(
    () => new Intl.NumberFormat(locale, { notation: "compact", maximumFractionDigits: 1 }),
    [locale],
  );

  useMountEffect(() => {
    const start = performance.now();
    const interval = 1000 / FPS;
    let last = 0;

    function tick(now: number) {
      if (now - last < interval) {
        rafRef.current = requestAnimationFrame(tick);
        return;
      }
      last = now;

      const elapsed = now - start;
      const progress = Math.min(elapsed / DURATION, 1);
      const eased = 1 - Math.pow(1 - progress, 3);

      setCurrent(Math.round(eased * value));

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(tick);
      }
    }

    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  });

  return (
    <span style={{ fontVariantNumeric: "tabular-nums" }}>
      {formatter.format(current)}
    </span>
  );
}
