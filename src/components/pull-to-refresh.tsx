"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { RefreshCwIcon } from "lucide-react";
import { cn } from "@/lib/utils";

const THRESHOLD = 64; // px de puxada (já com resistência) para atualizar
const MAX = 96;

/** Dentro de algo que ainda pode rolar para cima, ou de uma janela aberta? */
function blocked(target: EventTarget | null) {
  if (document.querySelector('[role="dialog"], [role="menu"], [role="listbox"]')) return true;
  for (let el = target as HTMLElement | null; el && el !== document.body; el = el.parentElement) {
    if (el.scrollTop > 0) return true;
  }
  return false;
}

/**
 * Puxar para atualizar no celular. Instalado na tela de início, o iOS não tem
 * esse gesto; aqui ele recarrega os dados da tela atual sem perder o que está
 * digitado.
 */
export function PullToRefresh() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [pull, setPull] = useState(0);
  const [holding, setHolding] = useState(false);
  const busy = useRef(false);
  busy.current = pending || holding;

  useEffect(() => {
    if (!window.matchMedia("(pointer: coarse)").matches) return;
    let tracking = false;
    let active = false;
    let x0 = 0;
    let y0 = 0;
    let dist = 0;

    const start = (e: TouchEvent) => {
      active = false;
      dist = 0;
      tracking = e.touches.length === 1 && window.scrollY <= 0 && !busy.current && !blocked(e.target);
      if (tracking) {
        x0 = e.touches[0].clientX;
        y0 = e.touches[0].clientY;
      }
    };
    const move = (e: TouchEvent) => {
      if (!tracking) return;
      const dx = e.touches[0].clientX - x0;
      const dy = e.touches[0].clientY - y0;
      if (!active) {
        if (dy <= 0 || Math.abs(dx) > dy || window.scrollY > 0) {
          if (dy < 0 || Math.abs(dx) > 8) tracking = false;
          return;
        }
        active = true;
      }
      // Segura a rolagem elástica do iOS enquanto o indicador desce.
      if (e.cancelable) e.preventDefault();
      dist = Math.max(0, Math.min(MAX, dy * 0.5));
      setPull(dist);
    };
    const end = () => {
      if (active && dist >= THRESHOLD) {
        // Fica visível por um instante mesmo se os dados voltarem na hora.
        setHolding(true);
        setTimeout(() => setHolding(false), 600);
        startTransition(() => router.refresh());
      }
      tracking = active = false;
      setPull(0);
    };

    window.addEventListener("touchstart", start, { passive: true });
    window.addEventListener("touchmove", move, { passive: false });
    window.addEventListener("touchend", end);
    window.addEventListener("touchcancel", end);
    return () => {
      window.removeEventListener("touchstart", start);
      window.removeEventListener("touchmove", move);
      window.removeEventListener("touchend", end);
      window.removeEventListener("touchcancel", end);
    };
  }, [router]);

  const loading = pending || holding;
  const y = loading ? 56 : pull;
  if (!loading && pull === 0) return <span aria-live="polite" className="sr-only" />;

  return (
    <div
      className="pointer-events-none fixed inset-x-0 top-[env(safe-area-inset-top)] z-50 flex justify-center md:hidden"
      style={{ transform: `translate3d(0, ${y - 44}px, 0)`, transition: pull ? "none" : "transform 200ms ease-out" }}
    >
      <span className="grid size-10 place-items-center rounded-full border bg-background shadow-md">
        <RefreshCwIcon
          aria-hidden="true"
          className={cn("size-4", loading && "animate-spin", !loading && pull < THRESHOLD && "text-muted-foreground")}
          style={loading ? undefined : { transform: `rotate(${pull * 4}deg)` }}
        />
      </span>
      <span aria-live="polite" className="sr-only">
        {loading ? "Atualizando…" : ""}
      </span>
    </div>
  );
}
