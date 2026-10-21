/**
 * AI Academy — a course on day-ahead wind power forecasting with machine learning,
 * written around the models this platform actually runs on measured Baltic data.
 *
 * Five parts, fourteen chapters. Each chapter has learning objectives, numbered sections
 * with figures (interactive where it teaches something, real DK2 data where it can),
 * typeset equations, worked examples, "from theory to practice" (this platform, the
 * industry, the problem it solves, its limits), key points, a self-check and IEEE-style
 * references. Text follows the app language (EN/TR); chapters can be read aloud; the
 * reader's completed chapters are remembered in this browser.
 */

import { useEffect, useMemo, useRef, useState } from "react";
import { BookOpen, CheckCircle2, Circle } from "lucide-react";

import { useForecastStore } from "../../../store/forecastStore";
import { useNarrator } from "../../../hooks/useNarrator";
import { useLangStore } from "../../../lib/i18n";
import { readStored, writeStored } from "../../../lib/storage";
import { cn } from "../../../lib/utils";
import { CHAPTERS } from "./academyContent";
import { PARTS } from "./course/parts";
import type { Lang } from "./course/types";
import { narrationTexts, readingMinutes } from "./course/walk";
import { ChapterView } from "./ui/ChapterView";
import { plain } from "./ui/cite";

const DONE_KEY = "of.p4.academy.done";

function readDone(): string[] {
  try {
    const v: unknown = JSON.parse(readStored(DONE_KEY) ?? "[]");
    return Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : [];
  } catch {
    return [];
  }
}

export default function AcademyTab() {
  const chapterId = useForecastStore((s) => s.chapter);
  const openChapter = useForecastStore((s) => s.openChapter);
  // Chapters carry their own English and Turkish text: they follow the app language
  // (English for any other), not the DOM translator.
  const appLang = useLangStore((s) => s.lang);
  const lang: Lang = appLang === "tr" ? "tr" : "en";
  const { supported, speaking, speak, stop } = useNarrator();
  const [done, setDone] = useState<string[]>(readDone);
  const top = useRef<HTMLDivElement>(null);
  const first = useRef(true);

  const idx = Math.max(0, CHAPTERS.findIndex((c) => c.id === chapterId));
  const ch = CHAPTERS[idx];
  const totalMin = useMemo(() => CHAPTERS.reduce((n, c) => n + readingMinutes(c, lang), 0), [lang]);

  // stop talking and go to the top of the page when the chapter changes
  useEffect(() => {
    stop();
    if (first.current) {
      first.current = false;
      return;
    }
    top.current?.scrollIntoView?.({ block: "start", behavior: "smooth" });
  }, [chapterId, stop]);

  const toggleDone = () => {
    const next = done.includes(ch.id) ? done.filter((d) => d !== ch.id) : [...done, ch.id];
    setDone(next);
    writeStored(DONE_KEY, JSON.stringify(next));
  };

  const t = (en: string, tr: string) => (lang === "tr" ? tr : en);
  const progress = Math.round((100 * done.filter((d) => CHAPTERS.some((c) => c.id === d)).length) / CHAPTERS.length);

  return (
    <div ref={top} className="grid scroll-mt-4 grid-cols-1 gap-4 xl:grid-cols-[272px_minmax(0,1fr)]">
      {/* course navigation */}
      <nav aria-label={t("Academy chapters", "Akademi bölümleri")} className="self-start rounded-lg border border-border-primary bg-bg-secondary xl:sticky xl:top-4">
        <div className="border-b border-border-primary p-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-text-primary">
            <BookOpen size={16} className="text-accent" aria-hidden /> AI Academy
          </div>
          <p className="mt-1 text-xs leading-relaxed text-text-muted">
            {t(
              "Day-ahead wind power forecasting with machine learning — from the grid's need to the models running on this platform.",
              "Makine öğrenmesiyle gün öncesi rüzgâr gücü tahmini — şebekenin ihtiyacından bu platformda çalışan modellere.",
            )}
          </p>
          <div className="mt-3 flex items-center justify-between text-xs text-text-muted">
            <span>
              {CHAPTERS.length} {t("chapters", "bölüm")} · ≈ {Math.round(totalMin / 60)} {t("h", "sa")}
            </span>
            <span className="font-mono">{progress} %</span>
          </div>
          <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-bg-tertiary" role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100} aria-label={t("Course progress", "Kurs ilerlemesi")}>
            <div className="h-full rounded-full bg-accent transition-[width] duration-500" style={{ width: `${progress}%` }} />
          </div>
        </div>

        {/* phone: one select */}
        <div className="p-3 xl:hidden">
          <label className="sr-only" htmlFor="academy-chapter">
            {t("Chapter", "Bölüm")}
          </label>
          <select
            id="academy-chapter"
            value={ch.id}
            onChange={(e) => openChapter(e.target.value)}
            className="w-full rounded-md border border-border-secondary bg-bg-tertiary px-2 py-1.5 text-sm text-text-primary"
          >
            {PARTS.map((p) => (
              <optgroup key={p.id} label={`${p.numeral}. ${p.title[lang]}`}>
                {CHAPTERS.filter((c) => c.part === p.id).map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.n}. {c.title[lang]}
                    {done.includes(c.id) ? " ✓" : ""}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </div>

        {/* desktop: parts and chapters */}
        <div className="hidden max-h-[calc(100vh-14rem)] overflow-y-auto p-2 xl:block">
          {PARTS.map((p) => (
            <div key={p.id} className="mb-2">
              <div className="px-2 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-text-muted">
                {p.numeral} · {p.title[lang]}
              </div>
              <ol>
                {CHAPTERS.filter((c) => c.part === p.id).map((c) => {
                  const current = c.id === ch.id;
                  const isDone = done.includes(c.id);
                  return (
                    <li key={c.id}>
                      <button
                        type="button"
                        onClick={() => openChapter(c.id)}
                        aria-current={current ? "page" : undefined}
                        className={cn(
                          "flex w-full items-start gap-2 rounded-md px-2 py-1.5 text-left text-[13px] leading-snug transition-colors",
                          current ? "bg-accent/15 font-semibold text-text-primary" : "text-text-secondary hover:bg-bg-hover hover:text-text-primary",
                        )}
                      >
                        <span className="mt-px w-5 shrink-0 font-mono text-xs text-text-muted">{c.n}</span>
                        <span className="min-w-0 flex-1">{c.title[lang]}</span>
                        {isDone ? (
                          <CheckCircle2 size={14} className="mt-0.5 shrink-0 text-status-normal" aria-label={t("completed", "tamamlandı")} />
                        ) : (
                          <Circle size={14} className="mt-0.5 shrink-0 text-border-secondary" aria-hidden />
                        )}
                      </button>
                    </li>
                  );
                })}
              </ol>
            </div>
          ))}
        </div>
      </nav>

      <ChapterView
        key={ch.id}
        ch={ch}
        lang={lang}
        nav={{
          prev: CHAPTERS[idx - 1],
          next: CHAPTERS[idx + 1],
          total: CHAPTERS.length,
          done: done.includes(ch.id),
          onOpen: openChapter,
          onToggleDone: toggleDone,
          narration: {
            supported,
            speaking,
            toggle: () => (speaking ? stop() : speak([ch.title[lang], ...narrationTexts(ch).map((x) => plain(x[lang], lang))].join(". "), lang)),
          },
        }}
      />
    </div>
  );
}
