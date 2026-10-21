/**
 * The building blocks of a chapter page: numbered figures, equations and tables,
 * callouts, worked examples, the "theory to practice" panel, the self-check quiz and
 * the reference list. Labels are bilingual; the content comes from course/*.
 */

import { useState, type ComponentType, type ReactNode } from "react";
import {
  AlertTriangle,
  BookMarked,
  Building2,
  Calculator,
  CheckCircle2,
  Circle,
  FileCode2,
  History,
  Info,
  Server,
  ShieldAlert,
  Target,
  XCircle,
} from "lucide-react";

import { cn } from "../../../../lib/utils";
import { REFS } from "../course/refs";
import type { CalloutTone, EqSymbol, Lang, Practice, QuizItem, T } from "../course/types";
import { RichText } from "./RichText";
import { Tex } from "./Tex";

export const L = (lang: Lang) => (en: string, tr: string) => (lang === "tr" ? tr : en);

export function Prose({ text, lang, className }: { text: T; lang: Lang; className?: string }) {
  return (
    <p className={cn("text-[15px] leading-[1.75] text-text-secondary", className)}>
      <RichText text={text[lang]} lang={lang} />
    </p>
  );
}

// ── figure ─────────────────────────────────────────────────────────

export function FigureFrame({
  label,
  caption,
  source,
  lang,
  id,
  children,
}: {
  label: string;
  caption: T;
  source?: T;
  lang: Lang;
  id: string;
  children: ReactNode;
}) {
  return (
    <figure id={id} className="my-6 scroll-mt-24">
      <div className="bw-viz rounded-lg border border-border-primary bg-bg-primary p-3 sm:p-4">{children}</div>
      <figcaption className="mt-2 text-[13px] leading-relaxed text-text-secondary">
        <span className="font-semibold text-text-primary">{label}. </span>
        <RichText text={caption[lang]} lang={lang} />
        {source && (
          <span className="mt-0.5 block text-xs text-text-muted">
            {L(lang)("Source: ", "Kaynak: ")}
            <RichText text={source[lang]} lang={lang} />
          </span>
        )}
      </figcaption>
    </figure>
  );
}

/** Renders a registered figure inside its numbered frame. */
export function FigureBlock({
  Fig,
  ...frame
}: {
  Fig: ComponentType<{ lang: Lang }> | undefined;
  label: string;
  caption: T;
  source?: T;
  lang: Lang;
  id: string;
}) {
  return <FigureFrame {...frame}>{Fig ? <Fig lang={frame.lang} /> : <p className="text-sm text-status-alarm">missing figure</p>}</FigureFrame>;
}

// ── equation ───────────────────────────────────────────────────────

/** Parts separated by \qquad go on their own centred lines, so no equation scrolls sideways. */
function stack(tex: string): string {
  if (tex.includes("\\begin{") || !tex.includes("\\qquad")) return tex;
  const parts = tex.split("\\qquad").map((x) => x.trim().replace(/,$/, ""));
  return `\\begin{gathered}${parts.join("\\\\[6pt]")}\\end{gathered}`;
}

export function Equation({ tex, where, source, label, lang, id }: { tex: string; where?: EqSymbol[]; source?: string; label: string; lang: Lang; id: string }) {
  return (
    <div id={id} className="my-5 scroll-mt-24 rounded-lg border border-border-primary bg-bg-secondary/60 px-4 py-3">
      <div className="flex items-center gap-3">
        <div className="min-w-0 flex-1 overflow-x-auto py-1 text-center text-text-primary">
          <Tex tex={stack(tex)} display />
        </div>
        <span className="shrink-0 font-mono text-xs text-text-muted">({label})</span>
      </div>
      {where && where.length > 0 && (
        <dl className="mt-2 grid grid-cols-[auto_1fr_auto] gap-x-3 gap-y-1 border-t border-border-primary pt-2 text-[13px]">
          {where.map((s) => (
            <div key={s.sym} className="contents">
              <dt className="text-right text-text-primary">
                <Tex tex={s.sym} />
              </dt>
              <dd className="text-text-secondary">
                <RichText text={s.def[lang]} lang={lang} />
              </dd>
              <dd className="text-right font-mono text-xs text-text-muted">{s.unit ?? ""}</dd>
            </div>
          ))}
        </dl>
      )}
      {source && <p className="mt-1.5 text-right font-mono text-[11px] text-text-muted">{source}</p>}
    </div>
  );
}

// ── callout ────────────────────────────────────────────────────────

const TONE: Record<CalloutTone, { Icon: typeof Info; cls: string; en: string; tr: string }> = {
  example: { Icon: Calculator, cls: "border-l-[color:var(--viz-1)] bg-[color:color-mix(in_srgb,var(--viz-1)_7%,transparent)]", en: "Worked example", tr: "Çözümlü örnek" },
  pitfall: { Icon: AlertTriangle, cls: "border-l-status-warning bg-status-warning/5", en: "Pitfall", tr: "Dikkat" },
  note: { Icon: Info, cls: "border-l-accent bg-accent/5", en: "Note", tr: "Not" },
  history: { Icon: History, cls: "border-l-[color:var(--viz-3)] bg-[color:color-mix(in_srgb,var(--viz-3)_7%,transparent)]", en: "From this project", tr: "Bu projeden" },
};

export function Callout({ tone, title, body, lang }: { tone: CalloutTone; title: T; body: T[]; lang: Lang }) {
  const t = TONE[tone];
  return (
    <aside className={cn("bw-viz my-5 rounded-r-lg border-l-[3px] px-4 py-3", t.cls)}>
      <div className="mb-1 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-text-muted">
        <t.Icon size={14} aria-hidden /> {lang === "tr" ? t.tr : t.en}
      </div>
      <div className="mb-1 text-sm font-semibold text-text-primary">{title[lang]}</div>
      {body.map((b, i) => (
        <p key={i} className="mt-1 text-sm leading-relaxed text-text-secondary">
          <RichText text={b[lang]} lang={lang} />
        </p>
      ))}
    </aside>
  );
}

// ── list, table, worked steps, code ───────────────────────────────

export function ListBlock({ items, ordered, lang }: { items: T[]; ordered?: boolean; lang: Lang }) {
  const Tag = ordered ? "ol" : "ul";
  return (
    <Tag className={cn("my-3 space-y-1.5 pl-6 text-[15px] leading-[1.7] text-text-secondary", ordered ? "list-decimal" : "list-disc")}>
      {items.map((it, i) => (
        <li key={i}>
          <RichText text={it[lang]} lang={lang} />
        </li>
      ))}
    </Tag>
  );
}

export function TableBlock({ caption, head, rows, source, label, lang, id }: { caption: T; head: T[]; rows: T[][]; source?: T; label: string; lang: Lang; id: string }) {
  return (
    <figure id={id} className="my-6 scroll-mt-24">
      <figcaption className="mb-2 text-[13px] leading-relaxed text-text-secondary">
        <span className="font-semibold text-text-primary">{label}. </span>
        <RichText text={caption[lang]} lang={lang} />
      </figcaption>
      <div className="overflow-x-auto">
        <table className="w-full border-y-2 border-text-muted/60 text-[13px]">
          <thead>
            <tr className="border-b border-text-muted/40">
              {head.map((h, i) => (
                <th key={i} className="px-2 py-1.5 text-left font-semibold text-text-primary">
                  <RichText text={h[lang]} lang={lang} />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i} className="border-b border-border-primary last:border-0">
                {r.map((c, j) => (
                  <td key={j} className={cn("px-2 py-1.5 align-top text-text-secondary", j === 0 && "font-medium text-text-primary")}>
                    <RichText text={c[lang]} lang={lang} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {source && (
        <p className="mt-1 text-xs text-text-muted">
          {L(lang)("Source: ", "Kaynak: ")}
          <RichText text={source[lang]} lang={lang} />
        </p>
      )}
    </figure>
  );
}

export function Steps({ title, given, steps, result, lang }: { title: T; given: T; steps: T[]; result: T; lang: Lang }) {
  const t = L(lang);
  return (
    <aside className="bw-viz my-5 rounded-lg border border-border-primary bg-bg-secondary/60 p-4">
      <div className="mb-1 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-text-muted">
        <Calculator size={14} aria-hidden /> {t("Worked example", "Çözümlü örnek")}
      </div>
      <div className="mb-2 text-sm font-semibold text-text-primary">{title[lang]}</div>
      <p className="mb-2 text-sm leading-relaxed text-text-secondary">
        <span className="font-semibold text-text-primary">{t("Given: ", "Verilen: ")}</span>
        <RichText text={given[lang]} lang={lang} />
      </p>
      <ol className="space-y-1.5">
        {steps.map((s, i) => (
          <li key={i} className="flex gap-2.5 text-sm leading-relaxed text-text-secondary">
            <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-bg-tertiary font-mono text-[11px] font-semibold text-text-primary">{i + 1}</span>
            <span className="min-w-0">
              <RichText text={s[lang]} lang={lang} />
            </span>
          </li>
        ))}
      </ol>
      <p className="mt-3 border-t border-dashed border-border-secondary pt-2 text-sm leading-relaxed text-text-primary">
        <span className="font-semibold">{t("Result: ", "Sonuç: ")}</span>
        <RichText text={result[lang]} lang={lang} />
      </p>
    </aside>
  );
}

export function CodeBlock({ caption, file, symbol, code, lang }: { caption: T; file: string; symbol?: string; code: string; lang: Lang }) {
  return (
    <figure className="my-5">
      <div className="overflow-hidden rounded-lg border border-border-primary">
        <div className="flex items-center gap-2 border-b border-border-primary bg-bg-tertiary px-3 py-1.5 font-mono text-xs text-text-secondary" translate="no">
          <FileCode2 size={13} aria-hidden /> {file}
          {symbol && <span className="text-text-muted">· {symbol}</span>}
        </div>
        <pre className="overflow-x-auto bg-bg-primary p-3 font-mono text-[12.5px] leading-relaxed text-text-primary" translate="no">
          {code}
        </pre>
      </div>
      <figcaption className="mt-1.5 text-xs text-text-muted">
        <RichText text={caption[lang]} lang={lang} />
      </figcaption>
    </figure>
  );
}

// ── theory → practice ──────────────────────────────────────────────

export function PracticePanel({ practice, lang }: { practice: Practice; lang: Lang }) {
  const t = L(lang);
  const card = (Icon: typeof Info, title: string, items: T[], extra?: ReactNode) => (
    <div className="rounded-lg border border-border-primary bg-bg-secondary p-4">
      <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-text-primary">
        <Icon size={16} className="text-accent" aria-hidden /> {title}
      </div>
      <ul className="space-y-1.5 text-sm leading-relaxed text-text-secondary">
        {items.map((it, i) => (
          <li key={i} className="flex gap-2">
            <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-text-muted" aria-hidden />
            <span>
              <RichText text={it[lang]} lang={lang} />
            </span>
          </li>
        ))}
      </ul>
      {extra}
    </div>
  );
  return (
    <section aria-label={t("From theory to practice", "Teoriden pratiğe")} className="my-8">
      <h3 className="mb-3 text-lg font-semibold text-text-primary">{t("From theory to practice", "Teoriden pratiğe")}</h3>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {card(
          Server,
          t("In this platform", "Bu platformda"),
          practice.platform,
          <div className="mt-3 flex flex-wrap gap-1.5" translate="no">
            {practice.files.map((f) => (
              <code key={f} className="rounded border border-border-secondary bg-bg-primary px-1.5 py-0.5 font-mono text-[11px] text-text-secondary">
                {f}
              </code>
            ))}
          </div>,
        )}
        {card(Building2, t("In industry", "Sektörde"), practice.industry)}
        {card(Target, t("The problem it solves", "Çözdüğü problem"), practice.solves)}
        {card(ShieldAlert, t("Limits and costs", "Sınırlar ve bedeli"), practice.limits)}
      </div>
    </section>
  );
}

// ── self-check ─────────────────────────────────────────────────────

export function Quiz({ items, lang }: { items: QuizItem[]; lang: Lang }) {
  const t = L(lang);
  const [picked, setPicked] = useState<(number | null)[]>(() => items.map(() => null));
  return (
    <section className="my-8">
      <h3 className="mb-3 text-lg font-semibold text-text-primary">{t("Check your understanding", "Kendinizi sınayın")}</h3>
      <ol className="space-y-4">
        {items.map((it, qi) => {
          const p = picked[qi];
          return (
            <li key={qi} className="rounded-lg border border-border-primary bg-bg-secondary p-4">
              <p className="mb-2 text-sm font-semibold text-text-primary">
                {qi + 1}. <RichText text={it.q[lang]} lang={lang} />
              </p>
              <div className="space-y-1.5" role="radiogroup" aria-label={`${t("Question", "Soru")} ${qi + 1}`}>
                {it.options.map((o, oi) => {
                  const chosen = p === oi;
                  const right = oi === it.answer;
                  const Icon = p === null ? Circle : right ? CheckCircle2 : chosen ? XCircle : Circle;
                  return (
                    <button
                      key={oi}
                      type="button"
                      role="radio"
                      aria-checked={chosen}
                      onClick={() => setPicked((v) => v.map((x, k) => (k === qi ? oi : x)))}
                      className={cn(
                        "flex w-full items-start gap-2 rounded-md border px-3 py-2 text-left text-sm transition-colors",
                        p === null && "border-border-primary hover:border-accent hover:bg-bg-hover",
                        p !== null && right && "border-status-normal/60 bg-status-normal/10",
                        p !== null && chosen && !right && "border-status-alarm/60 bg-status-alarm/10",
                        p !== null && !chosen && !right && "border-border-primary opacity-70",
                      )}
                    >
                      <Icon size={16} className={cn("mt-0.5 shrink-0", p !== null && right ? "text-status-normal" : p !== null && chosen ? "text-status-alarm" : "text-text-muted")} aria-hidden />
                      <span className="text-text-secondary">
                        <RichText text={o[lang]} lang={lang} />
                      </span>
                    </button>
                  );
                })}
              </div>
              {p !== null && (
                <p className="mt-2 text-sm leading-relaxed text-text-secondary" aria-live="polite">
                  <span className={cn("font-semibold", p === it.answer ? "text-status-normal" : "text-status-alarm")}>
                    {p === it.answer ? t("Correct. ", "Doğru. ") : t("Not quite. ", "Tam değil. ")}
                  </span>
                  <RichText text={it.why[lang]} lang={lang} />
                </p>
              )}
            </li>
          );
        })}
      </ol>
    </section>
  );
}

// ── references ─────────────────────────────────────────────────────

export function References({ keys, anchor, lang }: { keys: string[]; anchor: (k: string) => string; lang: Lang }) {
  const t = L(lang);
  if (!keys.length) return null;
  return (
    <section className="my-8">
      <h3 className="mb-3 flex items-center gap-2 text-lg font-semibold text-text-primary">
        <BookMarked size={17} aria-hidden /> {t("References", "Kaynaklar")}
      </h3>
      <ol className="space-y-2 text-[13px] leading-relaxed text-text-secondary" translate="no">
        {keys.map((k, i) => {
          const r = REFS[k];
          if (!r) return null;
          const href = r.doi ? `https://doi.org/${r.doi}` : r.url;
          return (
            <li key={k} id={anchor(k)} className="flex scroll-mt-24 gap-2">
              <span className="w-7 shrink-0 text-right font-mono text-text-muted">[{i + 1}]</span>
              <span>
                {r.authors}, “{r.title},” <em>{r.venue}</em>, {r.year}.
                {href && (
                  <>
                    {" "}
                    <a href={href} target="_blank" rel="noreferrer" className="break-all text-accent hover:underline">
                      {r.doi ? `doi:${r.doi}` : href}
                    </a>
                  </>
                )}
              </span>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
