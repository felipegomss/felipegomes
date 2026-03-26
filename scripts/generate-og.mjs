import { createCanvas, loadImage, registerFont } from "canvas";
import { writeFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");

const BAYER = [
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

const W = 1200;
const H = 630;

async function main() {
  const canvas = createCanvas(W, H);
  const ctx = canvas.getContext("2d");

  // load and draw photo as background, cover + center
  const img = await loadImage(resolve(root, "public/felipe.jpeg"));
  const scale = Math.max(W / img.width, H / img.height);
  const sw = img.width * scale;
  const sh = img.height * scale;
  const sx = (W - sw) / 2;
  const sy = (H - sh) / 2;

  ctx.filter = "grayscale(100%) contrast(1.2) brightness(1.05)";
  ctx.drawImage(img, sx, sy, sw, sh);
  ctx.filter = "none";

  // dither
  const imageData = ctx.getImageData(0, 0, W, H);
  const px = imageData.data;
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const i = (y * W + x) * 4;
      const luma = px[i] * 0.299 + px[i + 1] * 0.587 + px[i + 2] * 0.114;
      const threshold = (BAYER[y % 8][x % 8] / 64) * 255;
      const c = luma < threshold ? FG : BG;
      px[i] = c.r;
      px[i + 1] = c.g;
      px[i + 2] = c.b;
      px[i + 3] = 255;
    }
  }
  ctx.putImageData(imageData, 0, 0);

  // dark overlay for text readability
  ctx.fillStyle = "rgba(10, 10, 10, 0.6)";
  ctx.fillRect(0, 0, W, H);

  // LFNG text
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 160px monospace";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("LFNG", W / 2, H / 2 - 20);

  // subtitle
  ctx.fillStyle = "rgba(255, 255, 255, 0.5)";
  ctx.font = "24px monospace";
  ctx.fillText("Luis Felipe N. Gomes · Full Stack", W / 2, H / 2 + 80);

  const buffer = canvas.toBuffer("image/png");
  writeFileSync(resolve(root, "public/og.png"), buffer);
  console.log("OG image generated: public/og.png");
}

main().catch(console.error);
