import { Suspense } from "react";
import { cn } from "@/lib/utils";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { AppHeader } from "@/components/app-header";
import { AppSidebar } from "@/components/app-sidebar";
import type { NavBadges } from "@/lib/home/badges";

/**
 * Casca do app. `badges` é uma promessa: o menu aparece na hora (sem os
 * contadores) e eles chegam quando o banco responder, em vez de a página
 * inteira esperar.
 */
export function AppShell({ children, badges }: { children: React.ReactNode; badges?: Promise<NavBadges> }) {
	return (
		<SidebarProvider className={cn("[--app-wrapper-max-width:80rem]")}>
			<AppSidebar badges={badges} />
			<SidebarInset>
				<AppHeader />
				<div
					className={cn(
						"flex flex-1 flex-col p-4 md:p-6",
						"mx-auto w-full max-w-(--app-wrapper-max-width)"
					)}
				>
					{/* Streaming: a casca (e a animação de abertura) chega antes dos
					    dados da página. Sem `key`, ao navegar a tela atual fica até
					    a próxima estar pronta — nada de esqueleto entre telas. */}
					<Suspense fallback={null}>{children}</Suspense>
				</div>
			</SidebarInset>
		</SidebarProvider>
	);
}
