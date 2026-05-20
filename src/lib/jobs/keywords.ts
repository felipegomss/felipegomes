/**
 * REQUIRED match: a job is only relevant if it mentions React (or Next.js).
 * Covers variants:
 *   - React, react.js, ReactJS, react-native, React Native
 *   - Next.js, NextJS, nextjs (plain "next" alone is too noisy — requires .js/js suffix)
 */
const REACT_RE = /(?<![a-z])react(?:js|\.js|\s+native|-native)?(?![a-z])/i;
const NEXT_RE = /(?<![a-z])next(?:js|\.js)(?![a-z])/i;

function matchesReactStack(text: string): boolean {
  return REACT_RE.test(text) || NEXT_RE.test(text);
}

/** Bonus matches — extracted for display badges, not required for relevance.
 * Does NOT include react/next variants (handled by dedicated regex above). */
export const BONUS_KEYWORDS = [
  // Stack
  "node",
  "node.js",
  "nodejs",
  "typescript",
  "javascript",
  // Role
  "fullstack",
  "full-stack",
  "full stack",
  "frontend",
  "front-end",
  "front end",
  // Seniority
  "senior",
  "sênior",
  "sr",
  "sr.",
  "pleno",
  "pl",
  // Mode
  "remoto",
  "remote",
] as const;

export const NEGATIVE_KEYWORDS = [
  "junior",
  "júnior",
  "jr",
  "jr.",
  "estágio",
  "estagiário",
  "estagiaria",
  "trainee",
  "intern",
  "presencial",
  "on-site",
  "onsite",
  "on site",
  "in-person",
  "in person",
  "inperson",
  "híbrido",
  "hibrido",
  "hybrid",
  "php",
  ".net only",
  "ruby on rails",
  "rails only",
] as const;

type Matcher = { keyword: string; pattern: RegExp };

function buildMatchers(keywords: readonly string[]): Matcher[] {
  return keywords.map((keyword) => ({
    keyword,
    pattern: new RegExp(
      `(^|[^\\p{L}\\p{N}])${escapeRegex(keyword)}([^\\p{L}\\p{N}]|$)`,
      "iu",
    ),
  }));
}

function escapeRegex(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

const BONUS_MATCHERS = buildMatchers(BONUS_KEYWORDS);
const NEGATIVE_MATCHERS = buildMatchers(NEGATIVE_KEYWORDS);

export type MatchResult = {
  matched: string[];
  rejected: string[];
  hasReactStack: boolean;
};

export function matchKeywords(text: string): MatchResult {
  const matched: string[] = [];
  const rejected: string[] = [];

  if (REACT_RE.test(text)) matched.push("react");
  if (NEXT_RE.test(text)) matched.push("next.js");
  const hasReactStack = matched.length > 0;

  for (const { keyword, pattern } of BONUS_MATCHERS) {
    if (pattern.test(text)) matched.push(keyword);
  }
  for (const { keyword, pattern } of NEGATIVE_MATCHERS) {
    if (pattern.test(text)) rejected.push(keyword);
  }

  return { matched, rejected, hasReactStack };
}

/** A job is relevant if it mentions React/Next.js AND has no negative keywords. */
export function isRelevant(text: string): boolean {
  return matchesReactStack(text) && !NEGATIVE_MATCHERS.some((m) => m.pattern.test(text));
}
