"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import rehypeHighlight from "rehype-highlight";
import { Check, Copy, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import "katex/dist/katex.min.css";
import "highlight.js/styles/github-dark.css";

export function MarkdownTool() {
  const t = useTranslations("tools.markdown");
  const [value, setValue] = useState("");
  const [copied, setCopied] = useState(false);

  async function copy() {
    if (!value) return;
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard unavailable */
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-end gap-2">
        <Button
          size="xs"
          variant="ghost"
          onClick={copy}
          disabled={!value}
          data-umami-event="tool-markdown-copy"
        >
          {copied ? <Check /> : <Copy />}
          {copied ? t("copied") : t("copy")}
        </Button>
        <Button
          size="xs"
          variant="ghost"
          onClick={() => setValue("")}
          disabled={!value}
          data-umami-event="tool-markdown-clear"
        >
          <Trash2 />
          {t("clear")}
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div>
          <span className="mb-2 block text-2xs font-bold uppercase tracking-widest text-muted-foreground-subtle">
            {t("source")}
          </span>
          <Textarea
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder={t("placeholder")}
            spellCheck={false}
            className="min-h-[400px] font-mono text-xs leading-relaxed"
          />
        </div>
        <div>
          <span className="mb-2 block text-2xs font-bold uppercase tracking-widest text-muted-foreground-subtle">
            {t("preview")}
          </span>
          <div className="min-h-[400px] border border-border px-4 py-3">
            {value ? (
              <article className="prose prose-sm prose-neutral max-w-none dark:prose-invert">
                <ReactMarkdown
                remarkPlugins={[remarkGfm, remarkMath]}
                rehypePlugins={[rehypeKatex, rehypeHighlight]}
              >
                {value}
              </ReactMarkdown>
              </article>
            ) : (
              <p className="text-2xs text-muted-foreground-subtle">{t("empty")}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
