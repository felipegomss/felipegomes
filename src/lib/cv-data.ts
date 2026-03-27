export const contact = {
  name: "Luis Felipe Nascimento Gomes",
  location: "Salvador/BA — Brasil",
  email: "luisfng123@gmail.com",
  phone: "+55 (71) 9 9265-5188",
  linkedin: "linkedin.com/in/felipegomss",
  github: "github.com/felipegomss",
};

export const skills = [
  // frontend core (ambas vagas pedem)
  "React", "TypeScript", "Next.js", "Angular",
  // state, forms, data
  "Zustand", "React Hook Form", "Zod", "TanStack Query",
  // UI, design systems (vaga 1: design systems, componentizacao)
  "Radix UI", "Tailwind CSS", "shadcn/ui", "Design Systems", "Storybook",
  // testing (ambas pedem Jest/Vitest/Cypress/Playwright)
  "Vitest", "Playwright", "Testing Library", "MSW", "Selenium", "Cucumber",
  // animation
  "Framer Motion", "GSAP",
  // PWA (vaga 2: Workbox, service workers)
  "PWA", "Service Workers",
  // backend & APIs
  "Node.js", "NestJS", ".NET", "Go (Golang)", "Python", "Java", "Ruby",
  "REST", "GraphQL", "SignalR", "RabbitMQ", "Apache Kafka",
  // databases
  "PostgreSQL", "Supabase", "Prisma", "MySQL", "MongoDB", "Oracle PL/SQL",
  // infra, CI/CD, observability (vaga 1: Azure, CI/CD)
  "Azure DevOps", "AWS", "Docker", "GitHub Actions", "CI/CD", "Sentry",
  // integrations
  "Stripe", "Resend",
  // OS
  "Linux",
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
    subtitle: "Arquitetura frontend, design systems e foco em produto.",
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
          "Liderei a modernização do AUTOLOAD (legado → Next.js 14 + React 18 + TypeScript) com backend .NET 8, SignalR e PostgreSQL multi-tenant.",
          "Criei e publico a @automind/react-components — design system com Radix UI, Storybook e Chromatic, consumida pelo frontend e pelo KIOSK.",
          "Desenvolvi o frontend do AUTOMED (Angular), sistema de gestão de medições compatível com a norma ABNT NBR ISO 10012.",
          "Implementei Vitest + Playwright no pipeline do Azure DevOps — smoke tests em PR e regressão completa em release.",
          "Escrevo specs e documentação de requisitos com stakeholders. Conduzo code reviews e mentoro devs juniores.",
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
        ],
      },
    ],
  },
  en: {
    objective: "Full Stack Developer",
    subtitle: "Frontend architecture, design systems and product focus.",
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
          "Led the modernization of AUTOLOAD (legacy → Next.js 14 + React 18 + TypeScript) with .NET 8 backend, SignalR and multi-tenant PostgreSQL.",
          "Created and publish @automind/react-components — design system with Radix UI, Storybook and Chromatic, consumed by the frontend and KIOSK app.",
          "Built the frontend for AUTOMED (Angular), a measurement management system compliant with ABNT NBR ISO 10012.",
          "Implemented Vitest + Playwright in the Azure DevOps pipeline — smoke tests on PR and full regression on release.",
          "Write specs and requirements docs with stakeholders. Run code reviews and mentor junior devs.",
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
        ],
      },
    ],
  },
};
