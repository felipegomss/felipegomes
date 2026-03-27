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
    <div className="mx-auto max-w-screen-2xl border-x border-border md:grid md:grid-cols-[0.5fr_1.5fr_1fr] md:min-h-screen">
      <Sidebar locale={locale} />

      <div className="border-b border-border md:hidden">
        <HalftoneImage
          src="/felipe.jpeg"
          alt={contact.name}
          width={3111}
          height={3111}
        />
      </div>

      <ExperienceSection jobs={jobs} />
      <SkillsPanel />
    </div>
  );
}
