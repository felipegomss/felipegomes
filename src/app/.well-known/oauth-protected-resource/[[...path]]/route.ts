import { corsJson, corsPreflight } from "@/lib/cors";
import { MCP_SCOPE, requestOrigin } from "@/lib/oauth";

/** RFC 9728: diz ao agente qual servidor de autorização protege o MCP. */
export function GET(request: Request) {
  const origin = requestOrigin(request);
  return corsJson({
    resource: `${origin}/api/mcp`,
    authorization_servers: [origin],
    scopes_supported: [MCP_SCOPE],
    bearer_methods_supported: ["header"],
    resource_name: "LFNG",
  });
}

export const OPTIONS = corsPreflight;
