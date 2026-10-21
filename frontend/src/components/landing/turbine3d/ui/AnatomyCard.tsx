/**
 * Anatomy card of a nacelle part (exploded view): what it does, its IEA 15 MW
 * data, published failure rates, failure modes and maintenance — each line
 * with the source it comes from (constants/nacelleAnatomy).
 *
 *   AnatomyHoverCard  follows the pointer over a part (read-only preview)
 *   AnatomyCard       pinned when a part is clicked: same content, links work
 */

import type { RefObject } from "react";
import { ExternalLink, X } from "lucide-react";

import {
  ANATOMY_SOURCES,
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

/** Hover preview: role, the first data lines and the rates; the rest on the pinned card. */
function AnatomySummary({ part }: { part: AnatomyPart }) {
  return (
    <div className="space-y-1.5 text-[12px] leading-snug text-text-primary">
      <p className="text-text-secondary">{part.role}</p>
      {part.facts.slice(0, 3).map((f) => (
        <div key={f.label} className="flex justify-between gap-2">
          <span className="text-text-secondary">{f.label}</span>
          <span className="text-right font-semibold">
            <span>{f.value}</span>
            <Src id={f.src} linked={false} />
          </span>
        </div>
      ))}
      {part.rates.map((r) => (
        <div key={r.label + r.src} className="flex justify-between gap-2">
          <span className="text-text-secondary">{r.label}</span>
          <span className="text-right font-semibold">
            <span className="font-mono">{rateLine(r).perYear.toFixed(3)}</span> <span>per turbine per year</span>
            <Src id={r.src} linked={false} />
          </span>
        </div>
      ))}
      <div className="flex flex-wrap gap-x-3 text-[11px] font-semibold text-text-muted">
        <span>{part.failureModes.length} failure modes</span>
        <span>{part.maintenance.length} maintenance notes</span>
      </div>
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

/** Pinned card (a part was clicked in the exploded view). */
export function AnatomyCard({ id, onClose }: { id: TurbinePartId; onClose: () => void }) {
  const part = anatomyOf(id);
  if (!part) return null;
  return (
    <div className="pointer-events-auto flex max-h-full w-[22rem] flex-col rounded-lg border border-border-primary bg-bg-secondary/95 shadow-xl backdrop-blur @max-lg:w-full">
      <div className="flex items-start gap-2 border-b border-border-primary p-3">
        <div className="min-w-0 flex-1">
          <Header part={part} />
        </div>
        <button type="button" onClick={onClose} aria-label="Close part card" className="rounded p-1 hover:bg-bg-hover">
          <X size={14} />
        </button>
      </div>
      <div className="min-h-0 overflow-y-auto p-3">
        <AnatomyContent part={part} linked />
        <p className="mt-2 flex items-center gap-1 text-[11px] font-semibold text-text-muted">
          <ExternalLink size={11} /> Source tags open the publication; hover one for the full citation.
        </p>
      </div>
    </div>
  );
}

const CARD_W = 336;

/** Preview that follows the pointer while it is over a part. */
export function AnatomyHoverCard({ containerRef, except }: { containerRef: RefObject<HTMLDivElement | null>; except?: TurbinePartId | null }) {
  const { part: id, x, y } = useAnatomyHover();
  const part = anatomyOf(id);
  const box = containerRef.current?.getBoundingClientRect();
  if (!part || !box || (except && part.ids.includes(except))) return null;
  // beside the pointer, flipped to stay inside the viewer
  const px = x - box.left;
  const py = y - box.top;
  const left = px + 18 + CARD_W > box.width ? Math.max(8, px - 18 - CARD_W) : px + 18;
  const top = Math.min(Math.max(8, py - 40), Math.max(8, box.height - 300));
  return (
    <div
      className="pointer-events-none absolute z-30 rounded-lg border border-border-primary bg-bg-secondary/95 p-3 shadow-xl backdrop-blur"
      style={{ left, top, width: CARD_W }}
      role="tooltip"
    >
      <Header part={part} />
      <div className="mt-1.5">
        <AnatomySummary part={part} />
      </div>
      <div className="mt-1.5 text-[11px] font-semibold text-accent">Click the part for failures, maintenance and sources</div>
    </div>
  );
}
