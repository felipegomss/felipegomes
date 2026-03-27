import { renderToBuffer } from "@react-pdf/renderer";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Link,
} from "@react-pdf/renderer";
import { contact, skills, CV_CACHE_MAX_AGE } from "@/lib/constants";
import { jobs } from "../../data/portfolio";
import ptBR from "@/messages/pt-BR.json";
import en from "@/messages/en.json";

const messages: Record<string, typeof ptBR> = { "pt-BR": ptBR, en };

/** Semantic color palette for the PDF CV. */
const c = {
  black: "#111",
  dark: "#333",
  mid: "#555",
  light: "#888",
  line: "#c0c0c0",
};

const s = StyleSheet.create({
  page: {
    padding: 30,
    paddingHorizontal: 36,
    fontFamily: "Helvetica",
    fontSize: 8.5,
    lineHeight: 1.4,
    color: c.black,
  },
  name: {
    fontSize: 14,
    fontFamily: "Helvetica-Bold",
    letterSpacing: 0.3,
  },
  role: {
    fontSize: 9,
    color: c.dark,
    marginTop: 6,
  },
  contactRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 6,
    fontSize: 7.5,
    color: c.mid,
    gap: 2,
  },
  sep: { marginHorizontal: 5 },
  link: { color: c.mid, textDecoration: "none" },
  divider: {
    borderBottomWidth: 0.5,
    borderBottomColor: c.line,
    marginTop: 8,
    marginBottom: 7,
  },
  sectionTitle: {
    fontSize: 8.5,
    fontFamily: "Helvetica-Bold",
    textTransform: "uppercase",
    letterSpacing: 2,
    color: c.dark,
    marginBottom: 6,
  },
  jobBlock: { marginBottom: 10 },
  jobRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  jobCompany: {
    fontFamily: "Helvetica-Bold",
    fontSize: 9,
  },
  jobPeriod: {
    fontSize: 7.5,
    color: c.light,
    fontFamily: "Helvetica",
  },
  jobRole: {
    fontSize: 8,
    color: c.mid,
    marginTop: 1,
    marginBottom: 3,
  },
  bullet: {
    fontSize: 8,
    lineHeight: 1.45,
    marginBottom: 2,
    paddingLeft: 6,
    color: c.dark,
  },
  eduRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 1,
  },
  eduTitle: {
    fontFamily: "Helvetica-Bold",
    fontSize: 9,
  },
  eduRight: {
    fontSize: 8,
    color: c.light,
  },
  eduSub: {
    fontSize: 7.5,
    color: c.mid,
    marginBottom: 4,
  },
  skillsText: {
    fontSize: 8,
    color: c.dark,
    lineHeight: 1.6,
  },
});

function CvDocument({ locale }: { locale: string }) {
  const msg = messages[locale] || messages["pt-BR"];
  const sidebar = msg.sidebar;
  const exp = msg.experience;

  return (
    <Document>
      <Page size="A4" style={s.page}>
        <View>
          <Text style={s.name}>{contact.name}</Text>
          <Text style={s.role}>
            {sidebar.subtitle}
          </Text>
          <View style={s.contactRow}>
            <Text>{contact.location}</Text>
            <Text style={s.sep}>|</Text>
            <Link src={`mailto:${contact.email}`} style={s.link}>
              <Text>{contact.email}</Text>
            </Link>
            <Text style={s.sep}>|</Text>
            <Text>{contact.phone}</Text>
            <Text style={s.sep}>|</Text>
            <Link src={`https://${contact.linkedin}`} style={s.link}>
              <Text>{contact.linkedin}</Text>
            </Link>
            <Text style={s.sep}>|</Text>
            <Link src={`https://${contact.github}`} style={s.link}>
              <Text>{contact.github}</Text>
            </Link>
          </View>
        </View>

        <View style={s.divider} />

        <Text style={s.sectionTitle}>{exp.title}</Text>
        {jobs.map((job, i) => {
          const data = exp[job.key as keyof typeof exp] as Record<string, string>;
          return (
            <View key={i} style={s.jobBlock} wrap={false}>
              <View style={s.jobRow}>
                <Text style={s.jobCompany}>
                  {job.company}
                  {data.location ? ` — ${data.location}` : ""}
                </Text>
                <Text style={s.jobPeriod}>{data.period}</Text>
              </View>
              <Text style={s.jobRole}>{data.role}</Text>
              {Array.from({ length: job.count }, (_, j) => (
                <Text key={j} style={s.bullet}>
                  •{"  "}
                  {data[`h${j + 1}`]}
                </Text>
              ))}
            </View>
          );
        })}

        <View style={s.divider} />

        <Text style={s.sectionTitle}>{sidebar.education}</Text>
        <View>
          <View style={s.eduRow}>
            <Text style={s.eduTitle}>{sidebar.mba}</Text>
            <Text style={s.eduRight}>{sidebar.mbaInfo}</Text>
          </View>
          <Text style={s.eduSub}> </Text>
          <View style={s.eduRow}>
            <Text style={s.eduTitle}>{sidebar.degree}</Text>
            <Text style={s.eduRight}>{sidebar.degreeInfo}</Text>
          </View>
          <Text style={s.eduSub}>{sidebar.degreeCore}</Text>
        </View>

        <View style={s.divider} />

        <Text style={s.sectionTitle}>{msg.skills.title}</Text>
        <Text style={s.skillsText}>{skills.join("  ·  ")}</Text>
      </Page>
    </Document>
  );
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ locale: string }> },
) {
  const { locale } = await params;
  const buffer = await renderToBuffer(<CvDocument locale={locale} />);

  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="Luis_Felipe_Gomes_CV_${locale}.pdf"`,
      "Cache-Control": `public, max-age=${CV_CACHE_MAX_AGE}`,
    },
  });
}
