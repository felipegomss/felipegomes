"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { Check, Copy, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

function slugify(input: string, separator: string, lowercase: boolean): string {
  const base = input
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^a-zA-Z0-9\s-_]/g, "")
    .trim()
    .replace(/[\s_-]+/g, separator);
  return lowercase ? base.toLowerCase() : base;
}

export function SlugTool() {
  const t = useTranslations("tools.slug");
  const [value, setValue] = useState("");
  const [separator, setSeparator] = useState("-");
  const [lowercase, setLowercase] = useState(true);
  const [copied, setCopied] = useState(false);

  const result = useMemo(
    () => slugify(value, separator, lowercase),
    [value, separator, lowercase],
  );

  async function copy() {
    if (!result) return;
    try {
      await navigator.clipboard.writeText(result);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard unavailable */
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <span className="text-2xs uppercase tracking-widest text-muted-foreground-subtle">
            {t("separator")}
          </span>
          <div
            role="radiogroup"
            aria-label={t("separator")}
            className="flex items-center gap-px overflow-hidden rounded-none border border-border"
          >
            {(["-", "_"] as const).map((opt) => (
              <button
                key={opt}
                role="radio"
                aria-checked={separator === opt}
                onClick={() => setSeparator(opt)}
                className={`h-6 w-6 font-mono text-2xs transition-colors ${
                  separator === opt
                    ? "bg-foreground text-background"
                    : "bg-background text-muted-foreground hover:text-foreground"
                }`}
              >
                {opt}
              </button>
            ))}
          </div>
        </div>
        <label className="flex cursor-pointer items-center gap-2 text-xs text-muted-foreground hover:text-foreground">
          <input
            type="checkbox"
            checked={lowercase}
            onChange={(e) => setLowercase(e.target.checked)}
            className="size-3.5 accent-foreground"
          />
          {t("lowercase")}
        </label>
        <Button
          size="xs"
          variant="ghost"
          onClick={() => setValue("")}
          disabled={!value}
          data-umami-event="tool-slug-clear"
          className="ml-auto"
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

      <div className="grid grid-cols-[80px_1fr_auto] items-center gap-3 border border-border px-3 py-2">
        <span className="text-2xs font-bold uppercase tracking-widest text-muted-foreground-subtle">
          {t("output")}
        </span>
        <code className="break-all font-mono text-xs">
          {result || (
            <span className="text-muted-foreground-subtle">{t("empty")}</span>
          )}
        </code>
        <Button
          size="xs"
          variant="ghost"
          onClick={copy}
          disabled={!result}
          data-umami-event="tool-slug-copy"
        >
          {copied ? <Check /> : <Copy />}
          {copied ? t("copied") : t("copy")}
        </Button>
      </div>
    </div>
  );
}
