// CORS aberto para os endpoints públicos de OAuth/MCP (clientes de agente
// podem chamar do navegador). Não envolve cookies.
export const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Authorization, Content-Type, Mcp-Session-Id, Mcp-Protocol-Version, Last-Event-ID",
  "Access-Control-Expose-Headers": "Mcp-Session-Id, WWW-Authenticate",
};

export function corsJson(body: unknown, init: ResponseInit = {}) {
  return Response.json(body, { ...init, headers: { ...CORS_HEADERS, ...(init.headers ?? {}) } });
}

export function corsPreflight() {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}
