"use client";

import { useCallback, useEffect, useRef, useState } from "react";

interface HalftoneImageProps {
  src: string;
  alt?: string;
  className?: string;
  width: number;
  height: number;
}

const BAYER_8x8 = [
  [0, 48, 12, 60, 3, 51, 15, 63],
  [32, 16, 44, 28, 35, 19, 47, 31],
  [8, 56, 4, 52, 11, 59, 7, 55],
  [40, 24, 36, 20, 43, 27, 39, 23],
  [2, 50, 14, 62, 1, 49, 13, 61],
  [34, 18, 46, 30, 33, 17, 45, 29],
  [10, 58, 6, 54, 9, 57, 5, 53],
  [42, 26, 38, 22, 41, 25, 37, 21],
];

const BG = { r: 242, g: 241, b: 232 };
const FG = { r: 30, g: 30, b: 28 };
const BG_CSS = `rgb(${BG.r},${BG.g},${BG.b})`;

export function HalftoneImage({
  src,
  alt = "",
  className = "",
  width,
  height,
}: HalftoneImageProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const [ready, setReady] = useState(false);

  const renderFromCache = useCallback(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    const img = imgRef.current;
    if (!container || !canvas || !img || !img.complete) return;

    const cw = container.offsetWidth;
    if (cw === 0) return;

    const scale = window.devicePixelRatio || 1;
    const aspect = height / width;
    const w = Math.round(cw * scale);
    const h = Math.round(cw * aspect * scale);

    const off = document.createElement("canvas");
    off.width = w;
    off.height = h;
    const octx = off.getContext("2d", { willReadFrequently: true })!;

    octx.filter = "grayscale(100%) contrast(1.2) brightness(1.05)";
    octx.drawImage(img, 0, 0, w, h);
    octx.filter = "none";

    const imageData = octx.getImageData(0, 0, w, h);
    const px = imageData.data;

    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const i = (y * w + x) * 4;
        const luma = px[i] * 0.299 + px[i + 1] * 0.587 + px[i + 2] * 0.114;
        const threshold = (BAYER_8x8[y % 8][x % 8] / 64) * 255;
        const c = luma < threshold ? FG : BG;
        px[i] = c.r;
        px[i + 1] = c.g;
        px[i + 2] = c.b;
        px[i + 3] = 255;
      }
    }

    octx.putImageData(imageData, 0, 0);

    canvas.width = w;
    canvas.height = h;
    canvas.getContext("2d")!.drawImage(off, 0, 0);

    setReady(true);
  }, [width, height]);

  useEffect(() => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = src;
    imgRef.current = img;

    const onLoad = () => renderFromCache();
    const onError = () => setReady(false);

    if (img.complete) {
      onLoad();
    } else {
      img.addEventListener("load", onLoad);
      img.addEventListener("error", onError);
    }

    let resizeTimer: ReturnType<typeof setTimeout>;
    const onResize = () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(renderFromCache, 150);
    };

    window.addEventListener("resize", onResize);
    return () => {
      img.removeEventListener("load", onLoad);
      img.removeEventListener("error", onError);
      window.removeEventListener("resize", onResize);
      clearTimeout(resizeTimer);
    };
  }, [src, renderFromCache]);

  return (
    <div
      ref={containerRef}
      className={`overflow-hidden ${className}`}
      aria-label={alt}
      style={{
        backgroundColor: BG_CSS,
        aspectRatio: `${width} / ${height}`,
      }}
    >
      <canvas
        ref={canvasRef}
        className={`block h-full w-full ${ready ? "opacity-100" : "opacity-0"}`}
      />
    </div>
  );
}
