import { createCanvas } from "canvas";
import { writeFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");

const SIZE = 128;
const canvas = createCanvas(SIZE, SIZE);
const ctx = canvas.getContext("2d");

// dark bg
ctx.fillStyle = "#0a0a0a";
ctx.fillRect(0, 0, SIZE, SIZE);

// LF text
ctx.fillStyle = "#ffffff";
ctx.font = "bold 64px monospace";
ctx.textAlign = "center";
ctx.textBaseline = "middle";
ctx.fillText("LF", SIZE / 2, SIZE / 2 + 2);

const buffer = canvas.toBuffer("image/png");
writeFileSync(resolve(root, "src/app/[locale]/icon.png"), buffer);
console.log("Favicon generated");
