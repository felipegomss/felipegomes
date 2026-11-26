import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { loadPetPage } from "@/lib/pets/repo";
import { PetHistory } from "../_components/history";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ locale: string; slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const page = await loadPetPage(slug);
  return { title: page ? `Histórico · ${page.pet.name}` : "Pets" };
}

export default async function PetHistoryPage({ params }: Props) {
  const { slug } = await params;
  const page = await loadPetPage(slug);
  if (!page) notFound();

  return <PetHistory pet={page.pet} logs={page.logs} />;
}
