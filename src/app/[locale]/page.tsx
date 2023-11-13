// "use client";

import Header from "../components/Header";
import Hero from "../components/Hero";
import About from "../components/About";
import Projects from "../components/Projects";
import Articles from "../components/Articles";
import Repos from "../components/Repos";
import Contact from "../components/Contact";
import LocaleToggle from "../components/LocaleToggle";
import { useTranslations } from "next-intl";
import Footer from "../components/Footer";

export default function Home() {
  const tHead = useTranslations("Header");
  const tHero = useTranslations("Hero");
  const tAbout = useTranslations("About");
  const tContact = useTranslations("Contact");

  return (
    <main>
      <Header title={tHead("title")} />
      <Hero
        title={tHero("title")}
        greeting={tHero("greeting")}
        paragraph={tHero("paragraph")}
      />
      <About paragraph={tAbout("paragraph")} button={tAbout("button")} />
      <Projects />
      <Articles />
      <Repos />
      <Contact title={tContact("title")} wppCall={tContact("wppCall")} />
      <Footer />
      <LocaleToggle />
    </main>
  );
}
