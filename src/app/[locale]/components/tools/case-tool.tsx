"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { Check, Copy, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

function tokenize(input: string): string[] {
  return input
    .replace(/([a-z\d])([A-Z])/g, "$1 $2")
    .replace(/([A-Z]+)([A-Z][a-z])/g, "$1 $2")
    .split(/[^a-zA-Z0-9]+/)
    .filter(Boolean)
    .map((t) => t.toLowerCase());
}

function cap(w: string): string {
  return w.length === 0 ? w : w[0].toUpperCase() + w.slice(1);
}

function toCamel(tokens: string[]): string {
  return tokens.map((t, i) => (i === 0 ? t : cap(t))).join("");
}
function toPascal(tokens: string[]): string {
  return tokens.map(cap).join("");
}
function toSnake(tokens: string[]): string {
  return tokens.join("_");
}
function toScreaming(tokens: string[]): string {
  return tokens.join("_").toUpperCase();
}
function toKebab(tokens: string[]): string {
  return tokens.join("-");
}
function toTitle(tokens: string[]): string {
  return tokens.map(cap).join(" ");
}
function toSentence(tokens: string[]): string {
  return tokens.length === 0
    ? ""
    : tokens.map((t, i) => (i === 0 ? cap(t) : t)).join(" ");
}
function toLower(tokens: string[]): string {
  return tokens.join(" ");
}
function toUpper(tokens: string[]): string {
  return tokens.join(" ").toUpperCase();
}

function Row({ label, value }: { label: string; value: string }) {
  const t = useTranslations("tools.case");
  const [copied, setCopied] = useState(false);
  async function copy() {
    if (!value) return;
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard unavailable */
    }
  }
  return (
    <div className="grid grid-cols-[140px_1fr_auto] items-center gap-3 border border-border px-3 py-2">
      <span className="text-2xs font-bold uppercase tracking-widest text-muted-foreground-subtle">
        {label}
      </span>
      <code className="break-all font-mono text-xs">{value || "—"}</code>
      <Button
        size="xs"
        variant="ghost"
        onClick={copy}
        disabled={!value}
        data-umami-event="tool-case-copy"
        data-umami-event-format={label}
      >
        {copied ? <Check /> : <Copy />}
        {copied ? t("copied") : t("copy")}
      </Button>
    </div>
  );
}

export function CaseTool() {
  const t = useTranslations("tools.case");
  const [value, setValue] = useState("");

  const tokens = useMemo(() => tokenize(value), [value]);
  const empty = tokens.length === 0;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-end gap-2">
        <Button
          size="xs"
          variant="ghost"
          onClick={() => setValue("")}
          disabled={!value}
          data-umami-event="tool-case-clear"
        >
          <Trash2 />
          {t("clear")}
        </Button>
      </div>

      <Textarea
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={t("placeholder")}
        spellCheck={false}
        className="min-h-24 font-mono text-xs leading-relaxed"
      />

      {empty ? (
        <p className="text-2xs text-muted-foreground-subtle">{t("empty")}</p>
      ) : (
        <div className="space-y-2">
          <Row label={t("labels.camel")} value={toCamel(tokens)} />
          <Row label={t("labels.pascal")} value={toPascal(tokens)} />
          <Row label={t("labels.snake")} value={toSnake(tokens)} />
          <Row label={t("labels.screaming")} value={toScreaming(tokens)} />
          <Row label={t("labels.kebab")} value={toKebab(tokens)} />
          <Row label={t("labels.title")} value={toTitle(tokens)} />
          <Row label={t("labels.sentence")} value={toSentence(tokens)} />
          <Row label={t("labels.lower")} value={toLower(tokens)} />
          <Row label={t("labels.upper")} value={toUpper(tokens)} />
        </div>
      )}
    </div>
  );
}
