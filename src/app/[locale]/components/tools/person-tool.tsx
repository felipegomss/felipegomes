"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { fakerPT_BR, faker } from "@faker-js/faker";
import { Check, Copy, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useMountEffect } from "@/hooks/use-mount-effect";
import { generateCpf } from "@/lib/br-docs";

interface Person {
  fullName: string;
  email: string;
  phone: string;
  cpf: string;
  birthdate: string;
  gender: string;
  username: string;
}

function generatePerson(localeIsBr: boolean): Person {
  const f = localeIsBr ? fakerPT_BR : faker;
  const sex = f.person.sexType();
  const firstName = f.person.firstName(sex);
  const lastName = f.person.lastName();
  const fullName = `${firstName} ${lastName}`;
  const birthdate = f.date.birthdate({ min: 18, max: 75, mode: "age" });
  return {
    fullName,
    email: f.internet
      .email({ firstName, lastName })
      .toLowerCase(),
    phone: f.phone.number(),
    cpf: generateCpf(),
    birthdate: birthdate.toISOString().slice(0, 10),
    gender: sex === "female" ? "F" : "M",
    username: f.internet.username({ firstName, lastName }).toLowerCase(),
  };
}

function Row({ label, value }: { label: string; value: string }) {
  const t = useTranslations("tools.person");
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
        data-umami-event="tool-person-copy"
        data-umami-event-field={label}
      >
        {copied ? <Check /> : <Copy />}
        {copied ? t("copied") : t("copy")}
      </Button>
    </div>
  );
}

export function PersonTool() {
  const t = useTranslations("tools.person");
  const locale = useLocale();
  const [person, setPerson] = useState<Person | null>(null);
  const [copiedAll, setCopiedAll] = useState(false);

  useMountEffect(() => {
    setPerson(generatePerson(locale === "pt-BR"));
  });

  function regenerate() {
    setPerson(generatePerson(locale === "pt-BR"));
  }

  async function copyAll() {
    if (!person) return;
    try {
      await navigator.clipboard.writeText(JSON.stringify(person, null, 2));
      setCopiedAll(true);
      setTimeout(() => setCopiedAll(false), 1500);
    } catch {
      /* clipboard unavailable */
    }
  }

  if (!person) {
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
          data-umami-event="tool-person-regenerate"
        >
          <RefreshCw />
          {t("regenerate")}
        </Button>
        <Button
          size="xs"
          variant="ghost"
          onClick={copyAll}
          data-umami-event="tool-person-copy-all"
        >
          {copiedAll ? <Check /> : <Copy />}
          {copiedAll ? t("copied") : t("copyAll")}
        </Button>
      </div>

      <div className="space-y-2">
        <Row label={t("labels.fullName")} value={person.fullName} />
        <Row label={t("labels.email")} value={person.email} />
        <Row label={t("labels.phone")} value={person.phone} />
        <Row label={t("labels.cpf")} value={person.cpf} />
        <Row label={t("labels.birthdate")} value={person.birthdate} />
        <Row label={t("labels.gender")} value={person.gender} />
        <Row label={t("labels.username")} value={person.username} />
      </div>
    </div>
  );
}
