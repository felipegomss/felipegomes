// Pets que aparecem na sidebar. Para adicionar um bicho: uma migration que
// insere a linha em `pets` + uma entrada aqui. `photo` (opcional) fica em
// public/pets/ — quadrada, 256 px, recortada no rosto.
export type PetNavEntry = { slug: string; name: string; photo?: string };

export const PET_NAV: readonly PetNavEntry[] = [
  { slug: "jorgin", name: "Jorgin", photo: "/pets/jorgin.jpg" },
];

export function petPhoto(slug: string): string | undefined {
  return PET_NAV.find((p) => p.slug === slug)?.photo;
}
