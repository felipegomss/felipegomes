import { IconGithub } from "nucleo-social-media";
import { IconGlobe } from "nucleo-isometric";

interface ProjectItemProps {
  name: string;
  description: string;
  repo?: string;
  site?: string;
}

export function ProjectItem({ name, description, repo, site }: ProjectItemProps) {
  return (
    <li>
      <div>
        <div className="flex items-center justify-between">
          <p className="text-sm font-bold">{name}</p>
          <div className="flex gap-3">
            {repo && (
              <a href={repo} target="_blank" rel="noopener noreferrer" aria-label={`${name} repository`} className="text-muted-foreground/40 hover:text-foreground">
                <IconGithub size={14} aria-hidden="true" />
              </a>
            )}
            {site && (
              <a href={site} target="_blank" rel="noopener noreferrer" aria-label={`${name} website`} className="text-muted-foreground/40 hover:text-foreground">
                <IconGlobe size={14} aria-hidden="true" />
              </a>
            )}
          </div>
        </div>
        <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
      </div>
    </li>
  );
}
