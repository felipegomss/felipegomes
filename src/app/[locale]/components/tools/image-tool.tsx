"use client";

import { useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Check, Copy, Trash2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ImageData {
  name: string;
  type: string;
  size: number;
  width: number;
  height: number;
  base64: string;
  dataUri: string;
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

function loadDimensions(
  dataUri: string,
): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () =>
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
    img.onerror = () => reject(new Error("Could not load image"));
    img.src = dataUri;
  });
}

function Row({ label, value }: { label: string; value: string }) {
  const t = useTranslations("tools.image");
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
    <div className="border border-border">
      <header className="flex items-center justify-between border-b border-border bg-muted/40 px-3 py-1.5">
        <span className="text-2xs font-bold uppercase tracking-widest text-muted-foreground">
          {label}
        </span>
        <Button
          size="xs"
          variant="ghost"
          onClick={copy}
          data-umami-event="tool-image-copy"
          data-umami-event-field={label}
        >
          {copied ? <Check /> : <Copy />}
          {copied ? t("copied") : t("copy")}
        </Button>
      </header>
      <div className="overflow-x-auto px-3 py-2">
        <code className="block break-all font-mono text-xs leading-relaxed">
          {value}
        </code>
      </div>
    </div>
  );
}

export function ImageTool() {
  const t = useTranslations("tools.image");
  const inputRef = useRef<HTMLInputElement>(null);
  const [data, setData] = useState<ImageData | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  async function handleFile(f: File) {
    if (!f.type.startsWith("image/")) return;
    const buf = await f.arrayBuffer();
    const base64 = bytesToBase64(new Uint8Array(buf));
    const dataUri = `data:${f.type};base64,${base64}`;
    try {
      const { width, height } = await loadDimensions(dataUri);
      setData({
        name: f.name,
        type: f.type,
        size: f.size,
        width,
        height,
        base64,
        dataUri,
      });
    } catch {
      setData({
        name: f.name,
        type: f.type,
        size: f.size,
        width: 0,
        height: 0,
        base64,
        dataUri,
      });
    }
  }

  function reset() {
    setData(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  const html = data
    ? `<img src="${data.dataUri}" alt="" width="${data.width}" height="${data.height}" />`
    : "";
  const css = data ? `background-image: url("${data.dataUri}");` : "";

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
          accept="image/*"
          className="sr-only"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleFile(f);
          }}
        />
        <Upload size={16} aria-hidden="true" />
        <span>{t("dropZone")}</span>
      </label>

      {data && (
        <>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-[200px_1fr]">
            <div className="flex items-center justify-center border border-border bg-[repeating-conic-gradient(#0001_0_25%,transparent_0_50%)] [background-size:16px_16px] p-2">
              <img
                src={data.dataUri}
                alt=""
                className="max-h-48 max-w-full object-contain"
              />
            </div>
            <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 self-start text-2xs">
              <dt className="text-muted-foreground-subtle">{t("fileSelected")}</dt>
              <dd className="font-mono">{data.name}</dd>
              <dt className="text-muted-foreground-subtle">MIME</dt>
              <dd className="font-mono">{data.type}</dd>
              <dt className="text-muted-foreground-subtle">{t("dimensions")}</dt>
              <dd className="font-mono tabular-nums">
                {data.width} × {data.height}
              </dd>
              <dt className="text-muted-foreground-subtle">Size</dt>
              <dd className="font-mono tabular-nums">
                {formatBytes(data.size)} → {formatBytes(data.base64.length)} (base64)
              </dd>
            </dl>
          </div>

          <div className="flex items-center justify-end">
            <Button
              size="xs"
              variant="ghost"
              onClick={reset}
              data-umami-event="tool-image-clear"
            >
              <Trash2 />
              {t("clear")}
            </Button>
          </div>

          <div className="space-y-2">
            <Row label={t("labels.dataUri")} value={data.dataUri} />
            <Row label={t("labels.base64")} value={data.base64} />
            <Row label={t("labels.html")} value={html} />
            <Row label={t("labels.css")} value={css} />
          </div>
        </>
      )}
    </div>
  );
}
