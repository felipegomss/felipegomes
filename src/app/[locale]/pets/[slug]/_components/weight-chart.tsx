"use client";

import { fmtNum, formatDay } from "./shared";

const GAP_DAYS = 120; // acima disso a linha é interrompida e o trecho vira "sem registros"
const DAY = 86_400_000;
const W = 1000;
const H = 160;
const TOP = 10;
const BOTTOM = 150;

const monthFmt = new Intl.DateTimeFormat("pt-BR", { timeZone: "America/Sao_Paulo", month: "short", year: "2-digit" });

export function WeightChart({ series, now = new Date() }: { series: { at: string; grams: number }[]; now?: Date }) {
  if (series.length === 0) {
    return (
      <p className="border border-dashed p-4 text-muted-foreground">
        Nenhuma pesagem ainda. A primeira aparece aqui como ponto de partida do gráfico.
      </p>
    );
  }

  const t0 = new Date(series[0].at).getTime();
  const t1 = Math.max(now.getTime(), t0 + DAY);
  const maxG = Math.max(...series.map((p) => p.grams));
  const yMax = Math.max(100, Math.ceil((maxG * 1.1) / 100) * 100);
  const x = (t: number) => ((t - t0) / (t1 - t0)) * W;
  const y = (g: number) => BOTTOM - (g / yMax) * (BOTTOM - TOP);

  // Segmentos contínuos e os vazios entre eles.
  const segments: { at: number; grams: number }[][] = [[]];
  const gaps: { from: number; to: number; days: number }[] = [];
  series.forEach((p, i) => {
    const t = new Date(p.at).getTime();
    if (i > 0) {
      const prev = new Date(series[i - 1].at).getTime();
      const days = (t - prev) / DAY;
      if (days > GAP_DAYS) {
        gaps.push({ from: prev, to: t, days });
        segments.push([]);
      }
    }
    segments[segments.length - 1].push({ at: t, grams: p.grams });
  });

  const ticks = Array.from({ length: 5 }, (_, i) => t0 + ((t1 - t0) * i) / 5);
  const gridValues = [0, yMax / 3, (yMax * 2) / 3, yMax].map((v) => Math.round(v));
  const first = series[0];
  const last = series[series.length - 1];
  const summary =
    `Peso de ${fmtNum(first.grams)} g em ${formatDay(first.at)} a ${fmtNum(last.grams)} g em ${formatDay(last.at)}` +
    (gaps.length
      ? `, com ${gaps.length === 1 ? "um intervalo" : `${gaps.length} intervalos`} sem registros de ${gaps
          .map((g) => `${Math.round(g.days / 30)} meses`)
          .join(", ")}`
      : "");

  return (
    <figure className="m-0 flex flex-col gap-2">
      <div className="relative border py-4 pr-4 pl-12">
        <div
          aria-hidden="true"
          className="absolute top-4 bottom-10 left-3 flex flex-col justify-between text-[11px] text-muted-foreground"
        >
          {[...gridValues].reverse().map((v, i) => (
            <span key={v}>{i === gridValues.length - 1 ? `${v} g` : v}</span>
          ))}
        </div>
        <svg
          viewBox={`0 0 ${W} ${H}`}
          preserveAspectRatio="none"
          className="block h-40 w-full overflow-visible"
          role="img"
          aria-label={summary}
        >
          {gridValues.map((v) => (
            <line key={v} x1="0" x2={W} y1={y(v)} y2={y(v)} className="stroke-border" vectorEffect="non-scaling-stroke" />
          ))}
          {gaps.map((g) => (
            <rect
              key={g.from}
              x={x(g.from)}
              y={TOP}
              width={x(g.to) - x(g.from)}
              height={BOTTOM - TOP}
              className="fill-muted opacity-60"
            />
          ))}
          {segments.map((seg, i) =>
            seg.length === 1 ? (
              <line
                key={i}
                x1={x(seg[0].at) - 4}
                x2={x(seg[0].at) + 4}
                y1={y(seg[0].grams)}
                y2={y(seg[0].grams)}
                className="stroke-emerald-700 dark:stroke-emerald-400"
                strokeWidth={3}
                vectorEffect="non-scaling-stroke"
              />
            ) : (
              <polyline
                key={i}
                points={seg.map((p) => `${x(p.at)},${y(p.grams)}`).join(" ")}
                fill="none"
                className="stroke-emerald-700 dark:stroke-emerald-400"
                strokeWidth={2}
                vectorEffect="non-scaling-stroke"
              />
            ),
          )}
          <line
            x1={x(now.getTime())}
            x2={x(now.getTime())}
            y1={TOP}
            y2={BOTTOM}
            className="stroke-muted-foreground"
            strokeDasharray="3 3"
            vectorEffect="non-scaling-stroke"
          />
        </svg>
        {gaps.map((g) => (
          <span
            key={g.from}
            aria-hidden="true"
            className="absolute top-[72px] -translate-x-1/2 whitespace-nowrap text-[11px] text-muted-foreground"
            style={{ left: `calc(3rem + (100% - 4rem) * ${(x(g.from) + x(g.to)) / 2 / W})` }}
          >
            sem registros · {Math.round(g.days / 30)} meses
          </span>
        ))}
        <div aria-hidden="true" className="relative mt-2 h-4 text-[11px] text-muted-foreground">
          {ticks.map((t, i) => (
            <span key={t} className={i % 2 === 1 || i === 4 ? "absolute max-sm:hidden" : "absolute"} style={{ left: `${(i / 5) * 100}%` }}>
              {monthFmt.format(new Date(t)).replace(/\./g, "").replace(" de ", " ")}
            </span>
          ))}
          <span className="absolute right-0">hoje</span>
        </div>
      </div>
      <details className="text-xs">
        <summary className="inline-flex min-h-11 cursor-pointer items-center text-muted-foreground hover:text-foreground">
          Ver como tabela
        </summary>
        <table className="mt-1 w-full max-w-sm border-collapse">
          <thead>
            <tr className="text-left text-[11px] text-muted-foreground">
              <th scope="col" className="border-b py-1.5 font-medium">
                Data
              </th>
              <th scope="col" className="border-b py-1.5 text-right font-medium">
                Peso
              </th>
            </tr>
          </thead>
          <tbody>
            {[...series].reverse().map((p) => (
              <tr key={p.at}>
                <td className="border-b py-1.5">{formatDay(p.at)}</td>
                <td className="border-b py-1.5 text-right">{fmtNum(p.grams)} g</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </figure>
  );
}
