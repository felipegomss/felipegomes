import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { loadPetPage } from "@/lib/pets/repo";
import { PetDashboard } from "./_components/dashboard";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ locale: string; slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const page = await loadPetPage(slug);
  return { title: page?.pet.name ?? "Pets" };
}

export default async function PetPage({ params }: Props) {
  const { locale, slug } = await params;
  const page = await loadPetPage(slug);
  if (!page) notFound();

  return <PetDashboard locale={locale} pet={page.pet} logs={page.logs} nowIso={new Date().toISOString()} />;
}
