"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { Check, Copy, FileJson, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

type Indent = 2 | 4 | "tab";

const SAMPLE = `{"name":"Luis Felipe","role":"Full Stack","stack":["React","Next.js","Node","Go"],"years":5,"address":{"city":"Salvador","country":"BR"}}`;

function indentChar(indent: Indent): string | number {
  return indent === "tab" ? "\t" : indent;
}

function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(2)} MB`;
}

export function JsonTool() {
  const t = useTranslations("tools.json");
  const [value, setValue] = useState("");
  const [indent, setIndent] = useState<Indent>(2);
  const [copied, setCopied] = useState(false);

  const status = useMemo(() => {
    if (!value.trim()) return { state: "empty" as const };
    try {
      JSON.parse(value);
      return { state: "valid" as const };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      return { state: "invalid" as const, message };
    }
  }, [value]);

  function transform(mode: "format" | "minify") {
    if (status.state !== "valid") return;
    try {
      const parsed = JSON.parse(value);
      const next =
        mode === "format"
          ? JSON.stringify(parsed, null, indentChar(indent))
          : JSON.stringify(parsed);
      setValue(next);
    } catch {
      /* status already reflects invalid state */
    }
  }

  async function handleCopy() {
    if (!value) return;
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard unavailable */
    }
  }

  const byteSize = useMemo(
    () => new TextEncoder().encode(value).length,
    [value],
  );

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <Button
          size="xs"
          variant="outline"
          onClick={() => transform("format")}
          disabled={status.state !== "valid"}
          data-umami-event="tool-json-format"
        >
          {t("format")}
        </Button>
        <Button
          size="xs"
          variant="outline"
          onClick={() => transform("minify")}
          disabled={status.state !== "valid"}
          data-umami-event="tool-json-minify"
        >
          {t("minify")}
        </Button>

        <div
          role="radiogroup"
          aria-label={t("indent")}
          className="flex items-center gap-px overflow-hidden rounded-none border border-border"
        >
          {([2, 4, "tab"] as const).map((opt) => (
            <button
              key={String(opt)}
              role="radio"
              aria-checked={indent === opt}
              onClick={() => setIndent(opt)}
              className={`h-6 px-2 text-2xs transition-colors ${
                indent === opt
                  ? "bg-foreground text-background"
                  : "bg-background text-muted-foreground hover:text-foreground"
              }`}
            >
              {opt === "tab" ? t("indentTab") : `${opt}`}
            </button>
          ))}
        </div>

        <div className="ml-auto flex items-center gap-2">
          <Button
            size="xs"
            variant="ghost"
            onClick={() => setValue(SAMPLE)}
            data-umami-event="tool-json-sample"
          >
            <FileJson />
            {t("sample")}
          </Button>
          <Button
            size="xs"
            variant="ghost"
            onClick={handleCopy}
            disabled={!value}
            data-umami-event="tool-json-copy"
          >
            {copied ? <Check /> : <Copy />}
            {copied ? t("copied") : t("copy")}
          </Button>
          <Button
            size="xs"
            variant="ghost"
            onClick={() => setValue("")}
            disabled={!value}
            data-umami-event="tool-json-clear"
          >
            <Trash2 />
            {t("clear")}
          </Button>
        </div>
      </div>

      <Textarea
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={t("placeholder")}
        spellCheck={false}
        aria-invalid={status.state === "invalid"}
        aria-describedby="json-status"
        className="min-h-[420px] font-mono text-xs leading-relaxed"
      />

      <div
        id="json-status"
        className="flex flex-wrap items-center justify-between gap-2 text-2xs"
      >
        <div className="flex items-center gap-1.5">
          {status.state === "empty" && (
            <span className="text-muted-foreground-subtle">{t("empty")}</span>
          )}
          {status.state === "valid" && (
            <>
              <span
                aria-hidden="true"
                className="size-1.5 rounded-full bg-emerald-500"
              />
              <span className="text-muted-foreground">{t("valid")}</span>
            </>
          )}
          {status.state === "invalid" && (
            <>
              <span
                aria-hidden="true"
                className="size-1.5 rounded-full bg-destructive"
              />
              <span className="text-destructive">
                {t("invalid")}:{" "}
                <code className="font-mono">{status.message}</code>
              </span>
            </>
          )}
        </div>

        <span className="tabular-nums text-muted-foreground-subtle">
          {value.length.toLocaleString()} {t("chars")} · {formatBytes(byteSize)}
        </span>
      </div>
    </div>
  );
}
