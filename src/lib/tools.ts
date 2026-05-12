export type ToolSlug =
  | "json"
  | "jwt"
  | "base64"
  | "url"
  | "uuid"
  | "hash"
  | "password"
  | "timestamp"
  | "color"
  | "case"
  | "json-yaml"
  | "regex"
  | "cron"
  | "diff"
  | "person"
  | "address"
  | "company"
  | "lorem"
  | "slug"
  | "qrcode"
  | "markdown"
  | "image";

export type ToolCategory =
  | "formatters"
  | "encoding"
  | "generators"
  | "converters"
  | "inspection"
  | "fake";

export interface ToolMeta {
  slug: ToolSlug;
  category: ToolCategory;
  titleKey: string;
  descriptionKey: string;
  keywords?: string[];
}

export const categoryOrder: ToolCategory[] = [
  "formatters",
  "encoding",
  "generators",
  "fake",
  "converters",
  "inspection",
];

export const tools: ToolMeta[] = [
  {
    slug: "json",
    category: "formatters",
    titleKey: "json.title",
    descriptionKey: "json.description",
    keywords: ["format", "pretty", "minify", "validate", "lint"],
  },
  {
    slug: "markdown",
    category: "formatters",
    titleKey: "markdown.title",
    descriptionKey: "markdown.description",
    keywords: ["markdown", "md", "preview", "gfm", "render"],
  },
  {
    slug: "jwt",
    category: "encoding",
    titleKey: "jwt.title",
    descriptionKey: "jwt.description",
    keywords: ["token", "auth", "bearer", "jsonwebtoken", "claims"],
  },
  {
    slug: "base64",
    category: "encoding",
    titleKey: "base64.title",
    descriptionKey: "base64.description",
    keywords: ["b64", "encode", "decode", "data uri", "binary"],
  },
  {
    slug: "url",
    category: "encoding",
    titleKey: "url.title",
    descriptionKey: "url.description",
    keywords: ["encode", "decode", "querystring", "percent", "uri"],
  },
  {
    slug: "image",
    category: "encoding",
    titleKey: "image.title",
    descriptionKey: "image.description",
    keywords: ["image", "img", "base64", "data uri", "embed"],
  },
  {
    slug: "uuid",
    category: "generators",
    titleKey: "uuid.title",
    descriptionKey: "uuid.description",
    keywords: ["uuid", "guid", "v4", "v7", "id", "random"],
  },
  {
    slug: "hash",
    category: "generators",
    titleKey: "hash.title",
    descriptionKey: "hash.description",
    keywords: ["sha", "sha1", "sha256", "sha512", "digest", "checksum"],
  },
  {
    slug: "password",
    category: "generators",
    titleKey: "password.title",
    descriptionKey: "password.description",
    keywords: ["password", "token", "secret", "random", "passphrase"],
  },
  {
    slug: "qrcode",
    category: "generators",
    titleKey: "qrcode.title",
    descriptionKey: "qrcode.description",
    keywords: ["qr", "qrcode", "code", "barcode", "url"],
  },
  {
    slug: "person",
    category: "fake",
    titleKey: "person.title",
    descriptionKey: "person.description",
    keywords: ["pessoa", "nome", "cpf", "email", "telefone", "mock", "fake"],
  },
  {
    slug: "address",
    category: "fake",
    titleKey: "address.title",
    descriptionKey: "address.description",
    keywords: ["endereço", "address", "cep", "rua", "cidade", "mock"],
  },
  {
    slug: "company",
    category: "fake",
    titleKey: "company.title",
    descriptionKey: "company.description",
    keywords: ["empresa", "cnpj", "company", "razão social", "mock"],
  },
  {
    slug: "lorem",
    category: "fake",
    titleKey: "lorem.title",
    descriptionKey: "lorem.description",
    keywords: ["lorem", "ipsum", "filler", "placeholder", "text"],
  },
  {
    slug: "timestamp",
    category: "converters",
    titleKey: "timestamp.title",
    descriptionKey: "timestamp.description",
    keywords: ["unix", "epoch", "iso", "date", "time", "rfc", "milliseconds"],
  },
  {
    slug: "color",
    category: "converters",
    titleKey: "color.title",
    descriptionKey: "color.description",
    keywords: ["hex", "rgb", "hsl", "oklch", "picker", "swatch"],
  },
  {
    slug: "case",
    category: "converters",
    titleKey: "case.title",
    descriptionKey: "case.description",
    keywords: ["camel", "snake", "kebab", "pascal", "title", "upper", "lower"],
  },
  {
    slug: "slug",
    category: "converters",
    titleKey: "slug.title",
    descriptionKey: "slug.description",
    keywords: ["slug", "slugify", "url", "kebab", "permalink"],
  },
  {
    slug: "json-yaml",
    category: "converters",
    titleKey: "json-yaml.title",
    descriptionKey: "json-yaml.description",
    keywords: ["yaml", "json", "yml", "convert"],
  },
  {
    slug: "regex",
    category: "inspection",
    titleKey: "regex.title",
    descriptionKey: "regex.description",
    keywords: ["regex", "regexp", "pattern", "match", "replace"],
  },
  {
    slug: "cron",
    category: "inspection",
    titleKey: "cron.title",
    descriptionKey: "cron.description",
    keywords: ["cron", "schedule", "crontab", "expression"],
  },
  {
    slug: "diff",
    category: "inspection",
    titleKey: "diff.title",
    descriptionKey: "diff.description",
    keywords: ["diff", "compare", "patch", "delta"],
  },
];

export function getToolBySlug(slug: string): ToolMeta | undefined {
  return tools.find((t) => t.slug === slug);
}

export function groupByCategory(
  list: ToolMeta[],
): Array<{ category: ToolCategory; items: ToolMeta[] }> {
  return categoryOrder
    .map((category) => ({
      category,
      items: list.filter((t) => t.category === category),
    }))
    .filter((group) => group.items.length > 0);
}
