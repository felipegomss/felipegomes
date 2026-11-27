"use client";

import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export function SignOutButton() {
  const router = useRouter();
  const { locale } = useParams<{ locale: string }>();
  return (
    <Button
      variant="outline"
      size="lg"
      onClick={async () => {
        await fetch("/api/auth/session", { method: "DELETE" });
        router.replace(`/${locale}/admin/login`);
      }}
    >
      Sair
    </Button>
  );
}
