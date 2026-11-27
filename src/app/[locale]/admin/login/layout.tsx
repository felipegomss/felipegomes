import type { Metadata } from "next";
import { appMetadata, appViewport } from "@/lib/app-metadata";

export const metadata: Metadata = { ...appMetadata, title: "Entrar" };
export const viewport = appViewport;

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return children;
}
