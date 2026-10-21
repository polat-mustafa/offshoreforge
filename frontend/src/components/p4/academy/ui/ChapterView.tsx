/**
 * One chapter as an academic page: header with part, reading time and learning
 * objectives; numbered sections with figures (n.k), equations (n.k) and tables (n.k);
 * "From theory to practice"; key points; self-check; references; previous / next.
 */

import { useMemo, type ReactNode } from "react";
import { CheckCircle2, ChevronLeft, ChevronRight, Clock, GraduationCap, Lightbulb, Square, Volume2 } from "lucide-react";

import { cn } from "../../../../lib/utils";
import { FIGURES } from "../figures";
import { PARTS } from "../course/parts";
import type { Chapter, Lang } from "../course/types";
import { citedKeys, readingMinutes } from "../course/walk";
import { Callout, CodeBlock, Equation, FigureBlock, L, ListBlock, PracticePanel, Prose, Quiz, References, Steps, TableBlock } from "./blocks";
import { CiteContext } from "./cite";
import { RichText } from "./RichText";

/** Reading column: prose stays at ≈ 75 characters a line while figures use the full width. */
const COL = "mx-auto w-full max-w-[46rem]";

export interface ChapterNav {
  prev?: Chapter;
  next?: Chapter;
  total: number;
  done: boolean;
  onOpen: (id: string) => void;
  onToggleDone: () => void;
  narration: { supported: boolean; speaking: boolean; toggle: () => void };
}

export function ChapterView({ ch, lang, nav }: { ch: Chapter; lang: Lang; nav: ChapterNav }) {
  const t = L(lang);
  const keys = useMemo(() => citedKeys(ch), [ch]);
  const cite = useMemo(
    () => ({ number: new Map(keys.map((k, i) => [k, i + 1])), anchor: (k: string) => `ref-${ch.id}-${k}` }),
    [keys, ch.id],
  );
  const part = PARTS.find((p) => p.id === ch.part);
  const minutes = readingMinutes(ch, lang);

  // number figures, equations and tables per chapter (n.k), in reading order
  const label = useMemo(() => {
    const out = new Map<string, number>();
    const count = { fig: 0, eq: 0, table: 0 };
    ch.sections.forEach((s) =>
      s.blocks.forEach((b, bi) => {
        if (b.kind === "fig" || b.kind === "eq" || b.kind === "table") out.set(`${s.id}-${bi}`, ++count[b.kind]);
      }),
    );
    return out;
  }, [ch]);
  const body: ReactNode[] = ch.sections.map((s, si) => (
    <section key={s.id} id={`sec-${ch.id}-${s.id}`} className="scroll-mt-24">
      <h3 className={`${COL} mb-3 mt-10 flex items-baseline gap-3 text-xl font-semibold text-text-primary`}>
        <span className="font-mono text-base text-text-muted">
          {ch.n}.{si + 1}
        </span>
        {s.title[lang]}
      </h3>
      {s.blocks.map((b, bi) => {
        const key = `${s.id}-${bi}`;
        switch (b.kind) {
          case "p":
            return <Prose key={key} text={b.text} lang={lang} className={`${COL} mb-4`} />;
          case "eq": {
            const ne = label.get(key);
            return (
              <div key={key} className={COL}>
                <Equation tex={b.tex} where={b.where} source={b.source} label={`${ch.n}.${ne}`} lang={lang} id={`eq-${ch.id}-${ne}`} />
              </div>
            );
          }
          case "fig": {
            const nf = label.get(key);
            return (
              <FigureBlock
                key={key}
                Fig={FIGURES[b.fig]}
                label={`${t("Figure", "Şekil")} ${ch.n}.${nf}`}
                caption={b.caption}
                source={b.source}
                lang={lang}
                id={`fig-${ch.id}-${nf}`}
              />
            );
          }
          case "table": {
            const nt = label.get(key);
            return (
              <TableBlock
                key={key}
                caption={b.caption}
                head={b.head}
                rows={b.rows}
                source={b.source}
                label={`${t("Table", "Tablo")} ${ch.n}.${nt}`}
                lang={lang}
                id={`tab-${ch.id}-${nt}`}
              />
            );
          }
          case "callout":
            return (
              <div key={key} className={COL}>
                <Callout tone={b.tone} title={b.title} body={b.body} lang={lang} />
              </div>
            );
          case "list":
            return (
              <div key={key} className={COL}>
                <ListBlock items={b.items} ordered={b.ordered} lang={lang} />
              </div>
            );
          case "steps":
            return (
              <div key={key} className={COL}>
                <Steps title={b.title} given={b.given} steps={b.steps} result={b.result} lang={lang} />
              </div>
            );
          case "code":
            return (
              <div key={key} className={COL}>
                <CodeBlock caption={b.caption} file={b.file} symbol={b.symbol} code={b.code} lang={lang} />
              </div>
            );
        }
        return null;
      })}
    </section>
  ));

  return (
    <CiteContext.Provider value={cite}>
      <article className="min-w-0 rounded-lg border border-border-primary bg-bg-secondary/40 px-4 py-6 sm:px-8 sm:py-8" aria-labelledby={`title-${ch.id}`}>
        <div className="mx-auto max-w-[60rem]">
          {/* header */}
          <header className={COL}>
            <div className="text-xs font-semibold uppercase tracking-[0.14em] text-accent">
              {t("Part", "Kısım")} {part?.numeral} · {part?.title[lang]}
            </div>
            <div className="mt-3 flex flex-wrap items-start gap-3">
              <h2 id={`title-${ch.id}`} className="min-w-0 flex-1 basis-72 text-2xl font-semibold leading-tight text-text-primary sm:text-[1.85rem]">
                <span className="mr-2 font-mono text-text-muted">{ch.n}</span>
                {ch.title[lang]}
              </h2>
              <div className="flex items-center gap-1.5">
                {nav.narration.supported && (
                  <button
                    type="button"
                    onClick={nav.narration.toggle}
                    className="flex items-center gap-1.5 rounded-md border border-border-secondary px-2.5 py-1.5 text-xs font-semibold text-text-secondary hover:bg-bg-hover hover:text-text-primary"
                    title={t("Listen to this chapter", "Bölümü sesli dinle")}
                  >
                    {nav.narration.speaking ? <Square size={12} /> : <Volume2 size={13} />}
                    {nav.narration.speaking ? t("Stop", "Durdur") : t("Listen", "Dinle")}
                  </button>
                )}
              </div>
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-text-muted">
              <span className="flex items-center gap-1">
                <Clock size={13} aria-hidden /> {minutes} {t("min read", "dk okuma")}
              </span>
              <span>
                {t("Chapter", "Bölüm")} {ch.n} / {nav.total}
              </span>
              <span>
                {keys.length} {t("references", "kaynak")}
              </span>
            </div>
            <p className="mt-5 border-l-2 border-accent pl-4 text-[16px] leading-[1.7] text-text-primary">
              <RichText text={ch.lead[lang]} lang={lang} />
            </p>

            <div className="mt-6 grid gap-4 rounded-lg border border-border-primary bg-bg-primary p-4 sm:grid-cols-[1.4fr_1fr]">
              <div>
                <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-text-primary">
                  <GraduationCap size={16} className="text-accent" aria-hidden /> {t("After this chapter you can", "Bu bölümü bitirdiğinizde şunları yapabileceksiniz")}
                </div>
                <ul className="space-y-1.5 text-sm leading-relaxed text-text-secondary">
                  {ch.objectives.map((o, i) => (
                    <li key={i} className="flex gap-2">
                      <CheckCircle2 size={14} className="mt-1 shrink-0 text-text-muted" aria-hidden />
                      <span>
                        <RichText text={o[lang]} lang={lang} />
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
              <nav aria-label={t("In this chapter", "Bu bölümde")} className="sm:border-l sm:border-border-primary sm:pl-4">
                <div className="mb-2 text-sm font-semibold text-text-primary">{t("In this chapter", "Bu bölümde")}</div>
                <ol className="space-y-1 text-sm">
                  {ch.sections.map((s, si) => (
                    <li key={s.id}>
                      <a href={`#sec-${ch.id}-${s.id}`} className="flex gap-2 text-text-secondary hover:text-accent">
                        <span className="font-mono text-xs text-text-muted">
                          {ch.n}.{si + 1}
                        </span>
                        {s.title[lang]}
                      </a>
                    </li>
                  ))}
                </ol>
              </nav>
            </div>
          </header>

          {body}

          <PracticePanel practice={ch.practice} lang={lang} />

          <aside className={`${COL} my-8 rounded-lg border border-accent/40 bg-accent/5 p-4`}>
            <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-text-primary">
              <Lightbulb size={16} aria-hidden /> {t("Key points", "Akılda kalacaklar")}
            </div>
            <ul className="space-y-1.5 text-sm leading-relaxed text-text-secondary">
              {ch.takeaways.map((k, i) => (
                <li key={i} className="flex gap-2">
                  <span className="font-mono text-xs leading-6 text-text-muted">{i + 1}</span>
                  <span>
                    <RichText text={k[lang]} lang={lang} />
                  </span>
                </li>
              ))}
            </ul>
          </aside>

          <div className={COL}>
            <Quiz key={ch.id} items={ch.quiz} lang={lang} />
            <References keys={keys} anchor={cite.anchor} lang={lang} />
          </div>

          <footer className={`${COL} mt-10 flex flex-col gap-3 border-t border-border-primary pt-5`}>
            <button
              type="button"
              onClick={nav.onToggleDone}
              aria-pressed={nav.done}
              className={cn(
                "flex items-center justify-center gap-2 self-start rounded-md border px-3 py-1.5 text-sm font-semibold transition-colors",
                nav.done ? "border-status-normal/60 bg-status-normal/10 text-text-primary" : "border-border-secondary text-text-secondary hover:bg-bg-hover",
              )}
            >
              <CheckCircle2 size={15} className={nav.done ? "text-status-normal" : ""} aria-hidden />
              {nav.done ? t("Completed", "Tamamlandı") : t("Mark as completed", "Tamamlandı olarak işaretle")}
            </button>
            <div className="grid gap-2 sm:grid-cols-2">
              {nav.prev ? (
                <button
                  type="button"
                  onClick={() => nav.onOpen(nav.prev!.id)}
                  className="group rounded-lg border border-border-primary p-3 text-left hover:border-accent"
                >
                  <div className="flex items-center gap-1 text-xs text-text-muted">
                    <ChevronLeft size={13} /> {t("Previous", "Önceki")}
                  </div>
                  <div className="mt-0.5 text-sm font-semibold text-text-primary group-hover:text-accent">
                    {nav.prev.n}. {nav.prev.title[lang]}
                  </div>
                </button>
              ) : (
                <span />
              )}
              {nav.next && (
                <button
                  type="button"
                  onClick={() => nav.onOpen(nav.next!.id)}
                  className="group rounded-lg border border-border-primary p-3 text-right hover:border-accent"
                >
                  <div className="flex items-center justify-end gap-1 text-xs text-text-muted">
                    {t("Next", "Sonraki")} <ChevronRight size={13} />
                  </div>
                  <div className="mt-0.5 text-sm font-semibold text-text-primary group-hover:text-accent">
                    {nav.next.n}. {nav.next.title[lang]}
                  </div>
                </button>
              )}
            </div>
          </footer>
        </div>
      </article>
    </CiteContext.Provider>
  );
}
