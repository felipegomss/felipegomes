import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { BotIcon } from "lucide-react";
import { isAdmin } from "@/lib/auth";
import { appMetadata, appViewport } from "@/lib/app-metadata";
import { getClient } from "@/lib/oauth";

export const metadata: Metadata = { ...appMetadata, title: "Autorizar agente" };
export const viewport = appViewport;
export const dynamic = "force-dynamic";

const CAN_DO = [
  "Ver o resumo do dia e as pendências",
  "Ver e registrar cuidados dos pets",
  "Consultar e atualizar vagas, e buscar novas",
  "Consultar emails enviados e enviar emails (pedindo sua confirmação)",
];

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function AuthorizePage({ params, searchParams }: Props) {
  const { locale } = await params;
  const sp = await searchParams;
  const q = new URLSearchParams(Object.entries(sp).flatMap(([k, v]) => (typeof v === "string" ? [[k, v]] : [])));

  if (!(await isAdmin())) {
    redirect(`/${locale}/admin/login?next=${encodeURIComponent(`/${locale}/admin/autorizar?${q}`)}`);
  }

  const client = await getClient(q.get("client_id"));
  const redirectUri = q.get("redirect_uri") ?? client?.redirectUris[0];
  const valid = client && redirectUri && client.redirectUris.includes(redirectUri);
  const returnHost = valid ? new URL(redirectUri).host : null;

  return (
    <main className="flex min-h-dvh items-center justify-center bg-background px-4">
      <div className="flex w-full max-w-sm flex-col gap-5 border border-border p-6 text-xs">
        <div className="flex flex-col gap-1.5">
          <span className="font-heading text-sm font-bold tracking-tight">LFNG</span>
          <h1 className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
            <BotIcon className="size-3.5" aria-hidden="true" />
            Autorizar agente
          </h1>
        </div>

        {!valid ? (
          <p role="alert" className="text-red-800 dark:text-red-400">
            Pedido de autorização inválido ou expirado. Tente conectar de novo pelo agente.
          </p>
        ) : (
          <>
            <p className="leading-relaxed">
              <span className="font-semibold">{client.name}</span> quer acessar o seu app.
              <span className="block text-muted-foreground">Depois de aprovar, você volta para {returnHost}.</span>
            </p>
            <div className="flex flex-col gap-2">
              <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Ele vai poder</span>
              <ul className="flex flex-col gap-1.5 border p-3 leading-relaxed">
                {CAN_DO.map((item) => (
                  <li key={item} className="flex gap-2">
                    <span aria-hidden="true" className="mt-1.5 size-1 shrink-0 bg-foreground" />
                    {item}
                  </li>
                ))}
              </ul>
              <p className="text-[11px] leading-relaxed text-muted-foreground">
                Dá para revogar a qualquer momento em Conta › Acesso e passkeys.
              </p>
            </div>
            <form method="post" action="/api/oauth/authorize" className="flex flex-col gap-2">
              {[...q.entries()].map(([k, v]) => (
                <input key={k} type="hidden" name={k} value={v} />
              ))}
              <button
                type="submit"
                name="decision"
                value="approve"
                className="h-11 bg-primary font-medium text-primary-foreground outline-none hover:bg-primary/90 focus-visible:ring-2 focus-visible:ring-ring/60"
              >
                Autorizar
              </button>
              <button
                type="submit"
                name="decision"
                value="deny"
                className="h-11 border outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring/60"
              >
                Negar
              </button>
            </form>
          </>
        )}
      </div>
    </main>
  );
}
