/** Career start date, used to compute years of experience. */
export const CAREER_START = new Date("2020-09-01");

/** Milliseconds in one average year (accounts for leap years). */
export const MS_PER_YEAR = 365.25 * 24 * 60 * 60 * 1000;

/** Cache duration for the PDF CV endpoint, in seconds (24h). */
export const CV_CACHE_MAX_AGE = 86400;

export const contact = {
  name: "Luis Felipe Nascimento Gomes",
  location: "Salvador/BA — Brasil",
  email: "ola@lfng.dev",
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
