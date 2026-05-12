"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { faker, fakerPT_BR } from "@faker-js/faker";
import { Check, Copy, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useMountEffect } from "@/hooks/use-mount-effect";
import { generateCnpj } from "@/lib/br-docs";

interface Company {
  razaoSocial: string;
  nomeFantasia: string;
  cnpj: string;
  email: string;
  phone: string;
  industry: string;
}

function slug(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "")
    .slice(0, 24);
}

function generateCompany(localeIsBr: boolean): Company {
  const f = localeIsBr ? fakerPT_BR : faker;
  const razaoSocial = f.company.name();
  const nomeFantasia = f.company.name();
  const domain = `${slug(nomeFantasia) || "empresa"}.${f.helpers.arrayElement([
    "com.br",
    "com",
    "io",
  ])}`;
  return {
    razaoSocial,
    nomeFantasia,
    cnpj: generateCnpj(),
    email: `contato@${domain}`,
    phone: f.phone.number(),
    industry: f.company.buzzPhrase(),
  };
}

function Row({ label, value }: { label: string; value: string }) {
  const t = useTranslations("tools.company");
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
        data-umami-event="tool-company-copy"
        data-umami-event-field={label}
      >
        {copied ? <Check /> : <Copy />}
        {copied ? t("copied") : t("copy")}
      </Button>
    </div>
  );
}

export function CompanyTool() {
  const t = useTranslations("tools.company");
  const locale = useLocale();
  const [company, setCompany] = useState<Company | null>(null);
  const [copiedAll, setCopiedAll] = useState(false);

  useMountEffect(() => {
    setCompany(generateCompany(locale === "pt-BR"));
  });

  function regenerate() {
    setCompany(generateCompany(locale === "pt-BR"));
  }

  async function copyAll() {
    if (!company) return;
    try {
      await navigator.clipboard.writeText(JSON.stringify(company, null, 2));
      setCopiedAll(true);
      setTimeout(() => setCopiedAll(false), 1500);
    } catch {
      /* clipboard unavailable */
    }
  }

  if (!company) {
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
          data-umami-event="tool-company-regenerate"
        >
          <RefreshCw />
          {t("regenerate")}
        </Button>
        <Button
          size="xs"
          variant="ghost"
          onClick={copyAll}
          data-umami-event="tool-company-copy-all"
        >
          {copiedAll ? <Check /> : <Copy />}
          {copiedAll ? t("copied") : t("copyAll")}
        </Button>
      </div>

      <div className="space-y-2">
        <Row label={t("labels.razaoSocial")} value={company.razaoSocial} />
        <Row label={t("labels.nomeFantasia")} value={company.nomeFantasia} />
        <Row label={t("labels.cnpj")} value={company.cnpj} />
        <Row label={t("labels.email")} value={company.email} />
        <Row label={t("labels.phone")} value={company.phone} />
        <Row label={t("labels.industry")} value={company.industry} />
      </div>
    </div>
  );
}
