// Chamada de IA com resposta em JSON validado, independente do provedor.
// - anthropic: SDK oficial, saída estruturada (output_config.format).
// - openai: qualquer API compatível com OpenAI (/chat/completions com
//   response_format json_schema) — OpenAI, OpenRouter, Groq, Gemini etc.
import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { z } from "zod";
import { getAiConfig, type AiConfig } from "@/lib/settings";

export class AiError extends Error {}

type JsonRequest<T extends z.ZodType> = {
  schema: T;
  system: string;
  user: string;
  /** Nome do formato (usado pelo provedor compatível com OpenAI). */
  name: string;
  maxTokens?: number;
};

async function anthropicJson<T extends z.ZodType>(cfg: AiConfig, req: JsonRequest<T>): Promise<z.infer<T>> {
  const client = new Anthropic({ apiKey: cfg.apiKey, timeout: 30_000, maxRetries: 1 });
  try {
    const response = await client.messages.parse({
      model: cfg.model,
      max_tokens: req.maxTokens ?? 2000,
      system: req.system,
      messages: [{ role: "user", content: req.user }],
      // Tarefa simples (classificar/resumir): pouco raciocínio basta.
      output_config: { format: zodOutputFormat(req.schema), effort: "low" },
    });
    if (response.stop_reason === "refusal") throw new AiError("A IA recusou este conteúdo.");
    if (response.parsed_output == null) throw new AiError("A IA não devolveu um JSON válido.");
    return response.parsed_output as z.infer<T>;
  } catch (e) {
    if (e instanceof AiError) throw e;
    if (e instanceof Anthropic.AuthenticationError) throw new AiError("Chave da Anthropic inválida.");
    if (e instanceof Anthropic.NotFoundError) throw new AiError(`Modelo não encontrado: ${cfg.model}.`);
    if (e instanceof Anthropic.RateLimitError) throw new AiError("Limite de uso da Anthropic atingido. Tente mais tarde.");
    if (e instanceof Anthropic.APIError) throw new AiError(`Anthropic: ${e.message}`);
    throw new AiError("Falha ao falar com a Anthropic.");
  }
}

async function openaiJson<T extends z.ZodType>(cfg: AiConfig, req: JsonRequest<T>): Promise<z.infer<T>> {
  const res = await fetch(`${cfg.baseUrl}/chat/completions`, {
    method: "POST",
    headers: { authorization: `Bearer ${cfg.apiKey}`, "content-type": "application/json" },
    body: JSON.stringify({
      model: cfg.model,
      max_tokens: req.maxTokens ?? 2000,
      messages: [
        { role: "system", content: req.system },
        { role: "user", content: req.user },
      ],
      response_format: { type: "json_schema", json_schema: { name: req.name, strict: true, schema: z.toJSONSchema(req.schema) } },
    }),
    signal: AbortSignal.timeout(30_000),
  }).catch(() => null);
  if (!res) throw new AiError("Falha ao falar com o provedor de IA.");
  const data = (await res.json().catch(() => null)) as { choices?: { message?: { content?: string } }[]; error?: { message?: string } } | null;
  if (!res.ok) throw new AiError(data?.error?.message ?? `Provedor de IA: HTTP ${res.status}`);
  const text = data?.choices?.[0]?.message?.content;
  const parsed = req.schema.safeParse(text ? JSON.parse(text) : null);
  if (!parsed.success) throw new AiError("A IA não devolveu um JSON válido.");
  return parsed.data;
}

/** null quando não há IA configurada. */
export async function aiJson<T extends z.ZodType>(req: JsonRequest<T>): Promise<z.infer<T> | null> {
  const cfg = await getAiConfig();
  if (!cfg) return null;
  return cfg.provider === "anthropic" ? anthropicJson(cfg, req) : openaiJson(cfg, req);
}

/** Chamada mínima para o botão "Testar" da tela de integrações. */
export async function testAi(): Promise<string> {
  const out = await aiJson({
    name: "ping",
    schema: z.object({ ok: z.boolean() }),
    system: "Responda apenas com o JSON pedido.",
    user: 'Responda {"ok": true}.',
    maxTokens: 200,
  });
  if (!out) throw new AiError("Nenhuma IA configurada.");
  return out.ok ? "Funcionando." : "Respondeu, mas de forma inesperada.";
}
