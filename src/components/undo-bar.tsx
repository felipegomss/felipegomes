"use client";

import { cn } from "@/lib/utils";

/** Aviso com "Desfazer" depois de uma ação rápida (deslizar, marcar). */
export function UndoBar({ message, onUndo, className }: { message: string | null; onUndo: () => void; className?: string }) {
  if (!message) return null;
  return (
    <div
      role="status"
      className={cn(
        "fixed left-4 z-30 flex items-center gap-3 bg-foreground py-1 pr-1 pl-4 text-sm text-background shadow-lg",
        "bottom-6 max-md:right-20 max-md:bottom-[calc(var(--mobile-nav-h)+1rem)] md:left-1/2 md:-translate-x-1/2",
        className,
      )}
    >
      <span className="min-w-0 flex-1 truncate">{message}</span>
      <button
        type="button"
        onClick={onUndo}
        className="h-11 shrink-0 px-3 font-semibold underline underline-offset-4 outline-none focus-visible:ring-2 focus-visible:ring-background/70"
      >
        Desfazer
      </button>
    </div>
  );
}
