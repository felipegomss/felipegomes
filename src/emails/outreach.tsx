import { Html, Head, Body, Container, Text, Hr, Link } from "react-email";
import { contact } from "@/lib/constants";

const closings: Record<string, string> = {
  "pt-BR": "Atenciosamente,",
  en: "Best regards,",
};

const cvNotes: Record<string, string> = {
  "pt-BR": "Segue currículo em anexo.",
  en: "Please find my resume attached.",
};

interface OutreachEmailProps {
  body: string;
  locale: string;
  attachCv?: boolean;
}

export function OutreachEmail({ body, locale, attachCv }: OutreachEmailProps) {
  const paragraphs = body.split("\n\n").filter(Boolean);
  const closing = closings[locale] ?? closings.en;
  const cvNote = cvNotes[locale] ?? cvNotes.en;

  return (
    <Html lang={locale === "pt-BR" ? "pt" : "en"}>
      <Head />
      <Body
        style={{
          fontFamily: "Arial, Helvetica, sans-serif",
          backgroundColor: "#ffffff",
          color: "#0a0a0a",
          margin: 0,
        }}
      >
        <Container
          style={{ maxWidth: "600px", margin: "0 auto", padding: "32px 24px" }}
        >
          {paragraphs.map((p, i) => (
            <Text
              key={i}
              style={{
                fontSize: "15px",
                lineHeight: "1.65",
                margin: "0 0 16px",
                whiteSpace: "pre-wrap",
              }}
            >
              {p}
            </Text>
          ))}

          <Hr style={{ margin: "28px 0", borderColor: "#e5e5e5" }} />

          {attachCv && (
            <Text
              style={{
                fontSize: "13px",
                lineHeight: "1.65",
                margin: "0 0 16px",
                color: "#404040",
              }}
            >
              {cvNote}
            </Text>
          )}

          <Text
            style={{ fontSize: "13px", color: "#737373", margin: "0 0 8px" }}
          >
            {closing}
          </Text>
          <Text
            style={{ fontSize: "13px", color: "#737373", margin: "0 0 4px" }}
          >
            {contact.name}
          </Text>
          <Text style={{ fontSize: "13px", color: "#737373", margin: 0 }}>
            <Link href="https://lfng.dev" style={{ color: "#737373" }}>
              lfng.dev
            </Link>
            {" · "}
            <Link
              href={`https://${contact.linkedin}`}
              style={{ color: "#737373" }}
            >
              LinkedIn
            </Link>
            {" · "}
            <Link
              href={`https://${contact.github}`}
              style={{ color: "#737373" }}
            >
              GitHub
            </Link>
          </Text>
        </Container>
      </Body>
    </Html>
  );
}
