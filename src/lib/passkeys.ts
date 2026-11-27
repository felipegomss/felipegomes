import { cookies } from "next/headers";
import { eq } from "drizzle-orm";
import {
  generateAuthenticationOptions,
  generateRegistrationOptions,
  verifyAuthenticationResponse,
  verifyRegistrationResponse,
  type AuthenticationResponseJSON,
  type AuthenticatorTransportFuture,
  type RegistrationResponseJSON,
} from "@simplewebauthn/server";
import { isoBase64URL } from "@simplewebauthn/server/helpers";
import { adminPasskeys, db } from "@/lib/db/client";
import { sign, unsign } from "@/lib/session";

const CHALLENGE_COOKIE = "webauthn_challenge";
const CHALLENGE_TTL = 5 * 60; // segundos
const RP_NAME = "LFNG";
// Usuário único: o mesmo handle em todo cadastro faz o aparelho substituir a
// passkey antiga em vez de acumular duplicadas.
const USER_ID = new TextEncoder().encode("lfng-admin");
const USER_NAME = "Luis Felipe";

/**
 * Domínio da passkey (rpID) e origem esperada, a partir da própria requisição.
 * "www." é removido para a mesma passkey valer em lfng.dev e www.lfng.dev.
 */
export function relyingParty(request: Request): { rpID: string; origin: string } {
  const url = new URL(request.url);
  const host = request.headers.get("x-forwarded-host") ?? url.host;
  const proto = request.headers.get("x-forwarded-proto") ?? url.protocol.replace(":", "");
  const hostname = host.split(":")[0];
  return {
    rpID: process.env.WEBAUTHN_RP_ID ?? hostname.replace(/^www\./, ""),
    origin: `${proto}://${host}`,
  };
}

type ChallengeKind = "register" | "login";

async function saveChallenge(kind: ChallengeKind, challenge: string) {
  const value = await sign(`${kind}.${challenge}.${Date.now() + CHALLENGE_TTL * 1000}`);
  if (!value) throw new Error("Sessão indisponível (ADMIN_PASSWORD/SESSION_SECRET ausente).");
  (await cookies()).set(CHALLENGE_COOKIE, value, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/api/auth/passkey",
    maxAge: CHALLENGE_TTL,
  });
}

/** Lê e consome o desafio (uso único). */
async function takeChallenge(kind: ChallengeKind): Promise<string | null> {
  const store = await cookies();
  const raw = await unsign(store.get(CHALLENGE_COOKIE)?.value);
  store.delete({ name: CHALLENGE_COOKIE, path: "/api/auth/passkey" });
  if (!raw) return null;
  const [k, challenge, exp] = raw.split(".");
  if (k !== kind || !challenge || Number(exp) < Date.now()) return null;
  return challenge;
}

export async function listPasskeys() {
  return db.select().from(adminPasskeys).orderBy(adminPasskeys.createdAt);
}

// ── Cadastro ────────────────────────────────────────────────────────────────

export async function registrationOptions(request: Request) {
  const { rpID } = relyingParty(request);
  const existing = await listPasskeys();
  const options = await generateRegistrationOptions({
    rpName: RP_NAME,
    rpID,
    userID: USER_ID,
    userName: USER_NAME,
    userDisplayName: USER_NAME,
    attestationType: "none",
    excludeCredentials: existing.map((p) => ({
      id: p.id,
      transports: (p.transports ?? undefined) as AuthenticatorTransportFuture[] | undefined,
    })),
    authenticatorSelection: { residentKey: "required", userVerification: "required" },
  });
  await saveChallenge("register", options.challenge);
  return options;
}

export async function verifyRegistration(request: Request, response: RegistrationResponseJSON, name: string) {
  const expectedChallenge = await takeChallenge("register");
  if (!expectedChallenge) return { ok: false as const, error: "Desafio expirado. Tente de novo." };

  const { rpID, origin } = relyingParty(request);
  const result = await verifyRegistrationResponse({
    response,
    expectedChallenge,
    expectedOrigin: origin,
    expectedRPID: rpID,
    requireUserVerification: true,
  });
  if (!result.verified || !result.registrationInfo) {
    return { ok: false as const, error: "Não foi possível validar a passkey." };
  }

  const { credential, credentialDeviceType, credentialBackedUp } = result.registrationInfo;
  await db
    .insert(adminPasskeys)
    .values({
      id: credential.id,
      publicKey: isoBase64URL.fromBuffer(credential.publicKey),
      counter: credential.counter,
      transports: credential.transports ?? null,
      deviceType: credentialDeviceType,
      backedUp: credentialBackedUp,
      name: name.trim().slice(0, 60) || "Passkey",
    })
    .onConflictDoNothing();
  return { ok: true as const };
}

// ── Login ───────────────────────────────────────────────────────────────────

export async function authenticationOptions(request: Request) {
  const { rpID } = relyingParty(request);
  // Sem allowCredentials: o aparelho oferece a passkey salva (descoberta).
  const options = await generateAuthenticationOptions({ rpID, userVerification: "required" });
  await saveChallenge("login", options.challenge);
  return options;
}

export async function verifyAuthentication(request: Request, response: AuthenticationResponseJSON) {
  const expectedChallenge = await takeChallenge("login");
  if (!expectedChallenge) return { ok: false as const, error: "Desafio expirado. Tente de novo." };

  const [passkey] = await db.select().from(adminPasskeys).where(eq(adminPasskeys.id, response.id)).limit(1);
  if (!passkey) return { ok: false as const, error: "Passkey não cadastrada neste site." };

  const { rpID, origin } = relyingParty(request);
  const result = await verifyAuthenticationResponse({
    response,
    expectedChallenge,
    expectedOrigin: origin,
    expectedRPID: rpID,
    requireUserVerification: true,
    credential: {
      id: passkey.id,
      publicKey: isoBase64URL.toBuffer(passkey.publicKey),
      counter: passkey.counter,
      transports: (passkey.transports ?? undefined) as AuthenticatorTransportFuture[] | undefined,
    },
  });
  if (!result.verified) return { ok: false as const, error: "Passkey inválida." };

  await db
    .update(adminPasskeys)
    .set({ counter: result.authenticationInfo.newCounter, lastUsedAt: new Date() })
    .where(eq(adminPasskeys.id, passkey.id));
  return { ok: true as const };
}
