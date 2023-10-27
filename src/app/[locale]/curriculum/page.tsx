import { useTranslations } from "next-intl";
import { Gloock } from "next/font/google";

const josefin = Gloock({
  subsets: ["latin"],
  weight: "400",
});

export default function Curriculum() {
  const t = useTranslations("Curriculum");
  return (
    <div className="min-h-screen bg-stone-100">
      <main className="flex flex-col gap-8 px-4 py-10 m-auto sm:px-0 max-w-7xl">
        <section>
          <div className="grid sm:grid-cols-2">
            <div>
              <h1 className={`text-4xl sm:text-6xl ${josefin.className}`}>
                Luis Felipe
                <br /> Nascimento
                <br /> Gomes
              </h1>
              <h2 className="my-4 text-xl font-black text-stone-600">
                FullStack Developer
              </h2>
            </div>
            <aside className="flex flex-col items-end justify-center gap-2">
              <a href="http://felipegomes.me" target="_blank">
                felipegomes.me
              </a>
              <a href="http://github.com/felipegomss" target="_blank">
                github.com/felipegomss
              </a>
              <a href="tel:+5571994178164" target="_blank">
                +55 (71) 9 9417-8164
              </a>
              <a href="mailto:contato@felipegomes.me" target="_blank">
                contato@felipegomes.me
              </a>
              <a href="https://www.linkedin.com/in/felipegomss" target="_blank">
                linkedin.com/in/felipegomss
              </a>
            </aside>
          </div>
        </section>
        <section>
          <h3 className={`flex gap-4 my-4 text-4xl ${josefin.className}`}>
            <div className="flex items-center justify-center w-10 h-10 text-2xl border border-black rounded-full">
              1
            </div>
            {t("profile.title")}
          </h3>
          <p>{t("profile.description")}</p>
        </section>
        <section>
          <h3 className={`flex gap-4 my-4 text-4xl ${josefin.className}`}>
            <div className="flex items-center justify-center w-10 h-10 text-2xl border border-black rounded-full">
              2
            </div>
            {t("skills.title")}
          </h3>
          <div className="grid grid-cols-3 sm:gap-6">
            <ul>
              <li>ReactJs</li>
              <li>NextJs</li>
              <li>TypeScript</li>
              <li>UX</li>
            </ul>
            <ul>
              <li>NodeJs</li>
              <li>Golang</li>
              <li>Rest API</li>
              <li>MongoDB</li>
            </ul>
            <ul>
              <li>SQL</li>
              <li>NestJS</li>
              <li>Git</li>
              <li>Rest API</li>
            </ul>
          </div>
        </section>
        <section>
          <h3 className={`flex gap-4 my-4 text-4xl ${josefin.className}`}>
            <div className="flex items-center justify-center w-10 h-10 text-2xl border border-black rounded-full">
              3
            </div>
            {t("employment.title")}
          </h3>
          <ul className="grid gap-6 md:grid-cols-3">
            <li className="flex flex-col gap-2">
              <div>
                <h5 className="text-sm font-bold text-stone-600">
                  {t("employment.brandMonitor.title")}
                </h5>
                <div className="flex items-center justify-between">
                  <a href="" target="_blank">
                    <h4 className="font-bold">Brand Monitor</h4>
                  </a>
                  <p className="text-xs">09.2023 - Momento</p>
                </div>
              </div>
              <p>{t("employment.brandMonitor.description")}</p>
            </li>
            <li className="flex flex-col gap-2">
              <div>
                <h5 className="text-sm font-bold text-stone-600">
                  {t("employment.eisa.title")}
                </h5>
                <div className="flex items-center justify-between">
                  <a href="" target="_blank">
                    <h4 className="font-bold">Ericsson Inovação S.A</h4>
                  </a>
                  <p className="text-xs">05.2021 - 04.2023</p>
                </div>
              </div>
              <p>{t("employment.eisa.description")}</p>
            </li>
            <li className="flex flex-col gap-2">
              <div>
                <h5 className="text-sm font-bold text-stone-600">
                  {t("employment.parallel.title")}
                </h5>
                <div className="flex items-center justify-between">
                  <a href="" target="_blank">
                    <h4 className="font-bold">
                      Parallel Consulting & Training
                    </h4>
                  </a>
                  <p className="text-xs">09.2020 - 04.2021</p>
                </div>
              </div>
              <p>{t("employment.parallel.description")}</p>
            </li>
          </ul>
        </section>
      </main>
    </div>
  );
}
