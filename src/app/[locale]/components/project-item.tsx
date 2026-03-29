import { IconGithub } from "nucleo-social-media";
import { IconGlobe } from "nucleo-isometric";

interface ProjectItemProps {
  name: string;
  description: string;
  repo?: string;
  site?: string;
  badge?: React.ReactNode;
}

export function ProjectItem({ name, description, repo, site, badge }: ProjectItemProps) {
  return (
    <li>
      <div className="flex items-center justify-between">
        <p className="flex items-center gap-1.5 text-sm font-bold">
          {name}
          {badge}
        </p>
        <div className="flex gap-3">
          {repo && (
            <a data-umami-event="project-repo" data-umami-event-name={name} href={repo} target="_blank" rel="noopener noreferrer" aria-label={`${name} repository`} className="text-muted-foreground/40 hover:text-foreground">
              <IconGithub size={14} aria-hidden="true" />
            </a>
          )}
          {site && (
            <a data-umami-event="project-site" data-umami-event-name={name} href={site} target="_blank" rel="noopener noreferrer" aria-label={`${name} website`} className="text-muted-foreground/40 hover:text-foreground">
              <IconGlobe size={14} aria-hidden="true" />
            </a>
          )}
        </div>
      </div>
      <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
    </li>
  );
}
