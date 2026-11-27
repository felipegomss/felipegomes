"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
import {
	BookmarkIcon,
	BriefcaseIcon,
	ChevronRightIcon,
	DropletsIcon,
	EllipsisIcon,
	FingerprintIcon,
	HomeIcon,
	InboxIcon,
	ListChecksIcon,
	ListPlusIcon,
	PawPrintIcon,
	PlugIcon,
	PlusIcon,
	ScaleIcon,
	SendIcon,
	UtensilsIcon,
	WrenchIcon,
} from "lucide-react";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { SnakeIcon } from "@/components/icons/snake-icon";
import { cn } from "@/lib/utils";
import type { NavBadges } from "@/lib/home/badges";
import { PET_NAV } from "@/lib/pets/registry";

type Row = { href: string; label: string; hint?: string; icon: React.ReactNode; tone?: string };

function SheetList({ rows, onPick }: { rows: Row[]; onPick: () => void }) {
	return (
		<ul className="px-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
			{rows.map((r) => (
				<li key={r.href} className="border-b last:border-b-0">
					<Link href={r.href} onClick={onPick} className="flex min-h-[60px] items-center gap-3.5 py-2 outline-none focus-visible:ring-2 focus-visible:ring-ring/60">
						<span aria-hidden="true" className={cn("grid size-10 shrink-0 place-items-center bg-muted [&>svg]:size-5", r.tone)}>
							{r.icon}
						</span>
						<span className="flex min-w-0 flex-1 flex-col gap-0.5">
							<span className="text-sm font-medium">{r.label}</span>
							{r.hint && <span className="text-xs text-muted-foreground">{r.hint}</span>}
						</span>
						<ChevronRightIcon aria-hidden="true" className="size-4 shrink-0 text-muted-foreground" />
					</Link>
				</li>
			))}
		</ul>
	);
}

/**
 * Navegação do app no celular: barra fixa no rodapé (ao alcance do polegar),
 * botão "+" com as ações rápidas e a folha "Mais" com o resto. No desktop a
 * navegação é a sidebar.
 */
export function MobileNav({ badges: badgesPromise }: { badges?: Promise<NavBadges> }) {
	const pathname = usePathname();
	const { locale } = useParams<{ locale: string }>();
	const [badges, setBadges] = useState<NavBadges>({});
	// `kind` continua valendo enquanto a folha fecha, para o conteúdo não trocar na animação.
	const [kind, setKind] = useState<"more" | "add">("more");
	const [open, setOpen] = useState(false);
	const setSheet = (k: "more" | "add" | null) => {
		if (k) setKind(k);
		setOpen(k !== null);
	};

	useEffect(() => {
		let active = true;
		if (badgesPromise) Promise.resolve(badgesPromise).then((b) => active && setBadges(b), () => {});
		return () => {
			active = false;
		};
	}, [badgesPromise]);

	const base = `/${locale}/admin`;
	const pet = PET_NAV[0];
	const petPath = pet ? `/${locale}/pets/${pet.slug}` : null;
	const tabs = [
		{ href: base, label: "Início", icon: <HomeIcon />, active: pathname === base },
		{ href: `${base}/tarefas`, label: "Tarefas", icon: <ListChecksIcon />, active: pathname.startsWith(`${base}/tarefas`) },
		{ href: `${base}/salvos`, label: "Salvos", icon: <BookmarkIcon />, active: pathname.startsWith(`${base}/salvos`) },
		...(pet && petPath
			? [{ href: petPath, label: pet.name, icon: pet.icon === "snake" ? <SnakeIcon /> : <PawPrintIcon />, active: pathname.startsWith(petPath) }]
			: []),
	];
	const moreActive = !tabs.some((t) => t.active);
	const jobs = badges[`${base}/jobs`];

	const more: Row[] = [
		{ href: `${base}/jobs`, label: "Vagas", hint: jobs?.label, icon: <BriefcaseIcon /> },
		{ href: `${base}/email`, label: "Compor email", icon: <SendIcon /> },
		{ href: `${base}/email/sent`, label: "Emails enviados", icon: <InboxIcon /> },
		{ href: `${base}/tools`, label: "Ferramentas", icon: <WrenchIcon /> },
		{ href: `${base}/conta`, label: "Acesso e passkeys", icon: <FingerprintIcon /> },
		{ href: `${base}/conta/integracoes`, label: "Integrações", icon: <PlugIcon /> },
	];
	const add: Row[] = [
		{ href: `${base}/tarefas?nova`, label: "Nova tarefa", hint: "“pagar a fatura sexta #casa”", icon: <ListPlusIcon /> },
		{ href: `${base}/salvos?novo`, label: "Salvar link", icon: <BookmarkIcon /> },
		...(pet && petPath
			? [
					{ href: `${petPath}?registrar=feeding`, label: `${pet.name} comeu`, icon: <UtensilsIcon />, tone: "text-amber-600 dark:text-amber-400" },
					{ href: `${petPath}?registrar=weight`, label: `Pesar ${pet.name}`, icon: <ScaleIcon />, tone: "text-emerald-700 dark:text-emerald-400" },
					{ href: `${petPath}?registrar=water`, label: "Fiz TPA", icon: <DropletsIcon />, tone: "text-blue-700 dark:text-blue-400" },
				]
			: []),
		{ href: `${base}/email`, label: "Compor email", icon: <SendIcon />, tone: "text-muted-foreground" },
	];

	// Salvos já tem o campo de salvar fixo no rodapé: o "+" sairia por cima dele.
	const showFab = !pathname.startsWith(`${base}/salvos`);
	const TAB = "relative flex flex-col items-center justify-center gap-0.5 border-t-2 text-[11px] outline-none focus-visible:bg-muted [&>svg]:size-[22px]";

	return (
		<>
			{showFab && (
				<button
					type="button"
					onClick={() => setSheet("add")}
					aria-label="Registrar"
					className="fixed right-4 bottom-[calc(var(--mobile-nav-h)+1rem)] z-40 grid size-14 place-items-center bg-primary text-primary-foreground shadow-lg shadow-black/40 outline-none focus-visible:ring-2 focus-visible:ring-ring md:hidden"
				>
					<PlusIcon aria-hidden="true" className="size-6" />
				</button>
			)}

			<nav
				aria-label="Navegação principal"
				className="fixed inset-x-0 bottom-0 z-40 grid h-[var(--mobile-nav-h)] grid-cols-5 border-t bg-background pb-[env(safe-area-inset-bottom)] md:hidden"
			>
				{tabs.map((t) => {
					const badge = badges[t.href];
					return (
						<Link
							key={t.href}
							href={t.href}
							aria-current={t.active ? "page" : undefined}
							className={cn(TAB, t.active ? "border-foreground font-semibold text-foreground" : "border-transparent text-muted-foreground")}
						>
							{t.icon}
							{t.label}
							{badge?.count !== undefined && (
								<span aria-hidden="true" className="absolute top-1 left-[calc(50%+6px)] grid h-4 min-w-4 place-items-center bg-red-600 px-1 text-[10px] font-bold text-white dark:bg-red-400 dark:text-neutral-950">
									{badge.count}
								</span>
							)}
							{badge?.dot && <span aria-hidden="true" className={cn("absolute top-1.5 left-[calc(50%+8px)] size-2", badge.dot === "danger" ? "bg-red-600 dark:bg-red-400" : "bg-amber-500")} />}
							{badge && <span className="sr-only">, {badge.label}</span>}
						</Link>
					);
				})}
				<button
					type="button"
					onClick={() => setSheet("more")}
					aria-haspopup="dialog"
					aria-current={moreActive ? "page" : undefined}
					className={cn(TAB, moreActive ? "border-foreground font-semibold text-foreground" : "border-transparent text-muted-foreground")}
				>
					<EllipsisIcon />
					Mais
					{jobs?.count !== undefined && <span aria-hidden="true" className="absolute top-1.5 left-[calc(50%+8px)] size-2 bg-blue-600 dark:bg-blue-400" />}
				</button>
			</nav>

			<Sheet open={open} onOpenChange={(v) => !v && setSheet(null)}>
				<SheetContent side="bottom" className="max-h-[85dvh] gap-0 overflow-y-auto md:hidden">
					<SheetHeader>
						<SheetTitle className="font-heading text-base">{kind === "add" ? "Registrar" : "Mais"}</SheetTitle>
						<SheetDescription className="sr-only">{kind === "add" ? "Ações rápidas" : "Outras áreas do app"}</SheetDescription>
					</SheetHeader>
					<SheetList rows={kind === "add" ? add : more} onPick={() => setSheet(null)} />
				</SheetContent>
			</Sheet>
		</>
	);
}
