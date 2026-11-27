// Ícones do app instalável (PWA): o mesmo "LF" do favicon, em vários tamanhos.
// Uso: node scripts/generate-app-icons.mjs
import { createCanvas } from "canvas";
import { mkdirSync, writeFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const out = resolve(root, "public/app");
mkdirSync(out, { recursive: true });

// scale: tamanho do texto relativo ao ícone. "maskable" deixa margem para o
// recorte circular/arredondado do Android e do iOS.
const ICONS = [
  { file: "icon-192.png", size: 192, scale: 0.5 },
  { file: "icon-512.png", size: 512, scale: 0.5 },
  { file: "icon-maskable-512.png", size: 512, scale: 0.36 },
  { file: "apple-touch-icon.png", size: 180, scale: 0.46 },
];

for (const { file, size, scale } of ICONS) {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#0a0a0a";
  ctx.fillRect(0, 0, size, size);
  ctx.fillStyle = "#ffffff";
  ctx.font = `bold ${Math.round(size * scale)}px monospace`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("LF", size / 2, size / 2 + size * 0.015);
  writeFileSync(resolve(out, file), canvas.toBuffer("image/png"));
  console.log(`[icons] ${file}`);
}
