import { Suspense } from "react";
import { getTranslations } from "next-intl/server";
import { IconStar, IconQuote, IconFolder } from "nucleo-isometric";
import { contact, skills } from "@/lib/constants";
import { projects } from "../data/portfolio";
import { HalftoneImage } from "./halftone-image";
import { OpenSourceSection } from "./open-source-section";
import { ProjectItem } from "./project-item";
import { SectionHeading } from "./section-heading";

export async function SkillsPanel() {
  const sk = await getTranslations("skills");

  return (
    <aside aria-label="Skills and projects" className="flex flex-col">
      <div className="hidden border-b border-border md:block">
        <HalftoneImage
          src="/felipe.jpeg"
          alt={contact.name}
          width={3111}
          height={3111}
        />
      </div>

      <div className="border-b border-border p-6">
        <SectionHeading icon={<IconStar size={14} aria-hidden="true" />}>
          {sk("title")}
        </SectionHeading>
        <div className="flex flex-wrap gap-1.5">
          {skills.map((skill) => (
            <span
              key={skill}
              className="rounded-sm border border-border px-1.5 py-0.5 text-xs text-muted-foreground"
            >
              {skill}
            </span>
          ))}
        </div>
      </div>

      <div className="border-b border-border p-6">
        <SectionHeading icon={<IconQuote size={14} aria-hidden="true" />}>
          {sk("languages")}
        </SectionHeading>
        <ul className="space-y-1.5 text-sm">
          <li className="flex items-baseline justify-between">
            <span>{sk("portuguese")}</span>
            <span className="text-xs text-muted-foreground-subtle">
              {sk("native")}
            </span>
          </li>
          <li className="flex items-baseline justify-between">
            <a
              href="https://cert.efset.org/VLZ6f9"
              target="_blank"
              rel="noopener noreferrer"
              className="external-link"
            >
              {sk("english")}
              <span className="sr-only"> — B2 EF SET (opens in new tab)</span>
            </a>
            <span aria-hidden="true" className="text-xs text-muted-foreground-subtle">
              B2 · EF SET
            </span>
          </li>
        </ul>
      </div>

      <div className="border-b border-border p-6">
        <SectionHeading icon={<IconFolder size={14} aria-hidden="true" />}>
          {sk("projects")}
        </SectionHeading>
        <ul className="space-y-4">
          {projects.map((p) => (
            <ProjectItem
              key={p.name}
              name={p.name}
              description={sk(p.descKey)}
              repo={p.repo}
              site={p.site}
            />
          ))}
        </ul>
      </div>

      <Suspense fallback={null}>
        <OpenSourceSection />
      </Suspense>

      <div className="hidden flex-1 md:flex" />
    </aside>
  );
}
