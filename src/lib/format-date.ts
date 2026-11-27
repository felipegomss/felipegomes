// Formatação de datas no fuso de São Paulo, igual no servidor e no navegador.
export const APP_TZ = "America/Sao_Paulo";

const dayFmt = new Intl.DateTimeFormat("pt-BR", { timeZone: APP_TZ, day: "2-digit", month: "short" });
const dayYearFmt = new Intl.DateTimeFormat("pt-BR", { timeZone: APP_TZ, day: "2-digit", month: "short", year: "numeric" });
const yearFmt = new Intl.DateTimeFormat("pt-BR", { timeZone: APP_TZ, year: "numeric" });

export const cleanDate = (s: string) => s.replace(/\./g, "").replace(/ de /g, " ");

/** "05 set" (ou "05 set 2025" fora do ano corrente). */
export function formatDay(d: Date | string, now = new Date()): string {
  const date = typeof d === "string" ? new Date(d) : d;
  const sameYear = yearFmt.format(date) === yearFmt.format(now);
  return cleanDate((sameYear ? dayFmt : dayYearFmt).format(date));
}

/** "sexta, 27 de novembro" */
export function formatLongDate(d: Date): string {
  return new Intl.DateTimeFormat("pt-BR", { timeZone: APP_TZ, weekday: "long", day: "numeric", month: "long" })
    .format(d)
    .replace("-feira", "");
}

/** Hora (0–23) no fuso de São Paulo. */
export function hourInTz(d: Date): number {
  return Number(new Intl.DateTimeFormat("en-US", { timeZone: APP_TZ, hour: "numeric", hourCycle: "h23" }).format(d));
}
