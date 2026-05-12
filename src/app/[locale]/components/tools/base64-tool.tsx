"use client";

import { useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { ArrowDownUp, Check, Copy, Download, Trash2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

type Mode = "text" | "file";
type Direction = "encode" | "decode";

function encodeText(input: string): string {
  const bytes = new TextEncoder().encode(input);
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin);
}

function decodeText(input: string): string {
  const cleaned = input.replace(/\s+/g, "");
  const bin = atob(cleaned);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new TextDecoder("utf-8", { fatal: true }).decode(bytes);
}

function bytesToBase64(bytes: Uint8Array): string {
  let bin = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    bin += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(bin);
}

function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(2)} MB`;
}

function useCopy() {
  const [copied, setCopied] = useState(false);
  return {
    copied,
    copy: async (text: string) => {
      try {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      } catch {
        /* clipboard unavailable */
      }
    },
  };
}

function SegmentedToggle<T extends string>({
  options,
  value,
  onChange,
  ariaLabel,
}: {
  options: ReadonlyArray<{ value: T; label: string }>;
  value: T;
  onChange: (v: T) => void;
  ariaLabel: string;
}) {
  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      className="flex items-center gap-px overflow-hidden rounded-none border border-border"
    >
      {options.map((opt) => (
        <button
          key={opt.value}
          role="radio"
          aria-checked={value === opt.value}
          onClick={() => onChange(opt.value)}
          className={`h-6 px-2 text-2xs transition-colors ${
            value === opt.value
              ? "bg-foreground text-background"
              : "bg-background text-muted-foreground hover:text-foreground"
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

function TextMode() {
  const t = useTranslations("tools.base64");
  const [direction, setDirection] = useState<Direction>("encode");
  const [value, setValue] = useState("");
  const { copied, copy } = useCopy();

  const result = useMemo(() => {
    if (!value.trim()) return { state: "empty" as const };
    try {
      const output =
        direction === "encode" ? encodeText(value) : decodeText(value);
      return { state: "ok" as const, output };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      return { state: "error" as const, message };
    }
  }, [value, direction]);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <SegmentedToggle
          ariaLabel={t("input")}
          value={direction}
          onChange={setDirection}
          options={[
            { value: "encode", label: t("encode") },
            { value: "decode", label: t("decode") },
          ]}
        />
        <div className="ml-auto flex items-center gap-2">
          <Button
            size="xs"
            variant="ghost"
            onClick={() => {
              if (result.state !== "ok") return;
              setValue(result.output);
              setDirection(direction === "encode" ? "decode" : "encode");
            }}
            disabled={result.state !== "ok"}
            data-umami-event="tool-base64-swap"
          >
            <ArrowDownUp />
            {t("swap")}
          </Button>
          <Button
            size="xs"
            variant="ghost"
            onClick={() => result.state === "ok" && copy(result.output)}
            disabled={result.state !== "ok"}
            data-umami-event="tool-base64-copy"
          >
            {copied ? <Check /> : <Copy />}
            {copied ? t("copied") : t("copy")}
          </Button>
          <Button
            size="xs"
            variant="ghost"
            onClick={() => setValue("")}
            disabled={!value}
            data-umami-event="tool-base64-clear"
          >
            <Trash2 />
            {t("clear")}
          </Button>
        </div>
      </div>

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
            {t("invalid")}:{" "}
            <code className="font-mono">{result.message}</code>
          </span>
        )}
        {result.state === "empty" && (
          <span className="text-muted-foreground-subtle">—</span>
        )}
      </div>
    </div>
  );
}

function FileMode() {
  const t = useTranslations("tools.base64");
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [encoded, setEncoded] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const { copied, copy } = useCopy();

  async function handleFile(f: File) {
    setFile(f);
    const buf = await f.arrayBuffer();
    setEncoded(bytesToBase64(new Uint8Array(buf)));
  }

  function downloadAsText() {
    const blob = new Blob([encoded], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${file?.name ?? "encoded"}.b64.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function reset() {
    setFile(null);
    setEncoded("");
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <div className="space-y-3">
      <label
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragging(false);
          const f = e.dataTransfer.files?.[0];
          if (f) handleFile(f);
        }}
        className={`flex min-h-32 cursor-pointer flex-col items-center justify-center gap-2 border border-dashed px-4 py-6 text-center text-xs transition-colors ${
          isDragging
            ? "border-foreground bg-muted/60"
            : "border-border text-muted-foreground hover:bg-muted/30"
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          className="sr-only"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleFile(f);
          }}
        />
        <Upload size={16} aria-hidden="true" />
        <span>{t("dropZone")}</span>
        {file && (
          <span className="mt-1 text-2xs text-foreground">
            {t("fileSelected")}: <span className="font-medium">{file.name}</span>{" "}
            · {formatBytes(file.size)}
          </span>
        )}
      </label>

      {encoded && (
        <>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-2xs text-muted-foreground-subtle">
              {t("output")}
            </span>
            <div className="ml-auto flex items-center gap-2">
              <Button
                size="xs"
                variant="ghost"
                onClick={() => copy(encoded)}
                data-umami-event="tool-base64-file-copy"
              >
                {copied ? <Check /> : <Copy />}
                {copied ? t("copied") : t("copy")}
              </Button>
              <Button
                size="xs"
                variant="ghost"
                onClick={downloadAsText}
                data-umami-event="tool-base64-file-download"
              >
                <Download />
                {t("downloadEncoded")}
              </Button>
              <Button
                size="xs"
                variant="ghost"
                onClick={reset}
                data-umami-event="tool-base64-file-clear"
              >
                <Trash2 />
                {t("clear")}
              </Button>
            </div>
          </div>
          <Textarea
            readOnly
            value={encoded}
            className="min-h-32 break-all font-mono text-xs leading-relaxed"
          />
        </>
      )}
    </div>
  );
}

export function Base64Tool() {
  const t = useTranslations("tools.base64");
  const [mode, setMode] = useState<Mode>("text");

  return (
    <div className="space-y-4">
      <SegmentedToggle
        ariaLabel="mode"
        value={mode}
        onChange={setMode}
        options={[
          { value: "text", label: t("modeText") },
          { value: "file", label: t("modeFile") },
        ]}
      />
      {mode === "text" ? <TextMode /> : <FileMode />}
    </div>
  );
}
