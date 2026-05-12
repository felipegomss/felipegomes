"use client";

import { useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { QRCodeCanvas, QRCodeSVG } from "qrcode.react";
import { Download, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

type Level = "L" | "M" | "Q" | "H";

export function QrcodeTool() {
  const t = useTranslations("tools.qrcode");
  const [value, setValue] = useState("");
  const [size, setSize] = useState(256);
  const [level, setLevel] = useState<Level>("M");
  const svgRef = useRef<SVGSVGElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  function downloadSvg() {
    const svg = svgRef.current;
    if (!svg) return;
    const serialized = new XMLSerializer().serializeToString(svg);
    const blob = new Blob([serialized], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "qrcode.svg";
    a.click();
    URL.revokeObjectURL(url);
  }

  function downloadPng() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const url = canvas.toDataURL("image/png");
    const a = document.createElement("a");
    a.href = url;
    a.download = "qrcode.png";
    a.click();
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-3">
        <label className="flex items-center gap-2">
          <span className="text-2xs uppercase tracking-widest text-muted-foreground-subtle">
            {t("size")}
          </span>
          <input
            type="number"
            min={128}
            max={1024}
            step={32}
            value={size}
            onChange={(e) => {
              const n = Number(e.target.value) || 256;
              setSize(Math.max(128, Math.min(1024, n)));
            }}
            className="h-6 w-16 border border-border bg-transparent px-2 text-xs tabular-nums outline-none focus-visible:border-ring focus-visible:ring-1 focus-visible:ring-ring/50"
          />
        </label>

        <div className="flex items-center gap-2">
          <span
            className="text-2xs uppercase tracking-widest text-muted-foreground-subtle"
            title={t("levelHint")}
          >
            {t("level")}
          </span>
          <div
            role="radiogroup"
            aria-label={t("level")}
            className="flex items-center gap-px overflow-hidden rounded-none border border-border"
          >
            {(["L", "M", "Q", "H"] as const).map((opt) => (
              <button
                key={opt}
                role="radio"
                aria-checked={level === opt}
                onClick={() => setLevel(opt)}
                className={`h-6 w-6 font-mono text-2xs transition-colors ${
                  level === opt
                    ? "bg-foreground text-background"
                    : "bg-background text-muted-foreground hover:text-foreground"
                }`}
              >
                {opt}
              </button>
            ))}
          </div>
        </div>

        <div className="ml-auto flex items-center gap-2">
          <Button
            size="xs"
            variant="ghost"
            onClick={downloadSvg}
            disabled={!value}
            data-umami-event="tool-qrcode-download-svg"
          >
            <Download />
            {t("downloadSvg")}
          </Button>
          <Button
            size="xs"
            variant="ghost"
            onClick={downloadPng}
            disabled={!value}
            data-umami-event="tool-qrcode-download-png"
          >
            <Download />
            {t("downloadPng")}
          </Button>
          <Button
            size="xs"
            variant="ghost"
            onClick={() => setValue("")}
            disabled={!value}
            data-umami-event="tool-qrcode-clear"
          >
            <Trash2 />
            {t("clear")}
          </Button>
        </div>
      </div>

      <p className="text-2xs text-muted-foreground-subtle">{t("levelHint")}</p>

      <Textarea
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={t("placeholder")}
        spellCheck={false}
        className="min-h-24 font-mono text-xs leading-relaxed"
      />

      <div className="flex min-h-[280px] items-center justify-center border border-border bg-white p-6">
        {value ? (
          <>
            <QRCodeSVG
              ref={svgRef}
              value={value}
              size={size}
              level={level}
              marginSize={2}
            />
            <QRCodeCanvas
              ref={canvasRef}
              value={value}
              size={size}
              level={level}
              marginSize={2}
              className="hidden"
            />
          </>
        ) : (
          <p className="text-2xs text-muted-foreground-subtle">{t("empty")}</p>
        )}
      </div>
    </div>
  );
}
