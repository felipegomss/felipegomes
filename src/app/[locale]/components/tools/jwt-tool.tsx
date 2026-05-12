"use client";

import { useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Check, Copy, FileJson, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

const SAMPLE =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJkZW1vIiwibmFtZSI6IkZlbGlwZSIsImlhdCI6MTczNTY4OTYwMCwiZXhwIjo0MDcwOTA4ODAwfQ.signature-not-verified";

function base64UrlDecode(input: string): string {
  const padLen = input.length % 4;
  const padded = input + "=".repeat(padLen ? 4 - padLen : 0);
  const normalized = padded.replace(/-/g, "+").replace(/_/g, "/");
  const bin = atob(normalized);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new TextDecoder().decode(bytes);
}

type Decoded =
  | { state: "empty" }
  | { state: "invalid"; message: string }
  | {
      state: "valid";
      header: unknown;
      payload: Record<string, unknown>;
      signature: string;
    };

function decodeJwt(token: string): Decoded {
  const trimmed = token.trim();
  if (!trimmed) return { state: "empty" };

  const parts = trimmed.split(".");
  if (parts.length < 2 || parts.length > 3) {
    return { state: "invalid", message: "Expected 2 or 3 parts separated by '.'" };
  }

  try {
    const header = JSON.parse(base64UrlDecode(parts[0]));
    const payload = JSON.parse(base64UrlDecode(parts[1]));
    if (typeof payload !== "object" || payload === null || Array.isArray(payload)) {
      return { state: "invalid", message: "Payload is not a JSON object" };
    }
    return {
      state: "valid",
      header,
      payload: payload as Record<string, unknown>,
      signature: parts[2] ?? "",
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { state: "invalid", message };
  }
}

function CopyButton({ text }: { text: string }) {
  const t = useTranslations("tools.jwt");
  const [copied, setCopied] = useState(false);
  return (
    <Button
      size="xs"
      variant="ghost"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        } catch {
          /* clipboard unavailable */
        }
      }}
      disabled={!text}
    >
      {copied ? <Check /> : <Copy />}
      {copied ? t("copied") : t("copy")}
    </Button>
  );
}

function Section({
  label,
  children,
  copyText,
}: {
  label: string;
  children: React.ReactNode;
  copyText: string;
}) {
  return (
    <section className="rounded-none border border-border">
      <header className="flex items-center justify-between border-b border-border bg-muted/40 px-3 py-1.5">
        <h2 className="text-2xs font-bold uppercase tracking-widest text-muted-foreground">
          {label}
        </h2>
        <CopyButton text={copyText} />
      </header>
      <div className="overflow-x-auto p-3">{children}</div>
    </section>
  );
}

function formatTimestamp(ts: number, locale: string): string {
  try {
    return new Date(ts * 1000).toLocaleString(locale, {
      dateStyle: "medium",
      timeStyle: "short",
    });
  } catch {
    return new Date(ts * 1000).toISOString();
  }
}

interface ClaimsPanelProps {
  payload: Record<string, unknown>;
  locale: string;
}

function ClaimsPanel({ payload, locale }: ClaimsPanelProps) {
  const t = useTranslations("tools.jwt");
  const now = Math.floor(Date.now() / 1000);

  const claims: Array<{ label: string; ts: number }> = [];
  if (typeof payload.iat === "number") {
    claims.push({ label: t("claimIssuedAt"), ts: payload.iat });
  }
  if (typeof payload.nbf === "number") {
    claims.push({ label: t("claimNotBefore"), ts: payload.nbf });
  }
  if (typeof payload.exp === "number") {
    claims.push({ label: t("claimExpiresAt"), ts: payload.exp });
  }

  if (claims.length === 0) return null;

  const exp = typeof payload.exp === "number" ? payload.exp : null;
  const expired = exp !== null && exp < now;

  return (
    <div className="mt-3 border-t border-border pt-3">
      <div className="mb-2 flex items-center justify-between gap-2">
        <h3 className="text-2xs font-bold uppercase tracking-widest text-muted-foreground">
          {t("claims")}
        </h3>
        {exp !== null && (
          <span
            className={`flex items-center gap-1 text-2xs ${
              expired ? "text-destructive" : "text-muted-foreground"
            }`}
          >
            <span
              aria-hidden="true"
              className={`size-1.5 rounded-full ${
                expired ? "bg-destructive" : "bg-emerald-500"
              }`}
            />
            {expired ? t("claimExpired") : t("claimActive")}
          </span>
        )}
      </div>
      <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-2xs">
        {claims.map(({ label, ts }) => (
          <div key={label} className="contents">
            <dt className="text-muted-foreground-subtle">{label}</dt>
            <dd className="tabular-nums">{formatTimestamp(ts, locale)}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

export function JwtTool() {
  const t = useTranslations("tools.jwt");
  const locale = useLocale();
  const [value, setValue] = useState("");

  const decoded = useMemo(() => decodeJwt(value), [value]);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <div className="ml-auto flex items-center gap-2">
          <Button
            size="xs"
            variant="ghost"
            onClick={() => setValue(SAMPLE)}
            data-umami-event="tool-jwt-sample"
          >
            <FileJson />
            {t("sample")}
          </Button>
          <Button
            size="xs"
            variant="ghost"
            onClick={() => setValue("")}
            disabled={!value}
            data-umami-event="tool-jwt-clear"
          >
            <Trash2 />
            {t("clear")}
          </Button>
        </div>
      </div>

      <Textarea
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={t("placeholder")}
        spellCheck={false}
        aria-invalid={decoded.state === "invalid"}
        aria-describedby="jwt-status"
        className="min-h-32 break-all font-mono text-xs leading-relaxed"
      />

      <div id="jwt-status" className="text-2xs">
        {decoded.state === "empty" && (
          <span className="text-muted-foreground-subtle">{t("empty")}</span>
        )}
        {decoded.state === "invalid" && (
          <span className="flex items-center gap-1.5 text-destructive">
            <span
              aria-hidden="true"
              className="size-1.5 rounded-full bg-destructive"
            />
            {t("invalid")}: <code className="font-mono">{decoded.message}</code>
          </span>
        )}
      </div>

      {decoded.state === "valid" && (
        <div className="space-y-3">
          <Section
            label={t("header")}
            copyText={JSON.stringify(decoded.header, null, 2)}
          >
            <pre className="whitespace-pre-wrap break-all font-mono text-xs leading-relaxed">
              {JSON.stringify(decoded.header, null, 2)}
            </pre>
          </Section>

          <Section
            label={t("payload")}
            copyText={JSON.stringify(decoded.payload, null, 2)}
          >
            <pre className="whitespace-pre-wrap break-all font-mono text-xs leading-relaxed">
              {JSON.stringify(decoded.payload, null, 2)}
            </pre>
            <ClaimsPanel payload={decoded.payload} locale={locale} />
          </Section>

          {decoded.signature && (
            <Section label={t("signature")} copyText={decoded.signature}>
              <p className="break-all font-mono text-xs leading-relaxed text-muted-foreground">
                {decoded.signature}
              </p>
            </Section>
          )}
        </div>
      )}
    </div>
  );
}
