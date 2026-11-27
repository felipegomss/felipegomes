"use client";

import { useEffect, useState } from "react";
import { usePathname, useParams } from "next/navigation";
import { cn } from "@/lib/utils";
import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarHeader,
	SidebarMenuButton,
} from "@/components/ui/sidebar";
import { useTranslations } from "next-intl";
import { buildNavGroups } from "@/components/app-shared";
import type { NavBadges } from "@/lib/home/badges";
import { NavGroup } from "@/components/nav-group";

/**
 * `badges` chega como promessa do servidor: o menu aparece na hora e os
 * contadores entram quando o banco responder (sem segurar a página).
 */
export function AppSidebar({ badges: badgesPromise }: { badges?: Promise<NavBadges> }) {
	const [badges, setBadges] = useState<NavBadges>({});
	useEffect(() => {
		let active = true;
		// O que vem do servidor é um "thenable" do React: Promise.resolve normaliza.
		if (badgesPromise) Promise.resolve(badgesPromise).then((b) => active && setBadges(b), () => {});
		return () => {
			active = false;
		};
	}, [badgesPromise]);
	const pathname = usePathname();
	const { locale } = useParams<{ locale: string }>();
	const tTools = useTranslations("tools");
	const navGroups = buildNavGroups(locale, pathname, (k) => tTools(k), badges);

	return (
		<Sidebar
			className={cn(
				"*:data-[slot=sidebar-inner]:bg-background",
				"*:data-[slot=sidebar-inner]:dark:bg-[radial-gradient(60%_18%_at_10%_0%,--theme(--color-foreground/.08),transparent)]",
				"**:data-[slot=sidebar-menu-button]:[&>span]:text-foreground/75",
			)}
			collapsible="icon"
			variant="sidebar"
		>
			<SidebarHeader className="h-14 justify-center border-b px-2">
				<SidebarMenuButton asChild>
					<a href={`/${locale}`}>
						<span className="font-heading font-bold text-foreground! tracking-tight">
							LFNG
						</span>
					</a>
				</SidebarMenuButton>
			</SidebarHeader>
			<SidebarContent>
				{navGroups.map((group, index) => (
					<NavGroup key={`sidebar-group-${index}`} {...group} />
				))}
			</SidebarContent>
			<SidebarFooter className="gap-0 p-0">
				<div className="px-4 pt-4 pb-2 transition-opacity group-data-[collapsible=icon]:pointer-events-none group-data-[collapsible=icon]:opacity-0">
					<p className="text-nowrap text-[9px] text-muted-foreground">
						© {new Date().getFullYear()} Luis Felipe Gomes
					</p>
				</div>
			</SidebarFooter>
		</Sidebar>
	);
}
