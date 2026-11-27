"use client";

import { useEffect, useRef, useState } from "react";
import type { PetLogDTO } from "@/lib/pets/types";
import { fmtNum, formatDay } from "./shared";

const STEP = 20;

/**
 * Pesagens da mais recente para a mais antiga, com rolagem interna e
 * carregamento contínuo (renderiza de 20 em 20 conforme rola).
 * Ocupa a altura do contêiner — no desktop, a do gráfico ao lado.
 */
export function WeightTable({
  id,
  weights,
  onOpen,
}: {
  id: string;
  weights: PetLogDTO<"weight">[];
  onOpen: (log: PetLogDTO<"weight">) => void;
}) {
  const [limit, setLimit] = useState(STEP);
  const scrollRef = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLTableRowElement>(null);
  const hasMore = weights.length > limit;

  useEffect(() => {
    const root = scrollRef.current;
    const sentinel = sentinelRef.current;
    if (!root || !sentinel || !hasMore) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) setLimit((l) => l + STEP);
      },
      { root, rootMargin: "120px" },
    );
    io.observe(sentinel);
    return () => io.disconnect();
  }, [hasMore, limit]);

  return (
    <div id={id} className="relative h-72 border lg:h-full">
      <div ref={scrollRef} tabIndex={0} aria-label="Tabela de pesagens" className="absolute inset-0 overflow-y-auto outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring/60">
        <table className="w-full border-collapse text-xs">
          <thead className="sticky top-0 z-10 bg-background">
            <tr className="text-left text-[11px] text-muted-foreground">
              <th scope="col" className="border-b px-3 py-2 font-medium">
                Data
              </th>
              <th scope="col" className="border-b px-3 py-2 text-right font-medium">
                Peso
              </th>
              <th scope="col" className="border-b px-3 py-2 text-right font-medium">
                Variação
              </th>
            </tr>
          </thead>
          <tbody>
            {weights.slice(0, limit).map((w, i) => {
              const prev = weights[i + 1];
              const delta = prev ? w.data.grams - prev.data.grams : null;
              return (
                <tr key={w.id} className="hover:bg-muted/60">
                  <td className="border-b p-0">
                    <button
                      type="button"
                      onClick={() => onOpen(w)}
                      aria-label={`Editar pesagem de ${formatDay(w.occurredAt)}`}
                      className="w-full px-3 py-2 text-left outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring/60"
                    >
                      {formatDay(w.occurredAt)}
                    </button>
                  </td>
                  <td className="border-b px-3 py-2 text-right">{fmtNum(w.data.grams)} g</td>
                  <td
                    className={
                      "border-b px-3 py-2 text-right " +
                      (delta !== null && delta > 0 ? "text-emerald-800 dark:text-emerald-400" : "text-muted-foreground")
                    }
                  >
                    {delta === null ? "—" : `${delta > 0 ? "+" : delta < 0 ? "−" : "±"}${fmtNum(Math.abs(delta))} g`}
                  </td>
                </tr>
              );
            })}
            {hasMore && (
              <tr ref={sentinelRef} aria-hidden="true">
                <td colSpan={3} className="px-3 py-2 text-center text-[11px] text-muted-foreground">
                  carregando…
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
