import { getTranslations } from "next-intl/server";
import { IconStar, IconQuote, IconFolder, IconAbstract } from "nucleo-isometric";
import { contact, skills } from "@/lib/cv-data";
import { projects } from "../data/portfolio";
import { HalftoneImage } from "./halftone-image";
import { ProjectItem } from "./project-item";

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
        <h2 className="mb-3 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest text-muted-foreground/60">
          {sk("title")}
          <IconStar size={14} aria-hidden="true" />
        </h2>
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
        <h2 className="mb-3 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest text-muted-foreground/60">
          {sk("languages")}
          <IconQuote size={14} aria-hidden="true" />
        </h2>
        <ul className="space-y-1.5 text-sm">
          <li className="flex items-baseline justify-between">
            <span>{sk("portuguese")}</span>
            <span className="text-xs text-muted-foreground/50">
              {sk("native")}
            </span>
          </li>
          <li className="flex items-baseline justify-between">
            <a
              href="https://cert.efset.org/VLZ6f9"
              target="_blank"
              rel="noopener noreferrer"
              className="underline decoration-muted-foreground/30 underline-offset-2 hover:decoration-foreground hover:text-foreground"
            >
              {sk("english")}
              <span className="sr-only"> — B2 EF SET (opens in new tab)</span>
            </a>
            <span aria-hidden="true" className="text-xs text-muted-foreground/50">
              B2 · EF SET
            </span>
          </li>
        </ul>
      </div>

      <div className="border-b border-border p-6">
        <h2 className="mb-3 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest text-muted-foreground/60">
          {sk("projects")}
          <IconFolder size={14} aria-hidden="true" />
        </h2>
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

      <div className="border-b border-border p-6">
        <h2 className="mb-3 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest text-muted-foreground/60">
          Open Source
          <IconAbstract size={14} aria-hidden="true" />
        </h2>
        <ul className="space-y-3">
          <li>
            <a
              href="https://github.com/shadcn-ui/ui/issues/6427"
              target="_blank"
              rel="noopener noreferrer"
              className="group block"
            >
              <p className="text-sm underline decoration-muted-foreground/30 underline-offset-2 group-hover:decoration-foreground group-hover:text-foreground">
                <span className="font-bold">shadcn/ui</span>
                <span className="ml-1.5 text-xs text-muted-foreground/50">
                  #6427
                </span>
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {sk("shadcnIssueDesc")}
              </p>
              <span className="sr-only">(opens in new tab)</span>
            </a>
          </li>
        </ul>
      </div>

      <div className="hidden flex-1 md:flex" />
    </aside>
  );
}
