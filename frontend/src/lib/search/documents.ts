/**
 * What the header search looks through, and the ranked result list.
 *
 *   page    — every menu page (constants/navigation), with its one-line description
 *   term    — the glossary (constants/glossary): shown as a definition card on a close match
 *   section — headings and tabs from the crawled index (data/searchIndex.json)
 *   text    — every text block of the crawled index
 *   live    — the page on screen right now, read from the DOM: live values,
 *             the user's own project and whatever the index has not seen
 *
 * With a translated UI language each text is matched in both languages and
 * shown in the translated one (lib/i18n translate()).
 */

import { GLOSSARY } from "../../constants/glossary";
import { NAV_GROUPS } from "../../constants/navigation";
import { translate, type Lang } from "../i18n";
import { fold, matchText, prepareQuery, snippet, type Folded, type Query, type Span } from "./engine";
import type { Block } from "./pageText";

/** One block of the crawled index (scripts/search-index.mjs). */
export interface IndexEntry {
  /** Route. */
  p: string;
  /** Tab and tab-inside-the-tab it sits under (English labels). */
  t?: string;
  u?: string;
  /** 1 = a heading or tab label. */
  h?: 1;
  /** Heading above it. */
  s?: string;
  /** The text. */
  x: string;
}

export type DocKind = "page" | "term" | "section" | "text";

export interface SearchDoc {
  id: string;
  kind: DocKind;
  path: string;
  tab?: string;
  sub?: string;
  /** Headline of the result (a heading, the section a text sits in, a page or a term). */
  title: string;
  /** Text shown under it (for a section: the first text below, for display only). */
  body: string;
  /** For `text`: the headline is context, not a match target. */
  bodyOnly?: boolean;
  /** Read from the page on screen. */
  block?: Block;
}

export interface Prepared {
  doc: SearchDoc;
  /** Folded title / body in English and in the UI language. */
  fTitle: Folded[];
  fBody: Folded[];
  /** Title and body as shown. */
  title: string;
  body: string;
}

export interface SearchHit {
  doc: SearchDoc;
  score: number;
  title: string;
  titleSpans: Span[];
  body: string;
  bodySpans: Span[];
  /** "Operate › SCADA › Protection" in the UI language. */
  trail: string[];
  /** On the page on screen. */
  here: boolean;
}

const PAGE_OF = new Map(NAV_GROUPS.flatMap((g) => g.items.map((i) => [i.path, { group: g.label, item: i }] as const)));

/** Menu label of a route. */
export const pageLabel = (path: string) => PAGE_OF.get(path)?.item.label ?? path;

export function staticDocs(): SearchDoc[] {
  const pages: SearchDoc[] = NAV_GROUPS.flatMap((g) =>
    g.items.map((i) => ({ id: `page:${i.path}`, kind: "page" as const, path: i.path, title: i.label, body: i.description })),
  );
  const terms: SearchDoc[] = GLOSSARY.map((t) => ({ id: `term:${t.term}`, kind: "term", path: "", title: t.term, body: t.definition }));
  return [...pages, ...terms];
}

/** Index entries as documents; a heading carries the first text under it as its summary. */
export function indexDocs(entries: IndexEntry[]): SearchDoc[] {
  return entries.map((e, i) => {
    const base = { id: `ix:${i}`, path: e.p, tab: e.t, sub: e.u };
    if (e.h) {
      const next = entries[i + 1];
      const summary = next && next.p === e.p && !next.h ? next.x : "";
      return { ...base, kind: "section", title: e.x, body: summary };
    }
    return { ...base, kind: "text", title: e.s ?? e.u ?? e.t ?? pageLabel(e.p), body: e.x, bodyOnly: true };
  });
}

/** The page on screen as documents. */
export function liveDocs(path: string, blocks: Block[]): SearchDoc[] {
  return blocks.map((b, i) =>
    b.heading
      ? { id: `live:${i}`, kind: "section", path, title: b.label, body: blocks[i + 1]?.label ?? "", block: b }
      : { id: `live:${i}`, kind: "text", path, title: b.section ?? pageLabel(path), body: b.label, bodyOnly: true, block: b },
  );
}

/**
 * The index without what the page on screen already shows: those blocks come in
 * as live documents (current values, the UI language, a DOM node to jump to).
 */
export function withoutShown(docs: SearchDoc[], here: string, live: SearchDoc[], lang: Lang): SearchDoc[] {
  const shown = new Set(live.map((d) => fold(d.body).s));
  return docs.filter((d) => d.path !== here || d.kind === "page" || !shown.has(fold(translate(lang, d.body)).s));
}

/** Prepare documents for one UI language (cache the result per language). */
export function prepare(docs: SearchDoc[], lang: Lang): Prepared[] {
  return docs.map((doc) => {
    // live blocks are already in the UI language
    const title = doc.block ? doc.title : translate(lang, doc.title);
    const body = doc.block ? doc.body : translate(lang, doc.body);
    const fTitle = [fold(title)];
    const fBody = [fold(body)];
    if (title !== doc.title) fTitle.push(fold(doc.title));
    if (body !== doc.body) fBody.push(fold(doc.body));
    return { doc, fTitle, fBody, title, body };
  });
}

// ── The crawled index: loaded on first use (its own chunk), prepared once per language ──

let indexPromise: Promise<IndexEntry[]> | null = null;

/** Start loading the crawled index (the header button calls it on hover / focus). */
export function preloadIndex(): Promise<IndexEntry[]> {
  indexPromise ??= import("../../data/searchIndex.json")
    .then((m) => m.default as IndexEntry[])
    .catch(() => {
      indexPromise = null;
      return [];
    });
  return indexPromise;
}

const prepared = new WeakMap<IndexEntry[], Map<Lang, Prepared[]>>();

/** Pages, glossary and index, prepared for `lang` (cached per index and language). */
export function preparedIndex(entries: IndexEntry[], lang: Lang): Prepared[] {
  let byLang = prepared.get(entries);
  if (!byLang) prepared.set(entries, (byLang = new Map()));
  let out = byLang.get(lang);
  if (!out) byLang.set(lang, (out = prepare([...staticDocs(), ...indexDocs(entries)], lang)));
  return out;
}

const KIND_BONUS: Record<DocKind, number> = { page: 45, term: 35, section: 22, text: 0 };

function best(fs: Folded[], q: Query) {
  let out = { score: 0, spans: [] as Span[], shown: true };
  fs.forEach((f, i) => {
    const m = matchText(f, q.phrase, q.words);
    if (m.score > out.score) out = { ...m, shown: i === 0 };
  });
  return out;
}

/** Ranked results for `raw`, most relevant first. `here` is the route on screen. */
export function search(prepared: Prepared[], raw: string, here: string, lang: Lang, limit = 50): SearchHit[] {
  const q = prepareQuery(raw);
  if (q.words.length === 0) return [];
  const scored: SearchHit[] = [];
  for (const p of prepared) {
    const t = p.doc.bodyOnly ? { score: 0, spans: [], shown: true } : best(p.fTitle, q);
    const b = best(p.fBody, q);
    // a heading counts by its own words; its summary line only shows the match (the text itself is a result too)
    const top = Math.max(t.score * 1.25, p.doc.kind === "section" ? 0 : b.score);
    if (top === 0) continue;
    // a short exact text is the answer; a long paragraph that mentions it is context
    const length = Math.min(18, p.body.length / 60);
    const score = top + KIND_BONUS[p.doc.kind] - length + (p.doc.path === here ? 6 : 0);
    // spans only when the match was in the shown language
    const shown = snippet(p.body, b.shown ? b.spans : []);
    scored.push({
      doc: p.doc,
      score,
      title: p.title,
      titleSpans: t.shown ? t.spans : [],
      body: shown.text,
      bodySpans: shown.spans,
      trail: trail(p.doc, lang),
      here: p.doc.path === here,
    });
  }
  scored.sort((a, b) => b.score - a.score);
  // at most three hits from one section, so one long table cannot fill the list
  const perSection = new Map<string, number>();
  const seen = new Set<string>();
  const out: SearchHit[] = [];
  for (const h of scored) {
    const where = `${h.doc.path}|${h.doc.tab ?? ""}|${h.doc.sub ?? ""}|${h.title}`;
    const same = `${where}|${h.body}`;
    if (seen.has(same)) continue;
    const n = perSection.get(where) ?? 0;
    if (n >= 3) continue;
    seen.add(same);
    perSection.set(where, n + 1);
    out.push(h);
    if (out.length >= limit) break;
  }
  return out;
}

function trail(doc: SearchDoc, lang: Lang): string[] {
  if (doc.kind === "term") return [translate(lang, "Glossary")];
  const page = PAGE_OF.get(doc.path);
  const out = page ? [page.group, page.item.label] : [doc.path];
  if (doc.kind === "page") return [translate(lang, out[0])];
  if (doc.tab) out.push(doc.tab);
  if (doc.sub) out.push(doc.sub);
  return out.map((s) => translate(lang, s));
}
