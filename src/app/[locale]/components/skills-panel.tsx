import { Suspense } from "react";
import { getTranslations } from "next-intl/server";
import { IconStar, IconQuote, IconFolder, IconCube } from "nucleo-isometric";
import { contact, skills } from "@/lib/constants";
import { githubFetch } from "@/lib/github";
import { projects, type Project } from "../data/portfolio";
import { GridCell } from "./grid-cell";
import { HalftoneImage } from "./halftone-image";
import { OpenSourceSection } from "./open-source-section";
import { ProjectItem } from "./project-item";
import { RecentPostsSection } from "./recent-posts-section";
import { SectionHeading } from "./section-heading";

async function getGitHubDirCount(apiPath: string): Promise<number | null> {
  const data = await githubFetch<unknown[]>(
    `https://api.github.com/${apiPath}`,
  );
  return data?.length ?? null;
}

function ProjectBadge({ count, label }: { count: number; label: string }) {
  return (
    <span className="flex items-center gap-1 text-xs font-normal text-muted-foreground-subtle">
      <IconCube size={10} aria-hidden="true" />
      <span className="tracking-tighter">{count} {label}</span>
    </span>
  );
}

export async function SkillsPanel() {
  const projectsWithCount = projects.filter((p) => p.countApi);
  const [sk, ...counts] = await Promise.all([
    getTranslations("skills"),
    ...projectsWithCount.map((p) => getGitHubDirCount(p.countApi!)),
  ]);

  const countMap = new Map<Project, number | null>(
    projectsWithCount.map((p, i) => [p, counts[i]]),
  );

  return (
    <aside aria-label="Skills and projects" className="flex flex-col md:contents">
      <GridCell col="right" className="hidden md:block bg-grid-pattern">
        <HalftoneImage
          src="/felipe.webp"
          alt={contact.name}
          width={1200}
          height={1200}
        />
      </GridCell>

      <GridCell col="right" className="p-6">
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
      </GridCell>

      <GridCell col="right" className="p-6">
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
              data-umami-event="view-efset"
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
      </GridCell>

      <GridCell col="right" className="p-6">
        <SectionHeading icon={<IconFolder size={14} aria-hidden="true" />}>
          {sk("projects")}
        </SectionHeading>
        <ul className="space-y-4">
          {projects.map((p) => {
            const count = countMap.get(p);
            return (
              <ProjectItem
                key={p.name}
                name={p.name}
                description={sk(p.descKey)}
                repo={p.repo}
                site={p.site}
                badge={
                  count != null && p.countLabel
                    ? <ProjectBadge count={count} label={p.countLabel} />
                    : undefined
                }
              />
            );
          })}
        </ul>
      </GridCell>

      <Suspense fallback={null}>
        <OpenSourceSection />
      </Suspense>

      <RecentPostsSection />

      <GridCell col="right" className="hidden flex-1 md:block border-b-0" />
    </aside>
  );
}
