"use client";

import { useRouter, useParams } from "next/navigation";
import {
	Avatar,
	AvatarFallback,
	AvatarImage,
} from "@/components/ui/avatar";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LogOutIcon, ExternalLinkIcon } from "lucide-react";

export type NavUserProps = {
	name: string;
	email: string;
	avatarUrl?: string;
};

export function NavUser({ name, email, avatarUrl }: NavUserProps) {
	const router = useRouter();
	const { locale } = useParams<{ locale: string }>();

	async function handleLogout() {
		await fetch("/api/email/session", { method: "DELETE" });
		router.replace(`/${locale}/admin/login`);
	}

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Avatar className="size-8 cursor-pointer">
					{avatarUrl && <AvatarImage src={avatarUrl} alt={name} />}
					<AvatarFallback>{name.charAt(0)}</AvatarFallback>
				</Avatar>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="end" className="w-60">
				<DropdownMenuLabel className="flex items-center gap-3">
					<Avatar className="size-10">
						{avatarUrl && <AvatarImage src={avatarUrl} alt={name} />}
						<AvatarFallback>{name.charAt(0)}</AvatarFallback>
					</Avatar>
					<div className="min-w-0">
						<div className="truncate font-medium text-foreground">{name}</div>
						<div className="truncate text-xs text-muted-foreground">{email}</div>
					</div>
				</DropdownMenuLabel>
				<DropdownMenuSeparator />
				<DropdownMenuGroup>
					<DropdownMenuItem asChild>
						<a href={`/${locale}`} target="_blank" rel="noreferrer">
							<ExternalLinkIcon />
							Ver site
						</a>
					</DropdownMenuItem>
				</DropdownMenuGroup>
				<DropdownMenuSeparator />
				<DropdownMenuItem
					className="cursor-pointer"
					variant="destructive"
					onSelect={handleLogout}
				>
					<LogOutIcon />
					Sair
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
