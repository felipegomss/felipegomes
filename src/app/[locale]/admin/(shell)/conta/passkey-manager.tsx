"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { browserSupportsWebAuthn, startRegistration } from "@simplewebauthn/browser";
import { FingerprintIcon, PlusIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatDay } from "@/lib/format-date";

type Passkey = { id: string; name: string; backedUp: boolean; createdAt: string; lastUsedAt: string | null };

/** Nome sugerido a partir do aparelho atual. */
function guessDeviceName(): string {
  const ua = navigator.userAgent;
  if (/iPhone/.test(ua)) return "iPhone";
  if (/iPad/.test(ua)) return "iPad";
  if (/Macintosh/.test(ua)) return "Mac";
  if (/Android/.test(ua)) return "Android";
  if (/Windows/.test(ua)) return "Windows";
  return "Passkey";
}

export function PasskeyManager({ initial }: { initial: Passkey[] }) {
  const router = useRouter();
  const [supported, setSupported] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<{ id: string; name: string } | null>(null);
  const [confirming, setConfirming] = useState<string | null>(null);

  useEffect(() => setSupported(browserSupportsWebAuthn()), []);

  async function add() {
    setBusy(true);
    setError(null);
    try {
      const optionsJSON = await fetch("/api/auth/passkey/register/options", { method: "POST" }).then((r) => r.json());
      const response = await startRegistration({ optionsJSON });
      const res = await fetch("/api/auth/passkey/register/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ response, name: guessDeviceName() }),
      });
      if (!res.ok) throw new Error((await res.json().catch(() => null))?.error ?? "Não foi possível cadastrar.");
      router.refresh();
    } catch (err) {
      const e = err as Error;
      if (e.name === "InvalidStateError") setError("Este aparelho já tem uma passkey cadastrada.");
      else if (e.name !== "NotAllowedError" && e.name !== "AbortError") setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  async function rename(id: string, name: string) {
    const res = await fetch(`/api/auth/passkey/${encodeURIComponent(id)}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    if (!res.ok) return setError("Não foi possível renomear.");
    setEditing(null);
    router.refresh();
  }

  async function remove(id: string) {
    const res = await fetch(`/api/auth/passkey/${encodeURIComponent(id)}`, { method: "DELETE" });
    setConfirming(null);
    if (!res.ok) return setError("Não foi possível remover.");
    router.refresh();
  }

  const now = new Date();

  return (
    <section className="flex flex-col gap-3" aria-labelledby="sec-passkeys">
      <div className="flex items-center justify-between gap-3">
        <h2 id="sec-passkeys" className="text-xs font-semibold uppercase tracking-[0.12em]">
          Passkeys
        </h2>
        <Button onClick={add} disabled={busy || !supported}>
          <PlusIcon aria-hidden="true" />
          {busy ? "Aguardando…" : "Adicionar passkey"}
        </Button>
      </div>

      {!supported && <p className="text-muted-foreground">Este navegador não suporta passkeys.</p>}
      {error && (
        <p role="alert" className="text-xs text-red-800 dark:text-red-400">
          {error}
        </p>
      )}

      <ul className="border">
        {initial.map((p) => (
          <li key={p.id} className="flex flex-wrap items-center gap-3 border-b p-3 last:border-b-0">
            <span className="grid size-8 place-items-center bg-muted" aria-hidden="true">
              <FingerprintIcon className="size-4" />
            </span>
            {editing?.id === p.id ? (
              <form
                className="flex flex-[1_1_240px] items-center gap-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  rename(p.id, editing.name);
                }}
              >
                <label className="flex-1">
                  <span className="sr-only">Nome da passkey</span>
                  <Input
                    autoFocus
                    value={editing.name}
                    maxLength={60}
                    onChange={(e) => setEditing({ id: p.id, name: e.target.value })}
                    className="h-9 border-muted-foreground/70"
                  />
                </label>
                <Button type="submit" size="lg">
                  Salvar
                </Button>
                <Button type="button" variant="ghost" size="lg" onClick={() => setEditing(null)}>
                  Cancelar
                </Button>
              </form>
            ) : (
              <span className="flex flex-[1_1_240px] flex-col gap-0.5">
                <span className="font-medium">{p.name}</span>
                <span className="text-muted-foreground">
                  Criada {formatDay(p.createdAt, now)}
                  {p.lastUsedAt ? ` · último uso ${formatDay(p.lastUsedAt, now)}` : " · ainda não usada"}
                </span>
              </span>
            )}
            {p.backedUp && (
              <span className="bg-emerald-500/10 px-2 py-0.5 text-[11px] font-medium text-emerald-800 dark:text-emerald-400">
                sincronizada
              </span>
            )}
            {editing?.id !== p.id &&
              (confirming === p.id ? (
                <span role="alertdialog" aria-label={`Remover ${p.name}?`} className="flex items-center gap-2">
                  <span className="text-muted-foreground">Remover?</span>
                  <Button variant="outline" size="lg" autoFocus onClick={() => setConfirming(null)}>
                    Cancelar
                  </Button>
                  <Button
                    size="lg"
                    onClick={() => remove(p.id)}
                    className="bg-red-700 text-white hover:bg-red-800 dark:bg-red-400 dark:text-neutral-950"
                  >
                    Remover
                  </Button>
                </span>
              ) : (
                <span className="flex gap-1">
                  <Button variant="outline" size="lg" onClick={() => setEditing({ id: p.id, name: p.name })}>
                    Renomear
                  </Button>
                  <Button
                    variant="ghost"
                    size="lg"
                    onClick={() => setConfirming(p.id)}
                    className="text-red-800 hover:text-red-900 dark:text-red-400"
                  >
                    Remover
                  </Button>
                </span>
              ))}
          </li>
        ))}
        <li className="p-3 leading-relaxed text-muted-foreground">
          {initial.length === 0
            ? "Nenhuma passkey ainda. Adicione uma para entrar com a digital ou o Face ID."
            : "Passkeys sincronizadas pelo iCloud aparecem também no iPhone. Cadastre outra só para um aparelho fora do iCloud."}
        </li>
      </ul>
    </section>
  );
}
