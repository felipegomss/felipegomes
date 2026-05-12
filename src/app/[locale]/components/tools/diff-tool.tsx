"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import {
  type Change,
  diffLines,
  diffWords,
  diffWordsWithSpace,
} from "diff";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

type Mode = "lines" | "words";

interface LineEntry {
  text: string;
  state: "added" | "removed" | "context";
}

function toLineEntries(
  a: string,
  b: string,
  ignoreWhitespace: boolean,
): LineEntry[] {
  const parts = diffLines(a, b, { ignoreWhitespace });
  const entries: LineEntry[] = [];
  for (const part of parts) {
    const state: LineEntry["state"] = part.added
      ? "added"
      : part.removed
        ? "removed"
        : "context";
    const lines = part.value.split("\n");
    if (lines[lines.length - 1] === "") lines.pop();
    for (const line of lines) {
      entries.push({ text: line, state });
    }
  }
  return entries;
}

export function DiffTool() {
  const t = useTranslations("tools.diff");
  const [a, setA] = useState("");
  const [b, setB] = useState("");
  const [mode, setMode] = useState<Mode>("lines");
  const [ignoreWs, setIgnoreWs] = useState(false);

  const lineEntries = useMemo<LineEntry[]>(
    () => (mode === "lines" ? toLineEntries(a, b, ignoreWs) : []),
    [a, b, mode, ignoreWs],
  );

  const wordParts = useMemo<Change[]>(
    () =>
      mode === "words"
        ? ignoreWs
          ? diffWords(a, b)
          : diffWordsWithSpace(a, b)
        : [],
    [a, b, mode, ignoreWs],
  );

  const stats = useMemo(() => {
    if (mode === "lines") {
      return {
        added: lineEntries.filter((e) => e.state === "added").length,
        removed: lineEntries.filter((e) => e.state === "removed").length,
      };
    }
    let added = 0;
    let removed = 0;
    for (const p of wordParts) {
      if (p.added) added++;
      else if (p.removed) removed++;
    }
    return { added, removed };
  }, [mode, lineEntries, wordParts]);

  const hasChanges = stats.added > 0 || stats.removed > 0;

  function clearAll() {
    setA("");
    setB("");
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <span className="text-2xs uppercase tracking-widest text-muted-foreground-subtle">
            {t("diffMode")}
          </span>
          <div
            role="radiogroup"
            aria-label={t("diffMode")}
            className="flex items-center gap-px overflow-hidden rounded-none border border-border"
          >
            {(["lines", "words"] as const).map((opt) => (
              <button
                key={opt}
                role="radio"
                aria-checked={mode === opt}
                onClick={() => setMode(opt)}
                className={`h-6 px-2 text-2xs transition-colors ${
                  mode === opt
                    ? "bg-foreground text-background"
                    : "bg-background text-muted-foreground hover:text-foreground"
                }`}
              >
                {opt === "lines" ? t("diffLines") : t("diffWords")}
              </button>
            ))}
          </div>
        </div>
        <label className="flex cursor-pointer items-center gap-2 text-xs text-muted-foreground hover:text-foreground">
          <input
            type="checkbox"
            checked={ignoreWs}
            onChange={(e) => setIgnoreWs(e.target.checked)}
            className="size-3.5 accent-foreground"
          />
          {t("ignoreWhitespace")}
        </label>
        <Button
          size="xs"
          variant="ghost"
          onClick={clearAll}
          disabled={!a && !b}
          data-umami-event="tool-diff-clear"
          className="ml-auto"
        >
          <Trash2 />
          {t("clear")}
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        <div>
          <span className="mb-2 block text-2xs font-bold uppercase tracking-widest text-muted-foreground-subtle">
            {t("sideA")}
          </span>
          <Textarea
            value={a}
            onChange={(e) => setA(e.target.value)}
            placeholder={t("placeholderA")}
            spellCheck={false}
            className="min-h-[200px] font-mono text-xs leading-relaxed"
          />
        </div>
        <div>
          <span className="mb-2 block text-2xs font-bold uppercase tracking-widest text-muted-foreground-subtle">
            {t("sideB")}
          </span>
          <Textarea
            value={b}
            onChange={(e) => setB(e.target.value)}
            placeholder={t("placeholderB")}
            spellCheck={false}
            className="min-h-[200px] font-mono text-xs leading-relaxed"
          />
        </div>
      </div>

      <div className="flex items-center gap-3 text-2xs">
        <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
          <span aria-hidden="true" className="size-1.5 rounded-full bg-emerald-500" />
          +{stats.added} {t("added")}
        </span>
        <span className="flex items-center gap-1.5 text-destructive">
          <span aria-hidden="true" className="size-1.5 rounded-full bg-destructive" />
          −{stats.removed} {t("removed")}
        </span>
      </div>

      {(a || b) && !hasChanges && (
        <p className="text-2xs text-muted-foreground-subtle">{t("noChanges")}</p>
      )}

      {hasChanges && mode === "lines" && (
        <div className="overflow-x-auto border border-border">
          <ol className="font-mono text-xs leading-relaxed" role="list">
            {lineEntries.map((entry, i) => (
              <li
                key={i}
                className={
                  entry.state === "added"
                    ? "bg-emerald-500/15 text-foreground"
                    : entry.state === "removed"
                      ? "bg-destructive/15 text-foreground"
                      : "text-muted-foreground"
                }
              >
                <span className="inline-block w-6 select-none pl-2 text-muted-foreground-subtle">
                  {entry.state === "added" ? "+" : entry.state === "removed" ? "−" : " "}
                </span>
                <span className="whitespace-pre-wrap">{entry.text || " "}</span>
              </li>
            ))}
          </ol>
        </div>
      )}

      {hasChanges && mode === "words" && (
        <div className="overflow-x-auto border border-border px-3 py-2">
          <p className="whitespace-pre-wrap break-words font-mono text-xs leading-relaxed">
            {wordParts.map((part, i) =>
              part.added ? (
                <ins
                  key={i}
                  className="bg-emerald-500/20 text-foreground no-underline"
                >
                  {part.value}
                </ins>
              ) : part.removed ? (
                <del key={i} className="bg-destructive/20 text-foreground">
                  {part.value}
                </del>
              ) : (
                <span key={i} className="text-muted-foreground">
                  {part.value}
                </span>
              ),
            )}
          </p>
        </div>
      )}
    </div>
  );
}
