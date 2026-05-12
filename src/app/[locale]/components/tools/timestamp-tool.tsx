"use client";

import { useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Check, Clock, Copy, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

type Parsed = { state: "empty" } | { state: "invalid" } | { state: "ok"; date: Date };

function parseInput(input: string): Parsed {
  const trimmed = input.trim();
  if (!trimmed) return { state: "empty" };

  if (/^-?\d+$/.test(trimmed)) {
    const n = Number(trimmed);
    if (!Number.isFinite(n)) return { state: "invalid" };
    const ms = trimmed.replace("-", "").length >= 12 ? n : n * 1000;
    const date = new Date(ms);
    if (Number.isNaN(date.getTime())) return { state: "invalid" };
    return { state: "ok", date };
  }

  const date = new Date(trimmed);
  if (Number.isNaN(date.getTime())) return { state: "invalid" };
  return { state: "ok", date };
}

function pad(n: number, w = 2): string {
  return String(n).padStart(w, "0");
}

function toIsoLocal(d: Date): string {
  const off = -d.getTimezoneOffset();
  const sign = off >= 0 ? "+" : "-";
  const absOff = Math.abs(off);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours(),
  )}:${pad(d.getMinutes())}:${pad(d.getSeconds())}${sign}${pad(
    Math.floor(absOff / 60),
  )}:${pad(absOff % 60)}`;
}

function relativeFormat(d: Date, locale: string): string {
  const diffMs = d.getTime() - Date.now();
  const abs = Math.abs(diffMs);
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });
  const min = 60_000;
  const hr = 3_600_000;
  const day = 86_400_000;
  const week = 7 * day;
  const month = 30 * day;
  const year = 365 * day;

  if (abs < min) return rtf.format(Math.round(diffMs / 1000), "second");
  if (abs < hr) return rtf.format(Math.round(diffMs / min), "minute");
  if (abs < day) return rtf.format(Math.round(diffMs / hr), "hour");
  if (abs < week) return rtf.format(Math.round(diffMs / day), "day");
  if (abs < month) return rtf.format(Math.round(diffMs / week), "week");
  if (abs < year) return rtf.format(Math.round(diffMs / month), "month");
  return rtf.format(Math.round(diffMs / year), "year");
}

function Row({ label, value }: { label: string; value: string }) {
  const t = useTranslations("tools.timestamp");
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard unavailable */
    }
  }

  return (
    <div className="grid grid-cols-[120px_1fr_auto] items-center gap-3 border border-border px-3 py-2">
      <span className="text-2xs font-bold uppercase tracking-widest text-muted-foreground-subtle">
        {label}
      </span>
      <code className="break-all font-mono text-xs tabular-nums">{value}</code>
      <Button
        size="xs"
        variant="ghost"
        onClick={copy}
        data-umami-event="tool-timestamp-copy"
        data-umami-event-label={label}
      >
        {copied ? <Check /> : <Copy />}
        {copied ? t("copied") : t("copy")}
      </Button>
    </div>
  );
}

export function TimestampTool() {
  const t = useTranslations("tools.timestamp");
  const locale = useLocale();
  const [value, setValue] = useState("");

  const parsed = useMemo(() => parseInput(value), [value]);

  function setNow() {
    setValue(String(Math.floor(Date.now() / 1000)));
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={t("placeholder")}
          spellCheck={false}
          aria-invalid={parsed.state === "invalid"}
          className="h-8 flex-1 min-w-[200px] border border-border bg-transparent px-2.5 text-xs outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-1 focus-visible:ring-ring/50 aria-invalid:border-destructive"
        />
        <Button
          size="xs"
          variant="outline"
          onClick={setNow}
          data-umami-event="tool-timestamp-now"
        >
          <Clock />
          {t("now")}
        </Button>
        <Button
          size="xs"
          variant="ghost"
          onClick={() => setValue("")}
          disabled={!value}
          data-umami-event="tool-timestamp-clear"
        >
          <Trash2 />
          {t("clear")}
        </Button>
      </div>

      {parsed.state === "empty" && (
        <p className="text-2xs text-muted-foreground-subtle">{t("empty")}</p>
      )}
      {parsed.state === "invalid" && (
        <p className="flex items-center gap-1.5 text-2xs text-destructive">
          <span
            aria-hidden="true"
            className="size-1.5 rounded-full bg-destructive"
          />
          {t("invalid")}
        </p>
      )}
      {parsed.state === "ok" && (
        <div className="space-y-2">
          <Row
            label={t("labels.unixSeconds")}
            value={String(Math.floor(parsed.date.getTime() / 1000))}
          />
          <Row label={t("labels.unixMs")} value={String(parsed.date.getTime())} />
          <Row label={t("labels.isoUtc")} value={parsed.date.toISOString()} />
          <Row label={t("labels.isoLocal")} value={toIsoLocal(parsed.date)} />
          <Row label={t("labels.rfc")} value={parsed.date.toUTCString()} />
          <Row
            label={t("labels.relative")}
            value={relativeFormat(parsed.date, locale)}
          />
          <Row
            label={t("labels.human")}
            value={parsed.date.toLocaleString(locale, {
              dateStyle: "full",
              timeStyle: "long",
            })}
          />
        </div>
      )}
    </div>
  );
}
