// "Adicionar rápido": tira do texto a data, a hora, a repetição e a #lista.
// Ex.: "pagar a fatura sexta #casa" → { title: "Pagar a fatura", dueDate: sexta, list: "Casa" }
//      "academia toda seg, qua e sex 7h" → semanal seg/qua/sex às 07:00
//      "renovar CNH dia 10/12", "ligar pro dentista amanhã às 15h30"
import { addDays, addMonths, nextWeekday, todayKey, type TaskRepeat } from "./model";

export type ParsedTask = {
  title: string;
  list?: string;
  dueDate?: string;
  dueTime?: string;
  repeat?: TaskRepeat;
  repeatDays?: number[];
};

// Nomes curtos ambíguos ("ter", "qui", "qua") só valem por extenso.
const DAY_WORDS: [RegExp, number][] = [
  [/^dom(?:ingo)?$/, 0],
  [/^seg(?:unda)?(?:-feira)?$/, 1],
  [/^ter[çc]a(?:-feira)?$/, 2],
  [/^quarta(?:-feira)?$/, 3],
  [/^quinta(?:-feira)?$/, 4],
  [/^sex(?:ta)?(?:-feira)?$/, 5],
  [/^s[áa]b(?:ado)?$/, 6],
];
const DAY = "dom(?:ingo)?|seg(?:unda)?(?:-feira)?|ter[çc]a(?:-feira)?|quarta(?:-feira)?|quinta(?:-feira)?|sex(?:ta)?(?:-feira)?|s[áa]b(?:ado)?";

// Depois de "toda(s)" não há ambiguidade: aceita também ter/qua/qui.
const DAY_ANY = `${DAY}|ter|qua|qui`;
const SHORT: Record<string, number> = { ter: 2, qua: 3, qui: 4 };

const dayNumber = (word: string) => {
  const w = word.toLowerCase();
  return SHORT[w] ?? DAY_WORDS.find(([re]) => re.test(w))?.[1];
};

/** Limites de palavra que entendem acentos. */
const word = (body: string) => new RegExp(`(?<![\\p{L}\\d#])(?:${body})(?![\\p{L}\\d])`, "iu");

const pad = (n: number) => String(n).padStart(2, "0");

export function parseQuickAdd(input: string, now = new Date(), knownLists: string[] = []): ParsedTask {
  const today = todayKey(now);
  let text = ` ${input.trim()} `;
  const out: Omit<ParsedTask, "title"> = {};

  const take = (re: RegExp) => {
    const m = text.match(re);
    if (m) text = text.replace(m[0], " ");
    return m;
  };

  // #lista (respeita a grafia de uma lista que já existe)
  const list = take(/#([\p{L}\d_-]+)/u);
  if (list) {
    const name = list[1].replace(/[_-]/g, " ");
    out.list = knownLists.find((l) => l.toLowerCase() === name.toLowerCase()) ?? name.charAt(0).toUpperCase() + name.slice(1);
  }

  // Repetição
  let m: RegExpMatchArray | null;
  if ((m = take(word(`todo\\s+dia\\s+(\\d{1,2})`)))) {
    out.repeat = "monthly";
    text = `${text} dia ${m[1]} `; // a data sai na regra de "dia N" abaixo
  } else if (take(word("todos\\s+os\\s+dias|todo\\s+dia|diariamente"))) {
    out.repeat = "daily";
  } else if ((m = take(word(`tod[ao]s?\\s+(?:as\\s+|os\\s+)?((?:${DAY_ANY})(?:\\s*(?:,|e)\\s*(?:${DAY_ANY}))*)`)))) {
    out.repeat = "weekly";
    out.repeatDays = m[1]
      .split(/\s*(?:,|\se\s)\s*/i)
      .map((w) => dayNumber(w.trim()))
      .filter((d): d is number => d !== undefined);
  } else if (take(word("toda\\s+semana|semanalmente|semanal"))) {
    out.repeat = "weekly";
  } else if (take(word("todo\\s+m[eê]s|mensalmente|mensal"))) {
    out.repeat = "monthly";
  }

  // Hora: "15h", "15h30", "15:30", "às 9h"
  if ((m = take(word(`(?:[àa]s\\s+)?(\\d{1,2})(?:h(\\d{2})?|:(\\d{2}))h?`)))) {
    const h = Number(m[1]);
    const min = Number(m[2] ?? m[3] ?? 0);
    if (h < 24 && min < 60) out.dueTime = `${pad(h)}:${pad(min)}`;
  }

  // Data
  if (take(word("depois\\s+de\\s+amanh[ãa]"))) out.dueDate = addDays(today, 2);
  else if (take(word("amanh[ãa]"))) out.dueDate = addDays(today, 1);
  else if (take(word("hoje"))) out.dueDate = today;
  else if ((m = take(word(`(\\d{1,2})/(\\d{1,2})(?:/(\\d{2,4}))?`)))) {
    const [d, mo] = [Number(m[1]), Number(m[2])];
    let y = m[3] ? Number(m[3].length === 2 ? `20${m[3]}` : m[3]) : Number(today.slice(0, 4));
    let key = `${y}-${pad(mo)}-${pad(d)}`;
    if (!m[3] && key < today) key = `${++y}-${pad(mo)}-${pad(d)}`;
    if (d >= 1 && d <= 31 && mo >= 1 && mo <= 12) out.dueDate = key;
  } else if ((m = take(word(`(?:no\\s+)?dia\\s+(\\d{1,2})`)))) {
    const d = Number(m[1]);
    if (d >= 1 && d <= 31) {
      const thisMonth = `${today.slice(0, 8)}${pad(d)}`;
      out.dueDate = thisMonth >= today ? thisMonth : addMonths(thisMonth, 1);
    }
  } else if ((m = take(word(`(?:(?:na|no|nesta|neste|pr[óo]xim[ao])\\s+)?(${DAY})`)))) {
    const d = dayNumber(m[1]);
    // "sexta" numa sexta = a da semana que vem
    if (d !== undefined) out.dueDate = nextWeekday(today, [d], false);
  }

  // Repetição sem data: começa na próxima ocorrência (ou hoje)
  if (out.repeat && !out.dueDate) {
    out.dueDate = out.repeat === "weekly" && out.repeatDays?.length ? nextWeekday(today, out.repeatDays) : today;
  }
  if (out.repeat === "weekly" && !out.repeatDays?.length && out.dueDate) {
    out.repeatDays = [new Date(`${out.dueDate}T12:00:00Z`).getUTCDay()];
  }

  // Sobras: conectores soltos nas pontas, espaços, primeira letra maiúscula
  let title = text.replace(/\s+/g, " ").trim();
  const edge = /^(?:me\s+lembr[ae]r?\s+de|lembrar\s+de)\s+|\s+(?:na|no|em|[àa]s|at[ée]|dia|de|para|pra|,)$/i;
  while (edge.test(title)) title = title.replace(edge, "").trim();
  title = title.charAt(0).toUpperCase() + title.slice(1);

  return { title: title || input.trim(), ...out };
}
