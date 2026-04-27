import type { MDXComponents } from "mdx/types";
import { cn } from "@/lib/utils";
import { CodeBlock } from "./code-block";
import { Callout } from "./callout";

function createAnchorHeading(Tag: "h2" | "h3") {
  return function AnchorHeading({
    children,
    id,
    className,
    ...props
  }: React.HTMLAttributes<HTMLHeadingElement>) {
    return (
      <Tag id={id} className={cn("group scroll-mt-6", className)} {...props}>
        {children}
        {id && (
          <a
            href={`#${id}`}
            aria-label="Link para esta seção"
            className="ml-2 text-sm text-muted-foreground opacity-0 no-underline transition-opacity group-hover:opacity-100 focus-visible:opacity-100"
            tabIndex={-1}
          >
            #
          </a>
        )}
      </Tag>
    );
  };
}

export const mdxComponents: MDXComponents = {
  h2: createAnchorHeading("h2"),
  h3: createAnchorHeading("h3"),
  pre: CodeBlock,
  Callout,
  a: ({ href, children, ...props }) => {
    const isExternal = href?.startsWith("http");
    return (
      <a
        href={href}
        className={isExternal ? "external-link" : undefined}
        target={isExternal ? "_blank" : undefined}
        rel={isExternal ? "noopener noreferrer" : undefined}
        {...props}
      >
        {children}
      </a>
    );
  },
};
