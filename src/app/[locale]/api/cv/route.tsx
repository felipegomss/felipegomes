import { renderToBuffer } from "@react-pdf/renderer";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Link,
} from "@react-pdf/renderer";
import { contact, skills, cvStrings } from "@/lib/cv-data";
import { CV_CACHE_MAX_AGE } from "@/lib/constants";

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
  // ── header ──
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
  // ── divider ──
  divider: {
    borderBottomWidth: 0.5,
    borderBottomColor: c.line,
    marginTop: 8,
    marginBottom: 7,
  },
  // ── section ──
  sectionTitle: {
    fontSize: 8.5,
    fontFamily: "Helvetica-Bold",
    textTransform: "uppercase",
    letterSpacing: 2,
    color: c.dark,
    marginBottom: 6,
  },
  // ── job ──
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
  // ── education ──
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
  // ── skills ──
  skillsText: {
    fontSize: 8,
    color: c.dark,
    lineHeight: 1.6,
  },
});

function CvDocument({ locale }: { locale: string }) {
  const cv = cvStrings[locale] || cvStrings["pt-BR"];

  return (
    <Document>
      <Page size="A4" style={s.page}>
        {/* ── Header ── */}
        <View>
          <Text style={s.name}>{contact.name}</Text>
          <Text style={s.role}>
            {cv.objective} · {cv.subtitle}
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

        {/* ── Experience ── */}
        <Text style={s.sectionTitle}>{cv.sections.experience}</Text>
        {cv.jobs.map((job, i) => (
          <View key={i} style={s.jobBlock} wrap={false}>
            <View style={s.jobRow}>
              <Text style={s.jobCompany}>
                {job.company}
                {job.location ? ` — ${job.location}` : ""}
              </Text>
              <Text style={s.jobPeriod}>{job.period}</Text>
            </View>
            <Text style={s.jobRole}>{job.role}</Text>
            {job.highlights.map((h, j) => (
              <Text key={j} style={s.bullet}>
                •{"  "}
                {h}
              </Text>
            ))}
          </View>
        ))}

        <View style={s.divider} />

        {/* ── Education ── */}
        <Text style={s.sectionTitle}>{cv.sections.education}</Text>

        <View>
          <View style={s.eduRow}>
            <Text style={s.eduTitle}>{cv.education.mba}</Text>
            <Text style={s.eduRight}>{cv.education.mbaInfo}</Text>
          </View>
          <Text style={s.eduSub}> </Text>

          <View style={s.eduRow}>
            <Text style={s.eduTitle}>{cv.education.degree}</Text>
            <Text style={s.eduRight}>{cv.education.degreeInfo}</Text>
          </View>
          <Text style={s.eduSub}>{cv.education.degreeCore}</Text>
        </View>

        <View style={s.divider} />

        {/* ── Skills ── */}
        <Text style={s.sectionTitle}>{cv.sections.skills}</Text>
        <Text style={s.skillsText}>{skills.join("  ·  ")}</Text>
      </Page>
    </Document>
  );
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ locale: string }> }
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
