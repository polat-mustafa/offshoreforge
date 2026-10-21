/**
 * The text of the page on screen as search blocks, and DOM ranges for matches.
 *
 * A block is a leaf element of <main> (paragraph, list item, table cell, heading,
 * label, button… with no such element inside) and its text nodes — inline spans,
 * code and sub/sup stay part of it, so "P<sub>max</sub>" reads "Pmax". Text that
 * sits loose next to blocks forms a block of its own. scripts/search-index.mjs
 * walks pages with the same rules to build the cross-page index.
 *
 * Highlighting uses the CSS Custom Highlight API: ranges are painted by the
 * browser and the DOM is never touched, so React and the in-place translator
 * (lib/i18n) keep working on the same text nodes.
 */

import { fold, matchText, type Query, type Span } from "./engine";

const BLOCK = new Set([
  "P", "LI", "TD", "TH", "H1", "H2", "H3", "H4", "H5", "H6", "DT", "DD", "FIGCAPTION", "SUMMARY",
  "BLOCKQUOTE", "LABEL", "BUTTON", "A", "DIV", "SECTION", "ARTICLE", "HEADER", "FOOTER", "ASIDE",
  "UL", "OL", "DL", "TABLE", "TR", "TBODY", "THEAD", "FORM", "FIELDSET", "LEGEND", "CAPTION",
]);
const HEADING = /^H[1-4]$/;
/** Not page text: charts, 3D, hidden parts, tab strips and the search UI itself. */
const SKIP = "script,style,svg,canvas,textarea,input,select,[aria-hidden='true'],[role='tablist'],.js-plotly-plot,[data-search-ui]";

export interface Block {
  el: Element;
  nodes: Text[];
  /** The nodes' text joined (offsets index into it). */
  text: string;
  /** The text to read: a space where one element ends and the next begins ("Frequency 49.99 Hz"), trimmed. */
  label: string;
  heading: boolean;
  /** Text of the nearest heading above (null at the top of the page). */
  section: string | null;
}

/** Laid out on the page (jsdom lays out nothing, so there everything counts). */
const visible = (el: Element) => el.getClientRects().length > 0 || navigator.userAgent.includes("jsdom");

/** Inside a skipped part of `root` (above `root` does not count: an open dialog hides the whole app). */
function skipped(el: Element | null, root: Element): boolean {
  const hit = el?.closest(SKIP);
  return !!hit && root.contains(hit);
}

function textNodes(el: Element, own: boolean, root: Element): Text[] {
  if (own) return [...el.childNodes].filter((n): n is Text => n.nodeType === Node.TEXT_NODE);
  const out: Text[] = [];
  const walk = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
  for (let n = walk.nextNode(); n; n = walk.nextNode()) {
    if (!skipped(n.parentElement, root)) out.push(n as Text);
  }
  return out;
}

/** Laid out as a box of its own (a block, or an item of a flex / grid row), not inline in a sentence. */
const boxed = (el: Element) => !/^inline|^contents/.test(window.getComputedStyle(el).display);

/** Does going from text node `a` to `b` leave or enter an element laid out as its own box? */
function crossesBox(a: Node, b: Node): boolean {
  for (let p = a.parentElement; p && !p.contains(b); p = p.parentElement) if (boxed(p)) return true;
  for (let p = b.parentElement; p && !p.contains(a); p = p.parentElement) if (boxed(p)) return true;
  return false;
}

/**
 * Text nodes joined for reading: a space where text leaves or enters an element laid
 * out as its own box ("Frequency" | "49.99" | "Hz" on a KPI card → "Frequency 49.99 Hz"),
 * none inside a sentence ("P<sub>max</sub>" → "Pmax").
 */
export function readable(nodes: Text[]): string {
  let out = "";
  nodes.forEach((n, i) => {
    const v = n.nodeValue ?? "";
    if (i > 0 && !/\s$/.test(out) && !/^\s/.test(v) && crossesBox(nodes[i - 1], n)) out += " ";
    out += v;
  });
  return out.replace(/\s+/g, " ").trim();
}

/** The text blocks of `root` in document order. */
export function collectBlocks(root: Element): Block[] {
  const all = [...root.querySelectorAll("*")];
  // elements with a block below them, in one bottom-up pass
  const hasBlockBelow = new Set<Element>();
  for (let i = all.length - 1; i >= 0; i--) {
    const el = all[i];
    if ((BLOCK.has(el.tagName) || hasBlockBelow.has(el)) && el.parentElement) hasBlockBelow.add(el.parentElement);
  }
  const out: Block[] = [];
  const leaves = new Set<Element>();
  let section: string | null = null;
  for (const el of all) {
    if (skipped(el, root)) continue;
    const isHeading = HEADING.test(el.tagName) || el.getAttribute("role") === "heading";
    const leaf = BLOCK.has(el.tagName) && !hasBlockBelow.has(el);
    let nodes: Text[];
    if (leaf) {
      nodes = textNodes(el, false, root);
      leaves.add(el);
    } else {
      // loose text next to blocks, unless an inline wrapper inside a leaf block (already counted)
      let inLeaf = false;
      for (let p = el.parentElement; p && p !== root && !inLeaf; p = p.parentElement) inLeaf = leaves.has(p);
      if (inLeaf) continue;
      nodes = textNodes(el, true, root).filter((n) => /\S/.test(n.nodeValue ?? ""));
    }
    const text = nodes.map((n) => n.nodeValue ?? "").join("");
    if (!/\S/.test(text) || !visible(el)) continue;
    const label = readable(nodes);
    if (isHeading && leaf) section = label.slice(0, 120);
    out.push({ el, nodes, text, label, heading: isHeading && leaf, section: isHeading && leaf ? null : section });
  }
  return out;
}

/** A DOM range over [start, end) of a block's joined text. */
export function blockRange(block: Block, [start, end]: Span): Range | null {
  const range = document.createRange();
  let pos = 0;
  let set = 0;
  for (const n of block.nodes) {
    const len = n.nodeValue?.length ?? 0;
    if (set === 0 && start <= pos + len) {
      range.setStart(n, Math.max(0, start - pos));
      set = 1;
    }
    if (set === 1 && end <= pos + len) {
      range.setEnd(n, Math.max(0, end - pos));
      return range;
    }
    pos += len;
  }
  return null;
}

export interface PageHit {
  block: Block;
  range: Range;
}

/** Every match of `query` in the blocks, in page order. */
export function findInBlocks(blocks: Block[], query: Query): PageHit[] {
  const out: PageHit[] = [];
  for (const block of blocks) {
    const m = matchText(fold(block.text), query.phrase, query.words);
    if (m.score === 0) continue;
    for (const span of m.spans) {
      const range = blockRange(block, span);
      if (range) out.push({ block, range });
    }
  }
  return out;
}

// ── Painting ─────────────────────────────────────────────────────────

export const HIGHLIGHT_ALL = "of-search";
export const HIGHLIGHT_ACTIVE = "of-search-active";

/** False in browsers without the Highlight API (and in jsdom): the find bar still scrolls and rings the match. */
export const canHighlight = () => typeof CSS !== "undefined" && "highlights" in CSS && typeof Highlight !== "undefined";

export function paint(all: Range[], active: Range | null) {
  if (!canHighlight()) return;
  CSS.highlights.set(HIGHLIGHT_ALL, new Highlight(...all.filter((r) => r !== active)));
  if (active) CSS.highlights.set(HIGHLIGHT_ACTIVE, new Highlight(active));
  else CSS.highlights.delete(HIGHLIGHT_ACTIVE);
}

export function unpaint() {
  if (!canHighlight()) return;
  CSS.highlights.delete(HIGHLIGHT_ALL);
  CSS.highlights.delete(HIGHLIGHT_ACTIVE);
}
