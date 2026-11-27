// Ícones do app instalável (PWA): o próprio favicon (src/app/icon.svg)
// renderizado no Chromium, para sair idêntico ao que aparece na aba.
// Uso: node scripts/generate-app-icons.mjs  (precisa do Playwright instalado)
import { createRequire } from "module";
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const { chromium } = createRequire(import.meta.url)("playwright");
const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const svg = readFileSync(resolve(root, "src/app/icon.svg"), "utf8")
  // Sem cantos arredondados: o iOS/Android aplicam a própria máscara.
  .replace(/ rx="\d+"/, "");

// inset: margem em volta do desenho. "maskable" precisa de área segura
// (o Android recorta em círculo).
const ICONS = [
  { file: "icon-192.png", size: 192, inset: 0 },
  { file: "icon-512.png", size: 512, inset: 0 },
  { file: "icon-maskable-512.png", size: 512, inset: 0.14 },
  { file: "apple-touch-icon.png", size: 180, inset: 0 },
];

const browser = await chromium.launch();
const page = await browser.newPage();
for (const { file, size, inset } of ICONS) {
  const pad = Math.round(size * inset);
  await page.setViewportSize({ width: size, height: size });
  await page.setContent(
    `<body style="margin:0;background:#1b1b1b;display:grid;place-items:center;height:${size}px">` +
      svg.replace(/width="128" height="128"/, `width="${size - 2 * pad}" height="${size - 2 * pad}"`) +
      `</body>`,
  );
  await page.screenshot({ path: resolve(root, "public/app", file), omitBackground: false });
  console.log(`[icons] ${file}`);
}
await browser.close();
