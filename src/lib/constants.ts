export const CAREER_START = new Date("2020-09-01");
export const MS_PER_YEAR = 365.25 * 24 * 60 * 60 * 1000; // accounts for leap years
export const GITHUB_USERNAME = "felipegomss";
export const CV_FILENAME = "LuisFNGomes_Curriculum_Vitae";
export const UMAMI_WEBSITE_ID = "96008e50-f747-41e3-8a97-826e10485213";
export const PLAYLIST_URL = "https://music.apple.com/br/playlist/slow-flow/pl.u-EdAVkl3TDPlmo51";
export const BASE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.lfng.dev").trim();

const PHONE = "+55 (71) 9 9265-5188";

export const contact = {
  name: "Luis Felipe Nascimento Gomes",
  phone: PHONE,
  phoneDigits: PHONE.replace(/\D/g, ""),
  linkedin: "linkedin.com/in/felipegomss",
  github: `github.com/${GITHUB_USERNAME}`,
};

export const skills = [
  "React", "TypeScript", "Next.js", "Angular",
  "Zustand", "React Hook Form", "Zod", "TanStack Query",
  "Radix UI", "Tailwind CSS", "shadcn/ui", "Design Systems", "Storybook",
  "Vitest", "Playwright", "Testing Library", "MSW", "Selenium", "Cucumber",
  "Framer Motion", "GSAP",
  "PWA", "Service Workers",
  "Node.js", "NestJS", ".NET", "Go (Golang)", "Python", "Java", "Ruby",
  "REST", "GraphQL", "SignalR", "RabbitMQ", "Apache Kafka",
  "PostgreSQL", "Supabase", "Prisma", "MySQL", "MongoDB", "Oracle PL/SQL",
  "Azure DevOps", "AWS", "Docker", "GitHub Actions", "CI/CD", "Sentry",
  "Stripe", "Resend",
  "Linux",
];

export const skillsByCategory = {
  frontend: ["React", "TypeScript", "Next.js", "Angular", "Tailwind CSS", "Radix UI", "shadcn/ui", "Storybook"],
  backend: ["Node.js", "NestJS", ".NET", "Go (Golang)", "Python", "REST", "GraphQL", "RabbitMQ", "Apache Kafka"],
  data: ["PostgreSQL", "Supabase", "MySQL", "MongoDB", "Oracle PL/SQL", "Prisma"],
  infra: ["AWS", "Azure DevOps", "Docker", "GitHub Actions", "CI/CD", "Sentry", "Linux"],
  testing: ["Vitest", "Playwright", "Testing Library", "MSW", "Selenium", "Cucumber"],
};
