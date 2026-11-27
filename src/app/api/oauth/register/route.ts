import { corsJson, corsPreflight } from "@/lib/cors";
import { registerClient } from "@/lib/oauth";

/** RFC 7591: registro dinâmico de cliente (clientes públicos, com PKCE). */
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const result = await registerClient(body);
  if (!result.ok) return corsJson({ error: result.error }, { status: 400 });
  const { client } = result;
  return corsJson(
    {
      client_id: client.id,
      client_name: client.name,
      redirect_uris: client.redirectUris,
      grant_types: ["authorization_code", "refresh_token"],
      response_types: ["code"],
      token_endpoint_auth_method: "none",
      client_id_issued_at: Math.floor(Date.now() / 1000),
    },
    { status: 201 },
  );
}

export const OPTIONS = corsPreflight;
