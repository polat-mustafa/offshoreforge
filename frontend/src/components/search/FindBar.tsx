/**
 * Find bar: after a search result is chosen, highlights the query on the page.
 *
 * On arrival it opens the result's tab (and the tab inside it), waits for the
 * block to render, scrolls it to the middle of the screen and rings it once.
 * Every other match on the page is tinted, the chosen one solid (CSS Highlight
 * API, lib/search/pageText.ts — the DOM is not changed). ↑ / ↓ (or F3 /
 * Shift+F3) step through the matches; ✕ or Esc clear the highlight, and so does
 * leaving the page. Live values keep updating underneath: the highlight follows
 * them.
 */

import { ChevronDown, ChevronUp, Loader2, Search, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";

import { translate, useLangStore, type Lang } from "../../lib/i18n";
import { fold, prepareQuery } from "../../lib/search/engine";
import { blockRange, collectBlocks, findInBlocks, paint, unpaint, type Block, type PageHit } from "../../lib/search/pageText";
import { useSearchStore, type FindTarget } from "../../store/searchStore";

/** How long to wait for the page and its tabs, then for the block itself. */
const TABS_MS = 3000;
const BLOCK_MS = 2500;

/** Compared without spaces: the index and the page may space element boundaries differently. */
const norm = (s: string | null | undefined) => fold(s ?? "").s.replace(/…$/, "").replace(/ /g, "");

/** A tab of the page by its English label (or its translation). */
function findTab(root: Element, label: string, lang: Lang): HTMLElement | null {
  const want = [norm(label), norm(translate(lang, label))];
  const tabs = [...root.querySelectorAll<HTMLElement>("[role='tab']")];
  return (
    tabs.find((t) => want.includes(norm(t.textContent))) ??
    tabs.find((t) => want.some((w) => w && norm(t.textContent).startsWith(w))) ??
    null
  );
}

/** The block showing `text` (English from the index, or its translation). */
function locate(blocks: Block[], target: FindTarget, lang: Lang): Block | null {
  if (target.block) return blocks.find((b) => b.el === target.block?.el) ?? null;
  if (!target.text) return null;
  const want = [...new Set([norm(target.text), norm(translate(lang, target.text))])].filter(Boolean);
  const folded = blocks.map((b) => norm(b.label));
  for (const w of want) {
    const i = folded.indexOf(w);
    if (i !== -1) return blocks[i];
  }
  // the index cuts long texts; live numbers may differ in a long block
  for (const w of want) {
    if (w.length < 10) continue;
    const i = folded.findIndex((f) => f.startsWith(w) || (f.length >= 10 && w.startsWith(f)));
    if (i !== -1) return blocks[i];
  }
  return null;
}

const prefersReducedMotion = () => window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;

type Status = "seeking" | "found" | "missing";

export function FindBar() {
  const find = useSearchStore((s) => s.find);
  const clearFind = useSearchStore((s) => s.clearFind);
  const lang = useLangStore((s) => s.ready);
  const { pathname } = useLocation();

  const [hits, setHits] = useState<PageHit[]>([]);
  const [index, setIndex] = useState(0);
  const [status, setStatus] = useState<Status>("seeking");
  const [ring, setRing] = useState<{ rect: DOMRect; key: number } | null>(null);
  /** Bumped when the view should move to the active match (not on live refreshes). */
  const [jump, setJump] = useState(0);
  const activeEl = useRef<Element | null>(null);

  // Leaving the page ends the search
  useEffect(() => {
    const f = useSearchStore.getState().find;
    if (f && pathname !== f.target.path) useSearchStore.getState().clearFind();
  }, [pathname]);

  // Find the target: open its tabs, wait for it, collect every match on the page
  useEffect(() => {
    if (!find || pathname !== find.target.path) return;
    const { target } = find;
    const query = prepareQuery(find.query);
    const started = performance.now();
    let blockDeadline = 0;
    let tabDone = !target.tab;
    let subDone = !target.sub;
    let timer = 0;
    setStatus("seeking");
    setHits([]);

    const finish = (blocks: Block[], block: Block | null) => {
      const all = findInBlocks(blocks, query);
      let at = block ? all.findIndex((h) => h.block.el === block.el) : 0;
      if (block && at === -1) {
        // matched through the other language or a typo: mark the whole block
        const lead = block.text.length - block.text.trimStart().length;
        const range = blockRange(block, [lead, block.text.trimEnd().length]);
        if (range) {
          const order = blocks.indexOf(block);
          at = all.findIndex((h) => blocks.indexOf(h.block) > order);
          if (at === -1) at = all.length;
          all.splice(at, 0, { block, range });
        }
      }
      setHits(all);
      setIndex(Math.max(0, at));
      setStatus(all.length ? "found" : "missing");
      activeEl.current = all[Math.max(0, at)]?.block.el ?? null;
      setJump((j) => j + 1);
    };

    const step = () => {
      const main = document.querySelector("main");
      const late = performance.now() - started > TABS_MS;
      if (main) {
        if (!tabDone && target.tab) {
          const tab = findTab(main, target.tab, lang);
          if (tab) {
            if (tab.getAttribute("aria-selected") !== "true") tab.click();
            tabDone = true;
          } else if (late) tabDone = true;
        } else if (!subDone && target.sub) {
          const sub = findTab(main, target.sub, lang);
          if (sub) {
            if (sub.getAttribute("aria-selected") !== "true") sub.click();
            subDone = true;
          } else if (late) subDone = true;
        } else {
          blockDeadline ||= performance.now() + BLOCK_MS;
          const blocks = collectBlocks(main);
          const block = locate(blocks, target, lang);
          // not there after a while (another state of the page): every match of the query instead
          if (block || performance.now() > blockDeadline) return finish(blocks, block);
        }
      }
      timer = window.setTimeout(step, 120);
    };
    // let the page commit (and a lazy route load) first
    timer = window.setTimeout(step, 60);
    return () => window.clearTimeout(timer);
    // runs per jump (nonce: the same result chosen again) and per language; not per find object
  }, [find?.nonce, pathname, lang]);

  // Live pages re-render: keep the highlight on the text as it is now
  useEffect(() => {
    if (!find || status !== "found") return;
    const main = document.querySelector("main");
    if (!main) return;
    const query = prepareQuery(find.query);
    let timer = 0;
    const observer = new MutationObserver(() => {
      window.clearTimeout(timer);
      timer = window.setTimeout(() => {
        const all = findInBlocks(collectBlocks(main), query);
        if (all.length === 0) return; // a tab switched away; keep what we had
        const at = all.findIndex((h) => h.block.el === activeEl.current);
        setHits(all);
        setIndex((i) => (at !== -1 ? at : Math.min(i, all.length - 1)));
      }, 350);
    });
    observer.observe(main, { subtree: true, childList: true, characterData: true });
    return () => {
      observer.disconnect();
      window.clearTimeout(timer);
    };
  }, [find, status]);

  // Paint
  useEffect(() => {
    if (!find || hits.length === 0) return unpaint();
    paint(
      hits.map((h) => h.range),
      hits[index]?.range ?? null,
    );
  }, [find, hits, index]);
  useEffect(() => () => unpaint(), []);

  // Move the view to the active match and ring it once
  useEffect(() => {
    const hit = hits[index];
    if (!jump || !hit) return;
    activeEl.current = hit.block.el;
    const el = hit.range.startContainer.parentElement ?? hit.block.el;
    const smooth = !prefersReducedMotion();
    el.scrollIntoView?.({ block: "center", inline: "nearest", behavior: smooth ? "smooth" : "auto" });
    const t = window.setTimeout(
      () => {
        const rect = hit.range.getBoundingClientRect?.();
        if (rect && (rect.width || rect.height)) setRing({ rect, key: jump });
      },
      smooth ? 420 : 30,
    );
    return () => window.clearTimeout(t);
  }, [jump]);

  useEffect(() => {
    if (!ring) return;
    const t = window.setTimeout(() => setRing(null), 1600);
    const hide = () => setRing(null);
    document.querySelector("main")?.addEventListener("scroll", hide, { once: true, passive: true });
    return () => window.clearTimeout(t);
  }, [ring]);

  const close = useCallback(() => {
    unpaint();
    setHits([]);
    setRing(null);
    clearFind();
  }, [clearFind]);

  const move = useCallback(
    (by: number) => {
      if (hits.length < 2) return;
      setIndex((i) => (i + by + hits.length) % hits.length);
      setJump((j) => j + 1);
    },
    [hits.length],
  );

  // Esc clears (once no dialog is open to take it); F3 / Shift+F3 step
  useEffect(() => {
    if (!find) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !e.defaultPrevented && !document.querySelector("[role='dialog']")) close();
      else if (e.key === "F3") {
        e.preventDefault();
        move(e.shiftKey ? -1 : 1);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [find, close, move]);

  if (!find) return null;

  return (
    <>
      <div
        data-search-ui
        role="search"
        aria-label="Find on page"
        className="of-find-bar absolute right-3 top-2 z-[1900] flex h-10 max-w-[calc(100%-1.5rem)] items-center gap-1 rounded-lg border border-border-secondary bg-bg-elevated/95 pl-3 pr-1 shadow-lg shadow-black/30 backdrop-blur md:right-5"
      >
        <Search size={14} className="shrink-0 text-accent" aria-hidden />
        <span translate="no" className="ml-1 min-w-0 max-w-[14rem] truncate text-sm font-medium text-text-primary" title={find.query}>
          {find.query}
        </span>
        <span className="mx-2 h-4 w-px shrink-0 bg-border-secondary" aria-hidden />
        <span aria-live="polite" className="shrink-0 whitespace-nowrap font-mono text-xs tabular-nums text-text-secondary">
          {status === "seeking" ? (
            <span className="flex items-center gap-1.5 font-sans">
              <Loader2 size={12} className="animate-spin" aria-hidden />
              Finding…
            </span>
          ) : status === "missing" ? (
            <span className="font-sans text-status-warning" title="The text is not on screen now: it may need the backend or another state of the page.">
              Not on this page now
            </span>
          ) : (
            `${index + 1} / ${hits.length}`
          )}
        </span>
        <span className="ml-1 flex shrink-0 items-center">
          <button
            type="button"
            onClick={() => move(-1)}
            disabled={hits.length < 2}
            aria-label="Previous match"
            title="Previous match (Shift+F3)"
            className="flex h-8 w-8 items-center justify-center rounded-md text-text-secondary hover:bg-bg-hover hover:text-text-primary disabled:opacity-35 disabled:hover:bg-transparent"
          >
            <ChevronUp size={16} />
          </button>
          <button
            type="button"
            onClick={() => move(1)}
            disabled={hits.length < 2}
            aria-label="Next match"
            title="Next match (F3)"
            className="flex h-8 w-8 items-center justify-center rounded-md text-text-secondary hover:bg-bg-hover hover:text-text-primary disabled:opacity-35 disabled:hover:bg-transparent"
          >
            <ChevronDown size={16} />
          </button>
          <button
            type="button"
            onClick={close}
            aria-label="Clear highlight"
            title="Clear highlight (Esc)"
            className="flex h-8 w-8 items-center justify-center rounded-md text-text-secondary hover:bg-bg-hover hover:text-text-primary"
          >
            <X size={16} />
          </button>
        </span>
      </div>
      {ring && (
        <div
          key={ring.key}
          aria-hidden
          className="of-search-ring pointer-events-none fixed z-[1850] rounded-md"
          style={{ left: ring.rect.left - 4, top: ring.rect.top - 3, width: ring.rect.width + 8, height: ring.rect.height + 6 }}
        />
      )}
    </>
  );
}
