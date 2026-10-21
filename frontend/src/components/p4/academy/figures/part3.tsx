/**
 * Figures of Part III — the models (chapters 8–10).
 *
 *   TreeDiagram        a depth-3 regression tree fitted to noisy power-curve samples,
 *                      drawn as a flowchart next to its piecewise-constant prediction
 *   Boosting           the gradient-boosting playground (../BoostingPlayground)
 *   RnnUnrolled        the platform's LSTM unrolled over the 24-hour NWP window (diagram)
 *   LstmCell           an LSTM cell schematic whose gates run on a wind sequence
 *   GradientMemory     how far back a gradient reaches: plain RNN vs LSTM cell state
 *   AttentionGeometry  scaled dot-product attention as vector geometry, interactive
 *   TftArchitecture    the Temporal Fusion Transformer as implemented here (diagram)
 */

import { useMemo, useRef, useState, type ReactNode } from "react";
import { Pause, Play } from "lucide-react";

import BoostingPlayground from "../BoostingPlayground";
import { fitTree, makeData, powerCurve, predictTree, type TreeNode } from "../boosting";
import { C, useArrows, useFrame, useReducedMotion, useWidth } from "../charts/core";
import { Controls, Range, Stat, Wide, XYChart } from "../charts/kit";
import { formatNumber } from "../course/facts";
import type { Lang } from "../course/types";
import { tt } from "./common";

// ── 8.1 Tree diagram ────────────────────────────────────────────────

const TREE_DATA = makeData(120, 11);
interface Placed {
  node: TreeNode;
  x: number;
  y: number;
  n: number;
  depth: number;
  parent?: Placed;
  side?: "yes" | "no";
}

function placeTree(root: TreeNode, data: { u: number }[], width: number, levelH: number): Placed[] {
  const out: Placed[] = [];
  let leafIdx = 0;
  const leaves = (n: TreeNode): number => (n.leaf !== undefined ? 1 : leaves(n.left!) + leaves(n.right!));
  const total = leaves(root);
  const walk = (n: TreeNode, d: number, rows: { u: number }[], parent?: Placed, side?: "yes" | "no"): Placed => {
    const p: Placed = { node: n, x: 0, y: 24 + d * levelH, n: rows.length, depth: d, parent, side };
    out.push(p);
    if (n.leaf !== undefined) {
      p.x = ((leafIdx + 0.5) / total) * width;
      leafIdx += 1;
    } else {
      const l = walk(n.left!, d + 1, rows.filter((r) => r.u < n.split!), p, "yes");
      const r = walk(n.right!, d + 1, rows.filter((r) => r.u >= n.split!), p, "no");
      p.x = (l.x + r.x) / 2;
    }
    return p;
  };
  walk(root, 0, data);
  return out;
}

export function TreeDiagram({ lang }: { lang: Lang }) {
  const t = tt(lang);
  const tree = useMemo(
    () =>
      fitTree(
        TREE_DATA.map((d) => d.u),
        TREE_DATA.map((d) => d.p),
        3,
        5,
      ),
    [],
  );
  const W = 760;
  const placed = placeTree(tree, TREE_DATA, W, 74);
  const leaves = placed.filter((p) => p.node.leaf !== undefined).length;
  const f1 = (v: number) => formatNumber(v, 1, lang);
  const grid = Array.from({ length: 251 }, (_, i) => i / 10);
  return (
    <div className="space-y-4">
      <Wide minWidth={680}>
        <svg viewBox={`0 0 ${W} 270`} className="w-full" role="img" aria-label={t("A regression tree drawn as a flowchart", "Akış şeması olarak çizilmiş bir regresyon ağacı")}>
          {placed
            .filter((p) => p.parent)
            .map((p, i) => (
              <g key={`e${i}`}>
                <path
                  d={`M${p.parent!.x},${p.parent!.y + 18} C${p.parent!.x},${(p.parent!.y + p.y) / 2} ${p.x},${(p.parent!.y + p.y) / 2} ${p.x},${p.y - 18}`}
                  fill="none"
                  style={{ stroke: C.axis }}
                  strokeWidth={1.4}
                />
                <text x={(p.parent!.x + p.x) / 2 + (p.side === "yes" ? -6 : 6)} y={(p.parent!.y + p.y) / 2} textAnchor={p.side === "yes" ? "end" : "start"} fontSize={10} style={{ fill: C.muted }}>
                  {p.side === "yes" ? t("yes", "evet") : t("no", "hayır")}
                </text>
              </g>
            ))}
          {placed.map((p, i) =>
            p.node.leaf !== undefined ? (
              <g key={i}>
                <rect x={p.x - 40} y={p.y - 18} width={80} height={38} rx={6} style={{ fill: "color-mix(in srgb, var(--viz-2) 14%, var(--color-bg-secondary))", stroke: C.v2 }} />
                <text x={p.x} y={p.y - 1} textAnchor="middle" fontSize={12.5} fontWeight={700} style={{ fill: C.ink, fontVariantNumeric: "tabular-nums" }}>
                  {f1(p.node.leaf)} MW
                </text>
                <text x={p.x} y={p.y + 13} textAnchor="middle" fontSize={10} style={{ fill: C.muted }}>
                  n = {p.n}
                </text>
              </g>
            ) : (
              <g key={i}>
                <rect x={p.x - 58} y={p.y - 18} width={116} height={36} rx={18} style={{ fill: C.panel, stroke: C.v1 }} strokeWidth={1.4} />
                <text x={p.x} y={p.y + 4} textAnchor="middle" fontSize={12} fontWeight={650} style={{ fill: C.ink }}>
                  u &lt; {f1(p.node.split!)} m/s ?
                </text>
                <text x={p.x + 62} y={p.y - 8} fontSize={10} style={{ fill: C.muted }}>
                  n = {p.n}
                </text>
              </g>
            ),
          )}
        </svg>
      </Wide>
      <XYChart
        ariaLabel={t("The tree's piecewise-constant prediction", "Ağacın parçalı sabit tahmini")}
        height={240}
        x={{ domain: [0, 25], title: t("wind speed u [m/s]", "rüzgâr hızı u [m/s]") }}
        y={{ domain: [-1, 16.5], ticks: [0, 5, 10, 15], title: "P [MW]" }}
        series={[
          { kind: "scatter", id: "d", label: t("training samples", "eğitim örnekleri"), color: C.ink2, points: TREE_DATA.map((d) => [d.u, d.p]), r: 2.5, opacity: 0.55 },
          { kind: "line", id: "c", label: t("true curve", "gerçek eğri"), color: C.muted, points: grid.map((u) => [u, powerCurve(u)]), dash: true, hover: false },
          { kind: "line", id: "f", label: t(`tree: ${leaves} leaves = ${leaves} steps`, `ağaç: ${leaves} yaprak = ${leaves} basamak`), color: C.v2, points: grid.map((u) => [u, predictTree(tree, u)]), width: 2.5, hover: false },
        ]}
      />
    </div>
  );
}

export function Boosting({ lang }: { lang: Lang }) {
  return <BoostingPlayground lang={lang} />;
}

// ── 9.1 Unrolled network ────────────────────────────────────────────

export function RnnUnrolled({ lang }: { lang: Lang }) {
  const t = tt(lang);
  const { defs, url } = useArrows();
  const W = 860;
  const cols = [
    { x: 110, label: "t−23" },
    { x: 230, label: "t−22" },
    { x: 350, label: "t−21" },
    { x: 520, label: "t−1" },
    { x: 640, label: "t" },
  ];
  const cell = (x: number, y: number, label: string, tone: string) => (
    <g>
      <rect x={x - 42} y={y - 20} width={84} height={40} rx={6} style={{ fill: C.panel, stroke: tone }} strokeWidth={1.5} />
      <text x={x} y={y + 4} textAnchor="middle" fontSize={11.5} fontWeight={650} style={{ fill: C.ink }}>
        {label}
      </text>
    </g>
  );
  return (
    <Wide minWidth={760}>
      <svg viewBox={`0 0 ${W} 320`} className="w-full" role="img" aria-label={t("The LSTM unrolled over the 24-hour window", "24 saatlik pencere boyunca açılmış LSTM")}>
        {defs}
        <text x={8} y={276} fontSize={11} fontWeight={650} style={{ fill: C.ink2 }}>
          {t("input", "girdi")}
        </text>
        <text x={8} y={290} fontSize={10} style={{ fill: C.muted }}>
          {t("15 NWP features", "15 NWP özelliği")}
        </text>
        <text x={8} y={186} fontSize={11} fontWeight={650} style={{ fill: C.ink2 }}>
          LSTM 1
        </text>
        <text x={8} y={200} fontSize={10} style={{ fill: C.muted }}>
          {t("64 units", "64 birim")}
        </text>
        <text x={8} y={106} fontSize={11} fontWeight={650} style={{ fill: C.ink2 }}>
          LSTM 2
        </text>
        <text x={8} y={120} fontSize={10} style={{ fill: C.muted }}>
          {t("32 units", "32 birim")}
        </text>
        {cols.map((c, i) => (
          <g key={c.label}>
            <rect x={c.x - 34} y={262} width={68} height={30} rx={4} style={{ fill: C.surface, stroke: C.axis }} />
            <text x={c.x} y={281} textAnchor="middle" fontSize={11} style={{ fill: C.ink, fontFamily: "var(--font-mono)" }}>
              x({c.label})
            </text>
            <line x1={c.x} x2={c.x} y1={260} y2={214} style={{ stroke: C.ink2 }} strokeWidth={1.2} markerEnd={url("ink")} />
            {cell(c.x, 192, "LSTM", C.v1)}
            <line x1={c.x} x2={c.x} y1={170} y2={134} style={{ stroke: C.ink2 }} strokeWidth={1.2} markerEnd={url("ink")} />
            {cell(c.x, 112, "LSTM", C.v3)}
            {i < cols.length - 1 && i !== 2 && (
              <>
                <line x1={c.x + 44} x2={cols[i + 1].x - 46} y1={192} y2={192} style={{ stroke: C.v1 }} strokeWidth={1.6} markerEnd={url("v1")} />
                <line x1={c.x + 44} x2={cols[i + 1].x - 46} y1={112} y2={112} style={{ stroke: C.v3 }} strokeWidth={1.6} markerEnd={url("v3")} />
              </>
            )}
          </g>
        ))}
        <text x={435} y={196} textAnchor="middle" fontSize={18} style={{ fill: C.muted }}>
          ⋯
        </text>
        <text x={435} y={116} textAnchor="middle" fontSize={18} style={{ fill: C.muted }}>
          ⋯
        </text>
        <text x={435} y={150} textAnchor="middle" fontSize={10} style={{ fill: C.muted }}>
          {t("(h, c) carried forward", "(h, c) ileri taşınır")}
        </text>
        {/* head */}
        <line x1={640} x2={640} y1={90} y2={62} style={{ stroke: C.ink2 }} strokeWidth={1.2} markerEnd={url("ink")} />
        <rect x={600} y={22} width={80} height={38} rx={6} style={{ fill: C.panel, stroke: C.accent }} strokeWidth={2} />
        <text x={640} y={39} textAnchor="middle" fontSize={11.5} fontWeight={650} style={{ fill: C.ink }}>
          Dense(1)
        </text>
        <text x={640} y={53} textAnchor="middle" fontSize={10} style={{ fill: C.muted }}>
          {t("last step only", "yalnızca son adım")}
        </text>
        <line x1={682} x2={740} y1={41} y2={41} style={{ stroke: C.accent }} strokeWidth={1.6} markerEnd={url("accent")} />
        <text x={746} y={38} fontSize={13} fontWeight={700} style={{ fill: C.ink }}>
          P̂(t)
        </text>
        <text x={746} y={53} fontSize={10} style={{ fill: C.muted }}>
          MW
        </text>
        <text x={W - 10} y={150} textAnchor="end" fontSize={10.5} style={{ fill: C.muted }}>
          {t("dropout 0.2 after each layer", "her katmandan sonra dropout 0,2")}
        </text>
      </svg>
    </Wide>
  );
}

// ── 9.2 LSTM cell ───────────────────────────────────────────────────

const sig = (z: number) => 1 / (1 + Math.exp(-z));

/**
 * One-unit LSTM with hand-set weights that acts as a gust filter: the input gate stays open
 * while the input is within 0.3 of the memory (a ramp), closes for a jump (a gust), and the
 * forget gate opens fully when the input gate closes, so the memory holds its value.
 */
function runLSTM(xs: number[]) {
  let h = 0;
  let c = 0.12;
  return xs.map((x) => {
    const i = sig(0.5 - 12 * Math.max(0, Math.abs(x - c) - 0.3));
    const f = sig(1.6 + 6.5 * (0.62 - i));
    const g = Math.tanh(0.3 * x);
    const o = sig(1 + 0.5 * x);
    c = f * c + i * g;
    h = o * Math.tanh(c);
    return { x, f, i, g, o, c, h };
  });
}

const LSTM_N = 48;
const LSTM_X = Array.from({ length: LSTM_N }, (_, k) => Math.min(1, 0.12 + Math.max(0, k - 8) * 0.024) + (k >= 30 && k < 32 ? 0.55 : 0));

export function LstmCell({ lang }: { lang: Lang }) {
  const t = tt(lang);
  const { defs, url } = useArrows();
  const steps = useMemo(() => runLSTM(LSTM_X), []);
  const reduced = useReducedMotion();
  const [k, setK] = useState(31);
  const [playing, setPlaying] = useState(false);
  const acc = useRef(0);
  useFrame(playing && !reduced, (dt) => {
    acc.current += dt;
    if (acc.current < 0.22) return;
    acc.current = 0;
    setK((v) => (v + 1) % LSTM_N);
  });
  const s = steps[k];
  const f2 = (v: number) => formatNumber(v, 2, lang);
  const gate = (x: number, y: number, sym: string, v: number, tone: string, name: string) => (
    <g>
      <rect x={x - 26} y={y - 16} width={52} height={32} rx={5} style={{ fill: C.surface, stroke: tone }} strokeWidth={1.6} />
      <rect x={x - 26} y={y + 16 - 32 * Math.max(0, Math.min(1, v))} width={52} height={32 * Math.max(0, Math.min(1, v))} rx={5} style={{ fill: tone }} opacity={0.22} />
      <text x={x} y={y - 1} textAnchor="middle" fontSize={13} fontWeight={700} style={{ fill: C.ink }}>
        {sym}
      </text>
      <text x={x} y={y + 12} textAnchor="middle" fontSize={10} style={{ fill: C.ink, fontFamily: "var(--font-mono)" }}>
        {f2(v)}
      </text>
      {/* under the input bus, clear of the arrows */}
      <text x={x} y={244} textAnchor="middle" fontSize={10} style={{ fill: C.muted }}>
        {name}
      </text>
    </g>
  );
  const op = (x: number, y: number, sym: string) => (
    <g>
      <circle cx={x} cy={y} r={11} style={{ fill: C.surface, stroke: C.ink2 }} strokeWidth={1.4} />
      <text x={x} y={y + 4.5} textAnchor="middle" fontSize={13} fontWeight={700} style={{ fill: C.ink }}>
        {sym}
      </text>
    </g>
  );
  const W = 760;
  const cy = 54; // cell-state line
  const gy = 176; // gates row
  const gx = { f: 210, i: 320, g: 410, o: 540 };
  return (
    <div>
      <Controls>
        <button
          type="button"
          onClick={() => setPlaying(!playing)}
          className="flex items-center gap-1 rounded-md bg-accent px-2.5 py-1 text-xs font-semibold text-accent-ink hover:bg-accent-hover"
        >
          {playing ? <Pause size={12} /> : <Play size={12} />} {playing ? t("Pause", "Duraklat") : t("Play the sequence", "Diziyi oynat")}
        </button>
        <Range label={t("time step", "zaman adımı")} value={k} min={0} max={LSTM_N - 1} step={1} onChange={(v) => (setPlaying(false), setK(v))} width="w-44" format={(v) => `${v + 1} / ${LSTM_N}`} />
      </Controls>
      <Wide minWidth={680}>
        <svg viewBox={`0 0 ${W} 262`} className="w-full" role="img" aria-label={t("An LSTM cell and its gate activations", "Bir LSTM hücresi ve kapı aktivasyonları")}>
          {defs}
          <rect x={150} y={20} width={480} height={222} rx={14} style={{ fill: C.panel, stroke: C.axis }} />
          {/* cell state highway */}
          <line x1={60} x2={gx.f - 12} y1={cy} y2={cy} style={{ stroke: C.v1 }} strokeWidth={3} />
          <line x1={gx.f + 12} x2={gx.g - 12} y1={cy} y2={cy} style={{ stroke: C.v1 }} strokeWidth={3} />
          <line x1={gx.g + 12} x2={W - 50} y1={cy} y2={cy} style={{ stroke: C.v1 }} strokeWidth={3} markerEnd={url("v1")} />
          <text x={60} y={cy - 10} fontSize={11.5} fontWeight={650} style={{ fill: C.ink }}>
            c(t−1)
          </text>
          <text x={W - 50} y={cy - 10} textAnchor="end" fontSize={11.5} fontWeight={650} style={{ fill: C.ink }}>
            c(t) = {f2(s.c)}
          </text>
          {op(gx.f, cy, "×")}
          {op(gx.g, cy, "+")}
          {/* gate inputs */}
          <line x1={60} x2={gx.o + 40} y1={226} y2={226} style={{ stroke: C.ink2 }} strokeWidth={1.4} />
          <text x={60} y={248} fontSize={11.5} fontWeight={650} style={{ fill: C.ink }}>
            [h(t−1), x(t)]
          </text>
          <text x={gx.o + 70} y={230} fontSize={10.5} style={{ fill: C.muted }}>
            x(t) = {f2(s.x)}
          </text>
          {[gx.f, gx.i, gx.g, gx.o].map((x) => (
            <line key={x} x1={x} x2={x} y1={226} y2={gy + 18} style={{ stroke: C.ink2 }} strokeWidth={1.2} markerEnd={url("ink")} />
          ))}
          {gate(gx.f, gy, "σ", s.f, C.bad, t("forget f", "unut f"))}
          {gate(gx.i, gy, "σ", s.i, C.v3, t("input i", "giriş i"))}
          {gate(gx.g, gy, "tanh", (s.g + 1) / 2, C.v2, t("candidate c̃", "aday c̃"))}
          {gate(gx.o, gy, "σ", s.o, C.warn, t("output o", "çıkış o"))}
          {/* f → × on the belt */}
          <line x1={gx.f} x2={gx.f} y1={gy - 18} y2={cy + 13} style={{ stroke: C.bad }} strokeWidth={1.4} markerEnd={url("bad")} />
          {/* i × g → + */}
          {op(gx.i + 45, 112, "×")}
          <path d={`M${gx.i},${gy - 18} L${gx.i},112 L${gx.i + 33},112`} fill="none" style={{ stroke: C.v3 }} strokeWidth={1.4} />
          <path d={`M${gx.g},${gy - 18} L${gx.g},140 L${gx.i + 45},140 L${gx.i + 45},124`} fill="none" style={{ stroke: C.v2 }} strokeWidth={1.4} />
          <path d={`M${gx.i + 45},100 L${gx.i + 45},84 L${gx.g},84 L${gx.g},${cy + 13}`} fill="none" style={{ stroke: C.ink2 }} strokeWidth={1.4} markerEnd={url("ink")} />
          {/* output: tanh(c) × o → h */}
          <line x1={gx.o + 40} x2={gx.o + 40} y1={cy + 2} y2={90} style={{ stroke: C.v1 }} strokeWidth={1.4} />
          <rect x={gx.o + 20} y={90} width={40} height={22} rx={4} style={{ fill: C.surface, stroke: C.ink2 }} />
          <text x={gx.o + 40} y={105} textAnchor="middle" fontSize={11} style={{ fill: C.ink }}>
            tanh
          </text>
          {op(gx.o + 40, 138, "×")}
          <line x1={gx.o + 40} x2={gx.o + 40} y1={112} y2={126} style={{ stroke: C.ink2 }} strokeWidth={1.4} />
          <path d={`M${gx.o},${gy - 18} L${gx.o},138 L${gx.o + 28},138`} fill="none" style={{ stroke: C.warn }} strokeWidth={1.4} />
          <line x1={gx.o + 52} x2={W - 50} y1={138} y2={138} style={{ stroke: C.ink2 }} strokeWidth={1.6} markerEnd={url("ink")} />
          <text x={W - 50} y={130} textAnchor="end" fontSize={11.5} fontWeight={650} style={{ fill: C.ink }}>
            h(t) = {f2(s.h)}
          </text>
        </svg>
      </Wide>
      <XYChart
        ariaLabel={t("Input, cell state and hidden state over the sequence", "Dizi boyunca girdi, hücre durumu ve gizli durum")}
        height={200}
        x={{ domain: [0, LSTM_N - 1], title: t("time step", "zaman adımı") }}
        y={{ domain: [-0.05, 1.35], ticks: [0, 0.25, 0.5, 0.75, 1, 1.25] }}
        series={[
          { kind: "line", id: "x", label: t("input x: wind ramp + 2-step gust", "girdi x: rüzgâr rampası + 2 adımlık hamle"), color: C.ink2, points: steps.map((p, i) => [i, p.x]), decimals: 2 },
          { kind: "line", id: "c", label: t("cell state c (memory)", "hücre durumu c (hafıza)"), color: C.v1, points: steps.map((p, i) => [i, p.c]), decimals: 2 },
          { kind: "line", id: "h", label: t("output h", "çıkış h"), color: C.v3, points: steps.map((p, i) => [i, p.h]), decimals: 2 },
        ]}
        hoverLabel={(i) => `${t("step", "adım")} ${i + 1}`}
        over={({ sx, m, h }) => <line x1={sx(k)} x2={sx(k)} y1={m.t} y2={h - m.b} style={{ stroke: C.accent }} strokeWidth={1.5} />}
      />
    </div>
  );
}

// ── 9.3 Gradient memory ─────────────────────────────────────────────

const SUP: Record<number, string> = { [-2]: "⁻²", [-4]: "⁻⁴", [-6]: "⁻⁶", [-8]: "⁻⁸" };

export function GradientMemory({ lang }: { lang: Lang }) {
  const t = tt(lang);
  const ks = Array.from({ length: 49 }, (_, k) => k);
  const line = (factor: number) => ks.map((k) => [k, Math.max(-8, k * Math.log10(factor))] as [number, number]);
  return (
    <XYChart
      ariaLabel={t("Gradient size against the number of steps back", "Geriye doğru adım sayısına göre gradyan büyüklüğü")}
      height={270}
      x={{ domain: [0, 48], ticks: [0, 6, 12, 18, 24, 30, 36, 42, 48], title: t("steps back k [h]", "geriye adım k [sa]") }}
      y={{ domain: [-8, 0.3], ticks: [0, -2, -4, -6, -8], format: (v) => (v === 0 ? "1" : `10${SUP[v]}`), title: t("|∂L/∂state(t−k)|, relative", "|∂L/∂durum(t−k)|, göreli") }}
      series={[
        { kind: "line", id: "r7", label: t("plain RNN, factor 0.7 per step", "düz RNN, adım başına 0,7"), color: C.v2, points: line(0.7), decimals: 2 },
        { kind: "line", id: "r9", label: t("plain RNN, factor 0.9", "düz RNN, 0,9"), color: C.v4, points: line(0.9), decimals: 2 },
        { kind: "line", id: "l", label: t("LSTM cell state, forget gate f ≈ 0.98", "LSTM hücre durumu, unutma kapısı f ≈ 0,98"), color: C.v1, points: line(0.98), decimals: 2 },
      ]}
      hoverLabel={(k) => `k = ${k} h`}
    />
  );
}

// ── 10.1 Attention as geometry ──────────────────────────────────────

const KEYS: { name: string; v: [number, number]; value: number }[] = [
  { name: "t−1", v: [0.95, 0.3], value: 612 },
  { name: "t−2", v: [0.8, 0.55], value: 580 },
  { name: "t−6", v: [0.25, 0.95], value: 410 },
  { name: "t−12", v: [-0.6, 0.7], value: 260 },
  { name: "t−24", v: [0.7, -0.65], value: 540 },
];

export function AttentionGeometry({ lang }: { lang: Lang }) {
  const t = tt(lang);
  const [angle, setAngle] = useState(20);
  const [len, setLen] = useState(2);
  const [ref, width] = useWidth<HTMLDivElement>();
  const size = Math.min(320, width);
  const q: [number, number] = [len * Math.cos((angle * Math.PI) / 180), len * Math.sin((angle * Math.PI) / 180)];
  const dk = 2;
  const scores = KEYS.map((k) => (q[0] * k.v[0] + q[1] * k.v[1]) / Math.sqrt(dk));
  const mx = Math.max(...scores);
  const ex = scores.map((s) => Math.exp(s - mx));
  const z = ex.reduce((a, b) => a + b, 0);
  const w = ex.map((e) => e / z);
  const out = w.reduce((a, wi, i) => a + wi * KEYS[i].value, 0);
  const entropy = -w.reduce((a, wi) => a + (wi > 0 ? wi * Math.log2(wi) : 0), 0);
  const c = size / 2;
  const s = size / 2 / 2.4;
  const P = (v: [number, number]) => [c + v[0] * s, c - v[1] * s] as const;
  const { defs, url } = useArrows();
  const f2 = (v: number) => formatNumber(v, 2, lang);
  return (
    <div>
      <Controls>
        <Range label={t("query direction", "sorgu yönü")} value={angle} min={-180} max={180} step={1} onChange={setAngle} format={(v) => `${v}°`} />
        <Range label={t("query length |q|", "sorgu uzunluğu |q|")} value={len} min={0.2} max={5} step={0.1} onChange={setLen} format={(v) => f2(v)} />
      </Controls>
      <div className="grid grid-cols-1 items-start gap-4 md:grid-cols-[minmax(0,320px)_1fr]">
        <div ref={ref} className="min-w-0">
          <svg width={size} height={size} role="img" aria-label={t("Query and key vectors", "Sorgu ve anahtar vektörleri")} className="block">
            {defs}
            <circle cx={c} cy={c} r={s} fill="none" style={{ stroke: C.grid }} />
            <circle cx={c} cy={c} r={2 * s} fill="none" style={{ stroke: C.grid }} />
            <line x1={8} x2={size - 8} y1={c} y2={c} style={{ stroke: C.grid }} />
            <line x1={c} x2={c} y1={8} y2={size - 8} style={{ stroke: C.grid }} />
            {KEYS.map((k, i) => {
              const [x, y] = P(k.v);
              return (
                <g key={k.name}>
                  <line x1={c} y1={c} x2={x} y2={y} style={{ stroke: C.v1 }} strokeWidth={1 + 5 * w[i]} strokeOpacity={0.35 + 0.65 * (w[i] / Math.max(...w))} markerEnd={url("v1")} />
                  <text x={x + (k.v[0] >= 0 ? 6 : -6)} y={y + (k.v[1] >= 0 ? -6 : 14)} textAnchor={k.v[0] >= 0 ? "start" : "end"} fontSize={11} fontWeight={600} style={{ fill: C.ink }}>
                    k({k.name})
                  </text>
                </g>
              );
            })}
            {(() => {
              const scale = Math.min(1, 2.3 / len);
              const [x, y] = P([q[0] * scale, q[1] * scale]);
              return (
                <g>
                  <line x1={c} y1={c} x2={x} y2={y} style={{ stroke: C.v2 }} strokeWidth={2.5} markerEnd={url("v2")} />
                  <text x={x + 6} y={y - 6} fontSize={12} fontWeight={700} style={{ fill: C.ink }}>
                    q(t){len > 2.3 ? " ⟶" : ""}
                  </text>
                </g>
              );
            })()}
          </svg>
        </div>
        <div className="space-y-2">
          <table className="w-full text-[12.5px]">
            <thead>
              <tr className="border-b border-border-secondary text-left text-text-primary">
                <th className="py-1 font-semibold">{t("past step j", "geçmiş adım j")}</th>
                <th className="font-semibold">q·kⱼ/√dₖ</th>
                <th className="font-semibold">{t("weight αⱼ", "ağırlık αⱼ")}</th>
                <th className="text-right font-semibold">{t("value vⱼ [MW]", "değer vⱼ [MW]")}</th>
              </tr>
            </thead>
            <tbody className="font-mono tabular-nums text-text-secondary">
              {KEYS.map((k, i) => (
                <tr key={k.name} className="border-b border-border-primary">
                  <td className="py-1 font-sans text-text-primary">{k.name}</td>
                  <td>{f2(scores[i])}</td>
                  <td>
                    <div className="flex items-center gap-2">
                      <div className="h-2.5 rounded-r-sm" style={{ width: `${Math.max(2, 90 * w[i])}px`, background: C.v1, transition: "width 150ms" }} />
                      {formatNumber(100 * w[i], 0, lang)} %
                    </div>
                  </td>
                  <td className="text-right">{k.value}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="grid grid-cols-2 gap-2">
            <Stat label={t("output Σ αⱼ vⱼ", "çıkış Σ αⱼ vⱼ")} value={`${formatNumber(out, 0, lang)} MW`} />
            <Stat label={t("entropy of α", "α entropisi")} value={`${f2(entropy)} bit`} sub={t(`uniform = ${f2(Math.log2(KEYS.length))} bit`, `düzgün = ${f2(Math.log2(KEYS.length))} bit`)} />
          </div>
        </div>
      </div>
    </div>
  );
}

// ── 10.2 TFT architecture ───────────────────────────────────────────

export function TftArchitecture({ lang }: { lang: Lang }) {
  const t = tt(lang);
  const { defs, url } = useArrows();
  const W = 900;
  const B = (x: number, y: number, w: number, h: number, title: string, sub: string, tone: string, code: string): ReactNode => (
    <g>
      <rect x={x} y={y} width={w} height={h} rx={6} style={{ fill: C.panel, stroke: tone }} strokeWidth={1.6} />
      <text x={x + 8} y={y + 14} fontSize={9.5} fontWeight={700} style={{ fill: C.muted, fontFamily: "var(--font-mono)" }}>
        {code}
      </text>
      <text x={x + w / 2} y={y + h / 2 + 4} textAnchor="middle" fontSize={12.5} fontWeight={650} style={{ fill: C.ink }}>
        {title}
      </text>
      <text x={x + w / 2} y={y + h / 2 + 19} textAnchor="middle" fontSize={9.8} style={{ fill: C.muted }}>
        {sub}
      </text>
    </g>
  );
  const arrow = (x1: number, x2: number, y: number, tone: "ink" | "accent" = "ink") => (
    <line x1={x1} x2={x2} y1={y} y2={y} style={{ stroke: tone === "ink" ? C.ink2 : C.accent }} strokeWidth={1.5} markerEnd={url(tone)} />
  );
  return (
    <Wide minWidth={780}>
      <svg viewBox={`0 0 ${W} 250`} className="w-full" role="img" aria-label={t("Temporal Fusion Transformer as implemented", "Uygulandığı şekliyle Temporal Fusion Transformer")}>
        {defs}
        <rect x={6} y={78} width={100} height={70} rx={6} style={{ fill: C.surface, stroke: C.axis }} />
        <text x={56} y={105} textAnchor="middle" fontSize={12} fontWeight={650} style={{ fill: C.ink }}>
          {t("24 h × 15", "24 sa × 15")}
        </text>
        <text x={56} y={121} textAnchor="middle" fontSize={10.5} style={{ fill: C.muted }}>
          {t("NWP features,", "NWP özellikleri,")}
        </text>
        <text x={56} y={135} textAnchor="middle" fontSize={10.5} style={{ fill: C.muted }}>
          {t("scaled per fold", "katman başına ölçekli")}
        </text>
        {arrow(108, 128, 113)}
        {B(130, 78, 130, 70, t("Variable selection", "Değişken seçimi"), t("GRN per input, softmax", "girdi başına GRN, softmax"), C.v1, "VSN")}
        {arrow(262, 282, 113)}
        {B(284, 78, 120, 70, t("LSTM encoder", "LSTM kodlayıcı"), t("hidden 32, local order", "gizli 32, yerel sıra"), C.v1, "LSTM")}
        {arrow(406, 426, 113)}
        {B(428, 78, 150, 70, t("Multi-head attention", "Çok başlı dikkat"), t("2 heads, d = 32", "2 baş, d = 32"), C.v3, "MHA")}
        {arrow(580, 600, 113)}
        {B(602, 78, 120, 70, t("Gated residual net", "Kapılı artık ağ"), t("GLU gate + LayerNorm", "GLU kapısı + LayerNorm"), C.v1, "GRN")}
        {arrow(724, 744, 113, "accent")}
        {B(746, 70, 146, 86, t("9 quantile heads", "9 kantil başı"), "P10 … P90", C.accent, "OUT")}
        {/* annotations */}
        <text x={195} y={170} textAnchor="middle" fontSize={10.5} style={{ fill: C.ink2 }}>
          {t("which inputs matter", "hangi girdiler önemli")}
        </text>
        <text x={195} y={184} textAnchor="middle" fontSize={10.5} style={{ fill: C.ink2 }}>
          {t("(weights sum to 1)", "(ağırlıklar toplamı 1)")}
        </text>
        <text x={503} y={170} textAnchor="middle" fontSize={10.5} style={{ fill: C.ink2 }}>
          {t("which past hours matter", "hangi geçmiş saatler önemli")}
        </text>
        <text x={503} y={184} textAnchor="middle" fontSize={10.5} style={{ fill: C.ink2 }}>
          {t("(attention weights)", "(dikkat ağırlıkları)")}
        </text>
        <text x={819} y={176} textAnchor="middle" fontSize={10.5} style={{ fill: C.ink2 }}>
          {t("pinball loss, Σ over τ", "pinball kaybı, τ üzerinden Σ")}
        </text>
        <text x={819} y={190} textAnchor="middle" fontSize={10.5} style={{ fill: C.ink2 }}>
          {t("then sorted, 0 ≤ P ≤ Cap", "sonra sıralanır, 0 ≤ P ≤ Kap")}
        </text>
        {/* skip connection */}
        <path d="M344,76 C344,30 662,30 662,76" fill="none" style={{ stroke: C.muted }} strokeWidth={1.3} strokeDasharray="5 4" markerEnd={url("muted")} />
        <text x={503} y={30} textAnchor="middle" fontSize={10.5} style={{ fill: C.muted }}>
          {t("residual path (gated)", "artık yol (kapılı)")}
        </text>
        <text x={8} y={232} fontSize={10.5} style={{ fill: C.muted }}>
          {t(
            "Simplified for teaching (backend/app/services/p4/tft_model.py): no static covariates and a single output step, as the day-ahead target is one hour per window.",
            "Öğretim için sadeleştirilmiş (backend/app/services/p4/tft_model.py): statik eş değişken yok ve tek çıkış adımı var, çünkü gün öncesi hedef pencere başına bir saattir.",
          )}
        </text>
      </svg>
    </Wide>
  );
}

