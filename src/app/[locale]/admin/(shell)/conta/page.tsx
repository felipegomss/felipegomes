import { sessionExpiry } from "@/lib/auth";
import { formatDay } from "@/lib/format-date";
import { headers } from "next/headers";
import Link from "next/link";
import { listGrants } from "@/lib/oauth";
import { listPasskeys } from "@/lib/passkeys";
import { AgentsManager } from "./agents-manager";
import { PasskeyManager } from "./passkey-manager";
import { SignOutButton } from "./sign-out-button";

export const dynamic = "force-dynamic";

const SECTION_TITLE = "text-xs font-semibold uppercase tracking-[0.12em]";

export default async function AccountPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const [passkeys, expiresAt, grants, h] = await Promise.all([listPasskeys(), sessionExpiry(), listGrants(), headers()]);
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "lfng.dev";
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  const mcpUrl = `${proto}://${host}/api/mcp`;
  const now = new Date();

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-8 text-xs">
      <div className="flex flex-col gap-1">
        <h1 className="font-heading text-2xl font-semibold tracking-tight">Acesso e passkeys</h1>
        <p className="leading-relaxed text-muted-foreground">
          Entre com a digital no Mac ou o Face ID no iPhone. A senha continua valendo como reserva.
        </p>
      </div>

      <PasskeyManager
        initial={passkeys.map((p) => ({
          id: p.id,
          name: p.name,
          backedUp: p.backedUp,
          createdAt: p.createdAt.toISOString(),
          lastUsedAt: p.lastUsedAt?.toISOString() ?? null,
        }))}
      />

      <AgentsManager
        mcpUrl={mcpUrl}
        grants={grants.map((g) => ({
          id: g.id,
          clientName: g.clientName,
          createdAt: g.createdAt.toISOString(),
          lastUsedAt: g.lastUsedAt?.toISOString() ?? null,
        }))}
      />

      <Link
        href={`/${locale}/admin/conta/integracoes`}
        className="flex items-center justify-between gap-3 border p-3 outline-none hover:bg-muted/60 focus-visible:ring-2 focus-visible:ring-ring/60"
      >
        <span className="flex flex-col gap-0.5">
          <span className="font-medium">Integrações</span>
          <span className="text-muted-foreground">IA que categoriza os Salvos, Instagram e atalho do iPhone</span>
        </span>
        <span aria-hidden="true" className="text-muted-foreground">→</span>
      </Link>

      <section className="flex flex-col gap-3" aria-labelledby="sec-install">
        <h2 id="sec-install" className={SECTION_TITLE}>
          Instalar o app
        </h2>
        <div className="grid grid-cols-[repeat(auto-fit,minmax(260px,1fr))] gap-3">
          <article className="flex flex-col gap-2.5 border p-4">
            <h3 className="text-[13px] font-semibold">iPhone</h3>
            <ol className="flex list-decimal flex-col gap-1.5 pl-4 leading-relaxed text-muted-foreground">
              <li>Abra lfng.dev/pt-BR/admin no Safari</li>
              <li>
                Toque em Compartilhar › <span className="text-foreground">Adicionar à Tela de Início</span>
              </li>
              <li>Abra pelo ícone e entre com Face ID</li>
            </ol>
          </article>
          <article className="flex flex-col gap-2.5 border p-4">
            <h3 className="text-[13px] font-semibold">Mac</h3>
            <ol className="flex list-decimal flex-col gap-1.5 pl-4 leading-relaxed text-muted-foreground">
              <li>
                Safari: Arquivo › <span className="text-foreground">Adicionar ao Dock</span>
              </li>
              <li>Chrome: ícone de instalar na barra de endereço</li>
              <li>Entre com a digital (Touch ID)</li>
            </ol>
          </article>
        </div>
      </section>

      <section className="flex flex-col gap-3" aria-labelledby="sec-session">
        <h2 id="sec-session" className={SECTION_TITLE}>
          Sessão
        </h2>
        <div className="flex flex-wrap items-center justify-between gap-3 border p-3">
          <span className="flex flex-col gap-0.5">
            <span className="font-medium">Este aparelho</span>
            <span className="text-muted-foreground">
              {expiresAt ? `Válida até ${formatDay(expiresAt, now)}` : "Sessão expirada"}
            </span>
          </span>
          <SignOutButton />
        </div>
      </section>
    </div>
  );
}
