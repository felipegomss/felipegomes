// Plataformas dos links salvos (arquivo puro: usado também no navegador).
export const PLATFORMS = ["tiktok", "instagram", "x", "youtube", "web"] as const;
export type Platform = (typeof PLATFORMS)[number];
export const PLATFORM_LABELS: Record<Platform, string> = { tiktok: "TikTok", instagram: "Instagram", x: "X", youtube: "YouTube", web: "Web" };
