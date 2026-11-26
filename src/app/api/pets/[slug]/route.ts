import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth";
import { loadPetPage } from "@/lib/pets/repo";

type Ctx = { params: Promise<{ slug: string }> };

export async function GET(_request: Request, { params }: Ctx) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { slug } = await params;
  const page = await loadPetPage(slug);
  if (!page) return NextResponse.json({ error: "Não encontrado." }, { status: 404 });

  return NextResponse.json(page);
}
