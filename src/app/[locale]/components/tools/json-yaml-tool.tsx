"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { dump, load } from "js-yaml";
import { Check, Copy, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface PaneProps {
  label: string;
  value: string;
  error: string;
  placeholder: string;
  errorPrefix: string;
  onChange: (v: string) => void;
  onClear: () => void;
}

function Pane({
  label,
  value,
  error,
  placeholder,
  errorPrefix,
  onChange,
  onClear,
}: PaneProps) {
  const t = useTranslations("tools.json-yaml");
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
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-2xs font-bold uppercase tracking-widest text-muted-foreground">
          {label}
        </span>
        <div className="flex items-center gap-2">
          <Button
            size="xs"
            variant="ghost"
            onClick={copy}
            disabled={!value}
            data-umami-event="tool-json-yaml-copy"
            data-umami-event-side={label}
          >
            {copied ? <Check /> : <Copy />}
            {copied ? t("copied") : t("copy")}
          </Button>
          <Button
            size="xs"
            variant="ghost"
            onClick={onClear}
            disabled={!value}
            data-umami-event="tool-json-yaml-clear"
            data-umami-event-side={label}
          >
            <Trash2 />
            {t("clear")}
          </Button>
        </div>
      </div>
      <Textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        spellCheck={false}
        aria-invalid={!!error}
        className="min-h-[300px] font-mono text-xs leading-relaxed"
      />
      {error && (
        <p className="flex items-start gap-1.5 text-2xs text-destructive">
          <span
            aria-hidden="true"
            className="mt-1 size-1.5 shrink-0 rounded-full bg-destructive"
          />
          <span>
            {errorPrefix}: <code className="font-mono">{error}</code>
          </span>
        </p>
      )}
    </div>
  );
}

export function JsonYamlTool() {
  const t = useTranslations("tools.json-yaml");
  const [json, setJson] = useState("");
  const [yaml, setYaml] = useState("");
  const [jsonErr, setJsonErr] = useState("");
  const [yamlErr, setYamlErr] = useState("");

  function onJsonChange(v: string) {
    setJson(v);
    setJsonErr("");
    if (!v.trim()) {
      setYaml("");
      setYamlErr("");
      return;
    }
    try {
      const obj = JSON.parse(v);
      setYaml(dump(obj, { lineWidth: 100 }));
      setYamlErr("");
    } catch (err) {
      setJsonErr(err instanceof Error ? err.message : String(err));
    }
  }

  function onYamlChange(v: string) {
    setYaml(v);
    setYamlErr("");
    if (!v.trim()) {
      setJson("");
      setJsonErr("");
      return;
    }
    try {
      const obj = load(v);
      setJson(JSON.stringify(obj, null, 2));
      setJsonErr("");
    } catch (err) {
      setYamlErr(err instanceof Error ? err.message : String(err));
    }
  }

  function clearBoth() {
    setJson("");
    setYaml("");
    setJsonErr("");
    setYamlErr("");
  }

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <Pane
        label={t("json")}
        value={json}
        error={jsonErr}
        placeholder={t("placeholderJson")}
        errorPrefix={t("invalidJson")}
        onChange={onJsonChange}
        onClear={clearBoth}
      />
      <Pane
        label={t("yaml")}
        value={yaml}
        error={yamlErr}
        placeholder={t("placeholderYaml")}
        errorPrefix={t("invalidYaml")}
        onChange={onYamlChange}
        onClear={clearBoth}
      />
    </div>
  );
}
