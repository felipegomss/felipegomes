// Escolhe o componente da tool pelo slug. Usado pela página pública
// (/tools/[slug]) e pela versão dentro do app (/admin/tools/[slug]).
import dynamic from "next/dynamic";
import type { ToolSlug } from "@/lib/tools";
import { JsonTool } from "./json-tool";
import { JwtTool } from "./jwt-tool";
import { Base64Tool } from "./base64-tool";
import { UrlTool } from "./url-tool";
import { UuidTool } from "./uuid-tool";
import { HashTool } from "./hash-tool";
import { PasswordTool } from "./password-tool";
import { TimestampTool } from "./timestamp-tool";
import { ColorTool } from "./color-tool";
import { CaseTool } from "./case-tool";
import { JsonYamlTool } from "./json-yaml-tool";
import { RegexTool } from "./regex-tool";
import { CronTool } from "./cron-tool";
import { DiffTool } from "./diff-tool";
import { SlugTool } from "./slug-tool";
import { QrcodeTool } from "./qrcode-tool";
import { MarkdownTool } from "./markdown-tool";
import { ImageTool } from "./image-tool";

const PersonTool = dynamic(() =>
  import("./person-tool").then((m) => ({
    default: m.PersonTool,
  })),
);
const AddressTool = dynamic(() =>
  import("./address-tool").then((m) => ({
    default: m.AddressTool,
  })),
);
const CompanyTool = dynamic(() =>
  import("./company-tool").then((m) => ({
    default: m.CompanyTool,
  })),
);
const LoremTool = dynamic(() =>
  import("./lorem-tool").then((m) => ({
    default: m.LoremTool,
  })),
);

export function ToolRenderer({ slug }: { slug: ToolSlug }) {
  return (
    <>
      {slug === "json" && <JsonTool />}
      {slug === "jwt" && <JwtTool />}
      {slug === "base64" && <Base64Tool />}
      {slug === "url" && <UrlTool />}
      {slug === "uuid" && <UuidTool />}
      {slug === "hash" && <HashTool />}
      {slug === "password" && <PasswordTool />}
      {slug === "timestamp" && <TimestampTool />}
      {slug === "color" && <ColorTool />}
      {slug === "case" && <CaseTool />}
      {slug === "slug" && <SlugTool />}
      {slug === "json-yaml" && <JsonYamlTool />}
      {slug === "regex" && <RegexTool />}
      {slug === "cron" && <CronTool />}
      {slug === "diff" && <DiffTool />}
      {slug === "person" && <PersonTool />}
      {slug === "address" && <AddressTool />}
      {slug === "company" && <CompanyTool />}
      {slug === "lorem" && <LoremTool />}
      {slug === "qrcode" && <QrcodeTool />}
      {slug === "markdown" && <MarkdownTool />}
      {slug === "image" && <ImageTool />}
    </>
  );
}
