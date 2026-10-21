// Builds the content index the header search reads (src/data/searchIndex.json).
//
//   npm run dev                                  (frontend; the backend is optional)
//   npm run search:index -- [base-url]           → src/data/searchIndex.json
//
// Opens every menu page (constants/navigation.ts) in system Chrome in English and
// reference mode, clicks each tab and each tab inside it, and records every visible
// text block of <main> with where it sits: page, tab, sub-tab and the heading above
// it. The search (src/lib/search) ranks these blocks; on a click the find bar opens
// the page, the same tabs, and highlights the block. Re-run after adding pages or
// changing their text — a stale entry only means the find bar falls back to
// highlighting the query wherever it appears on that page.

import { readFileSync, writeFileSync } from "node:fs";
import { chromium } from "@playwright/test";

const base = process.argv[2] ?? "http://localhost:3000";
const nav = readFileSync(new URL("../src/constants/navigation.ts", import.meta.url), "utf8");
const pages = [...nav.matchAll(/path: "([^"]+)"/g)].map((m) => m[1]);

/**
 * Runs in the page: the text blocks of <main> with the heading above each — a copy of
 * collectBlocks() in src/lib/search/pageText.ts (keep the two in step), so a block found
 * here is the same block the find bar looks for.
 */
function blocks() {
  const BLOCK = new Set(["P", "LI", "TD", "TH", "H1", "H2", "H3", "H4", "H5", "H6", "DT", "DD", "FIGCAPTION", "SUMMARY", "BLOCKQUOTE", "LABEL", "BUTTON", "A", "DIV", "SECTION", "ARTICLE", "HEADER", "FOOTER", "ASIDE", "UL", "OL", "DL", "TABLE", "TR", "TBODY", "THEAD", "FORM", "FIELDSET", "LEGEND", "CAPTION"]);
  const HEADING = /^H[1-4]$/;
  const SKIP = "script,style,svg,canvas,textarea,input,select,[aria-hidden='true'],[role='tablist'],.js-plotly-plot,[data-search-ui]";
  const root = document.querySelector("main");
  if (!root) return [];
  const all = [...root.querySelectorAll("*")];
  const hasBlockBelow = new Set();
  for (let i = all.length - 1; i >= 0; i--) {
    const el = all[i];
    if ((BLOCK.has(el.tagName) || hasBlockBelow.has(el)) && el.parentElement) hasBlockBelow.add(el.parentElement);
  }
  const skipped = (el) => {
    const hit = el?.closest(SKIP);
    return !!hit && root.contains(hit);
  };
  const textNodes = (el, own) => {
    if (own) return [...el.childNodes].filter((n) => n.nodeType === Node.TEXT_NODE);
    const out = [];
    const walk = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    for (let n = walk.nextNode(); n; n = walk.nextNode()) if (!skipped(n.parentElement)) out.push(n);
    return out;
  };
  const out = [];
  const leaves = new Set();
  let section = null;
  for (const el of all) {
    if (skipped(el)) continue;
    const isHeading = HEADING.test(el.tagName) || el.getAttribute("role") === "heading";
    const leaf = BLOCK.has(el.tagName) && !hasBlockBelow.has(el);
    let nodes;
    if (leaf) {
      nodes = textNodes(el, false);
      leaves.add(el);
    } else {
      let inLeaf = false;
      for (let p = el.parentElement; p && p !== root && !inLeaf; p = p.parentElement) inLeaf = leaves.has(p);
      if (inLeaf) continue;
      nodes = textNodes(el, true).filter((n) => /\S/.test(n.nodeValue ?? ""));
    }
    const raw = nodes.map((n) => n.nodeValue ?? "").join("");
    if (!/\S/.test(raw) || el.getClientRects().length === 0) continue;
    // readable(): a space where text leaves or enters an element laid out as its own box
    const boxed = (e) => !/^inline|^contents/.test(getComputedStyle(e).display);
    const crossesBox = (a, b) => {
      for (let p = a.parentElement; p && !p.contains(b); p = p.parentElement) if (boxed(p)) return true;
      for (let p = b.parentElement; p && !p.contains(a); p = p.parentElement) if (boxed(p)) return true;
      return false;
    };
    let text = "";
    nodes.forEach((n, i) => {
      const v = n.nodeValue ?? "";
      if (i > 0 && !/\s$/.test(text) && !/^\s/.test(v) && crossesBox(nodes[i - 1], n)) text += " ";
      text += v;
    });
    text = text.replace(/\s+/g, " ").trim();
    const heading = isHeading && leaf;
    if (heading) section = text.slice(0, 120);
    // index only what a search can use: words or numbers
    if (text.length < 2 || !/[A-Za-z]{2}|\d/.test(text)) continue;
    out.push({ h: heading ? 1 : 0, s: heading ? null : section, x: text.length > 400 ? text.slice(0, 400) + "…" : text });
  }
  return out;
}

const browser = await chromium.launch({ channel: "chrome" });
const context = await browser.newContext({ viewport: { width: 1600, height: 1000 } });
await context.addInitScript(() => {
  localStorage.setItem("of.lang.v1", "en");
  localStorage.setItem("of.mode.v1", "reference");
  localStorage.setItem("of.tour.v1", JSON.stringify({ completed: [], welcomeDismissed: true }));
});
const page = await context.newPage();

const tabLabel = (loc) => loc.evaluate((el) => (el.textContent ?? "").replace(/\s+/g, " ").trim());
const tabsIn = async () => {
  const loc = page.locator("main [role='tab']");
  const out = [];
  for (let i = 0, n = await loc.count(); i < n; i++) out.push(await tabLabel(loc.nth(i)));
  return out;
};
const clickTab = async (label) => {
  const loc = page.locator("main [role='tab']").filter({ hasText: label }).first();
  await loc.click({ timeout: 2000 }).catch(() => {});
  await page.waitForTimeout(1200);
};

const entries = [];
for (const path of pages) {
  await page.goto(base + path, { waitUntil: "networkidle" }).catch(() => {});
  await page.waitForTimeout(2500);
  const seen = new Set();
  const add = (list, tab, sub) => {
    for (const b of list) {
      const key = `${b.s}\u0000${b.x}`;
      if (seen.has(key)) continue;
      seen.add(key);
      entries.push({ p: path, ...(tab ? { t: tab } : {}), ...(sub ? { u: sub } : {}), ...(b.h ? { h: 1 } : {}), ...(b.s ? { s: b.s } : {}), x: b.x });
    }
  };
  add(await page.evaluate(blocks));
  const top = (await tabsIn()).filter(Boolean);
  for (const tab of top) {
    await clickTab(tab);
    add([{ h: 1, s: null, x: tab }], tab);
    add(await page.evaluate(blocks), tab);
    const nested = (await tabsIn()).filter((l) => l && !top.includes(l));
    for (const sub of nested) {
      await clickTab(sub);
      add([{ h: 1, s: null, x: sub }], tab, sub);
      add(await page.evaluate(blocks), tab, sub);
    }
  }
  console.log(`${path}: ${seen.size} blocks, ${top.length} tabs`);
}
await browser.close();

const file = new URL("../src/data/searchIndex.json", import.meta.url);
writeFileSync(file, JSON.stringify(entries) + "\n");
console.log(`${entries.length} blocks → src/data/searchIndex.json`);
