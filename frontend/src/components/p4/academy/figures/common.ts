/**
 * Helpers shared by the figures: the real week's time axis, language switch, and
 * the areas between two series (imbalance shading).
 */

import { DATA } from "../course/facts";
import type { Lang } from "../course/types";

export const tt = (lang: Lang) => (en: string, tr: string) => (lang === "tr" ? tr : en);

export const CAP = DATA.meta.capacity_mw;
export const WEEK = DATA.week;
export const WEEK_N = WEEK.time_utc.length;
export const WEEK_X = WEEK.time_utc.map((_, i) => i);

const DAYS: Record<Lang, string[]> = {
  en: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
  tr: ["Paz", "Pzt", "Sal", "Çar", "Per", "Cum", "Cmt"],
};
const MONTHS: Record<Lang, string[]> = {
  en: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
  tr: ["Oca", "Şub", "Mar", "Nis", "May", "Haz", "Tem", "Ağu", "Eyl", "Eki", "Kas", "Ara"],
};

export const utc = (iso: string) => new Date(iso.endsWith("Z") ? iso : `${iso}Z`);

/** Week index → "Fri 28 Aug 14:00 UTC". */
export function weekLabel(i: number, lang: Lang): string {
  const d = utc(WEEK.time_utc[Math.round(i)] ?? WEEK.time_utc[0]);
  return `${DAYS[lang][d.getUTCDay()]} ${d.getUTCDate()} ${MONTHS[lang][d.getUTCMonth()]} ${String(d.getUTCHours()).padStart(2, "0")}:00 UTC`;
}

/** Indices of midnight UTC in the week (day ticks) and their labels. */
export function weekTicks(lang: Lang): { ticks: number[]; format: (i: number) => string } {
  const ticks = WEEK.time_utc.map((s, i) => [utc(s).getUTCHours(), i] as const).filter(([h]) => h === 0).map(([, i]) => i);
  return {
    ticks,
    format: (i) => {
      const d = utc(WEEK.time_utc[i]);
      return `${DAYS[lang][d.getUTCDay()]} ${d.getUTCDate()}`;
    },
  };
}

export const num = (v: number | null | undefined): v is number => v !== null && v !== undefined && Number.isFinite(v);

/** Polygons between series a and b over x, split where they cross; sign = +1 where a > b. */
export function between(xs: number[], a: (number | null)[], b: (number | null)[]): { sign: 1 | -1; pts: [number, number][] }[] {
  const out: { sign: 1 | -1; pts: [number, number][] }[] = [];
  let cur: { sign: 1 | -1; top: [number, number][]; bot: [number, number][] } | null = null;
  const close = () => {
    if (cur && cur.top.length > 1) out.push({ sign: cur.sign, pts: [...cur.top, ...cur.bot.reverse()] });
    cur = null;
  };
  for (let i = 0; i < xs.length; i++) {
    const ai = a[i];
    const bi = b[i];
    if (!num(ai) || !num(bi)) {
      close();
      continue;
    }
    const s: 1 | -1 = ai >= bi ? 1 : -1;
    if (cur && cur.sign !== s) {
      // crossing between i−1 and i: interpolate the meeting point
      const a0 = a[i - 1] as number;
      const b0 = b[i - 1] as number;
      const f = (a0 - b0) / (a0 - b0 - (ai - bi));
      const xc = xs[i - 1] + f * (xs[i] - xs[i - 1]);
      const yc = a0 + f * (ai - a0);
      cur.top.push([xc, yc]);
      cur.bot.push([xc, yc]);
      close();
      cur = { sign: s, top: [[xc, yc]], bot: [[xc, yc]] };
    }
    if (!cur) cur = { sign: s, top: [], bot: [] };
    cur.top.push([xs[i], ai]);
    cur.bot.push([xs[i], bi]);
  }
  close();
  return out;
}

/** Deterministic PRNG (mulberry32): the same "random" data on every render. */
export function rng(seed: number) {
  let t = seed >>> 0;
  return () => {
    t = (t + 0x6d2b79f5) >>> 0;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

/** Standard normal draw from a uniform PRNG (Box–Muller). */
export const gauss = (r: () => number) => Math.sqrt(-2 * Math.log(Math.max(r(), 1e-12))) * Math.cos(2 * Math.PI * r());

// ── feature names ─────────────────────────────────────────────────

const MODEL: Record<string, string> = { ecmwf: "ECMWF", icon: "ICON" };
const SITE: Record<string, string> = { kf: "Kriegers Flak", rs: "Rødsand" };
const OTHER: Record<string, { en: string; tr: string }> = {
  hour_sin: { en: "hour of day (sin)", tr: "günün saati (sin)" },
  hour_cos: { en: "hour of day (cos)", tr: "günün saati (cos)" },
  nwp_spread_ms: { en: "spread of the 4 winds", tr: "4 rüzgârın yayılımı" },
};

/** "icon_rs_wd_sin" → "ICON direction, Rødsand (sin)"; "ecmwf_kf_ws" → "ECMWF wind, Kriegers Flak". */
export function featureLabel(f: string, lang: Lang): string {
  if (OTHER[f]) return OTHER[f][lang];
  const m = /^(ecmwf|icon)_(kf|rs)_(ws|wd_sin|wd_cos)$/.exec(f);
  if (!m) return f.replace(/_/g, " ");
  const kind = m[3] === "ws" ? (lang === "tr" ? "rüzgârı" : "wind") : lang === "tr" ? "yönü" : "direction";
  const trig = m[3] === "ws" ? "" : ` (${m[3].slice(3)})`;
  return `${MODEL[m[1]]} ${kind}, ${SITE[m[2]]}${trig}`;
}
