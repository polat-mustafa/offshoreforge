/**
 * Figures of Part IV — uncertainty and evaluation (chapters 11–13).
 *
 *   CfHistogram        distribution of the measured output in capacity-factor bins (real)
 *   PinballDemo        the τ-quantile is the minimum of the average pinball loss
 *   FanChart           XGBoost / TFT quantile bands over the real week
 *   Conformal          coverage and width before / after conformal calibration (real)
 *   MetricsLab         error series and scores of a chosen forecast on the real week
 *   CrpsGeometry       CRPS as the area between forecast CDF and observation step (real)
 *   Reliability        reliability diagram of XGBoost, TFT and climatology (real)
 *   ScoreBoard         every forecast on the same test hours (real, live when loaded)
 *   ErrorCorrelation   correlation of the P50 errors (real)
 *   EnsembleCalc       error of a two-member combination against its weight
 *   ShapWaterfall      TreeSHAP decomposition of three real forecast hours
 *   ShapGlobal         mean |SHAP| share per feature (real)
 */

import { useMemo, useState } from "react";

import { useForecastStore } from "../../../../store/forecastStore";
import { C, useWidth } from "../charts/core";
import { Controls, HBars, Range, Segmented, Stat, XYChart, type Series } from "../charts/kit";
import { DATA, formatNumber } from "../course/facts";
import type { Lang } from "../course/types";
import { CAP, featureLabel, WEEK, WEEK_X, num, rng, tt, weekLabel, weekTicks } from "./common";

const TAUS = [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9];

// ── 11.1 Distribution of the output ─────────────────────────────────

export function CfHistogram({ lang }: { lang: Lang }) {
  const t = tt(lang);
  const h = DATA.cf_hist;
  return (
    <XYChart
      ariaLabel={t("Distribution of hourly output", "Saatlik üretimin dağılımı")}
      height={250}
      legend={false}
      x={{ domain: [0, 100], ticks: [0, 20, 40, 60, 80, 100], format: (v) => `${v}`, title: t("output [% of capacity]", "üretim [kapasitenin %'si]") }}
      y={{ domain: [0, 20], title: t("share of hours [%]", "saatlerin payı [%]") }}
      series={[
        { kind: "bars", id: "b", label: t("hours", "saatler"), color: C.v1, points: h.map((v, i) => [i * 5 + 2.5, 100 * v]) },
        { kind: "line", id: "l", label: t("share", "pay"), color: C.v1, points: h.map((v, i) => [i * 5 + 2.5, 100 * v]), width: 0, decimals: 1, unit: "%" },
      ]}
      hoverLabel={(x) => `${formatNumber(x - 2.5, 0, lang)}–${formatNumber(x + 2.5, 0, lang)} %`}
    />
  );
}

// ── 11.2 Pinball loss and the quantile ──────────────────────────────

const OUTCOMES = (() => {
  const r = rng(4);
  // skewed outcomes of a 600 MW forecast hour, bounded by 0 and the capacity
  return Array.from({ length: 220 }, () => {
    const z = r() + r() + r() - 1.5;
    const tail = r() < 0.25 ? 2.2 : 1;
    return Math.min(CAP, Math.max(0, 600 + 160 * z * tail));
  });
})();

export function PinballDemo({ lang }: { lang: Lang }) {
  const t = tt(lang);
  const [tau, setTau] = useState(0.9);
  const qs = useMemo(() => Array.from({ length: 199 }, (_, i) => (i * CAP) / 198), []);
  const loss = (q: number) => OUTCOMES.reduce((s, y) => s + Math.max(tau * (y - q), (tau - 1) * (y - q)), 0) / OUTCOMES.length;
  const ls = qs.map(loss);
  const iBest = ls.reduce((b, v, i) => (v < ls[b] ? i : b), 0);
  const qBest = qs[iBest];
  const below = OUTCOMES.filter((y) => y <= qBest).length / OUTCOMES.length;
  const jitter = useMemo(() => {
    const r = rng(8);
    return OUTCOMES.map(() => r());
  }, []);
  const ymax = Math.max(...ls) * 1.05;
  return (
    <div>
      <Controls>
        <Range label="τ" value={tau} min={0.05} max={0.95} step={0.05} onChange={setTau} format={(v) => formatNumber(v, 2, lang)} />
        <span className="text-xs text-text-secondary">
          {t("under-forecast costs", "eksik tahmin bedeli")} <b className="font-mono">{formatNumber(tau, 2, lang)}</b> × |e|, {t("over-forecast", "fazla tahmin")} <b className="font-mono">{formatNumber(1 - tau, 2, lang)}</b> × |e|
        </span>
      </Controls>
      <XYChart
        ariaLabel={t("Average pinball loss against the guess q", "q tahminine göre ortalama pinball kaybı")}
        height={300}
        legend={false}
        margin={{ t: 70 }}
        x={{ domain: [0, CAP], title: t("guess q [MW]", "tahmin q [MW]") }}
        y={{ domain: [0, ymax], format: (v) => formatNumber(v, 0, lang), title: t("average pinball loss [MW]", "ortalama pinball kaybı [MW]") }}
        series={[{ kind: "line", id: "l", label: t("loss", "kayıp"), color: C.ink, points: qs.map((q, i) => [q, ls[i]]), unit: "MW", decimals: 1 }]}
        hoverLabel={(q) => `q = ${formatNumber(q, 0, lang)} MW`}
        over={({ sx, sy, m, h }) => (
          <g>
            {OUTCOMES.map((y, i) => (
              <circle key={i} cx={sx(y)} cy={12 + jitter[i] * 40} r={2.6} style={{ fill: y <= qBest ? C.v1 : C.v2 }} opacity={0.75} />
            ))}
            <line x1={sx(qBest)} x2={sx(qBest)} y1={8} y2={h - m.b} style={{ stroke: C.accent }} strokeWidth={2} />
            <circle cx={sx(qBest)} cy={sy(ls[iBest])} r={5} style={{ fill: C.accent, stroke: C.surface }} strokeWidth={2} />
            <text x={sx(qBest) + (qBest > CAP * 0.7 ? -8 : 8)} y={sy(ls[iBest]) - 10} textAnchor={qBest > CAP * 0.7 ? "end" : "start"} fontSize={11.5} fontWeight={650} style={{ fill: C.ink }}>
              {t(`minimum: q* = ${formatNumber(qBest, 0, lang)} MW, ${formatNumber(100 * below, 0, lang)} % of outcomes below`, `minimum: q* = ${formatNumber(qBest, 0, lang)} MW, sonuçların %${formatNumber(100 * below, 0, lang)}'i altında`)}
            </text>
          </g>
        )}
      />
      <p className="mt-1 text-xs text-text-muted">
        {t("Dots: 220 possible outcomes of one forecast hour (blue at or below q*, orange above).", "Noktalar: bir tahmin saatinin 220 olası sonucu (mavi q* veya altı, turuncu üstü).")}
      </p>
    </div>
  );
}

// ── 11.3 Fan chart ──────────────────────────────────────────────────

export function FanChart({ lang }: { lang: Lang }) {
  const t = tt(lang);
  const [m, setM] = useState<"xgb" | "tft">("xgb");
  const q = m === "xgb" ? WEEK.xgb_q_mw : WEEK.tft_q_mw;
  const { ticks, format } = weekTicks(lang);
  const band = (lo: number, hi: number, op: number, label: string): Series => ({
    kind: "band",
    id: `b${lo}`,
    label,
    color: C.v1,
    lower: WEEK_X.map((x) => [x, q[lo][x]]),
    upper: WEEK_X.map((x) => [x, q[hi][x]]),
    opacity: op,
  });
  const inside = WEEK_X.filter((x) => num(WEEK.actual_mw[x]) && num(q[0][x]) && (WEEK.actual_mw[x] as number) >= (q[0][x] as number) && (WEEK.actual_mw[x] as number) <= (q[8][x] as number)).length;
  return (
    <div>
      <Controls>
        <Segmented
          label={t("Model", "Model")}
          value={m}
          onChange={setM}
          options={[
            { v: "xgb", label: t("XGBoost (conformal)", "XGBoost (konformal)") },
            { v: "tft", label: "TFT" },
          ]}
        />
        <span className="text-xs text-text-secondary">
          {t("this week inside P10–P90:", "bu hafta P10–P90 içinde:")} <b className="font-mono">{formatNumber((100 * inside) / WEEK_X.length, 0, lang)} %</b> {t("of hours (ideal 80 %)", "saat (ideal %80)")}
        </span>
      </Controls>
      <XYChart
        ariaLabel={t("Quantile fan over the real week", "Gerçek hafta boyunca kantil yelpazesi")}
        height={300}
        x={{ domain: [0, WEEK_X.length - 1], ticks, format }}
        y={{ domain: [0, 1000], title: t("power [MW]", "güç [MW]") }}
        series={[
          band(0, 8, 0.12, "P10–P90"),
          band(1, 7, 0.12, "P20–P80"),
          band(2, 6, 0.14, "P30–P70"),
          band(3, 5, 0.16, "P40–P60"),
          { kind: "line", id: "p50", label: "P50", color: C.v1, points: WEEK_X.map((x) => [x, q[4][x]]), unit: "MW" },
          { kind: "line", id: "a", label: t("measured", "ölçülen"), color: C.ink, points: WEEK_X.map((x) => [x, WEEK.actual_mw[x]]), unit: "MW" },
        ]}
        hoverLabel={(i) => weekLabel(i, lang)}
      />
    </div>
  );
}

// ── 11.4 Conformal calibration ──────────────────────────────────────

export function Conformal({ lang }: { lang: Lang }) {
  const t = tt(lang);
  const c = DATA.coverage;
  return (
    <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
      <div>
        <div className="mb-2 text-xs font-semibold text-text-primary">{t("Share of test hours inside P10–P90 (target 80 %)", "P10–P90 içindeki test saatlerinin payı (hedef %80)")}</div>
        <HBars
          ariaLabel={t("Coverage before and after conformal calibration", "Konformal kalibrasyon öncesi ve sonrası kapsama")}
          unit="%"
          max={100}
          format={(v) => formatNumber(v, 1, lang)}
          bars={[
            { label: t("quantile regression alone", "yalnız kantil regresyonu"), value: c.raw_pct, color: C.v2 },
            { label: t("after conformal margin", "konformal paydan sonra"), value: c.conformal_pct, color: C.v1 },
            { label: t("nominal", "nominal"), value: 80, color: C.muted },
          ]}
        />
        <div className="mt-3 grid grid-cols-2 gap-2">
          <Stat label={t("mean band width, raw", "ortalama bant genişliği, ham")} value={`${formatNumber(c.raw_width_mw, 0, lang)} MW`} />
          <Stat label={t("mean band width, conformal", "ortalama bant genişliği, konformal")} value={`${formatNumber(c.conformal_width_mw, 0, lang)} MW`} />
        </div>
      </div>
      <div>
        <div className="mb-2 text-xs font-semibold text-text-primary">{t("Conformal margin m per fold [MW]", "Katman başına konformal pay m [MW]")}</div>
        <HBars
          ariaLabel={t("Conformal margin per fold", "Katman başına konformal pay")}
          unit="MW"
          max={110}
          format={(v) => formatNumber(v, 0, lang)}
          bars={DATA.folds.map((f, i) => ({
            label: `${t("fold", "katman")} ${i + 1}`,
            note: t(`${formatNumber(f.n_train, 0, lang)} h of training`, `${formatNumber(f.n_train, 0, lang)} sa eğitim`),
            value: f.margin_mw,
            color: C.v3,
          }))}
        />
      </div>
    </div>
  );
}

// ── 12.1 Metrics lab ────────────────────────────────────────────────

type MK = "xgb" | "tft" | "lstm" | "ens" | "tso" | "curve" | "pers";
const MLAB: Record<MK, (number | null)[]> = {
  xgb: WEEK.xgb_q_mw[4],
  tft: WEEK.tft_q_mw[4],
  lstm: WEEK.lstm_mw,
  ens: WEEK.ensemble_mw,
  tso: WEEK.tso_mw,
  curve: WEEK.curve_mw,
  pers: WEEK.persistence_mw,
};

function scores(f: (number | null)[]) {
  let se = 0;
  let ae = 0;
  let b = 0;
  let sp = 0;
  let n = 0;
  for (const x of WEEK_X) {
    const a = WEEK.actual_mw[x];
    const p = f[x];
    const pp = WEEK.persistence_mw[x];
    if (!num(a) || !num(p) || !num(pp)) continue;
    n += 1;
    se += (p - a) ** 2;
    ae += Math.abs(p - a);
    b += p - a;
    sp += (pp - a) ** 2;
  }
  return { nrmse: (100 * Math.sqrt(se / n)) / CAP, nmae: (100 * ae) / n / CAP, bias: (100 * b) / n / CAP, ss: 1 - se / sp };
}

export function MetricsLab({ lang }: { lang: Lang }) {
  const t = tt(lang);
  const [k, setK] = useState<MK>("xgb");
  const names: Record<MK, string> = { xgb: "XGBoost", tft: "TFT", lstm: "LSTM", ens: t("Ensemble", "Topluluk"), tso: t("TSO", "İSO"), curve: t("NWP curve", "NWP eğrisi"), pers: t("Persistence", "Kalıcılık") };
  const s = scores(MLAB[k]);
  const err = WEEK_X.map((x) => [x, num(MLAB[k][x]) && num(WEEK.actual_mw[x]) ? (MLAB[k][x] as number) - (WEEK.actual_mw[x] as number) : null] as [number, number | null]);
  const { ticks, format } = weekTicks(lang);
  const f1 = (v: number) => formatNumber(v, 1, lang);
  return (
    <div>
      <Controls>
        <Segmented label={t("Forecast", "Tahmin")} value={k} onChange={setK} options={(Object.keys(names) as MK[]).map((v) => ({ v, label: names[v] }))} />
      </Controls>
      <XYChart
        ariaLabel={t("Forecast error over the real week", "Gerçek hafta boyunca tahmin hatası")}
        height={250}
        legend={false}
        x={{ domain: [0, WEEK_X.length - 1], ticks, format }}
        y={{ domain: [-700, 700], ticks: [-600, -300, 0, 300, 600], title: t("error ŷ − y [MW]", "hata ŷ − y [MW]") }}
        series={[{ kind: "line", id: "e", label: t("error", "hata"), color: C.v1, points: err, unit: "MW" }]}
        hoverLabel={(i) => weekLabel(i, lang)}
        under={({ sx, sy, w, m }) => (
          <g>
            <rect x={m.l} y={sy(700)} width={w - m.l - m.r} height={sy(0) - sy(700)} style={{ fill: C.v2 }} opacity={0.05} />
            <line x1={m.l} x2={w - m.r} y1={sy(0)} y2={sy(0)} style={{ stroke: C.ink2 }} strokeWidth={1} />
            <text x={sx(2)} y={sy(640)} fontSize={10.5} style={{ fill: C.muted }}>
              {t("over-forecast (short)", "fazla tahmin (açık)")}
            </text>
            <text x={sx(2)} y={sy(-620)} fontSize={10.5} style={{ fill: C.muted }}>
              {t("under-forecast (long)", "eksik tahmin (fazla)")}
            </text>
          </g>
        )}
      />
      <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Stat label="nRMSE" value={`${f1(s.nrmse)} %`} sub={t("this week", "bu hafta")} />
        <Stat label="nMAE" value={`${f1(s.nmae)} %`} />
        <Stat label={t("bias", "sapma")} value={`${f1(s.bias)} %`} tone={Math.abs(s.bias) > 3 ? "warn" : undefined} />
        <Stat label={t("skill vs persistence", "kalıcılığa karşı beceri")} value={formatNumber(s.ss, 2, lang)} tone={s.ss > 0 ? "good" : "bad"} />
      </div>
    </div>
  );
}

// ── 12.2 CRPS geometry ──────────────────────────────────────────────

/** Piecewise-linear CDF through the quantiles, 0 at x = 0 and 1 at the capacity. */
function cdfFrom(q: number[]) {
  const xs = [0, ...q, CAP];
  const ps = [0, ...TAUS, 1];
  return (x: number) => {
    if (x <= 0) return 0;
    if (x >= CAP) return 1;
    for (let i = 1; i < xs.length; i++)
      if (x <= xs[i]) {
        const d = xs[i] - xs[i - 1];
        return d <= 0 ? ps[i] : ps[i - 1] + ((x - xs[i - 1]) / d) * (ps[i] - ps[i - 1]);
      }
    return 1;
  };
}

export function CrpsGeometry({ lang }: { lang: Lang }) {
  const t = tt(lang);
  const [hour, setHour] = useState(53);
  const [m, setM] = useState<"xgb" | "tft">("xgb");
  const src = m === "xgb" ? WEEK.xgb_q_mw : WEEK.tft_q_mw;
  const q = TAUS.map((_, j) => src[j][hour] ?? 0).sort((a, b) => a - b);
  const y = WEEK.actual_mw[hour] ?? 0;
  const F = cdfFrom(q);
  const xs = Array.from({ length: 401 }, (_, i) => (i * CAP) / 400);
  const crps = xs.reduce((s, x, i) => (i ? s + ((F(x) - (x >= y ? 1 : 0)) ** 2 + (F(xs[i - 1]) - (xs[i - 1] >= y ? 1 : 0)) ** 2) * 0.5 * (x - xs[i - 1]) : s), 0);
  const qsScore = (2 / 9) * TAUS.reduce((s, tau, j) => s + Math.max(tau * (y - q[j]), (tau - 1) * (y - q[j])), 0);
  return (
    <div>
      <Controls>
        <Segmented label={t("Model", "Model")} value={m} onChange={setM} options={[{ v: "xgb", label: "XGBoost" }, { v: "tft", label: "TFT" }]} />
        <Range label={t("hour of the week", "haftanın saati")} value={hour} min={0} max={WEEK_X.length - 1} step={1} onChange={setHour} width="w-44" format={(v) => weekLabel(v, lang).slice(0, -4)} />
      </Controls>
      <XYChart
        ariaLabel={t("Forecast CDF and the observation", "Tahmin dağılım fonksiyonu ve gözlem")}
        height={280}
        x={{ domain: [0, CAP], title: t("power x [MW]", "güç x [MW]") }}
        y={{ domain: [0, 1.04], ticks: [0, 0.25, 0.5, 0.75, 1], title: t("probability P(P ≤ x)", "olasılık P(P ≤ x)") }}
        series={[
          { kind: "line", id: "F", label: t("forecast CDF F(x) from P10…P90", "P10…P90'dan tahmin DF'si F(x)"), color: C.v1, points: xs.map((x) => [x, F(x)]), decimals: 2 },
          { kind: "line", id: "H", label: t("observation step 1{x ≥ y}", "gözlem basamağı 1{x ≥ y}"), color: C.ink, points: xs.map((x) => [x, x >= y ? 1 : 0]), hover: false },
        ]}
        hoverLabel={(x) => `x = ${formatNumber(x, 0, lang)} MW`}
        under={({ sx, sy }) => {
          const top = xs.map((x) => [sx(x), sy(Math.max(F(x), x >= y ? 1 : 0))]);
          const bot = xs.map((x) => [sx(x), sy(Math.min(F(x), x >= y ? 1 : 0))]);
          return <path d={top.map(([a, b], i) => `${i ? "L" : "M"}${a.toFixed(1)},${b.toFixed(1)}`).join("") + [...bot].reverse().map(([a, b]) => `L${a.toFixed(1)},${b.toFixed(1)}`).join("") + "Z"} style={{ fill: C.v2 }} opacity={0.3} />;
        }}
        over={({ sx, sy }) => (
          <g>
            {q.map((v, j) => (
              <circle key={j} cx={sx(v)} cy={sy(TAUS[j])} r={4} style={{ fill: C.v1, stroke: C.surface }} strokeWidth={2} />
            ))}
          </g>
        )}
      />
      <div className="mt-3 grid grid-cols-3 gap-2">
        <Stat label={t("measured y", "ölçülen y")} value={`${formatNumber(y, 0, lang)} MW`} />
        <Stat label={t("CRPS = shaded area", "CRPS = taralı alan")} value={`${formatNumber(crps, 1, lang)} MW`} sub={`${formatNumber((100 * crps) / CAP, 1, lang)} % ${t("of capacity", "kapasitenin")}`} />
        <Stat label={t("quantile score (2/9) Σ pinball", "kantil skoru (2/9) Σ pinball")} value={`${formatNumber(qsScore, 1, lang)} MW`} />
      </div>
    </div>
  );
}

// ── 12.3 Reliability ────────────────────────────────────────────────

export function Reliability({ lang }: { lang: Lang }) {
  const t = tt(lang);
  const live = useForecastStore((s) => s.real);
  const rel = live?.reliability ?? DATA.snapshot.reliability;
  const color: Record<string, string> = { "XGBoost (P50)": C.v1, "TFT (P50)": C.v3, Climatology: C.muted };
  const label: Record<string, string> = { "XGBoost (P50)": "XGBoost", "TFT (P50)": "TFT", Climatology: t("Climatology", "Klimatoloji") };
  return (
    <XYChart
      ariaLabel={t("Reliability diagram", "Güvenilirlik diyagramı")}
      height={320}
      x={{ domain: [0, 1], ticks: [0, 0.1, 0.3, 0.5, 0.7, 0.9, 1], format: (v) => `${Math.round(v * 100)}`, title: t("nominal quantile τ [%]", "nominal kantil τ [%]") }}
      y={{ domain: [0, 1], ticks: [0, 0.25, 0.5, 0.75, 1], format: (v) => `${Math.round(v * 100)}`, title: t("observed share below [%]", "altında kalan gözlenen pay [%]") }}
      series={[
        { kind: "line", id: "d", label: t("perfect calibration", "kusursuz kalibrasyon"), color: C.muted, points: [[0, 0], [1, 1]], dash: true, hover: false },
        ...rel.map(
          (r): Series => ({
            kind: "line",
            id: r.name,
            label: `${label[r.name] ?? r.name} · P10–P90 ${formatNumber(r.p10_p90_coverage_pct, 1, lang)} %`,
            color: color[r.name] ?? C.v2,
            points: TAUS.map((tau, i) => [tau, r.observed_below[i]]),
            decimals: 3,
          }),
        ),
      ]}
      hoverLabel={(tau) => `τ = ${formatNumber(tau, 1, lang)}`}
      under={({ sx, sy }) => (
        <g fontSize={10.5} style={{ fill: C.muted }}>
          <text x={sx(0.04)} y={sy(0.9)}>{t("above the diagonal: too many hours below", "köşegenin üstü: altında kalan saat çok fazla")}</text>
          <text x={sx(0.04)} y={sy(0.84)}>{t("the quantile (forecast too high)", "(tahmin çok yüksek)")}</text>
          <text x={sx(0.5)} y={sy(0.12)}>{t("below: forecast too low", "altı: tahmin çok düşük")}</text>
        </g>
      )}
      over={({ sx, sy }) => (
        <g>
          {rel.map((r) =>
            TAUS.map((tau, i) => <circle key={`${r.name}${i}`} cx={sx(tau)} cy={sy(r.observed_below[i])} r={4} style={{ fill: color[r.name] ?? C.v2, stroke: C.surface }} strokeWidth={2} />),
          )}
        </g>
      )}
    />
  );
}

// ── 12.4 Score board ────────────────────────────────────────────────

const SCORE_TR: Record<string, string> = {
  "Ensemble (1/MSE weights)": "Topluluk (1/MSE ağırlıkları)",
  "NWP power curve": "NWP güç eğrisi",
  "Energinet day-ahead (TSO)": "Energinet gün öncesi (İSO)",
  Climatology: "Klimatoloji",
  "Persistence 24 h": "Kalıcılık 24 sa",
};

export function ScoreBoard({ lang }: { lang: Lang }) {
  const t = tt(lang);
  const live = useForecastStore((s) => s.real);
  const rows = [...(live?.scores ?? DATA.snapshot.scores)].sort((a, b) => a.nrmse_pct - b.nrmse_pct);
  const tone = (n: string) => (n.startsWith("XGBoost") ? C.v1 : n.startsWith("Energinet") ? C.accent : n === "Climatology" || n.startsWith("Persistence") ? C.muted : C.v3);
  return (
    <div>
      <HBars
        ariaLabel={t("nRMSE of every forecast on the same hours", "Her tahminin aynı saatlerdeki nRMSE'si")}
        unit="%"
        max={40}
        format={(v) => formatNumber(v, 1, lang)}
        bars={rows.map((r) => ({ label: lang === "tr" ? (SCORE_TR[r.name] ?? r.name) : r.name, note: `${t("skill vs pers.", "kalıcılığa karşı beceri")} ${formatNumber(r.skill_vs_persistence, 2, lang)} · CRPS ${formatNumber(r.crps_pct, 1, lang)} %`, value: r.nrmse_pct, color: tone(r.name) }))}
      />
      <p className="mt-2 text-xs text-text-muted">
        {live
          ? t("Live: the result loaded on the Day-ahead tab.", "Canlı: Gün öncesi sekmesinde yüklenen sonuç.")
          : t(`Snapshot of ${DATA.meta.generated}; open the Day-ahead tab to load the live result.`, `${DATA.meta.generated} anlık görüntüsü; canlı sonuç için Gün öncesi sekmesini açın.`)}
      </p>
    </div>
  );
}

// ── 13.1 Error correlation ──────────────────────────────────────────

export function ErrorCorrelation({ lang }: { lang: Lang }) {
  const t = tt(lang);
  const { names, corr, rmse_mw } = DATA.err_corr;
  const nm = (n: string) => (n === "TSO" ? t("TSO", "İSO") : n === "NWP curve" ? t("NWP curve", "NWP eğrisi") : n);
  return (
    <div className="overflow-x-auto">
      <table className="mx-auto border-separate border-spacing-[3px] text-[12.5px]" role="table" aria-label={t("Correlation of forecast errors", "Tahmin hatalarının korelasyonu")}>
        <thead>
          <tr>
            <th />
            {names.map((n) => (
              <th key={n} className="px-1 pb-1 text-center font-semibold text-text-primary">
                {nm(n)}
              </th>
            ))}
            <th className="pl-3 text-right font-semibold text-text-primary">RMSE</th>
          </tr>
        </thead>
        <tbody>
          {names.map((n, i) => (
            <tr key={n}>
              <th className="pr-2 text-right font-semibold text-text-primary">{nm(n)}</th>
              {corr[i].map((v, j) => {
                // sequential, one hue: more ink = more correlated (0.7 → 1)
                const a = i === j ? 0 : Math.max(0, Math.min(1, (v - 0.7) / 0.3));
                return (
                  <td
                    key={j}
                    className="h-11 w-16 rounded text-center font-mono tabular-nums"
                    style={{
                      background: i === j ? "var(--color-bg-tertiary)" : `color-mix(in srgb, var(--viz-1) ${Math.round(15 + 70 * a)}%, var(--color-bg-primary))`,
                      color: a > 0.6 ? "var(--color-bg-primary)" : "var(--color-text-primary)",
                    }}
                    title={`${nm(names[i])} · ${nm(names[j])}: ρ = ${v.toFixed(3)}`}
                  >
                    {i === j ? "1" : formatNumber(v, 2, lang)}
                  </td>
                );
              })}
              <td className="pl-3 text-right font-mono tabular-nums text-text-secondary">{formatNumber(rmse_mw[i], 0, lang)} MW</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ── 13.2 Two-member ensemble ────────────────────────────────────────

export function EnsembleCalc({ lang }: { lang: Lang }) {
  const t = tt(lang);
  const ec = DATA.err_corr;
  const idx = (n: string) => ec.names.indexOf(n);
  const preset = (a: string, b: string) => ({ sa: ec.rmse_mw[idx(a)], sb: ec.rmse_mw[idx(b)], rho: ec.corr[idx(a)][idx(b)] });
  const PRESETS = { tft: preset("XGBoost", "TFT"), tso: preset("XGBoost", "TSO"), lstm: preset("XGBoost", "LSTM") };
  const [p, setP] = useState<keyof typeof PRESETS | "custom">("tft");
  const [custom, setCustom] = useState({ sa: 150, sb: 180, rho: 0.5 });
  const v = p === "custom" ? custom : PRESETS[p];
  const sigma = (w: number) => Math.sqrt(w * w * v.sa ** 2 + (1 - w) ** 2 * v.sb ** 2 + 2 * w * (1 - w) * v.rho * v.sa * v.sb);
  const wOpt = Math.max(0, Math.min(1, (v.sb ** 2 - v.rho * v.sa * v.sb) / (v.sa ** 2 + v.sb ** 2 - 2 * v.rho * v.sa * v.sb)));
  const wInv = 1 / v.sa ** 2 / (1 / v.sa ** 2 + 1 / v.sb ** 2);
  const ws = Array.from({ length: 101 }, (_, i) => i / 100);
  const f0 = (x: number) => formatNumber(x, 0, lang);
  const f2 = (x: number) => formatNumber(x, 2, lang);
  return (
    <div>
      <Controls>
        <Segmented
          label={t("Pair", "Çift")}
          value={p}
          onChange={setP}
          options={[
            { v: "tft", label: "XGBoost + TFT" },
            { v: "tso", label: t("XGBoost + TSO", "XGBoost + İSO") },
            { v: "lstm", label: "XGBoost + LSTM" },
            { v: "custom", label: t("custom", "özel") },
          ]}
        />
      </Controls>
      {p === "custom" && (
        <Controls>
          <Range label="σ_A" value={custom.sa} min={50} max={300} step={5} onChange={(sa) => setCustom({ ...custom, sa })} format={(x) => `${x} MW`} width="w-28" />
          <Range label="σ_B" value={custom.sb} min={50} max={300} step={5} onChange={(sb) => setCustom({ ...custom, sb })} format={(x) => `${x} MW`} width="w-28" />
          <Range label="ρ" value={custom.rho} min={-0.5} max={1} step={0.05} onChange={(rho) => setCustom({ ...custom, rho })} format={f2} width="w-28" />
        </Controls>
      )}
      <XYChart
        ariaLabel={t("Error of the combination against the weight", "Ağırlığa göre birleşimin hatası")}
        height={270}
        legend={false}
        x={{ domain: [0, 1], ticks: [0, 0.25, 0.5, 0.75, 1], format: f2, title: t("weight w on member A (XGBoost)", "A üyesine (XGBoost) ağırlık w") }}
        y={{ domain: [Math.min(...ws.map(sigma)) * 0.9, Math.max(v.sa, v.sb) * 1.08], title: t("RMSE of w·A + (1−w)·B [MW]", "w·A + (1−w)·B RMSE [MW]") }}
        series={[{ kind: "line", id: "s", label: "RMSE", color: C.ink, points: ws.map((w) => [w, sigma(w)]), unit: "MW", decimals: 1 }]}
        hoverLabel={(w) => `w = ${f2(w)}`}
        over={({ sx, sy }) => (
          <g>
            <circle cx={sx(wOpt)} cy={sy(sigma(wOpt))} r={5} style={{ fill: C.good, stroke: C.surface }} strokeWidth={2} />
            <circle cx={sx(wInv)} cy={sy(sigma(wInv))} r={5} style={{ fill: C.v2, stroke: C.surface }} strokeWidth={2} />
            <circle cx={sx(1)} cy={sy(v.sa)} r={5} style={{ fill: C.v1, stroke: C.surface }} strokeWidth={2} />
          </g>
        )}
      />
      <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Stat label={t("A alone (w = 1)", "yalnız A (w = 1)")} value={`${f0(v.sa)} MW`} />
        <Stat label={t("1/MSE weight", "1/MSE ağırlığı")} value={`${f0(sigma(wInv))} MW`} sub={`w = ${f2(wInv)}`} tone={sigma(wInv) > v.sa ? "bad" : "good"} />
        <Stat label={t("optimal weight", "en iyi ağırlık")} value={`${f0(sigma(wOpt))} MW`} sub={`w* = ${f2(wOpt)}`} tone="good" />
        <Stat label={t("error correlation ρ", "hata korelasyonu ρ")} value={f2(v.rho)} />
      </div>
      <p className="mt-2 text-xs text-text-muted">
        {t(
          "Dots: blue = XGBoost alone, orange = inverse-MSE weights (as on the Day-ahead tab), green = the best weight for this pair. Real σ and ρ from the test hours; the formula assumes unbiased members.",
          "Noktalar: mavi = yalnız XGBoost, turuncu = ters MSE ağırlıkları (Gün öncesi sekmesindeki gibi), yeşil = bu çift için en iyi ağırlık. Gerçek σ ve ρ test saatlerinden; formül yansız üyeler varsayar.",
        )}
      </p>
    </div>
  );
}

// ── 13.3 SHAP ───────────────────────────────────────────────────────

export function ShapWaterfall({ lang }: { lang: Lang }) {
  const t = tt(lang);
  const hours = DATA.shap_hours;
  const [k, setK] = useState(1);
  const h = hours[k];
  const names = DATA.feature_names;
  const order = names.map((_, i) => i).sort((a, b) => Math.abs(h.contrib_mw[b]) - Math.abs(h.contrib_mw[a]));
  const top = order.slice(0, 6);
  const rest = order.slice(6).reduce((s, i) => s + h.contrib_mw[i], 0);
  const steps = [...top.map((i) => ({ label: featureLabel(names[i], lang), value: h.contrib_mw[i], x: h.x[i] })), { label: t(`other ${order.length - 6} features`, `diğer ${order.length - 6} özellik`), value: rest, x: NaN }];
  const [ref, width] = useWidth<HTMLDivElement>();
  const left = Math.min(200, width * 0.42);
  const right = 16;
  // running total before each step
  const start: number[] = [];
  let total = h.base_mw;
  for (const st of steps) {
    start.push(total);
    total += st.value;
  }
  const ends = start.map((v, i) => v + steps[i].value);
  const lo = Math.min(0, h.base_mw, ...ends);
  const hi = Math.max(h.base_mw, ...ends, h.actual_mw) * 1.05;
  const sx = (v: number) => left + ((v - lo) / (hi - lo)) * (width - left - right);
  const rowH = 30;
  const H = (steps.length + 2) * rowH + 30;
  const f0 = (v: number) => formatNumber(v, 0, lang);
  const lbl: Record<string, string> = { calm: t("calm", "sakin"), ramp: t("ramp", "rampa"), storm: t("storm", "fırtına") };
  return (
    <div ref={ref}>
      <Controls>
        <Segmented label={t("Hour", "Saat")} value={k} onChange={setK} options={hours.map((x, i) => ({ v: i, label: `${lbl[x.label] ?? x.label} · ${x.time_utc.slice(5, 10)} ${x.time_utc.slice(11, 16)}` }))} />
      </Controls>
      <svg width={width} height={H} role="img" aria-label={t("SHAP decomposition of one forecast", "Bir tahminin SHAP ayrışımı")} className="block">
        <text x={left - 8} y={rowH * 0.5 + 8} textAnchor="end" fontSize={11.5} style={{ fill: C.ink }}>
          {t("expected value E[f(x)]", "beklenen değer E[f(x)]")}
        </text>
        <rect x={sx(Math.min(0, lo))} y={rowH * 0.5 - 4} width={sx(h.base_mw) - sx(Math.min(0, lo))} height={18} rx={3} style={{ fill: C.muted }} opacity={0.5} />
        <text x={sx(h.base_mw) + 6} y={rowH * 0.5 + 9} fontSize={11.5} style={{ fill: C.ink, fontVariantNumeric: "tabular-nums" }}>
          {f0(h.base_mw)} MW
        </text>
        {steps.map((s, i) => {
          const y = (i + 1.5) * rowH;
          const a = start[i];
          const x0 = sx(Math.min(a, ends[i]));
          const x1 = sx(Math.max(a, ends[i]));
          const up = s.value >= 0;
          return (
            <g key={s.label}>
              <line x1={sx(a)} x2={sx(a)} y1={y - rowH + 14} y2={y - 4} style={{ stroke: C.axis }} strokeDasharray="2 2" />
              <text x={left - 8} y={y + 9} textAnchor="end" fontSize={11.5} style={{ fill: C.ink }}>
                {s.label}
                {Number.isFinite(s.x) && <tspan style={{ fill: C.muted }}> = {formatNumber(s.x, 1, lang)}</tspan>}
              </text>
              <rect x={x0} y={y - 4} width={Math.max(1.5, x1 - x0)} height={18} rx={3} style={{ fill: up ? C.v1 : C.v2 }} />
              <text x={up ? x1 + 6 : x0 - 6} y={y + 9} textAnchor={up ? "start" : "end"} fontSize={11} style={{ fill: C.ink, fontVariantNumeric: "tabular-nums" }}>
                {up ? "+" : "−"}
                {f0(Math.abs(s.value))}
              </text>
            </g>
          );
        })}
        {(() => {
          const y = (steps.length + 1.5) * rowH;
          return (
            <g>
              <line x1={left} x2={width - right} y1={y - 8} y2={y - 8} style={{ stroke: C.axis }} />
              <text x={left - 8} y={y + 9} textAnchor="end" fontSize={11.5} fontWeight={650} style={{ fill: C.ink }}>
                {t("forecast P50 f(x)", "tahmin P50 f(x)")}
              </text>
              <rect x={sx(Math.min(0, lo))} y={y - 4} width={sx(h.p50_mw) - sx(Math.min(0, lo))} height={18} rx={3} style={{ fill: C.ink2 }} />
              <text x={sx(h.p50_mw) + 6} y={y + 9} fontSize={11.5} fontWeight={650} style={{ fill: C.ink, fontVariantNumeric: "tabular-nums" }}>
                {f0(h.p50_mw)} MW
              </text>
              <line x1={sx(h.actual_mw)} x2={sx(h.actual_mw)} y1={8} y2={y + 18} style={{ stroke: C.accent }} strokeWidth={1.5} strokeDasharray="5 3" />
              <text x={sx(h.actual_mw) + (sx(h.actual_mw) > width * 0.7 ? -4 : 4)} y={H - 4} textAnchor={sx(h.actual_mw) > width * 0.7 ? "end" : "start"} fontSize={11} style={{ fill: C.ink2 }}>
                {t(`measured ${f0(h.actual_mw)} MW`, `ölçülen ${f0(h.actual_mw)} MW`)}
              </text>
            </g>
          );
        })()}
      </svg>
    </div>
  );
}

export function ShapGlobal({ lang }: { lang: Lang }) {
  const t = tt(lang);
  const live = useForecastStore((s) => s.real);
  const imp = live?.feature_importance ?? DATA.snapshot.importance;
  return (
    <HBars
      ariaLabel={t("Share of mean absolute SHAP per feature", "Özellik başına ortalama mutlak SHAP payı")}
      unit="%"
      max={40}
      format={(v) => formatNumber(v, 1, lang)}
      bars={imp.slice(0, 8).map((f) => ({ label: featureLabel(f.feature, lang), value: 100 * f.shap_share, color: f.feature.endsWith("_ws") ? C.v1 : C.v3 }))}
    />
  );
}
