import { corsJson, corsPreflight } from "@/lib/cors";
import { exchangeCode, refreshTokens } from "@/lib/oauth";

export async function POST(request: Request) {
  const type = request.headers.get("content-type") ?? "";
  const params = type.includes("application/json")
    ? new URLSearchParams(Object.entries((await request.json().catch(() => ({}))) as Record<string, string>))
    : new URLSearchParams(await request.text());

  const grantType = params.get("grant_type");
  const result =
    grantType === "authorization_code"
      ? await exchangeCode(params)
      : grantType === "refresh_token"
        ? await refreshTokens(params)
        : { error: "unsupported_grant_type" };

  if ("error" in result) return corsJson(result, { status: 400, headers: { "Cache-Control": "no-store" } });
  return corsJson(result, { headers: { "Cache-Control": "no-store" } });
}

export const OPTIONS = corsPreflight;
