/**
 * Non-visual parts of the academy chart kit: measuring and motion hooks, linear scales,
 * "nice" ticks, the theme colours and diagram arrowheads. Components live in kit.tsx.
 */

import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";

// ── measuring ─────────────────────────────────────────────────────

/** Width of an element in px, kept current with a ResizeObserver (fallback for jsdom). */
export function useWidth<E extends HTMLElement>(fallback = 640) {
  const ref = useRef<E>(null);
  const [w, setW] = useState(fallback);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (el.clientWidth) setW(el.clientWidth);
    if (typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(([e]) => setW(Math.max(240, Math.round(e.contentRect.width))));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return [ref, w] as const;
}

/** true when the reader asked for less motion: no autoplay, no tweening. */
export function useReducedMotion() {
  const [r, setR] = useState(false);
  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const m = window.matchMedia("(prefers-reduced-motion: reduce)");
    setR(m.matches);
    const on = () => setR(m.matches);
    m.addEventListener?.("change", on);
    return () => m.removeEventListener?.("change", on);
  }, []);
  return r;
}

/** requestAnimationFrame loop while `running`; calls step(dt seconds). */
export function useFrame(running: boolean, step: (dt: number) => void) {
  const cb = useRef(step);
  useEffect(() => {
    cb.current = step;
  });
  useEffect(() => {
    if (!running) return;
    let id = 0;
    let last = performance.now();
    const loop = (now: number) => {
      cb.current(Math.min(0.1, (now - last) / 1000));
      last = now;
      id = requestAnimationFrame(loop);
    };
    id = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(id);
  }, [running]);
}

// ── scales and ticks ──────────────────────────────────────────────

export type Scale = ((v: number) => number) & { domain: [number, number]; range: [number, number]; invert: (px: number) => number };

export function linear(domain: [number, number], range: [number, number]): Scale {
  const [d0, d1] = domain;
  const [r0, r1] = range;
  const k = (r1 - r0) / (d1 - d0 || 1);
  const f = ((v: number) => r0 + (v - d0) * k) as Scale;
  f.domain = domain;
  f.range = range;
  f.invert = (px: number) => d0 + (px - r0) / k;
  return f;
}

/** "Nice" ticks (1, 2, 2.5, 5 × 10ⁿ) covering [min, max]. */
export function niceTicks(min: number, max: number, count = 5): number[] {
  if (!(max > min)) return [min];
  const raw = (max - min) / Math.max(1, count);
  const mag = 10 ** Math.floor(Math.log10(raw));
  const step = [1, 2, 2.5, 5, 10].map((m) => m * mag).find((s) => s >= raw) ?? 10 * mag;
  const out: number[] = [];
  for (let v = Math.ceil(min / step - 1e-9) * step; v <= max + step * 1e-9; v += step) out.push(+v.toFixed(10));
  return out;
}

// ── colours (CSS variables, theme-aware) ──────────────────────────

export const C = {
  ink: "var(--color-text-primary)",
  ink2: "var(--color-text-secondary)",
  muted: "var(--color-text-muted)",
  grid: "var(--color-border-primary)",
  axis: "var(--color-border-secondary)",
  surface: "var(--color-bg-primary)",
  panel: "var(--color-bg-secondary)",
  accent: "var(--color-accent)",
  v1: "var(--viz-1)",
  v2: "var(--viz-2)",
  v3: "var(--viz-3)",
  v4: "var(--viz-4)",
  good: "var(--color-status-normal)",
  warn: "var(--color-status-warning)",
  bad: "var(--color-status-alarm)",
} as const;

// ── diagrams ──────────────────────────────────────────────────────

/** Arrowhead markers for a diagram; returns the marker url for a tone. */
export function useArrows() {
  const id = useId().replace(/:/g, "");
  const defs = (
    <defs>
      {(["ink", "muted", "accent", "bad", "v1", "v2", "v3"] as const).map((k) => (
        <marker key={k} id={`${id}-${k}`} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
          <path d="M0 0 L10 5 L0 10 z" style={{ fill: C[k === "ink" ? "ink2" : k] }} />
        </marker>
      ))}
    </defs>
  );
  return { defs, url: (k: "ink" | "muted" | "accent" | "bad" | "v1" | "v2" | "v3" = "ink") => `url(#${id}-${k})` };
}
