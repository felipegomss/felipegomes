"use client";

import { useEffect } from "react";
import { useRouter, useParams } from "next/navigation";

export function AdminHotkey() {
  const router = useRouter();
  const { locale } = useParams<{ locale: string }>();

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.ctrlKey && e.metaKey && (e.key === "a" || e.key === "A")) {
        e.preventDefault();
        router.push(`/${locale}/admin`);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [router, locale]);

  return null;
}
