import { getTranslations } from "next-intl/server";
import { IconGithub, IconLinkedin } from "nucleo-social-media";
import { IconAward, IconMailbox } from "nucleo-isometric";
import { contact, CAREER_START, MS_PER_YEAR } from "@/lib/constants";
import { LocaleSwitcher } from "./locale-switcher";
import { SectionHeading } from "./section-heading";

export async function Sidebar({ locale }: { locale: string }) {
  const sidebar = await getTranslations("sidebar");
  const yearsOfExperience = Math.floor(
    (Date.now() - CAREER_START.getTime()) / MS_PER_YEAR,
  );

  return (
    <aside
      aria-label="Sidebar"
      className="flex flex-col justify-between border-b border-border p-6 md:sticky md:top-0 md:h-screen md:border-b-0 md:border-r"
    >
      <div className="space-y-8">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="font-heading text-5xl font-black uppercase tracking-tight">
              LFNG
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">Luis Felipe</p>
            <p className="text-sm text-muted-foreground">Nascimento Gomes</p>
            <p className="mt-1 text-xs text-muted-foreground/60">
              Salvador/BA
            </p>
          </div>
          <LocaleSwitcher />
        </div>

        <div>
          <h2 className="font-heading text-lg font-bold">
            Full Stack{" "}
            <span className="text-sm font-normal text-muted-foreground">
              · {yearsOfExperience}+ {sidebar("years")}
            </span>
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">
            {sidebar("stack")}
          </p>
          <p className="mt-0.5 text-[11px] text-muted-foreground/50">
            {sidebar("subtitle")}
          </p>
        </div>

        <section aria-label={sidebar("education")}>
          <SectionHeading className="mb-2" icon={<IconAward size={14} aria-hidden="true" />}>
            {sidebar("education")}
          </SectionHeading>
          <div>
            <p className="text-sm">{sidebar("mba")}</p>
            <p className="text-xs text-muted-foreground/60">
              {sidebar("mbaInfo")}
            </p>
          </div>
          <div className="mt-3">
            <a
              href="/diploma.pdf"
              target="_blank"
              rel="noopener noreferrer"
              className={"external-link text-sm"}
            >
              {sidebar("degree")}
              <span className="sr-only"> (opens in new tab)</span>
            </a>
            <p className="text-xs text-muted-foreground/60">
              {sidebar("degreeInfo")}
            </p>
            <p className="text-xs text-muted-foreground/60">
              {sidebar("degreeCr")}
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {sidebar("degreeCore")}
            </p>
          </div>
        </section>
      </div>

      <div className="mt-8 space-y-4 md:mt-0">
        <section aria-label={sidebar("contact")}>
          <SectionHeading className="mb-2" icon={<IconMailbox size={14} aria-hidden="true" />}>
            {sidebar("contact")}
          </SectionHeading>
          <ul className="space-y-1 text-sm">
            <li>
              <a
                href={`mailto:${contact.email}`}
                className={"external-link text-muted-foreground"}
              >
                {contact.email}
              </a>
            </li>
            <li>
              <a
                href={`tel:+55${contact.phone.replace(/\D/g, "")}`}
                className={"external-link text-muted-foreground"}
              >
                {contact.phone}
              </a>
            </li>
          </ul>
          <a
            href={`/${locale}/api/cv`}
            download
            className="mt-3 inline-block text-xs font-bold uppercase tracking-widest text-muted-foreground transition-colors hover:text-foreground"
          >
            <span aria-hidden="true">↓ </span>
            {sidebar("download")}
          </a>
        </section>

        <nav aria-label="Social">
          <h2 className="mb-3 text-[11px] font-bold uppercase tracking-widest text-muted-foreground/60">
            Social
          </h2>
          <div className="flex gap-3">
            <a
              href={`https://${contact.linkedin}`}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="LinkedIn"
              className="text-muted-foreground transition-colors hover:text-foreground"
            >
              <IconLinkedin size={18} aria-hidden="true" />
            </a>
            <a
              href={`https://${contact.github}`}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="GitHub"
              className="text-muted-foreground transition-colors hover:text-foreground"
            >
              <IconGithub size={18} aria-hidden="true" />
            </a>
          </div>
        </nav>
      </div>
    </aside>
  );
}
