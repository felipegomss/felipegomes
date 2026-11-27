import { corsJson, corsPreflight } from "@/lib/cors";
import { MCP_SCOPE, requestOrigin } from "@/lib/oauth";

/** RFC 8414: endpoints do servidor de autorização. */
export function GET(request: Request) {
  const origin = requestOrigin(request);
  return corsJson({
    issuer: origin,
    authorization_endpoint: `${origin}/api/oauth/authorize`,
    token_endpoint: `${origin}/api/oauth/token`,
    registration_endpoint: `${origin}/api/oauth/register`,
    response_types_supported: ["code"],
    grant_types_supported: ["authorization_code", "refresh_token"],
    code_challenge_methods_supported: ["S256"],
    token_endpoint_auth_methods_supported: ["none"],
    scopes_supported: [MCP_SCOPE],
  });
}

export const OPTIONS = corsPreflight;
