import { getTranslations } from "next-intl/server";
import { IconArchive } from "nucleo-isometric";
import type { Job } from "../data/portfolio";
import { SectionHeading } from "./section-heading";

export async function ExperienceSection({ jobs }: { jobs: Job[] }) {
  const exp = await getTranslations("experience");

  return (
    <main
      id="main-content"
      className="border-b border-border md:border-b-0 md:border-r"
    >
      <div className="border-b border-border p-6">
        <SectionHeading className="mb-0" icon={<IconArchive size={14} aria-hidden="true" />}>
          {exp("title")}
        </SectionHeading>
      </div>

      {jobs.map((job) => (
        <article key={job.key} className="border-b border-border p-6">
          <div className="mb-4">
            <h3 className="font-heading text-lg font-bold">{job.company}</h3>
            <p className="text-sm text-muted-foreground">
              {exp(`${job.key}.role`)}
            </p>
            <p className="mt-1 text-xs text-muted-foreground-subtle">
              {exp(`${job.key}.period`)}
              {exp.has(`${job.key}.location`) &&
                ` · ${exp(`${job.key}.location`)}`}
            </p>
          </div>
          <ul className="experience-list space-y-1.5">
            {Array.from({ length: job.count }, (_, i) => (
              <li
                key={i}
                className="text-sm leading-relaxed text-muted-foreground"
              >
                {exp(`${job.key}.h${i + 1}`)}
              </li>
            ))}
          </ul>
        </article>
      ))}
    </main>
  );
}
