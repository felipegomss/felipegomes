import { memo } from "react";
import Link from "next/link";
import { ChevronRightIcon } from "lucide-react";
import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
	SidebarGroup,
	SidebarGroupLabel,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
	SidebarMenuSub,
	SidebarMenuSubButton,
	SidebarMenuSubItem,
} from "@/components/ui/sidebar";
import type { SidebarNavGroup, SidebarNavItem } from "@/components/app-shared";

function NavBadgeMark({ badge }: { badge: NonNullable<SidebarNavItem["badge"]> }) {
	return (
		<span className="ml-auto flex items-center group-data-[collapsible=icon]:hidden" title={badge.label}>
			<span className="sr-only">{badge.label}</span>
			{badge.count !== undefined && (
				<span aria-hidden="true" className="text-[11px] tabular-nums text-muted-foreground">
					{badge.count}
				</span>
			)}
			{badge.dot && (
				<span
					aria-hidden="true"
					className={badge.dot === "danger" ? "size-1.5 bg-red-600 dark:bg-red-400" : "size-1.5 bg-amber-500"}
				/>
			)}
		</span>
	);
}

function LeafItem({ item }: { item: SidebarNavItem }) {
	return (
		<SidebarMenuItem>
			<SidebarMenuButton asChild isActive={item.isActive}>
				<Link href={item.path ?? "#"} prefetch>
					{item.icon}
					<span>{item.title}</span>
					{item.badge && <NavBadgeMark badge={item.badge} />}
				</Link>
			</SidebarMenuButton>
		</SidebarMenuItem>
	);
}

function BranchItem({ item }: { item: SidebarNavItem }) {
	return (
		<Collapsible
			asChild
			className="group/collapsible"
			defaultOpen={!!item.isActive || item.subItems?.some((i) => !!i.isActive)}
		>
			<SidebarMenuItem>
				<CollapsibleTrigger asChild>
					<SidebarMenuButton isActive={item.isActive}>
						{item.icon}
						<span>{item.title}</span>
						<ChevronRightIcon className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
					</SidebarMenuButton>
				</CollapsibleTrigger>
				<CollapsibleContent>
					<SidebarMenuSub>
						{item.subItems?.map((sub) => (
							<SidebarMenuSubItem key={sub.title}>
								<SidebarMenuSubButton asChild isActive={sub.isActive}>
									<Link href={sub.path ?? "#"} prefetch>
										{sub.icon}
										<span>{sub.title}</span>
									</Link>
								</SidebarMenuSubButton>
							</SidebarMenuSubItem>
						))}
					</SidebarMenuSub>
				</CollapsibleContent>
			</SidebarMenuItem>
		</Collapsible>
	);
}

function NavGroupImpl({ label, items }: SidebarNavGroup) {
	return (
		<SidebarGroup>
			{label && <SidebarGroupLabel>{label}</SidebarGroupLabel>}
			<SidebarMenu>
				{items.map((item) =>
					item.subItems?.length ? (
						<BranchItem key={item.title} item={item} />
					) : (
						<LeafItem key={item.title} item={item} />
					),
				)}
			</SidebarMenu>
		</SidebarGroup>
	);
}

export const NavGroup = memo(NavGroupImpl);
