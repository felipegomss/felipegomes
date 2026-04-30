import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import readingTime from "reading-time";
import GithubSlugger from "github-slugger";

const POSTS_DIR = path.join(process.cwd(), "content", "blog");

export type PostFrontmatter = {
  title: string;
  description: string;
  date: string;
  tags: string[];
  ogImage?: string;
};

export type TocEntry = {
  id: string;
  text: string;
  level: 2 | 3;
};

export type Post = PostFrontmatter & {
  slug: string;
  readingTimeMinutes: number;
  headings: TocEntry[];
};

function extractHeadings(content: string): TocEntry[] {
  const slugger = new GithubSlugger();
  const headings: TocEntry[] = [];
  const regex = /^(#{2,3})\s+(.+)$/gm;
  let match;
  while ((match = regex.exec(content)) !== null) {
    const level = match[1].length as 2 | 3;
    const text = match[2].trim();
    headings.push({ id: slugger.slug(text), text, level });
  }
  return headings;
}

export function formatDate(dateStr: string, locale: string): string {
  return new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(`${dateStr}T12:00:00`));
}

function resolvePostFile(slug: string, locale: string): string {
  const localeFile = path.join(POSTS_DIR, `${slug}.${locale}.mdx`);
  const defaultFile = path.join(POSTS_DIR, `${slug}.mdx`);
  return fs.existsSync(localeFile) ? localeFile : defaultFile;
}

function parsePostFile(filePath: string, slug: string): Post {
  const raw = fs.readFileSync(filePath, "utf8");
  const { data, content } = matter(raw);
  const fm = data as PostFrontmatter;
  const rt = readingTime(content);
  return {
    ...fm,
    slug,
    readingTimeMinutes: Math.ceil(rt.minutes),
    headings: extractHeadings(content),
  };
}

export async function getAllPosts(locale = "pt-BR"): Promise<Post[]> {
  if (!fs.existsSync(POSTS_DIR)) return [];

  const baseSlugs = fs
    .readdirSync(POSTS_DIR)
    .filter((f) => f.endsWith(".mdx") && !f.match(/\.\w{2,5}\.mdx$/))
    .map((f) => f.replace(/\.mdx$/, ""));

  const posts = baseSlugs.map((slug) => {
    const filePath = resolvePostFile(slug, locale);
    return parsePostFile(filePath, slug);
  });

  return posts.sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  );
}

export async function getPostBySlug(
  slug: string,
  locale = "pt-BR",
): Promise<{ post: Post; source: string } | null> {
  const defaultFile = path.join(POSTS_DIR, `${slug}.mdx`);
  if (!fs.existsSync(defaultFile)) return null;

  const filePath = resolvePostFile(slug, locale);
  const raw = fs.readFileSync(filePath, "utf8");
  const { data, content } = matter(raw);
  const fm = data as PostFrontmatter;
  const rt = readingTime(content);

  return {
    post: {
      ...fm,
      slug,
      readingTimeMinutes: Math.ceil(rt.minutes),
      headings: extractHeadings(content),
    },
    source: content,
  };
}
