export const CAREER_START = new Date("2020-09-01");
export const MS_PER_YEAR = 365.25 * 24 * 60 * 60 * 1000; // accounts for leap years

export const contact = {
  name: "Luis Felipe Nascimento Gomes",
  phone: "+55 (71) 9 9265-5188",
  linkedin: "linkedin.com/in/felipegomss",
  github: "github.com/felipegomss",
};

export const skills = [
  // frontend core
  "React", "TypeScript", "Next.js", "Angular",
  // state, forms, data
  "Zustand", "React Hook Form", "Zod", "TanStack Query",
  // UI, design systems
  "Radix UI", "Tailwind CSS", "shadcn/ui", "Design Systems", "Storybook",
  // testing
  "Vitest", "Playwright", "Testing Library", "MSW", "Selenium", "Cucumber",
  // animation
  "Framer Motion", "GSAP",
  // PWA
  "PWA", "Service Workers",
  // backend & APIs
  "Node.js", "NestJS", ".NET", "Go (Golang)", "Python", "Java", "Ruby",
  "REST", "GraphQL", "SignalR", "RabbitMQ", "Apache Kafka",
  // databases
  "PostgreSQL", "Supabase", "Prisma", "MySQL", "MongoDB", "Oracle PL/SQL",
  // infra, CI/CD, observability
  "Azure DevOps", "AWS", "Docker", "GitHub Actions", "CI/CD", "Sentry",
  // integrations
  "Stripe", "Resend",
  // OS
  "Linux",
];

export const skillsByCategory = {
  frontend: ["React", "TypeScript", "Next.js", "Angular", "Tailwind CSS", "Radix UI", "shadcn/ui", "Storybook"],
  backend: ["Node.js", "NestJS", ".NET", "Go (Golang)", "Python", "REST", "GraphQL", "RabbitMQ", "Apache Kafka"],
  data: ["PostgreSQL", "Supabase", "MySQL", "MongoDB", "Oracle PL/SQL", "Prisma"],
  infra: ["AWS", "Azure DevOps", "Docker", "GitHub Actions", "CI/CD", "Sentry", "Linux"],
  testing: ["Vitest", "Playwright", "Testing Library", "MSW", "Selenium", "Cucumber"],
};
