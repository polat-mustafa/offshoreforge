/**
 * AI Academy — the P4 forecasting course and its concept map.
 *
 * Chapters live in course/part1…5 (English and Turkish, references in course/refs.ts,
 * the platform's numbers in course/facts.ts). This module joins them and holds the
 * concept map: nodes, the chapter that explains each, one-line summaries and links.
 */

import { PART1 } from "./course/part1";
import { PART2 } from "./course/part2";
import { PART3 } from "./course/part3";
import { PART4 } from "./course/part4";
import { PART5 } from "./course/part5";
import type { Chapter, T } from "./course/types";

export type { Chapter, Lang } from "./course/types";

export const CHAPTERS: Chapter[] = [...PART1, ...PART2, ...PART3, ...PART4, ...PART5];

type Group = "data" | "ml" | "model" | "eval" | "ops";

/** Concept map nodes, each with the chapter that explains it. */
export const CONCEPTS: { id: string; label: T; chapter: string; group: Group }[] = [
  { id: "grid", label: { en: "Grid balancing", tr: "Şebeke dengesi" }, chapter: "why", group: "ops" },
  { id: "market", label: { en: "Day-ahead market", tr: "Gün öncesi piyasa" }, chapter: "why", group: "ops" },
  { id: "imbalance", label: { en: "Imbalance cost", tr: "Dengesizlik maliyeti" }, chapter: "why", group: "ops" },
  { id: "nwp", label: { en: "Weather model (NWP)", tr: "Hava modeli (NWP)" }, chapter: "nwp", group: "data" },
  { id: "chaos", label: { en: "Error growth", tr: "Hata büyümesi" }, chapter: "nwp", group: "data" },
  { id: "powercurve", label: { en: "Power curve", tr: "Güç eğrisi" }, chapter: "nwp", group: "data" },
  { id: "persistence", label: { en: "Persistence", tr: "Kalıcılık" }, chapter: "baselines", group: "eval" },
  { id: "climatology", label: { en: "Climatology", tr: "Klimatoloji" }, chapter: "baselines", group: "eval" },
  { id: "horizon", label: { en: "Forecast horizon", tr: "Tahmin ufku" }, chapter: "baselines", group: "ops" },
  { id: "features", label: { en: "Features", tr: "Özellikler" }, chapter: "ml", group: "data" },
  { id: "target", label: { en: "Target P(t)", tr: "Hedef P(t)" }, chapter: "ml", group: "data" },
  { id: "overfitting", label: { en: "Over-fitting", tr: "Aşırı öğrenme" }, chapter: "ml", group: "ml" },
  { id: "validation", label: { en: "Validation", tr: "Doğrulama" }, chapter: "ml", group: "eval" },
  { id: "loss", label: { en: "Loss function", tr: "Kayıp fonksiyonu" }, chapter: "optim", group: "ml" },
  { id: "gradient", label: { en: "Gradient descent", tr: "Gradyan inişi" }, chapter: "optim", group: "ml" },
  { id: "epoch", label: { en: "Epochs & Adam", tr: "Epoch & Adam" }, chapter: "optim", group: "ml" },
  { id: "earlystop", label: { en: "Early stopping", tr: "Erken durdurma" }, chapter: "optim", group: "ml" },
  { id: "dropout", label: { en: "Dropout", tr: "Dropout" }, chapter: "optim", group: "ml" },
  { id: "autocorrelation", label: { en: "Autocorrelation", tr: "Otokorelasyon" }, chapter: "validation", group: "data" },
  { id: "tscv", label: { en: "TimeSeriesSplit", tr: "TimeSeriesSplit" }, chapter: "validation", group: "eval" },
  { id: "leakage", label: { en: "Data leakage", tr: "Veri sızıntısı" }, chapter: "leakage", group: "eval" },
  { id: "origin", label: { en: "Forecast origin", tr: "Tahmin başlangıcı" }, chapter: "leakage", group: "ops" },
  { id: "tree", label: { en: "Decision tree", tr: "Karar ağacı" }, chapter: "xgboost", group: "model" },
  { id: "residual", label: { en: "Residuals", tr: "Artıklar" }, chapter: "xgboost", group: "ml" },
  { id: "boosting", label: { en: "Gradient boosting", tr: "Gradient boosting" }, chapter: "xgboost", group: "model" },
  { id: "xgboost", label: { en: "XGBoost", tr: "XGBoost" }, chapter: "xgboost", group: "model" },
  { id: "sequence", label: { en: "Sequence (24 h)", tr: "Dizi (24 sa)" }, chapter: "lstm", group: "data" },
  { id: "vanishing", label: { en: "Vanishing gradient", tr: "Kaybolan gradyan" }, chapter: "lstm", group: "ml" },
  { id: "lstm", label: { en: "LSTM", tr: "LSTM" }, chapter: "lstm", group: "model" },
  { id: "attention", label: { en: "Attention", tr: "Dikkat" }, chapter: "tft", group: "ml" },
  { id: "tft", label: { en: "TFT", tr: "TFT" }, chapter: "tft", group: "model" },
  { id: "quantile", label: { en: "P10/P50/P90", tr: "P10/P50/P90" }, chapter: "quantiles", group: "eval" },
  { id: "pinball", label: { en: "Pinball loss", tr: "Pinball kaybı" }, chapter: "quantiles", group: "ml" },
  { id: "uncertainty", label: { en: "Uncertainty", tr: "Belirsizlik" }, chapter: "quantiles", group: "eval" },
  { id: "conformal", label: { en: "Conformal band", tr: "Konformal bant" }, chapter: "quantiles", group: "eval" },
  { id: "skill", label: { en: "Skill score", tr: "Beceri skoru" }, chapter: "evaluation", group: "eval" },
  { id: "crps", label: { en: "CRPS", tr: "CRPS" }, chapter: "evaluation", group: "eval" },
  { id: "reliability", label: { en: "Reliability", tr: "Güvenilirlik" }, chapter: "evaluation", group: "eval" },
  { id: "ensemble", label: { en: "Ensemble", tr: "Topluluk" }, chapter: "ensemble", group: "model" },
  { id: "shap", label: { en: "SHAP", tr: "SHAP" }, chapter: "ensemble", group: "eval" },
  { id: "physics", label: { en: "Physics limits", tr: "Fizik sınırları" }, chapter: "ensemble", group: "ops" },
  { id: "pipeline", label: { en: "Pipeline", tr: "Hat" }, chapter: "operation", group: "ops" },
  { id: "drift", label: { en: "Drift & retraining", tr: "Kayma & yeniden eğitim" }, chapter: "operation", group: "ops" },
];

/** One- or two-sentence summary per concept (hover card and detail panel of the concept map). */
export const CONCEPT_SUMMARY: Record<string, T> = {
  grid: { en: "Supply must equal demand every second; the TSO keeps the frequency at 50 Hz with reserves bought in advance — the better the wind forecast, the fewer reserves are needed.", tr: "Arz her saniye talebe eşit olmalı; İSO frekansı önceden satın aldığı rezervlerle 50 Hz'de tutar — rüzgâr tahmini ne kadar iyiyse o kadar az rezerv gerekir." },
  market: { en: "Bids for day D close at 12:00 CET on D−1 (SDAC); the forecast is the volume the farm sells, 12–36 hours ahead.", tr: "D günü için teklifler D−1 günü 12:00 CET'te kapanır (SDAC); tahmin, santralin 12–36 saat önceden sattığı miktardır." },
  imbalance: { en: "Every MWh delivered differently from the schedule is settled at the imbalance price per 15-minute period — forecast error turns directly into money.", tr: "Programdan farklı teslim edilen her MWh, 15 dakikalık dönem başına dengesizlik fiyatıyla uzlaştırılır — tahmin hatası doğrudan paraya dönüşür." },
  nwp: { en: "Numerical weather prediction (ECMWF IFS, DWD ICON) integrates the equations of the atmosphere; beyond a few hours it carries almost all the forecast skill.", tr: "Sayısal hava tahmini (ECMWF IFS, DWD ICON) atmosferin denklemlerini çözer; birkaç saatin ötesinde tahmin becerisinin neredeyse tamamını taşır." },
  chaos: { en: "Small errors in the initial state grow with lead time because the atmosphere is chaotic (Lorenz 1963); day-ahead forecasts are inherently uncertain.", tr: "Atmosfer kaotik olduğu için başlangıç durumundaki küçük hatalar öncü süreyle büyür (Lorenz 1963); gün öncesi tahminler doğası gereği belirsizdir." },
  powercurve: { en: "P = ½ρAC_pu³ up to rated power; its steep part between cut-in and rated turns a 1 m/s wind error into a third of rated power.", tr: "Nominal güce kadar P = ½ρAC_pu³; devreye girme ile nominal arasındaki dik kısmı 1 m/s'lik rüzgâr hatasını nominal gücün üçte birine dönüştürür." },
  persistence: { en: "\"It stays as it was\": RMSE = σ√(2(1−ρₖ)). Unbeatable for the first hours, worse than climatology once ρₖ < 0.5.", tr: "\"Olduğu gibi kalır\": RMSE = σ√(2(1−ρₖ)). İlk saatlerde yenilmez, ρₖ < 0,5 olduğunda klimatolojiden kötüdür." },
  climatology: { en: "The long-term mean (or its quantiles) as a forecast; RMSE = σ. The reference for skill at long horizons and for probabilistic scores.", tr: "Tahmin olarak uzun dönem ortalaması (ya da kantilleri); RMSE = σ. Uzun ufuklarda beceri ve olasılıksal skorlar için referans." },
  horizon: { en: "Very short-term (0–6 h) relies on measurements, short-term (6–72 h) on NWP plus learning, medium range on ensemble NWP.", tr: "Çok kısa vade (0–6 sa) ölçümlere, kısa vade (6–72 sa) NWP artı öğrenmeye, orta vade topluluk NWP'ye dayanır." },
  features: { en: "Inputs known at the forecast origin: NWP wind and direction (sin/cos) per model and farm, hour of day, NWP spread — 15 columns.", tr: "Tahmin başlangıcında bilinen girdiler: model ve santral başına NWP rüzgârı ve yönü (sin/cos), günün saati, NWP yayılımı — 15 sütun." },
  target: { en: "What the model predicts: the farms' mean power P(t) in each hour of day D.", tr: "Modelin tahmin ettiği şey: D gününün her saatinde santrallerin ortalama gücü P(t)." },
  overfitting: { en: "The model fits the noise of its training data; test error = noise + bias² + variance, and only unseen data reveal the variance.", tr: "Model eğitim verisinin gürültüsüne uyar; test hatası = gürültü + yanlılık² + varyans ve varyansı yalnızca görülmemiş veri ortaya çıkarır." },
  validation: { en: "Data held back from fitting to judge the model and to choose settings such as the number of epochs; never the test block.", tr: "Modeli değerlendirmek ve epoch sayısı gibi ayarları seçmek için uydurmadan ayrılan veri; asla test bloğu değil." },
  loss: { en: "Squared loss estimates the mean, absolute loss the median, pinball loss a quantile — the loss decides what is forecast.", tr: "Kare kayıp ortalamayı, mutlak kayıp medyanı, pinball kaybı bir kantili tahmin eder — neyin tahmin edildiğine kayıp karar verir." },
  gradient: { en: "θ ← θ − η∇L, repeated; stable only for η < 2/λ_max. Back-propagation computes the gradient of every weight.", tr: "θ ← θ − η∇L, tekrarlanır; yalnızca η < 2/λ_max için kararlıdır. Geri yayılım her ağırlığın gradyanını hesaplar." },
  epoch: { en: "One pass over the training data in mini-batches; Adam adapts the step size of every parameter from its gradient history.", tr: "Eğitim verisinin mini-batch'lerle bir kez geçilmesi; Adam her parametrenin adım boyunu gradyan geçmişinden uyarlar." },
  earlystop: { en: "Keep the weights with the lowest validation loss and stop after a patience of epochs without improvement.", tr: "En düşük doğrulama kayıplı ağırlıkları saklayın ve iyileşmeyen bir sabır süresinden sonra durun." },
  dropout: { en: "Randomly switching off units while training regularises a network; run at prediction it estimates model uncertainty only.", tr: "Eğitim sırasında birimleri rastgele kapatmak bir ağı düzenlileştirir; tahminde çalıştırılırsa yalnızca model belirsizliğini tahmin eder." },
  autocorrelation: { en: "Neighbouring hours are nearly identical (ρ₁ ≈ 0.97 for the DK2 output) and forecast errors persist for many hours.", tr: "Komşu saatler neredeyse aynıdır (DK2 üretimi için ρ₁ ≈ 0,97) ve tahmin hataları saatlerce sürer." },
  tscv: { en: "Train on the past, test on the next block, with a 48 h gap — never shuffle; shuffling makes the DK2 error look 9 % smaller.", tr: "Geçmişte eğit, sonraki blokta test et, 48 sa boşlukla — asla karıştırma; karıştırma DK2 hatasını %9 daha küçük gösterir." },
  leakage: { en: "Information from after the forecast origin slipping into training or evaluation; it makes scores look great and operation fail.", tr: "Tahmin başlangıcından sonraki bilginin eğitime ya da değerlendirmeye sızması; skorları harika, işletmeyi başarısız gösterir." },
  origin: { en: "The moment a forecast is issued — for the day-ahead bid 12:00 D−1; only information available then may be used.", tr: "Bir tahminin yayımlandığı an — gün öncesi teklif için 12:00 D−1; yalnızca o anda mevcut bilgi kullanılabilir." },
  tree: { en: "A flowchart of yes/no splits on the features (wind < 8.4 m/s?), grown greedily to reduce squared error, with a constant in each leaf.", tr: "Özellikler üzerinde evet/hayır bölmelerinden oluşan, kare hatayı azaltmak için açgözlü büyütülen ve her yaprakta bir sabit olan akış şeması." },
  residual: { en: "Actual minus predicted; for squared loss the negative gradient, which each boosting tree learns.", tr: "Gerçek eksi tahmin; kare kayıp için her boosting ağacının öğrendiği negatif gradyan." },
  boosting: { en: "Many small trees added in sequence, each fitted to the negative gradient of the loss and shrunk by η — gradient descent in function space.", tr: "Her biri kaybın negatif gradyanına uydurulan ve η ile küçültülen, ardı ardına eklenen birçok küçük ağaç — fonksiyon uzayında gradyan inişi." },
  xgboost: { en: "Regularised, second-order gradient boosting: w* = −G/(H+λ). Here 400 trees, depth 5, η = 0.05, nine quantiles — the best day-ahead model.", tr: "Düzenlileştirilmiş, ikinci dereceden gradient boosting: w* = −G/(H+λ). Burada 400 ağaç, derinlik 5, η = 0,05, dokuz kantil — en iyi gün öncesi model." },
  sequence: { en: "The window of hourly NWP rows a sequence model reads; here the 24 rows up to the target hour.", tr: "Bir dizi modelinin okuduğu saatlik NWP satırları penceresi; burada hedef saate kadarki 24 satır." },
  vanishing: { en: "Gradients shrink geometrically through time in plain RNNs, so long dependencies cannot be learned; the LSTM's cell state avoids it.", tr: "Düz RNN'lerde gradyanlar zaman boyunca geometrik olarak küçülür; bu yüzden uzun bağımlılıklar öğrenilemez; LSTM'in hücre durumu bundan kaçınır." },
  lstm: { en: "A recurrent network whose additive cell state is guarded by forget, input and output gates; here LSTM(64) → LSTM(32) over 24 h of NWP.", tr: "Toplamsal hücre durumu unutma, giriş ve çıkış kapılarıyla korunan yinelemeli bir ağ; burada 24 saatlik NWP üzerinde LSTM(64) → LSTM(32)." },
  attention: { en: "Lets the model weight which past moments matter for this forecast — softmax(QKᵀ/√dₖ)V — and shows those weights, so it can be inspected.", tr: "Modelin bu tahmin için hangi geçmiş anların önemli olduğunu ağırlıklandırmasını sağlar — softmax(QKᵀ/√dₖ)V — ve bu ağırlıkları gösterir, böylece incelenebilir." },
  tft: { en: "Temporal Fusion Transformer: variable selection, gated residual networks, LSTM encoder, interpretable attention and quantile outputs.", tr: "Temporal Fusion Transformer: değişken seçimi, kapılı artık ağlar, LSTM kodlayıcı, yorumlanabilir dikkat ve kantil çıktıları." },
  quantile: { en: "P50 is the median; the outcome should fall below P10 one time in ten and above P90 one time in ten. Forecast P90 ≠ yield P90.", tr: "P50 medyandır; sonuç on seferde bir P10'un altına, on seferde bir P90'ın üstüne düşmelidir. Tahmin P90'ı ≠ verim P90'ı." },
  pinball: { en: "max(τe, (τ−1)e): its expected minimum is the τ-quantile, so training with it yields quantile forecasts.", tr: "max(τe, (τ−1)e): beklenen minimumu τ-kantildir; bu yüzden onunla eğitim kantil tahminleri verir." },
  uncertainty: { en: "How wide the range of plausible outcomes is; traders and the TSO size bids and reserves from it, not from P50 alone.", tr: "Olası sonuçların aralığının genişliği; tüccarlar ve İSO teklifleri ve rezervleri yalnızca P50'den değil buradan boyutlandırır." },
  conformal: { en: "Widen the band by the 80 % quantile of its misses on a calibration slice: XGBoost's coverage rose from 63 % to 85 %.", tr: "Bandı bir kalibrasyon dilimindeki ıskalarının %80 kantili kadar genişletin: XGBoost'un kapsaması %63'ten %85'e çıktı." },
  skill: { en: "1 − MSE(model)/MSE(reference) on the same hours: 0 is no better than the reference, 1 would be perfect.", tr: "Aynı saatlerde 1 − MSE(model)/MSE(referans): 0 referanstan iyi değil, 1 kusursuz olurdu." },
  crps: { en: "Area between the forecast CDF and the observation's step, in MW; equals the MAE for a point forecast.", tr: "Tahmin DF'si ile gözlemin basamağı arasındaki alan, MW cinsinden; nokta tahmini için MAE'ye eşittir." },
  reliability: { en: "Observed share below each quantile against τ; a calibrated forecast lies on the diagonal. Aim for sharpness subject to calibration.", tr: "Her kantilin altındaki gözlenen pay τ'ya karşı; kalibre edilmiş bir tahmin köşegen üzerindedir. Kalibrasyon koşuluyla keskinliği hedefleyin." },
  ensemble: { en: "Weighted combination of models; it helps only when the members' errors are not too correlated — here it does not beat XGBoost.", tr: "Modellerin ağırlıklı birleşimi; yalnızca üyelerin hataları çok ilişkili değilse yardımcı olur — burada XGBoost'u geçemez." },
  shap: { en: "Splits each prediction into the contribution of every feature (Shapley values), adding up to the forecast.", tr: "Her tahmini her özelliğin katkısına (Shapley değerleri) ayırır; toplamları tahmine eşittir." },
  physics: { en: "After the ML: 0 ≤ P ≤ capacity, sorted quantiles, zero below cut-in and above cut-out — ML never overrides physics.", tr: "ML'den sonra: 0 ≤ P ≤ kapasite, sıralı kantiller, devreye girme altında ve devreden çıkma üstünde sıfır — ML fiziği asla aşamaz." },
  pipeline: { en: "Fetch → features → time-ordered folds → models → calibration → ensemble → physics → scores → cache → UI, every stage in code.", tr: "İndir → özellikler → zamana göre sıralı katmanlar → modeller → kalibrasyon → topluluk → fizik → skorlar → önbellek → arayüz; her aşama kodda." },
  drift: { en: "Models degrade as weather models, turbines and rules change; monitor bias, coverage and skill, and retrain on a schedule.", tr: "Hava modelleri, türbinler ve kurallar değiştikçe modeller bozulur; sapmayı, kapsamayı ve beceriyi izleyin ve bir programa göre yeniden eğitin." },
};

export const LINKS: [string, string][] = [
  ["grid", "market"], ["market", "imbalance"], ["market", "origin"], ["imbalance", "uncertainty"], ["grid", "physics"],
  ["nwp", "chaos"], ["nwp", "powercurve"], ["nwp", "features"], ["powercurve", "physics"], ["chaos", "horizon"],
  ["horizon", "persistence"], ["persistence", "climatology"], ["persistence", "skill"], ["climatology", "skill"], ["autocorrelation", "persistence"],
  ["features", "target"], ["features", "leakage"], ["target", "loss"], ["overfitting", "validation"], ["validation", "earlystop"],
  ["loss", "gradient"], ["gradient", "epoch"], ["epoch", "earlystop"], ["dropout", "overfitting"], ["loss", "pinball"],
  ["autocorrelation", "tscv"], ["tscv", "validation"], ["tscv", "leakage"], ["leakage", "origin"], ["origin", "nwp"],
  ["tree", "boosting"], ["residual", "boosting"], ["gradient", "boosting"], ["boosting", "xgboost"], ["xgboost", "overfitting"],
  ["sequence", "lstm"], ["vanishing", "lstm"], ["gradient", "vanishing"], ["lstm", "tft"], ["attention", "tft"],
  ["xgboost", "quantile"], ["tft", "quantile"], ["pinball", "quantile"], ["quantile", "uncertainty"], ["quantile", "conformal"],
  ["conformal", "reliability"], ["quantile", "crps"], ["crps", "skill"], ["reliability", "uncertainty"],
  ["xgboost", "ensemble"], ["lstm", "ensemble"], ["tft", "ensemble"], ["xgboost", "shap"], ["ensemble", "physics"],
  ["pipeline", "xgboost"], ["pipeline", "physics"], ["pipeline", "drift"], ["drift", "skill"], ["drift", "conformal"],
];

