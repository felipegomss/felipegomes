"use client";

import { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Lock } from "lucide-react";

export default function EmailLoginPage() {
  const router = useRouter();
  const { locale } = useParams<{ locale: string }>();
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(false);

    const res = await fetch("/api/email/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });

    setLoading(false);

    if (!res.ok) {
      setError(true);
      return;
    }

    router.replace(`/${locale}/email`);
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-xs space-y-3 border border-border p-6"
      >
        <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-widest">
          <Lock className="size-3" />
          Email
        </div>
        <Input
          type="password"
          placeholder="senha"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          aria-invalid={error}
          autoFocus
        />
        {error && (
          <p className="text-xs text-destructive">Senha incorreta.</p>
        )}
        <Button type="submit" className="w-full" size="sm" disabled={loading}>
          {loading ? "..." : "Entrar"}
        </Button>
      </form>
    </div>
  );
}
