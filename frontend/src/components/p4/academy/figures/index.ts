/**
 * Figure registry: chapters refer to figures by id ({ kind: "fig", fig: "…" }).
 */

import type { ComponentType } from "react";

import type { Lang } from "../course/types";
import { ErrorAmplification, ErrorByWind, ForecastChain, HorizonSkill, MarketTimeline, PowerCurveScatter, RealWeekImbalance } from "./part1";
import { Autocorrelation, BiasVariance, DescentContour, FeatureTable, FoldTimeline, InfoTimeline, LeakExperiment, LearningCurve, LossShapes, ShuffleVsTime } from "./part2";
import { AttentionGeometry, Boosting, GradientMemory, LstmCell, RnnUnrolled, TftArchitecture, TreeDiagram } from "./part3";
import { CfHistogram, Conformal, CrpsGeometry, EnsembleCalc, ErrorCorrelation, FanChart, MetricsLab, PinballDemo, Reliability, ScoreBoard, ShapGlobal, ShapWaterfall } from "./part4";
import { FoldTrend, OpsCycle, Pipeline } from "./part5";

export const FIGURES: Record<string, ComponentType<{ lang: Lang }>> = {
  // Part I
  "market-timeline": MarketTimeline,
  "real-week-imbalance": RealWeekImbalance,
  "forecast-chain": ForecastChain,
  "power-curve-scatter": PowerCurveScatter,
  "error-amplification": ErrorAmplification,
  "error-by-wind": ErrorByWind,
  "horizon-skill": HorizonSkill,
  // Part II
  "feature-table": FeatureTable,
  "bias-variance": BiasVariance,
  "loss-shapes": LossShapes,
  "descent-contour": DescentContour,
  "learning-curve": LearningCurve,
  autocorrelation: Autocorrelation,
  "fold-timeline": FoldTimeline,
  "shuffle-vs-time": ShuffleVsTime,
  "info-timeline": InfoTimeline,
  "leak-experiment": LeakExperiment,
  // Part III
  "tree-diagram": TreeDiagram,
  boosting: Boosting,
  "rnn-unrolled": RnnUnrolled,
  "lstm-cell": LstmCell,
  "gradient-memory": GradientMemory,
  "attention-geometry": AttentionGeometry,
  "tft-architecture": TftArchitecture,
  // Part IV
  "cf-histogram": CfHistogram,
  "pinball-demo": PinballDemo,
  "fan-chart": FanChart,
  conformal: Conformal,
  "metrics-lab": MetricsLab,
  "crps-geometry": CrpsGeometry,
  reliability: Reliability,
  "score-board": ScoreBoard,
  "error-correlation": ErrorCorrelation,
  "ensemble-calc": EnsembleCalc,
  "shap-waterfall": ShapWaterfall,
  "shap-global": ShapGlobal,
  // Part V
  pipeline: Pipeline,
  "ops-cycle": OpsCycle,
  "fold-trend": FoldTrend,
};
