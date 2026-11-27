"use client";

import { useState } from "react";
import Link from "next/link";
import { SendIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import type { PetLogDTO, PetLogType } from "@/lib/pets/types";
import { LogDialog, type DialogTarget } from "../../../pets/[slug]/_components/log-dialog";
import { LOG_ICON_COLOR, LOG_ICONS } from "../../../pets/[slug]/_components/shared";

export type QuickPetAction = { slug: string; type: PetLogType; label: string };

const TILE =
  "flex min-h-12 items-center gap-2.5 border px-3 text-left text-xs outline-none transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring/60 max-sm:min-h-14";

/** "Registrar agora": o que mais se registra no dia a dia, a um toque. */
export function QuickActions({
  locale,
  actions,
  lastFeeding,
}: {
  locale: string;
  actions: QuickPetAction[];
  lastFeeding: Record<string, PetLogDTO | null>;
}) {
  const [target, setTarget] = useState<(DialogTarget & { slug: string }) | null>(null);

  return (
    <>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-[repeat(auto-fit,minmax(160px,1fr))]">
        {actions.map((a) => (
          <button key={`${a.slug}:${a.type}`} type="button" className={TILE} onClick={() => setTarget({ slug: a.slug, type: a.type })}>
            <span aria-hidden="true" className={cn("[&>svg]:size-4", LOG_ICON_COLOR[a.type])}>
              {LOG_ICONS[a.type]}
            </span>
            {a.label}
          </button>
        ))}
        <Link href={`/${locale}/admin/email`} className={TILE}>
          <SendIcon aria-hidden="true" className="size-4 text-muted-foreground" />
          Compor email
        </Link>
      </div>
      <LogDialog
        slug={target?.slug ?? ""}
        target={target ? { type: target.type } : null}
        onClose={() => setTarget(null)}
        lastFeeding={target ? lastFeeding[target.slug] : null}
      />
    </>
  );
}
