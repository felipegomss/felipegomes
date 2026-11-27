import type { ReactNode } from "react";
import { HomeIcon, SendIcon, InboxIcon, BriefcaseIcon } from "lucide-react";
import { SnakeIcon } from "@/components/icons/snake-icon";
import { PET_NAV } from "@/lib/pets/registry";

export type SidebarNavItem = {
	title: string;
	path?: string;
	icon?: ReactNode;
	isActive?: boolean;
	subItems?: SidebarNavItem[];
};

export type SidebarNavGroup = {
	label?: string;
	items: SidebarNavItem[];
};

/** Build nav groups for a given locale. `pathname` decides which item is active. */
export function buildNavGroups(locale: string, pathname: string): SidebarNavGroup[] {
	const base = `/${locale}/admin`;
	const is = (path: string) => pathname === path;
	const startsWith = (path: string) => pathname === path || pathname.startsWith(`${path}/`);

	return [
		{
			label: "Home",
			items: [
				{
					title: "Visão geral",
					path: base,
					icon: <HomeIcon />,
					isActive: is(base),
				},
			],
		},
		{
			label: "Email",
			items: [
				{
					title: "Compor",
					path: `${base}/email`,
					icon: <SendIcon />,
					isActive: is(`${base}/email`),
				},
				{
					title: "Enviados",
					path: `${base}/email/sent`,
					icon: <InboxIcon />,
					isActive: startsWith(`${base}/email/sent`),
				},
			],
		},
		{
			label: "Vagas",
			items: [
				{
					title: "Lista",
					path: `${base}/jobs`,
					icon: <BriefcaseIcon />,
					isActive: startsWith(`${base}/jobs`),
				},
			],
		},
		{
			label: "Pets",
			items: PET_NAV.map((pet) => ({
				title: pet.name,
				path: `/${locale}/pets/${pet.slug}`,
				icon: <SnakeIcon />,
				isActive: startsWith(`/${locale}/pets/${pet.slug}`),
			})),
		},
	];
}

export const footerNavLinks: SidebarNavItem[] = [];
