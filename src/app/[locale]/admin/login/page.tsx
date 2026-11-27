"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  browserSupportsWebAuthn,
  browserSupportsWebAuthnAutofill,
  startAuthentication,
  WebAuthnAbortService,
} from "@simplewebauthn/browser";
import { FingerprintIcon, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

/** Só caminhos internos (evita redirecionamento aberto). */
function nextPath(locale: string) {
  const next = new URLSearchParams(window.location.search).get("next");
  return next && /^\/(?!\/)/.test(next) ? next : `/${locale}/admin`;
}

async function passkeyLogin(autofill: boolean): Promise<"ok" | "cancel" | string> {
  const optionsJSON = await fetch("/api/auth/passkey/login/options", { method: "POST" }).then((r) => r.json());
  let response;
  try {
    response = await startAuthentication({ optionsJSON, useBrowserAutofill: autofill });
  } catch (err) {
    const name = (err as Error).name;
    // Usuário cancelou, ou a cerimônia foi substituída por outra.
    if (name === "NotAllowedError" || name === "AbortError") return "cancel";
    return (err as Error).message;
  }
  const res = await fetch("/api/auth/passkey/login/verify", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ response }),
  });
  if (res.ok) return "ok";
  return (await res.json().catch(() => null))?.error ?? "Não foi possível entrar com a passkey.";
}

export default function AdminLoginPage() {
  const router = useRouter();
  const { locale } = useParams<{ locale: string }>();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [webauthn, setWebauthn] = useState(false);
  const passwordRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!browserSupportsWebAuthn()) return;
    setWebauthn(true);
    let active = true;
    // Preenchimento automático: o navegador sugere a passkey ao focar o campo.
    browserSupportsWebAuthnAutofill().then((supported) => {
      if (!supported || !active) return;
      passkeyLogin(true).then((result) => {
        if (!active) return;
        if (result === "ok") router.replace(nextPath(locale));
      });
    });
    return () => {
      active = false;
      WebAuthnAbortService.cancelCeremony();
    };
  }, [locale, router]);

  async function handlePasskey() {
    setLoading(true);
    setError(null);
    const result = await passkeyLogin(false);
    setLoading(false);
    if (result === "ok") router.replace(nextPath(locale));
    else if (result !== "cancel") setError(result);
  }

  async function handlePassword(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const res = await fetch("/api/auth/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    setLoading(false);
    if (!res.ok) {
      setError("Senha incorreta.");
      passwordRef.current?.focus();
      return;
    }
    router.replace(nextPath(locale));
  }

  return (
    <main className="flex min-h-dvh items-center justify-center bg-background px-4">
      <div className="flex w-full max-w-xs flex-col gap-4 border border-border p-6 text-xs">
        <h1 className="flex items-center gap-2 text-xs font-medium uppercase tracking-widest">
          <Lock className="size-3" aria-hidden="true" />
          Entrar
        </h1>

        {webauthn && (
          <>
            <Button type="button" size="lg" className="w-full" disabled={loading} onClick={handlePasskey}>
              <FingerprintIcon aria-hidden="true" />
              Entrar com passkey
            </Button>
            <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
              <span className="h-px flex-1 bg-border" />
              ou use a senha
              <span className="h-px flex-1 bg-border" />
            </div>
          </>
        )}

        <form onSubmit={handlePassword} className="flex flex-col gap-3">
          <label className="flex flex-col gap-1.5">
            <span className="sr-only">Senha</span>
            <Input
              ref={passwordRef}
              type="password"
              name="password"
              placeholder="senha"
              autoComplete="current-password webauthn"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              aria-invalid={!!error || undefined}
              aria-describedby={error ? "login-error" : undefined}
              className="h-10 border-muted-foreground/70"
              autoFocus={!webauthn}
            />
          </label>
          {error && (
            <p id="login-error" role="alert" className="text-xs text-red-800 dark:text-red-400">
              {error}
            </p>
          )}
          <Button type="submit" variant={webauthn ? "outline" : "default"} size="lg" className="w-full" disabled={loading}>
            {loading ? "..." : "Entrar com senha"}
          </Button>
        </form>
      </div>
    </main>
  );
}
