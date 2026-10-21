/**
 * Rich text of the course (markup in course/types.ts): citations, inline maths,
 * emphasis, code and the platform's numbers. Citation numbers come from the chapter
 * (CiteContext), so [1] means the same work in the text and in the reference list.
 */

import { Fragment, useContext, type ReactNode } from "react";

import { REFS } from "../course/refs";
import type { Lang } from "../course/types";
import { CiteContext, citeKeys, TOKEN, withFacts } from "./cite";
import { Tex } from "./Tex";

function Cite({ keys }: { keys: string[] }) {
  const { number, anchor } = useContext(CiteContext);
  const nums = keys.map((k) => ({ k, n: number.get(k) }));
  return (
    <sup className="ml-px text-[0.72em] font-semibold">
      [
      {nums.map(({ k, n }, i) => {
        const r = REFS[k];
        return (
          <Fragment key={k}>
            {i > 0 && ", "}
            <a href={`#${anchor(k)}`} title={r ? `${r.authors} (${r.year}). ${r.title}` : k} className="text-accent no-underline hover:underline">
              {n ?? "?"}
            </a>
          </Fragment>
        );
      })}
      ]
    </sup>
  );
}

export function RichText({ text, lang }: { text: string; lang: Lang }): ReactNode {
  const parts = withFacts(text, lang).split(TOKEN);
  return parts.map((p, i) => {
    if (!p) return null;
    if (p.startsWith("[@")) return <Cite key={i} keys={citeKeys(p.slice(1, -1))} />;
    if (p.startsWith("$") && p.endsWith("$") && p.length > 2) return <Tex key={i} tex={p.slice(1, -1)} />;
    if (p.startsWith("**") && p.endsWith("**")) return <strong key={i} className="font-semibold text-text-primary">{p.slice(2, -2)}</strong>;
    if (p.startsWith("*") && p.endsWith("*") && p.length > 2) return <em key={i}>{p.slice(1, -1)}</em>;
    if (p.startsWith("`") && p.endsWith("`"))
      return (
        <code key={i} translate="no" className="rounded bg-bg-tertiary px-1 py-px font-mono text-[0.86em] text-text-primary">
          {p.slice(1, -1)}
        </code>
      );
    return <Fragment key={i}>{p}</Fragment>;
  });
}
