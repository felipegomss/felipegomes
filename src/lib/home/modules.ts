// Módulos da home. Cada um devolve seus números e suas pendências; a home
// junta tudo. Módulo novo (tarefas, agenda…) = mais uma função na lista.
import { getEmailStats } from "@/lib/email/stats";
import { formatDay } from "@/lib/format-date";
import { getJobStats } from "@/lib/jobs/stats";
import { PET_NAV, petPhoto } from "@/lib/pets/registry";
import { loadPetPage } from "@/lib/pets/repo";
import { computePetStats } from "@/lib/pets/stats";
import type { PetDTO, PetLogDTO } from "@/lib/pets/types";

export type AlertTone = "danger" | "warn" | "info";

export type HomeAlert = {
  id: string;
  tone: AlertTone;
  source: string;
  title: string;
  detail?: string;
  href: string;
};

export type HomeModule = {
  id: string;
  title: string;
  href: string;
  icon: "pet" | "briefcase" | "inbox";
  /** Foto (quadrada) no lugar do ícone, quando houver. */
  photo?: string;
  stats: { label: string; value: string }[];
  alerts: HomeAlert[];
  note?: string;
};

type Ctx = { locale: string; now: Date };

const plural = (n: number, one: string, many: string) => `${n} ${Math.abs(n) === 1 ? one : many}`;

/** Pendências e números de um pet (também usado pelo ponto vermelho da sidebar). */
export function petSummary(pet: PetDTO, logs: PetLogDTO[], { locale, now }: Ctx): HomeModule {
  const s = computePetStats(pet, logs, now);
  const href = `/${locale}/pets/${pet.slug}`;
  const alerts: HomeAlert[] = [];
  const alert = (id: string, tone: AlertTone, title: string, detail?: string) =>
    alerts.push({ id: `${pet.slug}:${id}`, tone, source: pet.name, title, detail, href });

  const f = s.feeding;
  if (f.dueInDays === null) alert("feed", "info", "Nenhuma alimentação registrada");
  else if (f.dueInDays < 0) alert("feed", "danger", `Alimentação atrasada ${plural(-f.dueInDays, "dia", "dias")}`, f.lastAccepted ? `última ${formatDay(f.lastAccepted.occurredAt, now)}` : undefined);
  else if (f.dueInDays === 0) alert("feed", "warn", "Alimentar hoje");

  if (s.shed.nextEstimateAt && s.shed.nextEstimateAt.getTime() < now.getTime()) {
    alert("shed", "warn", `Muda esperada desde ${formatDay(s.shed.nextEstimateAt, now)}`, s.shed.avgIntervalDays ? `média de ${s.shed.avgIntervalDays} dias` : undefined);
  }

  const w = s.water;
  if (w.dueInDays === null) alert("water", "info", "Nenhuma TPA registrada", `a cada ${pet.waterIntervalDays} dias`);
  else if (w.dueInDays < 0) alert("water", "warn", `TPA atrasada ${plural(-w.dueInDays, "dia", "dias")}`, `última ${formatDay(w.last!.occurredAt, now)}`);
  else if (w.dueInDays === 0) alert("water", "info", "TPA hoje");

  return {
    id: `pet:${pet.slug}`,
    title: pet.name,
    href,
    icon: "pet",
    photo: petPhoto(pet.slug),
    alerts,
    stats: [
      { label: "Sem comer", value: f.daysSince === null ? "—" : `${f.daysSince} d` },
      { label: "Peso", value: s.weight.last ? `${s.weight.last.data.grams} g` : "—" },
      { label: "Muda", value: s.shed.daysSince === null ? "—" : `${s.shed.daysSince} d` },
    ],
  };
}

async function petModules(ctx: Ctx): Promise<HomeModule[]> {
  const pages = await Promise.all(PET_NAV.map((p) => loadPetPage(p.slug)));
  return pages.flatMap((page) => (page ? [petSummary(page.pet, page.logs, ctx)] : []));
}

const RELATIVE = new Intl.RelativeTimeFormat("pt-BR", { numeric: "auto" });
function relative(date: Date, now: Date): string {
  const diff = date.getTime() - now.getTime();
  const hours = diff / 3_600_000;
  if (Math.abs(hours) < 1) return RELATIVE.format(Math.round(diff / 60_000), "minute");
  if (Math.abs(hours) < 24) return RELATIVE.format(Math.round(hours), "hour");
  return RELATIVE.format(Math.round(hours / 24), "day");
}

async function jobsModule({ locale, now }: Ctx): Promise<HomeModule> {
  const jobs = await getJobStats();
  const href = `/${locale}/admin/jobs`;
  const fresh = jobs.byStatus.new;
  return {
    id: "jobs",
    title: "Vagas",
    href,
    icon: "briefcase",
    stats: [
      { label: "Novas", value: String(fresh) },
      { label: "Favoritas", value: String(jobs.starred) },
      { label: "Contatadas", value: String(jobs.byStatus.contacted) },
    ],
    alerts:
      fresh > 0
        ? [
            {
              id: "jobs:new",
              tone: "info",
              source: "Vagas",
              title: `${plural(fresh, "vaga nova", "vagas novas")} para revisar`,
              detail: jobs.lastScrapedAt ? `busca ${relative(jobs.lastScrapedAt, now)}` : undefined,
              href,
            },
          ]
        : [],
  };
}

async function emailModule({ locale, now }: Ctx): Promise<HomeModule> {
  const email = await getEmailStats();
  return {
    id: "email",
    title: "Email",
    href: `/${locale}/admin/email/sent`,
    icon: "inbox",
    alerts: [],
    note: email.available ? undefined : (email.error ?? "Stats indisponíveis."),
    stats: [
      { label: "7 dias", value: email.available ? String(email.last7Days) : "—" },
      {
        label: "Entregues",
        value: email.deliveryRate === null ? "—" : `${Math.round(email.deliveryRate * 100)}%`,
      },
      { label: "Último", value: email.lastSentAt ? relative(email.lastSentAt, now) : "—" },
    ],
  };
}

const TONE_ORDER: Record<AlertTone, number> = { danger: 0, warn: 1, info: 2 };

/** Todos os módulos; um módulo que falhar não derruba a home. */
export async function getHomeData(ctx: Ctx): Promise<{ modules: HomeModule[]; alerts: HomeAlert[] }> {
  const results = await Promise.allSettled([petModules(ctx), jobsModule(ctx).then((m) => [m]), emailModule(ctx).then((m) => [m])]);
  const modules = results.flatMap((r) => (r.status === "fulfilled" ? r.value : []));
  const alerts = modules.flatMap((m) => m.alerts).sort((a, b) => TONE_ORDER[a.tone] - TONE_ORDER[b.tone]);
  return { modules, alerts };
}
