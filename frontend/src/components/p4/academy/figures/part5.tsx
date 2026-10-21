/**
 * Figures of Part V — in operation (chapter 14).
 *
 *   Pipeline    the platform's forecasting pipeline with the files that implement it
 *   OpsCycle    one operating day of a forecasting desk for SB-510 (diagram)
 *   FoldTrend   nRMSE of each forecast per test fold, in time order (real data)
 */

import { useForecastStore } from "../../../../store/forecastStore";
import { C, useArrows } from "../charts/core";
import { Wide, XYChart } from "../charts/kit";
import { DATA, formatNumber } from "../course/facts";
import type { Lang } from "../course/types";
import { tt, utc } from "./common";

// ── 14.1 Pipeline ───────────────────────────────────────────────────

export function Pipeline({ lang }: { lang: Lang }) {
  const t = tt(lang);
  const { defs, url } = useArrows();
  const W = 940;
  const box = (x: number, y: number, w: number, h: number, title: string, file: string, tone: string, sub?: string) => (
    <g>
      <rect x={x} y={y} width={w} height={h} rx={6} style={{ fill: C.panel, stroke: tone }} strokeWidth={1.5} />
      <text x={x + 10} y={y + 20} fontSize={12.5} fontWeight={650} style={{ fill: C.ink }}>
        {title}
      </text>
      {sub && (
        <text x={x + 10} y={y + 36} fontSize={10.5} style={{ fill: C.muted }}>
          {sub}
        </text>
      )}
      <text x={x + 10} y={y + h - 9} fontSize={9} style={{ fill: C.ink2, fontFamily: "var(--font-mono)" }}>
        {file}
      </text>
    </g>
  );
  const arr = (d: string, tone: "ink" | "accent" | "muted" = "ink", dash = false) => (
    <path d={d} fill="none" style={{ stroke: tone === "ink" ? C.ink2 : tone === "accent" ? C.accent : C.muted }} strokeWidth={1.5} strokeDasharray={dash ? "5 4" : undefined} markerEnd={url(tone)} />
  );
  return (
    <Wide minWidth={780}>
      <svg viewBox={`0 0 ${W} 420`} className="w-full" role="img" aria-label={t("The forecasting pipeline of this platform", "Bu platformun tahmin hattı")}>
        {defs}
        <text x={10} y={18} fontSize={10.5} fontWeight={700} letterSpacing={0.6} style={{ fill: C.muted }}>
          {t("OFFLINE — run once, results bundled", "ÇEVRİMDIŞI — bir kez çalışır, sonuçlar pakette")}
        </text>
        {box(10, 28, 210, 64, t("Fetch measured output + NWP", "Ölçülmüş üretim + NWP indir"), "scripts/fetch_real_forecast_data.py", C.v3, "Energinet · Open-Meteo (ECMWF, ICON)")}
        {box(250, 28, 200, 64, t("Hourly data set", "Saatlik veri seti"), "data/dk2_offshore_dayahead.csv.gz", C.axis, t(`${formatNumber(DATA.meta.hours, 0, lang)} h · ${formatNumber(DATA.meta.capacity_mw, 0, lang)} MW · 4 NWP runs`, `${formatNumber(DATA.meta.hours, 0, lang)} sa · ${formatNumber(DATA.meta.capacity_mw, 0, lang)} MW · 4 NWP koşusu`))}
        {box(480, 28, 220, 64, t("Train LSTM and TFT (≈ 15 min CPU)", "LSTM ve TFT eğit (≈ 15 dk CPU)"), "scripts/train_real_deep_models.py", C.v3, t("same folds, early stopping", "aynı katmanlar, erken durdurma"))}
        {box(730, 28, 200, 64, t("Out-of-fold deep forecasts", "Katman dışı derin tahminler"), "data/dk2_deep_predictions.csv.gz", C.axis, "LSTM P50 · TFT P10…P90")}
        {arr("M222,60 L246,60")}
        {arr("M452,60 L476,60")}
        {arr("M702,60 L726,60")}

        <text x={10} y={128} fontSize={10.5} fontWeight={700} letterSpacing={0.6} style={{ fill: C.muted }}>
          {t("ON REQUEST — backend/app/services/p4/real_data.py (first call ≈ 2 min, then cached)", "İSTEKTE — backend/app/services/p4/real_data.py (ilk çağrı ≈ 2 dk, sonra önbellekte)")}
        </text>
        {box(10, 138, 160, 70, t("Features", "Özellikler"), "build_features()", C.v1, t("15 NWP columns", "15 NWP sütunu"))}
        {box(188, 138, 160, 70, t("TimeSeriesSplit", "TimeSeriesSplit"), "5 folds · gap 48 h", C.v1, t("train past, test next", "geçmişte eğit, sonrakinde test"))}
        {box(366, 138, 176, 70, t("XGBoost, 9 quantiles", "XGBoost, 9 kantil"), "_xgb_fold()", C.accent, t("+ conformal margin", "+ konformal pay"))}
        {box(560, 138, 160, 70, t("Ensemble", "Topluluk"), "_ensemble_weights()", C.v1, t("1/MSE, earlier folds", "1/MSE, önceki katmanlar"))}
        {box(738, 138, 192, 70, t("Physics guard", "Fizik koruması"), "enforce_physical_constraints()", C.good, "0 ≤ P ≤ 977 MW")}
        {arr("M172,173 L184,173")}
        {arr("M350,173 L362,173")}
        {arr("M544,173 L556,173")}
        {arr("M722,173 L734,173")}
        {arr("M830,94 C830,116 640,112 640,134", "muted", true)}

        {box(10, 248, 300, 70, t("Scores on the same test hours", "Aynı test saatlerinde skorlar"), "nRMSE · nMAE · bias · skill · CRPS · reliability", C.v1, t("vs persistence, climatology, NWP curve, TSO", "kalıcılık, klimatoloji, NWP eğrisi, İSO'ya karşı"))}
        {box(330, 248, 180, 70, t("Explanation", "Açıklama"), "TreeSHAP (pred_contribs)", C.v1, t("mean |SHAP| per feature", "özellik başına ort. |SHAP|"))}
        {box(530, 248, 180, 70, t("Cache + API", "Önbellek + API"), "GET …/real-data/day-ahead", C.v1, t("Redis, 7 days", "Redis, 7 gün"))}
        {box(730, 248, 200, 70, t("Day-ahead tab + Academy", "Gün öncesi sekmesi + Akademi"), "RealDataPanel.tsx · academy/", C.accent, t("charts, tables, lessons", "grafikler, tablolar, dersler"))}
        {arr("M834,210 C834,232 160,226 160,244")}
        {arr("M312,283 L326,283")}
        {arr("M512,283 L526,283")}
        {arr("M712,283 L726,283", "accent")}

        <text x={10} y={352} fontSize={10.5} fontWeight={700} letterSpacing={0.6} style={{ fill: C.muted }}>
          {t("FIGURES OF THIS COURSE", "BU KURSUN ŞEKİLLERİ")}
        </text>
        {box(10, 362, 450, 50, t("Excerpts and statistics of the same evaluation", "Aynı değerlendirmenin kesitleri ve istatistikleri"), "backend/scripts/build_academy_figures.py → academy/data/dk2_academy.json", C.v3)}
      </svg>
    </Wide>
  );
}

// ── 14.2 Operating day ──────────────────────────────────────────────

export function OpsCycle({ lang }: { lang: Lang }) {
  const t = tt(lang);
  const W = 900;
  const x0 = 70;
  const x1 = W - 20;
  const hx = (h: number) => x0 + (h / 24) * (x1 - x0);
  const rows: { y: number; label: string; items: [number, number, string, string][] }[] = [
    {
      y: 40,
      label: t("Data", "Veri"),
      items: [
        [5.5, 7.5, t("NWP 00 UTC arrives", "NWP 00 UTC gelir"), C.v3],
        [17.5, 19.5, t("NWP 12 UTC arrives", "NWP 12 UTC gelir"), C.v3],
        [0, 24, "", C.grid],
      ],
    },
    {
      y: 100,
      label: t("Forecast", "Tahmin"),
      items: [
        [7.5, 9, t("day-ahead run", "gün öncesi koşu"), C.v1],
        [19.5, 21, t("update for intraday", "gün içi güncelleme"), C.v1],
      ],
    },
    {
      y: 160,
      label: t("Trading", "Ticaret"),
      items: [
        [9, 12, t("bid → 12:00 gate", "teklif → 12:00 kapı"), C.accent],
        [15, 24, t("intraday adjustments", "gün içi düzeltmeler"), C.v2],
      ],
    },
    {
      y: 220,
      label: t("Plant", "Santral"),
      items: [
        [0, 24, t("SCADA: availability, curtailment orders from PSE, alarms", "SCADA: kullanılabilirlik, PSE kısıntı talimatları, alarmlar"), C.v1],
      ],
    },
    {
      y: 280,
      label: t("Review", "Gözden geçirme"),
      items: [
        [10, 11, t("yesterday's errors", "dünkü hatalar"), C.v4],
        [22, 23.5, t("drift check", "kayma kontrolü"), C.v4],
      ],
    },
  ];
  return (
    <Wide minWidth={780}>
      <svg viewBox={`0 0 ${W} 340`} className="w-full" role="img" aria-label={t("One operating day of a forecasting desk", "Bir tahmin masasının bir işletme günü")}>
        {[0, 3, 6, 9, 12, 15, 18, 21, 24].map((h) => (
          <g key={h}>
            <line x1={hx(h)} x2={hx(h)} y1={22} y2={306} style={{ stroke: C.grid }} />
            <text x={hx(h)} y={324} textAnchor="middle" fontSize={10.5} style={{ fill: C.muted }}>
              {`${String(h).padStart(2, "0")}:00`}
            </text>
          </g>
        ))}
        <line x1={hx(12)} x2={hx(12)} y1={14} y2={306} style={{ stroke: C.accent }} strokeWidth={2} />
        <text x={hx(12) + 4} y={14} fontSize={10.5} fontWeight={650} style={{ fill: C.ink }}>
          {t("gate closure D−1", "kapı kapanışı D−1")}
        </text>
        {rows.map((r) => (
          <g key={r.label}>
            <text x={8} y={r.y + 14} fontSize={11.5} fontWeight={650} style={{ fill: C.ink }}>
              {r.label}
            </text>
            {r.items.map(([a, b, label, c]) =>
              label ? (
                <g key={label}>
                  <rect x={hx(a)} y={r.y} width={hx(b) - hx(a)} height={22} rx={4} style={{ fill: c }} opacity={0.85} />
                  <text x={hx(a) + 6} y={r.y + 36} fontSize={10.5} style={{ fill: C.ink2 }}>
                    {label}
                  </text>
                </g>
              ) : null,
            )}
          </g>
        ))}
        <text x={8} y={338} fontSize={10.5} style={{ fill: C.muted }}>
          {t("Times CET, typical for a Baltic balance-responsible party; NWP availability varies by provider.", "Saatler CET, Baltık'taki bir dengeden sorumlu taraf için tipik; NWP erişim saati sağlayıcıya göre değişir.")}
        </text>
      </svg>
    </Wide>
  );
}

// ── 14.3 Error per fold over time ───────────────────────────────────

export function FoldTrend({ lang }: { lang: Lang }) {
  const t = tt(lang);
  const live = useForecastStore((s) => s.real);
  const scores = live?.scores ?? DATA.snapshot.scores;
  const mid = DATA.folds.map((f) => (utc(`${f.test_start}T00:00Z`).getTime() + utc(`${f.test_end}T00:00Z`).getTime()) / 2);
  const pick: [string, string, string][] = [
    ["XGBoost (P50)", "XGBoost", C.v1],
    ["Energinet day-ahead (TSO)", t("TSO", "İSO"), C.accent],
    ["NWP power curve", t("NWP curve", "NWP eğrisi"), C.v2],
    ["TFT (P50)", "TFT", C.v3],
  ];
  const fmtMonth = (ms: number) => {
    const d = new Date(ms);
    return `${String(d.getUTCMonth() + 1).padStart(2, "0")}/${String(d.getUTCFullYear()).slice(2)}`;
  };
  return (
    <XYChart
      ariaLabel={t("Error per test fold over time", "Zaman içinde test katmanı başına hata")}
      height={280}
      x={{ domain: [mid[0] - 40 * 864e5, mid[mid.length - 1] + 40 * 864e5], ticks: mid, format: fmtMonth, title: t("middle of the test block", "test bloğunun ortası") }}
      y={{ domain: [10, 24], title: t("nRMSE [% of capacity]", "nRMSE [kapasitenin %'si]") }}
      series={pick
        .map(([name, label, color]) => {
          const s = scores.find((x) => x.name === name);
          return s ? { kind: "line" as const, id: name, label, color, points: s.fold_nrmse_pct.map((v, i) => [mid[i], v] as [number, number]), unit: "%", decimals: 1 } : null;
        })
        .filter((s) => s !== null)}
      hoverLabel={(ms) => {
        const i = mid.indexOf(ms);
        const f = DATA.folds[i];
        return f ? `${t("fold", "katman")} ${i + 1}: ${f.test_start} → ${f.test_end}` : formatNumber(ms, 0, lang);
      }}
      over={({ sx, sy }) => (
        <g>
          {pick.map(([name, , color]) => {
            const s = scores.find((x) => x.name === name);
            return s?.fold_nrmse_pct.map((v, i) => <circle key={`${name}${i}`} cx={sx(mid[i])} cy={sy(v)} r={4} style={{ fill: color, stroke: C.surface }} strokeWidth={2} />);
          })}
        </g>
      )}
    />
  );
}
