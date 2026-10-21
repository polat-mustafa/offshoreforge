/**
 * Walks a chapter's text in reading order: for citation numbering (IEEE: by first
 * appearance), reading time and narration.
 */

import { CITE, citeKeys } from "../ui/cite";
import type { Block, Chapter, Lang, T } from "./types";

function blockTexts(b: Block): T[] {
  switch (b.kind) {
    case "p":
      return [b.text];
    case "eq":
      return b.where?.map((w) => w.def) ?? [];
    case "fig":
      return b.source ? [b.caption, b.source] : [b.caption];
    case "callout":
      return [b.title, ...b.body];
    case "list":
      return b.items;
    case "table":
      return [b.caption, ...b.head, ...b.rows.flat(), ...(b.source ? [b.source] : [])];
    case "steps":
      return [b.title, b.given, ...b.steps, b.result];
    case "code":
      return [b.caption];
  }
}

/** Every bilingual string of a chapter, in the order a reader meets it. */
export function chapterTexts(ch: Chapter): T[] {
  return [
    ch.lead,
    ...ch.objectives,
    ...ch.sections.flatMap((s) => [s.title, ...s.blocks.flatMap(blockTexts)]),
    ...ch.practice.platform,
    ...ch.practice.industry,
    ...ch.practice.solves,
    ...ch.practice.limits,
    ...ch.takeaways,
    ...ch.quiz.flatMap((q) => [q.q, ...q.options, q.why]),
  ];
}

/** Reference keys of a chapter in order of first citation (both languages cite alike). */
export function citedKeys(ch: Chapter): string[] {
  const seen: string[] = [];
  for (const t of chapterTexts(ch))
    for (const lang of ["en", "tr"] as const)
      for (const m of t[lang].matchAll(CITE)) for (const k of citeKeys(m[1])) if (!seen.includes(k)) seen.push(k);
  return seen;
}

/** Minutes to read: 180 words/min of prose plus time to study each figure and equation. */
export function readingMinutes(ch: Chapter, lang: Lang): number {
  const words = chapterTexts(ch).reduce((n, t) => n + t[lang].split(/\s+/).length, 0);
  const blocks = ch.sections.flatMap((s) => s.blocks);
  const figs = blocks.filter((b) => b.kind === "fig").length;
  const eqs = blocks.filter((b) => b.kind === "eq" || b.kind === "steps").length;
  return Math.max(5, Math.round(words / 180 + figs * 1.5 + eqs * 0.75));
}

/** What the narrator reads: the abstract, then each section's title and paragraphs, then the key points. */
export function narrationTexts(ch: Chapter): T[] {
  return [
    ch.lead,
    ...ch.sections.flatMap((s) => [s.title, ...s.blocks.flatMap((b) => (b.kind === "p" ? [b.text] : b.kind === "list" ? b.items : []))]),
    ...ch.takeaways,
  ];
}
