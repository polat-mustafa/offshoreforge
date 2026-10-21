/**
 * Header search: text normalisation and ranking.
 *
 * Matching is accent- and case-blind (Turkish ı/İ/ş/ğ fold to i/s/g, "−" to "-"),
 * so "rüzgar" finds "Rüzgâr" and "statcom" finds "STATCOM". Every normalised
 * string keeps a map back to the original's character offsets, so snippets and
 * the in-page highlight mark exactly the characters that matched.
 *
 * Score, highest first: the whole query as a phrase (exact text > starts with >
 * at a word start > inside a word) beats all words present, which beats words
 * matched with a typo (one edit up to 7 letters, two above), which beats some
 * words present. Pages, headings and glossary terms weigh more than body text;
 * short texts a little more than long ones. A number only matches a whole
 * number: "15" finds "15 MW", not "150" or "2015".
 */

export interface Folded {
  /** Lower-case, accent-free text. */
  s: string;
  /** Original offset of each character of `s` (plus one past the end). */
  map: number[];
}

const MARKS = /[̀-ͯ]/g;
const SPECIAL: Record<string, string> = { ı: "i", "−": "-", "–": "-", "—": "-", "’": "'", "‘": "'", ß: "ss", "µ": "μ" };

/** Fold `text` for matching (whitespace runs become one space) and keep the offsets back to it. */
export function fold(text: string): Folded {
  let s = "";
  const map: number[] = [];
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (/\s/.test(c)) {
      if (s.length > 0 && s[s.length - 1] !== " ") {
        s += " ";
        map.push(i);
      }
      continue;
    }
    const f = (SPECIAL[c] ?? c.normalize("NFD").replace(MARKS, "").toLowerCase()).replace(MARKS, "");
    for (let k = 0; k < f.length; k++) {
      s += f[k];
      map.push(i);
    }
  }
  map.push(text.length);
  return { s, map };
}

/** The query's words (folded); "." "," "-" inside a word or number ("10.66", "cut-in") stay. */
export function queryWords(query: string): string[] {
  return fold(query)
    .s.split(/[\s/;:()[\]{}"'!?]+/)
    .map((w) => w.replace(/^[.,-]+|[.,-]+$/g, ""))
    .filter(Boolean);
}

const isWordChar = (c: string | undefined) => c !== undefined && /[\p{L}\p{N}]/u.test(c);
const isNumber = (w: string) => /^\d[\d.,]*$/.test(w);

/** Every start of `word` in `hay`; a number must stand alone (no digit right before or after). */
function findAll(hay: string, word: string): number[] {
  const out: number[] = [];
  const num = isNumber(word);
  for (let i = hay.indexOf(word); i !== -1; i = hay.indexOf(word, i + 1)) {
    if (num) {
      const before = hay[i - 1];
      const after = hay[i + word.length];
      if (/\d/.test(before ?? "") || (/[.,]/.test(before ?? "") && /\d/.test(hay[i - 2] ?? ""))) continue;
      if (/\d/.test(after ?? "") || (/[.,]/.test(after ?? "") && /\d/.test(hay[i + word.length + 1] ?? ""))) continue;
    }
    out.push(i);
  }
  return out;
}

const atWordStart = (hay: string, i: number) => !isWordChar(hay[i - 1]);

/** Edit distance of `a` and `b`, or Infinity once it exceeds `max`. */
function editDistance(a: string, b: string, max: number): number {
  if (Math.abs(a.length - b.length) > max) return Infinity;
  let prev = Array.from({ length: b.length + 1 }, (_, j) => j);
  for (let i = 1; i <= a.length; i++) {
    const cur = [i];
    let best = i;
    for (let j = 1; j <= b.length; j++) {
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
      best = Math.min(best, cur[j]);
    }
    if (best > max) return Infinity;
    prev = cur;
  }
  return prev[b.length] <= max ? prev[b.length] : Infinity;
}

/** A matched span in the original text, [start, end). */
export type Span = [number, number];

export interface Match {
  /** 0 = no match; higher is better. */
  score: number;
  /** Matched spans in the original text, in order, not overlapping. */
  spans: Span[];
}

const NO_MATCH: Match = { score: 0, spans: [] };

function toSpans(f: Folded, hits: [number, number][]): Span[] {
  const sorted = hits.sort((a, b) => a[0] - b[0]);
  const out: Span[] = [];
  for (const [i, len] of sorted) {
    const span: Span = [f.map[i], f.map[i + len - 1] + 1];
    const last = out[out.length - 1];
    if (last && span[0] <= last[1]) last[1] = Math.max(last[1], span[1]);
    else out.push(span);
  }
  return out;
}

/** How well `text` (folded) matches the query (its folded phrase and words). */
export function matchText(f: Folded, phrase: string, words: string[]): Match {
  if (!phrase || words.length === 0) return NO_MATCH;
  const hay = f.s;
  // 1. the whole query as written
  const phraseAt = words.length === 1 ? findAll(hay, words[0]) : findAll(hay, phrase);
  if (phraseAt.length > 0) {
    const len = words.length === 1 ? words[0].length : phrase.length;
    const first = phraseAt.find((i) => atWordStart(hay, i)) ?? phraseAt[0];
    let score = 100;
    if (hay.trim() === phrase) score += 80;
    else if (first === 0) score += 40;
    else if (atWordStart(hay, first)) score += 25;
    return { score, spans: toSpans(f, phraseAt.map((i) => [i, len])) };
  }
  // 2. every word somewhere; 3. with typos allowed
  const hits: [number, number][] = [];
  let found = 0;
  let fuzzy = 0;
  let starts = 0;
  let tokens: { w: string; i: number }[] | null = null;
  for (const w of words) {
    const at = findAll(hay, w);
    if (at.length > 0) {
      found++;
      if (at.some((i) => atWordStart(hay, i))) starts++;
      at.forEach((i) => hits.push([i, w.length]));
      continue;
    }
    if (w.length < 4 || isNumber(w)) continue;
    tokens ??= [...hay.matchAll(/[\p{L}\p{N}]+/gu)].map((m) => ({ w: m[0], i: m.index }));
    const max = w.length <= 7 ? 1 : 2;
    // a typo in the word, or the typed word as the start of a longer one ("anemo" → "anemometer")
    const near = tokens.filter((t) => editDistance(w, t.w.slice(0, w.length + max), max) <= max);
    if (near.length > 0) {
      fuzzy++;
      near.forEach((t) => hits.push([t.i, t.w.length]));
    }
  }
  const matched = found + fuzzy;
  if (matched === words.length) {
    const score = fuzzy === 0 ? 60 + 4 * starts : 35 - 3 * fuzzy;
    return { score, spans: toSpans(f, hits) };
  }
  // 4. a longer query with most of its words
  if (words.length >= 2 && found >= Math.ceil(words.length / 2)) {
    return { score: 15 * (matched / words.length), spans: toSpans(f, hits) };
  }
  return NO_MATCH;
}

/** A prepared query: fold once, match many texts. */
export interface Query {
  raw: string;
  phrase: string;
  words: string[];
}

export function prepareQuery(raw: string): Query {
  const words = queryWords(raw);
  return { raw, phrase: words.join(" "), words };
}

/**
 * The part of `text` around its first match, cut at word boundaries, with the
 * spans moved into it. `width` is the rough length in characters.
 */
export function snippet(text: string, spans: Span[], width = 160): { text: string; spans: Span[] } {
  if (text.length <= width) return { text, spans };
  const first = spans[0]?.[0] ?? 0;
  let start = Math.max(0, first - Math.round(width * 0.3));
  if (start > 0) {
    const space = text.indexOf(" ", start);
    start = space !== -1 && space < first ? space + 1 : start;
  }
  let end = Math.min(text.length, start + width);
  if (end < text.length) {
    const space = text.lastIndexOf(" ", end);
    if (space > first) end = space;
  }
  const lead = start > 0 ? "…" : "";
  const tail = end < text.length ? "…" : "";
  const shift = start - lead.length;
  const moved = spans
    .filter(([a, b]) => b > start && a < end)
    .map(([a, b]): Span => [Math.max(a, start) - shift, Math.min(b, end) - shift]);
  return { text: lead + text.slice(start, end) + tail, spans: moved };
}
