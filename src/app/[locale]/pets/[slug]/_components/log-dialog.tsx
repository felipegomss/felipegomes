"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2Icon } from "lucide-react";
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
  FEEDING_RESULTS,
  FEEDING_RESULT_LABELS,
  PET_LOG_LABELS,
  PREY_STATES,
  PREY_STATE_LABELS,
  type FieldErrors,
  type PetLogDTO,
  type PetLogType,
} from "@/lib/pets/types";
import {
  FieldError,
  INPUT_STRONG,
  LABEL,
  Segmented,
  TypeIcon,
  formatWhen,
  fmtNum,
  summarizeLog,
  toLocalInput,
  lowerLabel,
} from "./shared";

type Draft = Record<string, string | boolean | undefined>;

export type DialogTarget = { type: PetLogType; editing?: PetLogDTO | null } | null;

function toDraft(data: object): Draft {
  return Object.fromEntries(
    Object.entries(data)
      .filter(([k]) => k !== "importedFrom")
      .map(([k, v]) => [k, typeof v === "number" ? String(v) : v]),
  );
}

function defaultsFor(type: PetLogType, lastFeeding?: PetLogDTO | null): Draft {
  if (type === "feeding") {
    // Repete a última oferta — normalmente é a mesma presa.
    const d = (lastFeeding?.data ?? {}) as Record<string, unknown>;
    return {
      result: "accepted",
      prey: (d.prey as string) ?? "",
      preySize: (d.preySize as string) ?? "",
      preyWeightG: d.preyWeightG !== undefined ? String(d.preyWeightG) : "",
      preyState: (d.preyState as string) ?? "frozen",
    };
  }
  if (type === "shed") return { complete: true };
  return {};
}

/** Validação no cliente dos campos obrigatórios (o servidor valida de novo). */
function validate(type: PetLogType, draft: Draft, notes: string): FieldErrors {
  const errors: FieldErrors = {};
  const n = (k: string) => {
    const v = draft[k];
    return typeof v === "string" && v.trim() !== "" ? Number(v.replace(",", ".")) : undefined;
  };
  if (type === "weight") {
    const g = n("grams");
    if (g === undefined || !Number.isFinite(g) || g <= 0) errors.grams = "Informe o peso em gramas, ex.: 260";
  }
  if (type === "feeding") {
    const g = n("preyWeightG");
    if (g !== undefined && (!Number.isFinite(g) || g < 0)) errors.preyWeightG = "Peso da presa inválido, ex.: 30";
  }
  if (type === "note" && !notes.trim() && !(draft.title as string)?.trim()) {
    errors.notes = "Escreva a nota.";
  }
  return errors;
}

export function LogDialog({
  slug,
  target,
  onClose,
  lastFeeding,
}: {
  slug: string;
  target: DialogTarget;
  onClose: () => void;
  lastFeeding?: PetLogDTO | null;
}) {
  return (
    <Dialog open={!!target} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-md">
        {target && (
          <LogForm
            key={target.editing?.id ?? target.type}
            slug={slug}
            type={target.type}
            editing={target.editing}
            lastFeeding={lastFeeding}
            onDone={onClose}
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
  onDone,
}: {
  slug: string;
  type: PetLogType;
  editing?: PetLogDTO | null;
  lastFeeding?: PetLogDTO | null;
  onDone: () => void;
}) {
  const router = useRouter();
  const [when, setWhen] = useState(() => toLocalInput(editing ? new Date(editing.occurredAt) : new Date()));
  const [draft, setDraft] = useState<Draft>(() => (editing ? toDraft(editing.data) : defaultsFor(type, lastFeeding)));
  const [notes, setNotes] = useState(editing?.notes ?? "");
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (confirming) cancelRef.current?.focus();
  }, [confirming]);

  const set = (k: string, v: string | boolean | undefined) => {
    setDraft((d) => ({ ...d, [k]: v }));
    if (errors[k]) setErrors((e) => ({ ...e, [k]: undefined }));
  };
  const text = (k: string) => (typeof draft[k] === "string" ? (draft[k] as string) : "");

  function focusFirstError(errs: FieldErrors) {
    const first = Object.keys(errs).find((k) => errs[k]);
    if (!first) return;
    formRef.current?.querySelector<HTMLElement>(`[data-field="${first}"]`)?.focus();
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const local = validate(type, draft, notes);
    if (Object.keys(local).length) {
      setErrors(local);
      focusFirstError(local);
      return;
    }

    setBusy(true);
    setFormError(null);
    const payload = { occurredAt: new Date(when).toISOString(), data: draft, notes };
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
    setBusy(false);

    if (!res.ok) {
      const body = await res.json().catch(() => null);
      if (body?.fields) {
        setErrors(body.fields);
        focusFirstError(body.fields);
      } else {
        setFormError(body?.error ?? "Não deu para salvar. Tente de novo.");
      }
      return;
    }
    router.refresh();
    onDone();
  }

  async function remove() {
    if (!editing) return;
    setBusy(true);
    const res = await fetch(`/api/pets/${slug}/logs/${editing.id}`, { method: "DELETE" });
    setBusy(false);
    if (!res.ok) {
      setConfirming(false);
      setFormError("Não deu para excluir. Tente de novo.");
      return;
    }
    router.refresh();
    onDone();
  }

  const input = (k: string, props: React.ComponentProps<typeof Input> = {}) => (
    <Input
      data-field={k}
      value={text(k)}
      onChange={(e) => set(k, e.target.value)}
      aria-invalid={!!errors[k] || undefined}
      aria-describedby={errors[k] ? `err-${k}` : undefined}
      className={cn(INPUT_STRONG, errors[k] && "border-2 border-red-700 dark:border-red-400")}
      {...props}
    />
  );

  const fieldLabel = (k: string, text: string, required = false) => (
    <span className={cn(LABEL, errors[k] && "text-red-800 dark:text-red-400")}>
      {text}
      {required && errors[k] ? " · obrigatório" : ""}
    </span>
  );

  return (
    <form ref={formRef} onSubmit={submit} noValidate className="flex flex-col gap-4">
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <TypeIcon type={type} />
          {editing ? "Editar" : "Registrar"} · {PET_LOG_LABELS[type]}
        </DialogTitle>
        <DialogDescription className={editing ? "text-xs" : "sr-only"}>
          {editing
            ? `${formatWhen(editing)} · ${summarizeLog(editing)}`
            : `Novo registro de ${lowerLabel(PET_LOG_LABELS[type])}`}
        </DialogDescription>
      </DialogHeader>

      <label className="flex flex-col gap-1.5">
        <span className={LABEL}>Quando</span>
        <Input
          type="datetime-local"
          value={when}
          onChange={(e) => setWhen(e.target.value)}
          required
          className={INPUT_STRONG}
        />
      </label>

      {type === "feeding" && (
        <>
          <div className="flex flex-col gap-1.5">
            <span className={LABEL} id="lbl-result">
              Resultado
            </span>
            <Segmented
              label="Resultado"
              value={text("result") as (typeof FEEDING_RESULTS)[number]}
              onChange={(v) => set("result", v)}
              options={FEEDING_RESULTS.map((v) => ({ value: v, label: FEEDING_RESULT_LABELS[v] }))}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1.5">
              {fieldLabel("prey", "Presa")}
              {input("prey", { placeholder: "camundongo", list: "pet-prey" })}
              <datalist id="pet-prey">
                <option value="camundongo" />
                <option value="rato" />
              </datalist>
            </label>
            <label className="flex flex-col gap-1.5">
              {fieldLabel("preySize", "Tamanho")}
              {input("preySize", { placeholder: "opcional" })}
            </label>
          </div>
          <label className="flex flex-col gap-1.5">
            {fieldLabel("preyWeightG", "Peso da presa (g)")}
            {input("preyWeightG", { inputMode: "decimal", placeholder: "ex.: 30" })}
            <FieldError id="err-preyWeightG">{errors.preyWeightG}</FieldError>
          </label>
          {!editing && lastFeeding && (
            <p className="-mt-2 text-[11px] text-muted-foreground">
              Preenchido com a última oferta ({summarizeLog(lastFeeding).replace(/^[^·]+· /, "")}).
            </p>
          )}
          <div className="flex flex-col gap-1.5">
            <span className={LABEL}>Estado</span>
            <Segmented
              label="Estado da presa"
              value={text("preyState") as (typeof PREY_STATES)[number]}
              onChange={(v) => set("preyState", v)}
              options={PREY_STATES.map((v) => ({ value: v, label: PREY_STATE_LABELS[v] }))}
            />
          </div>
        </>
      )}

      {type === "weight" && (
        <div className="grid grid-cols-2 gap-3">
          <label className="flex flex-col gap-1.5">
            {fieldLabel("grams", "Peso (g)", true)}
            {input("grams", { inputMode: "decimal", placeholder: "ex.: 260", autoFocus: !editing })}
            <FieldError id="err-grams">{errors.grams}</FieldError>
          </label>
          <label className="flex flex-col gap-1.5">
            {fieldLabel("lengthCm", "Comprimento (cm)")}
            {input("lengthCm", { inputMode: "decimal", placeholder: "opcional" })}
            <FieldError id="err-lengthCm">{errors.lengthCm}</FieldError>
          </label>
        </div>
      )}

      {type === "shed" && (
        <div className="flex flex-col gap-1.5">
          <span className={LABEL}>Como saiu</span>
          <Segmented
            label="Como saiu a muda"
            value={draft.complete === false ? "partial" : "complete"}
            onChange={(v) => set("complete", v === "complete")}
            options={[
              { value: "complete", label: "Completa" },
              { value: "partial", label: "Parcial" },
            ]}
          />
        </div>
      )}

      {type === "vet" && (
        <div className="grid grid-cols-[1fr_8rem] gap-3">
          <label className="flex flex-col gap-1.5">
            {fieldLabel("reason", "Motivo")}
            {input("reason", { placeholder: "check-up" })}
          </label>
          <label className="flex flex-col gap-1.5">
            {fieldLabel("costBRL", "Custo (R$)")}
            {input("costBRL", { inputMode: "decimal", placeholder: "opcional" })}
          </label>
        </div>
      )}

      {type === "note" && (
        <label className="flex flex-col gap-1.5">
          {fieldLabel("title", "Título")}
          {input("title", { placeholder: "ex.: olho azul" })}
        </label>
      )}

      <label className="flex flex-col gap-1.5">
        {fieldLabel("notes", type === "note" ? "Nota" : "Observações", type === "note")}
        <Textarea
          data-field="notes"
          value={notes}
          onChange={(e) => {
            setNotes(e.target.value);
            if (errors.notes) setErrors((er) => ({ ...er, notes: undefined }));
          }}
          placeholder={type === "note" ? "O que aconteceu?" : "Opcional"}
          rows={3}
          aria-invalid={!!errors.notes || undefined}
          aria-describedby={errors.notes ? "err-notes" : undefined}
          className={cn(
            "border-muted-foreground/70",
            errors.notes && "border-2 border-red-700 dark:border-red-400",
          )}
        />
        <FieldError id="err-notes">{errors.notes}</FieldError>
      </label>

      {editing?.data.importedFrom && (
        <p className="text-[11px] text-muted-foreground">Importado do reptile-keeper (sem hora).</p>
      )}

      {formError && (
        <p role="alert" className="text-xs text-red-800 dark:text-red-400">
          {formError}
        </p>
      )}

      {confirming && editing && (
        <div
          role="alertdialog"
          aria-labelledby="del-title"
          aria-describedby="del-desc"
          onKeyDown={(e) => {
            if (e.key === "Escape") {
              e.stopPropagation();
              setConfirming(false);
            }
          }}
          className="flex flex-col gap-2.5 border border-red-500/40 bg-red-500/5 p-3"
        >
          <p id="del-title" className="font-semibold">
            Excluir este registro?
          </p>
          <p id="del-desc" className="text-muted-foreground">
            {PET_LOG_LABELS[editing.type]} de {formatWhen(editing)} some do histórico
            {editing.type === "weight" ? " e do gráfico" : ""}. Não dá para desfazer.
          </p>
          <div className="flex justify-end gap-2">
            <Button ref={cancelRef} type="button" variant="outline" size="lg" onClick={() => setConfirming(false)}>
              Cancelar
            </Button>
            <Button
              type="button"
              size="lg"
              disabled={busy}
              onClick={remove}
              className="bg-red-700 text-white hover:bg-red-800 dark:bg-red-400 dark:text-neutral-950 dark:hover:bg-red-300"
            >
              Excluir
            </Button>
          </div>
        </div>
      )}

      <div className={cn("flex items-center gap-2", editing ? "justify-between" : "justify-end")}>
        {editing && (
          <Button
            type="button"
            variant="ghost"
            size="lg"
            onClick={() => setConfirming(true)}
            className="text-red-800 hover:text-red-900 dark:text-red-400"
          >
            <Trash2Icon />
            Excluir
          </Button>
        )}
        <Button type="submit" size="lg" disabled={busy} className="px-5">
          {busy ? "Salvando..." : "Salvar"}
        </Button>
      </div>
    </form>
  );
}


