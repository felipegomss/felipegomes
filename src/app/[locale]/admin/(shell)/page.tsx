import Link from "next/link";
import {
  ArrowRightIcon,
  BriefcaseIcon,
  CheckIcon,
  InboxIcon,
  MailIcon,
  SendIcon,
  StarIcon,
  XIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getJobStats } from "@/lib/jobs/stats";
import { getEmailStats } from "@/lib/email/stats";
import type { JobSource } from "@/lib/db/schema";

const SOURCE_LABELS: Record<JobSource, string> = {
  "github-frontendbr": "frontendbr",
  "github-backendbr": "backend-br",
  "github-react-brasil": "react-brasil",
  remoteok: "RemoteOK",
  "hn-hiring": "HN Hiring",
};

const RELATIVE_FORMATTER = new Intl.RelativeTimeFormat("pt-BR", { numeric: "auto" });
function relativeTime(date: Date | null): string {
  if (!date) return "—";
  const diff = date.getTime() - Date.now();
  const abs = Math.abs(diff);
  const minutes = abs / 60000;
  const hours = minutes / 60;
  const days = hours / 24;
  if (minutes < 60) return RELATIVE_FORMATTER.format(Math.round(diff / 60000), "minute");
  if (hours < 24) return RELATIVE_FORMATTER.format(Math.round(diff / 3600000), "hour");
  return RELATIVE_FORMATTER.format(Math.round(days), "day");
}

export const dynamic = "force-dynamic";

export default async function AdminHomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const [jobs, email] = await Promise.all([getJobStats(), getEmailStats()]);

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="font-heading text-2xl font-semibold tracking-tight">
          Visão geral
        </h1>
        <p className="text-sm text-muted-foreground">
          Indicadores rápidos das ferramentas do admin.
        </p>
      </div>

      <Section
        title="Vagas"
        href={`/${locale}/admin/jobs`}
        meta={
          jobs.lastScrapedAt
            ? `última busca ${relativeTime(jobs.lastScrapedAt)}`
            : "nenhuma busca ainda"
        }
      >
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatCard
            label="Novas"
            value={jobs.byStatus.new}
            icon={<InboxIcon className="size-4" />}
            tone="info"
          />
          <StatCard
            label="Favoritas"
            value={jobs.starred}
            icon={<StarIcon className="size-4" />}
            tone="warning"
          />
          <StatCard
            label="Contatadas"
            value={jobs.byStatus.contacted}
            icon={<CheckIcon className="size-4" />}
            tone="success"
          />
          <StatCard
            label="Dispensadas"
            value={jobs.byStatus.dismissed}
            icon={<XIcon className="size-4" />}
            tone="muted"
          />
        </div>

        {jobs.bySourceBreakdown.length > 0 && (
          <div className="mt-4 overflow-hidden rounded-lg border border-border bg-card">
            <div className="grid grid-cols-[1fr_60px_60px_60px_60px] gap-2 border-b border-border bg-muted/40 px-3 py-2 text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
              <div>Fonte</div>
              <div className="text-right">Total</div>
              <div className="text-right">Fav</div>
              <div className="text-right">Cont</div>
              <div className="text-right">Disp</div>
            </div>
            <div className="flex flex-col divide-y divide-border">
              {jobs.bySourceBreakdown.map((s) => (
                <div
                  key={s.source}
                  className="grid grid-cols-[1fr_60px_60px_60px_60px] items-center gap-2 px-3 py-2 text-xs"
                >
                  <div className="truncate font-medium">{SOURCE_LABELS[s.source]}</div>
                  <div className="text-right tabular-nums text-muted-foreground">{s.total}</div>
                  <div className={cn("text-right tabular-nums", s.starred > 0 ? "text-amber-500 font-semibold" : "text-muted-foreground/40")}>
                    {s.starred}
                  </div>
                  <div className={cn("text-right tabular-nums", s.contacted > 0 ? "text-emerald-500 font-semibold" : "text-muted-foreground/40")}>
                    {s.contacted}
                  </div>
                  <div className={cn("text-right tabular-nums", s.dismissed > 0 ? "text-foreground" : "text-muted-foreground/40")}>
                    {s.dismissed}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </Section>

      <Section
        title="Email"
        href={`/${locale}/admin/email/sent`}
        meta={
          email.lastSentAt
            ? `último envio ${relativeTime(email.lastSentAt)}`
            : email.error ?? "nenhum envio"
        }
      >
        {email.available ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatCard
              label="Enviados (últ. 100)"
              value={email.total}
              icon={<MailIcon className="size-4" />}
              tone="info"
            />
            <StatCard
              label="Últimos 7 dias"
              value={email.last7Days}
              icon={<SendIcon className="size-4" />}
              tone="info"
            />
            <StatCard
              label="Entregues"
              value={email.delivered}
              icon={<CheckIcon className="size-4" />}
              tone="success"
            />
            <StatCard
              label="Taxa entrega"
              value={
                email.deliveryRate === null
                  ? "—"
                  : `${Math.round(email.deliveryRate * 100)}%`
              }
              icon={<CheckIcon className="size-4" />}
              tone="success"
            />
          </div>
        ) : (
          <div className="rounded-md border border-dashed border-border bg-muted/30 px-3 py-4 text-xs text-muted-foreground">
            {email.error ?? "Stats indisponíveis."}
          </div>
        )}

        {email.lastSubject && (
          <div className="mt-3 truncate text-xs text-muted-foreground">
            Último assunto: <span className="text-foreground">{email.lastSubject}</span>
          </div>
        )}
      </Section>

      <Section title="Atalhos">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <Shortcut
            href={`/${locale}/admin/email`}
            title="Compor email"
            description="Enviar com templates e CV."
            icon={<SendIcon className="size-5" />}
          />
          <Shortcut
            href={`/${locale}/admin/jobs`}
            title="Buscar vagas"
            description="Coletar das fontes públicas."
            icon={<BriefcaseIcon className="size-5" />}
          />
          <Shortcut
            href={`/${locale}/admin/email/sent`}
            title="Histórico de emails"
            description="Status e detalhes do Resend."
            icon={<InboxIcon className="size-5" />}
          />
        </div>
      </Section>
    </div>
  );
}

// ─── Building blocks ─────────────────────────────────────────────────────────

function Section({
  title,
  href,
  meta,
  children,
}: {
  title: string;
  href?: string;
  meta?: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <div className="mb-3 flex items-end justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-widest text-foreground">
            {title}
          </h2>
          {meta && (
            <p className="text-[11px] text-muted-foreground">{meta}</p>
          )}
        </div>
        {href && (
          <Link
            href={href}
            className="flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
          >
            Abrir <ArrowRightIcon className="size-3" />
          </Link>
        )}
      </div>
      {children}
    </section>
  );
}

const TONE_STYLES = {
  info: "text-sky-500",
  success: "text-emerald-500",
  warning: "text-amber-500",
  muted: "text-muted-foreground",
} as const;

function StatCard({
  label,
  value,
  icon,
  tone = "info",
}: {
  label: string;
  value: number | string;
  icon: React.ReactNode;
  tone?: keyof typeof TONE_STYLES;
}) {
  return (
    <div className="rounded-lg border border-border bg-card p-3">
      <div className={cn("flex items-center gap-1.5", TONE_STYLES[tone])}>
        {icon}
        <span className="text-[10px] font-medium uppercase tracking-widest">
          {label}
        </span>
      </div>
      <div className="mt-1 font-heading text-2xl font-semibold tabular-nums">
        {value}
      </div>
    </div>
  );
}

function Shortcut({
  href,
  title,
  description,
  icon,
}: {
  href: string;
  title: string;
  description: string;
  icon: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="group flex flex-col gap-2 rounded-lg border border-border bg-card p-4 transition-colors hover:border-foreground/30 hover:bg-muted/40"
    >
      <span className="text-muted-foreground transition-colors group-hover:text-foreground">
        {icon}
      </span>
      <div className="font-medium">{title}</div>
      <div className="text-xs text-muted-foreground">{description}</div>
    </Link>
  );
}
