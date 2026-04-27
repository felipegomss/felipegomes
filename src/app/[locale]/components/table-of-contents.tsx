import type { TocEntry } from "@/lib/blog";
import { cn } from "@/lib/utils";

interface TableOfContentsProps {
  headings: TocEntry[];
  label: string;
}

export function TableOfContents({ headings, label }: TableOfContentsProps) {
  if (headings.length === 0) return null;

  return (
    <nav aria-label={label}>
      <p className="mb-3 font-heading text-2xs font-black uppercase tracking-widest text-muted-foreground-subtle">
        {label}
      </p>
      <ul className="space-y-1.5" role="list">
        {headings.map((heading) => (
          <li key={heading.id}>
            <a
              href={`#${heading.id}`}
              className={cn(
                "block text-2xs leading-snug text-muted-foreground transition-colors hover:text-foreground",
                heading.level === 3 && "pl-3",
              )}
            >
              {heading.text}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
