import type { Metadata } from "next";
import { listDoneTasks, listOpenTasks } from "@/lib/tasks/service";
import { listsOf, todayKey } from "@/lib/tasks/model";
import { TasksView } from "./_components/tasks-view";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Tarefas" };

export default async function TasksPage({ searchParams }: { searchParams: Promise<{ nova?: string }> }) {
  const [{ nova }, open, done] = await Promise.all([searchParams, listOpenTasks(), listDoneTasks()]);
  return (
    <TasksView
      open={open}
      done={done}
      lists={listsOf([...open, ...done])}
      today={todayKey()}
      focusAdd={nova !== undefined}
    />
  );
}
