interface SectionHeadingProps {
  icon: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export function SectionHeading({
  icon,
  children,
  className = "mb-3",
}: SectionHeadingProps) {
  return (
    <h2
      className={`flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest text-muted-foreground/60 ${className}`}
    >
      {children}
      {icon}
    </h2>
  );
}
