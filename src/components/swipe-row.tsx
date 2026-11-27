"use client";

import { useRef, useState } from "react";
import { cn } from "@/lib/utils";

export type SwipeAction = {
  label: string;
  icon: React.ReactNode;
  /** Cores do fundo revelado (ex.: "bg-emerald-700 text-white"). */
  className: string;
  onCommit: () => void;
};

const LOCK = 10; // px até decidir que o gesto é horizontal
const EDGE = 24; // a borda esquerda é do "voltar" do iOS

/**
 * Linha de lista que aceita deslizar com o dedo. `right` é a ação de deslizar
 * para a direita, `left` para a esquerda. Só reage a toque; mouse e teclado
 * continuam usando os controles da própria linha, então toda ação daqui precisa
 * existir também como botão.
 */
export function SwipeRow({
  right,
  left,
  className,
  children,
}: {
  right?: SwipeAction;
  left?: SwipeAction;
  className?: string;
  children: React.ReactNode;
}) {
  const fg = useRef<HTMLDivElement>(null);
  const g = useRef({ id: -1, x: 0, y: 0, dx: 0, locked: false, dead: true, width: 0, swallowClick: false });
  const [side, setSide] = useState<"left" | "right" | null>(null);
  const [armed, setArmed] = useState(false);

  const move = (x: number, animate: boolean) => {
    const el = fg.current;
    if (!el) return;
    el.style.transition = animate ? "transform 180ms ease-out" : "none";
    el.style.transform = x ? `translate3d(${x}px,0,0)` : "";
  };
  const threshold = () => Math.min(120, g.current.width * 0.35);

  function onPointerDown(e: React.PointerEvent) {
    if (e.pointerType === "mouse" || (!right && !left) || e.clientX < EDGE) return;
    g.current = { ...g.current, id: e.pointerId, x: e.clientX, y: e.clientY, dx: 0, locked: false, dead: false, width: e.currentTarget.clientWidth };
  }

  function onPointerMove(e: React.PointerEvent) {
    const s = g.current;
    if (s.dead || e.pointerId !== s.id) return;
    const dx = e.clientX - s.x;
    const dy = e.clientY - s.y;
    if (!s.locked) {
      if (Math.abs(dy) > LOCK && Math.abs(dy) >= Math.abs(dx)) return void (s.dead = true); // rolagem
      if (Math.abs(dx) < LOCK || Math.abs(dx) < Math.abs(dy) * 1.5) return;
      if ((dx > 0 && !right) || (dx < 0 && !left)) return void (s.dead = true);
      s.locked = true;
      e.currentTarget.setPointerCapture(e.pointerId);
    }
    // Só anda para o lado que tem ação.
    s.dx = dx > 0 ? (right ? dx : 0) : left ? dx : 0;
    move(s.dx, false);
    setSide(s.dx > 0 ? "right" : s.dx < 0 ? "left" : null);
    setArmed(Math.abs(s.dx) >= threshold());
  }

  function finish(commit: boolean) {
    const s = g.current;
    if (s.dead) return;
    s.dead = true;
    if (!s.locked) return;
    s.swallowClick = true;
    setTimeout(() => (s.swallowClick = false), 350);
    const action = s.dx > 0 ? right : left;
    if (commit && action && Math.abs(s.dx) >= threshold()) {
      move(s.dx > 0 ? s.width : -s.width, true);
      setTimeout(() => {
        action.onCommit();
        // Se a linha continuar na tela (ação falhou ou foi desfeita), volta ao lugar.
        move(0, false);
        setSide(null);
        setArmed(false);
      }, 180);
    } else {
      move(0, true);
      setTimeout(() => setSide(null), 180);
      setArmed(false);
    }
  }

  const action = side === "right" ? right : side === "left" ? left : null;

  return (
    <div
      className="relative h-full touch-pan-y overflow-hidden"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={() => finish(true)}
      onPointerCancel={() => finish(false)}
      onClickCapture={(e) => {
        if (g.current.swallowClick) {
          e.preventDefault();
          e.stopPropagation();
        }
      }}
    >
      {action && (
        <div
          aria-hidden="true"
          className={cn(
            "absolute inset-0 flex items-center gap-2 px-5 text-sm font-semibold transition-opacity",
            side === "left" && "flex-row-reverse",
            action.className,
            !armed && "opacity-60",
          )}
        >
          <span className={cn("transition-transform [&>svg]:size-5", armed && "scale-125")}>{action.icon}</span>
          {action.label}
        </div>
      )}
      <div ref={fg} className={cn("relative bg-background", className)}>
        {children}
      </div>
    </div>
  );
}
