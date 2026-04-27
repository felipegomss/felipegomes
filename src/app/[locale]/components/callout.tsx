import { cn } from "@/lib/utils";
import { AlertCircle, Info, Lightbulb } from "lucide-react";

type CalloutType = "note" | "tip" | "warning";

const config: Record<
  CalloutType,
  { icon: React.ElementType; className: string; label: string }
> = {
  note: {
    icon: Info,
    className:
      "border-blue-500/30 bg-blue-500/5 [&_svg]:text-blue-500",
    label: "Nota",
  },
  tip: {
    icon: Lightbulb,
    className:
      "border-green-500/30 bg-green-500/5 [&_svg]:text-green-500",
    label: "Dica",
  },
  warning: {
    icon: AlertCircle,
    className:
      "border-yellow-500/30 bg-yellow-500/5 [&_svg]:text-yellow-500",
    label: "Atenção",
  },
};

interface CalloutProps {
  type?: CalloutType;
  children: React.ReactNode;
}

export function Callout({ type = "note", children }: CalloutProps) {
  const { icon: Icon, className, label } = config[type];

  return (
    <div
      role="note"
      className={cn(
        "my-4 flex gap-3 rounded-lg border px-4 py-3 text-sm",
        className,
      )}
    >
      <Icon size={16} aria-hidden="true" className="mt-0.5 shrink-0" />
      <div>
        <p className="mb-1 font-bold">{label}</p>
        <div>{children}</div>
      </div>
    </div>
  );
}
