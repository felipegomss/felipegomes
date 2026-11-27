import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { BookmarkIcon, BriefcaseIcon, ChevronRightIcon, InboxIcon, ListChecksIcon, PawPrintIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatLongDate, hourInTz } from "@/lib/format-date";
import { getHomeData, type AlertTone, type HomeModule } from "@/lib/home/modules";
import { PET_NAV } from "@/lib/pets/registry";
import { loadPetPage } from "@/lib/pets/repo";
import { sortLogsDesc } from "@/lib/pets/stats";
import { getToolBySlug, tools, type ToolSlug } from "@/lib/tools";
import { QuickActions, type QuickPetAction } from "./_components/quick-actions";

export const dynamic = "force-dynamic";

/** Atalhos fixos de ferramentas na home (rótulos curtos). */
const PINNED_TOOLS: { slug: ToolSlug; label: string }[] = [
  { slug: "json", label: "JSON" },
  { slug: "jwt", label: "JWT" },
  { slug: "base64", label: "Base64" },
  { slug: "uuid", label: "UUID" },
  { slug: "timestamp", label: "Timestamp" },
  { slug: "regex", label: "Regex" },
  { slug: "diff", label: "Diff" },
  { slug: "hash", label: "Hash" },
  { slug: "password", label: "Senha" },
  { slug: "person", label: "Pessoa fake" },
];

const TONE_DOT: Record<AlertTone, string> = {
  danger: "bg-red-700 dark:bg-red-400",
  warn: "bg-amber-600 dark:bg-amber-400",
  info: "bg-blue-700 dark:bg-blue-400",
};
const TONE_LABEL: Record<AlertTone, string> = { danger: "urgente", warn: "atenção", info: "aviso" };

const MODULE_ICON: Record<HomeModule["icon"], React.ReactNode> = {
  pet: <PawPrintIcon aria-hidden="true" className="size-[18px] text-muted-foreground" />,
  briefcase: <BriefcaseIcon aria-hidden="true" className="size-[18px] text-muted-foreground" />,
  inbox: <InboxIcon aria-hidden="true" className="size-[18px] text-muted-foreground" />,
  tasks: <ListChecksIcon aria-hidden="true" className="size-[18px] text-muted-foreground" />,
  bookmark: <BookmarkIcon aria-hidden="true" className="size-[18px] text-muted-foreground" />,
};

const SECTION_TITLE = "text-xs font-semibold uppercase tracking-[0.12em]";

function greeting(now: Date) {
  const h = hourInTz(now);
  return h < 5 ? "Boa noite" : h < 12 ? "Bom dia" : h < 18 ? "Boa tarde" : "Boa noite";
}

export default async function AppHomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const now = new Date();
  const [{ modules, alerts }, t, petPages] = await Promise.all([
    getHomeData({ locale, now }),
    getTranslations({ locale, namespace: "tools" }),
    Promise.all(PET_NAV.map((p) => loadPetPage(p.slug))),
  ]);

  const quick: QuickPetAction[] = PET_NAV.flatMap((p) => [
    { slug: p.slug, type: "feeding" as const, label: `${p.name} comeu` },
    { slug: p.slug, type: "weight" as const, label: `Pesar ${p.name}` },
    { slug: p.slug, type: "water" as const, label: "Fiz TPA" },
  ]);
  const lastFeeding = Object.fromEntries(
    petPages.flatMap((page) =>
      page ? [[page.pet.slug, sortLogsDesc(page.logs).find((l) => l.type === "feeding") ?? null]] : [],
    ),
  );

  return (
    <div className="flex flex-col gap-8 text-xs">
      <section className="flex flex-col gap-1">
        <p className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground">{formatLongDate(now)}</p>
        <h1 className="font-heading text-2xl font-semibold tracking-tight">{greeting(now)}, Felipe</h1>
      </section>

      {/* No mobile "Registrar agora" vem antes das pendências (polegar). */}
      <section className="flex flex-col gap-3 md:order-2" aria-labelledby="home-quick">
        <h2 id="home-quick" className={SECTION_TITLE}>
          Registrar agora
        </h2>
        <QuickActions locale={locale} actions={quick} lastFeeding={lastFeeding} />
      </section>

      <section className="flex flex-col gap-3 md:order-1" aria-labelledby="home-alerts">
        <div className="flex items-baseline justify-between">
          <h2 id="home-alerts" className={SECTION_TITLE}>
            Pendências
          </h2>
          {alerts.length > 0 && <span className="text-[11px] text-muted-foreground">{alerts.length}</span>}
        </div>
        {alerts.length === 0 ? (
          <p className="border border-dashed p-4 text-muted-foreground">Tudo em dia.</p>
        ) : (
          <ul className="border">
            {alerts.map((a) => (
              <li key={a.id} className="border-b last:border-b-0">
                <Link
                  href={a.href}
                  className="flex min-h-12 items-center gap-3 px-3 py-2 outline-none transition-colors hover:bg-muted/60 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring/60 max-sm:min-h-14"
                >
                  <span className={cn("size-2 shrink-0", TONE_DOT[a.tone])} aria-hidden="true" />
                  <span className="sr-only">{TONE_LABEL[a.tone]}:</span>
                  <span className="hidden w-28 shrink-0 text-muted-foreground sm:block">{a.source}</span>
                  <span className="flex min-w-0 flex-1 flex-col gap-0.5 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
                    <span className="font-medium">{a.title}</span>
                    <span className="text-muted-foreground sm:text-[11px]">
                      <span className="sm:hidden">{a.source}</span>
                      {a.detail && (
                        <>
                          <span className="sm:hidden"> · </span>
                          {a.detail}
                        </>
                      )}
                    </span>
                  </span>
                  <ChevronRightIcon className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="flex flex-col gap-3 md:order-3" aria-labelledby="home-modules">
        <h2 id="home-modules" className={SECTION_TITLE}>
          Módulos
        </h2>
        <div className="grid grid-cols-[repeat(auto-fit,minmax(260px,1fr))] gap-3">
          {modules.map((m) => (
            <Link
              key={m.id}
              href={m.href}
              className="flex flex-col gap-3.5 border p-4 outline-none transition-colors hover:bg-muted/40 focus-visible:ring-2 focus-visible:ring-ring/60"
            >
              <span className="flex items-center gap-2.5">
                {m.photo ? (
                  // eslint-disable-next-line @next/next/no-img-element -- arquivo estático já otimizado
                  <img src={m.photo} alt="" width={24} height={24} className="size-6 border object-cover" />
                ) : (
                  MODULE_ICON[m.icon]
                )}
                <span className="text-[13px] font-semibold">{m.title}</span>
                <span className="ml-auto text-[11px] text-muted-foreground">Abrir →</span>
              </span>
              <dl className="grid grid-cols-3 gap-2">
                {m.stats.map((s) => (
                  <div key={s.label} className="flex flex-col gap-0.5">
                    <dt className="text-[11px] text-muted-foreground">{s.label}</dt>
                    <dd className="font-heading text-xl font-semibold">{s.value}</dd>
                  </div>
                ))}
              </dl>
              {m.note && <p className="text-[11px] text-muted-foreground">{m.note}</p>}
            </Link>
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-3 md:order-4" aria-labelledby="home-tools">
        <div className="flex items-center justify-between">
          <h2 id="home-tools" className={SECTION_TITLE}>
            Ferramentas
          </h2>
          <Link
            href={`/${locale}/admin/tools`}
            className="inline-flex min-h-11 items-center text-xs text-muted-foreground hover:text-foreground"
          >
            Todas as {tools.length} →
          </Link>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {PINNED_TOOLS.filter((p) => getToolBySlug(p.slug)).map((p) => (
            <Link
              key={p.slug}
              href={`/${locale}/admin/tools/${p.slug}`}
              title={t(getToolBySlug(p.slug)!.titleKey)}
              className="inline-flex h-9 items-center border px-3 outline-none transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring/60 max-sm:h-10"
            >
              {p.label}
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
