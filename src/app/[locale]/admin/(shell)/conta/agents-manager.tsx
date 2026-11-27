"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { BotIcon, CheckIcon, CopyIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatDay } from "@/lib/format-date";

type Grant = { id: string; clientName: string; createdAt: string; lastUsedAt: string | null };

export function AgentsManager({ grants, mcpUrl }: { grants: Grant[]; mcpUrl: string }) {
  const router = useRouter();
  const [copied, setCopied] = useState(false);
  const [confirming, setConfirming] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const now = new Date();

  async function revoke(id: string) {
    const res = await fetch(`/api/oauth/grants/${id}`, { method: "DELETE" });
    setConfirming(null);
    if (!res.ok) return setError("Não foi possível revogar.");
    router.refresh();
  }

  return (
    <section className="flex flex-col gap-3" aria-labelledby="sec-agents">
      <h2 id="sec-agents" className="text-xs font-semibold uppercase tracking-[0.12em]">
        Agentes conectados
      </h2>

      <div className="flex flex-col gap-2.5 border p-4">
        <p className="leading-relaxed text-muted-foreground">
          Para o Claude executar ações no app, adicione um conector personalizado (Configurações › Conectores) com este
          endereço. Ele vai pedir para você autorizar aqui, com a passkey.
        </p>
        <div className="flex items-center gap-2">
          <code className="flex h-10 min-w-0 flex-1 items-center truncate border bg-muted/40 px-3">{mcpUrl}</code>
          <Button
            variant="outline"
            size="lg"
            onClick={async () => {
              await navigator.clipboard.writeText(mcpUrl).catch(() => {});
              setCopied(true);
              setTimeout(() => setCopied(false), 1500);
            }}
          >
            {copied ? <CheckIcon aria-hidden="true" /> : <CopyIcon aria-hidden="true" />}
            {copied ? "Copiado" : "Copiar"}
          </Button>
        </div>
      </div>

      {error && (
        <p role="alert" className="text-xs text-red-800 dark:text-red-400">
          {error}
        </p>
      )}

      <ul className="border">
        {grants.length === 0 && <li className="p-3 text-muted-foreground">Nenhum agente conectado.</li>}
        {grants.map((g) => (
          <li key={g.id} className="flex flex-wrap items-center gap-3 border-b p-3 last:border-b-0">
            <span className="grid size-8 place-items-center bg-muted" aria-hidden="true">
              <BotIcon className="size-4" />
            </span>
            <span className="flex flex-[1_1_240px] flex-col gap-0.5">
              <span className="font-medium">{g.clientName}</span>
              <span className="text-muted-foreground">
                Autorizado {formatDay(g.createdAt, now)}
                {g.lastUsedAt ? ` · último uso ${formatDay(g.lastUsedAt, now)}` : " · ainda não usado"}
              </span>
            </span>
            {confirming === g.id ? (
              <span role="alertdialog" aria-label={`Revogar ${g.clientName}?`} className="flex items-center gap-2">
                <span className="text-muted-foreground">Revogar?</span>
                <Button variant="outline" size="lg" autoFocus onClick={() => setConfirming(null)}>
                  Cancelar
                </Button>
                <Button
                  size="lg"
                  onClick={() => revoke(g.id)}
                  className="bg-red-700 text-white hover:bg-red-800 dark:bg-red-400 dark:text-neutral-950"
                >
                  Revogar
                </Button>
              </span>
            ) : (
              <Button
                variant="ghost"
                size="lg"
                onClick={() => setConfirming(g.id)}
                className="text-red-800 hover:text-red-900 dark:text-red-400"
              >
                Revogar
              </Button>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
