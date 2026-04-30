import { NextResponse } from "next/server";
import { Resend } from "resend";
import { readFileSync } from "fs";
import { join } from "path";
import { OutreachEmail } from "@/emails/outreach";
import { contact, CV_FILENAME } from "@/lib/constants";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: Request) {
  try {
    const { to, subject, body, locale, attachCv, password } =
      await request.json();

    if (!password || password !== process.env.EMAIL_PASSWORD) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!to?.length || !subject || !body) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    const attachments: { filename: string; content: Buffer }[] = [];

    if (attachCv) {
      const cvLocale = locale === "pt-BR" ? "pt-BR" : "en";
      const cvPath = join(
        process.cwd(),
        "public/cv",
        `${CV_FILENAME}_${cvLocale}.pdf`,
      );
      const content = readFileSync(cvPath);
      attachments.push({ filename: `${CV_FILENAME}_${cvLocale}.pdf`, content });
    }

    const { data, error } = await resend.emails.send({
      from: `${contact.name} <ola@lfng.dev>`,
      to,
      subject,
      react: OutreachEmail({ body, locale, attachCv }),
      attachments,
    });

    if (error) {
      return NextResponse.json({ error }, { status: 400 });
    }

    return NextResponse.json({ id: data?.id });
  } catch {
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
