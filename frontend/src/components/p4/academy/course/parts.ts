import type { Part } from "./types";

/** The five parts of the course, in reading order. */
export const PARTS: Part[] = [
  { id: "problem", numeral: "I", title: { en: "The forecasting problem", tr: "Tahmin problemi" } },
  { id: "learning", numeral: "II", title: { en: "Learning from data", tr: "Veriden öğrenmek" } },
  { id: "models", numeral: "III", title: { en: "The models", tr: "Modeller" } },
  { id: "uncertainty", numeral: "IV", title: { en: "Uncertainty and evaluation", tr: "Belirsizlik ve değerlendirme" } },
  { id: "operation", numeral: "V", title: { en: "In operation", tr: "İşletmede" } },
];
