import { Resend } from "resend";

export type EmailStats = {
  available: boolean;
  total: number;
  last7Days: number;
  delivered: number;
  deliveryRate: number | null;
  lastSentAt: Date | null;
  lastSubject: string | null;
  error?: string;
};

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

const SUCCESS_EVENTS = new Set(["delivered", "opened", "clicked", "sent"]);

export async function getEmailStats(): Promise<EmailStats> {
  const empty: EmailStats = {
    available: false,
    total: 0,
    last7Days: 0,
    delivered: 0,
    deliveryRate: null,
    lastSentAt: null,
    lastSubject: null,
  };

  if (!process.env.RESEND_API_KEY) {
    return { ...empty, error: "RESEND_API_KEY não configurada" };
  }

  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    const { data, error } = await resend.emails.list({ limit: 100 });
    if (error) return { ...empty, error: error.message ?? "Resend error" };

    const emails = data?.data ?? [];
    const cutoff = Date.now() - SEVEN_DAYS_MS;
    let last7Days = 0;
    let delivered = 0;
    let lastSentAt: Date | null = null;
    let lastSubject: string | null = null;

    for (const e of emails) {
      const created = new Date(e.created_at);
      if (created.getTime() >= cutoff) last7Days += 1;
      if (SUCCESS_EVENTS.has(e.last_event)) delivered += 1;
      if (!lastSentAt || created > lastSentAt) {
        lastSentAt = created;
        lastSubject = e.subject;
      }
    }

    return {
      available: true,
      total: emails.length,
      last7Days,
      delivered,
      deliveryRate: emails.length > 0 ? delivered / emails.length : null,
      lastSentAt,
      lastSubject,
    };
  } catch (e) {
    return { ...empty, error: e instanceof Error ? e.message : String(e) };
  }
}
