"use client";

import { useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { CronExpressionParser } from "cron-parser";
import cronstrue from "cronstrue/i18n";
import { Check, Copy, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

const EXAMPLES = [
  "*/5 * * * *",
  "0 9 * * 1-5",
  "0 0 * * *",
  "0 0 1 * *",
  "*/30 * * * *",
];

type Parsed =
  | { state: "empty" }
  | { state: "error"; message: string }
  | { state: "ok"; description: string; nextRuns: Date[] };

function parseCron(expr: string, locale: string): Parsed {
  const trimmed = expr.trim();
  if (!trimmed) return { state: "empty" };
  try {
    const description = cronstrue.toString(trimmed, {
      locale: locale === "pt-BR" ? "pt_BR" : "en",
    });
    const it = CronExpressionParser.parse(trimmed);
    const nextRuns: Date[] = [];
    for (let i = 0; i < 5; i++) {
      nextRuns.push(it.next().toDate());
    }
    return { state: "ok", description, nextRuns };
  } catch (err) {
    return {
      state: "error",
      message: err instanceof Error ? err.message : String(err),
    };
  }
}

function NextRunRow({ date, locale }: { date: Date; locale: string }) {
  const [copied, setCopied] = useState(false);
  const iso = date.toISOString();
  const human = date.toLocaleString(locale, {
    dateStyle: "medium",
    timeStyle: "short",
  });

  async function copy() {
    try {
      await navigator.clipboard.writeText(iso);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard unavailable */
    }
  }

  return (
    <li className="flex items-center justify-between gap-3 border-b border-border px-3 py-2 last:border-b-0">
      <div className="min-w-0 flex-1">
        <code className="block font-mono text-xs tabular-nums">{iso}</code>
        <span className="text-2xs text-muted-foreground-subtle">{human}</span>
      </div>
      <button
        type="button"
        onClick={copy}
        aria-label="copy"
        className="flex items-center text-muted-foreground transition-colors hover:text-foreground"
      >
        {copied ? <Check size={12} /> : <Copy size={12} />}
      </button>
    </li>
  );
}

export function CronTool() {
  const t = useTranslations("tools.cron");
  const locale = useLocale();
  const [value, setValue] = useState("");
  const [copiedDesc, setCopiedDesc] = useState(false);

  const parsed = useMemo(() => parseCron(value, locale), [value, locale]);

  async function copyDesc() {
    if (parsed.state !== "ok") return;
    try {
      await navigator.clipboard.writeText(parsed.description);
      setCopiedDesc(true);
      setTimeout(() => setCopiedDesc(false), 1500);
    } catch {
      /* clipboard unavailable */
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-2xs font-bold uppercase tracking-widest text-muted-foreground-subtle">
          {t("expression")}
        </span>
        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={t("placeholder")}
          spellCheck={false}
          aria-invalid={parsed.state === "error"}
          className="h-8 flex-1 min-w-[180px] border border-border bg-transparent px-2.5 font-mono text-xs outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-1 focus-visible:ring-ring/50 aria-invalid:border-destructive"
        />
        <Button
          size="xs"
          variant="ghost"
          onClick={() => setValue("")}
          disabled={!value}
          data-umami-event="tool-cron-clear"
        >
          <Trash2 />
          {t("clear")}
        </Button>
      </div>

      <div>
        <span className="mb-2 block text-2xs font-bold uppercase tracking-widest text-muted-foreground-subtle">
          {t("examples")}
        </span>
        <ul className="flex flex-wrap gap-1.5" role="list">
          {EXAMPLES.map((ex) => (
            <li key={ex}>
              <button
                type="button"
                onClick={() => setValue(ex)}
                className="border border-border px-2 py-1 font-mono text-2xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                {ex}
              </button>
            </li>
          ))}
        </ul>
      </div>

      {parsed.state === "empty" && (
        <p className="text-2xs text-muted-foreground-subtle">{t("empty")}</p>
      )}
      {parsed.state === "error" && (
        <p className="flex items-start gap-1.5 text-2xs text-destructive">
          <span
            aria-hidden="true"
            className="mt-1 size-1.5 shrink-0 rounded-full bg-destructive"
          />
          <span>
            {t("invalid")}:{" "}
            <code className="font-mono">{parsed.message}</code>
          </span>
        </p>
      )}
      {parsed.state === "ok" && (
        <>
          <div className="border border-border">
            <header className="flex items-center justify-between border-b border-border bg-muted/40 px-3 py-1.5">
              <span className="text-2xs font-bold uppercase tracking-widest text-muted-foreground">
                {t("description_label")}
              </span>
              <Button
                size="xs"
                variant="ghost"
                onClick={copyDesc}
                data-umami-event="tool-cron-copy-desc"
              >
                {copiedDesc ? <Check /> : <Copy />}
                {copiedDesc ? t("copied") : t("copy")}
              </Button>
            </header>
            <p className="px-3 py-2 text-sm">{parsed.description}</p>
          </div>

          <div>
            <span className="mb-2 block text-2xs font-bold uppercase tracking-widest text-muted-foreground-subtle">
              {t("nextRuns")}
            </span>
            <ul className="border border-border" role="list">
              {parsed.nextRuns.map((d) => (
                <NextRunRow key={d.toISOString()} date={d} locale={locale} />
              ))}
            </ul>
          </div>
        </>
      )}
    </div>
  );
}
