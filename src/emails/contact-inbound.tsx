import { Html, Head, Body, Container, Text, Hr, Link } from "react-email";

interface ContactInboundProps {
  fromEmail: string;
  subject: string;
  message: string;
  locale: string;
}

export function ContactInbound({ fromEmail, subject, message, locale }: ContactInboundProps) {
  const lang = locale === "pt-BR" ? "pt" : "en";
  const paragraphs = message.split("\n\n").filter(Boolean);

  return (
    <Html lang={lang}>
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
          <Text
            style={{
              fontSize: "11px",
              color: "#a3a3a3",
              margin: "0 0 24px",
              textTransform: "uppercase",
              letterSpacing: "0.08em",
            }}
          >
            via lfng.dev
          </Text>

          <Text style={{ fontSize: "13px", color: "#737373", margin: "0 0 4px" }}>
            <span style={{ fontWeight: 600, color: "#404040" }}>De: </span>
            {fromEmail}
          </Text>
          <Text style={{ fontSize: "13px", color: "#737373", margin: "0 0 24px" }}>
            <span style={{ fontWeight: 600, color: "#404040" }}>Assunto: </span>
            {subject}
          </Text>

          <Hr style={{ margin: "0 0 24px", borderColor: "#e5e5e5" }} />

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

          <Hr style={{ margin: "24px 0 16px", borderColor: "#e5e5e5" }} />

          <Text style={{ fontSize: "11px", color: "#a3a3a3", margin: 0 }}>
            <Link href="https://lfng.dev" style={{ color: "#a3a3a3" }}>
              lfng.dev
            </Link>
          </Text>
        </Container>
      </Body>
    </Html>
  );
}
