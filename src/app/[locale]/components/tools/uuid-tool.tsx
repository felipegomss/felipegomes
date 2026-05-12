"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Check, Copy, RefreshCw, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

type Version = "v4" | "v7";

function uuidV4(): string {
  return crypto.randomUUID();
}

function uuidV7(): string {
  const ms = Date.now();
  const hi = Math.floor(ms / 0x100000000);
  const lo = ms >>> 0;
  const bytes = new Uint8Array(16);
  bytes[0] = (hi >>> 8) & 0xff;
  bytes[1] = hi & 0xff;
  bytes[2] = (lo >>> 24) & 0xff;
  bytes[3] = (lo >>> 16) & 0xff;
  bytes[4] = (lo >>> 8) & 0xff;
  bytes[5] = lo & 0xff;
  const rand = new Uint8Array(10);
  crypto.getRandomValues(rand);
  bytes.set(rand, 6);
  bytes[6] = (bytes[6] & 0x0f) | 0x70;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

function generate(version: Version, count: number): string[] {
  const fn = version === "v4" ? uuidV4 : uuidV7;
  return Array.from({ length: count }, fn);
}

function RowCopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setCopied(true);
          setTimeout(() => setCopied(false), 1200);
        } catch {
          /* clipboard unavailable */
        }
      }}
      aria-label="copy"
      className="flex items-center text-muted-foreground transition-colors hover:text-foreground"
    >
      {copied ? <Check size={12} /> : <Copy size={12} />}
    </button>
  );
}

export function UuidTool() {
  const t = useTranslations("tools.uuid");
  const [version, setVersion] = useState<Version>("v4");
  const [count, setCount] = useState(5);
  const [items, setItems] = useState<string[]>(() => generate("v4", 5));
  const [copiedAll, setCopiedAll] = useState(false);

  async function copyAll() {
    try {
      await navigator.clipboard.writeText(items.join("\n"));
      setCopiedAll(true);
      setTimeout(() => setCopiedAll(false), 1500);
    } catch {
      /* clipboard unavailable */
    }
  }

  function regenerate(nextVersion = version, nextCount = count) {
    setItems(generate(nextVersion, nextCount));
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <span className="text-2xs uppercase tracking-widest text-muted-foreground-subtle">
            {t("version")}
          </span>
          <div
            role="radiogroup"
            aria-label={t("version")}
            className="flex items-center gap-px overflow-hidden rounded-none border border-border"
          >
            {(["v4", "v7"] as const).map((opt) => (
              <button
                key={opt}
                role="radio"
                aria-checked={version === opt}
                onClick={() => {
                  setVersion(opt);
                  regenerate(opt, count);
                }}
                className={`h-6 px-2 text-2xs uppercase transition-colors ${
                  version === opt
                    ? "bg-foreground text-background"
                    : "bg-background text-muted-foreground hover:text-foreground"
                }`}
              >
                {opt}
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
            max={100}
            value={count}
            onChange={(e) => {
              const next = Math.max(1, Math.min(100, Number(e.target.value) || 1));
              setCount(next);
            }}
            className="h-6 w-14 border border-border bg-transparent px-2 text-xs tabular-nums outline-none focus-visible:border-ring focus-visible:ring-1 focus-visible:ring-ring/50"
          />
        </label>

        <div className="ml-auto flex items-center gap-2">
          <Button
            size="xs"
            variant="outline"
            onClick={() => regenerate()}
            data-umami-event="tool-uuid-generate"
          >
            <RefreshCw />
            {t("generate")}
          </Button>
          <Button
            size="xs"
            variant="ghost"
            onClick={copyAll}
            disabled={items.length === 0}
            data-umami-event="tool-uuid-copy-all"
          >
            {copiedAll ? <Check /> : <Copy />}
            {copiedAll ? t("copied") : t("copyAll")}
          </Button>
          <Button
            size="xs"
            variant="ghost"
            onClick={() => setItems([])}
            disabled={items.length === 0}
            data-umami-event="tool-uuid-clear"
          >
            <Trash2 />
            {t("clear")}
          </Button>
        </div>
      </div>

      <ul className="divide-y divide-border border border-border" role="list">
        {items.map((id, i) => (
          <li
            key={`${id}-${i}`}
            className="flex items-center justify-between gap-3 px-3 py-2"
          >
            <code className="break-all font-mono text-xs">{id}</code>
            <RowCopyButton text={id} />
          </li>
        ))}
        {items.length === 0 && (
          <li className="px-3 py-4 text-center text-2xs text-muted-foreground-subtle">
            —
          </li>
        )}
      </ul>
    </div>
  );
}
