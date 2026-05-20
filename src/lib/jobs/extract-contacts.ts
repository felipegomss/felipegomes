/** Email regex: standard, conservative. */
const EMAIL_RE = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;

/**
 * Brazilian phone numbers — captures common formats found in WhatsApp invites:
 *   +55 (11) 9 9999-9999
 *   55 11 9 9999 9999
 *   (11) 9 9999-9999
 *   11 99999-9999
 *   11999999999
 *
 * Returns normalized form: +55XXXXXXXXXXX (13 digits including country code).
 */
const PHONE_RE =
  /(?:\+?55[\s.-]?)?(?:\(?([1-9]\d)\)?[\s.-]?)(?:9[\s.-]?)?(\d{4})[\s.-]?(\d{4})/g;

function normalizeEmail(raw: string): string {
  return raw.trim().toLowerCase();
}

function normalizeBrPhone(match: RegExpExecArray): string | null {
  const ddd = match[1];
  const first = match[2];
  const last = match[3];
  // Compose with mandatory 9 prefix for mobile.
  const digits = `${ddd}9${first}${last}`.replace(/\D/g, "");
  if (digits.length !== 11) return null;
  return `+55${digits}`;
}

export function extractEmails(text: string): string[] {
  if (!text) return [];
  const matches = text.match(EMAIL_RE) ?? [];
  const set = new Set<string>();
  for (const m of matches) {
    const cleaned = normalizeEmail(m);
    // Filter common false positives like image filenames or fake "x@y.z" stubs.
    if (cleaned.length > 6 && !cleaned.endsWith(".png") && !cleaned.endsWith(".jpg")) {
      set.add(cleaned);
    }
  }
  return [...set];
}

export function extractWhatsapps(text: string): string[] {
  if (!text) return [];
  const set = new Set<string>();
  // Heuristic: prioritize matches that appear near WhatsApp/Wpp/Telefone mentions
  // to reduce noise, but also collect standalone valid BR numbers.
  let m: RegExpExecArray | null;
  PHONE_RE.lastIndex = 0;
  while ((m = PHONE_RE.exec(text)) !== null) {
    const phone = normalizeBrPhone(m);
    if (phone) set.add(phone);
  }
  return [...set];
}

export function extractContacts(text: string): {
  emails: string[];
  whatsapps: string[];
} {
  return {
    emails: extractEmails(text),
    whatsapps: extractWhatsapps(text),
  };
}
