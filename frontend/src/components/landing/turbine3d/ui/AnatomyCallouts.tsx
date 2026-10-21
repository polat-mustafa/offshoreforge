/**
 * Exploded-view callouts over the 3D canvas: a numbered balloon on every part
 * (the item numbers of drawing A-01 and the parts list) and a dashed trace
 * line from where the part sits assembled. Positions come from
 * AnatomyProjector through model/anatomyCallouts and are applied in its
 * per-frame `draw` hook; React renders only when the hover or selection
 * changes. A balloon names its part when hovered or selected; clicking it
 * pins the part, like clicking the part itself.
 */

import { useEffect, useRef } from "react";

import { NACELLE_ANATOMY, anatomyOf } from "../../../../constants/nacelleAnatomy";
import type { TurbinePartId } from "../../../../constants/turbinePartEducation";
import { cn } from "../../../../lib/utils";
import { callouts } from "../model/anatomyCallouts";
import { useAnatomyHover } from "../model/anatomyHover";

/** Trace lines shorter than this [px] are not drawn (the part has barely moved). */
const MIN_TRACE_PX = 12;

export function AnatomyCallouts({ selected, onSelect }: { selected: TurbinePartId | null; onSelect: (id: TurbinePartId) => void }) {
  const hovered = useAnatomyHover((s) => s.part);
  const setHover = useAnatomyHover((s) => s.set);
  const hot = new Set([anatomyOf(hovered)?.item, anatomyOf(selected)?.item]);
  const balloons = useRef(new Map<number, HTMLDivElement>());
  const traces = useRef(new Map<number, SVGGElement>());

  useEffect(() => {
    callouts.draw = () => {
      for (const { item } of NACELLE_ANATOMY) {
        const p = callouts.points.get(item);
        const b = balloons.current.get(item);
        const t = traces.current.get(item);
        if (!b || !t) continue;
        if (!p?.on) {
          b.style.visibility = t.style.visibility = "hidden";
          continue;
        }
        b.style.visibility = "visible";
        b.style.transform = `translate(${p.x.toFixed(1)}px, ${p.y.toFixed(1)}px)`;
        const moved = Math.hypot(p.x - p.x0, p.y - p.y0) > MIN_TRACE_PX;
        t.style.visibility = moved ? "visible" : "hidden";
        if (!moved) continue;
        const [line, dot] = t.children;
        line.setAttribute("x1", p.x0.toFixed(1));
        line.setAttribute("y1", p.y0.toFixed(1));
        line.setAttribute("x2", p.x.toFixed(1));
        line.setAttribute("y2", p.y.toFixed(1));
        dot.setAttribute("cx", p.x0.toFixed(1));
        dot.setAttribute("cy", p.y0.toFixed(1));
      }
    };
    return () => {
      callouts.draw = null;
    };
  }, []);

  return (
    // z-[5]: under the viewer's own panels and menus
    <div className="pointer-events-none absolute inset-0 z-[5] overflow-hidden" data-testid="anatomy-callouts">
      <svg className="absolute inset-0 h-full w-full" aria-hidden>
        {NACELLE_ANATOMY.map((p) => (
          <g
            key={p.item}
            ref={(el) => {
              if (el) traces.current.set(p.item, el);
              else traces.current.delete(p.item);
            }}
            style={{ visibility: "hidden" }}
            stroke="var(--color-accent)"
            strokeOpacity={hot.has(p.item) ? 1 : 0.55}
          >
            <line strokeWidth={hot.has(p.item) ? 1.6 : 1.1} strokeDasharray="5 4" />
            <circle r={2} fill="var(--color-accent)" stroke="none" />
          </g>
        ))}
      </svg>
      {NACELLE_ANATOMY.map((p) => {
        const on = hot.has(p.item);
        return (
          <div
            key={p.item}
            ref={(el) => {
              if (el) balloons.current.set(p.item, el);
              else balloons.current.delete(p.item);
            }}
            className={cn("absolute left-0 top-0", on ? "z-20" : "z-10")}
            style={{ visibility: "hidden" }}
          >
            <button
              type="button"
              onClick={() => onSelect(p.ids[0])}
              onPointerEnter={() => setHover(p.ids[0])}
              onPointerLeave={() => setHover(null)}
              aria-label={p.title}
              className={cn(
                "pointer-events-auto absolute -left-[11px] -top-[11px] flex items-center gap-1.5 rounded-full",
                "transition-transform duration-150 hover:scale-110",
              )}
            >
              <span
                className={cn(
                  "flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-full border-2 font-mono text-[11px] font-bold shadow-md",
                  on ? "border-accent bg-accent text-accent-ink" : "border-accent bg-bg-secondary/95 text-accent",
                )}
              >
                {p.item}
              </span>
              {on && (
                <span className="whitespace-nowrap rounded-md border border-border-primary bg-bg-secondary/95 px-2 py-0.5 text-xs font-semibold text-text-primary shadow-md">
                  {p.title}
                </span>
              )}
            </button>
          </div>
        );
      })}
    </div>
  );
}
