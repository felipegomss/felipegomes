import { ImageResponse } from "next/og";
import { getPostBySlug } from "@/lib/blog";

export const runtime = "nodejs";
export const alt = "Blog post — LFNG";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image({
  params,
}: {
  params: Promise<{ slug: string; locale: string }>;
}) {
  const { slug } = await params;
  const result = await getPostBySlug(slug);

  const title =
    result?.post.title ?? "Blog — LFNG";
  const description = result?.post.description ?? "";
  const date = result?.post.date;
  const dateFormatted = date
    ? new Intl.DateTimeFormat("pt-BR", { dateStyle: "long" }).format(
        new Date(`${date}T12:00:00`),
      )
    : "";

  const titleFontSize = title.length > 60 ? 36 : title.length > 40 ? 42 : 48;

  return new ImageResponse(
    (
      <div
        style={{
          width: "1200px",
          height: "630px",
          backgroundColor: "#0a0a0a",
          backgroundImage:
            "repeating-linear-gradient(-45deg, transparent, transparent 8px, rgba(255,255,255,0.025) 8px, rgba(255,255,255,0.025) 9px)",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "64px",
          fontFamily: "monospace",
        }}
      >
        <div style={{ display: "flex", alignItems: "center" }}>
          <span
            style={{
              color: "rgba(255,255,255,0.25)",
              fontSize: "13px",
              letterSpacing: "0.1em",
              textTransform: "uppercase",
            }}
          >
            lfng.dev / blog
          </span>
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "20px",
            maxWidth: "960px",
          }}
        >
          <div
            style={{
              color: "#f0f0f0",
              fontSize: `${titleFontSize}px`,
              fontWeight: 900,
              lineHeight: 1.2,
              letterSpacing: "-0.02em",
            }}
          >
            {title}
          </div>
          {description && (
            <div
              style={{
                color: "rgba(255,255,255,0.45)",
                fontSize: "18px",
                lineHeight: 1.5,
              }}
            >
              {description}
            </div>
          )}
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            color: "rgba(255,255,255,0.25)",
            fontSize: "13px",
            letterSpacing: "0.04em",
          }}
        >
          <span>Luis Felipe N. Gomes</span>
          {dateFormatted && <span>{dateFormatted}</span>}
        </div>
      </div>
    ),
    { width: 1200, height: 630 },
  );
}
