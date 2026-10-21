"""Build the real-data figures of the P4 AI Academy from the day-ahead evaluation.

    cd backend && python scripts/build_academy_figures.py

Writes frontend/src/components/p4/academy/data/dk2_academy.json: small excerpts and
statistics of the measured DK2 offshore output and the platform's own out-of-fold forecasts
(``real_data.evaluate_real_dayahead``), so every real-data figure in the course is computed
from the same hours the Day-ahead tab scores — nothing is drawn by hand.

  week        one week of the last test fold with a storm ramp: measured output, every
              forecast, the XGBoost and TFT quantiles and the NWP wind
  scatter     NWP wind vs measured farm power (a deterministic 1-in-k sample) and the
              binned empirical farm power curve
  err_by_ws   RMSE per 1 m/s bin of forecast wind (the steep part of the curve amplifies
              wind errors)
  acf         autocorrelation of the output and of the XGBoost error
  folds       the five TimeSeriesSplit folds with dates, conformal margins and nRMSE
  rows        rows of the feature table as the model sees them
  err_corr    correlation of the P50 errors (why the ensemble does not help)
  shap_hours  TreeSHAP decomposition of three forecast hours
  experiments shuffled K-fold vs TimeSeriesSplit and a deliberately leaky feature
  snapshot    the score table, reliability and SHAP importance

Takes ~4 min on a CPU (the evaluation plus ten extra XGBoost fits). Data: Energinet Energi
Data Service and Open-Meteo Previous Runs (ECMWF IFS, DWD ICON), both CC BY 4.0.
"""

from __future__ import annotations

import json
import sys
from datetime import date
from pathlib import Path
from typing import Any

import numpy as np
import xgboost as xgb
from numpy.typing import NDArray
from sklearn.model_selection import KFold, TimeSeriesSplit

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.services.p4.real_data import (
    CURVE,
    ENSEMBLE,
    GAP_H,
    LSTM,
    N_SPLITS,
    PERS,
    QUANTILES,
    TSO,
    XGB,
    build_features,
    evaluate_real_dayahead,
    load_dataset,
    persistence_24h,
    sites,
)

OUT = (
    Path(__file__).resolve().parents[2] / "frontend/src/components/p4/academy/data/dk2_academy.json"
)
WEEK_H = 168
SCATTER_N = 1500


def r1(v: NDArray[Any]) -> list[float | None]:
    return [round(float(a), 1) if np.isfinite(a) else None for a in v]


def r2(v: NDArray[Any]) -> list[float | None]:
    return [round(float(a), 2) if np.isfinite(a) else None for a in v]


def acf(v: NDArray[np.float64], lags: int) -> list[float]:
    v = v[np.isfinite(v)] - np.nanmean(v)
    den = float(np.sum(v * v))
    return [round(float(np.sum(v[: len(v) - k] * v[k:]) / den), 3) for k in range(lags + 1)]


def p50_cv(x: NDArray[np.float64], y: NDArray[np.float64], splits: Any, cap: float) -> float:
    """nRMSE [% of capacity] of a P50 XGBoost (same trees as the service) over ``splits``."""
    err: list[NDArray[np.float64]] = []
    for train, test in splits:
        m = xgb.XGBRegressor(
            objective="reg:quantileerror",
            quantile_alpha=0.5,
            n_estimators=400,
            max_depth=5,
            learning_rate=0.05,
            subsample=0.8,
            random_state=42,
            n_jobs=4,
        )
        m.fit(x[train], y[train])
        err.append(np.clip(m.predict(x[test]), 0, cap) - y[test])
    e = np.concatenate(err)
    return round(100 * float(np.sqrt(np.mean(e * e))) / cap, 2)


def main() -> int:
    st = sites()["dk2"]
    cap = st.capacity_mw
    r = evaluate_real_dayahead("dk2")
    h = r.hourly
    t, y, ws = h["time_utc"], h["actual_mw"], h["nwp_ws_mean"]
    scored, fold = h["scored"], h["fold"]
    xq = h["xgb_q"]
    names = r.feature_names
    iso = [str(v) + ":00Z" for v in t]

    # ── one week of the last test fold: the window with the largest ramps ──
    last = np.flatnonzero((fold == N_SPLITS - 1) & scored)
    best, best_score = last[0], -1.0
    for s in range(last[0], last[-1] - WEEK_H, 6):
        win = np.arange(s, s + WEEK_H)
        if not scored[win].all():
            continue
        score = float(np.abs(np.diff(y[win])).sum() + (y[win].max() - y[win].min()))
        if score > best_score:
            best, best_score = s, score
    wk = np.arange(best, best + WEEK_H)
    ds = load_dataset("dk2")
    pos = {v: i for i, v in enumerate(ds.time_utc.astype(np.int64).tolist())}
    raw = np.array([pos[v] for v in t.astype(np.int64).tolist()])
    col = {n: j for j, n in enumerate(ds.nwp_names)}
    week = {
        "time_utc": [iso[i] for i in wk],
        "actual_mw": r1(y[wk]),
        "xgb_q_mw": [r1(xq[wk, j]) for j in range(len(QUANTILES))],
        "tft_q_mw": [r1(h["tft_q"][wk, j]) for j in range(len(QUANTILES))],
        "lstm_mw": r1(h[LSTM][wk]),
        "ensemble_mw": r1(h[ENSEMBLE][wk]),
        "tso_mw": r1(h[TSO][wk]),
        "curve_mw": r1(h[CURVE][wk]),
        "persistence_mw": r1(h[PERS][wk]),
        "nwp_ws_mean": r2(ws[wk]),
        "ecmwf_kf_ws": r2(ds.nwp_ws[raw[wk], col["ecmwf_kf"]]),
        "icon_kf_ws": r2(ds.nwp_ws[raw[wk], col["icon_kf"]]),
    }

    # ── wind → power: sample and binned empirical farm curve (all hours) ──
    ws_all, p_all = ds.nwp_ws.mean(axis=1), ds.power_mw
    k = max(1, len(ws_all) // SCATTER_N)
    bins = []
    for b in range(int(ws_all.max()) + 1):
        m = (ws_all >= b) & (ws_all < b + 1)
        if m.sum() >= 20:
            pb = p_all[m]
            bins.append(
                {
                    "ws": b + 0.5,
                    "n": int(m.sum()),
                    "mean_mw": round(float(pb.mean()), 1),
                    "p10_mw": round(float(np.quantile(pb, 0.1)), 1),
                    "p90_mw": round(float(np.quantile(pb, 0.9)), 1),
                }
            )
    scatter = {"ws": r2(ws_all[::k]), "p_mw": r1(p_all[::k]), "bins": bins}

    # ── error per 1 m/s bin of forecast wind (scored hours) ──
    err_by_ws = []
    for b in range(0, 21):
        m = scored & (ws >= b) & (ws < b + 1)
        if m.sum() >= 30:
            err_by_ws.append(
                {
                    "ws": b + 0.5,
                    "n": int(m.sum()),
                    **{
                        key: round(float(np.sqrt(np.mean((h[name][m] - y[m]) ** 2))), 1)
                        for key, name in (("xgb", XGB), ("curve", CURVE), ("pers", PERS))
                    },
                }
            )

    # ── folds: dates, sizes, margins, nRMSE ──
    folds = []
    for kf, (train, test) in enumerate(TimeSeriesSplit(n_splits=N_SPLITS, gap=GAP_H).split(y)):
        folds.append(
            {
                "train_start": iso[train[0]][:10],
                "train_end": iso[train[-1]][:10],
                "test_start": iso[test[0]][:10],
                "test_end": iso[test[-1]][:10],
                "n_train": len(train),
                "n_test": len(test),
                "margin_mw": r.conformal_margin_mw[kf],
                "xgb_nrmse_pct": r.scores[0].fold_nrmse_pct[kf],
            }
        )

    # ── feature rows as the model sees them (four hours of the week) ──
    x_all, _ = build_features(ds)
    rows = [
        {
            "time_utc": iso[i],
            "x": [round(float(v), 3) for v in x_all[raw[i]]],
            "target_mw": round(float(y[i]), 1),
            "xgb_p50_mw": round(float(xq[i, 4]), 1),
        }
        for i in wk[[6, 50, 98, 140]]
    ]

    # ── error correlation of the P50 forecasts ──
    members = [("XGBoost", h[XGB]), ("TFT", h["tft_q"][:, 4]), ("LSTM", h[LSTM])]
    members += [("TSO", h[TSO]), ("NWP curve", h[CURVE])]
    errs = np.array([v[scored] - y[scored] for _, v in members])
    err_corr = {
        "names": [n for n, _ in members],
        "corr": [[round(float(c), 3) for c in row] for row in np.corrcoef(errs)],
        "rmse_mw": [round(float(np.sqrt(np.mean(e * e))), 1) for e in errs],
    }

    # ── TreeSHAP of three hours: calm, ramp, storm ──
    sh = h["shap_p50"]
    shap_hours = []
    for label, i in (
        ("calm", wk[np.argmin(np.where(np.isfinite(y[wk]), ws[wk], 99))]),
        ("ramp", wk[1 + np.argmax(np.abs(np.diff(xq[wk, 4])))]),
        ("storm", wk[np.argmax(ws[wk])]),
    ):
        shap_hours.append(
            {
                "label": label,
                "time_utc": iso[i],
                "base_mw": round(float(sh[i, -1]), 1),
                "contrib_mw": [round(float(v), 1) for v in sh[i, :-1]],
                "x": [round(float(v), 2) for v in x_all[raw[i]]],
                "p50_mw": round(float(xq[i, 4]), 1),
                "actual_mw": round(float(y[i]), 1),
            }
        )

    # ── experiments on the same rows: shuffled K-fold, and a leaky feature ──
    ok = np.isfinite(persistence_24h(ds))
    xe, ye = x_all[ok], ds.power_mw[ok]
    lag1 = np.r_[np.nan, ds.power_mw[:-1]][ok]
    tss = list(TimeSeriesSplit(n_splits=N_SPLITS, gap=GAP_H).split(xe))
    shuffled = list(KFold(n_splits=N_SPLITS, shuffle=True, random_state=42).split(xe))
    experiments = {
        "time_split_nrmse_pct": p50_cv(xe, ye, tss, cap),
        "shuffled_kfold_nrmse_pct": p50_cv(xe, ye, shuffled, cap),
        "leaky_lag1_nrmse_pct": p50_cv(np.column_stack([xe, lag1]), ye, tss, cap),
    }

    # ── conformal band: coverage before / after the margin ──
    shift = np.zeros_like(xq)
    for kf in range(N_SPLITS):
        m = fold == kf
        shift[m] = r.conformal_margin_mw[kf] * (np.array(QUANTILES) - 0.5) / 0.4
    raw_q = np.clip(xq - shift, 0, cap)
    ys = y[scored]
    cov = {
        "raw_pct": round(
            100 * float(np.mean((ys >= raw_q[scored, 0]) & (ys <= raw_q[scored, 8]))), 1
        ),
        "conformal_pct": r.p10_p90_coverage_pct,
        "raw_width_mw": round(float(np.mean(raw_q[scored, 8] - raw_q[scored, 0])), 1),
        "conformal_width_mw": round(float(np.mean(xq[scored, 8] - xq[scored, 0])), 1),
    }

    cf = y[np.isfinite(y)] / cap
    hist = np.histogram(cf, bins=20, range=(0, 1))[0]
    out = {
        "meta": {
            "generated": date.today().isoformat(),
            "site": st.title,
            "farms": list(st.farms),
            "capacity_mw": round(cap, 1),
            "period": list(r.period),
            "hours": r.hours,
            "scored_hours": r.scored_hours,
            "folds": N_SPLITS,
            "gap_h": GAP_H,
            "production": st.production,
            "nwp": "Open-Meteo Previous Runs API — ECMWF IFS 0.25° and DWD ICON, 100 m wind "
            "issued the day before (CC BY 4.0)",
        },
        "feature_names": names,
        "week": week,
        "scatter": scatter,
        "err_by_ws": err_by_ws,
        "acf": {"power": acf(ds.power_mw, 168), "xgb_error": acf(h[XGB] - y, 168)},
        "folds": folds,
        "rows": rows,
        "err_corr": err_corr,
        "shap_hours": shap_hours,
        "experiments": experiments,
        "coverage": cov,
        "cf_hist": [round(float(v) / len(cf), 4) for v in hist],
        "snapshot": {
            "scores": [vars(s) for s in r.scores],
            "reliability": [vars(x) for x in r.reliability],
            "importance": [{"feature": f, "shap_share": v} for f, v in r.feature_importance],
        },
    }
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(out, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    print(f"wrote {OUT} ({OUT.stat().st_size / 1024:.0f} kB)")
    print("experiments", experiments, "coverage", cov)
    return 0


if __name__ == "__main__":
    sys.exit(main())
