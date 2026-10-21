/**
 * The platform's own numbers, as the course quotes them.
 *
 * data/dk2_academy.json is written by backend/scripts/build_academy_figures.py from the
 * same evaluation the Day-ahead tab shows (measured DK2 output, day-ahead NWP, 5-fold
 * TimeSeriesSplit). Prose refers to these numbers as {key}; the renderer formats them for
 * the reading language (15.4 / 15,4), so text, figures and the results tab never disagree.
 */

import raw from "../data/dk2_academy.json";
import type { Lang } from "./types";

export interface Score {
  name: string;
  nrmse_pct: number;
  nmae_pct: number;
  bias_pct: number;
  skill_vs_persistence: number;
  skill_vs_climatology: number;
  crps_pct: number;
  crpss_vs_climatology: number;
  probabilistic: boolean;
  fold_nrmse_pct: number[];
}

type Num = number | null;

export interface AcademyData {
  meta: {
    generated: string;
    site: string;
    farms: string[];
    capacity_mw: number;
    period: [string, string];
    hours: number;
    scored_hours: number;
    folds: number;
    gap_h: number;
    production: string;
    nwp: string;
  };
  feature_names: string[];
  week: {
    time_utc: string[];
    actual_mw: Num[];
    xgb_q_mw: Num[][];
    tft_q_mw: Num[][];
    lstm_mw: Num[];
    ensemble_mw: Num[];
    tso_mw: Num[];
    curve_mw: Num[];
    persistence_mw: Num[];
    nwp_ws_mean: Num[];
    ecmwf_kf_ws: Num[];
    icon_kf_ws: Num[];
  };
  scatter: { ws: Num[]; p_mw: Num[]; bins: { ws: number; n: number; mean_mw: number; p10_mw: number; p90_mw: number }[] };
  err_by_ws: { ws: number; n: number; xgb: number; curve: number; pers: number }[];
  acf: { power: number[]; xgb_error: number[] };
  folds: {
    train_start: string;
    train_end: string;
    test_start: string;
    test_end: string;
    n_train: number;
    n_test: number;
    margin_mw: number;
    xgb_nrmse_pct: number;
  }[];
  rows: { time_utc: string; x: number[]; target_mw: number; xgb_p50_mw: number }[];
  err_corr: { names: string[]; corr: number[][]; rmse_mw: number[] };
  shap_hours: { label: string; time_utc: string; base_mw: number; contrib_mw: number[]; x: number[]; p50_mw: number; actual_mw: number }[];
  experiments: { time_split_nrmse_pct: number; shuffled_kfold_nrmse_pct: number; leaky_lag1_nrmse_pct: number };
  coverage: { raw_pct: number; conformal_pct: number; raw_width_mw: number; conformal_width_mw: number };
  cf_hist: number[];
  snapshot: {
    scores: Score[];
    reliability: { name: string; observed_below: number[]; p10_p90_coverage_pct: number }[];
    importance: { feature: string; shap_share: number }[];
  };
}

export const DATA = raw as unknown as AcademyData;

const byName = (name: string) => DATA.snapshot.scores.find((s) => s.name === name);
const score = (name: string): Score => {
  const s = byName(name);
  if (!s) throw new Error(`academy data: no score for ${name}`);
  return s;
};
const xgb = score("XGBoost (P50)");
const rel = (name: string) => DATA.snapshot.reliability.find((r) => r.name === name);

/** Numbers the prose quotes: [value, decimals]. */
const NUM: Record<string, [number, number]> = {
  hours: [DATA.meta.hours, 0],
  scored_hours: [DATA.meta.scored_hours, 0],
  capacity: [DATA.meta.capacity_mw, 1],
  xgb_nrmse: [xgb.nrmse_pct, 1],
  xgb_nmae: [xgb.nmae_pct, 1],
  xgb_bias: [xgb.bias_pct, 1],
  xgb_ss_pers: [xgb.skill_vs_persistence, 2],
  xgb_ss_clim: [xgb.skill_vs_climatology, 2],
  xgb_crps: [xgb.crps_pct, 1],
  xgb_crpss: [xgb.crpss_vs_climatology, 2],
  tft_nrmse: [score("TFT (P50)").nrmse_pct, 1],
  lstm_nrmse: [score("LSTM").nrmse_pct, 1],
  ens_nrmse: [score("Ensemble (1/MSE weights)").nrmse_pct, 1],
  curve_nrmse: [score("NWP power curve").nrmse_pct, 1],
  tso_nrmse: [score("Energinet day-ahead (TSO)").nrmse_pct, 1],
  clim_nrmse: [score("Climatology").nrmse_pct, 1],
  pers_nrmse: [score("Persistence 24 h").nrmse_pct, 1],
  xgb_cov: [rel("XGBoost (P50)")?.p10_p90_coverage_pct ?? NaN, 1],
  tft_cov: [rel("TFT (P50)")?.p10_p90_coverage_pct ?? NaN, 1],
  raw_cov: [DATA.coverage.raw_pct, 1],
  raw_width: [DATA.coverage.raw_width_mw, 0],
  conf_width: [DATA.coverage.conformal_width_mw, 0],
  ts_nrmse: [DATA.experiments.time_split_nrmse_pct, 1],
  shuffled_nrmse: [DATA.experiments.shuffled_kfold_nrmse_pct, 1],
  leaky_nrmse: [DATA.experiments.leaky_lag1_nrmse_pct, 1],
  acf1: [DATA.acf.power[1], 2],
  acf6: [DATA.acf.power[6], 2],
  acf24: [DATA.acf.power[24], 2],
  // persistence beats climatology while ρₖ > 0.5: lags 1 … acf_half
  acf_half: [DATA.acf.power.findIndex((v) => v < 0.5) - 1, 0],
  // effective number of independent test hours for an AR(1)-like series: n (1 − ρ₁) / (1 + ρ₁)
  n_eff: [(DATA.meta.scored_hours * (1 - DATA.acf.power[1])) / (1 + DATA.acf.power[1]), 0],
  acf_err1: [DATA.acf.xgb_error[1], 2],
  acf_err24: [DATA.acf.xgb_error[24], 2],
  acf_err48: [DATA.acf.xgb_error[48], 2],
  corr_xgb_curve: [DATA.err_corr.corr[0][4], 2],
  corr_tft_lstm: [DATA.err_corr.corr[1][2], 2],
  corr_xgb_tso: [DATA.err_corr.corr[0][3], 2],
  shap_kf: [100 * ((DATA.snapshot.importance.find((f) => f.feature === "icon_kf_ws")?.shap_share ?? 0) + (DATA.snapshot.importance.find((f) => f.feature === "ecmwf_kf_ws")?.shap_share ?? 0)), 0],
  calm_share: [100 * DATA.cf_hist[0], 0],
  fold_max: [Math.max(...DATA.folds.map((f) => f.xgb_nrmse_pct)), 1],
  fold_last: [DATA.folds[DATA.folds.length - 1].xgb_nrmse_pct, 1],
  margin_first: [DATA.folds[0].margin_mw, 0],
  margin_last: [DATA.folds[DATA.folds.length - 1].margin_mw, 0],
};

/** Text facts that are not numbers. */
const TEXT: Record<string, string> = {
  period_start: DATA.meta.period[0].slice(0, 10),
  period_end: DATA.meta.period[1].slice(0, 10),
};

export function formatNumber(v: number, decimals: number, lang: Lang): string {
  return v.toLocaleString(lang === "tr" ? "tr-TR" : "en-GB", { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}

/** {key} → formatted value; unknown keys stay visible so a typo is caught in review and tests. */
export function fact(key: string, lang: Lang): string | null {
  if (key in NUM) {
    const [v, d] = NUM[key];
    return formatNumber(v, d, lang);
  }
  return TEXT[key] ?? null;
}

export const FACT_KEYS = [...Object.keys(NUM), ...Object.keys(TEXT)];
