"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { faker, fakerPT_BR } from "@faker-js/faker";
import { Check, Copy, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useMountEffect } from "@/hooks/use-mount-effect";
import { formatCep } from "@/lib/br-docs";

interface Address {
  street: string;
  number: string;
  complement: string;
  neighborhood: string;
  city: string;
  state: string;
  cep: string;
  country: string;
}

function generateAddress(localeIsBr: boolean): Address {
  const f = localeIsBr ? fakerPT_BR : faker;
  const hasComplement = f.number.int({ min: 0, max: 3 }) === 0;
  return {
    street: f.location.street(),
    number: String(f.number.int({ min: 1, max: 9999 })),
    complement: hasComplement
      ? f.helpers.arrayElement(["Apt 12", "Casa", "Bloco B", "Fundos", "Sala 301"])
      : "—",
    neighborhood: f.location.county(),
    city: f.location.city(),
    state: f.location.state({ abbreviated: true }),
    cep: formatCep(f.location.zipCode()),
    country: localeIsBr ? "Brasil" : f.location.country(),
  };
}

function Row({ label, value }: { label: string; value: string }) {
  const t = useTranslations("tools.address");
  const [copied, setCopied] = useState(false);
  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard unavailable */
    }
  }
  return (
    <div className="grid grid-cols-[140px_1fr_auto] items-center gap-3 border border-border px-3 py-2">
      <span className="text-2xs font-bold uppercase tracking-widest text-muted-foreground-subtle">
        {label}
      </span>
      <code className="break-all font-mono text-xs">{value}</code>
      <Button
        size="xs"
        variant="ghost"
        onClick={copy}
        data-umami-event="tool-address-copy"
        data-umami-event-field={label}
      >
        {copied ? <Check /> : <Copy />}
        {copied ? t("copied") : t("copy")}
      </Button>
    </div>
  );
}

export function AddressTool() {
  const t = useTranslations("tools.address");
  const locale = useLocale();
  const [address, setAddress] = useState<Address | null>(null);
  const [copiedAll, setCopiedAll] = useState(false);

  useMountEffect(() => {
    setAddress(generateAddress(locale === "pt-BR"));
  });

  function regenerate() {
    setAddress(generateAddress(locale === "pt-BR"));
  }

  async function copyAll() {
    if (!address) return;
    try {
      await navigator.clipboard.writeText(JSON.stringify(address, null, 2));
      setCopiedAll(true);
      setTimeout(() => setCopiedAll(false), 1500);
    } catch {
      /* clipboard unavailable */
    }
  }

  if (!address) {
    return (
      <p className="text-2xs text-muted-foreground-subtle">{t("loading")}</p>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-end gap-2">
        <Button
          size="xs"
          variant="outline"
          onClick={regenerate}
          data-umami-event="tool-address-regenerate"
        >
          <RefreshCw />
          {t("regenerate")}
        </Button>
        <Button
          size="xs"
          variant="ghost"
          onClick={copyAll}
          data-umami-event="tool-address-copy-all"
        >
          {copiedAll ? <Check /> : <Copy />}
          {copiedAll ? t("copied") : t("copyAll")}
        </Button>
      </div>

      <div className="space-y-2">
        <Row label={t("labels.street")} value={address.street} />
        <Row label={t("labels.number")} value={address.number} />
        <Row label={t("labels.complement")} value={address.complement} />
        <Row label={t("labels.neighborhood")} value={address.neighborhood} />
        <Row label={t("labels.city")} value={address.city} />
        <Row label={t("labels.state")} value={address.state} />
        <Row label={t("labels.cep")} value={address.cep} />
        <Row label={t("labels.country")} value={address.country} />
      </div>
    </div>
  );
}
