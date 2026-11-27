// Ícones do app instalável (PWA): o próprio favicon (src/app/icon.svg)
// renderizado no Chromium, para sair idêntico ao que aparece na aba.
// Também gera as telas de abertura do iPhone (public/app/splash): o primeiro
// quadro da animação "CODE → LFNG", para não aparecer tela preta vazia.
// Uso: node scripts/generate-app-icons.mjs  (precisa do Playwright instalado)
import { createRequire } from "module";
import { mkdirSync, readFileSync } from "fs";
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
// ── Telas de abertura (iOS lê uma imagem por tamanho de tela) ───────────────
// [largura, altura, densidade] em pontos CSS, retrato.
export const SPLASHES = [
  [440, 956, 3], // 16/17 Pro Max
  [430, 932, 3], // 14/15 Pro Max, 15/16 Plus
  [428, 926, 3], // 12/13 Pro Max, 14 Plus
  [420, 912, 3], // Air
  [402, 874, 3], // 16 Pro, 17, 17 Pro
  [393, 852, 3], // 14 Pro, 15, 15 Pro, 16
  [390, 844, 3], // 12, 13, 14
  [375, 812, 3], // X, XS, 11 Pro, mini
  [414, 896, 2], // XR, 11
  [375, 667, 2], // SE
];
const fonts =
  '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Geist+Mono:wght@900&family=JetBrains+Mono:wght@400&display=block">';
mkdirSync(resolve(root, "public/app/splash"), { recursive: true });
for (const [w, h, dpr] of SPLASHES) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: dpr });
  const p = await ctx.newPage();
  // Mesmo layout do primeiro quadro da intro (intro-screen.tsx): "CODE" em
  // branco, Geist Mono 900 / 60px, letra a letra com 1ch; nome embaixo.
  await p.setContent(`${fonts}<body style="margin:0;background:#0a0a0a;height:100vh;display:flex;align-items:center;justify-content:center;position:relative">
    <div style="display:flex;gap:2px;font:900 60px/1 'Geist Mono';letter-spacing:-0.025em;color:#fff">${["C", "O", "D", "E"].map((c) => `<span style="width:1ch;text-align:center">${c}</span>`).join("")}</div>
    <div style="position:absolute;bottom:32px;font:12px 'JetBrains Mono';letter-spacing:.1em;color:rgba(255,255,255,.1)">LUIS FELIPE NASCIMENTO GOMES</div></body>`);
  await p.evaluate(() => document.fonts.ready);
  const file = `splash-${w * dpr}x${h * dpr}.png`;
  await p.screenshot({ path: resolve(root, "public/app/splash", file) });
  await ctx.close();
  console.log(`[splash] ${file}`);
}
await browser.close();
