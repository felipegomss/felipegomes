"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { ArrowDownUp, Check, Copy, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

type Direction = "encode" | "decode";
type Mode = "component" | "full";

function transform(value: string, direction: Direction, mode: Mode): string {
  const fn =
    direction === "encode"
      ? mode === "component"
        ? encodeURIComponent
        : encodeURI
      : mode === "component"
        ? decodeURIComponent
        : decodeURI;
  return fn(value);
}

export function UrlTool() {
  const t = useTranslations("tools.url");
  const [value, setValue] = useState("");
  const [direction, setDirection] = useState<Direction>("encode");
  const [mode, setMode] = useState<Mode>("component");
  const [copied, setCopied] = useState(false);

  const result = useMemo(() => {
    if (!value) return { state: "empty" as const };
    try {
      return { state: "ok" as const, output: transform(value, direction, mode) };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      return { state: "error" as const, message };
    }
  }, [value, direction, mode]);

  async function handleCopy() {
    if (result.state !== "ok") return;
    try {
      await navigator.clipboard.writeText(result.output);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard unavailable */
    }
  }

  function handleSwap() {
    if (result.state !== "ok") return;
    setValue(result.output);
    setDirection(direction === "encode" ? "decode" : "encode");
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <div
          role="radiogroup"
          aria-label={t("input")}
          className="flex items-center gap-px overflow-hidden rounded-none border border-border"
        >
          {(["encode", "decode"] as const).map((opt) => (
            <button
              key={opt}
              role="radio"
              aria-checked={direction === opt}
              onClick={() => setDirection(opt)}
              className={`h-6 px-2 text-2xs transition-colors ${
                direction === opt
                  ? "bg-foreground text-background"
                  : "bg-background text-muted-foreground hover:text-foreground"
              }`}
            >
              {t(opt)}
            </button>
          ))}
        </div>

        <div
          role="radiogroup"
          aria-label="mode"
          className="flex items-center gap-px overflow-hidden rounded-none border border-border"
          title={
            mode === "component" ? t("modeComponentHint") : t("modeFullHint")
          }
        >
          {(["component", "full"] as const).map((opt) => (
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
              {opt === "component" ? t("modeComponent") : t("modeFull")}
            </button>
          ))}
        </div>

        <div className="ml-auto flex items-center gap-2">
          <Button
            size="xs"
            variant="ghost"
            onClick={handleSwap}
            disabled={result.state !== "ok"}
            data-umami-event="tool-url-swap"
          >
            <ArrowDownUp />
            {t("swap")}
          </Button>
          <Button
            size="xs"
            variant="ghost"
            onClick={handleCopy}
            disabled={result.state !== "ok"}
            data-umami-event="tool-url-copy"
          >
            {copied ? <Check /> : <Copy />}
            {copied ? t("copied") : t("copy")}
          </Button>
          <Button
            size="xs"
            variant="ghost"
            onClick={() => setValue("")}
            disabled={!value}
            data-umami-event="tool-url-clear"
          >
            <Trash2 />
            {t("clear")}
          </Button>
        </div>
      </div>

      <p className="text-2xs text-muted-foreground-subtle">
        {mode === "component" ? t("modeComponentHint") : t("modeFullHint")}
      </p>

      <Textarea
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={
          direction === "encode" ? t("placeholderEncode") : t("placeholderDecode")
        }
        spellCheck={false}
        aria-invalid={result.state === "error"}
        className="min-h-32 break-all font-mono text-xs leading-relaxed"
      />

      <div className="text-2xs">
        <span className="text-muted-foreground-subtle">{t("output")}</span>
      </div>
      <div
        className={`min-h-32 whitespace-pre-wrap break-all border bg-transparent px-2.5 py-2 font-mono text-xs leading-relaxed ${
          result.state === "error" ? "border-destructive" : "border-border"
        }`}
      >
        {result.state === "ok" && result.output}
        {result.state === "error" && (
          <span className="text-destructive">
            {t("invalid")}: <code className="font-mono">{result.message}</code>
          </span>
        )}
        {result.state === "empty" && (
          <span className="text-muted-foreground-subtle">—</span>
        )}
      </div>
    </div>
  );
}
