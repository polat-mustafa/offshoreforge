/**
 * Figures of Part I — the forecasting problem (chapters 1–3).
 *
 *   MarketTimeline      D−1 → D: NWP runs, day-ahead gate closure, intraday, delivery,
 *                       imbalance settlement (diagram)
 *   RealWeekImbalance   one measured DK2 week vs a chosen forecast; imbalance energy and
 *                       its cost at a chosen spread (real data)
 *   ForecastChain       observations → NWP → hub-height wind → power → farm → bid (diagram)
 *   PowerCurveScatter   day-ahead NWP wind vs measured farm power, binned curve (real data)
 *   ErrorAmplification  how the power curve turns a wind error into a power error
 *   ErrorByWind         RMSE per bin of forecast wind (real data)
 *   HorizonSkill        error vs lead time of persistence, the Nielsen reference and
 *                       climatology from the measured autocorrelation, with the day-ahead
 *                       models (real data)
 */

import { useMemo, useState } from "react";

import { turbinePowerMW } from "../../../../utils/landingPhysics";
import { C, useArrows } from "../charts/core";
import { Controls, Range, Segmented, Stat, Wide, XYChart, type Series } from "../charts/kit";
import { DATA, formatNumber } from "../course/facts";
import type { Lang } from "../course/types";
import { CAP, WEEK, WEEK_X, between, num, tt, weekLabel, weekTicks } from "./common";

// ── 1.1 Market timeline ─────────────────────────────────────────────

export function MarketTimeline({ lang }: { lang: Lang }) {
  const t = tt(lang);
  const { defs, url } = useArrows();
  const W = 860;
  const x0 = 120;
  const x1 = W - 20;
  // hours from D−1 00:00 (CET) to D+1 12:00
  const hx = (h: number) => x0 + ((h + 0) / 60) * (x1 - x0);
  const lane = (y: number, label: string, sub: string) => (
    <g>
      <text x={8} y={y + 4} fontSize={12} fontWeight={650} style={{ fill: C.ink }}>
        {label}
      </text>
      <text x={8} y={y + 19} fontSize={10.5} style={{ fill: C.muted }}>
        {sub}
      </text>
      <line x1={x0} x2={x1} y1={y + 8} y2={y + 8} style={{ stroke: C.grid }} />
    </g>
  );
  // labels right of the marker, or left of it near the right edge
  const event = (h: number, y: number, title: string, sub: string, tone: string, up = false, left = false) => (
    <g>
      <line x1={hx(h)} x2={hx(h)} y1={y - 2} y2={y + 18} style={{ stroke: tone }} strokeWidth={2} />
      <circle cx={hx(h)} cy={y + 8} r={4.5} style={{ fill: tone, stroke: C.surface }} strokeWidth={2} />
      <text x={hx(h) + (left ? -7 : 7)} y={up ? y - 14 : y + 32} textAnchor={left ? "end" : "start"} fontSize={11.5} fontWeight={650} style={{ fill: C.ink }}>
        {title}
      </text>
      <text x={hx(h) + (left ? -7 : 7)} y={up ? y - 1 : y + 45} textAnchor={left ? "end" : "start"} fontSize={10.5} style={{ fill: C.muted }}>
        {sub}
      </text>
    </g>
  );
  return (
    <Wide minWidth={760}>
      <svg viewBox={`0 0 ${W} 362`} className="w-full" role="img" aria-label={t("Timeline from the weather run to imbalance settlement", "Hava modeli koşusundan dengesizlik uzlaştırmasına zaman çizelgesi")}>
        {defs}
        {/* day bands */}
        <rect x={hx(0)} y={18} width={hx(24) - hx(0)} height={314} rx={4} style={{ fill: C.panel }} opacity={0.55} />
        <rect x={hx(24)} y={18} width={hx(48) - hx(24)} height={314} rx={4} style={{ fill: "color-mix(in srgb, var(--viz-1) 10%, transparent)" }} />
        <text x={hx(12)} y={34} textAnchor="middle" fontSize={12} fontWeight={700} style={{ fill: C.ink2 }}>
          {t("Day D−1 (planning)", "D−1 günü (planlama)")}
        </text>
        <text x={hx(36)} y={34} textAnchor="middle" fontSize={12} fontWeight={700} style={{ fill: C.ink2 }}>
          {t("Day D (delivery)", "D günü (teslimat)")}
        </text>
        <text x={hx(54)} y={34} textAnchor="middle" fontSize={12} fontWeight={700} style={{ fill: C.ink2 }}>
          D+1…
        </text>

        {lane(70, t("Weather & forecast", "Hava & tahmin"), t("NWP centres, forecaster", "NWP merkezleri, tahminci"))}
        {lane(170, t("Market", "Piyasa"), t("power exchange (TGE / SDAC, SIDC)", "enerji borsası (TGE / SDAC, SIDC)"))}
        {lane(282, t("Grid & settlement", "Şebeke & uzlaştırma"), t("TSO (PSE)", "İSO (PSE)"))}

        {event(1, 70, t("00 UTC NWP run", "00 UTC NWP koşusu"), t("ECMWF IFS, DWD ICON", "ECMWF IFS, DWD ICON"), C.v3, true)}
        {event(9, 70, t("Forecast run", "Tahmin koşusu"), t("NWP → power, P10…P90", "NWP → güç, P10…P90"), C.v1)}
        {event(12, 170, t("12:00 gate closure", "12:00 kapı kapanışı"), t("day-ahead bid (24 h × MTU)", "gün öncesi teklif (24 sa × MTU)"), C.accent, true)}
        {event(15, 170, t("Intraday opens", "Gün içi açılır"), t("continuous trading until ≈ 1 h before delivery", "teslimattan ≈ 1 sa öncesine kadar sürekli ticaret"), C.v2)}
        {event(24, 282, t("Delivery 00:00–24:00", "Teslimat 00:00–24:00"), t("TSO balances every second (50 Hz)", "İSO her saniye dengeler (50 Hz)"), C.v1, true)}
        {event(50, 282, t("Imbalance settlement", "Dengesizlik uzlaştırması"), t("per 15-min period, imbalance price", "15 dk'lık dönem başına, dengesizlik fiyatı"), C.bad, false, true)}

        {/* horizon arrow: gate → delivery hours */}
        <line x1={hx(12)} x2={hx(24)} y1={240} y2={240} style={{ stroke: C.ink2 }} strokeWidth={1.2} markerEnd={url("ink")} />
        <line x1={hx(24)} x2={hx(48)} y1={240} y2={240} style={{ stroke: C.ink2 }} strokeWidth={1.2} strokeDasharray="4 3" />
        <text x={hx(18)} y={234} textAnchor="middle" fontSize={10.5} style={{ fill: C.ink2 }}>
          {t("lead 12 h …", "öncü süre 12 sa …")}
        </text>
        <text x={hx(36)} y={234} textAnchor="middle" fontSize={10.5} style={{ fill: C.ink2 }}>
          {t("… 36 h to the last hour of D", "… D'nin son saatine 36 sa")}
        </text>

        {/* axis */}
        {[0, 6, 12, 18, 24, 30, 36, 42, 48, 54, 60].map((h) => (
          <g key={h}>
            <line x1={hx(h)} x2={hx(h)} y1={332} y2={337} style={{ stroke: C.axis }} />
            <text x={hx(h)} y={351} textAnchor="middle" fontSize={10.5} style={{ fill: C.muted }}>
              {`${String(h % 24).padStart(2, "0")}:00`}
            </text>
          </g>
        ))}
        <line x1={x0} x2={x1} y1={332} y2={332} style={{ stroke: C.axis }} />
      </svg>
    </Wide>
  );
}

// ── 1.2 Real week: imbalance ────────────────────────────────────────

type WeekForecast = "xgb" | "tso" | "curve" | "pers";

const forecastOf = (k: WeekForecast) =>
  k === "xgb" ? WEEK.xgb_q_mw[4] : k === "tso" ? WEEK.tso_mw : k === "curve" ? WEEK.curve_mw : WEEK.persistence_mw;

export function RealWeekImbalance({ lang }: { lang: Lang }) {
  const t = tt(lang);
  const [k, setK] = useState<WeekForecast>("xgb");
  const [price, setPrice] = useState(60);
  const f = forecastOf(k);
  const a = WEEK.actual_mw;
  const names: Record<WeekForecast, string> = {
    xgb: t("XGBoost P50 (this platform)", "XGBoost P50 (bu platform)"),
    tso: t("Energinet day-ahead (TSO)", "Energinet gün öncesi (İSO)"),
    curve: t("NWP power curve (physics only)", "NWP güç eğrisi (yalnızca fizik)"),
    pers: t("Persistence 24 h", "Kalıcılık 24 sa"),
  };
  const stats = useMemo(() => {
    let short = 0;
    let long = 0;
    let n = 0;
    for (let i = 0; i < a.length; i++) {
      const ai = a[i];
      const fi = f[i];
      if (!num(ai) || !num(fi)) continue;
      n += 1;
      if (fi > ai) short += fi - ai;
      else long += ai - fi;
    }
    return { short, long, n, nmae: (100 * (short + long)) / n / CAP };
  }, [a, f]);
  const areas = useMemo(() => between(WEEK_X, f, a), [f, a]);
  const { ticks, format } = weekTicks(lang);
  const series: Series[] = [
    { kind: "line", id: "f", label: names[k], color: C.v1, points: WEEK_X.map((x) => [x, f[x]]), unit: "MW" },
    { kind: "line", id: "a", label: t("Measured output", "Ölçülmüş üretim"), color: C.ink, points: WEEK_X.map((x) => [x, a[x]]), unit: "MW" },
  ];
  const fmt0 = (v: number) => formatNumber(v, 0, lang);
  return (
    <div>
      <Controls>
        <Segmented
          label={t("Forecast", "Tahmin")}
          value={k}
          onChange={setK}
          options={[
            { v: "xgb", label: "XGBoost" },
            { v: "tso", label: t("TSO", "İSO") },
            { v: "curve", label: t("NWP curve", "NWP eğrisi") },
            { v: "pers", label: t("Persistence", "Kalıcılık") },
          ]}
        />
        <Range label={t("imbalance spread λ", "dengesizlik farkı λ")} value={price} min={10} max={200} step={5} onChange={setPrice} format={(v) => `${v} €/MWh`} />
      </Controls>
      <XYChart
        ariaLabel={t("Measured DK2 offshore output and a day-ahead forecast over one week", "Bir hafta boyunca ölçülmüş DK2 açık deniz üretimi ve gün öncesi tahmin")}
        height={300}
        x={{ domain: [0, WEEK_X.length - 1], ticks, format }}
        y={{ domain: [0, 1000], title: t("power [MW]", "güç [MW]") }}
        series={series}
        hoverLabel={(i) => weekLabel(i, lang)}
        under={({ sx, sy }) =>
          areas.map((ar, i) => (
            <path
              key={i}
              d={ar.pts.map(([x, y], j) => `${j ? "L" : "M"}${sx(x).toFixed(1)},${sy(y).toFixed(1)}`).join("") + "Z"}
              style={{ fill: ar.sign > 0 ? C.v2 : C.v3 }}
              opacity={0.28}
            />
          ))
        }
      />
      <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-text-secondary">
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-4 rounded-sm" style={{ background: C.v2, opacity: 0.45 }} />
          {t("forecast above measured: sold energy not delivered (short)", "tahmin ölçümün üstünde: satılan enerji teslim edilmedi (açık)")}
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-4 rounded-sm" style={{ background: C.v3, opacity: 0.45 }} />
          {t("forecast below measured: unsold surplus (long)", "tahmin ölçümün altında: satılmamış fazla (fazla)")}
        </span>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Stat label={t("short [MWh]", "açık [MWh]")} value={fmt0(stats.short)} />
        <Stat label={t("long [MWh]", "fazla [MWh]")} value={fmt0(stats.long)} />
        <Stat label="nMAE" value={`${formatNumber(stats.nmae, 1, lang)} %`} sub={t("of 977 MW capacity", "977 MW kapasitenin")} />
        <Stat label={t("imbalance cost, this week", "dengesizlik maliyeti, bu hafta")} value={`${fmt0(((stats.short + stats.long) * price) / 1000)} k€`} sub={`|ΔE| × ${price} €/MWh`} />
      </div>
    </div>
  );
}

// ── 2.1 Forecast chain ──────────────────────────────────────────────

export function ForecastChain({ lang }: { lang: Lang }) {
  const t = tt(lang);
  const { defs, url } = useArrows();
  const steps: [string, string, string][] = [
    [t("Observations", "Gözlemler"), t("satellites, radiosondes,", "uydular, radyosondalar,"), t("buoys, aircraft", "şamandıralar, uçaklar")],
    [t("Data assimilation", "Veri özümleme"), t("4D-Var: best estimate", "4D-Var: atmosferin"), t("of the atmosphere now", "şimdiki en iyi tahmini")],
    [t("Global NWP", "Küresel NWP"), t("ECMWF IFS, DWD ICON", "ECMWF IFS, DWD ICON"), t("primitive equations", "temel denklemler")],
    [t("Site wind", "Saha rüzgârı"), t("100 m wind per farm,", "santral başına 100 m rüzgâr,"), t("lead 24–47 h", "öncü süre 24–47 sa")],
    [t("Power conversion", "Güce dönüşüm"), t("power curve or ML:", "güç eğrisi ya da ML:"), t("XGBoost, LSTM, TFT", "XGBoost, LSTM, TFT")],
    [t("Farm & market", "Santral & piyasa"), t("availability, wakes,", "kullanılabilirlik, iz,"), t("curtailment → bid", "kısıntı → teklif")],
  ];
  const W = 900;
  const bw = 128;
  const gap = (W - 20 - steps.length * bw) / (steps.length - 1);
  return (
    <Wide minWidth={780}>
      <svg viewBox={`0 0 ${W} 190`} className="w-full" role="img" aria-label={t("The forecasting chain from observations to the bid", "Gözlemlerden teklife tahmin zinciri")}>
        {defs}
        <text x={10} y={20} fontSize={11} fontWeight={700} letterSpacing={0.6} style={{ fill: C.muted }}>
          {t("WEATHER CENTRES (hours, supercomputers)", "HAVA MERKEZLERİ (saatler, süper bilgisayarlar)")}
        </text>
        <text x={10 + 3 * (bw + gap)} y={20} fontSize={11} fontWeight={700} letterSpacing={0.6} style={{ fill: C.muted }}>
          {t("FORECASTER (minutes, this platform)", "TAHMİNCİ (dakikalar, bu platform)")}
        </text>
        {steps.map(([title, s1, s2], i) => {
          const x = 10 + i * (bw + gap);
          const tone = i < 3 ? C.v3 : i === 4 ? C.accent : C.v1;
          return (
            <g key={title}>
              <rect x={x} y={36} width={bw} height={92} rx={6} style={{ fill: C.panel, stroke: tone }} strokeWidth={i === 4 ? 2 : 1.3} />
              <text x={x + 10} y={56} fontSize={10} fontWeight={700} style={{ fill: C.muted, fontFamily: "var(--font-mono)" }}>
                {String(i + 1).padStart(2, "0")}
              </text>
              <text x={x + bw / 2} y={80} textAnchor="middle" fontSize={12.5} fontWeight={650} style={{ fill: C.ink }}>
                {title}
              </text>
              <text x={x + bw / 2} y={99} textAnchor="middle" fontSize={10.5} style={{ fill: C.muted }}>
                {s1}
              </text>
              <text x={x + bw / 2} y={113} textAnchor="middle" fontSize={10.5} style={{ fill: C.muted }}>
                {s2}
              </text>
              {i < steps.length - 1 && (
                <line x1={x + bw + 3} x2={x + bw + gap - 4} y1={82} y2={82} style={{ stroke: C.ink2 }} strokeWidth={1.4} markerEnd={url("ink")} />
              )}
            </g>
          );
        })}
        {/* error sources */}
        <text x={10} y={156} fontSize={11} fontWeight={650} style={{ fill: C.ink2 }}>
          {t("Where the error comes from:", "Hata nereden gelir:")}
        </text>
        <text x={10} y={174} fontSize={10.5} style={{ fill: C.muted }}>
          {t(
            "initial-state error grows with lead time (chaos) · coarse grid misses local flow · power curve is steep between cut-in and rated · wakes, outages and curtailment are not in the weather",
            "başlangıç durumu hatası öncü süreyle büyür (kaos) · kaba ızgara yerel akışı kaçırır · güç eğrisi devreye girme ile nominal arasında diktir · iz, arıza ve kısıntı havada yoktur",
          )}
        </text>
      </svg>
    </Wide>
  );
}

// ── 2.2 Power curve scatter ─────────────────────────────────────────

export function PowerCurveScatter({ lang }: { lang: Lang }) {
  const t = tt(lang);
  const { ws, p_mw, bins } = DATA.scatter;
  const pts = ws.map((w, i) => [w ?? NaN, p_mw[i]] as [number, number | null]).filter(([w]) => Number.isFinite(w));
  const every = Math.round(DATA.meta.hours / ws.length);
  const ref = Array.from({ length: 101 }, (_, i) => i * 0.2).map((u) => [u, (turbinePowerMW(u) / 15) * CAP] as [number, number]);
  const series: Series[] = [
    { kind: "scatter", id: "s", label: t(`hours (1 in ${every} shown)`, `saatler (${every}'te 1'i gösteriliyor)`), color: C.ink2, points: pts, r: 1.8, opacity: 0.32 },
    { kind: "band", id: "b", label: t("P10–P90 per 1 m/s bin", "1 m/s'lik dilim başına P10–P90"), color: C.v1, lower: bins.map((b) => [b.ws, b.p10_mw]), upper: bins.map((b) => [b.ws, b.p90_mw]), opacity: 0.2 },
    { kind: "line", id: "m", label: t("empirical farm curve (bin mean)", "deneysel santral eğrisi (dilim ortalaması)"), color: C.v1, points: bins.map((b) => [b.ws, b.mean_mw]), width: 2.5, unit: "MW" },
    { kind: "line", id: "r", label: t("single IEA 15 MW turbine, scaled", "tek IEA 15 MW türbin, ölçekli"), color: C.v2, points: ref, dash: true, hover: false, curve: false },
  ];
  return (
    <XYChart
      ariaLabel={t("Day-ahead NWP wind against measured farm power", "Gün öncesi NWP rüzgârına karşı ölçülmüş santral gücü")}
      height={320}
      x={{ domain: [0, 20], title: t("day-ahead NWP wind at 100 m, mean of 4 runs [m/s]", "100 m'de gün öncesi NWP rüzgârı, 4 koşu ortalaması [m/s]") }}
      y={{ domain: [0, 1000], title: t("measured power [MW]", "ölçülmüş güç [MW]") }}
      series={series}
      hoverLabel={(u) => `${formatNumber(u - 0.5, 0, lang)}–${formatNumber(u + 0.5, 0, lang)} m/s`}
    />
  );
}

// ── 2.3 Error amplification ─────────────────────────────────────────

export function ErrorAmplification({ lang }: { lang: Lang }) {
  const t = tt(lang);
  const [u0, setU0] = useState(8);
  const [su, setSu] = useState(1);
  const curve = Array.from({ length: 141 }, (_, i) => i * 0.2).map((u) => [u, turbinePowerMW(u)] as [number, number]);
  const lo = Math.max(0, u0 - su);
  const hi = u0 + su;
  const pLo = turbinePowerMW(lo);
  const pHi = turbinePowerMW(hi);
  const p0 = turbinePowerMW(u0);
  const slope = (turbinePowerMW(u0 + 0.05) - turbinePowerMW(u0 - 0.05)) / 0.1;
  const range = Math.abs(pHi - pLo);
  const f1 = (v: number) => formatNumber(v, 1, lang);
  const f2 = (v: number) => formatNumber(v, 2, lang);
  return (
    <div>
      <Controls>
        <Range label={t("forecast wind u", "tahmin rüzgârı u")} value={u0} min={3} max={26} step={0.1} onChange={setU0} format={(v) => `${f1(v)} m/s`} />
        <Range label={t("wind error ±δu", "rüzgâr hatası ±δu")} value={su} min={0.2} max={3} step={0.1} onChange={setSu} format={(v) => `${f1(v)} m/s`} />
      </Controls>
      <XYChart
        ariaLabel={t("A wind error mapped through the IEA 15 MW power curve", "IEA 15 MW güç eğrisinden geçirilen rüzgâr hatası")}
        height={290}
        legend={false}
        x={{ domain: [0, 28], title: t("wind speed at hub height [m/s]", "göbek yüksekliğinde rüzgâr hızı [m/s]") }}
        y={{ domain: [0, 16], title: t("power of one turbine [MW]", "tek türbinin gücü [MW]") }}
        series={[{ kind: "line", id: "c", label: "IEA-15-240-RWT", color: C.ink, points: curve, hover: false }]}
        under={({ sx, sy, m, h, w }) => (
          <g>
            <rect x={sx(lo)} y={m.t} width={sx(hi) - sx(lo)} height={h - m.t - m.b} style={{ fill: C.v1 }} opacity={0.14} />
            <rect x={m.l} y={sy(Math.max(pLo, pHi))} width={w - m.l - m.r} height={Math.max(1, sy(Math.min(pLo, pHi)) - sy(Math.max(pLo, pHi)))} style={{ fill: C.v2 }} opacity={0.16} />
          </g>
        )}
        over={({ sx, sy, m }) => (
          <g>
            <line x1={sx(u0)} x2={sx(u0)} y1={sy(0)} y2={sy(p0)} style={{ stroke: C.v1 }} strokeWidth={1.5} strokeDasharray="4 3" />
            <line x1={m.l} x2={sx(u0)} y1={sy(p0)} y2={sy(p0)} style={{ stroke: C.v2 }} strokeWidth={1.5} strokeDasharray="4 3" />
            <circle cx={sx(u0)} cy={sy(p0)} r={5} style={{ fill: C.accent, stroke: C.surface }} strokeWidth={2} />
            <text x={sx(3)} y={sy(15) + 16} fontSize={11} style={{ fill: C.muted }}>
              {t("cut-in 3 · rated 10.66 · cut-out 25 m/s", "devreye girme 3 · nominal 10,66 · devreden çıkma 25 m/s")}
            </text>
          </g>
        )}
      />
      <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Stat label={t("P at the forecast wind", "Tahmin rüzgârında P")} value={`${f2(p0)} MW`} />
        <Stat label={t("slope dP/du", "eğim dP/du")} value={`${f2(slope)}`} sub="MW per m/s" />
        <Stat label={t("power range for ±δu", "±δu için güç aralığı")} value={`${f2(range)} MW`} sub={`${formatNumber((100 * range) / 15, 0, lang)} % ${t("of rated", "nominalin")}`} tone={range > 4 ? "bad" : range > 1.5 ? "warn" : "good"} />
        <Stat label={t("34 turbines (SB-510)", "34 türbin (SB-510)")} value={`${formatNumber(34 * range, 0, lang)} MW`} sub={t("if all err alike, no wakes", "hepsi aynı yanılırsa, iz yok")} />
      </div>
    </div>
  );
}

// ── 2.4 Error by wind ───────────────────────────────────────────────

export function ErrorByWind({ lang }: { lang: Lang }) {
  const t = tt(lang);
  const rows = DATA.err_by_ws.filter((r) => r.n >= 100);
  return (
    <XYChart
      ariaLabel={t("Forecast error per bin of forecast wind", "Tahmin rüzgârı dilimi başına tahmin hatası")}
      height={280}
      x={{ domain: [0, 18], title: t("day-ahead NWP wind [m/s]", "gün öncesi NWP rüzgârı [m/s]") }}
      y={{ domain: [0, 360], title: t("RMSE [MW]", "RMSE [MW]") }}
      series={[
        { kind: "line", id: "x", label: t("XGBoost P50", "XGBoost P50"), color: C.v1, points: rows.map((r) => [r.ws, r.xgb]), unit: "MW" },
        { kind: "line", id: "c", label: t("NWP power curve", "NWP güç eğrisi"), color: C.v2, points: rows.map((r) => [r.ws, r.curve]), unit: "MW" },
      ]}
      hoverLabel={(u) => {
        const r = rows.find((x) => x.ws === u);
        return `${formatNumber(u - 0.5, 0, lang)}–${formatNumber(u + 0.5, 0, lang)} m/s · n = ${r?.n ?? "—"}`;
      }}
    />
  );
}

// ── 3.1 Error vs lead time ──────────────────────────────────────────

export function HorizonSkill({ lang }: { lang: Lang }) {
  const t = tt(lang);
  const rho = DATA.acf.power;
  // σ of the output, in % of capacity: the climatology RMSE is the best available estimate
  const sig = DATA.snapshot.scores.find((s) => s.name === "Climatology")?.nrmse_pct ?? 32;
  const xgb = DATA.snapshot.scores[0].nrmse_pct;
  const tso = DATA.snapshot.scores.find((s) => s.name.startsWith("Energinet"))?.nrmse_pct ?? NaN;
  const lags = Array.from({ length: 49 }, (_, k) => k);
  const pers = lags.map((k) => [k, sig * Math.sqrt(2 * (1 - rho[k]))] as [number, number]);
  const ref = lags.map((k) => [k, sig * Math.sqrt(1 - rho[k] ** 2)] as [number, number]);
  return (
    <XYChart
      ariaLabel={t("Forecast error against lead time", "Öncü süreye göre tahmin hatası")}
      height={300}
      x={{ domain: [0, 48], ticks: [0, 6, 12, 18, 24, 30, 36, 42, 48], title: t("lead time k [h]", "öncü süre k [sa]") }}
      y={{ domain: [0, 50], title: t("RMSE [% of capacity]", "RMSE [kapasitenin %'si]") }}
      series={[
        { kind: "line", id: "p", label: t("persistence  σ√(2(1−ρₖ))", "kalıcılık  σ√(2(1−ρₖ))"), color: C.v2, points: pers, unit: "%", decimals: 1 },
        { kind: "line", id: "n", label: t("Nielsen reference  σ√(1−ρₖ²)", "Nielsen referansı  σ√(1−ρₖ²)"), color: C.v3, points: ref, unit: "%", decimals: 1 },
        { kind: "line", id: "c", label: t("climatology  σ", "klimatoloji  σ"), color: C.muted, points: lags.map((k) => [k, sig]), dash: true, unit: "%", decimals: 1 },
      ]}
      hoverLabel={(k) => `k = ${k} h · ρₖ = ${formatNumber(rho[k], 2, lang)}`}
      over={({ sx, sy }) => (
        <g>
          {(
            [
              // the lower line gets its label below, the upper one above
              [xgb, C.v1, t(`XGBoost day-ahead ${formatNumber(xgb, 1, lang)} %`, `XGBoost gün öncesi %${formatNumber(xgb, 1, lang)}`), xgb < tso ? 17 : -8],
              [tso, C.accent, t(`TSO day-ahead ${formatNumber(tso, 1, lang)} %`, `İSO gün öncesi %${formatNumber(tso, 1, lang)}`), xgb < tso ? -8 : 17],
            ] as const
          ).map(([v, c, label, dy]) => (
            <g key={label}>
              <line x1={sx(24)} x2={sx(47)} y1={sy(v)} y2={sy(v)} style={{ stroke: c }} strokeWidth={5} strokeLinecap="round" />
              <text x={sx(24)} y={sy(v) + dy} fontSize={11} fontWeight={600} style={{ fill: C.ink }}>
                {label}
              </text>
            </g>
          ))}
        </g>
      )}
    />
  );
}
