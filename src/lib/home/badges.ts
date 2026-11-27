// Indicadores da sidebar: ponto quando um pet tem pendência urgente e a
// contagem de vagas novas. Chave = caminho do item na navegação.
import { getJobStats } from "@/lib/jobs/stats";
import { PET_NAV } from "@/lib/pets/registry";
import { loadPetPage } from "@/lib/pets/repo";
import { taskCounts, todayKey } from "@/lib/tasks/model";
import { listOpenTasks } from "@/lib/tasks/service";
import { petSummary } from "./modules";

export type NavBadge = { dot?: "danger" | "warn"; count?: number; label: string };
export type NavBadges = Record<string, NavBadge>;

export async function getNavBadges(locale: string): Promise<NavBadges> {
  const now = new Date();
  const badges: NavBadges = {};
  const [pets, jobs, tasks] = await Promise.allSettled([
    Promise.all(PET_NAV.map((p) => loadPetPage(p.slug))),
    getJobStats(),
    listOpenTasks(),
  ]);

  if (pets.status === "fulfilled") {
    for (const page of pets.value) {
      if (!page) continue;
      const alerts = petSummary(page.pet, page.logs, { locale, now }).alerts;
      const tone = alerts.some((a) => a.tone === "danger") ? "danger" : alerts.some((a) => a.tone === "warn") ? "warn" : null;
      if (tone) {
        badges[`/${locale}/pets/${page.pet.slug}`] = {
          dot: tone,
          label: `${alerts.length} ${alerts.length === 1 ? "pendência" : "pendências"}`,
        };
      }
    }
  }
  if (jobs.status === "fulfilled" && jobs.value.byStatus.new > 0) {
    const n = jobs.value.byStatus.new;
    badges[`/${locale}/admin/jobs`] = { count: n, label: `${n} ${n === 1 ? "vaga nova" : "vagas novas"}` };
  }
  if (tasks.status === "fulfilled") {
    const c = taskCounts(tasks.value, todayKey(now));
    const n = c.overdue + c.today;
    if (n > 0) {
      badges[`/${locale}/admin/tarefas`] = {
        count: n,
        label: [c.today && `${c.today} para hoje`, c.overdue && `${c.overdue} ${c.overdue === 1 ? "atrasada" : "atrasadas"}`].filter(Boolean).join(", "),
      };
    }
  }
  return badges;
}
