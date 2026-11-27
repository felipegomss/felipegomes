import type { SVGProps } from "react";

/** Cobra no estilo Lucide (traço 2, cantos arredondados) — o Lucide não tem uma. */
export function SnakeIcon({ strokeWidth = 2, ...props }: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={24}
      height={24}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      <path d="M4 21h11a3.5 3.5 0 0 0 0-7H9a3.5 3.5 0 0 1 0-7h3" />
      <path d="M12 7a3 3 0 0 1 3-3h1.5a2.5 2.5 0 0 1 0 5H15a3 3 0 0 1-3-2Z" />
      <path d="M19 6.5h1.5m0 0 1.2-1.2m-1.2 1.2 1.2 1.2" />
      <circle cx="16" cy="6" r=".6" fill="currentColor" stroke="none" />
    </svg>
  );
}
