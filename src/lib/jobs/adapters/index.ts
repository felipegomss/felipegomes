import type { Adapter } from "../types";
import {
  githubBackendBrAdapter,
  githubFrontendBrAdapter,
  githubReactBrasilAdapter,
} from "./github";
import { hnHiringAdapter } from "./hn";
import { remoteOkAdapter } from "./remoteok";

/** Adapters that run on Vercel (free public APIs, no auth needed). */
export const VERCEL_ADAPTERS: Adapter[] = [
  githubFrontendBrAdapter,
  githubBackendBrAdapter,
  githubReactBrasilAdapter,
  remoteOkAdapter,
  hnHiringAdapter,
];

export {
  githubFrontendBrAdapter,
  githubBackendBrAdapter,
  githubReactBrasilAdapter,
  remoteOkAdapter,
  hnHiringAdapter,
};
