import { Suspense } from "react";
import { cn } from "@/lib/utils";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { AppHeader } from "@/components/app-header";
import { AppSidebar } from "@/components/app-sidebar";
import { MobileNav } from "@/components/mobile-nav";
import { PullToRefresh } from "@/components/pull-to-refresh";
import type { NavBadges } from "@/lib/home/badges";

/**
 * Casca do app. `badges` é uma promessa: o menu aparece na hora (sem os
 * contadores) e eles chegam quando o banco responder, em vez de a página
 * inteira esperar.
 */
export function AppShell({ children, badges }: { children: React.ReactNode; badges?: Promise<NavBadges> }) {
	return (
		<SidebarProvider className={cn("app-touch [--app-wrapper-max-width:80rem]")}>
			<AppSidebar badges={badges} />
			<SidebarInset>
				<AppHeader />
				<div
					className={cn(
						// No celular sobra espaço para a barra do rodapé e o botão "+".
						"flex flex-1 flex-col p-4 max-md:pb-[calc(var(--mobile-nav-h)+5.5rem)] md:p-6",
						"mx-auto w-full max-w-(--app-wrapper-max-width)"
					)}
				>
					{/* Streaming: a casca (e a animação de abertura) chega antes dos
					    dados da página. Sem `key`, ao navegar a tela atual fica até
					    a próxima estar pronta — nada de esqueleto entre telas. */}
					<Suspense fallback={null}>{children}</Suspense>
				</div>
			</SidebarInset>
			<MobileNav badges={badges} />
			<PullToRefresh />
		</SidebarProvider>
	);
}
