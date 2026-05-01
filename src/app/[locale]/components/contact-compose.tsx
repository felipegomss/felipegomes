"use client";

import { useState, useCallback } from "react";
import { Send, X, Mail } from "lucide-react";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

type Status = "idle" | "sending" | "sent" | "error";

export interface ComposeLabels {
  title: string;
  to: string;
  from: string;
  subject: string;
  message: string;
  placeholderFrom: string;
  placeholderSubject: string;
  placeholderMessage: string;
  send: string;
  sending: string;
  sent: string;
  sentDescription: string;
  error: string;
  shortcut: string;
  close: string;
}

interface ContactComposeProps {
  toEmail: string;
  locale: string;
  labels: ComposeLabels;
}

export function ContactCompose({ toEmail, locale, labels: l }: ContactComposeProps) {
  const [open, setOpen] = useState(false);
  const [fromEmail, setFromEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [trap, setTrap] = useState("");
  const [status, setStatus] = useState<Status>("idle");

  const reset = useCallback(() => {
    setFromEmail("");
    setSubject("");
    setMessage("");
    setTrap("");
    setStatus("idle");
  }, []);

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (!next) setTimeout(reset, 200);
  };

  const handleSend = async () => {
    if (!canSend || status === "sending") return;
    setStatus("sending");

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fromEmail, subject, message, locale, trap }),
      });

      setStatus(res.ok ? "sent" : "error");
    } catch {
      setStatus("error");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      handleSend();
    }
  };

  const canSend = fromEmail.includes("@") && message.trim().length > 0;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <button
          data-umami-event="contact-email"
          className="external-link text-muted-foreground text-sm"
        >
          {toEmail}
        </button>
      </DialogTrigger>

      <DialogContent
        showCloseButton={false}
        className="gap-0 overflow-hidden p-0 sm:max-w-md"
        onKeyDown={handleKeyDown}
      >
        <DialogTitle className="sr-only">{l.title}</DialogTitle>

        {/* Title bar */}
        <div className="flex h-10 items-center justify-between border-b border-border px-4">
          <div className="flex items-center gap-2">
            <Mail size={12} className="text-muted-foreground" aria-hidden />
            <span className="text-xs font-medium">{l.title}</span>
          </div>
          <DialogClose asChild>
            <Button variant="ghost" size="icon-xs" aria-label="Close">
              <X />
            </Button>
          </DialogClose>
        </div>

        {status === "sent" ? (
          <div className="flex flex-col items-center justify-center gap-3 px-8 py-12 text-center">
            <Mail size={20} className="text-muted-foreground" aria-hidden />
            <div>
              <p className="text-sm font-medium">{l.sent}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {l.sentDescription}
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleOpenChange(false)}
            >
              {l.close}
            </Button>
          </div>
        ) : (
          <>
            {/* Honeypot field — hidden from humans */}
            <input
              type="text"
              name="trap"
              value={trap}
              onChange={(e) => setTrap(e.target.value)}
              tabIndex={-1}
              aria-hidden
              className="sr-only"
              autoComplete="off"
            />

            {/* Fields */}
            <div className="divide-y divide-border">
              <div className="flex h-10 items-center gap-4 px-4">
                <span className="w-14 shrink-0 text-xs text-muted-foreground">
                  {l.to}
                </span>
                <span className="text-xs text-muted-foreground-subtle">
                  {toEmail}
                </span>
              </div>

              <div className="flex h-10 items-center gap-4 px-4">
                <label
                  htmlFor="compose-from"
                  className="w-14 shrink-0 text-xs text-muted-foreground"
                >
                  {l.from}
                </label>
                <input
                  id="compose-from"
                  autoFocus
                  type="email"
                  value={fromEmail}
                  onChange={(e) => setFromEmail(e.target.value)}
                  placeholder={l.placeholderFrom}
                  className="flex-1 bg-transparent text-xs outline-none placeholder:text-muted-foreground-subtle"
                  autoComplete="email"
                />
              </div>

              <div className="flex h-10 items-center gap-4 px-4">
                <label
                  htmlFor="compose-subject"
                  className="w-14 shrink-0 text-xs text-muted-foreground"
                >
                  {l.subject}
                </label>
                <input
                  id="compose-subject"
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder={l.placeholderSubject}
                  className="flex-1 bg-transparent text-xs outline-none placeholder:text-muted-foreground-subtle"
                />
              </div>
            </div>

            {/* Body */}
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={l.placeholderMessage}
              className="min-h-44 w-full resize-none bg-transparent p-4 text-sm outline-none placeholder:text-muted-foreground-subtle"
              aria-label={l.message}
            />

            {/* Footer */}
            <div className="flex h-12 items-center justify-between border-t border-border px-4">
              {status === "error" ? (
                <span className="text-2xs text-destructive">{l.error}</span>
              ) : (
                <span className="text-2xs text-muted-foreground-subtle">
                  {l.shortcut}
                </span>
              )}
              <Button
                size="sm"
                onClick={handleSend}
                disabled={!canSend || status === "sending"}
              >
                {status === "sending" ? l.sending : l.send}
                {status !== "sending" && <Send />}
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
