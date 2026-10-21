/**
 * Figures of Part II — learning from data (chapters 4–7).
 *
 *   FeatureTable      four real rows of the feature table and the target
 *   BiasVariance      a regression tree of growing depth on noisy power-curve data:
 *                     the fit and the train / test error (under- vs over-fitting)
 *   LossShapes        squared, absolute and pinball loss against the error
 *   DescentContour    gradient descent and Adam on a 2-D loss surface (contours)
 *   LearningCurve     a small neural network trained in the browser; early stopping
 *   Autocorrelation   ACF of the measured output and of the XGBoost error (real data)
 *   FoldTimeline      the five TimeSeriesSplit folds with dates and scores (real data)
 *   ShuffleVsTime     shuffled K-fold vs TimeSeriesSplit on the same rows (real data)
 *   InfoTimeline      what is known at the 12:00 D−1 bid (diagram)
 *   LeakExperiment    a deliberately leaky feature on the same rows (real data)
 */

import { useEffect, useMemo, useRef, useState } from "react";
import { Pause, Play, RotateCcw } from "lucide-react";

import { turbinePowerMW } from "../../../../utils/landingPhysics";
import { fitTree, predictTree } from "../boosting";
import { C, linear, useArrows, useFrame, useReducedMotion, useWidth } from "../charts/core";
import { Controls, HBars, Range, Segmented, Stat, Wide, XYChart, type Series } from "../charts/kit";
import { DATA, formatNumber } from "../course/facts";
import type { Lang } from "../course/types";
import { CAP, gauss, rng, tt, utc } from "./common";

// ── 4.1 Feature table ───────────────────────────────────────────────

export function FeatureTable({ lang }: { lang: Lang }) {
  const t = tt(lang);
  const names = DATA.feature_names;
  const col = (n: string) => names.indexOf(n);
  const deg = (s: number, c: number) => ((Math.atan2(s, c) * 180) / Math.PI + 360) % 360;
  const f1 = (v: number) => formatNumber(v, 1, lang);
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[640px] text-[12.5px]">
        <thead>
          <tr className="border-b-2 border-text-muted/50 text-left text-text-primary">
            <th className="py-1.5 pr-2 font-semibold">{t("hour t (UTC)", "saat t (UTC)")}</th>
            <th className="px-2 font-semibold" translate="no">ecmwf_kf_ws</th>
            <th className="px-2 font-semibold" translate="no">icon_kf_ws</th>
            <th className="px-2 font-semibold" translate="no">ecmwf_rs_ws</th>
            <th className="px-2 font-semibold" translate="no">icon_rs_ws</th>
            <th className="px-2 font-semibold">{t("dir. (KF, ICON)", "yön (KF, ICON)")}</th>
            <th className="px-2 font-semibold" translate="no">hour</th>
            <th className="px-2 font-semibold" translate="no">nwp_spread</th>
            <th className="border-l border-border-secondary px-2 font-semibold">{t("target P(t)", "hedef P(t)")}</th>
            <th className="px-2 font-semibold">{t("XGBoost P50", "XGBoost P50")}</th>
          </tr>
          <tr className="border-b border-border-primary text-left text-[11px] text-text-muted">
            <th className="py-1 pr-2 font-normal" />
            <th className="px-2 font-normal">m/s</th>
            <th className="px-2 font-normal">m/s</th>
            <th className="px-2 font-normal">m/s</th>
            <th className="px-2 font-normal">m/s</th>
            <th className="px-2 font-normal">° (sin, cos)</th>
            <th className="px-2 font-normal">sin, cos</th>
            <th className="px-2 font-normal">m/s</th>
            <th className="border-l border-border-secondary px-2 font-normal">MW</th>
            <th className="px-2 font-normal">MW</th>
          </tr>
        </thead>
        <tbody className="font-mono tabular-nums text-text-secondary">
          {DATA.rows.map((r) => {
            const d = utc(r.time_utc);
            return (
              <tr key={r.time_utc} className="border-b border-border-primary last:border-0">
                <td className="py-1.5 pr-2 font-sans text-text-primary">
                  {d.getUTCDate()}.{String(d.getUTCMonth() + 1).padStart(2, "0")} {String(d.getUTCHours()).padStart(2, "0")}:00
                </td>
                <td className="px-2">{f1(r.x[col("ecmwf_kf_ws")])}</td>
                <td className="px-2">{f1(r.x[col("icon_kf_ws")])}</td>
                <td className="px-2">{f1(r.x[col("ecmwf_rs_ws")])}</td>
                <td className="px-2">{f1(r.x[col("icon_rs_ws")])}</td>
                <td className="px-2">{formatNumber(deg(r.x[col("icon_kf_wd_sin")], r.x[col("icon_kf_wd_cos")]), 0, lang)}°</td>
                <td className="px-2">
                  {formatNumber(r.x[col("hour_sin")], 2, lang)}, {formatNumber(r.x[col("hour_cos")], 2, lang)}
                </td>
                <td className="px-2">{f1(r.x[col("nwp_spread_ms")])}</td>
                <td className="border-l border-border-secondary px-2 font-semibold text-text-primary">{f1(r.target_mw)}</td>
                <td className="px-2">{f1(r.xgb_p50_mw)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <p className="mt-2 text-xs text-text-muted">
        {t(
          `${names.length} input columns in all: wind speed per model and farm (4), direction as sine and cosine (8), hour of day as sine and cosine (2), and the largest minus smallest of the four winds (1).`,
          `Toplam ${names.length} girdi sütunu: model ve santral başına rüzgâr hızı (4), sinüs ve kosinüs olarak yön (8), sinüs ve kosinüs olarak günün saati (2) ve dört rüzgârın en büyüğü eksi en küçüğü (1).`,
        )}
      </p>
    </div>
  );
}

// ── 4.2 Bias–variance with tree depth ───────────────────────────────

const farm = (u: number) => turbinePowerMW(u) / 15; // normalised 0…1
function noisy(n: number, seed: number) {
  const r = rng(seed);
  return Array.from({ length: n }, () => {
    const u = r() * 22;
    return { u, p: Math.min(1.05, Math.max(-0.05, farm(u) + 0.09 * gauss(r))) };
  });
}
const BV_TRAIN = noisy(40, 31);
const BV_TEST = noisy(400, 77);

export function BiasVariance({ lang }: { lang: Lang }) {
  const t = tt(lang);
  const [depth, setDepth] = useState(3);
  const curves = useMemo(() => {
    const mean = BV_TRAIN.reduce((s, x) => s + x.p, 0) / BV_TRAIN.length;
    return Array.from({ length: 9 }, (_, d) => {
      // a tree on the residuals from the mean, leaves down to one sample: free to over-fit
      const tree = fitTree(
        BV_TRAIN.map((x) => x.u),
        BV_TRAIN.map((x) => x.p - mean),
        d,
        1,
      );
      const f = (u: number) => mean + predictTree(tree, u);
      const err = (set: typeof BV_TRAIN) => set.reduce((s, x) => s + (f(x.u) - x.p) ** 2, 0) / set.length;
      return { d, f, train: err(BV_TRAIN), test: err(BV_TEST) };
    });
  }, []);
  const cur = curves[depth];
  const grid = Array.from({ length: 221 }, (_, i) => i * 0.1);
  const best = curves.reduce((b, c) => (c.test < b.test ? c : b));
  return (
    <div>
      <Controls>
        <Range label={t("tree depth", "ağaç derinliği")} value={depth} min={0} max={8} step={1} onChange={setDepth} format={(v) => `${v} → ${2 ** v} ${t("leaves", "yaprak")}`} width="w-40" />
        <span className="text-xs text-text-muted">
          {depth < best.d ? t("under-fitting: too simple, high bias", "eksik öğrenme: çok basit, yüksek yanlılık") : depth > best.d ? t("over-fitting: memorises noise, high variance", "aşırı öğrenme: gürültüyü ezberler, yüksek varyans") : t("best depth on unseen data", "görülmemiş veride en iyi derinlik")}
        </span>
      </Controls>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-[3fr_2fr]">
        <XYChart
          ariaLabel={t("Tree fit to noisy power-curve samples", "Gürültülü güç eğrisi örneklerine ağaç uyumu")}
          height={270}
          x={{ domain: [0, 22], title: t("wind [m/s]", "rüzgâr [m/s]") }}
          y={{ domain: [-0.1, 1.15], ticks: [0, 0.25, 0.5, 0.75, 1], title: t("power [p.u.]", "güç [p.u.]") }}
          series={[
            { kind: "scatter", id: "tr", label: t("40 training samples", "40 eğitim örneği"), color: C.ink2, points: BV_TRAIN.map((x) => [x.u, x.p]), r: 3, opacity: 0.75 },
            { kind: "line", id: "true", label: t("true curve", "gerçek eğri"), color: C.muted, points: grid.map((u) => [u, farm(u)]), dash: true, hover: false },
            { kind: "line", id: "fit", label: t("tree prediction", "ağaç tahmini"), color: C.v2, points: grid.map((u) => [u, cur.f(u)]), width: 2.5, hover: false },
          ]}
        />
        <XYChart
          ariaLabel={t("Training and test error against tree depth", "Ağaç derinliğine göre eğitim ve test hatası")}
          height={270}
          x={{ domain: [0, 8], ticks: [0, 1, 2, 3, 4, 5, 6, 7, 8], title: t("depth", "derinlik") }}
          // depth 0 (the mean) is far above the rest: keep the U of depths 1–8 readable
          y={{ domain: [0, Math.max(...curves.slice(1).map((c) => c.test)) * 1.45], title: "MSE [p.u.²]", format: (v) => v.toFixed(3) }}
          series={[
            { kind: "line", id: "tr", label: t("training error", "eğitim hatası"), color: C.v1, points: curves.map((c) => [c.d, c.train]), decimals: 3 },
            { kind: "line", id: "te", label: t("unseen test error", "görülmemiş test hatası"), color: C.v2, points: curves.map((c) => [c.d, c.test]), dash: true, decimals: 3 },
          ]}
          hoverLabel={(d) => `${t("depth", "derinlik")} ${d}`}
          over={({ sx, m, h }) => (
            <g>
              <line x1={sx(depth)} x2={sx(depth)} y1={m.t} y2={h - m.b} style={{ stroke: C.accent }} strokeWidth={2} />
              <text x={sx(0) + 6} y={m.t + 10} fontSize={10.5} style={{ fill: C.muted }}>
                {t(`depth 0: ${curves[0].test.toFixed(2)} ↑`, `derinlik 0: ${curves[0].test.toFixed(2)} ↑`)}
              </text>
            </g>
          )}
        />
      </div>
    </div>
  );
}

// ── 5.1 Loss shapes ─────────────────────────────────────────────────

export function LossShapes({ lang }: { lang: Lang }) {
  const t = tt(lang);
  const e = Array.from({ length: 121 }, (_, i) => -3 + i * 0.05);
  const pin = (x: number, tau: number) => Math.max(tau * x, (tau - 1) * x);
  return (
    <XYChart
      ariaLabel={t("Loss functions against the error", "Hataya göre kayıp fonksiyonları")}
      height={280}
      x={{ domain: [-3, 3], title: t("error e = y − ŷ", "hata e = y − ŷ") }}
      y={{ domain: [0, 4.5], title: t("loss", "kayıp") }}
      series={[
        { kind: "line", id: "sq", label: t("squared  e²  (MSE)", "kare  e²  (MSE)"), color: C.v1, points: e.map((x) => [x, x * x]), decimals: 2 },
        { kind: "line", id: "ab", label: t("absolute  |e|  (MAE)", "mutlak  |e|  (MAE)"), color: C.v2, points: e.map((x) => [x, Math.abs(x)]), decimals: 2 },
        { kind: "line", id: "p9", label: t("pinball τ = 0.9", "pinball τ = 0,9"), color: C.v3, points: e.map((x) => [x, pin(x, 0.9)]), decimals: 2 },
        { kind: "line", id: "p1", label: t("pinball τ = 0.1", "pinball τ = 0,1"), color: C.v4, points: e.map((x) => [x, pin(x, 0.1)]), dash: true, decimals: 2 },
      ]}
      hoverLabel={(x) => `e = ${formatNumber(x, 2, lang)}`}
    />
  );
}

// ── 5.2 Gradient descent on contours ────────────────────────────────

const Lf = (x: number, y: number) => 0.35 * x * x + 1.4 * y * y + 0.6 * Math.sin(1.3 * x) * Math.cos(1.1 * y);
const gradL = (x: number, y: number): [number, number] => [
  0.7 * x + 0.78 * Math.cos(1.3 * x) * Math.cos(1.1 * y),
  2.8 * y - 0.66 * Math.sin(1.3 * x) * Math.sin(1.1 * y),
];
const START: [number, number] = [-2.6, 2.1];
const STEPS = 60;

function runOptimizer(kind: "gd" | "adam", eta: number): [number, number][] {
  const pts: [number, number][] = [START];
  let [x, y] = START;
  let m = [0, 0];
  let v = [0, 0];
  for (let k = 1; k <= STEPS; k++) {
    const g = gradL(x, y);
    if (kind === "gd") {
      x -= eta * g[0];
      y -= eta * g[1];
    } else {
      m = m.map((mi, i) => 0.9 * mi + 0.1 * g[i]);
      v = v.map((vi, i) => 0.999 * vi + 0.001 * g[i] * g[i]);
      const step = m.map((mi, i) => (eta * (mi / (1 - 0.9 ** k))) / (Math.sqrt(v[i] / (1 - 0.999 ** k)) + 1e-8));
      x -= step[0];
      y -= step[1];
    }
    if (!Number.isFinite(x) || Math.abs(x) > 40 || Math.abs(y) > 40) break;
    pts.push([x, y]);
  }
  return pts;
}

/** Iso-lines of f on [−R, R]² by marching squares; returns SVG path data per level. */
function contours(f: (x: number, y: number) => number, R: number, n: number, levels: number[], sx: (v: number) => number, sy: (v: number) => number) {
  const h = (2 * R) / n;
  const val: number[][] = [];
  for (let i = 0; i <= n; i++) {
    val.push([]);
    for (let j = 0; j <= n; j++) val[i].push(f(-R + j * h, -R + i * h));
  }
  return levels.map((lv) => {
    let d = "";
    for (let i = 0; i < n; i++)
      for (let j = 0; j < n; j++) {
        const a = val[i][j];
        const b = val[i][j + 1];
        const c = val[i + 1][j + 1];
        const e = val[i + 1][j];
        const x0 = -R + j * h;
        const y0 = -R + i * h;
        const pts: [number, number][] = [];
        const edge = (p: number, q: number, xa: number, ya: number, xb: number, yb: number) => {
          if ((p < lv) !== (q < lv)) {
            const k = (lv - p) / (q - p);
            pts.push([xa + k * (xb - xa), ya + k * (yb - ya)]);
          }
        };
        edge(a, b, x0, y0, x0 + h, y0);
        edge(b, c, x0 + h, y0, x0 + h, y0 + h);
        edge(c, e, x0 + h, y0 + h, x0, y0 + h);
        edge(e, a, x0, y0 + h, x0, y0);
        for (let k = 0; k + 1 < pts.length; k += 2) d += `M${sx(pts[k][0]).toFixed(1)},${sy(pts[k][1]).toFixed(1)}L${sx(pts[k + 1][0]).toFixed(1)},${sy(pts[k + 1][1]).toFixed(1)}`;
      }
    return { lv, d };
  });
}

export function DescentContour({ lang }: { lang: Lang }) {
  const t = tt(lang);
  const [opt, setOpt] = useState<"gd" | "adam">("gd");
  const [eta, setEta] = useState(0.2);
  const [k, setK] = useState(0);
  const [playing, setPlaying] = useState(true);
  const reduced = useReducedMotion();
  const path = useMemo(() => runOptimizer(opt, eta), [opt, eta]);
  const [ref, width] = useWidth<HTMLDivElement>();
  const size = Math.min(width, 440);
  const R = 3;
  const sx = useMemo(() => linear([-R, R], [28, size - 8]), [size]);
  const sy = useMemo(() => linear([-R, R], [size - 28, 8]), [size]);
  const lines = useMemo(() => contours(Lf, R, 70, [-0.2, 0.1, 0.5, 1, 1.7, 2.6, 3.8, 5.3, 7.2, 9.5, 12.5], sx, sy), [sx, sy]);
  // one update every 0.12 s while playing
  const acc = useRef(0);
  useFrame(playing && !reduced && k < path.length - 1, (dt) => {
    acc.current += dt;
    if (acc.current < 0.12) return;
    acc.current = 0;
    setK((v) => Math.min(path.length - 1, v + 1));
  });
  useEffect(() => {
    setK(reduced ? path.length - 1 : 0);
    setPlaying(true);
  }, [path, reduced]);
  const shown = path.slice(0, k + 1);
  const clampP = (v: number) => Math.max(-R - 0.3, Math.min(R + 0.3, v));
  const diverged = path.length < STEPS + 1;
  const presets =
    opt === "gd"
      ? [
          { v: 0.05, label: t("0.05 · too small", "0,05 · çok küçük") },
          { v: 0.2, label: t("0.2 · good", "0,2 · iyi") },
          { v: 0.5, label: t("0.5 · zig-zag", "0,5 · zikzak") },
          { v: 0.75, label: t("0.75 · diverges", "0,75 · ıraksar") },
        ]
      : [
          { v: 0.05, label: "0.05" },
          { v: 0.15, label: "0.15" },
          { v: 0.4, label: "0.4" },
        ];
  return (
    <div>
      <Controls>
        <Segmented
          label={t("Optimiser", "Optimize edici")}
          value={opt}
          onChange={(v) => {
            setOpt(v);
            setEta(v === "gd" ? 0.2 : 0.15);
          }}
          options={[
            { v: "gd", label: t("Gradient descent", "Gradyan inişi") },
            { v: "adam", label: "Adam" },
          ]}
        />
        <Segmented label={t("Learning rate η", "Öğrenme oranı η")} value={eta} onChange={setEta} options={presets} />
        <button
          type="button"
          onClick={() => (k >= path.length - 1 ? (setK(0), setPlaying(true)) : setPlaying(!playing))}
          className="flex items-center gap-1 rounded-md border border-border-secondary px-2 py-1 text-xs font-semibold text-text-secondary hover:bg-bg-hover"
        >
          {playing && k < path.length - 1 ? <Pause size={12} /> : k >= path.length - 1 ? <RotateCcw size={12} /> : <Play size={12} />}
          {playing && k < path.length - 1 ? t("Pause", "Duraklat") : k >= path.length - 1 ? t("Replay", "Tekrar") : t("Play", "Oynat")}
        </button>
      </Controls>
      <div className="grid grid-cols-1 items-start gap-4 md:grid-cols-2">
        <div ref={ref} className="w-full min-w-0">
          <svg width={size} height={size} role="img" aria-label={t("Loss contours and the optimiser path", "Kayıp eşyükselti eğrileri ve optimize edici yolu")} className="block">
            <rect x={28} y={8} width={size - 36} height={size - 36} rx={4} style={{ fill: C.panel }} />
            {lines.map(({ lv, d }, i) => (
              <path key={lv} d={d} fill="none" style={{ stroke: C.v1 }} strokeOpacity={0.85 - i * 0.065} strokeWidth={1.1} />
            ))}
            <path
              d={shown.map(([x, y], i) => `${i ? "L" : "M"}${sx(clampP(x)).toFixed(1)},${sy(clampP(y)).toFixed(1)}`).join("")}
              fill="none"
              style={{ stroke: C.v2 }}
              strokeWidth={2}
              strokeLinejoin="round"
            />
            {shown.map(([x, y], i) => (
              <circle key={i} cx={sx(clampP(x))} cy={sy(clampP(y))} r={i === shown.length - 1 ? 5.5 : 2.4} style={{ fill: C.v2, stroke: C.surface }} strokeWidth={i === shown.length - 1 ? 2 : 0.8} />
            ))}
            <text x={sx(START[0]) + 8} y={sy(START[1]) - 6} fontSize={11} style={{ fill: C.ink2 }}>
              {t("start", "başlangıç")}
            </text>
            {[-3, -2, -1, 0, 1, 2, 3].map((v) => (
              <g key={v}>
                <text x={sx(v)} y={size - 12} textAnchor="middle" fontSize={10.5} style={{ fill: C.muted }}>
                  {v}
                </text>
                <text x={20} y={sy(v) + 4} textAnchor="end" fontSize={10.5} style={{ fill: C.muted }}>
                  {v}
                </text>
              </g>
            ))}
            <text x={size - 8} y={size - 1} textAnchor="end" fontSize={11} style={{ fill: C.ink2 }}>
              w₁
            </text>
            <text x={34} y={22} fontSize={11} style={{ fill: C.ink2 }}>
              w₂
            </text>
          </svg>
        </div>
        <div>
          <XYChart
            ariaLabel={t("Loss after each update", "Her güncellemeden sonraki kayıp")}
            height={250}
            legend={false}
            x={{ domain: [0, STEPS], title: t("update k", "güncelleme k") }}
            y={{ domain: [-0.5, 12], title: "L(w)" }}
            series={[{ kind: "line", id: "l", label: "L", color: C.v2, points: path.map(([x, y], i) => [i, i <= k ? Math.min(12, Lf(x, y)) : null]), decimals: 3 }]}
            hoverLabel={(i) => `k = ${i}`}
          />
          <div className="mt-2 grid grid-cols-2 gap-2">
            <Stat label={t("update", "güncelleme")} value={`${k} / ${path.length - 1}`} />
            <Stat
              label="L(w)"
              value={formatNumber(Lf(path[k][0], path[k][1]), 3, lang)}
              sub={diverged && k >= path.length - 1 ? t("diverged — η too large", "ıraksadı — η çok büyük") : undefined}
              tone={diverged && k >= path.length - 1 ? "bad" : undefined}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

// ── 5.3 Learning curve with early stopping ──────────────────────────

interface Epoch {
  e: number;
  train: number;
  val: number;
}

/** 1-48-1 tanh network, Adam, full batch, on 20 noisy samples of a farm-like curve. */
function trainMLP(): Epoch[] {
  const curve = (u: number) => (u < 3 ? 0 : 1 / (1 + Math.exp(-(u - 8) / 1.3)));
  const sample = (n: number, seed: number) => {
    const r = rng(seed);
    return Array.from({ length: n }, () => {
      const u = r() * 20;
      return [u / 20, curve(u) + 0.15 * gauss(r)] as const;
    });
  };
  const tr = sample(20, 3);
  const va = sample(300, 10);
  const H = 48;
  const r = rng(4);
  const P = {
    W1: Array.from({ length: H }, () => gauss(r) * 3),
    b1: Array.from({ length: H }, () => gauss(r) * 1.5),
    W2: Array.from({ length: H }, () => gauss(r) * 0.3),
  };
  let b2 = 0;
  const mom = { W1: new Array(H).fill(0), b1: new Array(H).fill(0), W2: new Array(H).fill(0) };
  const vel = { W1: new Array(H).fill(0), b1: new Array(H).fill(0), W2: new Array(H).fill(0) };
  let mb = 0;
  let vb = 0;
  const lr = 0.03;
  const pred = (x: number) => {
    let y = b2;
    for (let j = 0; j < H; j++) y += P.W2[j] * Math.tanh(P.W1[j] * x + P.b1[j]);
    return y;
  };
  const mse = (d: readonly (readonly [number, number])[]) => d.reduce((s, [x, y]) => s + (pred(x) - y) ** 2, 0) / d.length;
  const out: Epoch[] = [{ e: 0, train: mse(tr), val: mse(va) }];
  for (let e = 1; e <= 2400; e++) {
    const g = { W1: new Array(H).fill(0), b1: new Array(H).fill(0), W2: new Array(H).fill(0) };
    let gb = 0;
    for (const [x, y] of tr) {
      const hdn = P.W1.map((w, j) => Math.tanh(w * x + P.b1[j]));
      let yh = b2;
      for (let j = 0; j < H; j++) yh += P.W2[j] * hdn[j];
      const d = (2 * (yh - y)) / tr.length;
      gb += d;
      for (let j = 0; j < H; j++) {
        g.W2[j] += d * hdn[j];
        const dh = d * P.W2[j] * (1 - hdn[j] * hdn[j]);
        g.W1[j] += dh * x;
        g.b1[j] += dh;
      }
    }
    for (const key of ["W1", "b1", "W2"] as const)
      for (let j = 0; j < H; j++) {
        mom[key][j] = 0.9 * mom[key][j] + 0.1 * g[key][j];
        vel[key][j] = 0.999 * vel[key][j] + 0.001 * g[key][j] ** 2;
        P[key][j] -= (lr * (mom[key][j] / (1 - 0.9 ** e))) / (Math.sqrt(vel[key][j] / (1 - 0.999 ** e)) + 1e-8);
      }
    mb = 0.9 * mb + 0.1 * gb;
    vb = 0.999 * vb + 0.001 * gb * gb;
    b2 -= (lr * (mb / (1 - 0.9 ** e))) / (Math.sqrt(vb / (1 - 0.999 ** e)) + 1e-8);
    if (e % 10 === 0) out.push({ e, train: mse(tr), val: mse(va) });
  }
  return out;
}

export function LearningCurve({ lang }: { lang: Lang }) {
  const t = tt(lang);
  const [hist, setHist] = useState<Epoch[] | null>(null);
  const [shown, setShown] = useState(0);
  const [patience, setPatience] = useState(30); // in records of 10 epochs
  const reduced = useReducedMotion();
  // train after the first paint, so opening the chapter stays instant
  useEffect(() => {
    const id = setTimeout(() => setHist(trainMLP()), 30);
    return () => clearTimeout(id);
  }, []);
  useEffect(() => {
    if (hist && reduced) setShown(hist.length);
  }, [hist, reduced]);
  useFrame(!!hist && !reduced && shown < (hist?.length ?? 0), () => setShown((s) => Math.min(hist!.length, s + 2)));
  if (!hist) return <div className="h-[300px] animate-pulse rounded-md bg-bg-tertiary" />;
  // early stopping: best validation record, stop after `patience` records without improvement
  let best = 0;
  let stop = hist.length - 1;
  for (let i = 1; i < hist.length; i++) {
    if (hist[i].val < hist[best].val) best = i;
    else if (i - best >= patience) {
      stop = i;
      break;
    }
  }
  const vis = hist.slice(0, Math.max(1, shown));
  const ymax = Math.max(0.12, ...hist.slice(3).map((h) => h.val)) * 1.1;
  return (
    <div>
      <Controls>
        <Range label={t("patience", "sabır")} value={patience} min={5} max={80} step={5} onChange={setPatience} format={(v) => `${v * 10} ${t("epochs", "epoch")}`} />
        <button
          type="button"
          onClick={() => setShown(0)}
          className="flex items-center gap-1 rounded-md border border-border-secondary px-2 py-1 text-xs font-semibold text-text-secondary hover:bg-bg-hover"
        >
          <RotateCcw size={12} /> {t("Replay training", "Eğitimi tekrar oynat")}
        </button>
      </Controls>
      <XYChart
        ariaLabel={t("Training and validation loss over epochs", "Epoch'lara göre eğitim ve doğrulama kaybı")}
        height={290}
        x={{ domain: [0, 2400], title: "epoch" }}
        y={{ domain: [0, ymax], title: "MSE [p.u.²]", format: (v) => v.toFixed(2) }}
        series={[
          { kind: "line", id: "tr", label: t("training loss (20 samples)", "eğitim kaybı (20 örnek)"), color: C.v1, points: vis.map((h) => [h.e, h.train]), decimals: 4 },
          { kind: "line", id: "va", label: t("validation loss (300 unseen)", "doğrulama kaybı (300 görülmemiş)"), color: C.v2, points: vis.map((h) => [h.e, h.val]), decimals: 4 },
        ]}
        hoverLabel={(e) => `epoch ${e}`}
        over={({ sx, sy, m, h }) =>
          shown > best ? (
            <g>
              <line x1={sx(hist[best].e)} x2={sx(hist[best].e)} y1={m.t} y2={h - m.b} style={{ stroke: C.good }} strokeWidth={1.5} />
              <circle cx={sx(hist[best].e)} cy={sy(hist[best].val)} r={5} style={{ fill: C.good, stroke: C.surface }} strokeWidth={2} />
              <text x={sx(hist[best].e) + 6} y={m.t + 12} fontSize={11} fontWeight={600} style={{ fill: C.ink }}>
                {t(`best weights: epoch ${hist[best].e}`, `en iyi ağırlıklar: epoch ${hist[best].e}`)}
              </text>
              {shown > stop && (
                <>
                  <line x1={sx(hist[stop].e)} x2={sx(hist[stop].e)} y1={m.t} y2={h - m.b} style={{ stroke: C.bad }} strokeWidth={1.5} strokeDasharray="4 3" />
                  <text x={sx(hist[stop].e) + 6} y={m.t + 28} fontSize={11} fontWeight={600} style={{ fill: C.ink }}>
                    {t(`stop: epoch ${hist[stop].e}`, `dur: epoch ${hist[stop].e}`)}
                  </text>
                  <rect x={sx(hist[stop].e)} y={m.t} width={Math.max(0, sx(2400) - sx(hist[stop].e))} height={h - m.t - m.b} style={{ fill: C.ink }} opacity={0.04} />
                </>
              )}
            </g>
          ) : null
        }
      />
    </div>
  );
}

// ── 6.1 Autocorrelation ─────────────────────────────────────────────

export function Autocorrelation({ lang }: { lang: Lang }) {
  const t = tt(lang);
  const lags = DATA.acf.power.map((_, k) => k);
  const series: Series[] = [
    { kind: "bars", id: "p", label: t("measured output P(t)", "ölçülmüş üretim P(t)"), color: C.v1, points: lags.map((k) => [k, DATA.acf.power[k]]), width: 2 },
    // invisible twin of the bars, so the crosshair reads both values
    { kind: "line", id: "pl", label: t("output", "üretim"), color: C.v1, points: lags.map((k) => [k, DATA.acf.power[k]]), legend: false, width: 0, decimals: 3 },
    { kind: "line", id: "e", label: t("XGBoost error ε(t)", "XGBoost hatası ε(t)"), color: C.v2, points: lags.map((k) => [k, DATA.acf.xgb_error[k]]), decimals: 3 },
  ];
  return (
    <XYChart
      ariaLabel={t("Autocorrelation of the output and of the forecast error", "Üretimin ve tahmin hatasının otokorelasyonu")}
      height={290}
      x={{ domain: [0, 168], ticks: [0, 24, 48, 72, 96, 120, 144, 168], title: t("lag k [h]", "gecikme k [sa]") }}
      y={{ domain: [-0.1, 1], ticks: [0, 0.25, 0.5, 0.75, 1], title: t("autocorrelation ρₖ", "otokorelasyon ρₖ") }}
      series={series}
      hoverLabel={(k) => `k = ${k} h`}
      under={({ sx, m, h }) => (
        <g>
          <rect x={sx(0)} y={m.t} width={sx(48) - sx(0)} height={h - m.t - m.b} style={{ fill: C.accent }} opacity={0.07} />
          <text x={sx(48) - 4} y={m.t + 12} textAnchor="end" fontSize={11} style={{ fill: C.ink2 }}>
            {t("48 h gap left out between train and test", "eğitim ile test arasında bırakılan 48 sa boşluk")}
          </text>
        </g>
      )}
    />
  );
}

// ── 6.2 Fold timeline ───────────────────────────────────────────────

export function FoldTimeline({ lang }: { lang: Lang }) {
  const t = tt(lang);
  const [ref, width] = useWidth<HTMLDivElement>();
  const folds = DATA.folds;
  const t0 = utc(`${DATA.meta.period[0].slice(0, 10)}T00:00Z`).getTime();
  const t1 = utc(`${DATA.meta.period[1].slice(0, 10)}T00:00Z`).getTime();
  const left = 64;
  const right = 110;
  const sx = linear([t0, t1], [left, Math.max(left + 200, width - right)]);
  const day = (s: string) => utc(`${s}T00:00Z`).getTime();
  const rowH = 30;
  const years = [2025, 2026].map((y) => Date.UTC(y, 0, 1));
  const H = 40 + folds.length * rowH + 30;
  const maxN = Math.max(...folds.map((f) => f.xgb_nrmse_pct));
  return (
    <div ref={ref}>
      <svg width={width} height={H} role="img" aria-label={t("The five time-ordered folds", "Zamana göre sıralı beş katman")} className="block">
        {years.map((y) => (
          <g key={y}>
            <line x1={sx(y)} x2={sx(y)} y1={18} y2={H - 26} style={{ stroke: C.grid }} />
            <text x={sx(y)} y={12} textAnchor="middle" fontSize={11} style={{ fill: C.muted }}>
              {new Date(y).getUTCFullYear()}
            </text>
          </g>
        ))}
        <text x={width - right + 12} y={12} fontSize={11} style={{ fill: C.ink2 }}>
          {t("test nRMSE", "test nRMSE")}
        </text>
        {folds.map((f, i) => {
          const y = 26 + i * rowH;
          return (
            <g key={i}>
              <text x={0} y={y + 14} fontSize={11.5} fontWeight={600} style={{ fill: C.ink }}>
                {t("fold", "katman")} {i + 1}
              </text>
              <rect x={sx(day(f.train_start))} y={y + 3} width={sx(day(f.train_end)) - sx(day(f.train_start))} height={16} rx={3} style={{ fill: C.v1 }} opacity={0.85}>
                <title>{`train ${f.train_start} → ${f.train_end} (${f.n_train} h)`}</title>
              </rect>
              <rect x={sx(day(f.train_end))} y={y + 3} width={Math.max(2, sx(day(f.test_start)) - sx(day(f.train_end)))} height={16} style={{ fill: C.bad }} opacity={0.7}>
                <title>48 h gap</title>
              </rect>
              <rect x={sx(day(f.test_start))} y={y + 3} width={sx(day(f.test_end)) - sx(day(f.test_start))} height={16} rx={3} style={{ fill: C.v2 }} opacity={0.9}>
                <title>{`test ${f.test_start} → ${f.test_end} (${f.n_test} h)`}</title>
              </rect>
              <rect x={width - right + 12} y={y + 5} width={(60 * f.xgb_nrmse_pct) / maxN} height={12} rx={2} style={{ fill: C.ink2 }} opacity={0.6} />
              <text x={width - right + 18 + (60 * f.xgb_nrmse_pct) / maxN} y={y + 15} fontSize={11} style={{ fill: C.ink, fontVariantNumeric: "tabular-nums" }}>
                {formatNumber(f.xgb_nrmse_pct, 1, lang)} %
              </text>
            </g>
          );
        })}
        <g transform={`translate(${left} ${H - 12})`} fontSize={11}>
          <rect width={14} height={9} y={-8} rx={2} style={{ fill: C.v1 }} />
          <text x={19} style={{ fill: C.ink2 }}>
            {t("training block (grows)", "eğitim bloğu (büyür)")}
          </text>
          <rect x={160} width={6} height={9} y={-8} style={{ fill: C.bad }} />
          <text x={171} style={{ fill: C.ink2 }}>
            {t("48 h gap", "48 sa boşluk")}
          </text>
          <rect x={250} width={14} height={9} y={-8} rx={2} style={{ fill: C.v2 }} />
          <text x={269} style={{ fill: C.ink2 }}>
            {t("test block (≈ 142 days)", "test bloğu (≈ 142 gün)")}
          </text>
        </g>
      </svg>
    </div>
  );
}

// ── 6.3 Shuffled vs time-ordered validation ─────────────────────────

export function ShuffleVsTime({ lang }: { lang: Lang }) {
  const t = tt(lang);
  const x = DATA.experiments;
  const gap = x.time_split_nrmse_pct - x.shuffled_kfold_nrmse_pct;
  return (
    <div>
      <HBars
        ariaLabel={t("Error estimated by two validation schemes", "İki doğrulama yöntemiyle tahmin edilen hata")}
        unit="%"
        max={20}
        format={(v) => formatNumber(v, 1, lang)}
        bars={[
          { label: t("TimeSeriesSplit, 48 h gap", "TimeSeriesSplit, 48 sa boşluk"), note: t("what the platform reports", "platformun raporladığı"), value: x.time_split_nrmse_pct, color: C.v1 },
          { label: t("shuffled 5-fold K-fold", "karıştırılmış 5 katlı K-fold"), note: t("neighbouring hours in train and test", "komşu saatler hem eğitimde hem testte"), value: x.shuffled_kfold_nrmse_pct, color: C.v2 },
        ]}
      />
      <p className="mt-3 text-xs text-text-muted">
        {t(
          `Same rows, same model (XGBoost P50, 400 trees, depth 5), nRMSE in % of ${formatNumber(CAP, 0, lang)} MW. Shuffling makes the error look ${formatNumber(gap, 1, lang)} points (${formatNumber((100 * gap) / x.time_split_nrmse_pct, 0, lang)} %) smaller than what a forecast of the future achieves.`,
          `Aynı satırlar, aynı model (XGBoost P50, 400 ağaç, derinlik 5), ${formatNumber(CAP, 0, lang)} MW'ın %'si olarak nRMSE. Karıştırma, hatayı geleceğin tahmininin ulaştığından ${formatNumber(gap, 1, lang)} puan (%${formatNumber((100 * gap) / x.time_split_nrmse_pct, 0, lang)}) daha küçük gösterir.`,
        )}
      </p>
    </div>
  );
}

// ── 7.1 Information available at the bid ───────────────────────────

export function InfoTimeline({ lang }: { lang: Lang }) {
  const t = tt(lang);
  const { defs, url } = useArrows();
  const W = 860;
  const x0 = 40;
  const x1 = W - 20;
  const hx = (h: number) => x0 + ((h + 12) / 60) * (x1 - x0); // −12 h … +48 h from D−1 00:00
  const gate = hx(12);
  return (
    <Wide minWidth={760}>
      <svg viewBox={`0 0 ${W} 300`} className="w-full" role="img" aria-label={t("Information available at the day-ahead bid", "Gün öncesi teklif anında mevcut bilgi")}>
        {defs}
        <rect x={x0} y={30} width={gate - x0} height={220} rx={4} style={{ fill: C.good }} opacity={0.08} />
        <rect x={gate} y={30} width={x1 - gate} height={220} rx={4} style={{ fill: C.bad }} opacity={0.06} />
        <line x1={gate} x2={gate} y1={22} y2={262} style={{ stroke: C.accent }} strokeWidth={2.5} />
        <text x={gate} y={16} textAnchor="middle" fontSize={12} fontWeight={700} style={{ fill: C.ink }}>
          {t("12:00 D−1 — bid closes", "12:00 D−1 — teklif kapanır")}
        </text>
        <text x={(x0 + gate) / 2} y={48} textAnchor="middle" fontSize={11.5} fontWeight={650} style={{ fill: C.ink2 }}>
          {t("KNOWN at the bid", "teklif anında BİLİNEN")}
        </text>
        <text x={(gate + x1) / 2} y={48} textAnchor="middle" fontSize={11.5} fontWeight={650} style={{ fill: C.ink2 }}>
          {t("NOT KNOWN at the bid", "teklif anında BİLİNMEYEN")}
        </text>
        {/* rows */}
        {(
          [
            [78, t("measured power", "ölçülmüş güç"), [-12, 11], C.v1, null],
            [118, t("measured wind (met mast, SCADA)", "ölçülmüş rüzgâr (direk, SCADA)"), [-12, 11], C.v1, null],
            [158, t("NWP run 00 UTC D−1", "NWP koşusu 00 UTC D−1"), [7, 48], C.v3, t("issued ≈ 07:00, covers D", "≈ 07:00'de yayımlanır, D'yi kapsar")],
            [198, t("the hours to forecast", "tahmin edilecek saatler"), [24, 48], C.v2, t("delivery day D", "teslimat günü D")],
          ] as const
        ).map(([y, label, [a, b], c, note]) => (
          <g key={label}>
            <text x={x0 + 6} y={y - 6} fontSize={11} style={{ fill: C.ink }}>
              {label}
            </text>
            <rect x={hx(a)} y={y} width={hx(b) - hx(a)} height={12} rx={3} style={{ fill: c }} opacity={0.85} />
            {note && (
              <text x={hx(b) - 4} y={y - 6} textAnchor="end" fontSize={10.5} style={{ fill: C.muted }}>
                {note}
              </text>
            )}
          </g>
        ))}
        {/* the leak */}
        <path d={`M ${hx(30)} 132 C ${hx(26)} 150, ${hx(24)} 175, ${hx(26)} 196`} fill="none" style={{ stroke: C.bad }} strokeWidth={1.8} strokeDasharray="5 4" markerEnd={url("bad")} />
        <rect x={hx(24)} y={118} width={hx(48) - hx(24)} height={12} rx={3} style={{ fill: C.bad }} opacity={0.18} />
        <text x={hx(30) + 6} y={132} fontSize={10.5} fontWeight={650} style={{ fill: C.bad }}>
          {t("measured wind during D = leakage", "D sırasında ölçülen rüzgâr = sızıntı")}
        </text>
        {[-12, -6, 0, 6, 12, 18, 24, 30, 36, 42, 48].map((h) => (
          <g key={h}>
            <line x1={hx(h)} x2={hx(h)} y1={262} y2={267} style={{ stroke: C.axis }} />
            <text x={hx(h)} y={281} textAnchor="middle" fontSize={10.5} style={{ fill: C.muted }}>
              {`${String(((h % 24) + 24) % 24).padStart(2, "0")}:00`}
            </text>
          </g>
        ))}
        <line x1={x0} x2={x1} y1={262} y2={262} style={{ stroke: C.axis }} />
        <text x={hx(-6)} y={296} textAnchor="middle" fontSize={10.5} style={{ fill: C.muted }}>
          D−2
        </text>
        <text x={hx(12)} y={296} textAnchor="middle" fontSize={10.5} style={{ fill: C.muted }}>
          D−1
        </text>
        <text x={hx(36)} y={296} textAnchor="middle" fontSize={10.5} style={{ fill: C.muted }}>
          D
        </text>
      </svg>
    </Wide>
  );
}

// ── 7.2 Leakage experiment ──────────────────────────────────────────

export function LeakExperiment({ lang }: { lang: Lang }) {
  const t = tt(lang);
  const x = DATA.experiments;
  const s = (n: string) => DATA.snapshot.scores.find((v) => v.name === n)?.nrmse_pct ?? NaN;
  return (
    <HBars
      ariaLabel={t("Error with and without a leaky feature", "Sızıntılı özellikle ve özelliksiz hata")}
      unit="%"
      max={40}
      format={(v) => formatNumber(v, 1, lang)}
      bars={[
        { label: t("XGBoost + measured power 1 h earlier", "XGBoost + 1 sa önce ölçülen güç"), note: t("impossible at 12:00 D−1 — leakage", "12:00 D−1'de imkânsız — sızıntı"), value: x.leaky_lag1_nrmse_pct, color: C.bad },
        { label: t("XGBoost, NWP features only", "XGBoost, yalnızca NWP özellikleri"), note: t("what a bid can really know", "bir teklifin gerçekten bilebileceği"), value: x.time_split_nrmse_pct, color: C.v1 },
        { label: t("Energinet day-ahead (TSO)", "Energinet gün öncesi (İSO)"), note: t("professional benchmark", "profesyonel karşılaştırma"), value: s("Energinet day-ahead (TSO)"), color: C.accent },
        { label: t("Persistence 24 h", "Kalıcılık 24 sa"), note: t("naive reference", "basit referans"), value: s("Persistence 24 h"), color: C.muted },
      ]}
    />
  );
}

