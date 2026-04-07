import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Link,
} from "@react-pdf/renderer";
import { contact, skillsByCategory } from "@/lib/constants";
import { jobs } from "../../data/portfolio";
import ptBR from "@/messages/pt-BR.json";
import en from "@/messages/en.json";

const messages: Record<string, typeof ptBR> = { "pt-BR": ptBR, en };

const s = StyleSheet.create({
  page: {
    paddingTop: 28,
    paddingBottom: 28,
    paddingHorizontal: 40,
    fontFamily: "Times-Roman",
    fontSize: 9.5,
    lineHeight: 1.22,
    color: "#000",
  },
  name: {
    fontSize: 15,
    fontFamily: "Times-Bold",
    textAlign: "center",
    marginBottom: 3,
  },
  subtitle: {
    fontSize: 9.5,
    textAlign: "center",
    marginBottom: 5,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  headerCol: {
    fontSize: 9.5,
  },
  headerLabel: {
    fontFamily: "Times-Bold",
  },
  link: {
    color: "#000",
    textDecoration: "none",
  },
  sectionTitle: {
    fontSize: 10.5,
    fontFamily: "Times-BoldItalic",
    textDecoration: "underline",
    textTransform: "uppercase",
    marginTop: 6,
    marginBottom: 2,
  },
  jobBlock: {
    marginBottom: 3,
  },
  jobHeader: {
    fontFamily: "Times-Bold",
    fontSize: 9.5,
  },
  bullet: {
    fontSize: 9.5,
    marginLeft: 14,
    marginBottom: 0,
    textIndent: -9,
    paddingLeft: 9,
  },
  eduLine: {
    fontSize: 9.5,
    marginBottom: 1,
  },
  skillLine: {
    fontSize: 9.5,
    marginBottom: 1,
  },
  skillLabel: {
    fontFamily: "Times-Bold",
  },
});

const categoryKeys = Object.keys(skillsByCategory) as (keyof typeof skillsByCategory)[];

export function CvDocument({ locale }: { locale: string }) {
  const msg = messages[locale] || messages["pt-BR"];
  const sidebar = msg.sidebar;
  const exp = msg.experience;
  const sk = msg.skills;

  return (
    <Document title={`${contact.name} — CV`} author={contact.name}>
      <Page size="A4" style={s.page}>
        <Text style={s.name}>{contact.name}</Text>
        <Text style={s.subtitle}>{sidebar.subtitle}</Text>

        <View style={s.header}>
          <View style={s.headerCol}>
            <Text>
              <Text style={s.headerLabel}>Email: </Text>
              <Link src={`mailto:${sidebar.email}`} style={s.link}>
                {sidebar.email}
              </Link>
            </Text>
            <Text>
              <Text style={s.headerLabel}>Phone: </Text>
              {contact.phone}
            </Text>
            <Text>
              <Text style={s.headerLabel}>Location: </Text>
              {sidebar.location}
            </Text>
          </View>
          <View style={s.headerCol}>
            <Text>
              <Text style={s.headerLabel}>Website: </Text>
              <Link src="https://lfng.dev" style={s.link}>
                lfng.dev
              </Link>
            </Text>
            <Text>
              <Text style={s.headerLabel}>LinkedIn: </Text>
              <Link src={`https://${contact.linkedin}`} style={s.link}>
                {contact.linkedin}
              </Link>
            </Text>
            <Text>
              <Text style={s.headerLabel}>GitHub: </Text>
              <Link src={`https://${contact.github}`} style={s.link}>
                {contact.github}
              </Link>
            </Text>
          </View>
        </View>

        <Text style={s.sectionTitle}>{exp.title}</Text>
        {jobs.map((job, i) => {
          const data = exp[job.key as keyof typeof exp] as Record<string, string>;
          return (
            <View key={i} style={s.jobBlock} wrap={false}>
              <Text style={s.jobHeader}>
                {data.role} — {job.company}
                {data.location ? ` — ${data.location}` : ""} — {data.period}
              </Text>
              {Array.from({ length: job.count }, (_, j) => (
                <Text key={j} style={s.bullet}>
                  •  {data[`h${j + 1}`]}
                </Text>
              ))}
            </View>
          );
        })}

        <Text style={s.sectionTitle}>{sidebar.education}</Text>
        <Text style={s.eduLine}>
          <Text style={s.skillLabel}>{sidebar.mba}</Text> — {sidebar.mbaInstitution} — {sidebar.mbaStatus}
        </Text>
        <Text style={s.eduLine}>
          <Text style={s.skillLabel}>{sidebar.degree}</Text> — {sidebar.degreeInstitution} — {sidebar.degreeStatus} — {sidebar.degreeCr}
        </Text>

        <Text style={s.sectionTitle}>{sk.title}</Text>
        {categoryKeys.map((key) => (
          <Text key={key} style={s.skillLine}>
            <Text style={s.skillLabel}>{sk[key]}: </Text>
            {skillsByCategory[key].join(", ")}
          </Text>
        ))}
        <Text style={s.skillLine}>
          <Text style={s.skillLabel}>{sk.languages}: </Text>
          {sk.portuguese} ({sk.native}), {sk.english} (B2 · EF SET)
        </Text>
      </Page>
    </Document>
  );
}
