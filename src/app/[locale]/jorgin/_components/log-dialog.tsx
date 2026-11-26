"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import {
  CLEANING_KINDS,
  CLEANING_KIND_LABELS,
  FEEDING_RESULTS,
  FEEDING_RESULT_LABELS,
  PET_LOG_LABELS,
  PREY_STATES,
  PREY_STATE_LABELS,
  type PetLogData,
  type PetLogDTO,
  type PetLogType,
} from "@/lib/pets/types";
import { Check, Field, LOG_ICONS, LOG_TONES, Segmented, toLocalInput } from "./shared";

type Draft = Record<string, string | boolean | undefined>;

const PREY_SIZES = ["pinky", "fuzzy", "hopper", "adulto", "jumbo"];

/** Converte o `data` salvo em estado de formulário (números viram string). */
function toDraft(data: object): Draft {
  return Object.fromEntries(
    Object.entries(data).map(([k, v]) => [k, typeof v === "number" ? String(v) : v]),
  );
}

function defaultsFor(type: PetLogType, lastFeeding?: PetLogDTO<"feeding"> | null): Draft {
  switch (type) {
    case "feeding": {
      // Repete a última presa oferecida — normalmente é a mesma.
      const d = lastFeeding?.data;
      return {
        result: "accepted",
        prey: d?.prey ?? "camundongo",
        preySize: d?.preySize,
        preyWeightG: d?.preyWeightG !== undefined ? String(d.preyWeightG) : undefined,
        preyState: d?.preyState ?? "frozen",
      };
    }
    case "shed":
      return { complete: true, inOnePiece: true };
    case "poop":
      return { normal: true, urate: true };
    case "cleaning":
      return { kind: "spot", substrateChanged: false };
    default:
      return {};
  }
}

export function LogDialog({
  open,
  onOpenChange,
  slug,
  type,
  editing,
  lastFeeding,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  slug: string;
  type: PetLogType;
  editing?: PetLogDTO | null;
  lastFeeding?: PetLogDTO<"feeding"> | null;
  onSaved: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        {open && (
          <LogForm
            // Remonta o formulário a cada abertura para resetar o estado.
            key={editing?.id ?? type}
            slug={slug}
            type={type}
            editing={editing}
            lastFeeding={lastFeeding}
            onSaved={() => {
              onOpenChange(false);
              onSaved();
            }}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function LogForm({
  slug,
  type,
  editing,
  lastFeeding,
  onSaved,
}: {
  slug: string;
  type: PetLogType;
  editing?: PetLogDTO | null;
  lastFeeding?: PetLogDTO<"feeding"> | null;
  onSaved: () => void;
}) {
  const [when, setWhen] = useState(() =>
    toLocalInput(editing ? new Date(editing.occurredAt) : new Date()),
  );
  const [draft, setDraft] = useState<Draft>(() =>
    editing ? toDraft(editing.data) : defaultsFor(type, lastFeeding),
  );
  const [notes, setNotes] = useState(editing?.notes ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = (k: string, v: string | boolean | undefined) =>
    setDraft((d) => ({ ...d, [k]: v }));
  const text = (k: string) => (typeof draft[k] === "string" ? (draft[k] as string) : "");
  const flag = (k: string) => draft[k] === true;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const payload = {
      occurredAt: new Date(when).toISOString(),
      data: draft,
      notes,
    };

    const res = editing
      ? await fetch(`/api/pets/${slug}/logs/${editing.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        })
      : await fetch(`/api/pets/${slug}/logs`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type, ...payload }),
        });

    setSaving(false);
    if (!res.ok) {
      const body = await res.json().catch(() => null);
      setError(body?.error ?? "Erro ao salvar.");
      return;
    }
    onSaved();
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <span className={cn("grid size-7 place-items-center [&>svg]:size-4", LOG_TONES[type])}>
            {LOG_ICONS[type]}
          </span>
          {editing ? "Editar" : "Registrar"} · {PET_LOG_LABELS[type]}
        </DialogTitle>
        <DialogDescription className="sr-only">
          Formulário de registro de {PET_LOG_LABELS[type]}
        </DialogDescription>
      </DialogHeader>

      <Field label="Quando">
        <Input type="datetime-local" value={when} onChange={(e) => setWhen(e.target.value)} required />
      </Field>

      {type === "feeding" && (
        <>
          <Field label="Resultado">
            <Segmented
              value={text("result") as PetLogData["feeding"]["result"]}
              onChange={(v) => set("result", v)}
              options={FEEDING_RESULTS.map((v) => ({ value: v, label: FEEDING_RESULT_LABELS[v] }))}
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Presa">
              <Input value={text("prey")} onChange={(e) => set("prey", e.target.value)} placeholder="camundongo" />
            </Field>
            <Field label="Tamanho">
              <Input
                value={text("preySize")}
                onChange={(e) => set("preySize", e.target.value)}
                list="prey-sizes"
                placeholder="hopper"
              />
              <datalist id="prey-sizes">
                {PREY_SIZES.map((s) => (
                  <option key={s} value={s} />
                ))}
              </datalist>
            </Field>
          </div>
          <Field label="Peso da presa (g)">
            <Input
              type="number"
              inputMode="decimal"
              step="0.1"
              min="0"
              value={text("preyWeightG")}
              onChange={(e) => set("preyWeightG", e.target.value)}
            />
          </Field>
          <Field label="Estado">
            <Segmented
              value={text("preyState") as PetLogData["feeding"]["preyState"]}
              onChange={(v) => set("preyState", v)}
              options={PREY_STATES.map((v) => ({ value: v, label: PREY_STATE_LABELS[v] }))}
            />
          </Field>
        </>
      )}

      {type === "shed" && (
        <div className="flex flex-col gap-2">
          <Check checked={flag("complete")} onChange={(v) => set("complete", v)} label="Muda completa (incluindo olhos e ponta da cauda)" />
          <Check checked={flag("inOnePiece")} onChange={(v) => set("inOnePiece", v)} label="Saiu inteira, em uma peça" />
        </div>
      )}

      {type === "weight" && (
        <div className="grid grid-cols-2 gap-3">
          <Field label="Peso (g)">
            <Input
              type="number"
              inputMode="decimal"
              step="0.1"
              min="0"
              value={text("grams")}
              onChange={(e) => set("grams", e.target.value)}
              required
              autoFocus
            />
          </Field>
          <Field label="Comprimento (cm)">
            <Input
              type="number"
              inputMode="decimal"
              step="0.5"
              min="0"
              value={text("lengthCm")}
              onChange={(e) => set("lengthCm", e.target.value)}
            />
          </Field>
        </div>
      )}

      {type === "poop" && (
        <div className="flex flex-col gap-2">
          <Check checked={flag("normal")} onChange={(v) => set("normal", v)} label="Aspecto normal" />
          <Check checked={flag("urate")} onChange={(v) => set("urate", v)} label="Com urato" />
        </div>
      )}

      {type === "cleaning" && (
        <>
          <Field label="Tipo">
            <Segmented
              value={text("kind") as PetLogData["cleaning"]["kind"]}
              onChange={(v) => set("kind", v)}
              options={CLEANING_KINDS.map((v) => ({ value: v, label: CLEANING_KIND_LABELS[v] }))}
            />
          </Field>
          <Check checked={flag("substrateChanged")} onChange={(v) => set("substrateChanged", v)} label="Substrato trocado" />
        </>
      )}

      {type === "reading" && (
        <div className="grid grid-cols-3 gap-3">
          <Field label="Quente °C">
            <Input type="number" inputMode="decimal" step="0.1" value={text("hot")} onChange={(e) => set("hot", e.target.value)} />
          </Field>
          <Field label="Frio °C">
            <Input type="number" inputMode="decimal" step="0.1" value={text("cold")} onChange={(e) => set("cold", e.target.value)} />
          </Field>
          <Field label="Umidade %">
            <Input type="number" inputMode="decimal" step="1" min="0" max="100" value={text("humidity")} onChange={(e) => set("humidity", e.target.value)} />
          </Field>
        </div>
      )}

      {type === "handling" && (
        <Field label="Duração (min)">
          <Input type="number" inputMode="numeric" min="0" value={text("minutes")} onChange={(e) => set("minutes", e.target.value)} />
        </Field>
      )}

      {type === "vet" && (
        <div className="grid grid-cols-[1fr_8rem] gap-3">
          <Field label="Motivo">
            <Input value={text("reason")} onChange={(e) => set("reason", e.target.value)} placeholder="check-up" />
          </Field>
          <Field label="Custo (R$)">
            <Input type="number" inputMode="decimal" step="0.01" min="0" value={text("costBRL")} onChange={(e) => set("costBRL", e.target.value)} />
          </Field>
        </div>
      )}

      <Field label="Observações">
        <Textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder={type === "note" ? "O que aconteceu?" : "Opcional"}
          required={type === "note"}
          rows={3}
        />
      </Field>

      {error && <p className="text-xs text-destructive">{error}</p>}

      <Button type="submit" disabled={saving}>
        {saving ? "Salvando..." : "Salvar"}
      </Button>
    </form>
  );
}
