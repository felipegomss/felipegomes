"use client";

import { usePathname } from "next/navigation";
import { useMountEffect } from "@/hooks/use-mount-effect";

function Ping({ path }: { path: string }) {
  useMountEffect(() => {
    const seen = `viewed:${path}`;

    try {
      if (sessionStorage.getItem(seen)) return;
      sessionStorage.setItem(seen, "1");
    } catch {
      // sessionStorage bloqueado: conta assim mesmo, sem deduplicar
    }

    void fetch("/api/views", { method: "POST", keepalive: true }).catch(() => {});
  });

  return null;
}

// A key remonta o Ping a cada navegação, então cada página conta uma vez por
// sessão sem depender de dependências de efeito.
export function TrackView() {
  const pathname = usePathname();

  // Ferramentas pessoais (/pets) não entram no contador público.
  if (pathname.includes("/pets/")) return null;

  return <Ping key={pathname} path={pathname} />;
}
