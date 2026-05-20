"use client";

import { usePathname, useParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { DecorIcon } from "@/components/ui/decor-icon";
import { Separator } from "@/components/ui/separator";
import { AppBreadcrumbs } from "@/components/app-breadcrumbs";
import { buildNavGroups } from "@/components/app-shared";
import { CustomSidebarTrigger } from "@/components/custom-sidebar-trigger";
import { NavUser } from "@/components/nav-user";

export function AppHeader() {
	const pathname = usePathname();
	const { locale } = useParams<{ locale: string }>();
	const navGroups = buildNavGroups(locale, pathname);
	const activeItem = navGroups
		.flatMap((g) => g.items.flatMap((i) => (i.subItems?.length ? [i, ...i.subItems] : [i])))
		.find((item) => item.isActive);

	return (
		<header
			className={cn(
				"sticky top-0 z-50 flex h-14 shrink-0 items-center justify-between gap-2 border-b px-4 md:px-6",
				"bg-background/95 backdrop-blur-sm supports-backdrop-filter:bg-background/50",
			)}
		>
			<DecorIcon className="hidden md:block" position="bottom-left" />
			<div className="flex items-center gap-3">
				<CustomSidebarTrigger />
				<Separator
					className="mr-2 h-4 data-[orientation=vertical]:self-center"
					orientation="vertical"
				/>
				<AppBreadcrumbs page={activeItem} />
			</div>
			<div className="flex items-center gap-3">
				<NavUser name="Luis Felipe" email="felipe.gomes@automind.co" />
			</div>
		</header>
	);
}
