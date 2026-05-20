import type { ReactNode } from "react";
import { HomeIcon, SendIcon, InboxIcon, BriefcaseIcon } from "lucide-react";

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
	];
}

export const footerNavLinks: SidebarNavItem[] = [];
