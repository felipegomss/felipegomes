"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { faker } from "@faker-js/faker";
import { Check, Copy, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useMountEffect } from "@/hooks/use-mount-effect";

type Mode = "words" | "sentences" | "paragraphs";

function generateLorem(mode: Mode, count: number): string {
  const n = Math.max(1, Math.min(50, count));
  if (mode === "words") return faker.lorem.words(n);
  if (mode === "sentences") return faker.lorem.sentences(n, " ");
  return faker.lorem.paragraphs(n, "\n\n");
}

export function LoremTool() {
  const t = useTranslations("tools.lorem");
  const [mode, setMode] = useState<Mode>("paragraphs");
  const [count, setCount] = useState(3);
  const [output, setOutput] = useState("");
  const [copied, setCopied] = useState(false);

  useMountEffect(() => {
    setOutput(generateLorem("paragraphs", 3));
  });

  function regenerate(nextMode = mode, nextCount = count) {
    setOutput(generateLorem(nextMode, nextCount));
  }

  function updateMode(m: Mode) {
    setMode(m);
    regenerate(m, count);
  }

  function updateCount(n: number) {
    const clamped = Math.max(1, Math.min(50, n));
    setCount(clamped);
    regenerate(mode, clamped);
  }

  async function copy() {
    if (!output) return;
    try {
      await navigator.clipboard.writeText(output);
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
            {t("mode")}
          </span>
          <div
            role="radiogroup"
            aria-label={t("mode")}
            className="flex items-center gap-px overflow-hidden rounded-none border border-border"
          >
            {(["words", "sentences", "paragraphs"] as const).map((opt) => (
              <button
                key={opt}
                role="radio"
                aria-checked={mode === opt}
                onClick={() => updateMode(opt)}
                className={`h-6 px-2 text-2xs transition-colors ${
                  mode === opt
                    ? "bg-foreground text-background"
                    : "bg-background text-muted-foreground hover:text-foreground"
                }`}
              >
                {opt === "words"
                  ? t("modeWords")
                  : opt === "sentences"
                    ? t("modeSentences")
                    : t("modeParagraphs")}
              </button>
            ))}
          </div>
        </div>

        <label className="flex items-center gap-2">
          <span className="text-2xs uppercase tracking-widest text-muted-foreground-subtle">
            {t("count")}
          </span>
          <input
            type="number"
            min={1}
            max={50}
            value={count}
            onChange={(e) => updateCount(Number(e.target.value) || 1)}
            className="h-6 w-14 border border-border bg-transparent px-2 text-xs tabular-nums outline-none focus-visible:border-ring focus-visible:ring-1 focus-visible:ring-ring/50"
          />
        </label>

        <div className="ml-auto flex items-center gap-2">
          <Button
            size="xs"
            variant="outline"
            onClick={() => regenerate()}
            data-umami-event="tool-lorem-regenerate"
          >
            <RefreshCw />
            {t("regenerate")}
          </Button>
          <Button
            size="xs"
            variant="ghost"
            onClick={copy}
            disabled={!output}
            data-umami-event="tool-lorem-copy"
          >
            {copied ? <Check /> : <Copy />}
            {copied ? t("copied") : t("copy")}
          </Button>
        </div>
      </div>

      <Textarea
        readOnly
        value={output}
        className="min-h-[300px] font-mono text-xs leading-relaxed"
      />
    </div>
  );
}
