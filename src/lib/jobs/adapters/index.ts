import type { Adapter } from "../types";
import { coodeshAdapter } from "./coodesh";
import {
  githubBackendBrAdapter,
  githubFrontendBrAdapter,
  githubReactBrasilAdapter,
} from "./github";
import { hnHiringAdapter } from "./hn";
import { remoteOkAdapter } from "./remoteok";
import { vagasComBrAdapter } from "./vagas-com-br";

/** Adapters that run on Vercel (free public APIs / sitemaps / RSS, no auth needed). */
export const VERCEL_ADAPTERS: Adapter[] = [
  githubFrontendBrAdapter,
  githubBackendBrAdapter,
  githubReactBrasilAdapter,
  remoteOkAdapter,
  hnHiringAdapter,
  vagasComBrAdapter,
  coodeshAdapter,
];

export {
  githubFrontendBrAdapter,
  githubBackendBrAdapter,
  githubReactBrasilAdapter,
  remoteOkAdapter,
  hnHiringAdapter,
  vagasComBrAdapter,
  coodeshAdapter,
};
