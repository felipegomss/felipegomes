"use client";

import { useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Check, Copy, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

const ALGORITHMS = ["SHA-1", "SHA-256", "SHA-512"] as const;
type Algorithm = (typeof ALGORITHMS)[number];

const EMPTY: Record<Algorithm, string> = {
  "SHA-1": "",
  "SHA-256": "",
  "SHA-512": "",
};

async function hashText(text: string, algo: Algorithm): Promise<string> {
  const bytes = new TextEncoder().encode(text);
  const digest = await crypto.subtle.digest(algo, bytes);
  return Array.from(new Uint8Array(digest), (b) =>
    b.toString(16).padStart(2, "0"),
  ).join("");
}

function HashRow({ algo, value }: { algo: Algorithm; value: string }) {
  const t = useTranslations("tools.hash");
  const [copied, setCopied] = useState(false);

  async function copy() {
    if (!value) return;
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard unavailable */
    }
  }

  return (
    <div className="border border-border">
      <header className="flex items-center justify-between border-b border-border bg-muted/40 px-3 py-1.5">
        <span className="text-2xs font-bold uppercase tracking-widest text-muted-foreground">
          {algo}
        </span>
        <Button
          size="xs"
          variant="ghost"
          onClick={copy}
          disabled={!value}
          data-umami-event="tool-hash-copy"
          data-umami-event-algo={algo}
        >
          {copied ? <Check /> : <Copy />}
          {copied ? t("copied") : t("copy")}
        </Button>
      </header>
      <div className="overflow-x-auto px-3 py-2">
        <code className="break-all font-mono text-xs">
          {value || (
            <span className="text-muted-foreground-subtle">{t("empty")}</span>
          )}
        </code>
      </div>
    </div>
  );
}

export function HashTool() {
  const t = useTranslations("tools.hash");
  const [text, setText] = useState("");
  const [hashes, setHashes] = useState<Record<Algorithm, string>>(EMPTY);
  const reqIdRef = useRef(0);

  async function handleChange(next: string) {
    setText(next);
    const id = ++reqIdRef.current;
    if (!next) {
      setHashes(EMPTY);
      return;
    }
    const entries = await Promise.all(
      ALGORITHMS.map(async (a) => [a, await hashText(next, a)] as const),
    );
    if (id !== reqIdRef.current) return;
    setHashes(Object.fromEntries(entries) as Record<Algorithm, string>);
  }

  function clear() {
    reqIdRef.current++;
    setText("");
    setHashes(EMPTY);
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-end gap-2">
        <Button
          size="xs"
          variant="ghost"
          onClick={clear}
          disabled={!text}
          data-umami-event="tool-hash-clear"
        >
          <Trash2 />
          {t("clear")}
        </Button>
      </div>

      <Textarea
        value={text}
        onChange={(e) => handleChange(e.target.value)}
        placeholder={t("placeholder")}
        spellCheck={false}
        className="min-h-32 font-mono text-xs leading-relaxed"
      />

      <div className="space-y-2">
        {ALGORITHMS.map((algo) => (
          <HashRow key={algo} algo={algo} value={hashes[algo]} />
        ))}
      </div>
    </div>
  );
}
