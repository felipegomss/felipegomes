/**
 * Strip HTML comments (`<!-- ... -->`). Useful for GitHub markdown issues
 * which often include template comments (invisible when rendered on github.com
 * but present in the raw markdown returned by the API).
 */
export function stripHtmlComments(input: string | null | undefined): string {
  if (!input) return "";
  return input.replace(/<!--[\s\S]*?-->/g, "").replace(/\n{3,}/g, "\n\n").trim();
}

/**
 * Decode HTML entities + strip tags + normalize whitespace.
 * Preserves paragraph and line breaks as plain text (\n\n and \n).
 *
 * Handles double-encoded inputs (e.g. RemoteOK sometimes returns "&lt;p&gt;...").
 */
export function cleanHtml(input: string | null | undefined): string {
  if (!input) return "";

  // First decode pass — catches double-encoded "&amp;lt;" → "&lt;"
  let s = decodeEntities(input);
  // Second decode — catches single-encoded "&lt;" → "<"
  s = decodeEntities(s);

  // Block elements → paragraph break
  s = s.replace(/<\/?(p|div|section|article|li|h[1-6])[^>]*>/gi, "\n\n");
  // Line breaks
  s = s.replace(/<br\s*\/?>/gi, "\n");
  // Links: keep "text (url)" form
  s = s.replace(
    /<a\s+[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi,
    (_m, href, text) => {
      const cleanText = text.replace(/<[^>]+>/g, "").trim();
      return cleanText && cleanText !== href ? `${cleanText} (${href})` : href;
    },
  );
  // Drop everything else
  s = s.replace(/<[^>]+>/g, "");

  // Fix common UTF-8 read-as-Latin-1 mojibake (e.g. "Â " in place of NBSP)
  s = fixMojibake(s);
  // Normalize non-breaking spaces / thin spaces to regular spaces
  s = s.replace(/[   ]/g, " ").replace(/[​‌‍﻿]/g, "");
  // Collapse triple+ blank lines
  s = s.replace(/\n{3,}/g, "\n\n");
  // Trim each line's trailing whitespace
  s = s.split("\n").map((l) => l.replace(/\s+$/g, "")).join("\n");
  return s.trim();
}

/**
 * Best-effort fix for UTF-8 byte sequences misinterpreted as Latin-1.
 * Targets the most common artifact: `Â` appearing before a whitespace/NBSP
 * because the source encoded NBSP as bytes `0xC2 0xA0` but the consumer
 * decoded as Latin-1 (`Â` + NBSP).
 */
function fixMojibake(s: string): string {
  return s
    .replace(/Â(?=[\s ])/g, "")
    .replace(/Ã©/g, "é")
    .replace(/Ã¡/g, "á")
    .replace(/Ã£/g, "ã")
    .replace(/Ãª/g, "ê")
    .replace(/Ã§/g, "ç")
    .replace(/Ã­/g, "í")
    .replace(/Ã³/g, "ó")
    .replace(/Ã´/g, "ô")
    .replace(/Ãº/g, "ú")
    .replace(/Ã¢/g, "â")
    .replace(/Ã/g, "Á")
    .replace(/â€™/g, "'")
    .replace(/â€œ/g, '"')
    .replace(/â€/g, '"')
    .replace(/â€"/g, "—")
    .replace(/â€"/g, "–");
}

function decodeEntities(s: string): string {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/&#x2F;/g, "/")
    .replace(/&nbsp;/g, " ")
    .replace(/&#(\d+);/g, (_m, code) => String.fromCharCode(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_m, code) => String.fromCharCode(parseInt(code, 16)));
}
