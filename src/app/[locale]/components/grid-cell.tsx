import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

type GridCellProps = {
  col: "left" | "right";
  children?: ReactNode;
  className?: string;
  as?: "div" | "article" | "section";
  ariaLabel?: string;
};

export function GridCell({
  col,
  children,
  className,
  as: Tag = "div",
  ariaLabel,
}: GridCellProps) {
  return (
    <Tag
      data-grid-col={col}
      suppressHydrationWarning
      aria-label={ariaLabel}
      className={cn("border-b border-border", className)}
    >
      {children}
    </Tag>
  );
}
