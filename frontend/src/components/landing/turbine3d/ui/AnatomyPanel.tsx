/**
 * Anatomy panel of the exploded view, docked at the left of the viewer:
 *
 *   list    every part with its item number (the balloons in 3D, drawing
 *           A-01), function and IEA 15 MW mass; hovering a row highlights
 *           the part, clicking it opens its card
 *   card    what the part does, its IEA 15 MW data, published failure rates,
 *           failure modes and maintenance — each line with the source it
 *           comes from (constants/nacelleAnatomy); ‹ › step through the parts
 */

import { ChevronLeft, ChevronRight, ExternalLink } from "lucide-react";

import {
  ANATOMY_SOURCES,
  NACELLE_ANATOMY,
  anatomyOf,
  type AnatomyNote,
  type AnatomyPart,
  type AnatomyRate,
  type AnatomySourceId,
} from "../../../../constants/nacelleAnatomy";
import { CARROLL_2016, CARROLL_2016_MINOR_REPAIR_H, carrollTotal } from "../../../../constants/reliability";
import type { TurbinePartId } from "../../../../constants/turbinePartEducation";
import { cn } from "../../../../lib/utils";
import { useAnatomyHover } from "../model/anatomyHover";

function Src({ id, linked }: { id: AnatomySourceId; linked: boolean }) {
  const s = ANATOMY_SOURCES[id];
  const cls = cn(
    "ml-1 inline-block whitespace-nowrap rounded px-1 align-baseline text-[10.5px] font-semibold",
    id === "model" ? "bg-bg-tertiary text-text-muted" : "bg-accent-muted text-accent",
  );
  return linked && s.url ? (
    <a href={s.url} target="_blank" rel="noopener noreferrer" title={s.citation} className={cn(cls, "hover:underline")}>
      {s.short}
    </a>
  ) : (
    <span title={s.citation} className={cls}>
      {s.short}
    </span>
  );
}

function rateLine(r: AnatomyRate): { perYear: number; minorShare?: number; minorH?: number } {
  if (r.row) {
    const row = CARROLL_2016[r.row];
    const total = carrollTotal(r.row);
    return { perYear: total, minorShare: row.minorRepair / total, minorH: CARROLL_2016_MINOR_REPAIR_H[r.row] };
  }
  return { perYear: r.perYear ?? 0 };
}

function Notes({ notes, linked }: { notes: AnatomyNote[]; linked: boolean }) {
  return (
    <ul className="space-y-1">
      {notes.map((n) => (
        <li key={n.text} className="flex gap-1.5">
          <span aria-hidden className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-text-muted" />
          <span>
            {n.text}
            {n.derived && <span className="ml-1 text-[10.5px] font-semibold italic text-text-muted">our reading of</span>}
            <Src id={n.src} linked={linked} />
          </span>
        </li>
      ))}
    </ul>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border-t border-border-primary pt-1.5">
      <div className="mb-1 text-[10.5px] font-bold uppercase tracking-wide text-text-muted">{title}</div>
      {children}
    </div>
  );
}

export function AnatomyContent({ part, linked }: { part: AnatomyPart; linked: boolean }) {
  const usesCarroll2016 = part.rates.some((r) => r.src === "carroll2016");
  return (
    <div className="space-y-2 text-[12px] leading-snug text-text-primary">
      <p className="text-text-secondary">{part.role}</p>

      {part.facts.length > 0 && (
        <Section title="Data">
          <table className="w-full">
            <tbody>
              {part.facts.map((f) => (
                <tr key={f.label} className="align-top">
                  <td className="py-0.5 pr-2 text-text-secondary">{f.label}</td>
                  <td className="py-0.5 text-right font-semibold">
                    <span>{f.value}</span>
                    <Src id={f.src} linked={linked} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Section>
      )}

      <Section title="Failure rate">
        {part.rates.length === 0 ? (
          <p className="text-text-muted">Not reported as a separate sub-assembly in these data sets.</p>
        ) : (
          <ul className="space-y-1">
            {part.rates.map((r) => {
              const l = rateLine(r);
              return (
                <li key={r.label + r.src}>
                  <span className="font-semibold">{r.label}</span>
                  <Src id={r.src} linked={linked} />
                  <div className="text-text-secondary">
                    <span className="font-mono font-semibold text-text-primary">{l.perYear.toFixed(3)}</span>{" "}
                    <span>per turbine per year</span>
                    {l.minorShare !== undefined && (
                      <>
                        <span aria-hidden> · </span>
                        <span className="font-mono">{Math.round(l.minorShare * 100)} %</span> <span>minor repairs</span>
                      </>
                    )}
                    {l.minorH !== undefined && (
                      <>
                        <span aria-hidden> · </span>
                        <span>minor repair</span> <span className="font-mono">{l.minorH} h</span>
                      </>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
        {usesCarroll2016 && (
          <p className="mt-1 text-[11px] text-text-muted">
            Carroll 2016: offshore fleet of geared 2–4 MW turbines — indicative for a 15 MW direct drive, not its own rate.
          </p>
        )}
      </Section>

      <Section title="Typical failures">
        {part.failureModes.length === 0 ? (
          <p className="text-text-muted">No failure modes for this part in the sources used here.</p>
        ) : (
          <Notes notes={part.failureModes} linked={linked} />
        )}
      </Section>

      <Section title="Maintenance">
        {part.maintenance.length === 0 ? (
          <p className="text-text-muted">No sourced recommendation yet — follow the manufacturer's service manual.</p>
        ) : (
          <Notes notes={part.maintenance} linked={linked} />
        )}
      </Section>
    </div>
  );
}

function Header({ part }: { part: AnatomyPart }) {
  return (
    <div className="flex items-center gap-2">
      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 border-accent font-mono text-[12px] font-bold text-accent">
        {part.item}
      </span>
      <span className="text-[14px] font-bold">{part.title}</span>
      {part.massT !== undefined && (
        <span className="ml-auto font-mono text-[12px] font-semibold text-text-muted" translate="no">
          {part.massT.toFixed(1)} t
        </span>
      )}
    </div>
  );
}

const rowCls = "flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 text-left";

function Balloon({ item, on }: { item: number; on?: boolean }) {
  return (
    <span
      className={cn(
        "flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-full border-2 border-accent font-mono text-[11px] font-bold",
        on ? "bg-accent text-accent-ink" : "text-accent",
      )}
    >
      {item}
    </span>
  );
}

/** Parts list of the exploded view; hovering a row highlights the part in 3D. */
function PartsList({ onSelect }: { onSelect: (id: TurbinePartId) => void }) {
  const hovered = anatomyOf(useAnatomyHover((s) => s.part))?.item;
  const setHover = useAnatomyHover((s) => s.set);
  return (
    <>
      <div className="border-b border-border-primary px-3 pb-2 pt-2.5">
        <div className="text-[14px] font-bold">Nacelle anatomy</div>
        <div className="text-[11.5px] font-semibold text-text-muted">
          <span>{NACELLE_ANATOMY.length} parts</span> · <span>IEA 15 MW direct drive</span>
        </div>
      </div>
      <ul className="min-h-0 flex-1 overflow-y-auto p-1.5" onPointerLeave={() => setHover(null)}>
        {NACELLE_ANATOMY.map((p) => (
          <li key={p.item}>
            <button
              type="button"
              onClick={() => onSelect(p.ids[0])}
              onPointerEnter={() => setHover(p.ids[0])}
              className={cn(rowCls, hovered === p.item ? "bg-accent-muted" : "hover:bg-bg-hover")}
            >
              <Balloon item={p.item} on={hovered === p.item} />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[12.5px] font-semibold text-text-primary">{p.title}</span>
                <span className="block truncate text-[11px] text-text-muted">{p.brief}</span>
              </span>
              {p.massT !== undefined && (
                <span className="shrink-0 font-mono text-[11px] font-semibold text-text-secondary" translate="no">
                  {p.massT.toFixed(1)} t
                </span>
              )}
            </button>
          </li>
        ))}
      </ul>
      <div className="border-t border-border-primary px-3 py-1.5 text-[11px] font-semibold text-text-muted">
        Numbers match drawing A-01 · masses: IEA 15 MW data
      </div>
    </>
  );
}

/** Card of one part, with ‹ › to the neighbouring items. */
function PartCard({ part, onSelect, onBack }: { part: AnatomyPart; onSelect: (id: TurbinePartId) => void; onBack: () => void }) {
  const i = NACELLE_ANATOMY.indexOf(part);
  const prev = NACELLE_ANATOMY[(i + NACELLE_ANATOMY.length - 1) % NACELLE_ANATOMY.length];
  const next = NACELLE_ANATOMY[(i + 1) % NACELLE_ANATOMY.length];
  const step = "flex items-center rounded p-1 text-text-secondary hover:bg-bg-hover hover:text-text-primary";
  return (
    <>
      <div className="flex items-center gap-1 border-b border-border-primary px-1.5 py-1.5">
        <button type="button" onClick={onBack} className="flex items-center gap-0.5 rounded px-1.5 py-1 text-[12px] font-semibold text-accent hover:bg-accent-muted">
          <ChevronLeft size={14} /> All parts
        </button>
        <span className="ml-auto font-mono text-[11px] font-semibold text-text-muted">
          {part.item} / {NACELLE_ANATOMY.length}
        </span>
        <button type="button" onClick={() => onSelect(prev.ids[0])} className={step} aria-label="Previous part" title={prev.title}>
          <ChevronLeft size={15} />
        </button>
        <button type="button" onClick={() => onSelect(next.ids[0])} className={step} aria-label="Next part" title={next.title}>
          <ChevronRight size={15} />
        </button>
      </div>
      <div className="border-b border-border-primary px-3 py-2">
        <Header part={part} />
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto px-3 py-2">
        <AnatomyContent part={part} linked />
        <p className="mt-2 flex items-center gap-1 text-[11px] font-semibold text-text-muted">
          <ExternalLink size={11} /> Source tags open the publication; hover one for the full citation.
        </p>
      </div>
    </>
  );
}

/** Docked panel of the exploded view: the parts list, or the card of the selected part. */
export function AnatomyPanel({ selected, onSelect }: { selected: TurbinePartId | null; onSelect: (id: TurbinePartId | null) => void }) {
  const part = anatomyOf(selected);
  return (
    <div
      className={cn(
        "pointer-events-auto flex max-h-full w-[21rem] flex-col rounded-lg border border-border-primary bg-bg-secondary/95 text-text-primary shadow-xl backdrop-blur @max-lg:w-full",
        // narrow viewer: only the card of a selected part, the balloons are the index
        !part && "@max-3xl:hidden",
      )}
      data-testid="anatomy-panel"
    >
      {part ? <PartCard part={part} onSelect={onSelect} onBack={() => onSelect(null)} /> : <PartsList onSelect={onSelect} />}
    </div>
  );
}
