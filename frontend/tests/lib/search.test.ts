/**
 * Header search: folding, ranking, snippets, the page-text blocks and the index.
 */

import { describe, expect, it } from "vitest";

import { NAV_GROUPS } from "../../src/constants/navigation";
import { indexDocs, prepare, search, staticDocs, type IndexEntry } from "../../src/lib/search/documents";
import { fold, matchText, prepareQuery, queryWords, snippet } from "../../src/lib/search/engine";
import { blockRange, collectBlocks, findInBlocks } from "../../src/lib/search/pageText";
import index from "../../src/data/searchIndex.json";

const match = (text: string, q: string) => {
  const p = prepareQuery(q);
  return matchText(fold(text), p.phrase, p.words);
};
const marked = (text: string, q: string) => match(text, q).spans.map(([a, b]) => text.slice(a, b));

describe("fold", () => {
  it("is case- and accent-blind, Turkish letters included, and maps back to the original", () => {
    expect(fold("Rüzgâr Kaynağı").s).toBe("ruzgar kaynagi");
    expect(fold("İŞLETME ılık").s).toBe("isletme ilik");
    expect(fold("a  \n b").s).toBe("a b");
    const f = fold("Ölçüm  değeri");
    const at = f.s.indexOf("degeri");
    expect("Ölçüm  değeri".slice(f.map[at])).toBe("değeri");
  });

  it("keeps numbers and hyphenated words whole in the query", () => {
    expect(queryWords("10.66 m/s cut-in, IEC 61850")).toEqual(["10.66", "m", "s", "cut-in", "iec", "61850"]);
  });
});

describe("matchText", () => {
  it("ranks exact > starts with > word start > inside a word", () => {
    const exact = match("STATCOM", "statcom").score;
    const starts = match("STATCOM sizing", "statcom").score;
    const word = match("Why a STATCOM", "statcom").score;
    const inside = match("xSTATCOM", "statcom").score;
    expect(exact).toBeGreaterThan(starts);
    expect(starts).toBeGreaterThan(word);
    expect(word).toBeGreaterThan(inside);
  });

  it("prefers the phrase to scattered words, and those to typos", () => {
    const phrase = match("export cable charging", "cable charging").score;
    const words = match("charging of each cable", "cable charging").score;
    const typo = match("charging of each cable", "cabel charging").score;
    expect(phrase).toBeGreaterThan(words);
    expect(words).toBeGreaterThan(typo);
    expect(typo).toBeGreaterThan(0);
    expect(match("nothing related", "cable").score).toBe(0);
  });

  it("matches a number only as a whole number", () => {
    expect(marked("15 MW turbine, 150 m hub, built 2015", "15")).toEqual(["15"]);
    expect(match("rated at 10.66 m/s", "10.66").score).toBeGreaterThan(0);
    expect(match("rated at 110.66 m/s", "10.66").score).toBe(0);
    expect(marked("export at 220 kV", "220 kv")).toEqual(["220 kV"]);
  });

  it("marks the original characters, accents and all", () => {
    expect(marked("Rüzgâr Kaynağı", "ruzgar")).toEqual(["Rüzgâr"]);
  });
});

describe("snippet", () => {
  it("cuts round the first match at word boundaries and moves the spans", () => {
    const text = `${"word ".repeat(60)}the STATCOM here ${"tail ".repeat(60)}`;
    const m = match(text, "statcom");
    const s = snippet(text, m.spans, 80);
    expect(s.text.startsWith("…")).toBe(true);
    expect(s.text.endsWith("…")).toBe(true);
    expect(s.spans.map(([a, b]) => s.text.slice(a, b))).toEqual(["STATCOM"]);
  });
});

describe("search", () => {
  const entries: IndexEntry[] = [
    { p: "/hv-grid", t: "Grid Analysis", h: 1, x: "Reactive power" },
    { p: "/hv-grid", t: "Grid Analysis", s: "Reactive power", x: "The STATCOM covers ±120 Mvar at the POC." },
    { p: "/scada", s: "GOOSE", x: "Trips travel as GOOSE messages in under 4 ms." },
  ];
  const prepared = prepare([...staticDocs(), ...indexDocs(entries)], "en");

  it("puts the closest match first and says where it lives", () => {
    const hits = search(prepared, "statcom", "/", "en");
    const first = hits.find((h) => h.doc.kind !== "page" && h.doc.kind !== "term");
    expect(first?.doc.kind).toBe("text");
    expect(first?.doc.path).toBe("/hv-grid");
    expect(first?.trail).toEqual(["Design", "Grid Integration", "Grid Analysis"]);
    expect(first?.title).toBe("Reactive power");
  });

  it("finds pages by name and description, and glossary terms", () => {
    const hits = search(prepared, "scada", "/", "en");
    expect(hits[0].doc.kind === "page" || hits[0].doc.kind === "term").toBe(true);
    expect(hits.some((h) => h.doc.id === "page:/scada")).toBe(true);
    expect(search(prepared, "ferranti", "/", "en")[0].doc.kind).toBe("term");
  });

  it("gives a heading the first text under it as its summary", () => {
    const hit = search(prepared, "reactive power", "/", "en").find((h) => h.doc.kind === "section");
    expect(hit?.body).toContain("STATCOM");
  });

  it("returns nothing for an empty query", () => {
    expect(search(prepared, "   ", "/", "en")).toEqual([]);
  });
});

describe("page text", () => {
  it("reads leaf blocks with the heading above, joining inline markup", () => {
    document.body.innerHTML = `<main>
      <h2>Rotor</h2>
      <p>P<sub style="display:inline">max</sub> is <b style="display:inline">15 MW</b></p>
      <div>loose text<p>inner</p></div>
    </main>`;
    const blocks = collectBlocks(document.querySelector("main")!);
    expect(blocks.map((b) => b.text.trim())).toEqual(["Rotor", "Pmax is 15 MW", "loose text", "inner"]);
    expect(blocks[1].section).toBe("Rotor");
    expect(blocks[1].label).toBe("Pmax is 15 MW");
    expect(blocks[0].heading).toBe(true);
  });

  it("spaces text that sits in separate boxes, as on a KPI card", () => {
    // (jsdom has no default stylesheet: inline vs block is spelled out)
    document.body.innerHTML = `<main><p><span style="display:block">Frequency</span><span style="display:block">49.99 Hz</span></p></main>`;
    expect(collectBlocks(document.querySelector("main")!)[0].label).toBe("Frequency 49.99 Hz");
  });

  it("maps a match across text nodes to a DOM range", () => {
    document.body.innerHTML = `<main><p>P<sub>max</sub> is <b>15 MW</b></p></main>`;
    const blocks = collectBlocks(document.querySelector("main")!);
    const hits = findInBlocks(blocks, prepareQuery("15 mw"));
    expect(hits).toHaveLength(1);
    expect(hits[0].range.toString()).toBe("15 MW");
    expect(blockRange(blocks[0], [0, 4])?.toString()).toBe("Pmax");
  });
});

describe("crawled index (data/searchIndex.json)", () => {
  const entries = index as IndexEntry[];
  const paths = new Set(NAV_GROUPS.flatMap((g) => g.items.map((i) => i.path)));

  it("covers the menu pages and points only at them", () => {
    expect(entries.length).toBeGreaterThan(500);
    for (const e of entries) expect(paths.has(e.p)).toBe(true);
    expect(new Set(entries.map((e) => e.p)).size).toBeGreaterThanOrEqual(paths.size - 2);
  });
});
