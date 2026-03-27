"use client";

import { useCallback, useEffect, useRef, useState } from "react";

interface HalftoneImageProps {
  src: string;
  alt?: string;
  className?: string;
  width: number;
  height: number;
}

/**
 * 8x8 ordered-dither (Bayer) threshold matrix.
 * Each value 0–63 maps to a threshold in a recursive halftone pattern.
 * See: https://en.wikipedia.org/wiki/Ordered_dithering
 */
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

const BAYER_SIZE = 8;
const BAYER_LEVELS = BAYER_SIZE * BAYER_SIZE;

/** ITU-R BT.601 luma coefficients for perceptual grayscale. */
const LUMA_R = 0.299;
const LUMA_G = 0.587;
const LUMA_B = 0.114;

const GRAYSCALE_FILTER = "grayscale(100%) contrast(1.2) brightness(1.05)";

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
    const octx = off.getContext("2d", { willReadFrequently: true });
    if (!octx) return;

    octx.filter = GRAYSCALE_FILTER;
    octx.drawImage(img, 0, 0, w, h);
    octx.filter = "none";

    const imageData = octx.getImageData(0, 0, w, h);
    const px = imageData.data;

    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const i = (y * w + x) * 4;
        const luma = px[i] * LUMA_R + px[i + 1] * LUMA_G + px[i + 2] * LUMA_B;
        const threshold = (BAYER_8x8[y % BAYER_SIZE][x % BAYER_SIZE] / BAYER_LEVELS) * 255;
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
    const mainCtx = canvas.getContext("2d");
    if (!mainCtx) return;
    mainCtx.drawImage(off, 0, 0);

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
      role="img"
      className={`overflow-hidden ${className}`}
      aria-label={alt}
      style={{
        backgroundColor: BG_CSS,
        aspectRatio: `${width} / ${height}`,
      }}
    >
      <canvas
        ref={canvasRef}
        aria-hidden="true"
        className={`block h-full w-full ${ready ? "opacity-100" : "opacity-0"}`}
      />
    </div>
  );
}
