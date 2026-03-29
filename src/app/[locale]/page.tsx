import { setRequestLocale } from "next-intl/server";
import { contact } from "@/lib/constants";
import { jobs } from "./data/portfolio";
import { Sidebar } from "./components/sidebar";
import { ExperienceSection } from "./components/experience-section";
import { SkillsPanel } from "./components/skills-panel";
import { HalftoneImage } from "./components/halftone-image";

export default async function Home({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <div className="mx-auto max-w-7xl border-x border-border md:grid md:grid-cols-[260px_1fr_1fr] md:min-h-screen">
      <Sidebar locale={locale} />

      <div className="border-b border-border md:hidden">
        <HalftoneImage
          src="/felipe.jpeg"
          alt={contact.name}
          width={1200}
          height={1200}
        />
      </div>

      <ExperienceSection jobs={jobs} />
      <SkillsPanel />
    </div>
  );
}
