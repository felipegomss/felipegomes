// Ferramentas que um agente (Claude etc.) pode executar no app via MCP.
// Cada ferramenta chama as mesmas funções que as telas usam.
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { getSentEmail, listSentEmails, sendOutreach } from "@/lib/email/outreach";
import { getHomeData } from "@/lib/home/modules";
import { runScrape } from "@/lib/jobs/scrape";
import { getJob, listJobs, updateJob } from "@/lib/jobs/service";
import { createPetLog, deletePetLog, updatePetLog } from "@/lib/pets/actions";
import { PET_NAV } from "@/lib/pets/registry";
import { loadPetPage } from "@/lib/pets/repo";
import { computePetStats, sortLogsDesc } from "@/lib/pets/stats";
import { PET_LOG_LABELS, PET_LOG_TYPES } from "@/lib/pets/types";
import { dueLabel, groupOf, groupTasks, repeatLabel, todayKey, type TaskDTO } from "@/lib/tasks/model";
import { createTask, deleteTask, getTask, listDoneTasks, listOpenTasks, setTaskDone, updateTask } from "@/lib/tasks/service";

const LOCALE = "pt-BR";
const DEFAULT_PET = PET_NAV[0]?.slug ?? "jorgin";

const text = (value: unknown) => ({
  content: [{ type: "text" as const, text: typeof value === "string" ? value : JSON.stringify(value, null, 2) }],
});
const fail = (message: string) => ({ ...text(message), isError: true });

/** "2026-11-27" vira meio-dia de Brasília; ISO completo passa direto; vazio = agora. */
function parseWhen(v?: string): string | undefined {
  if (!v) return undefined;
  return /^\d{4}-\d{2}-\d{2}$/.test(v) ? `${v}T12:00:00-03:00` : v;
}

const RESULT_MAP = { comeu: "accepted", recusou: "refused", regurgitou: "regurgitated" } as const;
const STATE_MAP = { descongelado: "frozen", pre_abatido: "prekilled", vivo: "live" } as const;
const REPEAT_MAP = { nao: "none", diaria: "daily", semanal: "weekly", mensal: "monthly" } as const;
const WEEKDAY_MAP: Record<string, number> = { dom: 0, seg: 1, ter: 2, qua: 3, qui: 4, sex: 5, sab: 6 };

function compactTask(t: TaskDTO, today: string) {
  return {
    id: t.id,
    tarefa: t.title,
    lista: t.list,
    data: t.dueDate,
    hora: t.dueTime,
    prazo: dueLabel(t, today),
    repete: repeatLabel(t),
    notas: t.notes,
    concluida_em: t.completedAt,
    criada_por_agente: t.via === "agent",
  };
}

/** Campos de tarefa em português → formato do serviço. */
const taskFields = {
  titulo: z.string().optional().describe("Nome da tarefa"),
  data: z.string().optional().describe("AAAA-MM-DD; string vazia remove a data"),
  hora: z.string().optional().describe("HH:MM; string vazia remove a hora"),
  lista: z.string().optional().describe("Ex.: Pessoal, Trabalho, Casa (cria a lista se não existir)"),
  repetir: z.enum(["nao", "diaria", "semanal", "mensal"]).optional(),
  dias_semana: z.array(z.enum(["dom", "seg", "ter", "qua", "qui", "sex", "sab"])).optional().describe("Para repetir=semanal"),
  notas: z.string().optional(),
};
type TaskFieldInput = { [K in keyof typeof taskFields]?: z.infer<(typeof taskFields)[K]> };

function toTaskInput(f: TaskFieldInput) {
  return Object.fromEntries(
    Object.entries({
      title: f.titulo,
      dueDate: f.data === "" ? null : f.data,
      dueTime: f.hora === "" ? null : f.hora,
      list: f.lista,
      repeat: f.repetir ? REPEAT_MAP[f.repetir] : undefined,
      repeatDays: f.dias_semana?.map((d) => WEEKDAY_MAP[d]),
      notes: f.notas,
    }).filter(([, v]) => v !== undefined),
  );
}

const JOB_STATUS_MAP = { novas: "new", contatadas: "contacted", dispensadas: "dismissed" } as const;

/** Campos de registro de pet em português → formato interno de `data`. */
const petFields = {
  resultado: z.enum(["comeu", "recusou", "regurgitou"]).optional().describe("Alimentação: resultado da oferta"),
  presa: z.string().optional().describe("Alimentação: ex. camundongo, rato"),
  tamanho_presa: z.string().optional().describe("Alimentação: ex. hopper, adulto"),
  peso_presa_g: z.number().optional().describe("Alimentação: peso da presa em gramas"),
  estado_presa: z.enum(["descongelado", "pre_abatido", "vivo"]).optional(),
  peso_g: z.number().optional().describe("Pesagem: peso do animal em gramas"),
  comprimento_cm: z.number().optional().describe("Pesagem: comprimento em cm"),
  muda_completa: z.boolean().optional().describe("Muda: true = completa, false = parcial"),
  motivo: z.string().optional().describe("Veterinário: motivo da consulta"),
  custo_brl: z.number().optional().describe("Veterinário: custo em reais"),
  titulo: z.string().optional().describe("Nota: título curto"),
};
type PetFieldInput = { [K in keyof typeof petFields]?: z.infer<(typeof petFields)[K]> };

function toData(f: PetFieldInput): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries({
      result: f.resultado ? RESULT_MAP[f.resultado] : undefined,
      prey: f.presa,
      preySize: f.tamanho_presa,
      preyWeightG: f.peso_presa_g,
      preyState: f.estado_presa ? STATE_MAP[f.estado_presa] : undefined,
      grams: f.peso_g,
      lengthCm: f.comprimento_cm,
      complete: f.muda_completa,
      reason: f.motivo,
      costBRL: f.custo_brl,
      title: f.titulo,
    }).filter(([, v]) => v !== undefined),
  );
}

const petSlug = z
  .string()
  .optional()
  .describe(`Pet (slug). Padrão: ${DEFAULT_PET}. Disponíveis: ${PET_NAV.map((p) => p.slug).join(", ")}`);

function compactJob(j: Awaited<ReturnType<typeof getJob>>) {
  if (!j) return null;
  return {
    id: j.id,
    titulo: j.title,
    empresa: j.company,
    local: j.location,
    fonte: j.source,
    status: j.status,
    favorita: j.starred,
    publicada_em: j.postedAt,
    url: j.url,
    palavras_chave: j.matchedKeywords,
    contatos: { emails: j.contactEmails, whatsapps: j.contactWhatsapps },
  };
}

export function createMcpServer() {
  const pets = PET_NAV.map((p) => `${p.name} (${p.kind}, slug "${p.slug}")`).join("; ");
  const instructions = [
    "App pessoal do Felipe (lfng.dev): cuidados com os pets, vagas de emprego e emails de contato.",
    `Pets do Felipe: ${pets}. Qualquer pergunta ou registro sobre eles (comeu, pesou, trocou de pele, TPA, veterinário, "como ele está?") usa estas ferramentas pet_* — mesmo que o MCP não seja citado.`,
    "Tarefas e lembretes do Felipe ('me lembra de…', 'anota pra fazer…', 'o que tenho pra fazer?', 'marca X como feita') usam tarefas_*.",
    "Perguntas sobre vagas usam vagas_*; 'o que tenho pra hoje?' usa resumo_do_dia.",
    "Datas no fuso de São Paulo. Para enviar email, mostre o rascunho completo e peça confirmação explícita antes de chamar email_enviar.",
  ].join("\n");
  const server = new McpServer({ name: "lfng", version: "1.0.0" }, { instructions });

  // ── Geral ─────────────────────────────────────────────────────────────────
  server.registerTool(
    "resumo_do_dia",
    {
      title: "Resumo do dia",
      description: "Pendências de todos os módulos (tarefas, pets, vagas, email) por urgência e os números principais. Use para 'o que tenho pra hoje?'.",
      annotations: { readOnlyHint: true },
    },
    async () => {
      const { modules, alerts } = await getHomeData({ locale: LOCALE, now: new Date() });
      return text({
        pendencias: alerts.map((a) => ({ urgencia: a.tone, origem: a.source, titulo: a.title, detalhe: a.detail })),
        modulos: modules.map((m) => ({ modulo: m.title, ...Object.fromEntries(m.stats.map((s) => [s.label, s.value])), obs: m.note })),
      });
    },
  );

  // ── Pets ──────────────────────────────────────────────────────────────────
  server.registerTool(
    "pet_status",
    {
      title: "Status do pet",
      description: `Como está o pet (${PET_NAV.map((p) => p.name).join(", ")}): dias sem comer, próxima alimentação, peso, muda, TPA.`,
      inputSchema: { pet: petSlug },
      annotations: { readOnlyHint: true },
    },
    async ({ pet }) => {
      const page = await loadPetPage(pet ?? DEFAULT_PET);
      if (!page) return fail("Pet não encontrado.");
      const s = computePetStats(page.pet, page.logs);
      return text({
        pet: page.pet,
        alimentacao: { dias_sem_comer: s.feeding.daysSince, proxima_em_dias: s.feeding.dueInDays, ultima: s.feeding.lastAccepted },
        peso: { atual_g: s.weight.last?.data.grams ?? null, anterior_g: s.weight.previous?.data.grams ?? null, dias_sem_pesar: s.weight.daysSince },
        muda: { dias_desde: s.shed.daysSince, media_intervalo_dias: s.shed.avgIntervalDays, estimativa_proxima: s.shed.nextEstimateAt },
        tpa: { dias_desde: s.water.daysSince, proxima_em_dias: s.water.dueInDays },
      });
    },
  );

  server.registerTool(
    "pet_registrar",
    {
      title: "Registrar cuidado do pet",
      description:
        "Registra alimentação, pesagem, muda, TPA (troca parcial de água), veterinário ou nota. Ex.: 'alimentei o Jorgin com rato de 30 g' → tipo=feeding, resultado=comeu, presa=rato, peso_presa_g=30.",
      inputSchema: {
        pet: petSlug,
        tipo: z.enum(PET_LOG_TYPES).describe(PET_LOG_TYPES.map((t) => `${t}=${PET_LOG_LABELS[t]}`).join(", ")),
        quando: z.string().optional().describe("ISO 8601 ou YYYY-MM-DD. Padrão: agora"),
        observacoes: z.string().optional(),
        ...petFields,
      },
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false },
    },
    async ({ pet, tipo, quando, observacoes, ...fields }) => {
      const data = toData(fields);
      if (tipo === "feeding" && !data.result) data.result = "accepted";
      const r = await createPetLog({
        slug: pet ?? DEFAULT_PET,
        type: tipo,
        occurredAt: parseWhen(quando),
        data,
        notes: observacoes,
        via: "agent",
      });
      if (!r.ok) return fail(`${r.error}${r.fields ? ` ${JSON.stringify(r.fields)}` : ""}`);
      return text({ registrado: r.value });
    },
  );

  server.registerTool(
    "pet_historico",
    {
      title: "Histórico do pet",
      description: "Registros do pet do mais recente ao mais antigo, com filtro opcional por tipo.",
      inputSchema: {
        pet: petSlug,
        tipo: z.enum(PET_LOG_TYPES).optional(),
        limite: z.number().int().min(1).max(200).optional().describe("Padrão: 20"),
      },
      annotations: { readOnlyHint: true },
    },
    async ({ pet, tipo, limite }) => {
      const page = await loadPetPage(pet ?? DEFAULT_PET);
      if (!page) return fail("Pet não encontrado.");
      const logs = sortLogsDesc(page.logs).filter((l) => !tipo || l.type === tipo);
      return text({ total: logs.length, registros: logs.slice(0, limite ?? 20) });
    },
  );

  server.registerTool(
    "pet_editar_registro",
    {
      title: "Editar registro do pet",
      description: "Corrige data, observações ou dados de um registro (use o id do histórico).",
      inputSchema: { pet: petSlug, id: z.string(), quando: z.string().optional(), observacoes: z.string().optional(), ...petFields },
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true },
    },
    async ({ pet, id, quando, observacoes, ...fields }) => {
      const data = toData(fields);
      const r = await updatePetLog({
        slug: pet ?? DEFAULT_PET,
        id,
        occurredAt: parseWhen(quando),
        notes: observacoes,
        data: Object.keys(data).length ? data : undefined,
      });
      return r.ok ? text({ atualizado: r.value }) : fail(r.error);
    },
  );

  server.registerTool(
    "pet_excluir_registro",
    {
      title: "Excluir registro do pet",
      description: "Exclui um registro do histórico. Não dá para desfazer: confirme com o usuário antes.",
      inputSchema: { pet: petSlug, id: z.string() },
      annotations: { readOnlyHint: false, destructiveHint: true, idempotentHint: true },
    },
    async ({ pet, id }) => {
      const r = await deletePetLog(pet ?? DEFAULT_PET, id);
      return r.ok ? text({ excluido: id }) : fail(r.error);
    },
  );

  // ── Tarefas ───────────────────────────────────────────────────────────────
  server.registerTool(
    "tarefas_listar",
    {
      title: "Listar tarefas",
      description: "Tarefas abertas agrupadas (atrasadas, hoje, próximos 7 dias, mais tarde, sem data) ou as concluídas nos últimos 30 dias.",
      inputSchema: {
        filtro: z.enum(["abertas", "hoje", "atrasadas", "semana", "concluidas"]).optional().describe("Padrão: abertas"),
        lista: z.string().optional().describe("Só uma lista, ex.: Trabalho"),
      },
      annotations: { readOnlyHint: true },
    },
    async ({ filtro, lista }) => {
      const today = todayKey();
      const byList = (t: TaskDTO) => !lista || t.list.toLowerCase() === lista.toLowerCase();
      if (filtro === "concluidas") {
        return text({ hoje: today, concluidas: (await listDoneTasks()).filter(byList).map((t) => compactTask(t, today)) });
      }
      let open = (await listOpenTasks()).filter(byList);
      if (filtro === "hoje") open = open.filter((t) => ["overdue", "today"].includes(groupOf(t, today)));
      if (filtro === "atrasadas") open = open.filter((t) => groupOf(t, today) === "overdue");
      if (filtro === "semana") open = open.filter((t) => ["overdue", "today", "week"].includes(groupOf(t, today)));
      return text({
        hoje: today,
        grupos: groupTasks(open, today).map((g) => ({ grupo: g.title, tarefas: g.tasks.map((t) => compactTask(t, today)) })),
      });
    },
  );

  server.registerTool(
    "tarefas_criar",
    {
      title: "Criar tarefa",
      description:
        "Cria uma tarefa/lembrete. Mais simples: passe `texto` em linguagem natural (ex.: 'pagar a fatura sexta 10h #casa', 'academia toda seg, qua e sex') — data, hora, repetição e #lista saem dele. Campos explícitos têm prioridade sobre o texto.",
      inputSchema: { texto: z.string().optional().describe("Frase em português com data/hora/#lista"), ...taskFields },
    },
    async ({ texto, ...f }) => {
      const input = toTaskInput(f);
      if (!texto && !input.title) return fail("Informe `texto` ou `titulo`.");
      const result = await createTask({ ...(texto ? { text: texto } : {}), ...input }, { via: "agent" });
      if (!result.ok) return fail(result.error);
      return text({ criada: compactTask(result.value, todayKey()) });
    },
  );

  server.registerTool(
    "tarefas_concluir",
    {
      title: "Concluir tarefa",
      description: "Marca como feita (ou reabre com desfazer=true). Se ela repete, a próxima ocorrência é criada e devolvida. Use o id de tarefas_listar.",
      inputSchema: { id: z.string(), desfazer: z.boolean().optional() },
    },
    async ({ id, desfazer }) => {
      const result = await setTaskDone(id, !desfazer);
      if (!result.ok) return fail(result.error);
      const today = todayKey();
      return text({ tarefa: compactTask(result.value.task, today), proxima: result.value.next ? compactTask(result.value.next, today) : null });
    },
  );

  server.registerTool(
    "tarefas_editar",
    {
      title: "Editar tarefa",
      description: "Muda nome, data, hora, lista, repetição ou notas de uma tarefa (use o id de tarefas_listar).",
      inputSchema: { id: z.string(), ...taskFields },
    },
    async ({ id, ...f }) => {
      const result = await updateTask(id, toTaskInput(f));
      if (!result.ok) return fail(result.error);
      return text({ tarefa: compactTask(result.value, todayKey()) });
    },
  );

  server.registerTool(
    "tarefas_excluir",
    {
      title: "Excluir tarefa",
      description: "Apaga uma tarefa. Não dá para desfazer: confirme com o usuário antes. Para tarefa feita, prefira tarefas_concluir.",
      inputSchema: { id: z.string() },
      annotations: { destructiveHint: true },
    },
    async ({ id }) => {
      const task = await getTask(id);
      const result = await deleteTask(id);
      if (!result.ok) return fail(result.error);
      return text({ excluida: task?.title ?? id });
    },
  );

  // ── Vagas ─────────────────────────────────────────────────────────────────
  server.registerTool(
    "vagas_listar",
    {
      title: "Listar vagas",
      description: "Vagas coletadas das fontes públicas, das mais recentes para as mais antigas. Ex.: 'tem vaga nova de React remota?' → status=novas, busca=react remoto.",
      inputSchema: {
        status: z.enum(["novas", "contatadas", "dispensadas", "todas"]).optional().describe("Padrão: novas"),
        busca: z.string().optional().describe("Texto no título, corpo ou empresa"),
        favoritas: z.boolean().optional(),
        limite: z.number().int().min(1).max(50).optional().describe("Padrão: 15"),
      },
      annotations: { readOnlyHint: true },
    },
    async ({ status, busca, favoritas, limite }) => {
      const st = status ?? "novas";
      const r = await listJobs({
        status: st === "todas" ? null : JOB_STATUS_MAP[st],
        q: busca,
        starredOnly: favoritas,
        limit: limite ?? 15,
      });
      return text({ total: r.total, vagas: r.data.map((j) => ({ ...compactJob(j), resumo: j.body.slice(0, 280) })) });
    },
  );

  server.registerTool(
    "vagas_detalhe",
    {
      title: "Detalhe da vaga",
      description: "Texto completo e contatos de uma vaga.",
      inputSchema: { id: z.string() },
      annotations: { readOnlyHint: true },
    },
    async ({ id }) => {
      const job = await getJob(id).catch(() => null);
      return job ? text({ ...compactJob(job), texto: job.body }) : fail("Vaga não encontrada.");
    },
  );

  server.registerTool(
    "vagas_atualizar",
    {
      title: "Atualizar vaga",
      description: "Marca a vaga como contatada/dispensada/nova e/ou favorita.",
      inputSchema: {
        id: z.string(),
        status: z.enum(["novas", "contatadas", "dispensadas"]).optional(),
        favorita: z.boolean().optional(),
      },
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true },
    },
    async ({ id, status, favorita }) => {
      const r = await updateJob(id, { status: status ? JOB_STATUS_MAP[status] : undefined, starred: favorita });
      return r.ok ? text({ atualizada: compactJob(r.value) }) : fail(r.error);
    },
  );

  server.registerTool(
    "vagas_buscar_agora",
    {
      title: "Buscar vagas agora",
      description: "Roda a coleta nas fontes públicas agora (normalmente roda todo dia às 20h). Demora até ~1 min.",
      annotations: { readOnlyHint: false, destructiveHint: false, openWorldHint: true },
    },
    async () => text(await runScrape()),
  );

  // ── Email ─────────────────────────────────────────────────────────────────
  server.registerTool(
    "email_enviar",
    {
      title: "Enviar email",
      description:
        "Envia um email de ola@lfng.dev (pt-BR) ou hi@lfng.dev (en), opcionalmente com o CV anexado. ANTES de chamar, mostre destinatário, assunto e corpo completos ao usuário e só envie com confirmação explícita.",
      inputSchema: {
        para: z.array(z.string()).min(1).describe("Endereços de destino"),
        assunto: z.string(),
        corpo: z.string().describe("Texto do email (markdown simples)"),
        idioma: z.enum(["pt-BR", "en"]).optional().describe("Padrão: pt-BR"),
        anexar_cv: z.boolean().optional(),
      },
      annotations: { readOnlyHint: false, destructiveHint: true, idempotentHint: false, openWorldHint: true },
    },
    async ({ para, assunto, corpo, idioma, anexar_cv }) => {
      const r = await sendOutreach({ to: para, subject: assunto, body: corpo, locale: idioma ?? "pt-BR", attachCv: anexar_cv });
      return r.ok ? text({ enviado: true, id: r.id }) : fail(r.error);
    },
  );

  server.registerTool(
    "email_enviados",
    {
      title: "Emails enviados",
      description: "Últimos emails enviados, com status de entrega.",
      inputSchema: { limite: z.number().int().min(1).max(100).optional().describe("Padrão: 20") },
      annotations: { readOnlyHint: true, openWorldHint: true },
    },
    async ({ limite }) => {
      const r = await listSentEmails(limite ?? 20);
      return r.ok ? text(r.data) : fail(r.error);
    },
  );

  server.registerTool(
    "email_status",
    {
      title: "Status de um email",
      description: "Detalhes e último evento (entregue, aberto, devolvido…) de um email enviado.",
      inputSchema: { id: z.string() },
      annotations: { readOnlyHint: true, openWorldHint: true },
    },
    async ({ id }) => {
      const r = await getSentEmail(id);
      return r.ok ? text(r.data) : fail(r.error);
    },
  );

  return server;
}

