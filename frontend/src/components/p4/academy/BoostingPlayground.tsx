/**
 * Gradient boosting you can play with (the idea inside XGBoost), trained in the browser
 * on a toy wind → power problem (academy/boosting.ts): the IEA 15 MW curve plus noise.
 *
 * Left: the samples, the true curve and the model after k trees; thin lines are the
 * residuals the next tree will learn. Right: training vs unseen-test error as trees are
 * added (log scale) — with a large learning rate and deep trees the test error turns up
 * again: over-fitting. Below: the rules of the last tree.
 */

import { useMemo, useRef, useState } from "react";
import { Pause, Play, RotateCcw } from "lucide-react";

import { C, useFrame } from "./charts/core";
import { Controls, Range, Segmented, XYChart } from "./charts/kit";
import { boost, makeData, powerCurve, predictBoosted, treeRules } from "./boosting";

const TRAIN = makeData(120, 11);
const TEST = makeData(120, 23);
const M = 150;

export default function BoostingPlayground({ lang }: { lang: "en" | "tr" }) {
  const t = (en: string, tr: string) => (lang === "tr" ? tr : en);
  const [eta, setEta] = useState(0.3);
  const [depth, setDepth] = useState(2);
  const [k, setK] = useState(0);
  const [playing, setPlaying] = useState(false);
  const { model, history } = useMemo(() => boost(TRAIN, TEST, M, eta, depth), [eta, depth]);

  // one tree every 0.09 s while playing; stops itself at M
  const acc = useRef(0);
  const running = playing && k < M;
  useFrame(running, (dt) => {
    acc.current += dt;
    if (acc.current < 0.09) return;
    acc.current = 0;
    setK((v) => Math.min(M, v + 1));
  });

  const grid = useMemo(() => Array.from({ length: 251 }, (_, i) => i / 10), []);
  const rules = k > 0 ? treeRules(model.trees[k - 1], eta) : [];
  const lg = (v: number) => Math.log10(Math.max(v, 1e-3));
  const logs = history.flatMap((h) => [lg(h.train), lg(h.test)]);
  const lo = Math.floor(Math.min(...logs) * 4) / 4;
  const hi = Math.ceil(Math.max(...logs) * 4) / 4;
  const best = history.reduce((b, h, i) => (h.test < history[b].test ? i : b), 0);

  return (
    <div>
      <Controls>
        <button
          type="button"
          onClick={() => {
            if (k >= M) setK(0);
            setPlaying(!running);
          }}
          className="flex items-center gap-1 rounded-md bg-accent px-2.5 py-1 text-xs font-semibold text-accent-ink hover:bg-accent-hover"
        >
          {running ? <Pause size={13} /> : <Play size={13} />} {running ? t("Pause", "Duraklat") : t("Add trees", "Ağaç ekle")}
        </button>
        <button type="button" onClick={() => (setPlaying(false), setK(0))} className="rounded-md border border-border-secondary p-1.5 hover:bg-bg-hover" aria-label={t("Reset", "Sıfırla")}>
          <RotateCcw size={13} />
        </button>
        <Range label={t("trees M", "ağaç M")} value={k} min={0} max={M} step={1} onChange={setK} width="w-32" />
        <Segmented
          label={t("learning rate η", "öğrenme oranı η")}
          value={eta}
          onChange={(v) => setEta(v)}
          options={[0.05, 0.1, 0.3, 1].map((v) => ({ v, label: `η ${String(v).replace(".", lang === "tr" ? "," : ".")}` }))}
        />
        <Segmented label={t("tree depth", "ağaç derinliği")} value={depth} onChange={setDepth} options={[1, 2, 3, 5].map((v) => ({ v, label: `${t("depth", "derinlik")} ${v}` }))} />
      </Controls>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[3fr_2fr]">
        <XYChart
          ariaLabel={t("Boosted model fitting the wind-to-power samples", "Rüzgârdan güce örneklere uyan boosting modeli")}
          height={290}
          x={{ domain: [0, 25], title: t("wind speed u [m/s]", "rüzgâr hızı u [m/s]") }}
          y={{ domain: [-1, 16.5], ticks: [0, 5, 10, 15], title: "P [MW]" }}
          series={[
            { kind: "scatter", id: "d", label: t("120 noisy samples", "120 gürültülü örnek"), color: C.ink2, points: TRAIN.map((s) => [s.u, s.p]), r: 2.6, opacity: 0.6 },
            { kind: "line", id: "true", label: t("true power curve", "gerçek güç eğrisi"), color: C.muted, points: grid.map((u) => [u, powerCurve(u)]), dash: true, hover: false },
            {
              kind: "line",
              id: "fit",
              label: k === 0 ? t("F₀ = mean of all samples", "F₀ = tüm örneklerin ortalaması") : t(`model F after ${k} trees`, `${k} ağaçtan sonra F modeli`),
              color: C.v2,
              points: grid.map((u) => [u, predictBoosted(model, u, k)]),
              width: 2.5,
              hover: false,
            },
          ]}
          under={({ sx, sy }) => (
            <g style={{ stroke: C.v2 }} strokeOpacity={0.35}>
              {TRAIN.map((s, i) => (
                <line key={i} x1={sx(s.u)} x2={sx(s.u)} y1={sy(s.p)} y2={sy(predictBoosted(model, s.u, k))} />
              ))}
            </g>
          )}
        />
        <div>
          <XYChart
            ariaLabel={t("Training and test error as trees are added", "Ağaç eklendikçe eğitim ve test hatası")}
            height={290}
            x={{ domain: [0, M], title: t("number of trees", "ağaç sayısı") }}
            y={{ domain: [lo, hi], format: (v) => (10 ** v < 1 ? (10 ** v).toFixed(2) : (10 ** v).toFixed(1)), title: t("MSE [MW²], log", "MSE [MW²], log") }}
            series={[
              { kind: "line", id: "tr", label: t("training", "eğitim"), color: C.v1, points: history.map((h, i) => [i, lg(h.train)]), decimals: 2 },
              { kind: "line", id: "te", label: t("unseen test", "görülmemiş test"), color: C.v2, points: history.map((h, i) => [i, lg(h.test)]), dash: true, decimals: 2 },
            ]}
            hoverLabel={(i) => `${i} ${t("trees", "ağaç")} · MSE ${history[i].train.toFixed(2)} / ${history[i].test.toFixed(2)}`}
            over={({ sx, sy, m, h }) => (
              <g>
                <line x1={sx(k)} x2={sx(k)} y1={m.t} y2={h - m.b} style={{ stroke: C.accent }} strokeWidth={1.5} />
                <circle cx={sx(best)} cy={sy(lg(history[best].test))} r={4.5} style={{ fill: C.good, stroke: C.surface }} strokeWidth={2} />
              </g>
            )}
          />
          <p className="mt-1 text-xs text-text-muted">
            {t(`Green dot: lowest test error, after ${best} trees.`, `Yeşil nokta: en düşük test hatası, ${best} ağaçtan sonra.`)}
          </p>
        </div>
      </div>

      <div className="mt-3 rounded-md border border-border-primary bg-bg-secondary p-3 font-mono text-xs leading-relaxed text-text-secondary" translate="no">
        <div className="mb-1 font-sans text-xs font-semibold text-text-primary">
          {k === 0 ? t("No tree yet — the model is the mean.", "Henüz ağaç yok — model ortalamadır.") : t(`Tree #${k} adds η × leaf value:`, `Ağaç #${k}, η × yaprak değeri ekler:`)}
        </div>
        <div className="grid gap-x-6 sm:grid-cols-2">
          {rules.slice(0, 8).map((r) => (
            <div key={r}>{r}</div>
          ))}
        </div>
        {rules.length > 8 && <div>… {rules.length - 8} more</div>}
      </div>
    </div>
  );
}
