import { existsSync } from "node:fs";
import { join, resolve } from "node:path";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";

import AcademyTab from "../../../src/components/p4/academy/AcademyTab";
import ConceptMap from "../../../src/components/p4/academy/ConceptMap";
import { CHAPTERS, CONCEPT_SUMMARY, CONCEPTS, LINKS } from "../../../src/components/p4/academy/academyContent";
import { DATA, fact, FACT_KEYS } from "../../../src/components/p4/academy/course/facts";
import { PARTS } from "../../../src/components/p4/academy/course/parts";
import { REFS } from "../../../src/components/p4/academy/course/refs";
import { chapterTexts, citedKeys, readingMinutes } from "../../../src/components/p4/academy/course/walk";
import { FIGURES } from "../../../src/components/p4/academy/figures";
import { plain } from "../../../src/components/p4/academy/ui/cite";
import { useLangStore } from "../../../src/lib/i18n";
import { useForecastStore } from "../../../src/store/forecastStore";

/** {key} placeholders outside inline maths ($…$ holds TeX groups such as {24}). */
const placeholders = (s: string) => [...s.replace(/\$[^$]*\$/g, "").matchAll(/\{([a-z][a-z0-9_]*)\}/g)].map((m) => m[1]);

describe("P4 AI Academy — course content", () => {
  it("numbers fourteen chapters in five parts, in order, with unique ids", () => {
    expect(CHAPTERS.map((c) => c.n)).toEqual(CHAPTERS.map((_, i) => i + 1));
    expect(new Set(CHAPTERS.map((c) => c.id)).size).toBe(CHAPTERS.length);
    const order = PARTS.map((p) => p.id);
    const parts = CHAPTERS.map((c) => order.indexOf(c.part));
    expect(parts.every((p, i) => p >= 0 && (i === 0 || p >= parts[i - 1]))).toBe(true);
    expect(new Set(CHAPTERS.map((c) => c.part)).size).toBe(PARTS.length);
  });

  it("has every text in English and Turkish", () => {
    for (const ch of CHAPTERS)
      for (const t of chapterTexts(ch)) {
        expect(t.en.trim(), ch.id).not.toBe("");
        expect(t.tr.trim(), ch.id).not.toBe("");
      }
  });

  it("gives every chapter objectives, sections, the four practice questions, take-aways and a quiz", () => {
    for (const ch of CHAPTERS) {
      expect(ch.objectives.length, ch.id).toBeGreaterThanOrEqual(3);
      expect(ch.sections.length, ch.id).toBeGreaterThanOrEqual(2);
      const p = ch.practice;
      expect([p.platform, p.files, p.industry, p.solves, p.limits].every((a) => a.length > 0), ch.id).toBe(true);
      expect(ch.quiz.every((q) => q.answer >= 0 && q.answer < q.options.length), ch.id).toBe(true);
      expect(readingMinutes(ch, "en"), ch.id).toBeGreaterThanOrEqual(5);
    }
  });

  it("cites only works in the bibliography, and every chapter cites some", () => {
    for (const ch of CHAPTERS) {
      const keys = citedKeys(ch);
      expect(keys.length, ch.id).toBeGreaterThan(0);
      for (const k of keys) expect(REFS[k], `${ch.id}: ${k}`).toBeDefined();
    }
  });

  it("refers only to registered figures and known platform numbers", () => {
    for (const ch of CHAPTERS) {
      for (const s of ch.sections) for (const b of s.blocks) if (b.kind === "fig") expect(FIGURES[b.fig], `${ch.id}: ${b.fig}`).toBeDefined();
      for (const t of chapterTexts(ch)) for (const lang of ["en", "tr"] as const) for (const k of placeholders(t[lang])) expect(FACT_KEYS, `${ch.id}: {${k}}`).toContain(k);
    }
  });

  it("points \"In this platform\" and code listings at files that exist", () => {
    const repo = resolve(__dirname, "../../../..");
    const missing: string[] = [];
    for (const ch of CHAPTERS) {
      const paths = [...ch.practice.files, ...ch.sections.flatMap((s) => s.blocks.flatMap((b) => (b.kind === "code" ? [b.file] : [])))];
      // "path · function()" names a symbol inside the file
      for (const p of paths.map((f) => f.split(" · ")[0])) if (!existsSync(join(repo, p))) missing.push(`${ch.id}: ${p}`);
    }
    expect(missing).toEqual([]);
  });

  it("quotes the platform's own numbers, formatted per language", () => {
    const xgb = DATA.snapshot.scores.find((s) => s.name === "XGBoost (P50)")!;
    expect(fact("xgb_nrmse", "en")).toBe(xgb.nrmse_pct.toFixed(1));
    expect(fact("xgb_nrmse", "tr")).toBe(xgb.nrmse_pct.toFixed(1).replace(".", ","));
    // honest day-ahead range for one farm group (Giebel et al. 2011: 10–20 % of capacity)
    expect(xgb.nrmse_pct).toBeGreaterThan(10);
    expect(xgb.nrmse_pct).toBeLessThan(20);
    // every forecast in the figures respects 0 ≤ P ≤ capacity
    const cap = DATA.meta.capacity_mw;
    const series = [DATA.week.lstm_mw, DATA.week.ensemble_mw, DATA.week.tso_mw, ...DATA.week.tft_q_mw, ...DATA.week.xgb_q_mw];
    for (const s of series) for (const v of s) if (v !== null) expect(v >= 0 && v <= cap + 1e-6).toBe(true);
  });

  it("keeps the concept map consistent with the chapters", () => {
    const chapterIds = new Set(CHAPTERS.map((c) => c.id));
    const conceptIds = new Set(CONCEPTS.map((c) => c.id));
    expect(CONCEPTS.every((c) => chapterIds.has(c.chapter))).toBe(true);
    expect(LINKS.every(([a, b]) => conceptIds.has(a) && conceptIds.has(b))).toBe(true);
    expect(CONCEPTS.every((c) => CONCEPT_SUMMARY[c.id]?.en && CONCEPT_SUMMARY[c.id]?.tr)).toBe(true);
    expect(CHAPTERS.every((ch) => ch.concepts.every((id) => conceptIds.has(id)))).toBe(true);
  });

  it("reads plain text aloud: no citations, no markup", () => {
    const s = plain("Persistence [@nielsen1998] has RMSE $\\sigma\\sqrt{2}$ — **{pers_nrmse} %**.", "en");
    expect(s).not.toMatch(/\[@|\$|\*\*|\{pers_nrmse\}/);
    expect(s).toContain(fact("pers_nrmse", "en")!);
  });
});

describe("P4 AI Academy — page", () => {
  beforeEach(() => {
    useForecastStore.setState({ chapter: "why", tab: "academy", real: null });
    useLangStore.setState({ lang: "en" });
  });

  it("walks the chapters and follows the app language", () => {
    render(<AcademyTab />);
    expect(screen.getByRole("heading", { level: 2, name: /Why forecast wind power\?/ })).toBeDefined();
    fireEvent.click(screen.getAllByRole("button", { name: /Decision trees and gradient boosting/ })[0]);
    expect(screen.getByRole("heading", { level: 2, name: /Decision trees and gradient boosting \(XGBoost\)/ })).toBeDefined();
    // the header EN/TR toggle: chapters render their own Turkish text, state kept
    act(() => useLangStore.getState().setLang("tr"));
    expect(screen.getByRole("heading", { level: 2, name: /Karar ağaçları ve gradient boosting \(XGBoost\)/ })).toBeDefined();
  });

  it("renders every chapter with its figures, references and self-check in both languages", () => {
    const { unmount } = render(<AcademyTab />);
    for (const lang of ["en", "tr"] as const) {
      act(() => useLangStore.getState().setLang(lang));
      for (const ch of CHAPTERS) {
        act(() => useForecastStore.getState().openChapter(ch.id));
        expect(screen.getByRole("heading", { level: 2, name: new RegExp(ch.title[lang].replace(/[.*+?^${}()|[\]\\]/g, "\\$&")) })).toBeDefined();
        expect(screen.queryByText("missing figure")).toBeNull();
        expect(screen.getByText(lang === "tr" ? "Kaynaklar" : "References")).toBeDefined();
      }
    }
    unmount();
  }, 60_000); // 28 full chapter pages with typeset maths and SVG figures

  it("answers the self-check and remembers completed chapters", () => {
    render(<AcademyTab />);
    const quiz = CHAPTERS[0].quiz[0];
    fireEvent.click(screen.getByRole("radio", { name: quiz.options[quiz.answer].en }));
    expect(screen.getByText(/^Correct\./)).toBeDefined();
    fireEvent.click(screen.getByRole("button", { name: /Mark as completed/ }));
    expect(screen.getByRole("button", { name: /Completed/ })).toBeDefined();
    expect(JSON.parse(localStorage.getItem("of.p4.academy.done") ?? "[]")).toContain("why");
  });

  it("shows a clicked concept's summary, then opens its lesson", () => {
    render(<ConceptMap lang="en" />);
    fireEvent.click(screen.getByText("Attention"));
    expect(screen.getByText(/weight which past moments matter/)).toBeDefined();
    fireEvent.click(screen.getByRole("button", { name: /Open the lesson/ }));
    expect(useForecastStore.getState().chapter).toBe("tft");
    expect(useForecastStore.getState().tab).toBe("academy");
  });
});
