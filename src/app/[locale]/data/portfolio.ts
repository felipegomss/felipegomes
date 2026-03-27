export interface Project {
  name: string;
  descKey: string;
  repo?: string;
  site?: string;
  /** GitHub API path to count items in a directory (e.g. "repos/user/repo/contents/skills") */
  countApi?: string;
  countLabel?: string;
}

export interface Job {
  key: string;
  company: string;
  count: number;
}

export const projects: Project[] = [
  { name: "agent-skills", descKey: "agentSkillsDesc", repo: "https://github.com/felipegomss/agent-skills", site: "https://skills.sh/felipegomss/agent-skills", countApi: "repos/felipegomss/agent-skills/contents/skills", countLabel: "skills" },
  { name: "lfng.dev", descKey: "portfolioDesc", repo: "https://github.com/felipegomss/felipegomes", site: "https://lfng.dev" },
  { name: "WIG", descKey: "wigDesc", site: "https://wig.app.br" },
  { name: "JacoSeg", descKey: "jacosegDesc", site: "https://jacoseg.com.br" },
  { name: "Bianca Psi.", descKey: "biancaDesc", site: "https://www.bianca.psc.br" },
].sort((a, b) => {
  const aIcons = (a.repo ? 1 : 0) + (a.site ? 1 : 0);
  const bIcons = (b.repo ? 1 : 0) + (b.site ? 1 : 0);
  if (bIcons !== aIcons) return bIcons - aIcons;
  return a.name.localeCompare(b.name);
});

export const jobs: Job[] = [
  { key: "automind", company: "Automind", count: 5 },
  { key: "branddi", company: "Branddi", count: 5 },
  { key: "eisa", company: "EISA", count: 3 },
  { key: "parallel", company: "Parallel Consulting & Training", count: 2 },
];
