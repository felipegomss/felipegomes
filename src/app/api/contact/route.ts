import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { ContactInbound } from "@/emails/contact-inbound";
import { contact } from "@/lib/constants";

const resend = new Resend(process.env.RESEND_API_KEY);

// In-memory rate limit: max 3 submissions per IP per hour
const rateLimit = new Map<string, { count: number; resetAt: number }>();

export async function POST(request: NextRequest) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? "unknown";
  const now = Date.now();
  const bucket = rateLimit.get(ip);

  if (bucket) {
    if (now < bucket.resetAt && bucket.count >= 3) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }
    if (now >= bucket.resetAt) {
      rateLimit.set(ip, { count: 1, resetAt: now + 3_600_000 });
    } else {
      bucket.count++;
    }
  } else {
    rateLimit.set(ip, { count: 1, resetAt: now + 3_600_000 });
  }

  const body = await request.json();
  const { fromEmail, subject, message, locale, trap } = body;

  // Honeypot: bots fill this field, humans don't
  if (trap) return NextResponse.json({ ok: true });

  if (!fromEmail || !message) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const to = locale === "pt-BR" ? "ola@lfng.dev" : "hi@lfng.dev";
  const emailSubject = subject?.trim()
    ? `[Contact] ${subject.trim()}`
    : `[Contact] ${fromEmail}`;

  try {
    const { error } = await resend.emails.send({
      from: `${contact.name} <ola@lfng.dev>`,
      to: [to],
      replyTo: fromEmail,
      subject: emailSubject,
      react: ContactInbound({
        fromEmail,
        subject: subject?.trim() || emailSubject,
        message,
        locale,
      }),
    });

    if (error) return NextResponse.json({ error }, { status: 400 });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
