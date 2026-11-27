// Criptografia simétrica para segredos guardados no banco (chaves de API).
// AES-256-GCM com chave derivada do segredo da sessão: quem só tem o banco
// não consegue usar os tokens.
import { createCipheriv, createDecipheriv, createHash, randomBytes } from "crypto";

function key(): Buffer {
  const s = process.env.SESSION_SECRET ?? process.env.ADMIN_PASSWORD;
  if (!s) throw new Error("Chave ausente (SESSION_SECRET/ADMIN_PASSWORD).");
  return createHash("sha256").update(`lfng-box:${s}`).digest();
}

/** "v1.<iv>.<tag>.<dados>" em base64url. */
export function seal(plain: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key(), iv);
  const data = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  return ["v1", iv, cipher.getAuthTag(), data].map((p) => (typeof p === "string" ? p : p.toString("base64url"))).join(".");
}

/** Devolve null se o valor foi adulterado ou a chave mudou. */
export function open(sealed: string | null | undefined): string | null {
  if (!sealed) return null;
  const [v, iv, tag, data] = sealed.split(".");
  if (v !== "v1" || !iv || !tag || !data) return null;
  try {
    const decipher = createDecipheriv("aes-256-gcm", key(), Buffer.from(iv, "base64url"));
    decipher.setAuthTag(Buffer.from(tag, "base64url"));
    return Buffer.concat([decipher.update(Buffer.from(data, "base64url")), decipher.final()]).toString("utf8");
  } catch {
    return null;
  }
}
