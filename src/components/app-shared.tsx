import type { ReactNode } from "react";
import {
	BriefcaseIcon,
	FingerprintIcon,
	HomeIcon,
	InboxIcon,
	LayoutGridIcon,
	ListChecksIcon,
	PawPrintIcon,
	SendIcon,
	WrenchIcon,
} from "lucide-react";
import { SnakeIcon } from "@/components/icons/snake-icon";
import { PET_NAV } from "@/lib/pets/registry";
import { tools } from "@/lib/tools";
import type { NavBadge, NavBadges } from "@/lib/home/badges";

export type SidebarNavItem = {
	title: string;
	path?: string;
	icon?: ReactNode;
	isActive?: boolean;
	badge?: NavBadge;
	subItems?: SidebarNavItem[];
};

export type SidebarNavGroup = {
	label?: string;
	items: SidebarNavItem[];
};

/** Tradutor do namespace "tools" (títulos das ferramentas). */
type ToolsT = (key: string) => string;

/**
 * Navegação do app (área autenticada). `pathname` decide o item ativo.
 * Módulo novo = um grupo/item aqui (e, se tiver resumo, um módulo da home).
 */
export function buildNavGroups(
	locale: string,
	pathname: string,
	tTools?: ToolsT,
	badges: NavBadges = {},
): SidebarNavGroup[] {
	const base = `/${locale}/admin`;
	const is = (path: string) => pathname === path;
	const startsWith = (path: string) => pathname === path || pathname.startsWith(`${path}/`);

	const toolsBase = `${base}/tools`;
	const toolItems: SidebarNavItem[] = [
		{ title: "Todas", path: toolsBase, icon: <LayoutGridIcon />, isActive: is(toolsBase) },
		...tools.map((tool) => ({
			title: tTools ? tTools(tool.titleKey) : tool.slug,
			path: `${toolsBase}/${tool.slug}`,
			isActive: is(`${toolsBase}/${tool.slug}`),
		})),
	];

	const groups: SidebarNavGroup[] = [
		{
			items: [
				{ title: "Início", path: base, icon: <HomeIcon />, isActive: is(base) },
				{ title: "Tarefas", path: `${base}/tarefas`, icon: <ListChecksIcon />, isActive: startsWith(`${base}/tarefas`) },
			],
		},
		{
			label: "Pets",
			items: PET_NAV.map((pet) => ({
				title: pet.name,
				path: `/${locale}/pets/${pet.slug}`,
				// Ícone da espécie (a foto fica como avatar dentro da página).
				icon: pet.icon === "snake" ? <SnakeIcon /> : <PawPrintIcon />,
				isActive: startsWith(`/${locale}/pets/${pet.slug}`),
			})),
		},
		{
			label: "Trabalho",
			items: [
				{ title: "Vagas", path: `${base}/jobs`, icon: <BriefcaseIcon />, isActive: startsWith(`${base}/jobs`) },
				{ title: "Compor email", path: `${base}/email`, icon: <SendIcon />, isActive: is(`${base}/email`) },
				{
					title: "Emails enviados",
					path: `${base}/email/sent`,
					icon: <InboxIcon />,
					isActive: startsWith(`${base}/email/sent`),
				},
			],
		},
		{
			label: "Ferramentas",
			items: [
				{
					title: "Ferramentas",
					icon: <WrenchIcon />,
					isActive: startsWith(toolsBase),
					subItems: toolItems,
				},
			],
		},
		{
			label: "Conta",
			items: [
				{
					title: "Acesso e passkeys",
					path: `${base}/conta`,
					icon: <FingerprintIcon />,
					isActive: startsWith(`${base}/conta`),
				},
			],
		},
	];

	for (const group of groups) {
		for (const item of group.items) if (item.path && badges[item.path]) item.badge = badges[item.path];
	}
	return groups;
}

export const footerNavLinks: SidebarNavItem[] = [];
