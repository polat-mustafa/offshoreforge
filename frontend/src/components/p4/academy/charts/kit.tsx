/**
 * A small chart kit for the academy figures: one look for every plot.
 *
 * Charts render at the measured pixel width of their container (ResizeObserver), so text
 * stays at 11–12 px on a phone instead of shrinking with a fixed viewBox. Colours are the
 * validated series slots of .bw-viz (--viz-1…4) and the text tokens; text never wears a
 * series colour. Gridlines are 1 px hairlines, lines 2 px, markers ≥ 8 px. Line charts
 * carry a crosshair that snaps to the nearest x and lists every series (dataviz rules).
 */

import { useId, useMemo, useState, type ReactNode } from "react";

import { C, linear, niceTicks, useWidth, type Scale } from "./core";

// ── legend ────────────────────────────────────────────────────────

export type KeyKind = "line" | "dash" | "dot" | "area" | "bar";
export interface LegendItem {
  label: string;
  color: string;
  kind?: KeyKind;
}

export function Legend({ items, className = "" }: { items: LegendItem[]; className?: string }) {
  return (
    <ul className={`flex flex-wrap gap-x-4 gap-y-1 text-xs text-text-secondary ${className}`}>
      {items.map((it) => (
        <li key={it.label} className="flex items-center gap-1.5">
          <Key kind={it.kind ?? "line"} color={it.color} />
          {it.label}
        </li>
      ))}
    </ul>
  );
}

export function Key({ kind, color }: { kind: KeyKind; color: string }) {
  return (
    <svg width={18} height={10} aria-hidden className="shrink-0">
      {kind === "line" && <line x1={1} x2={17} y1={5} y2={5} style={{ stroke: color }} strokeWidth={2} strokeLinecap="round" />}
      {kind === "dash" && <line x1={1} x2={17} y1={5} y2={5} style={{ stroke: color }} strokeWidth={2} strokeDasharray="4 3" />}
      {kind === "dot" && <circle cx={9} cy={5} r={4} style={{ fill: color }} />}
      {kind === "area" && <rect x={1} y={1} width={16} height={8} rx={2} style={{ fill: color }} opacity={0.3} />}
      {kind === "bar" && <rect x={4} y={1} width={10} height={8} rx={2} style={{ fill: color }} />}
    </svg>
  );
}

// ── XY chart ──────────────────────────────────────────────────────

export type Pt = [number, number | null];

export type Series =
  | { kind: "line"; id: string; label: string; color: string; points: Pt[]; dash?: boolean; width?: number; legend?: KeyKind | false; hover?: boolean; unit?: string; decimals?: number; curve?: boolean }
  | { kind: "band"; id: string; label: string; color: string; lower: Pt[]; upper: Pt[]; opacity?: number; legend?: boolean }
  | { kind: "scatter"; id: string; label: string; color: string; points: Pt[]; r?: number; opacity?: number; legend?: boolean }
  | { kind: "bars"; id: string; label: string; color: string; points: Pt[]; width?: number; legend?: boolean; base?: number };

export interface Axis {
  domain: [number, number];
  ticks?: number[];
  format?: (v: number) => string;
  title?: string;
}

export interface Scales {
  sx: Scale;
  sy: Scale;
  w: number;
  h: number;
  m: { l: number; r: number; t: number; b: number };
}

function pathOf(points: Pt[], sx: Scale, sy: Scale, smooth = false): string {
  let d = "";
  let pen = false;
  const pts: [number, number][] = [];
  const flush = () => {
    if (pts.length === 0) return;
    if (!smooth || pts.length < 3) {
      d += pts.map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(1)},${y.toFixed(1)}`).join("");
    } else {
      // monotone-ish Catmull–Rom → cubic Bézier (tension 0.5), only for smooth analytic curves
      d += `M${pts[0][0].toFixed(1)},${pts[0][1].toFixed(1)}`;
      for (let i = 0; i < pts.length - 1; i++) {
        const p0 = pts[Math.max(0, i - 1)];
        const p1 = pts[i];
        const p2 = pts[i + 1];
        const p3 = pts[Math.min(pts.length - 1, i + 2)];
        const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
        const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
        d += `C${c1[0].toFixed(1)},${c1[1].toFixed(1)} ${c2[0].toFixed(1)},${c2[1].toFixed(1)} ${p2[0].toFixed(1)},${p2[1].toFixed(1)}`;
      }
    }
    pts.length = 0;
  };
  for (const [x, y] of points) {
    if (y === null || !Number.isFinite(y)) {
      if (pen) flush();
      pen = false;
      continue;
    }
    pts.push([sx(x), sy(y)]);
    pen = true;
  }
  flush();
  return d;
}

function bandPath(lower: Pt[], upper: Pt[], sx: Scale, sy: Scale): string {
  // contiguous runs where both bounds exist
  let d = "";
  let run: number[] = [];
  const close = () => {
    if (run.length > 1) {
      d += run.map((i, k) => `${k ? "L" : "M"}${sx(upper[i][0]).toFixed(1)},${sy(upper[i][1] as number).toFixed(1)}`).join("");
      d += [...run].reverse().map((i) => `L${sx(lower[i][0]).toFixed(1)},${sy(lower[i][1] as number).toFixed(1)}`).join("") + "Z";
    }
    run = [];
  };
  for (let i = 0; i < upper.length; i++) {
    if (upper[i][1] === null || lower[i]?.[1] === null || lower[i] === undefined) close();
    else run.push(i);
  }
  close();
  return d;
}

export interface XYChartProps {
  height?: number;
  x: Axis;
  y: Axis;
  series: Series[];
  /** Extra marks drawn under the series (regions) and over them (labels). */
  under?: (s: Scales) => ReactNode;
  over?: (s: Scales) => ReactNode;
  /** x value → tooltip heading. Crosshair is on when given. */
  hoverLabel?: (x: number) => string;
  legend?: boolean;
  ariaLabel: string;
  margin?: Partial<Scales["m"]>;
}

export function XYChart({ height = 280, x, y, series, under, over, hoverLabel, legend = true, ariaLabel, margin }: XYChartProps) {
  const [ref, width] = useWidth<HTMLDivElement>();
  const clip = useId().replace(/:/g, "");
  const m = { l: 52, r: 14, t: y.title ? 26 : 10, b: 38, ...margin };
  const w = Math.max(200, width);
  const h = height;
  const sx = useMemo(() => linear(x.domain, [m.l, w - m.r]), [x.domain, m.l, m.r, w]);
  const sy = useMemo(() => linear(y.domain, [h - m.b, m.t]), [y.domain, m.t, m.b, h]);
  const xt = x.ticks ?? niceTicks(x.domain[0], x.domain[1], Math.max(3, Math.floor(w / 110)));
  const yt = y.ticks ?? niceTicks(y.domain[0], y.domain[1], 5);
  const fx = x.format ?? ((v: number) => String(+v.toFixed(2)));
  const fy = y.format ?? ((v: number) => String(+v.toFixed(2)));
  const [hx, setHx] = useState<number | null>(null);
  const scales: Scales = { sx, sy, w, h, m };

  const hoverLines = series.filter((s): s is Extract<Series, { kind: "line" }> => s.kind === "line" && s.hover !== false);
  const xs = hoverLines[0]?.points.map((p) => p[0]) ?? [];
  const nearest = (xv: number) => {
    let best = 0;
    for (let i = 1; i < xs.length; i++) if (Math.abs(xs[i] - xv) < Math.abs(xs[best] - xv)) best = i;
    return best;
  };
  const hi = hx === null || !xs.length ? null : nearest(hx);

  const legendItems: LegendItem[] = series.flatMap((s): LegendItem[] => {
    if (s.kind === "line") return s.legend === false ? [] : [{ label: s.label, color: s.color, kind: s.legend ?? (s.dash ? "dash" : "line") }];
    if (s.kind === "band") return s.legend === false ? [] : [{ label: s.label, color: s.color, kind: "area" }];
    if (s.kind === "scatter") return s.legend === false ? [] : [{ label: s.label, color: s.color, kind: "dot" }];
    return s.legend === false ? [] : [{ label: s.label, color: s.color, kind: "bar" }];
  });

  // min-w-0: in a grid or flex row the chart must take the track's width, not impose its own
  return (
    <div className="min-w-0">
      {legend && legendItems.length > 1 && <Legend items={legendItems} className="mb-2" />}
      <div ref={ref} className="relative w-full min-w-0">
        <svg
          width={w}
          height={h}
          role="img"
          aria-label={ariaLabel}
          className="block select-none overflow-visible"
          style={{ fontFamily: "inherit" }}
          onPointerMove={
            hoverLabel
              ? (e) => {
                  const r = (e.currentTarget as SVGSVGElement).getBoundingClientRect();
                  const px = e.clientX - r.left;
                  setHx(px < m.l || px > w - m.r ? null : sx.invert(px));
                }
              : undefined
          }
          onPointerLeave={hoverLabel ? () => setHx(null) : undefined}
        >
          <defs>
            <clipPath id={`clip${clip}`}>
              <rect x={m.l} y={m.t - 2} width={w - m.l - m.r} height={h - m.t - m.b + 4} />
            </clipPath>
          </defs>
          {/* grid + axes */}
          {yt.map((v) => (
            <g key={`y${v}`}>
              <line x1={m.l} x2={w - m.r} y1={sy(v)} y2={sy(v)} style={{ stroke: C.grid }} strokeWidth={1} />
              <text x={m.l - 6} y={sy(v) + 4} textAnchor="end" fontSize={11} style={{ fill: C.muted, fontVariantNumeric: "tabular-nums" }}>
                {fy(v)}
              </text>
            </g>
          ))}
          <line x1={m.l} x2={w - m.r} y1={h - m.b} y2={h - m.b} style={{ stroke: C.axis }} strokeWidth={1} />
          {xt.map((v) => (
            <g key={`x${v}`}>
              <line x1={sx(v)} x2={sx(v)} y1={h - m.b} y2={h - m.b + 4} style={{ stroke: C.axis }} />
              <text x={sx(v)} y={h - m.b + 16} textAnchor="middle" fontSize={11} style={{ fill: C.muted, fontVariantNumeric: "tabular-nums" }}>
                {fx(v)}
              </text>
            </g>
          ))}
          {x.title && (
            <text x={w - m.r} y={h - 4} textAnchor="end" fontSize={11} style={{ fill: C.ink2 }}>
              {x.title}
            </text>
          )}
          {y.title && (
            <text x={4} y={12} textAnchor="start" fontSize={11} style={{ fill: C.ink2 }}>
              {y.title}
            </text>
          )}

          <g clipPath={`url(#clip${clip})`}>
            {under?.(scales)}
            {series.map((s) => {
              if (s.kind === "band")
                return <path key={s.id} d={bandPath(s.lower, s.upper, sx, sy)} style={{ fill: s.color }} opacity={s.opacity ?? 0.16} />;
              if (s.kind === "line")
                return (
                  <path
                    key={s.id}
                    d={pathOf(s.points, sx, sy, s.curve)}
                    fill="none"
                    style={{ stroke: s.color, transition: "d 160ms ease-out" }}
                    strokeWidth={s.width ?? 2}
                    strokeDasharray={s.dash ? "5 4" : undefined}
                    strokeLinejoin="round"
                    strokeLinecap="round"
                  />
                );
              if (s.kind === "scatter")
                return (
                  <g key={s.id} style={{ fill: s.color }} opacity={s.opacity ?? 0.55}>
                    {s.points.map(([px, py], i) => (py === null ? null : <circle key={i} cx={sx(px)} cy={sy(py)} r={s.r ?? 2.2} />))}
                  </g>
                );
              const bw = s.width ?? Math.max(2, Math.min(24, ((w - m.l - m.r) / Math.max(1, s.points.length)) * 0.7));
              const base = sy(s.base ?? Math.max(y.domain[0], 0));
              return (
                <g key={s.id} style={{ fill: s.color }}>
                  {s.points.map(([px, py], i) => {
                    if (py === null) return null;
                    const top = sy(py);
                    const y0 = Math.min(top, base);
                    return <rect key={i} x={sx(px) - bw / 2} y={y0} width={bw} height={Math.max(0.5, Math.abs(base - top))} rx={Math.min(3, bw / 3)} />;
                  })}
                </g>
              );
            })}
            {over?.(scales)}
          </g>

          {/* crosshair */}
          {hi !== null && (
            <g pointerEvents="none">
              <line x1={sx(xs[hi])} x2={sx(xs[hi])} y1={m.t} y2={h - m.b} style={{ stroke: C.ink2 }} strokeWidth={1} />
              {hoverLines.map((s) => {
                const v = s.points[hi]?.[1];
                return v === null || v === undefined ? null : (
                  <circle key={s.id} cx={sx(xs[hi])} cy={sy(v)} r={4} style={{ fill: s.color, stroke: C.surface }} strokeWidth={2} />
                );
              })}
            </g>
          )}
        </svg>
        {hi !== null && hoverLabel && (
          <div
            className="pointer-events-none absolute top-1 z-10 min-w-[150px] rounded-md border border-border-secondary bg-bg-elevated px-2.5 py-1.5 text-xs shadow-lg"
            style={sx(xs[hi]) > w / 2 ? { right: w - sx(xs[hi]) + 10 } : { left: sx(xs[hi]) + 10 }}
          >
            <div className="mb-1 font-semibold text-text-primary">{hoverLabel(xs[hi])}</div>
            {hoverLines.map((s) => {
              const v = s.points[hi]?.[1];
              return (
                <div key={s.id} className="flex items-center gap-1.5 whitespace-nowrap">
                  <Key kind={s.dash ? "dash" : "line"} color={s.color} />
                  <span className="font-mono font-semibold tabular-nums text-text-primary">
                    {v === null || v === undefined ? "—" : v.toFixed(s.decimals ?? 0)}
                    {s.unit ? ` ${s.unit}` : ""}
                  </span>
                  <span className="text-text-muted">{s.label}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ── diagrams ──────────────────────────────────────────────────────

/** A labelled block of an engineering diagram. */
export function Block({
  x,
  y,
  w,
  h,
  title,
  sub,
  tone = C.axis,
  fill = C.panel,
  code,
  strong,
}: {
  x: number;
  y: number;
  w: number;
  h: number;
  title: string;
  sub?: string;
  tone?: string;
  fill?: string;
  code?: string;
  strong?: boolean;
}) {
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} rx={5} style={{ fill, stroke: tone }} strokeWidth={strong ? 2 : 1.2} />
      {code && (
        <text x={x + 8} y={y + 13} fontSize={9.5} fontWeight={700} letterSpacing={0.5} style={{ fill: C.muted, fontFamily: "var(--font-mono)" }}>
          {code}
        </text>
      )}
      <text x={x + w / 2} y={y + (code ? h / 2 + 6 : sub ? h / 2 - 2 : h / 2 + 4)} textAnchor="middle" fontSize={12.5} fontWeight={650} style={{ fill: C.ink }}>
        {title}
      </text>
      {sub && (
        <text x={x + w / 2} y={y + (code ? h / 2 + 21 : h / 2 + 14)} textAnchor="middle" fontSize={10.5} style={{ fill: C.muted }}>
          {sub}
        </text>
      )}
    </g>
  );
}

/** Horizontal scroller for wide diagrams: they keep their legible size on a phone. */
export function Wide({ minWidth, children }: { minWidth: number; children: ReactNode }) {
  return (
    <div className="-mx-1 overflow-x-auto px-1 pb-1">
      <div style={{ minWidth }}>{children}</div>
    </div>
  );
}

/** Segmented control used by every interactive figure. */
export function Segmented<V extends string | number>({
  value,
  options,
  onChange,
  label,
}: {
  value: V;
  options: { v: V; label: string }[];
  onChange: (v: V) => void;
  label: string;
}) {
  return (
    <div role="radiogroup" aria-label={label} className="inline-flex flex-wrap overflow-hidden rounded-md border border-border-secondary">
      {options.map((o) => (
        <button
          key={String(o.v)}
          type="button"
          role="radio"
          aria-checked={o.v === value}
          onClick={() => onChange(o.v)}
          className={`px-2.5 py-1 text-xs font-semibold transition-colors ${
            o.v === value ? "bg-accent text-accent-ink" : "text-text-secondary hover:bg-bg-hover hover:text-text-primary"
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

/** A labelled range input with its value. */
export function Range({
  label,
  value,
  min,
  max,
  step,
  onChange,
  format,
  width = "w-36",
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
  format?: (v: number) => string;
  width?: string;
}) {
  return (
    <label className="flex items-center gap-2 text-xs text-text-secondary">
      <span className="font-semibold">{label}</span>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} className={`${width} accent-accent`} />
      <span className="min-w-[3.5rem] font-mono font-semibold tabular-nums text-text-primary">{format ? format(value) : value}</span>
    </label>
  );
}

/** Row of controls above a figure. */
export function Controls({ children }: { children: ReactNode }) {
  return <div className="mb-3 flex flex-wrap items-center gap-x-4 gap-y-2">{children}</div>;
}

/** A small read-out tile under a figure. */
export function Stat({ label, value, sub, tone }: { label: string; value: string; sub?: string; tone?: "good" | "bad" | "warn" }) {
  const border = tone === "good" ? "border-status-normal/50" : tone === "bad" ? "border-status-alarm/50" : tone === "warn" ? "border-status-warning/50" : "border-border-primary";
  return (
    <div className={`rounded-md border ${border} bg-bg-secondary px-3 py-2`}>
      <div className="text-xs text-text-muted">{label}</div>
      <div className="font-mono text-lg font-semibold text-text-primary">{value}</div>
      {sub && <div className="text-xs text-text-muted">{sub}</div>}
    </div>
  );
}

// ── horizontal bars ───────────────────────────────────────────────

export interface HBar {
  label: string;
  value: number;
  color: string;
  note?: string;
}

/** Horizontal bars with the value at the tip (one quantity, one axis). */
export function HBars({ bars, max, unit, decimals = 1, ariaLabel, format }: { bars: HBar[]; max: number; unit: string; decimals?: number; ariaLabel: string; format?: (v: number) => string }) {
  const f = format ?? ((v: number) => v.toFixed(decimals));
  return (
    <div role="img" aria-label={ariaLabel} className="space-y-2">
      {bars.map((b) => (
        <div key={b.label} className="grid grid-cols-[minmax(7rem,13rem)_1fr] items-center gap-3 text-xs sm:text-[13px]">
          <div className="text-right leading-tight text-text-secondary">
            {b.label}
            {b.note && <div className="text-[11px] text-text-muted">{b.note}</div>}
          </div>
          <div className="flex items-center gap-2">
            <div className="h-5 shrink-0 rounded-r-[4px]" style={{ width: `${Math.max(1, (82 * b.value) / max)}%`, background: b.color, transition: "width 400ms ease-out" }} />
            <span className="whitespace-nowrap font-mono font-semibold tabular-nums text-text-primary">
              {f(b.value)} {unit}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
