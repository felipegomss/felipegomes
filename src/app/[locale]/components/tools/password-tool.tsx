"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Check, Copy, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useMountEffect } from "@/hooks/use-mount-effect";

interface Options {
  upper: boolean;
  lower: boolean;
  digits: boolean;
  symbols: boolean;
  excludeAmbiguous: boolean;
}

const AMBIGUOUS = new Set("0O1lI");

function buildCharset(opts: Options): string {
  let cs = "";
  if (opts.upper) cs += "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  if (opts.lower) cs += "abcdefghijklmnopqrstuvwxyz";
  if (opts.digits) cs += "0123456789";
  if (opts.symbols) cs += "!@#$%^&*()-_=+[]{};:,.<>/?";
  if (opts.excludeAmbiguous) {
    cs = [...cs].filter((c) => !AMBIGUOUS.has(c)).join("");
  }
  return cs;
}

function randomFromCharset(charset: string, length: number): string {
  const size = charset.length;
  if (size === 0) return "";
  const limit = Math.floor(256 / size) * size;
  const out: string[] = [];
  const buf = new Uint8Array(1);
  while (out.length < length) {
    crypto.getRandomValues(buf);
    if (buf[0] < limit) out.push(charset[buf[0] % size]);
  }
  return out.join("");
}

function entropyBits(charsetSize: number, length: number): number {
  if (charsetSize <= 1) return 0;
  return length * Math.log2(charsetSize);
}

export function PasswordTool() {
  const t = useTranslations("tools.password");
  const [length, setLength] = useState(16);
  const [opts, setOpts] = useState<Options>({
    upper: true,
    lower: true,
    digits: true,
    symbols: true,
    excludeAmbiguous: false,
  });
  const [password, setPassword] = useState("");
  const [copied, setCopied] = useState(false);

  function regenerate(nextOpts = opts, nextLength = length) {
    const charset = buildCharset(nextOpts);
    setPassword(charset ? randomFromCharset(charset, nextLength) : "");
  }

  useMountEffect(() => {
    regenerate();
  });

  function updateLength(n: number) {
    const clamped = Math.max(8, Math.min(128, n));
    setLength(clamped);
    regenerate(opts, clamped);
  }

  function toggleOpt(key: keyof Options) {
    const next = { ...opts, [key]: !opts[key] };
    setOpts(next);
    regenerate(next, length);
  }

  async function copy() {
    if (!password) return;
    try {
      await navigator.clipboard.writeText(password);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard unavailable */
    }
  }

  const charset = buildCharset(opts);
  const bits = entropyBits(charset.length, length);
  const noCharset = charset.length === 0;

  const checkboxes: Array<{ key: keyof Options; label: string }> = [
    { key: "upper", label: t("charsetUpper") },
    { key: "lower", label: t("charsetLower") },
    { key: "digits", label: t("charsetDigits") },
    { key: "symbols", label: t("charsetSymbols") },
    { key: "excludeAmbiguous", label: t("excludeAmbiguous") },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 border border-border px-3 py-2">
        <code className="flex-1 break-all font-mono text-xs">
          {password || (
            <span className="text-muted-foreground-subtle">—</span>
          )}
        </code>
        <Button
          size="xs"
          variant="ghost"
          onClick={copy}
          disabled={!password}
          data-umami-event="tool-password-copy"
        >
          {copied ? <Check /> : <Copy />}
          {copied ? t("copied") : t("copy")}
        </Button>
        <Button
          size="xs"
          variant="outline"
          onClick={() => regenerate()}
          disabled={noCharset}
          data-umami-event="tool-password-regenerate"
        >
          <RefreshCw />
          {t("regenerate")}
        </Button>
      </div>

      <div className="flex items-center justify-between text-2xs text-muted-foreground">
        <span>
          {t("entropy")}: <span className="tabular-nums">{Math.round(bits)}</span> {t("bits")}
        </span>
        {noCharset && (
          <span className="text-destructive">{t("noCharset")}</span>
        )}
      </div>

      <div className="space-y-3 border border-border p-4">
        <label className="flex items-center gap-3">
          <span className="w-24 text-2xs uppercase tracking-widest text-muted-foreground-subtle">
            {t("length")}
          </span>
          <input
            type="range"
            min={8}
            max={64}
            value={length}
            onChange={(e) => updateLength(Number(e.target.value))}
            className="flex-1 accent-foreground"
          />
          <input
            type="number"
            min={8}
            max={128}
            value={length}
            onChange={(e) => updateLength(Number(e.target.value) || 8)}
            className="h-6 w-14 border border-border bg-transparent px-2 text-xs tabular-nums outline-none focus-visible:border-ring focus-visible:ring-1 focus-visible:ring-ring/50"
          />
        </label>

        <ul className="grid grid-cols-1 gap-1.5 sm:grid-cols-2" role="list">
          {checkboxes.map((cb) => (
            <li key={cb.key}>
              <label className="flex cursor-pointer items-center gap-2 text-xs text-muted-foreground hover:text-foreground">
                <input
                  type="checkbox"
                  checked={opts[cb.key]}
                  onChange={() => toggleOpt(cb.key)}
                  className="size-3.5 accent-foreground"
                />
                {cb.label}
              </label>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
