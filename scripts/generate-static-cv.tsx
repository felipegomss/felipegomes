import { writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { renderToBuffer } from "@react-pdf/renderer";
import { CvDocument } from "../src/app/[locale]/api/cv/cv-document";

const outDir = join(process.cwd(), "public/cv");
const locales = ["pt-BR", "en"];

async function main() {
  mkdirSync(outDir, { recursive: true });

  for (const locale of locales) {
    const buffer = await renderToBuffer(<CvDocument locale={locale} />);
    const fileName = `LuisFNGomes_Curriculum_Vitae_${locale}.pdf`;
    writeFileSync(join(outDir, fileName), new Uint8Array(buffer));
    console.log(`[static-cv] ✓ ${fileName}`);
  }
}

main().catch((err) => {
  console.error("[static-cv] Failed:", err);
  process.exit(1);
});
