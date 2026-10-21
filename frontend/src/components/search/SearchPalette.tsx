/**
 * Header search (Ctrl K / ⌘K / "/"): one box for the whole app.
 *
 * Looks through every page, tab and text block (the crawled index, data/
 * searchIndex.json, loaded on first open), the glossary, and the page on screen
 * as it is now. Results come most relevant first, each with where it lives
 * (stage › page › tab) and the sentence it matched; a close glossary match puts
 * its definition on top. Choosing a result opens that page and tab and hands
 * over to the find bar (FindBar.tsx), which highlights the match.
 *
 * Keys: ↑ ↓ move, Enter opens, Esc clears the box and then closes. Results are
 * rendered in the UI language here (translate="no" keeps the in-place
 * translator off them); the rest of the chrome is translated like any page.
 */

import * as Dialog from "@radix-ui/react-dialog";
import {
  AlignLeft,
  BookOpen,
  ChevronRight,
  Clock,
  CornerDownLeft,
  Hash,
  Loader2,
  MapPin,
  Search,
  SearchX,
  X,
} from "lucide-react";
import { Fragment, useDeferredValue, useEffect, useId, useMemo, useRef, useState, type ReactNode } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import { NAV_GROUPS } from "../../constants/navigation";
import { translate, useLangStore } from "../../lib/i18n";
import type { Span } from "../../lib/search/engine";
import {
  liveDocs,
  prepare,
  preloadIndex,
  preparedIndex,
  search,
  staticDocs,
  withoutShown,
  type IndexEntry,
  type SearchHit,
} from "../../lib/search/documents";
import { collectBlocks } from "../../lib/search/pageText";
import { cn } from "../../lib/utils";
import { useSearchStore } from "../../store/searchStore";

const NAV_ICON = new Map(NAV_GROUPS.flatMap((g) => g.items.map((i) => [i.path, i.icon] as const)));

const isMac = typeof navigator !== "undefined" && /Mac|iPhone|iPad/.test(navigator.platform);

/** Text with matched spans marked. */
function Marked({ text, spans }: { text: string; spans: Span[] }) {
  if (spans.length === 0) return <>{text}</>;
  const out: ReactNode[] = [];
  let at = 0;
  spans.forEach(([a, b], i) => {
    if (a > at) out.push(text.slice(at, a));
    out.push(
      <mark key={i} className="rounded-[3px] bg-search-hit text-text-primary">
        {text.slice(a, b)}
      </mark>,
    );
    at = b;
  });
  if (at < text.length) out.push(text.slice(at));
  return <>{out}</>;
}

function Kbd({ children }: { children: ReactNode }) {
  return (
    <kbd className="inline-flex h-5 min-w-5 items-center justify-center rounded border border-border-secondary bg-bg-tertiary px-1 font-mono text-[10px] font-medium text-text-muted">
      {children}
    </kbd>
  );
}

function HitIcon({ hit }: { hit: SearchHit }) {
  const PageIcon = NAV_ICON.get(hit.doc.path);
  const Icon = hit.doc.kind === "page" ? (PageIcon ?? Hash) : hit.doc.kind === "section" ? Hash : AlignLeft;
  return (
    <span
      aria-hidden
      className={cn(
        "mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md border",
        hit.doc.kind === "page"
          ? "border-accent/30 bg-accent-muted text-accent"
          : "border-border-primary bg-bg-tertiary text-text-muted",
      )}
    >
      <Icon size={14} strokeWidth={1.75} />
    </span>
  );
}

function Trail({ parts }: { parts: string[] }) {
  return (
    <span className="flex min-w-0 items-center gap-1 truncate text-xs text-text-muted">
      {parts.map((p, i) => (
        <Fragment key={i}>
          {i > 0 && <ChevronRight size={11} className="shrink-0 opacity-60" aria-hidden />}
          <span className={cn("truncate", i === parts.length - 1 && "text-text-secondary")}>{p}</span>
        </Fragment>
      ))}
    </span>
  );
}

// ── Palette ──────────────────────────────────────────────────────────

export function SearchPalette() {
  const open = useSearchStore((s) => s.open);
  const setOpen = useSearchStore((s) => s.setOpen);
  const recent = useSearchStore((s) => s.recent);
  const remember = useSearchStore((s) => s.remember);
  const clearRecent = useSearchStore((s) => s.clearRecent);
  const startFind = useSearchStore((s) => s.startFind);
  const lang = useLangStore((s) => s.ready);
  const location = useLocation();
  const navigate = useNavigate();
  const here = location.pathname;

  const [query, setQuery] = useState("");
  const deferred = useDeferredValue(query);
  const [active, setActive] = useState(0);
  const [entries, setEntries] = useState<IndexEntry[] | null>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listId = useId();

  // Load the index on first open; read the page on screen each time the palette opens
  const [live, setLive] = useState<ReturnType<typeof liveDocs>>([]);
  useEffect(() => {
    if (!open) return;
    let alive = true;
    void preloadIndex().then((e) => alive && setEntries(e));
    const main = document.querySelector("main");
    setLive(main ? liveDocs(here, collectBlocks(main)) : []);
    return () => {
      alive = false;
    };
  }, [open, here]);

  const prepared = useMemo(() => {
    if (!entries) return null;
    const base = preparedIndex(entries, lang);
    const shown = new Set(withoutShown(base.map((p) => p.doc), here, live, lang));
    return [...prepare(live, lang), ...base.filter((p) => shown.has(p.doc))];
  }, [entries, lang, here, live]);

  const allHits = useMemo(
    () => (prepared && deferred.trim() ? search(prepared, deferred, here, lang) : []),
    [prepared, deferred, here, lang],
  );
  // a glossary term the query names goes on top as a definition; the list holds places to go
  // (the query covers most of the term: "weibul" → Weibull, not "rüzgar" → "Rüzgâr kesmesi")
  const definition =
    allHits.find(
      (h) => h.doc.kind === "term" && h.titleSpans.reduce((n, [a, b]) => n + b - a, 0) >= 0.6 * h.title.length,
    ) ?? null;
  const hits = useMemo(() => allHits.filter((h) => h.doc.kind !== "term"), [allHits]);

  useEffect(() => setActive(0), [deferred]);
  useEffect(() => {
    listRef.current?.querySelector(`[data-index="${active}"]`)?.scrollIntoView?.({ block: "nearest" });
  }, [active]);

  const choose = (hit: SearchHit) => {
    remember(query);
    const { doc } = hit;
    if (doc.kind === "page") {
      setOpen(false);
      if (doc.path !== here) void navigate(doc.path);
      return;
    }
    startFind(query.trim(), {
      path: doc.path,
      tab: doc.tab,
      sub: doc.sub,
      text: doc.kind === "section" ? doc.title : doc.body,
      block: doc.block,
    });
    if (doc.path !== here) void navigate(doc.path);
  };

  // Empty box: recent searches, then every page
  const pages = useMemo(() => {
    const docs = staticDocs().filter((d) => d.kind === "page");
    const prep = prepare(docs, lang);
    return prep.map(
      (p): SearchHit => ({
        doc: p.doc,
        score: 0,
        title: p.title,
        titleSpans: [],
        body: p.body,
        bodySpans: [],
        trail: [translate(lang, NAV_GROUPS.find((g) => g.items.some((i) => i.path === p.doc.path))?.label ?? "")],
        here: p.doc.path === here,
      }),
    );
  }, [lang, here]);

  const showing = query.trim() ? hits : pages;
  const count = showing.length;

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown" || (e.key === "n" && e.ctrlKey)) {
      e.preventDefault();
      setActive((a) => (count ? (a + 1) % count : 0));
    } else if (e.key === "ArrowUp" || (e.key === "p" && e.ctrlKey)) {
      e.preventDefault();
      setActive((a) => (count ? (a - 1 + count) % count : 0));
    } else if (e.key === "Home" && e.ctrlKey) {
      setActive(0);
    } else if (e.key === "End" && e.ctrlKey) {
      setActive(Math.max(0, count - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const hit = showing[active];
      if (hit) choose(hit);
    }
  };

  const loading = open && entries === null;
  const indexSize = entries?.length ?? 0;

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Portal>
        <Dialog.Overlay className="of-search-overlay fixed inset-0 z-[2400] bg-black/55 backdrop-blur-[2px]" />
        <Dialog.Content
          data-search-ui
          aria-describedby={undefined}
          onEscapeKeyDown={(e) => {
            // first Esc clears the box, the second closes
            if (!query) return;
            e.preventDefault();
            setQuery("");
          }}
          onOpenAutoFocus={(e) => {
            e.preventDefault();
            // the last query comes back selected: typing replaces it, Enter repeats it
            inputRef.current?.focus();
            inputRef.current?.select();
          }}
          className={cn(
            "of-search-panel fixed left-1/2 top-[8vh] z-[2500] flex max-h-[min(640px,84dvh)] w-[calc(100%-1rem)] max-w-2xl -translate-x-1/2 flex-col overflow-hidden",
            "rounded-xl border border-border-secondary bg-bg-secondary shadow-2xl shadow-black/50 focus:outline-none",
          )}
        >
          <Dialog.Title className="sr-only">Search OffshoreForge</Dialog.Title>

          {/* ── Query ── */}
          <div className="flex items-center gap-3 border-b border-border-primary px-4">
            {loading ? (
              <Loader2 size={18} className="shrink-0 animate-spin text-text-muted" aria-hidden />
            ) : (
              <Search size={18} className="shrink-0 text-accent" aria-hidden />
            )}
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={onKey}
              role="combobox"
              aria-expanded={count > 0}
              aria-controls={listId}
              aria-activedescendant={count ? `${listId}-${active}` : undefined}
              aria-autocomplete="list"
              aria-label="Search pages, terms, values"
              placeholder="Search pages, terms, values…"
              spellCheck={false}
              autoComplete="off"
              className="of-search-input h-14 min-w-0 flex-1 bg-transparent text-base text-text-primary placeholder:text-text-muted focus:outline-none"
            />
            {query && (
              <button
                type="button"
                onClick={() => {
                  setQuery("");
                  inputRef.current?.focus();
                }}
                aria-label="Clear search"
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-text-muted hover:bg-bg-hover hover:text-text-primary"
              >
                <X size={15} />
              </button>
            )}
            <Dialog.Close asChild>
              <button type="button" aria-label="Close search" className="hidden shrink-0 sm:block">
                <Kbd>Esc</Kbd>
              </button>
            </Dialog.Close>
          </div>

          {/* ── Results ── */}
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-2 py-2">
            {definition && (
              <div translate="no" className="mx-1 mb-2 rounded-lg border border-accent/25 bg-accent-muted px-3.5 py-3">
                <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.08em] text-accent">
                  <BookOpen size={13} aria-hidden />
                  {translate(lang, "Definition")}
                </div>
                <p className="mt-1.5 text-sm leading-relaxed text-text-primary">
                  <span className="font-semibold">{definition.title}</span>
                  <span className="text-text-muted"> — </span>
                  <span className="text-text-secondary">{definition.body}</span>
                </p>
              </div>
            )}

            {!query.trim() && recent.length > 0 && (
              <section className="mb-1">
                <div className="flex items-center justify-between px-2.5 pb-1 pt-1">
                  <h3 className="text-xs font-medium uppercase tracking-[0.08em] text-text-muted">Recent searches</h3>
                  <button type="button" onClick={clearRecent} className="text-xs text-text-muted hover:text-text-primary">
                    Clear
                  </button>
                </div>
                <div className="flex flex-wrap gap-1.5 px-2.5 pb-2" translate="no">
                  {recent.map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => {
                        setQuery(r);
                        inputRef.current?.focus();
                      }}
                      className="inline-flex items-center gap-1.5 rounded-md border border-border-primary bg-bg-tertiary px-2 py-1 text-xs text-text-secondary hover:border-border-secondary hover:text-text-primary"
                    >
                      <Clock size={12} className="text-text-muted" aria-hidden />
                      {r}
                    </button>
                  ))}
                </div>
              </section>
            )}

            {query.trim() ? (
              !loading &&
              count > 0 && (
                <div className="flex items-baseline justify-between px-2.5 pb-1.5 pt-0.5 text-xs text-text-muted">
                  <span aria-live="polite">{count === 1 ? "1 result" : `${count} results`}</span>
                  <span>Most relevant first</span>
                </div>
              )
            ) : (
              <h3 className="px-2.5 pb-1 pt-1 text-xs font-medium uppercase tracking-[0.08em] text-text-muted">Pages</h3>
            )}

            {query.trim() && !loading && count === 0 && (
              <div className="flex flex-col items-center px-6 py-10 text-center">
                <SearchX size={28} className="text-text-muted" aria-hidden />
                <p className="mt-3 text-sm font-medium text-text-primary">No results</p>
                <p className="mt-1 max-w-sm text-xs leading-relaxed text-text-muted">
                  Try a shorter word, a standard (IEC 61850), a value with its unit (220 kV) or a page name.
                </p>
              </div>
            )}

            <ul ref={listRef} id={listId} role="listbox" aria-label="Search results" translate="no" className="flex flex-col gap-0.5">
              {showing.map((hit, i) => {
                const selected = i === active;
                return (
                  <li
                    key={hit.doc.id}
                    id={`${listId}-${i}`}
                    role="option"
                    aria-selected={selected}
                    data-index={i}
                    onMouseMove={() => !selected && setActive(i)}
                    onClick={() => choose(hit)}
                    className={cn(
                      "relative flex cursor-pointer items-start gap-3 rounded-lg px-2.5 py-2.5 transition-colors duration-75",
                      selected ? "bg-bg-hover" : "hover:bg-bg-tertiary",
                    )}
                  >
                    {selected && <span aria-hidden className="absolute inset-y-2 left-0 w-0.5 rounded-full bg-accent" />}
                    <HitIcon hit={hit} />
                    <div className="min-w-0 flex-1">
                      <div className="flex min-w-0 items-center gap-2">
                        <span className="truncate text-sm font-medium text-text-primary">
                          <Marked text={hit.title} spans={hit.titleSpans} />
                        </span>
                        {hit.here && hit.doc.kind !== "page" && (
                          <span className="inline-flex shrink-0 items-center gap-1 rounded border border-accent/30 px-1.5 py-px text-[10px] font-medium uppercase tracking-wide text-accent">
                            <MapPin size={10} aria-hidden />
                            {translate(lang, "This page")}
                          </span>
                        )}
                      </div>
                      <Trail parts={hit.trail} />
                      {hit.body && (
                        <p className="mt-1 line-clamp-2 text-[13px] leading-snug text-text-secondary">
                          <Marked text={hit.body} spans={hit.bodySpans} />
                        </p>
                      )}
                    </div>
                    <span
                      aria-hidden
                      className={cn("mt-1 shrink-0 text-text-muted transition-opacity", selected ? "opacity-100" : "opacity-0")}
                    >
                      <CornerDownLeft size={14} />
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* ── Footer ── */}
          <div className="hidden items-center justify-between gap-4 border-t border-border-primary bg-bg-primary/40 px-4 py-2 text-xs text-text-muted sm:flex">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5">
                <Kbd>↑</Kbd>
                <Kbd>↓</Kbd>
                <span>to move</span>
              </span>
              <span className="flex items-center gap-1.5">
                <Kbd>↵</Kbd>
                <span>to open</span>
              </span>
              <span className="flex items-center gap-1.5">
                <Kbd>Esc</Kbd>
                <span>to close</span>
              </span>
            </div>
            {indexSize > 0 && <span>{`${indexSize} text blocks · ${pages.length} pages`}</span>}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

// ── Header trigger + shortcuts ───────────────────────────────────────

export function SearchTrigger() {
  const setOpen = useSearchStore((s) => s.setOpen);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const typing = e.target instanceof HTMLElement && (e.target.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName));
      if ((e.key === "k" || e.key === "K") && (e.ctrlKey || e.metaKey) && !e.altKey) {
        e.preventDefault();
        setOpen(!useSearchStore.getState().open);
      } else if (e.key === "/" && !typing && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault();
        setOpen(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [setOpen]);

  return (
    <button
      type="button"
      onClick={() => setOpen(true)}
      onPointerEnter={() => void preloadIndex()}
      onFocus={() => void preloadIndex()}
      aria-label="Search"
      aria-keyshortcuts={isMac ? "Meta+K" : "Control+K"}
      data-tour="search"
      title="Search pages, terms, values"
      className={cn(
        "flex h-8 items-center gap-2 rounded-md border border-border-secondary text-text-muted transition-colors hover:border-border-accent hover:bg-bg-hover hover:text-text-primary",
        "w-8 justify-center lg:w-60 lg:justify-start lg:bg-bg-primary/50 lg:px-2.5",
      )}
    >
      <Search size={15} strokeWidth={1.75} className="shrink-0" />
      <span className="hidden flex-1 text-left text-sm lg:inline">Search…</span>
      <span className="hidden items-center gap-0.5 lg:flex" translate="no">
        <Kbd>{isMac ? "⌘" : "Ctrl"}</Kbd>
        <Kbd>K</Kbd>
      </span>
    </button>
  );
}
