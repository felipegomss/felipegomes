"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { Check, Copy, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Rgba {
  r: number;
  g: number;
  b: number;
  a: number;
}

function hslToRgb(h: number, s: number, l: number): { r: number; g: number; b: number } {
  const hh = (((h % 360) + 360) % 360) / 60;
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs((hh % 2) - 1));
  const m = l - c / 2;
  let r1 = 0,
    g1 = 0,
    b1 = 0;
  if (hh < 1) [r1, g1, b1] = [c, x, 0];
  else if (hh < 2) [r1, g1, b1] = [x, c, 0];
  else if (hh < 3) [r1, g1, b1] = [0, c, x];
  else if (hh < 4) [r1, g1, b1] = [0, x, c];
  else if (hh < 5) [r1, g1, b1] = [x, 0, c];
  else [r1, g1, b1] = [c, 0, x];
  return {
    r: Math.round((r1 + m) * 255),
    g: Math.round((g1 + m) * 255),
    b: Math.round((b1 + m) * 255),
  };
}

function rgbToHsl(r: number, g: number, b: number): { h: number; s: number; l: number } {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const d = max - min;
  const l = (max + min) / 2;
  let h = 0;
  let s = 0;
  if (d > 0) {
    s = d / (1 - Math.abs(2 * l - 1));
    if (max === rn) h = (((gn - bn) / d) % 6 + 6) % 6;
    else if (max === gn) h = (bn - rn) / d + 2;
    else h = (rn - gn) / d + 4;
    h *= 60;
  }
  return { h, s, l };
}

function srgbToLinear(c: number): number {
  const v = c / 255;
  return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
}

function rgbToOklch(r: number, g: number, b: number): { l: number; c: number; h: number } {
  const lr = srgbToLinear(r);
  const lg = srgbToLinear(g);
  const lb = srgbToLinear(b);
  const L_ = 0.4122214708 * lr + 0.5363325363 * lg + 0.0514459929 * lb;
  const M_ = 0.2119034982 * lr + 0.6806995451 * lg + 0.1073969566 * lb;
  const S_ = 0.0883024619 * lr + 0.2817188376 * lg + 0.6299787005 * lb;
  const l_ = Math.cbrt(L_);
  const m_ = Math.cbrt(M_);
  const s_ = Math.cbrt(S_);
  const L = 0.2104542553 * l_ + 0.793617785 * m_ - 0.0040720468 * s_;
  const A = 1.9779984951 * l_ - 2.428592205 * m_ + 0.4505937099 * s_;
  const B = 0.0259040371 * l_ + 0.7827717662 * m_ - 0.808675766 * s_;
  const C = Math.sqrt(A * A + B * B);
  let h = (Math.atan2(B, A) * 180) / Math.PI;
  if (h < 0) h += 360;
  return { l: L, c: C, h };
}

function parseColor(input: string): Rgba | null {
  const s = input.trim().toLowerCase();
  if (!s) return null;

  const hex = s.match(/^#?([0-9a-f]{3,8})$/);
  if (hex) {
    let h = hex[1];
    if (h.length === 3) h = [...h].map((c) => c + c).join("");
    else if (h.length === 4) h = [...h].map((c) => c + c).join("");
    if (h.length !== 6 && h.length !== 8) return null;
    const r = parseInt(h.slice(0, 2), 16);
    const g = parseInt(h.slice(2, 4), 16);
    const b = parseInt(h.slice(4, 6), 16);
    const a = h.length === 8 ? parseInt(h.slice(6, 8), 16) / 255 : 1;
    return { r, g, b, a };
  }

  const rgb = s.match(
    /^rgba?\(\s*(\d{1,3})[\s,]+(\d{1,3})[\s,]+(\d{1,3})(?:[\s,/]+(\d*\.?\d+%?))?\s*\)$/,
  );
  if (rgb) {
    const r = Number(rgb[1]);
    const g = Number(rgb[2]);
    const b = Number(rgb[3]);
    if ([r, g, b].some((v) => v < 0 || v > 255)) return null;
    let a = 1;
    if (rgb[4]) {
      a = rgb[4].endsWith("%") ? parseFloat(rgb[4]) / 100 : Number(rgb[4]);
    }
    return { r, g, b, a };
  }

  const hsl = s.match(
    /^hsla?\(\s*(-?\d*\.?\d+)(?:deg)?[\s,]+(\d*\.?\d+)%?[\s,]+(\d*\.?\d+)%?(?:[\s,/]+(\d*\.?\d+%?))?\s*\)$/,
  );
  if (hsl) {
    const h = Number(hsl[1]);
    const sPct = Number(hsl[2]) / 100;
    const lPct = Number(hsl[3]) / 100;
    let a = 1;
    if (hsl[4]) a = hsl[4].endsWith("%") ? parseFloat(hsl[4]) / 100 : Number(hsl[4]);
    const { r, g, b } = hslToRgb(h, sPct, lPct);
    return { r, g, b, a };
  }

  return null;
}

function formatHex({ r, g, b, a }: Rgba): string {
  const hh = (n: number) => n.toString(16).padStart(2, "0");
  const base = `#${hh(r)}${hh(g)}${hh(b)}`;
  if (a >= 1) return base;
  return `${base}${hh(Math.round(a * 255))}`;
}

function formatRgb({ r, g, b, a }: Rgba): string {
  return a >= 1
    ? `rgb(${r}, ${g}, ${b})`
    : `rgba(${r}, ${g}, ${b}, ${Number(a.toFixed(3))})`;
}

function formatHsl(rgba: Rgba): string {
  const { h, s, l } = rgbToHsl(rgba.r, rgba.g, rgba.b);
  const hh = Math.round(h);
  const ss = Math.round(s * 100);
  const ll = Math.round(l * 100);
  return rgba.a >= 1
    ? `hsl(${hh}, ${ss}%, ${ll}%)`
    : `hsla(${hh}, ${ss}%, ${ll}%, ${Number(rgba.a.toFixed(3))})`;
}

function formatOklch(rgba: Rgba): string {
  const { l, c, h } = rgbToOklch(rgba.r, rgba.g, rgba.b);
  const L = (l * 100).toFixed(2);
  const C = c.toFixed(3);
  const H = h.toFixed(2);
  return rgba.a >= 1
    ? `oklch(${L}% ${C} ${H})`
    : `oklch(${L}% ${C} ${H} / ${Number(rgba.a.toFixed(3))})`;
}

function Row({ label, value }: { label: string; value: string }) {
  const t = useTranslations("tools.color");
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
    <div className="grid grid-cols-[80px_1fr_auto] items-center gap-3 border border-border px-3 py-2">
      <span className="text-2xs font-bold uppercase tracking-widest text-muted-foreground-subtle">
        {label}
      </span>
      <code className="break-all font-mono text-xs">{value}</code>
      <Button
        size="xs"
        variant="ghost"
        onClick={copy}
        data-umami-event="tool-color-copy"
        data-umami-event-format={label}
      >
        {copied ? <Check /> : <Copy />}
        {copied ? t("copied") : t("copy")}
      </Button>
    </div>
  );
}

export function ColorTool() {
  const t = useTranslations("tools.color");
  const [value, setValue] = useState("#3b82f6");

  const parsed = useMemo(() => parseColor(value), [value]);

  const pickerValue = useMemo(() => {
    if (!parsed) return "#000000";
    const hh = (n: number) => n.toString(16).padStart(2, "0");
    return `#${hh(parsed.r)}${hh(parsed.g)}${hh(parsed.b)}`;
  }, [parsed]);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <div
          aria-label={t("input")}
          className="size-8 shrink-0 rounded-none border border-border"
          style={{
            backgroundColor: parsed ? formatHex(parsed) : "transparent",
          }}
        />
        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={t("placeholder")}
          spellCheck={false}
          aria-invalid={!!value && !parsed}
          className="h-8 flex-1 min-w-[200px] border border-border bg-transparent px-2.5 font-mono text-xs outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-1 focus-visible:ring-ring/50 aria-invalid:border-destructive"
        />
        <label
          className="flex h-8 cursor-pointer items-center gap-2 border border-border px-2 text-2xs text-muted-foreground hover:text-foreground"
          title={t("picker")}
        >
          <input
            type="color"
            value={pickerValue}
            onChange={(e) => setValue(e.target.value)}
            className="size-4 cursor-pointer border-0 bg-transparent p-0"
          />
          {t("picker")}
        </label>
        <Button
          size="xs"
          variant="ghost"
          onClick={() => setValue("")}
          disabled={!value}
          data-umami-event="tool-color-clear"
        >
          <Trash2 />
          {t("clear")}
        </Button>
      </div>

      {!value && (
        <p className="text-2xs text-muted-foreground-subtle">{t("empty")}</p>
      )}
      {value && !parsed && (
        <p className="flex items-center gap-1.5 text-2xs text-destructive">
          <span
            aria-hidden="true"
            className="size-1.5 rounded-full bg-destructive"
          />
          {t("invalid")}
        </p>
      )}

      {parsed && (
        <div className="space-y-2">
          <Row label={t("labels.hex")} value={formatHex(parsed)} />
          <Row label={t("labels.rgb")} value={formatRgb(parsed)} />
          <Row label={t("labels.hsl")} value={formatHsl(parsed)} />
          <Row label={t("labels.oklch")} value={formatOklch(parsed)} />
        </div>
      )}
    </div>
  );
}
