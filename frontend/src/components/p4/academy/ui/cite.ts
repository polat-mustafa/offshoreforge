/**
 * The non-visual half of the course's rich text: citation numbering context, the markup
 * patterns, fact substitution and the plain-text form used for narration.
 */

import { createContext } from "react";

import { fact, FACT_KEYS } from "../course/facts";
import type { Lang } from "../course/types";

export interface CiteMap {
  number: Map<string, number>;
  anchor: (key: string) => string;
}

export const CiteContext = createContext<CiteMap>({ number: new Map(), anchor: (k) => `ref-${k}` });

const FACT = new RegExp(`\\{(${FACT_KEYS.join("|")})\\}`, "g");
export const TOKEN = /(\[@[^\]]+\]|\$[^$]+\$|\*\*[^*]+\*\*|\*[^*\s][^*]*\*|`[^`]+`)/g;
export const CITE = /\[@([^\]]+)\]/g;

/** Keys of one citation token "[@a;@b]" → ["a", "b"]. */
export const citeKeys = (inner: string) => inner.split(/[;,]/).map((k) => k.trim().replace(/^@/, ""));

export function withFacts(text: string, lang: Lang): string {
  return text.replace(FACT, (m, k: string) => fact(k, lang) ?? m);
}

/** Plain text for narration: no markup, maths reduced to its words and symbols. */
export function plain(text: string, lang: Lang): string {
  return withFacts(text, lang)
    .replace(CITE, "")
    .replace(/\$([^$]+)\$/g, (_, tex: string) =>
      tex
        .replace(/\\(text|mathrm|operatorname)\{([^}]*)\}/g, "$2")
        .replace(/\\[a-zA-Z]+/g, " ")
        .replace(/[{}^_\\]/g, " "),
    )
    .replace(/\*|`/g, "")
    .replace(/\s+/g, " ")
    .trim();
}
