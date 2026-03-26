export const contact = {
  name: "Luis Felipe Nascimento Gomes",
  location: "Salvador/BA — Brasil",
  email: "luisfng123@gmail.com",
  phone: "(71) 9 9265-5188",
  linkedin: "linkedin.com/in/felipegomss",
  github: "github.com/felipegomss",
};

export const skills = [
  "JavaScript/TypeScript", "Go (Golang)", "Python", "Java", "Ruby", "PHP",
  "React.js", "AngularJS", "Node.js", "NestJS", "Next.js",
  "RabbitMQ", "Apache Kafka", "GraphQL",
  "MySQL", "MongoDB", "Oracle PL/SQL", "PostgreSQL",
  "AWS", "Azure", "Oracle", "Heroku", "Docker", "GitHub Actions",
  "Linux", "Selenium", "Cucumber", "Papertrail",
];

export type CvStrings = {
  objective: string;
  subtitle: string;
  sections: {
    experience: string;
    education: string;
    skills: string;
  };
  education: {
    mba: string;
    mbaInfo: string;
    degree: string;
    degreeInfo: string;
    degreeCore: string;
  };
  jobs: {
    company: string;
    role: string;
    period: string;
    location?: string;
    highlights: string[];
  }[];
};

export const cvStrings: Record<string, CvStrings> = {
  "pt-BR": {
    objective: "Desenvolvedor Full Stack",
    subtitle: "Arq. Escalável & Foco em Produto",
    sections: {
      experience: "Experiência Profissional",
      education: "Educação",
      skills: "Skills Técnicas",
    },
    education: {
      mba: "MBA em Engenharia de Software",
      mbaInfo: "USP/Esalq — 2026 (em andamento)",
      degree: "Análise e Desenvolvimento de Sistemas",
      degreeInfo: "Faculdade Estácio — 2025 · CR: 8,52/10",
      degreeCore: "Core: Java, Python, JavaScript, SQL, Android e Cloud Computing.",
    },
    jobs: [
      {
        company: "Automind",
        role: "Analista de Software",
        period: "06.2024 — atual",
        location: "Salvador/BA",
        highlights: [
          "Liderei a reconstrução da UX da principal plataforma SaaS de logística (AUTOLOAD) — interface moderna e responsiva em React/Next.js, integrada ao backend.",
          "Desenvolvi o frontend completo do AUTOMED, sistema de gestão de medições compatível com a norma ABNT NBR ISO 10012, em AngularJS.",
          "Mantenho aplicações em ambiente Azure e Oracle como parte da modernização da arquitetura.",
          "Conduzi code reviews e padronizei o fluxo de Pull Requests do time.",
          "Defini especificações técnicas e planejei Sprints junto com Produto, UX/UI e Backend.",
        ],
      },
      {
        company: "Branddi",
        role: "Desenvolvedor FullStack",
        period: "04.2023 — 06.2024",
        location: "Remoto",
        highlights: [
          "Arquitetei uma solução End-to-End de gestão de infrações — core em REST (NestJS) com integrações ao Pipefy via GraphQL.",
          "Integrei Go (Golang) com filas RabbitMQ para processar dados em massa via Web Crawlers e microsserviços.",
          "Montei a stack de observabilidade: logs centralizados (Papertrail), alertas de Healthcheck e monitoramento de Downtime.",
          "Gerenciei deploys em AWS e automatizei pipelines de CI/CD com GitHub Actions.",
          "Liderei aprovação de PRs e defini a estratégia de testes unitários do time.",
        ],
      },
      {
        company: "EISA",
        role: "Analista de Software — QA",
        period: "05.2021 — 04.2023",
        location: "Remoto",
        highlights: [
          "Automatizei testes E2E com Selenium WebDriver, Cucumber e Ruby para sistemas da VIVO — 90M+ usuários.",
          "Validei fluxos assíncronos em Apache Kafka e executei scripts PL/SQL (Oracle) em ambiente Linux.",
          "Liderei a migração de repositórios legados (TortoiseSVN → GitLab).",
        ],
      },
      {
        company: "Parallel Consulting & Training",
        role: "Desenvolvedor FullStack",
        period: "09.2020 — 04.2021",
        location: "Salvador/BA",
        highlights: [
          "Desenvolvi funcionalidades em React (frontend) e Node.js (backend) que melhoraram a conversão de vendas da plataforma.",
          "Criei APIs auxiliares em Python e gerenciei a persistência de dados em MySQL.",
          "Mantive a infraestrutura de hospedagem via cPanel.",
          "Participei dos rituais ágeis (Scrum/Kanban) e mantive o tracking de tarefas atualizado.",
        ],
      },
    ],
  },
  en: {
    objective: "Full Stack Developer",
    subtitle: "Scalable Architecture & Product Focus",
    sections: {
      experience: "Professional Experience",
      education: "Education",
      skills: "Technical Skills",
    },
    education: {
      mba: "MBA in Software Engineering",
      mbaInfo: "USP/Esalq — 2026 (in progress)",
      degree: "Systems Analysis & Development",
      degreeInfo: "Faculdade Estácio — 2025 · GPA: 8.52/10",
      degreeCore: "Core: Java, Python, JavaScript, SQL, Android & Cloud Computing.",
    },
    jobs: [
      {
        company: "Automind",
        role: "Software Analyst",
        period: "06.2024 — present",
        location: "Salvador/BA",
        highlights: [
          "Led the UX rebuild of the main logistics SaaS platform (AUTOLOAD) — modern, responsive interface in React/Next.js integrated with the backend.",
          "Built the complete frontend for AUTOMED, a measurement management system compliant with ABNT NBR ISO 10012, using AngularJS.",
          "Maintain applications in Azure and Oracle environments as part of the tech architecture modernization.",
          "Ran code reviews and standardized the team's Pull Request workflow.",
          "Defined technical specs and planned Sprints with Product, UX/UI and Backend teams.",
        ],
      },
      {
        company: "Branddi",
        role: "FullStack Developer",
        period: "04.2023 — 06.2024",
        location: "Remote",
        highlights: [
          "Architected an End-to-End infringement management solution — REST core (NestJS) with Pipefy integrations via GraphQL.",
          "Integrated Go (Golang) with RabbitMQ queues to process massive data through Web Crawlers and microservices.",
          "Set up the observability stack: centralized logging (Papertrail), Healthcheck alerts and Downtime monitoring.",
          "Managed AWS deployments and automated CI/CD pipelines with GitHub Actions.",
          "Led PR approvals and defined the team's unit testing strategy.",
        ],
      },
      {
        company: "EISA",
        role: "Software Analyst — QA",
        period: "05.2021 — 04.2023",
        location: "Remote",
        highlights: [
          "Automated E2E tests with Selenium WebDriver, Cucumber and Ruby for VIVO systems — 90M+ users.",
          "Validated async flows in Apache Kafka and ran complex PL/SQL (Oracle) scripts on Linux.",
          "Led the migration from legacy repos (TortoiseSVN → GitLab).",
        ],
      },
      {
        company: "Parallel Consulting & Training",
        role: "FullStack Developer",
        period: "09.2020 — 04.2021",
        location: "Salvador/BA",
        highlights: [
          "Built React (frontend) and Node.js (backend) features that improved the platform's sales conversion.",
          "Created auxiliary Python APIs and managed data persistence in MySQL.",
          "Maintained hosting infrastructure via cPanel.",
          "Participated in Agile rituals (Scrum/Kanban) and kept task tracking up to date.",
        ],
      },
    ],
  },
};
