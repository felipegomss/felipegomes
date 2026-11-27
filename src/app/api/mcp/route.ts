import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";
import { CORS_HEADERS, corsPreflight } from "@/lib/cors";
import { createMcpServer } from "@/lib/mcp/server";
import { MCP_SCOPE, requestOrigin, verifyAccessToken } from "@/lib/oauth";

// A busca de vagas pode levar ~1 min.
export const maxDuration = 60;

function withCors(res: Response): Response {
  const headers = new Headers(res.headers);
  for (const [k, v] of Object.entries(CORS_HEADERS)) headers.set(k, v);
  return new Response(res.body, { status: res.status, statusText: res.statusText, headers });
}

/** 401 com o ponteiro de descoberta (RFC 9728) para o agente iniciar o OAuth. */
function unauthorized(request: Request) {
  const metadata = `${requestOrigin(request)}/.well-known/oauth-protected-resource/api/mcp`;
  return withCors(
    Response.json(
      { error: "invalid_token", error_description: "Autorize o agente no app." },
      { status: 401, headers: { "WWW-Authenticate": `Bearer resource_metadata="${metadata}", scope="${MCP_SCOPE}"` } },
    ),
  );
}

async function handle(request: Request) {
  const token = request.headers.get("authorization")?.match(/^Bearer\s+(.+)$/i)?.[1];
  const grant = await verifyAccessToken(token);
  if (!grant) return unauthorized(request);

  // Sem estado: um servidor e um transporte por requisição (serverless).
  const server = createMcpServer();
  const transport = new WebStandardStreamableHTTPServerTransport({ sessionIdGenerator: undefined, enableJsonResponse: true });
  await server.connect(transport);
  try {
    const response = await transport.handleRequest(request, {
      authInfo: { token: token!, clientId: grant.clientId, scopes: [MCP_SCOPE], expiresAt: grant.expiresAt, extra: { grantId: grant.grantId } },
    });
    return withCors(response);
  } finally {
    await server.close().catch(() => {});
  }
}

export const POST = handle;
export const GET = handle;
export const DELETE = handle;
export const OPTIONS = corsPreflight;
