"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { Check, Copy, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

const FLAGS = ["g", "i", "m", "s", "u", "y"] as const;
type Flag = (typeof FLAGS)[number];

type Compiled =
  | { state: "empty" }
  | { state: "error"; message: string }
  | { state: "ok"; regex: RegExp };

function compile(pattern: string, flags: string): Compiled {
  if (!pattern) return { state: "empty" };
  try {
    return { state: "ok", regex: new RegExp(pattern, flags) };
  } catch (err) {
    return { state: "error", message: err instanceof Error ? err.message : String(err) };
  }
}

function getMatches(regex: RegExp, text: string): RegExpMatchArray[] {
  if (!text) return [];
  if (regex.global) return [...text.matchAll(regex)];
  const m = text.match(regex);
  return m ? [m] : [];
}

interface Segment {
  text: string;
  match: boolean;
}

function buildSegments(text: string, matches: RegExpMatchArray[]): Segment[] {
  const ranges: Array<{ start: number; end: number }> = [];
  for (const m of matches) {
    if (m.index == null) continue;
    if (m[0].length === 0) continue;
    ranges.push({ start: m.index, end: m.index + m[0].length });
  }
  ranges.sort((a, b) => a.start - b.start);

  const out: Segment[] = [];
  let cursor = 0;
  for (const { start, end } of ranges) {
    if (start < cursor) continue;
    if (start > cursor) out.push({ text: text.slice(cursor, start), match: false });
    out.push({ text: text.slice(start, end), match: true });
    cursor = end;
  }
  if (cursor < text.length) out.push({ text: text.slice(cursor), match: false });
  return out;
}

export function RegexTool() {
  const t = useTranslations("tools.regex");
  const [pattern, setPattern] = useState("");
  const [activeFlags, setActiveFlags] = useState<Set<Flag>>(() => new Set(["g"]));
  const [test, setTest] = useState("");
  const [replacement, setReplacement] = useState("");
  const [copiedReplace, setCopiedReplace] = useState(false);

  const flagsString = useMemo(
    () => FLAGS.filter((f) => activeFlags.has(f)).join(""),
    [activeFlags],
  );

  const compiled = useMemo(() => compile(pattern, flagsString), [pattern, flagsString]);

  const matches = useMemo(() => {
    if (compiled.state !== "ok") return [];
    return getMatches(compiled.regex, test);
  }, [compiled, test]);

  const segments = useMemo(() => {
    if (compiled.state !== "ok" || !test) return null;
    return buildSegments(test, matches);
  }, [compiled, test, matches]);

  const replaced = useMemo(() => {
    if (compiled.state !== "ok" || !test) return "";
    try {
      return test.replace(compiled.regex, replacement);
    } catch {
      return "";
    }
  }, [compiled, test, replacement]);

  function toggleFlag(f: Flag) {
    const next = new Set(activeFlags);
    if (next.has(f)) next.delete(f);
    else next.add(f);
    setActiveFlags(next);
  }

  async function copyReplace() {
    if (!replaced) return;
    try {
      await navigator.clipboard.writeText(replaced);
      setCopiedReplace(true);
      setTimeout(() => setCopiedReplace(false), 1500);
    } catch {
      /* clipboard unavailable */
    }
  }

  function clearAll() {
    setPattern("");
    setTest("");
    setReplacement("");
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-2xs font-bold uppercase tracking-widest text-muted-foreground-subtle">
          {t("pattern")}
        </span>
        <div className="flex flex-1 min-w-[200px] items-center border border-border has-aria-invalid:border-destructive">
          <span className="px-2 text-muted-foreground-subtle">/</span>
          <input
            type="text"
            value={pattern}
            onChange={(e) => setPattern(e.target.value)}
            placeholder={t("patternPlaceholder")}
            spellCheck={false}
            aria-invalid={compiled.state === "error"}
            className="h-8 flex-1 bg-transparent font-mono text-xs outline-none placeholder:text-muted-foreground"
          />
          <span className="px-2 text-muted-foreground-subtle">/{flagsString}</span>
        </div>
        <div
          role="group"
          aria-label={t("flags")}
          className="flex items-center gap-px overflow-hidden rounded-none border border-border"
        >
          {FLAGS.map((f) => {
            const on = activeFlags.has(f);
            return (
              <button
                key={f}
                type="button"
                aria-pressed={on}
                onClick={() => toggleFlag(f)}
                className={`h-6 w-6 font-mono text-2xs transition-colors ${
                  on
                    ? "bg-foreground text-background"
                    : "bg-background text-muted-foreground hover:text-foreground"
                }`}
              >
                {f}
              </button>
            );
          })}
        </div>
        <Button
          size="xs"
          variant="ghost"
          onClick={clearAll}
          disabled={!pattern && !test && !replacement}
          data-umami-event="tool-regex-clear"
        >
          <Trash2 />
          {t("clear")}
        </Button>
      </div>

      {compiled.state === "error" && (
        <p className="flex items-start gap-1.5 text-2xs text-destructive">
          <span
            aria-hidden="true"
            className="mt-1 size-1.5 shrink-0 rounded-full bg-destructive"
          />
          <span>
            {t("invalidPattern")}:{" "}
            <code className="font-mono">{compiled.message}</code>
          </span>
        </p>
      )}

      <div>
        <span className="mb-2 block text-2xs font-bold uppercase tracking-widest text-muted-foreground-subtle">
          {t("testString")}
        </span>
        <Textarea
          value={test}
          onChange={(e) => setTest(e.target.value)}
          placeholder={t("testPlaceholder")}
          spellCheck={false}
          className="min-h-32 font-mono text-xs leading-relaxed"
        />
      </div>

      {segments && (
        <div className="border border-border bg-muted/20 px-3 py-2">
          <p className="whitespace-pre-wrap break-words font-mono text-xs leading-relaxed">
            {segments.map((seg, i) =>
              seg.match ? (
                <mark
                  key={i}
                  className="bg-emerald-500/30 text-foreground"
                >
                  {seg.text}
                </mark>
              ) : (
                <span key={i}>{seg.text}</span>
              ),
            )}
          </p>
        </div>
      )}

      <div>
        <span className="mb-2 block text-2xs font-bold uppercase tracking-widest text-muted-foreground-subtle">
          {t("matches")}{" "}
          {compiled.state === "ok" && (
            <span className="tabular-nums text-muted-foreground">
              ({matches.length})
            </span>
          )}
        </span>
        {compiled.state === "ok" && matches.length === 0 && test && (
          <p className="text-2xs text-muted-foreground-subtle">{t("noMatches")}</p>
        )}
        {matches.length > 0 && (
          <ul className="space-y-1.5">
            {matches.map((m, i) => (
              <li
                key={i}
                className="border border-border px-3 py-2 text-xs"
              >
                <div className="flex items-baseline gap-3">
                  <span className="text-2xs uppercase tracking-widest text-muted-foreground-subtle">
                    {t("match")} {i + 1}
                  </span>
                  {m.index != null && (
                    <span className="text-2xs tabular-nums text-muted-foreground-subtle">
                      @{m.index}
                    </span>
                  )}
                  <code className="break-all font-mono">{m[0]}</code>
                </div>
                {m.length > 1 && (
                  <div className="mt-1.5 grid grid-cols-[auto_1fr] gap-x-3 gap-y-0.5">
                    <span className="text-2xs uppercase tracking-widest text-muted-foreground-subtle">
                      {t("groups")}
                    </span>
                    <ul className="space-y-0.5">
                      {m.slice(1).map((g, gi) => (
                        <li key={gi} className="font-mono text-2xs">
                          <span className="text-muted-foreground-subtle">
                            ${gi + 1}:{" "}
                          </span>
                          <span>{g === undefined ? "—" : g}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div>
        <div className="mb-2 flex items-center justify-between gap-2">
          <span className="text-2xs font-bold uppercase tracking-widest text-muted-foreground-subtle">
            {t("replaceWith")}
          </span>
          <Button
            size="xs"
            variant="ghost"
            onClick={copyReplace}
            disabled={!replaced}
            data-umami-event="tool-regex-copy-replace"
          >
            {copiedReplace ? <Check /> : <Copy />}
            {copiedReplace ? t("copied") : t("copy")}
          </Button>
        </div>
        <input
          type="text"
          value={replacement}
          onChange={(e) => setReplacement(e.target.value)}
          placeholder={t("replacePlaceholder")}
          spellCheck={false}
          className="mb-2 h-8 w-full border border-border bg-transparent px-2.5 font-mono text-xs outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-1 focus-visible:ring-ring/50"
        />
        <div className="min-h-16 whitespace-pre-wrap break-words border border-border bg-transparent px-2.5 py-2 font-mono text-xs leading-relaxed">
          {replaced || (
            <span className="text-muted-foreground-subtle">—</span>
          )}
        </div>
      </div>
    </div>
  );
}
