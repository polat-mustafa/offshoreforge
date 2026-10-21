/**
 * Header search state: the palette (open / closed, recent queries) and the
 * find bar — the query highlighted on the page and where to jump to.
 */

import { create } from "zustand";

import { readStored, writeStored } from "../lib/storage";
import type { Block } from "../lib/search/pageText";

const RECENT_KEY = "of.search.recent";
const MAX_RECENT = 6;

/** Where a result lives: the find bar opens the route, the tabs, and looks for `text`. */
export interface FindTarget {
  path: string;
  tab?: string;
  sub?: string;
  /** The block text (English, from the index) — matched in the UI language too. */
  text?: string;
  /** A block of the page on screen. */
  block?: Block;
}

export interface Find {
  query: string;
  target: FindTarget;
  /** Changes on every jump, so the same result clicked twice jumps again. */
  nonce: number;
}

interface SearchStore {
  open: boolean;
  setOpen: (open: boolean) => void;
  recent: string[];
  remember: (query: string) => void;
  clearRecent: () => void;
  find: Find | null;
  startFind: (query: string, target: FindTarget) => void;
  clearFind: () => void;
}

function readRecent(): string[] {
  try {
    const v: unknown = JSON.parse(readStored(RECENT_KEY) ?? "[]");
    return Array.isArray(v) ? v.filter((s): s is string => typeof s === "string").slice(0, MAX_RECENT) : [];
  } catch {
    return [];
  }
}

let nonce = 0;

export const useSearchStore = create<SearchStore>((set, get) => ({
  open: false,
  setOpen: (open) => set({ open }),
  recent: readRecent(),
  remember: (query) => {
    const q = query.trim();
    if (q.length < 2) return;
    const recent = [q, ...get().recent.filter((r) => r.toLowerCase() !== q.toLowerCase())].slice(0, MAX_RECENT);
    writeStored(RECENT_KEY, JSON.stringify(recent));
    set({ recent });
  },
  clearRecent: () => {
    writeStored(RECENT_KEY, "[]");
    set({ recent: [] });
  },
  find: null,
  startFind: (query, target) => set({ find: { query, target, nonce: ++nonce }, open: false }),
  clearFind: () => set({ find: null }),
}));
