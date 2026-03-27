import { getTranslations, setRequestLocale } from "next-intl/server";
import { IconGithub, IconLinkedin } from "nucleo-social-media";
import { IconGlobe, IconAward } from "nucleo-isometric";
import { HalftoneImage } from "./components/halftone-image";
import { LocaleSwitcher } from "./components/locale-switcher";
import { contact, skills } from "@/lib/cv-data";

const jobs = [
  { key: "automind", company: "Automind", count: 5 },
  { key: "branddi", company: "Branddi", count: 5 },
  { key: "eisa", company: "EISA", count: 3 },
  { key: "parallel", company: "Parallel Consulting & Training", count: 2 },
];


export default async function Home({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const [sidebar, exp, sk] = await Promise.all([
    getTranslations("sidebar"),
    getTranslations("experience"),
    getTranslations("skills"),
  ]);

  return (
    <div className="mx-auto max-w-7xl border-x border-border md:grid md:grid-cols-[260px_1fr_1fr] md:min-h-screen">
      <aside className="flex flex-col justify-between border-b border-border p-6 md:sticky md:top-0 md:h-screen md:border-b-0 md:border-r">
        <div className="space-y-8">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="font-heading text-5xl font-black uppercase tracking-tight">
                LFNG
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">Luis Felipe N. Gomes</p>
              <p className="mt-1 text-xs text-muted-foreground/60">
                Salvador/BA
              </p>
            </div>
            <LocaleSwitcher />
          </div>

          <div>
            <h2 className="font-heading text-lg font-bold">
              Full Stack <span className="text-sm font-normal text-muted-foreground">· {Math.floor((Date.now() - new Date("2020-09-01").getTime()) / (365.25 * 24 * 60 * 60 * 1000))}+ {sidebar("years")}</span>
            </h2>
            <p className="mt-1 text-xs text-muted-foreground">
              {sidebar("stack")}
            </p>
            <p className="mt-0.5 text-[11px] text-muted-foreground/50">
              {sidebar("subtitle")}
            </p>
          </div>

          <section>
            <h2 className="mb-2 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest text-muted-foreground/60">
              {sidebar("education")}
              <IconAward size={14} />
            </h2>
            <div>
              <p className="text-sm">{sidebar("mba")}</p>
              <p className="text-xs text-muted-foreground/60">{sidebar("mbaInfo")}</p>
            </div>
            <div className="mt-3">
              <a href="/diploma.pdf" target="_blank" rel="noopener noreferrer" className="text-sm underline decoration-muted-foreground/30 underline-offset-2 hover:decoration-foreground hover:text-foreground">
                {sidebar("degree")}
              </a>
              <p className="text-xs text-muted-foreground/60">{sidebar("degreeInfo")}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">{sidebar("degreeCore")}</p>
            </div>
          </section>
        </div>

        <div className="mt-8 space-y-4 md:mt-0">
          <section>
            <h2 className="mb-2 text-[11px] font-bold uppercase tracking-widest text-muted-foreground/60">
              {sidebar("contact")}
            </h2>
            <ul className="space-y-1 text-sm">
              <li>
                <a href={`mailto:${contact.email}`} className="text-muted-foreground hover:text-foreground">
                  {contact.email}
                </a>
              </li>
              <li>
                <a href={`tel:+55${contact.phone.replace(/\D/g, "")}`} className="text-muted-foreground hover:text-foreground">
                  {contact.phone}
                </a>
              </li>
            </ul>
            <a
              href={`/${locale}/api/cv`}
              download
              className="mt-3 inline-block text-xs font-bold uppercase tracking-widest text-muted-foreground transition-colors hover:text-foreground"
            >
              ↓ {sidebar("download")}
            </a>
          </section>

          <nav>
            <h2 className="mb-3 text-[11px] font-bold uppercase tracking-widest text-muted-foreground/60">
              Social
            </h2>
            <div className="flex gap-3">
              <a href={`https://${contact.linkedin}`} target="_blank" rel="noopener noreferrer" className="text-muted-foreground transition-colors hover:text-foreground">
                <IconLinkedin size={18} />
              </a>
              <a href={`https://${contact.github}`} target="_blank" rel="noopener noreferrer" className="text-muted-foreground transition-colors hover:text-foreground">
                <IconGithub size={18} />
              </a>
            </div>
          </nav>
        </div>
      </aside>

      <div className="border-b border-border md:hidden">
        <HalftoneImage src="/felipe.jpeg" alt={contact.name} width={3111} height={3111} />
      </div>

      <main className="border-b border-border md:border-b-0 md:border-r">
        <div className="border-b border-border p-6">
          <h2 className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground/60">
            {exp("title")}
          </h2>
        </div>

        {jobs.map((job) => (
          <article key={job.key} className="border-b border-border p-6">
            <div className="mb-4">
              <h3 className="font-heading text-lg font-bold">{job.company}</h3>
              <p className="text-sm text-muted-foreground">
                {exp(`${job.key}.role`)}
              </p>
              <p className="mt-1 text-xs text-muted-foreground/60">
                {exp(`${job.key}.period`)}
                {exp.has(`${job.key}.location`) && ` · ${exp(`${job.key}.location`)}`}
              </p>
            </div>
            <ul className="space-y-1.5">
              {Array.from({ length: job.count }, (_, i) => (
                <li key={i} className="text-sm leading-relaxed text-muted-foreground">
                  — {exp(`${job.key}.h${i + 1}`)}
                </li>
              ))}
            </ul>
          </article>
        ))}
      </main>

      <aside className="flex flex-col">
        <div className="hidden border-b border-border md:block">
          <HalftoneImage src="/felipe.jpeg" alt={contact.name} width={3111} height={3111} />
        </div>

        <div className="border-b border-border p-6">
          <h2 className="mb-3 text-[11px] font-bold uppercase tracking-widest text-muted-foreground/60">
            {sk("title")}
          </h2>
          <div className="flex flex-wrap gap-1.5">
            {skills.map((skill) => (
              <span key={skill} className="rounded-sm border border-border px-1.5 py-0.5 text-xs text-muted-foreground">
                {skill}
              </span>
            ))}
          </div>
        </div>

        <div className="border-b border-border p-6">
          <h2 className="mb-3 text-[11px] font-bold uppercase tracking-widest text-muted-foreground/60">
            {sk("languages")}
          </h2>
          <ul className="space-y-1.5 text-sm">
            <li className="flex items-baseline justify-between">
              <span>{sk("portuguese")}</span>
              <span className="text-xs text-muted-foreground/50">{sk("native")}</span>
            </li>
            <li className="flex items-baseline justify-between">
              <a href="https://cert.efset.org/VLZ6f9" target="_blank" rel="noopener noreferrer" className="underline decoration-muted-foreground/30 underline-offset-2 hover:decoration-foreground hover:text-foreground">
                {sk("english")}
              </a>
              <span className="text-xs text-muted-foreground/50">B2 · EF SET</span>
            </li>
          </ul>
        </div>

        <div className="border-b border-border p-6">
          <h2 className="mb-3 text-[11px] font-bold uppercase tracking-widest text-muted-foreground/60">
            {sk("projects")}
          </h2>
          <ul className="space-y-4">
            <li>
              <div>
                <div className="flex items-center justify-between">
                  <p className="text-sm font-bold">agent-skills</p>
                  <a href="https://github.com/felipegomss/agent-skills" target="_blank" rel="noopener noreferrer" className="text-muted-foreground/40 hover:text-foreground">
                    <IconGithub size={14} />
                  </a>
                </div>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {sk("agentSkillsDesc")}
                </p>
              </div>
            </li>
            <li>
              <div>
                <div className="flex items-center justify-between">
                  <p className="text-sm font-bold">WIG</p>
                  <a href="https://wig.app.br" target="_blank" rel="noopener noreferrer" className="text-muted-foreground/40 hover:text-foreground">
                    <IconGlobe size={14} />
                  </a>
                </div>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {sk("wigDesc")}
                </p>
              </div>
            </li>
            <li>
              <div>
                <div className="flex items-center justify-between">
                  <p className="text-sm font-bold">JacoSeg</p>
                  <a href="https://jacoseg.com.br" target="_blank" rel="noopener noreferrer" className="text-muted-foreground/40 hover:text-foreground">
                    <IconGlobe size={14} />
                  </a>
                </div>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {sk("jacosegDesc")}
                </p>
              </div>
            </li>
            <li>
              <div>
                <div className="flex items-center justify-between">
                  <p className="text-sm font-bold">Bianca Psi.</p>
                  <a href="https://www.bianca.psc.br" target="_blank" rel="noopener noreferrer" className="text-muted-foreground/40 hover:text-foreground">
                    <IconGlobe size={14} />
                  </a>
                </div>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {sk("biancaDesc")}
                </p>
              </div>
            </li>
            <li>
              <div>
                <div className="flex items-center justify-between">
                  <p className="text-sm font-bold">lfng.dev</p>
                  <div className="flex gap-3">
                    <a href="https://github.com/felipegomss/felipegomes" target="_blank" rel="noopener noreferrer" className="text-muted-foreground/40 hover:text-foreground">
                      <IconGithub size={14} />
                    </a>
                    <a href="https://lfng.dev" target="_blank" rel="noopener noreferrer" className="text-muted-foreground/40 hover:text-foreground">
                      <IconGlobe size={14} />
                    </a>
                  </div>
                </div>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {sk("portfolioDesc")}
                </p>
              </div>
            </li>
          </ul>
        </div>

        <div className="border-b border-border p-6">
          <h2 className="mb-3 text-[11px] font-bold uppercase tracking-widest text-muted-foreground/60">
            Open Source
          </h2>
          <ul className="space-y-3">
            <li>
              <a
                href="https://github.com/shadcn-ui/ui/issues/6427"
                target="_blank"
                rel="noopener noreferrer"
                className="group block"
              >
                <p className="text-sm group-hover:text-foreground">
                  <span className="font-bold">shadcn/ui</span>
                  <span className="ml-1.5 text-xs text-muted-foreground/50">#6427</span>
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {sk("shadcnIssueDesc")}
                </p>
              </a>
            </li>
          </ul>
        </div>

        <div className="hidden flex-1 md:flex" />
      </aside>
    </div>
  );
}
