import { writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { renderToBuffer } from "@react-pdf/renderer";
import { CvDocument } from "../src/app/[locale]/api/cv/cv-document";
import { routing } from "../src/i18n/routing";
import { CV_FILENAME } from "../src/lib/constants";

const outDir = join(process.cwd(), "public/cv");

async function main() {
  mkdirSync(outDir, { recursive: true });

  await Promise.all(
    routing.locales.map(async (locale) => {
      const buffer = await renderToBuffer(<CvDocument locale={locale} />);
      const fileName = `${CV_FILENAME}_${locale}.pdf`;
      writeFileSync(join(outDir, fileName), new Uint8Array(buffer));
      console.log(`[static-cv] ✓ ${fileName}`);
    }),
  );
}

main().catch((err) => {
  console.error("[static-cv] Failed:", err);
  process.exit(1);
});
