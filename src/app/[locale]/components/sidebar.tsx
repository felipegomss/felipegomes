import { getTranslations } from "next-intl/server";
import { IconGithub, IconLinkedin } from "nucleo-social-media";
import { IconAward, IconMailbox } from "nucleo-isometric";
import { contact, CAREER_START, MS_PER_YEAR, CV_FILENAME } from "@/lib/constants";
import { DownloadCvButton } from "./download-cv-button";
import { MusicWidget } from "./music-widget";
import { SectionHeading } from "./section-heading";

export async function Sidebar({ locale }: { locale: string }) {
  const sidebar = await getTranslations("sidebar");
  const yearsOfExperience = Math.floor(
    (Date.now() - CAREER_START.getTime()) / MS_PER_YEAR,
  );

  return (
    <aside
      aria-label="Sidebar"
      className="flex flex-col justify-between border-b border-border p-6 md:sticky md:top-0 md:row-span-full md:h-screen md:border-b-0 md:border-r"
    >
      <div className="space-y-8">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="font-heading text-5xl font-black uppercase tracking-tight">
              LFNG
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">Luis Felipe</p>
            <p className="text-sm text-muted-foreground">Nascimento Gomes</p>
            <p className="mt-1 text-xs text-muted-foreground-subtle">
              Salvador/BA
            </p>
          </div>
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
          <p className="mt-0.5 text-2xs text-muted-foreground-subtle">
            {sidebar("subtitle")}
          </p>
        </div>

        <section aria-label={sidebar("education")}>
          <SectionHeading className="mb-2" icon={<IconAward size={14} aria-hidden="true" />}>
            {sidebar("education")}
          </SectionHeading>
          <div>
            <p className="text-sm">{sidebar("mba")}</p>
            <p className="text-xs text-muted-foreground-subtle">
              {sidebar("mbaInfo")}
            </p>
          </div>
          <div className="mt-3">
            <a
              href="/diploma.pdf"
              target="_blank"
              rel="noopener noreferrer"
              data-umami-event="view-diploma"
              className={"external-link text-sm"}
            >
              {sidebar("degree")}
              <span className="sr-only"> (opens in new tab)</span>
            </a>
            <p className="text-xs text-muted-foreground-subtle">
              {sidebar("degreeInfo")}
            </p>
            <p className="text-xs text-muted-foreground-subtle">
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
                data-umami-event="contact-email"
                href={`mailto:${sidebar("email")}`}
                className={"external-link text-muted-foreground"}
              >
                {sidebar("email")}
              </a>
            </li>
            <li>
              <a
                data-umami-event="contact-phone"
                href={`tel:+${contact.phoneDigits}`}
                className={"external-link text-muted-foreground"}
              >
                {contact.phone}
              </a>
            </li>
          </ul>
          <DownloadCvButton
            href={`/cv/${CV_FILENAME}_${locale}.pdf`}
            label={sidebar("download")}
          />
        </section>

        <nav aria-label="Social">
          <h2 className="mb-3 text-2xs font-bold uppercase tracking-widest text-muted-foreground">
            Social
          </h2>
          <div className="flex gap-3">
            <a
              data-umami-event="social-linkedin"
              href={`https://${contact.linkedin}`}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="LinkedIn"
              className="text-muted-foreground transition-colors hover:text-foreground"
            >
              <IconLinkedin size={18} aria-hidden="true" />
            </a>
            <a
              data-umami-event="social-github"
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

        <div className="-mx-6 -mb-6">
          <MusicWidget />
        </div>
      </div>
    </aside>
  );
}
