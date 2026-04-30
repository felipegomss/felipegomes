"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Send, Paperclip, Lock } from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────

type Locale = "pt-BR" | "en";
type Status = "idle" | "sending" | "sent" | "error";

interface TemplateField {
  key: string;
  label: Record<Locale, string>;
  placeholder?: Record<Locale, string>;
  type?: "text" | "select";
  options?: Record<Locale, string[]>;
}

interface Template {
  id: string;
  label: Record<Locale, string>;
  preview: Record<Locale, string>;
  fields: TemplateField[];
  generate: (fields: Record<string, string>, locale: Locale) => string;
}

// ─── Static data ─────────────────────────────────────────────────────────────

const SIGNATURES: Record<Locale, string[]> = {
  "pt-BR": ["Atenciosamente,", "Luis Felipe Gomes", "lfng.dev · LinkedIn · GitHub"],
  en: ["Best regards,", "Luis Felipe Gomes", "lfng.dev · LinkedIn · GitHub"],
};

const CV_NOTES: Record<Locale, string> = {
  "pt-BR": "Segue currículo em anexo.",
  en: "Please find my resume attached.",
};

const TEMPLATES: Template[] = [
  {
    id: "candidatura",
    label: { "pt-BR": "Candidatura", en: "Job Application" },
    preview: {
      "pt-BR": "Manifestando interesse em uma vaga específica, com contexto sobre experiência e fit com a empresa.",
      en: "Expressing interest in a specific role, with context about experience and fit with the company.",
    },
    fields: [
      {
        key: "name",
        label: { "pt-BR": "Nome do recrutador", en: "Recruiter name" },
        placeholder: { "pt-BR": "Ana (opcional)", en: "Ana (optional)" },
      },
      {
        key: "company",
        label: { "pt-BR": "Empresa", en: "Company" },
        placeholder: { "pt-BR": "Google (opcional)", en: "Google (optional)" },
      },
      {
        key: "role",
        label: { "pt-BR": "Perfil", en: "Profile" },
        type: "select",
        options: {
          "pt-BR": ["Frontend Engineer", "Full Stack Engineer"],
          en: ["Frontend Engineer", "Full Stack Engineer"],
        },
      },
    ],
    generate: (f, locale) => {
      const greeting = f.name ? `Olá, ${f.name}` : "Olá";
      const greetingEn = f.name ? `Hello ${f.name}` : "Hello";
      const role = f.role || "Frontend Engineer";
      const isFullStack = role.toLowerCase().includes("full");
      const companyPart = f.company ? ` na ${f.company}` : "";
      const companyPartEn = f.company ? ` at ${f.company}` : "";
      const stackPtBR = isFullStack
        ? "desenvolvimento full stack — principalmente React, TypeScript, Next.js e Node.js"
        : "desenvolvimento frontend — principalmente React, TypeScript e Next.js";
      const stackEn = isFullStack
        ? "full stack development — primarily React, TypeScript, Next.js, and Node.js"
        : "frontend development — primarily React, TypeScript, and Next.js";
      if (locale === "pt-BR") {
        return `${greeting},\n\nVim ao seu contato para manifestar interesse na vaga de ${role}${companyPart}.\n\nCom mais de 5 anos de experiência em ${stackPtBR} — tenho trabalhado na construção de sistemas robustos com foco em arquitetura, performance e experiência do usuário.\n\nFico à disposição para conversarmos melhor sobre a oportunidade.`;
      }
      return `${greetingEn},\n\nI'm reaching out to express my interest in the ${role} position${companyPartEn}.\n\nWith over 5 years of experience in ${stackEn} — I've been building robust systems focused on architecture, performance, and user experience.\n\nI'd love to connect and learn more about the opportunity.`;
    },
  },
  {
    id: "followup",
    label: { "pt-BR": "Follow-up", en: "Follow-up" },
    preview: {
      "pt-BR": "Retomando contato após uma conversa ou entrevista anterior.",
      en: "Following up after a previous conversation or interview.",
    },
    fields: [
      {
        key: "name",
        label: { "pt-BR": "Nome", en: "Name" },
        placeholder: { "pt-BR": "Ana (opcional)", en: "Ana (optional)" },
      },
      {
        key: "topic",
        label: { "pt-BR": "Assunto anterior", en: "Previous topic" },
        placeholder: { "pt-BR": "a vaga de Frontend", en: "the Frontend position" },
      },
    ],
    generate: (f, locale) => {
      const greeting = f.name ? `Olá, ${f.name}` : "Olá";
      const greetingEn = f.name ? `Hello ${f.name}` : "Hello";
      if (locale === "pt-BR") {
        return `${greeting},\n\nGostaria de retomar nossa conversa sobre ${f.topic || "[assunto]"}. Continuo muito interessado na oportunidade e fico à disposição para esclarecer qualquer ponto adicional ou avançar com as próximas etapas.`;
      }
      return `${greetingEn},\n\nI wanted to follow up on our conversation about ${f.topic || "[topic]"}. I'm still very interested in the opportunity and happy to clarify anything further or move forward with next steps.`;
    },
  },
  {
    id: "networking",
    label: { "pt-BR": "Networking", en: "Networking" },
    preview: {
      "pt-BR": "Apresentação e conexão com alguém de interesse profissional.",
      en: "Introduction and connection with someone of professional interest.",
    },
    fields: [
      {
        key: "name",
        label: { "pt-BR": "Nome", en: "Name" },
        placeholder: { "pt-BR": "João", en: "John" },
      },
      {
        key: "company",
        label: { "pt-BR": "Empresa", en: "Company" },
        placeholder: { "pt-BR": "Google", en: "Google" },
      },
      {
        key: "reason",
        label: { "pt-BR": "Motivo do contato", en: "Reason for reaching out" },
        placeholder: {
          "pt-BR": "trocar experiências sobre frontend",
          en: "exchange experiences about frontend",
        },
      },
    ],
    generate: (f, locale) => {
      const greeting = f.name ? `Olá, ${f.name}` : "Olá";
      const greetingEn = f.name ? `Hello ${f.name}` : "Hello";
      if (locale === "pt-BR") {
        return `${greeting},\n\nAcompanho o trabalho da ${f.company || "[empresa]"} há algum tempo e tenho muito respeito pelo que vocês constroem. Vim ao seu contato para ${f.reason || "[motivo]"}.\n\nSeria ótimo trocarmos uma ideia quando tiver disponibilidade.`;
      }
      return `${greetingEn},\n\nI've been following ${f.company || "[company]"}'s work for a while and have great respect for what you're building. I'm reaching out to ${f.reason || "[reason]"}.\n\nI'd love to connect whenever you have a moment.`;
    },
  },
  {
    id: "apresentacao",
    label: { "pt-BR": "Apresentação", en: "Introduction" },
    preview: {
      "pt-BR": "Email frio de apresentação, sem vaga específica em mente.",
      en: "Cold introduction email, without a specific role in mind.",
    },
    fields: [
      {
        key: "name",
        label: { "pt-BR": "Nome do destinatário", en: "Recipient name" },
        placeholder: { "pt-BR": "Ana (opcional)", en: "Ana (optional)" },
      },
      {
        key: "company",
        label: { "pt-BR": "Empresa", en: "Company" },
        placeholder: { "pt-BR": "Google", en: "Google" },
      },
    ],
    generate: (f, locale) => {
      const greeting = f.name ? `Olá, ${f.name}` : "Olá";
      const greetingEn = f.name ? `Hello ${f.name}` : "Hello";
      if (locale === "pt-BR") {
        return `${greeting},\n\nMeu nome é Luis Felipe, desenvolvedor full stack com mais de 5 anos de experiência. Trabalho principalmente com React, TypeScript e Next.js, com foco em arquitetura frontend, design systems e entrega de produto.\n\nAcompanho o que a ${f.company || "[empresa]"} vem construindo e acredito que poderia agregar bastante ao time. Seria ótimo conversar sobre possíveis oportunidades.`;
      }
      return `${greetingEn},\n\nMy name is Luis Felipe, a full stack developer with over 5 years of experience. I primarily work with React, TypeScript, and Next.js, focusing on frontend architecture, design systems, and product delivery.\n\nI've been following what ${f.company || "[company]"} has been building and believe I could bring a lot to the team. I'd love to explore potential opportunities.`;
    },
  },
];

// ─── Component ───────────────────────────────────────────────────────────────

export default function EmailPage() {
  const [authed, setAuthed] = useState(false);
  const [password, setPassword] = useState("");

  const [recipients, setRecipients] = useState<string[]>([]);
  const [recipientInput, setRecipientInput] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [locale, setLocale] = useState<Locale>("pt-BR");
  const [attachCv, setAttachCv] = useState(true);
  const [status, setStatus] = useState<Status>("idle");
  const [sendError, setSendError] = useState("");

  // Template modal state
  const [activeTemplate, setActiveTemplate] = useState<Template | null>(null);
  const [appliedTemplateId, setAppliedTemplateId] = useState<string | null>(null);
  const [templateFields, setTemplateFields] = useState<Record<string, string>>({});

  useEffect(() => {
    if (sessionStorage.getItem("email_pw")) setAuthed(true);
  }, []);

  // Re-generate body when locale changes if a template was applied
  useEffect(() => {
    if (!appliedTemplateId || Object.keys(templateFields).length === 0) return;
    const template = TEMPLATES.find((t) => t.id === appliedTemplateId);
    if (template) setBody(template.generate(templateFields, locale));
  }, [locale]); // eslint-disable-line react-hooks/exhaustive-deps

  function handleAuth(e: React.FormEvent) {
    e.preventDefault();
    sessionStorage.setItem("email_pw", password);
    setAuthed(true);
  }

  function handleLogout() {
    sessionStorage.removeItem("email_pw");
    setAuthed(false);
    setPassword("");
  }

  function handleLocaleChange(next: Locale) {
    setLocale(next);
  }

  function addRecipient(value: string) {
    const email = value.trim().replace(/,$/, "");
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return;
    if (!recipients.includes(email)) setRecipients((prev) => [...prev, email]);
    setRecipientInput("");
  }

  function handleRecipientKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" || e.key === "," || e.key === "Tab") {
      e.preventDefault();
      addRecipient(recipientInput);
    } else if (e.key === "Backspace" && !recipientInput && recipients.length > 0) {
      setRecipients((prev) => prev.slice(0, -1));
    }
  }

  function openTemplateModal(template: Template) {
    setTemplateFields({});
    setActiveTemplate(template);
  }

  function applyTemplate() {
    if (!activeTemplate) return;
    setBody(activeTemplate.generate(templateFields, locale));
    setAppliedTemplateId(activeTemplate.id);
    setActiveTemplate(null);
  }

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    const finalRecipients = recipientInput.trim()
      ? [...recipients, recipientInput.trim()].filter((r) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(r))
      : recipients;

    if (finalRecipients.length === 0) {
      setSendError(locale === "pt-BR" ? "Adicione ao menos um destinatário." : "Add at least one recipient.");
      setStatus("error");
      return;
    }

    setStatus("sending");
    setSendError("");

    try {
      const res = await fetch("/api/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: finalRecipients,
          subject,
          body,
          locale,
          attachCv,
          password: sessionStorage.getItem("email_pw"),
        }),
      });

      if (res.status === 401) {
        handleLogout();
        return;
      }

      if (!res.ok) {
        const data = await res.json();
        setSendError(data.error?.message ?? "Erro ao enviar.");
        setStatus("error");
        return;
      }

      setStatus("sent");
      setRecipients([]);
      setRecipientInput("");
      setSubject("");
      setBody("");
      setAppliedTemplateId(null);
      setTemplateFields({});
    } catch {
      setSendError("Erro de conexão.");
      setStatus("error");
    }
  }

  // ── Auth gate ──────────────────────────────────────────────────────────────

  if (!authed) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <form
          onSubmit={handleAuth}
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
            autoFocus
          />
          <Button type="submit" className="w-full" size="sm">
            Entrar
          </Button>
        </form>
      </div>
    );
  }

  const sig = SIGNATURES[locale];

  // ── Composer ───────────────────────────────────────────────────────────────

  return (
    <>
      <div className="flex min-h-screen flex-col bg-background">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-6 py-3">
          <span className="text-xs font-medium uppercase tracking-widest">
            Email
          </span>
          <div className="flex items-center gap-4">
            {/* Locale toggle */}
            <div className="flex items-center gap-1">
              {(["pt-BR", "en"] as Locale[]).map((l) => (
                <button
                  key={l}
                  type="button"
                  onClick={() => handleLocaleChange(l)}
                  className={`border px-2 py-0.5 text-xs transition-colors ${
                    locale === l
                      ? "border-foreground bg-foreground text-background"
                      : "border-border text-muted-foreground hover:border-foreground/50"
                  }`}
                >
                  {l}
                </button>
              ))}
            </div>
            <button
              onClick={handleLogout}
              className="text-xs text-muted-foreground transition-colors hover:text-foreground"
            >
              Sair
            </button>
          </div>
        </div>

        {/* Main: two columns */}
        <div className="flex flex-1 divide-x divide-border">
          {/* Left: Composer */}
          <div className="flex flex-1 flex-col">
            <form onSubmit={handleSend} className="flex flex-1 flex-col">
              {/* To + Subject */}
              <div className="border-b border-border">
                <div className="flex min-h-8 items-start border-b border-border">
                  <span className="w-20 shrink-0 border-r border-border px-3 py-2 text-xs text-muted-foreground">
                    {locale === "pt-BR" ? "Para" : "To"}
                  </span>
                  <div className="flex flex-1 flex-wrap items-center gap-1 px-2 py-1">
                    {recipients.map((email) => (
                      <span
                        key={email}
                        className="flex items-center gap-1 border border-border px-1.5 py-0.5 text-xs"
                      >
                        {email}
                        <button
                          type="button"
                          onClick={() => setRecipients((prev) => prev.filter((r) => r !== email))}
                          className="text-muted-foreground hover:text-foreground"
                          aria-label={`Remover ${email}`}
                        >
                          ×
                        </button>
                      </span>
                    ))}
                    <input
                      type="text"
                      value={recipientInput}
                      onChange={(e) => setRecipientInput(e.target.value)}
                      onKeyDown={handleRecipientKeyDown}
                      onBlur={() => addRecipient(recipientInput)}
                      placeholder={recipients.length === 0 ? "destinatario@empresa.com" : ""}
                      className="h-6 min-w-40 flex-1 bg-transparent text-xs outline-none placeholder:text-muted-foreground"
                    />
                  </div>
                </div>
                <div className="flex items-center">
                  <span className="w-20 shrink-0 border-r border-border px-3 py-2 text-xs text-muted-foreground">
                    {locale === "pt-BR" ? "Assunto" : "Subject"}
                  </span>
                  <input
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder={
                      locale === "pt-BR"
                        ? "Vaga Frontend Engineer"
                        : "Frontend Engineer Role"
                    }
                    required
                    className="h-8 w-full bg-transparent px-3 text-xs outline-none placeholder:text-muted-foreground"
                  />
                </div>
              </div>

              {/* Body */}
              <Textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder={
                  locale === "pt-BR"
                    ? "Escreva o email ou escolha um template →"
                    : "Write the email or pick a template →"
                }
                required
                className="flex-1 resize-none rounded-none border-0 border-b border-border focus-visible:ring-0"
                style={{ minHeight: 240 }}
              />

              {/* Signature preview */}
              <div className="border-b border-border px-3 py-3">
                {attachCv && (
                  <p className="mb-1 text-xs text-muted-foreground/40 italic">
                    {CV_NOTES[locale]}
                  </p>
                )}
                {sig.map((line, i) => (
                  <p key={i} className="text-xs text-muted-foreground/60">
                    {line}
                  </p>
                ))}
              </div>

              {/* Toolbar */}
              <div className="flex items-center justify-between px-3 py-2">
                <label className="flex cursor-pointer items-center gap-1.5 text-xs text-muted-foreground">
                  <input
                    type="checkbox"
                    checked={attachCv}
                    onChange={(e) => setAttachCv(e.target.checked)}
                    className="accent-foreground"
                  />
                  <Paperclip className="size-3" />
                  {locale === "pt-BR" ? "Currículo" : "Resume"}
                </label>

                <Button type="submit" size="sm" disabled={status === "sending"}>
                  <Send className="size-3" />
                  {status === "sending"
                    ? locale === "pt-BR"
                      ? "Enviando..."
                      : "Sending..."
                    : locale === "pt-BR"
                      ? "Enviar"
                      : "Send"}
                </Button>
              </div>

              {status === "sent" && (
                <p className="px-3 pb-2 text-xs text-muted-foreground">
                  {locale === "pt-BR" ? "Email enviado." : "Email sent."}
                </p>
              )}
              {status === "error" && (
                <p className="px-3 pb-2 text-xs text-destructive">
                  {sendError || (locale === "pt-BR" ? "Erro ao enviar." : "Failed to send.")}
                </p>
              )}
            </form>
          </div>

          {/* Right: Templates */}
          <div className="w-56 shrink-0 flex-col hidden md:flex">
            <div className="border-b border-border px-3 py-2">
              <span className="text-xs text-muted-foreground uppercase tracking-widest">
                {locale === "pt-BR" ? "Templates" : "Templates"}
              </span>
            </div>
            <div className="flex flex-col divide-y divide-border">
              {TEMPLATES.map((template) => (
                <div key={template.id} className="group relative">
                  <button
                    type="button"
                    onClick={() => openTemplateModal(template)}
                    className={`w-full px-3 py-3 text-left text-xs transition-colors hover:bg-muted ${
                      appliedTemplateId === template.id
                        ? "text-foreground"
                        : "text-muted-foreground"
                    }`}
                  >
                    <span className="flex items-center justify-between">
                      {template.label[locale]}
                      {appliedTemplateId === template.id && (
                        <span className="size-1.5 rounded-full bg-foreground" />
                      )}
                    </span>
                  </button>

                  {/* Hover preview */}
                  <div className="pointer-events-none absolute right-full top-0 z-10 mr-2 w-52 border border-border bg-background p-3 opacity-0 shadow-md transition-opacity group-hover:opacity-100">
                    <p className="mb-1 text-xs font-medium">{template.label[locale]}</p>
                    <p className="text-xs leading-relaxed text-muted-foreground">
                      {template.preview[locale]}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Template modal */}
      <Dialog
        open={!!activeTemplate}
        onOpenChange={(open) => !open && setActiveTemplate(null)}
      >
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>{activeTemplate?.label[locale]}</DialogTitle>
          </DialogHeader>

          <div className="flex flex-col gap-3">
            {activeTemplate?.fields.map((field) => (
              <div key={field.key} className="flex flex-col gap-1.5">
                <label className="text-xs text-muted-foreground">
                  {field.label[locale]}
                </label>
                {field.type === "select" && field.options ? (
                  <div className="flex items-center gap-1">
                    {field.options[locale].map((opt) => {
                      const selected =
                        (templateFields[field.key] ?? field.options![locale][0]) === opt;
                      return (
                        <button
                          key={opt}
                          type="button"
                          onClick={() =>
                            setTemplateFields((prev) => ({ ...prev, [field.key]: opt }))
                          }
                          className={`border px-2.5 py-1 text-xs transition-colors ${
                            selected
                              ? "border-foreground bg-foreground text-background"
                              : "border-border text-muted-foreground hover:border-foreground/50"
                          }`}
                        >
                          {opt}
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <Input
                    value={templateFields[field.key] ?? ""}
                    onChange={(e) =>
                      setTemplateFields((prev) => ({
                        ...prev,
                        [field.key]: e.target.value,
                      }))
                    }
                    placeholder={field.placeholder?.[locale]}
                  />
                )}
              </div>
            ))}
          </div>

          <DialogFooter>
            <Button size="sm" onClick={applyTemplate}>
              {locale === "pt-BR" ? "Aplicar" : "Apply"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
