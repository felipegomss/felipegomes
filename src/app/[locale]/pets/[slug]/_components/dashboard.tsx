"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { BotIcon, ChevronRightIcon, PawPrintIcon, PlusIcon } from "lucide-react";
import { petPhoto } from "@/lib/pets/registry";
import { cn } from "@/lib/utils";
import { computePetStats, formatAge, sortLogsDesc } from "@/lib/pets/stats";
import {
  PET_LOG_LABELS,
  PET_LOG_TYPES,
  PET_SEX_LABELS,
  type PetDTO,
  type PetLogData,
  type PetLogDTO,
  type PetLogType,
} from "@/lib/pets/types";
import { LogDialog, type DialogTarget } from "./log-dialog";
import { WeightChart } from "./weight-chart";
import { WeightTable } from "./weight-table";
import {
  Badge,
  LOG_ICON_COLOR,
  LOG_ICONS,
  SECTION_TITLE,
  TypeIcon,
  fmtNum,
  formatDay,
  formatIsoDate,
  formatWhen,
  plural,
  summarizeLog,
  lowerLabel,
} from "./shared";

type Props = { locale: string; pet: PetDTO; logs: PetLogDTO[]; nowIso: string };

export function PetDashboard({ locale, pet, logs, nowIso }: Props) {
  const now = useMemo(() => new Date(nowIso), [nowIso]);
  const stats = useMemo(() => computePetStats(pet, logs, now), [pet, logs, now]);
  // Mesmo número de linhas da ficha ao lado (7 fixas + notas), para os cards terem a mesma altura.
  const profileRows = 7 + (pet.notes ? 1 : 0);
  const recent = useMemo(() => sortLogsDesc(logs).slice(0, profileRows), [logs, profileRows]);
  const weights = useMemo(
    () => sortLogsDesc(logs).filter((l): l is PetLogDTO<"weight"> => l.type === "weight"),
    [logs],
  );
  const [showTable, setShowTable] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [target, setTarget] = useState<DialogTarget>(null);
  const open = (type: PetLogType, editing?: PetLogDTO) => setTarget({ type, editing });
  const searchParams = useSearchParams();
  // ?registrar=feeding|weight|water… (botão "+" do celular) já abre o formulário.
  useEffect(() => {
    const url = new URL(window.location.href);
    const type = url.searchParams.get("registrar");
    if (type && (PET_LOG_TYPES as readonly string[]).includes(type)) {
      setTarget({ type: type as PetLogType });
      url.searchParams.delete("registrar");
      window.history.replaceState(null, "", url);
    }
  }, [searchParams]);

  const age = formatAge(pet.hatchDate, now);
  const photo = petPhoto(pet.slug);
  const subtitle = [
    pet.species,
    pet.morph,
    pet.sex ? PET_SEX_LABELS[pet.sex]?.toLowerCase() : null,
    age,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <div className="flex flex-col gap-6 text-xs md:gap-8">
      <section className="flex items-center gap-4">
        {photo ? (
          // eslint-disable-next-line @next/next/no-img-element -- arquivo estático já otimizado (256 px)
          <img src={photo} alt={`Ilustração do ${pet.name}`} width={56} height={56} className="size-14 shrink-0 border object-cover" />
        ) : (
          <div className="grid size-14 shrink-0 place-items-center border text-emerald-700 dark:text-emerald-400">
            <PawPrintIcon className="size-7" strokeWidth={1.5} aria-hidden="true" />
          </div>
        )}
        <div className="flex min-w-0 flex-col gap-1">
          <h1 className="font-heading text-2xl font-semibold tracking-tight">{pet.name}</h1>
          <p className="text-muted-foreground">{subtitle}</p>
        </div>
      </section>

      {/* No mobile "Registrar" vem antes do status (polegar); no desktop, depois. */}
      <section className="flex flex-col gap-3 md:order-2" aria-labelledby="sec-register">
        <h2 id="sec-register" className={cn(SECTION_TITLE, "max-md:sr-only")}>
          Registrar
        </h2>
        <div className="gap-2 max-md:-mx-4 max-md:flex max-md:overflow-x-auto max-md:px-4 md:grid md:grid-cols-[repeat(auto-fit,minmax(104px,1fr))]">
          {PET_LOG_TYPES.map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => open(type)}
              className="flex h-11 shrink-0 items-center justify-center gap-2 border px-3 text-xs transition-colors outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring/60 md:h-16 md:flex-col md:px-0"
            >
              <span aria-hidden="true" className={cn("[&>svg]:size-[18px]", LOG_ICON_COLOR[type])}>
                {LOG_ICONS[type]}
              </span>
              {PET_LOG_LABELS[type]}
            </button>
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-3 md:order-1" aria-labelledby="sec-status">
        <div className="flex items-baseline justify-between">
          <h2 id="sec-status" className={SECTION_TITLE}>
            Status
          </h2>
          <span className="text-[11px] text-muted-foreground">hoje · {formatDay(now, now)}</span>
        </div>
        <div className="grid grid-cols-2 gap-2 md:grid-cols-[repeat(auto-fit,minmax(220px,1fr))] md:gap-3">
          <FeedingCard stats={stats} pet={pet} now={now} onRegister={() => open("feeding")} />
          <WeightCard stats={stats} now={now} onRegister={() => open("weight")} />
          <ShedCard stats={stats} now={now} onRegister={() => open("shed")} />
          <WaterCard stats={stats} pet={pet} now={now} onRegister={() => open("water")} />
        </div>
      </section>

      <section className="flex flex-col gap-3 md:order-3" aria-labelledby="sec-weight">
        <div className="flex items-center justify-between">
          <h2 id="sec-weight" className={SECTION_TITLE}>
            Peso
          </h2>
          {weights.length > 0 && (
            <button
              type="button"
              aria-expanded={showTable}
              aria-controls="weight-table"
              onClick={() => setShowTable((v) => !v)}
              className="inline-flex min-h-11 items-center gap-1 text-[11px] text-muted-foreground outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/60"
            >
              {plural(weights.length, "pesagem", "pesagens")}
              <ChevronRightIcon
                aria-hidden="true"
                className={cn("size-3.5 transition-transform", showTable && "rotate-90 lg:rotate-180")}
              />
            </button>
          )}
        </div>
        {/* No desktop a tabela abre ao lado do gráfico, com a mesma altura; no mobile, embaixo. */}
        <div className={cn("grid gap-3", showTable && "lg:grid-cols-[minmax(0,1fr)_300px]")}>
          <WeightChart series={stats.weight.series} now={now} />
          {showTable && <WeightTable id="weight-table" weights={weights} onOpen={(w) => open("weight", w)} />}
        </div>
      </section>

      <section className="flex flex-wrap gap-6 md:order-4">
        <div className="flex min-w-0 flex-[2_1_520px] flex-col gap-3">
          <div className="flex items-center justify-between">
            <h2 className={SECTION_TITLE}>Histórico recente</h2>
            <Link
              href={`/${locale}/pets/${pet.slug}/historico`}
              className="inline-flex min-h-11 items-center text-xs text-muted-foreground hover:text-foreground"
            >
              Ver tudo →
            </Link>
          </div>
          {recent.length === 0 ? (
            <p className="border border-dashed p-4 text-muted-foreground">Nada registrado ainda.</p>
          ) : (
            <ul className="border">
              {recent.map((log, i) => (
                // No celular bastam os 4 últimos; o resto está em "Ver tudo".
                <li key={log.id} className={cn("border-b last:border-b-0", i === 3 && "max-md:border-b-0", i > 3 && "max-md:hidden")}>
                  <LogRow log={log} onOpen={() => open(log.type, log)} />
                </li>
              ))}
            </ul>
          )}
        </div>

        <aside className="flex min-w-0 flex-[1_1_280px] flex-col gap-3" aria-labelledby="sec-profile">
          {/* Mesma altura do cabeçalho "Histórico recente" (o link tem 44px) para os cards alinharem. */}
          <div className="flex min-h-11 items-center max-md:hidden">
            <h2 id="sec-profile" className={SECTION_TITLE}>
              Ficha
            </h2>
          </div>
          {/* No celular a ficha fica recolhida: quase nunca muda. */}
          <button
            type="button"
            aria-expanded={showProfile}
            aria-controls="profile-rows"
            onClick={() => setShowProfile((v) => !v)}
            className={cn(SECTION_TITLE, "flex min-h-11 items-center justify-between outline-none focus-visible:ring-2 focus-visible:ring-ring/60 md:hidden")}
          >
            Ficha
            <ChevronRightIcon aria-hidden="true" className={cn("size-4 text-muted-foreground transition-transform", showProfile && "rotate-90")} />
          </button>
          <dl id="profile-rows" className={cn("border px-3", !showProfile && "max-md:hidden")}>
            <Row label="Espécie" value={pet.species} />
            <Row label="Morph" value={pet.morph} />
            <Row label="Sexo" value={pet.sex ? PET_SEX_LABELS[pet.sex] : null} />
            <Row label="Nascimento" value={pet.hatchDate && `${formatIsoDate(pet.hatchDate)}${age ? ` · ${age}` : ""}`} />
            <Row label="Com você desde" value={pet.acquiredDate && formatIsoDate(pet.acquiredDate)} />
            <Row label="Alimentação" value={`a cada ${pet.feedIntervalDays} dias`} />
            <Row label="TPA" value={`a cada ${pet.waterIntervalDays} dias`} />
            {pet.notes && <Row label="Notas" value={pet.notes} />}
          </dl>
        </aside>
      </section>

      <LogDialog
        slug={pet.slug}
        target={target}
        onClose={() => setTarget(null)}
        lastFeeding={stats.feeding.recent.at(-1) ?? null}
      />
    </div>
  );
}

export function LogRow({ log, onOpen, showDateFirst }: { log: PetLogDTO; onOpen: () => void; showDateFirst?: boolean }) {
  const label = `Editar ${lowerLabel(PET_LOG_LABELS[log.type])} de ${formatWhen(log)}${log.data.via === "agent" ? " (registrado por um agente)" : ""}`;
  return (
    <button
      type="button"
      onClick={onOpen}
      aria-label={label}
      className={cn(
        "grid min-h-12 w-full items-center gap-3 px-3 py-2 text-left outline-none transition-colors hover:bg-muted/60 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring/60",
        showDateFirst
          ? "grid-cols-[24px_minmax(0,1fr)_16px] sm:grid-cols-[128px_24px_130px_minmax(0,1fr)_16px]"
          : "grid-cols-[24px_minmax(0,1fr)_16px] sm:grid-cols-[24px_110px_minmax(0,1fr)_112px_16px]",
      )}
    >
      {showDateFirst && <span className="hidden text-muted-foreground sm:block">{formatWhen(log)}</span>}
      <TypeIcon type={log.type} size="sm" />
      {/* No mobile tipo + data + resumo empilham; no desktop viram colunas. */}
      <span className="flex min-w-0 flex-col gap-0.5 sm:contents">
        <span className="font-medium">
          {PET_LOG_LABELS[log.type]}
          <span className="font-normal text-muted-foreground sm:hidden"> · {formatWhen(log)}</span>
        </span>
        <span className="truncate text-muted-foreground">
          {log.data.via === "agent" && (
            <span className="mr-1.5 inline-flex items-center gap-1 border px-1.5 py-px text-[11px]" title="Registrado por um agente (MCP)">
              <BotIcon className="size-3" aria-hidden="true" />
              agente
            </span>
          )}
          {log.type === "feeding" && <FeedingResultBadge log={log as PetLogDTO<"feeding">} />}
          {log.type === "feeding" ? summarizeLog(log).replace(/^[^·]+(· )?/, "") : summarizeLog(log)}
        </span>
      </span>
      {!showDateFirst && <span className="hidden text-right text-muted-foreground sm:block">{formatWhen(log)}</span>}
      <ChevronRightIcon className="size-4 text-muted-foreground" aria-hidden="true" />
    </button>
  );
}

function FeedingResultBadge({ log }: { log: PetLogDTO<"feeding"> }) {
  const r = log.data.result;
  return (
    <span className="mr-1.5">
      <Badge tone={r === "accepted" ? "ok" : "danger"}>
        {r === "accepted" ? "Comeu" : r === "refused" ? "Recusou" : "Regurgitou"}
      </Badge>
    </span>
  );
}

function Row({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    // 49px = linha do histórico ao lado (48px + borda), para as divisórias coincidirem.
    <div className="flex min-h-[49px] items-center justify-between gap-3 border-b py-2 last:min-h-12 last:border-b-0">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="text-right">{value || "—"}</dd>
    </div>
  );
}

// ── Cards ───────────────────────────────────────────────────────────────────

type Stats = ReturnType<typeof computePetStats>;

function Card({
  title,
  type,
  empty,
  children,
}: {
  title: string;
  type: PetLogType;
  empty?: boolean;
  children: React.ReactNode;
}) {
  return (
    <article className={cn("flex flex-col gap-2 border p-3 md:gap-3 md:p-4", empty && "border-dashed")}>
      <div className="flex items-center justify-between">
        <h3 className="text-[11px] font-normal uppercase tracking-widest text-muted-foreground">{title}</h3>
        <span aria-hidden="true" className={cn("[&>svg]:size-4", LOG_ICON_COLOR[type])}>
          {LOG_ICONS[type]}
        </span>
      </div>
      {children}
    </article>
  );
}

function BigNumber({ value, unit, aside }: { value: string; unit: string; aside?: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-baseline gap-x-1.5">
      <span className="font-heading text-3xl font-semibold tracking-tighter">{value}</span>
      <span className="text-muted-foreground max-md:leading-tight">{unit}</span>
      {aside && <span className="ml-auto text-[11px] font-medium">{aside}</span>}
    </div>
  );
}

function EmptyCard({ title, type, text, onRegister }: { title: string; type: PetLogType; text: string; onRegister: () => void }) {
  return (
    <Card title={title} type={type} empty>
      <p className="font-medium">Nenhum registro ainda</p>
      <p className="leading-relaxed text-muted-foreground max-md:hidden">{text}</p>
      <button
        type="button"
        onClick={onRegister}
        className="inline-flex h-8 w-fit items-center gap-1.5 border px-2.5 outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring/60"
      >
        <PlusIcon className="size-3.5" aria-hidden="true" />
        Registrar<span className="max-md:sr-only"> {lowerLabel(PET_LOG_LABELS[type])}</span>
      </button>
    </Card>
  );
}

function DueBadge({ dueInDays, nextAt, now }: { dueInDays: number; nextAt: Date; now: Date }) {
  if (dueInDays < 0) return <Badge tone="danger">atrasada {plural(-dueInDays, "dia", "dias")}</Badge>;
  if (dueInDays === 0) return <Badge tone="warn">é hoje</Badge>;
  return (
    <Badge tone="neutral">
      próxima em {plural(dueInDays, "dia", "dias")}
      <span className="max-md:hidden">&nbsp;· {formatDay(nextAt, now)}</span>
    </Badge>
  );
}

function FeedingCard({ stats, pet, now, onRegister }: { stats: Stats; pet: PetDTO; now: Date; onRegister: () => void }) {
  const f = stats.feeding;
  if (!f.lastAccepted || f.daysSince === null || f.dueInDays === null || !f.nextAt) {
    return (
      <EmptyCard
        title="Alimentação"
        type="feeding"
        text={`Registre a próxima refeição e o painel avisa a cada ${pet.feedIntervalDays} dias.`}
        onRegister={onRegister}
      />
    );
  }
  const d = f.lastAccepted.data as PetLogData["feeding"];
  const refusedCount = f.recent.filter((r) => r.data.result !== "accepted").length;
  return (
    <Card title="Alimentação" type="feeding">
      <BigNumber value={String(f.daysSince)} unit={f.daysSince === 1 ? "dia sem comer" : "dias sem comer"} />
      <p className="leading-relaxed text-muted-foreground max-md:hidden">
        Última: {formatDay(f.lastAccepted.occurredAt, now)}
        {d.prey ? ` · ${d.prey}` : ""}
        {d.preyWeightG !== undefined ? ` · ${fmtNum(d.preyWeightG)} g` : ""} · a cada {pet.feedIntervalDays} dias
      </p>
      <DueBadge dueInDays={f.dueInDays} nextAt={f.nextAt} now={now} />
      {f.recent.length > 0 && (
        <div className="flex flex-col gap-1.5 max-md:hidden">
          <span className="text-[11px] text-muted-foreground">Últimas {f.recent.length} ofertas</span>
          <div
            className="flex gap-1"
            role="img"
            aria-label={`Últimas ${f.recent.length} ofertas: ${f.recent.length - refusedCount} aceitas, ${refusedCount} recusadas. ${f.recent
              .map((r) => `${formatDay(r.occurredAt, now)} ${r.data.result === "accepted" ? "comeu" : "recusou"}`)
              .join(", ")}`}
          >
            {f.recent.map((r) => (
              <span
                key={r.id}
                title={`${formatDay(r.occurredAt, now)} · ${r.data.result === "accepted" ? "comeu" : "recusou"}`}
                className={cn(
                  "size-4",
                  r.data.result === "accepted"
                    ? "bg-emerald-700 dark:bg-emerald-400"
                    : "border-[1.5px] border-red-700 dark:border-red-400",
                )}
              />
            ))}
          </div>
          <div aria-hidden="true" className="flex gap-3 text-[11px] text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <span className="size-2 bg-emerald-700 dark:bg-emerald-400" />
              comeu
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="size-2 border-[1.5px] border-red-700 dark:border-red-400" />
              recusou
            </span>
          </div>
        </div>
      )}
    </Card>
  );
}

function WeightCard({ stats, now, onRegister }: { stats: Stats; now: Date; onRegister: () => void }) {
  const w = stats.weight;
  if (!w.last || w.daysSince === null) {
    return <EmptyCard title="Peso" type="weight" text="Registre a primeira pesagem para acompanhar o crescimento." onRegister={onRegister} />;
  }
  const grams = w.last.data.grams;
  const delta = w.previous ? grams - w.previous.data.grams : null;
  return (
    <Card title="Peso" type="weight">
      <BigNumber
        value={fmtNum(grams)}
        unit="g"
        aside={
          delta !== null && (
            <span className={delta > 0 ? "text-emerald-800 dark:text-emerald-400" : "text-muted-foreground"}>
              {delta > 0 ? "+" : delta < 0 ? "−" : "±"}
              {fmtNum(Math.abs(delta))} g
            </span>
          )
        }
      />
      <p className="leading-relaxed text-muted-foreground max-md:hidden">
        Pesado em {formatDay(w.last.occurredAt, now)}
        {w.previous && ` · anterior ${fmtNum(w.previous.data.grams)} g em ${formatDay(w.previous.occurredAt, now)}`}
      </p>
      <Badge tone="neutral">{w.daysSince === 0 ? "pesado hoje" : `${plural(w.daysSince, "dia", "dias")} sem pesar`}</Badge>
    </Card>
  );
}

function ShedCard({ stats, now, onRegister }: { stats: Stats; now: Date; onRegister: () => void }) {
  const s = stats.shed;
  if (!s.last || s.daysSince === null) {
    return <EmptyCard title="Muda" type="shed" text="Registre a próxima troca de pele para estimar o intervalo." onRegister={onRegister} />;
  }
  const passed = s.nextEstimateAt && s.nextEstimateAt.getTime() < now.getTime();
  return (
    <Card title="Muda" type="shed">
      <BigNumber value={String(s.daysSince)} unit={s.daysSince === 1 ? "dia desde a última" : "dias desde a última"} />
      <p className="leading-relaxed text-muted-foreground max-md:hidden">
        Última: {formatDay(s.last.occurredAt, now)} · {s.last.data.complete ? "completa" : "parcial"}
        {s.avgIntervalDays ? ` · média de ${s.avgIntervalDays} dias entre mudas` : ""}
      </p>
      {s.nextEstimateAt && (
        <Badge tone={passed ? "warn" : "neutral"}>
          {passed ? "esperada" : "próxima"}
          <span className="max-md:hidden">&nbsp;por volta de</span>
          <span className="md:hidden">&nbsp;~</span>&nbsp;{formatDay(s.nextEstimateAt, now)}
        </Badge>
      )}
    </Card>
  );
}

function WaterCard({ stats, pet, now, onRegister }: { stats: Stats; pet: PetDTO; now: Date; onRegister: () => void }) {
  const w = stats.water;
  if (!w.last || w.daysSince === null || w.dueInDays === null || !w.nextAt) {
    return (
      <EmptyCard
        title="TPA"
        type="water"
        text={`Registre a próxima troca parcial e o painel passa a avisar a cada ${pet.waterIntervalDays} dias.`}
        onRegister={onRegister}
      />
    );
  }
  return (
    <Card title="TPA" type="water">
      <BigNumber value={String(w.daysSince)} unit={w.daysSince === 1 ? "dia desde a última" : "dias desde a última"} />
      <p className="leading-relaxed text-muted-foreground max-md:hidden">
        Última: {formatDay(w.last.occurredAt, now)} · a cada {pet.waterIntervalDays} dias
      </p>
      <DueBadge dueInDays={w.dueInDays} nextAt={w.nextAt} now={now} />
    </Card>
  );
}
