// Envio e consulta de emails (Resend), compartilhados pelo app e pelo MCP.
import { readFileSync } from "fs";
import { join } from "path";
import { Resend } from "resend";
import { OutreachEmail } from "@/emails/outreach";
import { contact, cvFilename } from "@/lib/constants";

export type OutreachInput = {
  to: string[];
  subject: string;
  body: string;
  locale?: "pt-BR" | "en";
  attachCv?: boolean;
};

function client(): Resend | null {
  return process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function sendOutreach(input: OutreachInput): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  const resend = client();
  if (!resend) return { ok: false, error: "RESEND_API_KEY não configurada." };
  const to = input.to.map((t) => t.trim()).filter(Boolean);
  if (!to.length || !input.subject?.trim() || !input.body?.trim()) return { ok: false, error: "Destinatário, assunto e corpo são obrigatórios." };
  const invalid = to.filter((t) => !EMAIL_RE.test(t));
  if (invalid.length) return { ok: false, error: `Endereço inválido: ${invalid.join(", ")}` };

  const locale = input.locale === "en" ? "en" : "pt-BR";
  const attachments: { filename: string; content: Buffer }[] = [];
  if (input.attachCv) {
    const fileName = cvFilename(locale);
    attachments.push({ filename: fileName, content: readFileSync(join(process.cwd(), "public/cv", fileName)) });
  }
  const fromAddress = locale === "en" ? "hi@lfng.dev" : "ola@lfng.dev";
  const { data, error } = await resend.emails.send({
    from: `${contact.name} <${fromAddress}>`,
    to,
    subject: input.subject,
    react: OutreachEmail({ body: input.body, locale, attachCv: !!input.attachCv }),
    attachments,
  });
  if (error || !data) return { ok: false, error: error?.message ?? "Falha no envio." };
  return { ok: true, id: data.id };
}

export async function listSentEmails(limit = 50, after?: string) {
  const resend = client();
  if (!resend) return { ok: false as const, error: "RESEND_API_KEY não configurada." };
  const { data, error } = await resend.emails.list(after ? { limit, after } : { limit });
  if (error) return { ok: false as const, error: error.message ?? "Resend error" };
  return { ok: true as const, data: data?.data ?? [], hasMore: data?.has_more ?? false };
}

export async function getSentEmail(id: string) {
  const resend = client();
  if (!resend) return { ok: false as const, error: "RESEND_API_KEY não configurada." };
  const { data, error } = await resend.emails.get(id);
  if (error || !data) return { ok: false as const, error: error?.message ?? "Não encontrado." };
  return { ok: true as const, data };
}
