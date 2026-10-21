/**
 * Part IV — uncertainty and evaluation: probabilistic forecasts and conformal calibration,
 * scoring rules, ensembles, explanation and physical consistency.
 */

import type { Chapter } from "./types";

export const PART4: Chapter[] = [
  // ───────────────────────────────────────────────────────────────── 11
  {
    id: "quantiles",
    n: 11,
    part: "uncertainty",
    title: { en: "Probabilistic forecasts: quantiles and conformal calibration", tr: "Olasılıksal tahminler: kantiller ve konformal kalibrasyon" },
    lead: {
      en: "A single number hides what matters most to a trader or a TSO: how wrong it may be. Probabilistic forecasts give the distribution of tomorrow's output, or a set of its quantiles. This chapter explains why wind power needs non-parametric quantiles, how quantile regression learns them, how the platform calibrates the band with conformal prediction — and why the forecast P90 is not the P90 of yield assessment.",
      tr: "Tek bir sayı, bir tüccar ya da İSO için en önemli şeyi gizler: ne kadar yanlış olabileceğini. Olasılıksal tahminler yarınki üretimin dağılımını ya da kantillerinden bir kümeyi verir. Bu bölüm rüzgâr gücünün neden parametrik olmayan kantillere ihtiyaç duyduğunu, kantil regresyonunun onları nasıl öğrendiğini, platformun bandı konformal tahminle nasıl kalibre ettiğini — ve tahmin P90'ının neden verim değerlendirmesinin P90'ı olmadığını açıklar.",
    },
    objectives: [
      { en: "Define P10/P50/P90 as quantiles and explain why wind power is not Gaussian.", tr: "P10/P50/P90'ı kantiller olarak tanımlamak ve rüzgâr gücünün neden Gauss dağılımlı olmadığını açıklamak." },
      { en: "Show why minimising the pinball loss yields the τ-quantile.", tr: "Pinball kaybını en aza indirmenin neden τ-kantili verdiğini göstermek." },
      { en: "Apply conformalised quantile regression and read its effect on coverage.", tr: "Konformalleştirilmiş kantil regresyonunu uygulamak ve kapsama üzerindeki etkisini okumak." },
      { en: "Distinguish forecast quantiles from exceedance probabilities in yield assessment.", tr: "Tahmin kantillerini verim değerlendirmesindeki aşılma olasılıklarından ayırt etmek." },
    ],
    sections: [
      {
        id: "distribution",
        title: { en: "Why one number is not enough", tr: "Tek bir sayı neden yetmez" },
        blocks: [
          {
            kind: "p",
            text: {
              en: "The value of a forecast depends on the decision it supports [@murphy1993]. A trader facing asymmetric imbalance prices bids a quantile, not the mean (chapter 5); a TSO sizes reserves from the width of the band; an operator plans a vessel trip on the probability of low wind. Probabilistic forecasting has therefore become standard in research and is spreading in operation [@pinson2013;@sweeney2020].",
              tr: "Bir tahminin değeri desteklediği karara bağlıdır [@murphy1993]. Asimetrik dengesizlik fiyatlarıyla karşılaşan bir tüccar ortalamayı değil bir kantili teklif eder (bölüm 5); bir İSO rezervleri bandın genişliğinden boyutlandırır; bir işletmeci bir gemi seferini düşük rüzgâr olasılığına göre planlar. Bu yüzden olasılıksal tahmin araştırmada standart hâline gelmiştir ve işletmede yaygınlaşmaktadır [@pinson2013;@sweeney2020].",
            },
          },
          {
            kind: "p",
            text: {
              en: "The quantile $q_\\tau$ is the level the outcome stays below with probability $\\tau$: P50 is the median, P10 is exceeded nine times in ten, P90 only once in ten. Between P10 and P90 lie 80 % of outcomes — if the forecast is calibrated. Wind power is bounded by zero and capacity, skewed, and its uncertainty changes with the wind (chapter 2); a symmetric Gaussian band is wrong exactly where it matters [@pinson2007].",
              tr: "$q_\\tau$ kantili, sonucun $\\tau$ olasılıkla altında kaldığı seviyedir: P50 medyandır, P10 on seferde dokuz kez aşılır, P90 on seferde yalnızca bir kez. P10 ile P90 arasında sonuçların %80'i bulunur — tahmin kalibre edilmişse. Rüzgâr gücü sıfır ve kapasiteyle sınırlıdır, çarpıktır ve belirsizliği rüzgârla değişir (bölüm 2); simetrik bir Gauss bandı tam da önemli olduğu yerde yanlıştır [@pinson2007].",
            },
          },
          {
            kind: "fig",
            fig: "cf-histogram",
            caption: {
              en: "Distribution of the measured hourly output of the three DK2 farms. {calm_share} % of hours lie below 5 % of capacity and the distribution is strongly skewed; no Gaussian describes it, and a symmetric band around a low forecast would include negative power.",
              tr: "Üç DK2 santralinin ölçülen saatlik üretiminin dağılımı. Saatlerin %{calm_share}'i kapasitenin %5'inin altındadır ve dağılım güçlü biçimde çarpıktır; hiçbir Gauss dağılımı onu tanımlamaz ve düşük bir tahmin etrafındaki simetrik bir bant negatif güç içerirdi.",
            },
            source: { en: "{hours} hours, Energinet [@energinet].", tr: "{hours} saat, Energinet [@energinet]." },
          },
        ],
      },
      {
        id: "pinball",
        title: { en: "Quantile regression and the pinball loss", tr: "Kantil regresyonu ve pinball kaybı" },
        blocks: [
          {
            kind: "p",
            text: {
              en: "Koenker and Bassett generalised least squares to any quantile [@koenker1978]. The pinball loss weighs under-forecasts by $\\tau$ and over-forecasts by $1-\\tau$; setting the derivative of its expectation to zero gives $F(q) = \\tau$, so its minimum is the τ-quantile. It is a strictly proper scoring rule for quantiles: an honest forecaster minimises it by reporting the true quantile [@gneiting2007].",
              tr: "Koenker ve Bassett en küçük kareleri herhangi bir kantile genelleştirdi [@koenker1978]. Pinball kaybı eksik tahminleri $\\tau$, fazla tahminleri $1-\\tau$ ile ağırlıklandırır; beklentisinin türevini sıfıra eşitlemek $F(q) = \\tau$ verir, dolayısıyla minimumu τ-kantildir. Kantiller için kesin uygun bir skorlama kuralıdır: dürüst bir tahminci onu gerçek kantili raporlayarak en aza indirir [@gneiting2007].",
            },
          },
          {
            kind: "eq",
            tex: "\\ell_\\tau(y, q) = \\begin{cases} \\tau\\,(y-q), & y \\ge q \\\\ (1-\\tau)\\,(q-y), & y < q \\end{cases}, \\qquad \\frac{\\mathrm d}{\\mathrm dq}\\,\\mathbb E\\,\\ell_\\tau = -\\tau\\,(1-F(q)) + (1-\\tau)\\,F(q) = 0 \\;\\Rightarrow\\; F(q^*) = \\tau",
            source: "Koenker & Bassett (1978)",
          },
          {
            kind: "fig",
            fig: "pinball-demo",
            caption: {
              en: "The minimum of the average pinball loss over 220 possible outcomes of one hour lands where a share τ of them lies below. Move τ from 0.1 to 0.9 and watch the minimum walk through the skewed distribution — a quantile model learns this point for every set of features.",
              tr: "Bir saatin 220 olası sonucu üzerindeki ortalama pinball kaybının minimumu, sonuçların τ kadarlık bir payının altında kaldığı noktaya düşer. τ'yu 0,1'den 0,9'a kaydırın ve minimumun çarpık dağılım boyunca yürüdüğünü izleyin — bir kantil modeli bu noktayı her özellik kümesi için öğrenir.",
            },
          },
          {
            kind: "fig",
            fig: "fan-chart",
            caption: {
              en: "Nine quantiles of the XGBoost and TFT forecasts over the real week: nested bands P10–P90, P20–P80, P30–P70, P40–P60 and the median. The bands widen where the NWP is uncertain and narrow in calm or saturated hours. Quantiles are sorted so that they never cross.",
              tr: "Gerçek hafta boyunca XGBoost ve TFT tahminlerinin dokuz kantili: iç içe P10–P90, P20–P80, P30–P70, P40–P60 bantları ve medyan. Bantlar NWP'nin belirsiz olduğu yerde genişler, sakin ya da doymuş saatlerde daralır. Kantiller hiç kesişmesin diye sıralanır.",
            },
            source: { en: "out-of-fold forecasts of this platform; measured output: Energinet [@energinet].", tr: "bu platformun katman dışı tahminleri; ölçülen üretim: Energinet [@energinet]." },
          },
        ],
      },
      {
        id: "conformal",
        title: { en: "Conformal calibration", tr: "Konformal kalibrasyon" },
        blocks: [
          {
            kind: "p",
            text: {
              en: "A quantile model trained on the past is often over-confident on the future: on the DK2 test hours the raw XGBoost P10–P90 band holds only {raw_cov} % of outcomes instead of 80 %. **Conformal prediction** fixes coverage with a distribution-free guarantee [@vovk2005]. In conformalised quantile regression (CQR) [@romano2019] the model is fitted on part of the training data, its misses are measured on a held-out calibration slice, and the band is widened by the appropriate quantile of those misses:",
              tr: "Geçmişte eğitilmiş bir kantil modeli gelecekte çoğu zaman aşırı güvenlidir: DK2 test saatlerinde ham XGBoost P10–P90 bandı sonuçların %80'i yerine yalnızca %{raw_cov}'ünü içerir. **Konformal tahmin**, kapsamayı dağılımdan bağımsız bir garantiyle düzeltir [@vovk2005]. Konformalleştirilmiş kantil regresyonunda (CQR) [@romano2019] model eğitim verisinin bir kısmında uydurulur, ıskaları ayrılmış bir kalibrasyon diliminde ölçülür ve bant bu ıskaların uygun kantili kadar genişletilir:",
            },
          },
          {
            kind: "eq",
            tex: "E_i = \\max\\bigl(\\hat q_{0.1}(\\mathbf x_i) - y_i,\\; y_i - \\hat q_{0.9}(\\mathbf x_i)\\bigr), \\qquad m = Q_{0.8}\\bigl(\\{E_i\\}_{i \\in \\text{cal}}\\bigr), \\qquad \\tilde q_\\tau = \\hat q_\\tau + m\\,\\frac{\\tau - 0.5}{0.4}",
            where: [
              { sym: "E_i", def: { en: "conformity score: how far outcome i falls outside the band (negative inside)", tr: "uyum skoru: i sonucunun bandın ne kadar dışına düştüğü (içerdeyse negatif)" }, unit: "MW" },
              { sym: "m", def: { en: "margin: 80 % quantile of the scores on the calibration slice", tr: "pay: kalibrasyon dilimindeki skorların %80 kantili" }, unit: "MW" },
              { sym: "\\tilde q_\\tau", def: { en: "calibrated quantile; P10 and P90 move by m, inner quantiles proportionally", tr: "kalibre edilmiş kantil; P10 ve P90 m kadar, iç kantiller orantılı kayar" }, unit: "MW" },
            ],
            source: "Romano, Patterson & Candès (2019); interpolation of inner quantiles: this platform",
          },
          {
            kind: "fig",
            fig: "conformal",
            caption: {
              en: "Coverage of the XGBoost P10–P90 band on the test hours before and after the conformal margin, and the margin per fold. The first fold, trained on June–October 2024 only, misses most on its calibration slice and gets the widest margin ({margin_first} MW); with more training data the margin shrinks to {margin_last} MW.",
              tr: "XGBoost P10–P90 bandının test saatlerindeki kapsaması, konformal paydan önce ve sonra, ve katman başına pay. Yalnızca Haziran–Ekim 2024 ile eğitilen ilk katman kalibrasyon diliminde en çok ıskalar ve en geniş payı alır ({margin_first} MW); daha fazla eğitim verisiyle pay {margin_last} MW'a küçülür.",
            },
          },
          {
            kind: "callout",
            tone: "note",
            title: { en: "Why the platform's band is slightly too wide", tr: "Platformun bandı neden biraz fazla geniş" },
            body: [
              {
                en: "Strict split-conformal keeps the model fitted on the reduced training set. The platform refits on the full training block after measuring the margin, so the forecast uses all data — but the refitted model is a little better than the one the margin was measured on. The band is therefore conservative: {xgb_cov} % coverage instead of 80 %. A trade-off chosen deliberately; a reliability diagram shows it (chapter 12).",
                tr: "Katı bölünmüş konformal yöntem, küçültülmüş eğitim setinde uydurulan modeli korur. Platform payı ölçtükten sonra tüm eğitim bloğunda yeniden uydurur; böylece tahmin tüm veriyi kullanır — ama yeniden uydurulan model, payın ölçüldüğü modelden biraz daha iyidir. Bu yüzden bant temkinlidir: %80 yerine %{xgb_cov} kapsama. Bilinçli seçilmiş bir ödünleşim; güvenilirlik diyagramı bunu gösterir (bölüm 12).",
              },
            ],
          },
        ],
      },
      {
        id: "p90",
        title: { en: "Two different P90s", tr: "İki farklı P90" },
        blocks: [
          {
            kind: "callout",
            tone: "pitfall",
            title: { en: "Forecast quantile versus yield exceedance", tr: "Tahmin kantili ile verim aşılması" },
            body: [
              {
                en: "In a forecast, **P90 is the high quantile**: the output stays below it nine hours in ten. In energy-yield assessment (the Wind Resource page), **P90 is an exceedance level**: the annual yield is exceeded with 90 % probability — the low, bankable value lenders use. Same name, opposite tails. Always ask \"quantile or exceedance?\" before comparing numbers.",
                tr: "Bir tahminde **P90 yüksek kantildir**: üretim on saatin dokuzunda onun altında kalır. Enerji verimi değerlendirmesinde (Rüzgâr Kaynağı sayfası) **P90 bir aşılma seviyesidir**: yıllık verim %90 olasılıkla aşılır — kredi verenlerin kullandığı düşük, bankaya kabul edilebilir değer. Aynı ad, karşıt kuyruklar. Sayıları karşılaştırmadan önce her zaman \"kantil mi, aşılma mı?\" diye sorun.",
              },
            ],
          },
        ],
      },
    ],
    practice: {
      platform: [
        { en: "XGBoost and the TFT forecast nine quantiles; XGBoost's band is conformalised per fold on the newest 20 % of training and holds {xgb_cov} % of test hours; the TFT's uncorrected band holds {tft_cov} %.", tr: "XGBoost ve TFT dokuz kantil tahmin eder; XGBoost'un bandı her katmanda eğitimin en yeni %20'si üzerinde konformalleştirilir ve test saatlerinin %{xgb_cov}'ini içerir; TFT'nin düzeltilmemiş bandı %{tft_cov}'ünü içerir." },
        { en: "Quantiles are sorted (no crossing) and clipped to 0 … {capacity} MW by `enforce_physical_constraints`.", tr: "Kantiller sıralanır (kesişme yok) ve `enforce_physical_constraints` ile 0 … {capacity} MW aralığına kırpılır." },
      ],
      files: ["backend/app/services/p4/real_data.py · _xgb_fold()", "backend/app/services/p4/physical_constraints.py"],
      industry: [
        { en: "TSOs use forecast quantiles to size reserves dynamically; traders bid cost-optimal quantiles; probabilistic forecasts were the official target of GEFCom2014 [@hong2016;@iea2022].", tr: "İSO'lar rezervleri dinamik olarak boyutlandırmak için tahmin kantillerini kullanır; tüccarlar maliyet açısından en iyi kantilleri teklif eder; olasılıksal tahminler GEFCom2014'ün resmî hedefiydi [@hong2016;@iea2022]." },
        { en: "Conformal prediction is increasingly used wherever calibrated intervals are required — from medicine to finance — because it needs no distributional assumption [@romano2019].", tr: "Konformal tahmin, dağılım varsayımı gerektirmediği için kalibre edilmiş aralıkların gerektiği her yerde — tıptan finansa — giderek daha çok kullanılmaktadır [@romano2019]." },
      ],
      solves: [
        { en: "Turns a point forecast into a basis for risk decisions: reserves, cost-optimal bids, maintenance windows.", tr: "Bir nokta tahminini risk kararları için bir temele dönüştürür: rezervler, maliyet açısından en iyi teklifler, bakım pencereleri." },
        { en: "Conformal calibration repairs over-confident bands with a guarantee that holds under exchangeability.", tr: "Konformal kalibrasyon, aşırı güvenli bantları değiştirilebilirlik altında geçerli bir garantiyle onarır." },
      ],
      limits: [
        { en: "The conformal guarantee assumes calibration and test data are exchangeable; seasons and drift weaken it, which is why the margin is re-estimated in every fold.", tr: "Konformal garanti, kalibrasyon ve test verisinin değiştirilebilir olduğunu varsayar; mevsimler ve kayma bunu zayıflatır; payın her katmanda yeniden tahmin edilmesinin nedeni budur." },
        { en: "Marginal coverage (over all hours) does not imply coverage in every weather situation.", tr: "Marjinal kapsama (tüm saatler üzerinden), her hava durumunda kapsama anlamına gelmez." },
      ],
    },
    takeaways: [
      { en: "Quantiles describe a bounded, skewed distribution where Gaussian bands fail.", tr: "Kantiller, Gauss bantlarının başarısız olduğu sınırlı, çarpık bir dağılımı tanımlar." },
      { en: "The minimum of the expected pinball loss is the τ-quantile; it is a proper score.", tr: "Beklenen pinball kaybının minimumu τ-kantildir; uygun bir skordur." },
      { en: "Conformal calibration raised XGBoost's coverage from {raw_cov} % to {xgb_cov} %; forecast P90 ≠ yield P90.", tr: "Konformal kalibrasyon XGBoost'un kapsamasını %{raw_cov}'ten %{xgb_cov}'e çıkardı; tahmin P90'ı ≠ verim P90'ı." },
    ],
    quiz: [
      {
        q: { en: "A calibrated P90 forecast for 15:00 is 700 MW. What does it say?", tr: "15:00 için kalibre edilmiş bir P90 tahmini 700 MW. Ne söyler?" },
        options: [
          { en: "Output will exceed 700 MW with 90 % probability", tr: "Üretim %90 olasılıkla 700 MW'ı aşacak" },
          { en: "Output will stay below 700 MW with 90 % probability", tr: "Üretim %90 olasılıkla 700 MW'ın altında kalacak" },
          { en: "Output will be 700 MW ± 10 %", tr: "Üretim 700 MW ± %10 olacak" },
        ],
        answer: 1,
        why: { en: "A forecast quantile at τ = 0.9 is exceeded only one time in ten.", tr: "τ = 0,9'daki bir tahmin kantili on seferde yalnızca bir kez aşılır." },
      },
      {
        q: { en: "On the calibration slice, the P10–P90 band misses by up to 98 MW (80 % quantile of the misses). What does CQR do?", tr: "Kalibrasyon diliminde P10–P90 bandı 98 MW'a kadar ıskalıyor (ıskaların %80 kantili). CQR ne yapar?" },
        options: [
          { en: "Lowers P10 and raises P90 by 98 MW", tr: "P10'u 98 MW düşürür, P90'ı 98 MW yükseltir" },
          { en: "Retrains the model with more trees", tr: "Modeli daha çok ağaçla yeniden eğitir" },
          { en: "Shifts all quantiles up by 98 MW", tr: "Tüm kantilleri 98 MW yukarı kaydırır" },
        ],
        answer: 0,
        why: { en: "The margin widens the band symmetrically so that ≈ 80 % of calibration outcomes fall inside.", tr: "Pay, kalibrasyon sonuçlarının ≈ %80'i içeride kalacak şekilde bandı simetrik olarak genişletir." },
      },
    ],
    concepts: ["quantile", "pinball", "uncertainty", "conformal"],
  },

  // ───────────────────────────────────────────────────────────────── 12
  {
    id: "evaluation",
    n: 12,
    part: "uncertainty",
    title: { en: "Evaluating forecasts: errors, skill, CRPS and reliability", tr: "Tahminleri değerlendirmek: hatalar, beceri, CRPS ve güvenilirlik" },
    lead: {
      en: "A forecast is only as credible as its evaluation. Point forecasts are judged by bias, MAE and RMSE relative to capacity and to references; probabilistic forecasts by proper scores such as the CRPS and by whether their quantiles are calibrated. This chapter defines every score on the Day-ahead tab, shows how to read them on real data, and states their limits.",
      tr: "Bir tahmin ancak değerlendirmesi kadar güvenilirdir. Nokta tahminleri kapasiteye ve referanslara göre sapma, MAE ve RMSE ile; olasılıksal tahminler CRPS gibi uygun skorlarla ve kantillerinin kalibre olup olmadığıyla değerlendirilir. Bu bölüm Gün öncesi sekmesindeki her skoru tanımlar, gerçek veride nasıl okunacağını gösterir ve sınırlarını belirtir.",
    },
    objectives: [
      { en: "Compute nRMSE, nMAE, bias and skill scores and choose between them.", tr: "nRMSE, nMAE, sapma ve beceri skorlarını hesaplamak ve aralarında seçim yapmak." },
      { en: "Explain the CRPS geometrically and relate it to the pinball loss.", tr: "CRPS'yi geometrik olarak açıklamak ve pinball kaybıyla ilişkilendirmek." },
      { en: "Read a reliability diagram and diagnose over- and under-confidence.", tr: "Bir güvenilirlik diyagramını okumak ve aşırı ve yetersiz güveni teşhis etmek." },
    ],
    sections: [
      {
        id: "point",
        title: { en: "Point scores", tr: "Nokta skorları" },
        blocks: [
          {
            kind: "p",
            text: {
              en: "The standard protocol for wind power forecasts normalises errors by installed capacity, so that farms of different size can be compared, and decomposes them into a systematic part (bias) and a random part [@madsen2005]. RMSE weighs large errors more and matches the squared-loss training of point models; MAE is the natural score for median forecasts and is proportional to imbalance energy.",
              tr: "Rüzgâr gücü tahminleri için standart protokol, farklı büyüklükteki santrallerin karşılaştırılabilmesi için hataları kurulu kapasiteye göre normalleştirir ve onları sistematik bir parçaya (sapma) ve rastgele bir parçaya ayırır [@madsen2005]. RMSE büyük hatalara daha çok ağırlık verir ve nokta modellerinin kare kayıplı eğitimine uyar; MAE medyan tahminleri için doğal skordur ve dengesizlik enerjisiyle orantılıdır.",
            },
          },
          {
            kind: "eq",
            tex: "\\text{bias} = \\frac{1}{n\\,C}\\sum_t (\\hat P_t - P_t), \\qquad \\text{nMAE} = \\frac{1}{n\\,C}\\sum_t \\lvert \\hat P_t - P_t \\rvert, \\qquad \\text{nRMSE} = \\frac{1}{C}\\sqrt{\\frac1n \\sum_t (\\hat P_t - P_t)^2}",
            where: [
              { sym: "C", def: { en: "installed capacity (here 977.4 MW)", tr: "kurulu kapasite (burada 977,4 MW)" }, unit: "MW" },
              { sym: "n", def: { en: "number of scored hours", tr: "puanlanan saat sayısı" } },
            ],
            source: "Madsen et al. (2005)",
          },
          {
            kind: "fig",
            fig: "metrics-lab",
            caption: {
              en: "Error of each forecast over the real week. Switch between forecasts and compare the scores for this single week with the averages over all test hours in Figure 12.4 — one week can differ a lot from the long-run picture.",
              tr: "Gerçek hafta boyunca her tahminin hatası. Tahminler arasında geçiş yapın ve bu tek haftanın skorlarını Şekil 12.4'teki tüm test saatleri üzerinden ortalamalarla karşılaştırın — tek bir hafta uzun dönem tablosundan çok farklı olabilir.",
            },
          },
          {
            kind: "p",
            text: {
              en: "A **skill score** compares a forecast with a reference on the same hours: $\\text{SS} = 1 - \\text{MSE}/\\text{MSE}_{\\text{ref}}$. Zero means no better than the reference; one would be perfect. The platform reports skill against 24-hour persistence and against climatology [@madsen2005;@messner2020].",
              tr: "Bir **beceri skoru** bir tahmini aynı saatlerde bir referansla karşılaştırır: $\\text{SS} = 1 - \\text{MSE}/\\text{MSE}_{\\text{ref}}$. Sıfır referanstan iyi değil demektir; bir kusursuz olurdu. Platform 24 saatlik kalıcılığa ve klimatolojiye karşı beceriyi raporlar [@madsen2005;@messner2020].",
            },
          },
          {
            kind: "callout",
            tone: "note",
            title: { en: "A detail about the persistence reference", tr: "Kalıcılık referansıyla ilgili bir ayrıntı" },
            body: [
              {
                en: "Strictly, a bid at 12:00 D−1 knows measured power only up to about 11:00 D−1, so for afternoon hours of D the value 24 hours earlier is not yet known. The 24-hour persistence used here is therefore slightly favourable to the reference, and the reported skill against it is conservative.",
                tr: "Kesin konuşmak gerekirse, 12:00 D−1'deki bir teklif ölçülen gücü ancak yaklaşık 11:00 D−1'e kadar bilir; bu yüzden D'nin öğleden sonra saatleri için 24 saat önceki değer henüz bilinmemektedir. Burada kullanılan 24 saatlik kalıcılık bu nedenle referans lehine hafifçe avantajlıdır ve ona karşı raporlanan beceri temkinlidir.",
              },
            ],
          },
        ],
      },
      {
        id: "crps",
        title: { en: "Scoring a distribution: the CRPS", tr: "Bir dağılımı puanlamak: CRPS" },
        blocks: [
          {
            kind: "p",
            text: {
              en: "The continuous ranked probability score compares the whole forecast distribution $F$ with the outcome $y$: it integrates the squared difference between $F$ and the step function that jumps at $y$ [@matheson1976;@hersbach2000]. It is strictly proper, has the unit of the variable (MW), and for a point forecast reduces to the absolute error — so point and probabilistic forecasts are compared on one scale [@gneiting2007]. With nine quantiles it is approximated by the average pinball loss:",
              tr: "Sürekli sıralı olasılık skoru, tüm tahmin dağılımını $F$ sonuçla $y$ karşılaştırır: $F$ ile $y$'de sıçrayan basamak fonksiyonu arasındaki kare farkın integralini alır [@matheson1976;@hersbach2000]. Kesin uygundur, değişkenin birimine (MW) sahiptir ve bir nokta tahmini için mutlak hataya indirgenir — böylece nokta ve olasılıksal tahminler tek bir ölçekte karşılaştırılır [@gneiting2007]. Dokuz kantille ortalama pinball kaybıyla yaklaşık hesaplanır:",
            },
          },
          {
            kind: "eq",
            tex: "\\text{CRPS}(F, y) = \\int_{-\\infty}^{\\infty}\\bigl(F(x) - \\mathbb 1\\{x \\ge y\\}\\bigr)^2\\,\\mathrm dx \\;\\approx\\; \\frac{2}{9}\\sum_{\\tau = 0.1}^{0.9} \\ell_\\tau\\bigl(y, \\hat q_\\tau\\bigr)",
            where: [
              { sym: "F(x)", def: { en: "forecast cumulative distribution function", tr: "tahminin birikimli dağılım fonksiyonu" } },
              { sym: "\\mathbb 1\\{x \\ge y\\}", def: { en: "step function of the outcome", tr: "sonucun basamak fonksiyonu" } },
            ],
            source: "Matheson & Winkler (1976); Gneiting & Raftery (2007), §4.2",
          },
          {
            kind: "fig",
            fig: "crps-geometry",
            caption: {
              en: "CRPS as an area. The forecast CDF is drawn through the nine quantiles of one real hour; the shaded area between it and the observation's step is the CRPS (squared vertical gaps integrated over x). A sharp, well-placed forecast leaves little area; a wide or displaced one leaves more. The quantile score is the discrete version used on the Day-ahead tab.",
              tr: "Bir alan olarak CRPS. Tahmin DF'si gerçek bir saatin dokuz kantilinden geçirilerek çizilir; onunla gözlemin basamağı arasındaki taralı alan CRPS'dir (x üzerinde integrali alınmış kare dikey farklar). Keskin, iyi konumlanmış bir tahmin az alan bırakır; geniş ya da kaymış bir tahmin daha çok. Kantil skoru Gün öncesi sekmesinde kullanılan ayrık sürümdür.",
            },
          },
          {
            kind: "p",
            text: {
              en: "The CRPS skill score against climatology, $\\text{CRPSS} = 1 - \\text{CRPS}/\\text{CRPS}_{\\text{clim}}$, uses the climatological quantiles of each training block as the reference. XGBoost reaches {xgb_crps} % CRPS and CRPSS {xgb_crpss}.",
              tr: "Klimatolojiye karşı CRPS beceri skoru, $\\text{CRPSS} = 1 - \\text{CRPS}/\\text{CRPS}_{\\text{klim}}$, referans olarak her eğitim bloğunun klimatolojik kantillerini kullanır. XGBoost %{xgb_crps} CRPS ve {xgb_crpss} CRPSS'ye ulaşır.",
            },
          },
        ],
      },
      {
        id: "reliability",
        title: { en: "Calibration and sharpness", tr: "Kalibrasyon ve keskinlik" },
        blocks: [
          {
            kind: "p",
            text: {
              en: "Gneiting, Balabdaoui and Raftery state the goal of probabilistic forecasting as **maximising sharpness subject to calibration** [@gneiting2007b]. Calibration (reliability) means that outcomes fall below the τ-quantile a share τ of the time; sharpness means the bands are narrow. A reliability diagram plots the observed share below each quantile against τ; a calibrated forecast lies on the diagonal [@pinson2007].",
              tr: "Gneiting, Balabdaoui ve Raftery olasılıksal tahminin hedefini **kalibrasyon koşuluyla keskinliği en üst düzeye çıkarmak** olarak ifade eder [@gneiting2007b]. Kalibrasyon (güvenilirlik), sonuçların zamanın τ kadarlık bir payında τ-kantilin altına düşmesi demektir; keskinlik bantların dar olması demektir. Bir güvenilirlik diyagramı her kantilin altındaki gözlenen payı τ'ya karşı çizer; kalibre edilmiş bir tahmin köşegen üzerinde yer alır [@pinson2007].",
            },
          },
          {
            kind: "fig",
            fig: "reliability",
            caption: {
              en: "Reliability of XGBoost, TFT and climatology on the test hours. XGBoost lies close to the diagonal with slightly too few hours below P10 and too many below P90 — a band a little too wide, as the conformal refit predicts — and its middle quantiles sit a little low, consistent with its bias of {xgb_bias} %. The TFT's curve is flatter than the diagonal — more outcomes fall outside its band than it claims: over-confident. Climatology is calibrated per training block but far from sharp, and the season mismatch between training and test blocks tilts it.",
              tr: "Test saatlerinde XGBoost, TFT ve klimatolojinin güvenilirliği. XGBoost köşegene yakındır; P10'un altında biraz az, P90'ın altında biraz fazla saat vardır — konformal yeniden uydurmanın öngördüğü gibi biraz fazla geniş bir bant — ve orta kantilleri, sapmasıyla (%{xgb_bias}) tutarlı olarak biraz düşüktür. TFT'nin eğrisi köşegenden daha yatıktır — bandının dışına iddia ettiğinden daha çok sonuç düşer: aşırı güvenli. Klimatoloji eğitim bloğu başına kalibredir ama hiç keskin değildir ve eğitim ile test blokları arasındaki mevsim uyumsuzluğu onu eğer.",
            },
          },
        ],
      },
      {
        id: "board",
        title: { en: "The score board", tr: "Skor tablosu" },
        blocks: [
          {
            kind: "fig",
            fig: "score-board",
            caption: {
              en: "Every forecast on the same {scored_hours} test hours, sorted by nRMSE. XGBoost leads; the physics-only NWP curve comes second — evidence that most day-ahead skill is the weather model's; the TSO's forecast covers more farms and is rescaled; the ensemble and the networks trail.",
              tr: "Aynı {scored_hours} test saatinde her tahmin, nRMSE'ye göre sıralanmış. XGBoost öndedir; yalnızca fizik temelli NWP eğrisi ikinci gelir — gün öncesi becerinin çoğunun hava modelinin olduğunun kanıtı; İSO'nun tahmini daha çok santrali kapsar ve yeniden ölçeklenir; topluluk ve ağlar geride kalır.",
            },
          },
          {
            kind: "callout",
            tone: "pitfall",
            title: { en: "One score never tells the whole story", tr: "Tek bir skor asla bütün hikâyeyi anlatmaz" },
            body: [
              {
                en: "Murphy distinguishes a forecast's consistency, quality and value [@murphy1993]. A lower nRMSE is quality; the money saved depends on prices and on where errors occur. Compare forecasts on the same hours, with more than one score, and with per-fold results to see whether a difference is stable.",
                tr: "Murphy bir tahminin tutarlılığını, kalitesini ve değerini ayırt eder [@murphy1993]. Daha düşük nRMSE kalitedir; tasarruf edilen para fiyatlara ve hataların nerede oluştuğuna bağlıdır. Tahminleri aynı saatlerde, birden fazla skorla ve bir farkın kararlı olup olmadığını görmek için katman başına sonuçlarla karşılaştırın.",
              },
            ],
          },
        ],
      },
    ],
    practice: {
      platform: [
        { en: "The score table reports nRMSE, nMAE, bias, skill vs persistence and climatology, CRPS, CRPSS and nRMSE per fold for every forecast; the reliability chart covers XGBoost, TFT and climatology.", tr: "Skor tablosu her tahmin için nRMSE, nMAE, sapma, kalıcılığa ve klimatolojiye karşı beceri, CRPS, CRPSS ve katman başına nRMSE raporlar; güvenilirlik grafiği XGBoost, TFT ve klimatolojiyi kapsar." },
        { en: "All scores use the same hours: a forecast missing for an hour removes that hour for everyone, so no forecast is scored on easier hours.", tr: "Tüm skorlar aynı saatleri kullanır: bir saatte eksik olan bir tahmin o saati herkes için çıkarır; böylece hiçbir tahmin daha kolay saatlerde puanlanmaz." },
      ],
      files: ["backend/app/services/p4/real_data.py · quantile_score()", "frontend/src/components/p4/RealDataPanel.tsx"],
      industry: [
        { en: "Forecast providers are benchmarked on nMAE/nRMSE and, increasingly, on CRPS and reliability, following the IEA Wind Recommended Practice [@iea2022;@messner2020].", tr: "Tahmin sağlayıcıları IEA Wind Önerilen Uygulamasına göre nMAE/nRMSE ile ve giderek artan biçimde CRPS ve güvenilirlikle kıyaslanır [@iea2022;@messner2020]." },
        { en: "Weather centres verify their ensemble forecasts with the CRPS every day [@hersbach2000].", tr: "Hava merkezleri topluluk tahminlerini her gün CRPS ile doğrular [@hersbach2000]." },
      ],
      solves: [
        { en: "Makes forecasts comparable across farms, models and time, and detects systematic problems (bias, miscalibration).", tr: "Tahminleri santraller, modeller ve zaman boyunca karşılaştırılabilir kılar ve sistematik sorunları (sapma, yanlış kalibrasyon) tespit eder." },
      ],
      limits: [
        { en: "Averages hide when errors happen; with strongly correlated hours the effective sample is small (chapter 6), so small differences are not significant.", tr: "Ortalamalar hataların ne zaman oluştuğunu gizler; güçlü biçimde ilişkili saatlerde etkin örnek küçüktür (bölüm 6); bu yüzden küçük farklar anlamlı değildir." },
      ],
    },
    takeaways: [
      { en: "Normalise by capacity; report bias, nMAE and nRMSE, and skill against persistence and climatology on the same hours.", tr: "Kapasiteye göre normalleştirin; sapma, nMAE ve nRMSE ile aynı saatlerde kalıcılığa ve klimatolojiye karşı beceriyi raporlayın." },
      { en: "CRPS scores the whole distribution in MW and equals the MAE for a point forecast.", tr: "CRPS tüm dağılımı MW cinsinden puanlar ve nokta tahmini için MAE'ye eşittir." },
      { en: "Aim for sharp bands that are calibrated: check the reliability diagram.", tr: "Kalibre edilmiş keskin bantları hedefleyin: güvenilirlik diyagramını kontrol edin." },
    ],
    quiz: [
      {
        q: { en: "Forecast A has CRPS 7.8 % and forecast B (a point forecast) has MAE 10.8 %. Which is better probabilistically?", tr: "A tahmininin CRPS'si %7,8, B tahmininin (nokta tahmini) MAE'si %10,8. Olasılıksal olarak hangisi daha iyi?" },
        options: [
          { en: "They cannot be compared", tr: "Karşılaştırılamazlar" },
          { en: "A — the CRPS of a point forecast equals its MAE, so both are on one scale", tr: "A — bir nokta tahmininin CRPS'si MAE'sine eşittir, yani ikisi tek ölçektedir" },
          { en: "B — MAE is always smaller than CRPS", tr: "B — MAE her zaman CRPS'den küçüktür" },
        ],
        answer: 1,
        why: { en: "For a point forecast the CRPS reduces to the absolute error, so 7.8 % vs 10.8 % is a fair comparison.", tr: "Bir nokta tahmini için CRPS mutlak hataya indirgenir; bu yüzden %7,8'e karşı %10,8 adil bir karşılaştırmadır." },
      },
      {
        q: { en: "In a reliability diagram, 25 % of outcomes fall below the forecast P10. What is wrong?", tr: "Bir güvenilirlik diyagramında sonuçların %25'i tahmin P10'unun altına düşüyor. Sorun nedir?" },
        options: [
          { en: "P10 is too high — the lower tail is too narrow", tr: "P10 çok yüksek — alt kuyruk çok dar" },
          { en: "P10 is too low", tr: "P10 çok düşük" },
          { en: "Nothing, 25 % is within tolerance", tr: "Hiçbir şey, %25 tolerans içinde" },
        ],
        answer: 0,
        why: { en: "A calibrated P10 has 10 % below it; 25 % means the forecast's lower quantile sits too high (over-confident on the low side).", tr: "Kalibre edilmiş bir P10'un altında %10 vardır; %25, tahminin alt kantilinin çok yüksekte durduğu anlamına gelir (alt tarafta aşırı güvenli)." },
      },
    ],
    concepts: ["skill", "crps", "reliability", "persistence"],
  },

  // ───────────────────────────────────────────────────────────────── 13
  {
    id: "ensemble",
    n: 13,
    part: "uncertainty",
    title: { en: "Ensembles, explanation and physical consistency", tr: "Topluluklar, açıklama ve fiziksel tutarlılık" },
    lead: {
      en: "Three questions remain once models are trained: can combining them help, can an engineer see why a forecast says what it says, and is every output physically possible? This chapter answers all three on real data — including an honest negative result: the platform's ensemble does not beat its best member, and the error correlations show why.",
      tr: "Modeller eğitildikten sonra üç soru kalır: onları birleştirmek yardımcı olur mu, bir mühendis bir tahminin neden öyle dediğini görebilir mi ve her çıktı fiziksel olarak mümkün mü? Bu bölüm üçünü de gerçek veri üzerinde yanıtlar — dürüst bir olumsuz sonuç dahil: platformun topluluğu en iyi üyesini geçemez ve hata korelasyonları nedenini gösterir.",
    },
    objectives: [
      { en: "Compute the error of a weighted combination from member errors and their correlation.", tr: "Ağırlıklı bir birleşimin hatasını üye hatalarından ve korelasyonlarından hesaplamak." },
      { en: "Explain a single forecast with Shapley values and read a SHAP waterfall.", tr: "Tek bir tahmini Shapley değerleriyle açıklamak ve bir SHAP şelalesini okumak." },
      { en: "State the physical constraints applied after machine learning.", tr: "Makine öğrenmesinden sonra uygulanan fiziksel kısıtları ifade etmek." },
    ],
    sections: [
      {
        id: "combination",
        title: { en: "Combining forecasts", tr: "Tahminleri birleştirmek" },
        blocks: [
          {
            kind: "p",
            text: {
              en: "Bates and Granger showed in 1969 that a weighted combination of two forecasts can beat both, and that the weights should depend on their error variances and covariance [@bates1969]. For two unbiased members A and B with error standard deviations $\\sigma_A, \\sigma_B$ and correlation $\\rho$:",
              tr: "Bates ve Granger 1969'da iki tahminin ağırlıklı bir birleşiminin ikisini de yenebileceğini ve ağırlıkların hata varyanslarına ve kovaryanslarına bağlı olması gerektiğini gösterdi [@bates1969]. Hata standart sapmaları $\\sigma_A, \\sigma_B$ ve korelasyonu $\\rho$ olan iki yansız A ve B üyesi için:",
            },
          },
          {
            kind: "eq",
            tex: "\\sigma^2(w) = w^2\\sigma_A^2 + (1-w)^2\\sigma_B^2 + 2w(1-w)\\rho\\,\\sigma_A\\sigma_B, \\qquad w^* = \\frac{\\sigma_B^2 - \\rho\\,\\sigma_A\\sigma_B}{\\sigma_A^2 + \\sigma_B^2 - 2\\rho\\,\\sigma_A\\sigma_B}",
            where: [
              { sym: "w", def: { en: "weight of member A; B gets 1 − w", tr: "A üyesinin ağırlığı; B, 1 − w alır" } },
              { sym: "\\rho", def: { en: "correlation of the two members' errors", tr: "iki üyenin hatalarının korelasyonu" } },
            ],
            source: "Bates & Granger (1969)",
          },
          {
            kind: "p",
            text: {
              en: "Moving weight from the better member A to the weaker member B helps only if $\\rho < \\sigma_A/\\sigma_B$: highly correlated members add their errors instead of cancelling them. Krogh and Vedelsby express the same idea for ensembles in general: ensemble error = mean member error − diversity [@krogh1995].",
              tr: "Ağırlığı daha iyi üye A'dan daha zayıf üye B'ye kaydırmak ancak $\\rho < \\sigma_A/\\sigma_B$ olduğunda yardımcı olur: yüksek korelasyonlu üyeler hatalarını götürmek yerine toplar. Krogh ve Vedelsby aynı fikri genel olarak topluluklar için ifade eder: topluluk hatası = ortalama üye hatası − çeşitlilik [@krogh1995].",
            },
          },
          {
            kind: "fig",
            fig: "error-correlation",
            caption: {
              en: "Correlation of the P50 errors on the test hours. Every pair is correlated above 0.74 — all forecasts share the same weather inputs and miss the same fronts. XGBoost's errors correlate {corr_xgb_curve} with the NWP curve's and only {corr_xgb_tso} with the TSO's, an independently made forecast.",
              tr: "Test saatlerinde P50 hatalarının korelasyonu. Her çift 0,74'ün üzerinde ilişkilidir — tüm tahminler aynı hava girdilerini paylaşır ve aynı cepheleri ıskalar. XGBoost'un hataları NWP eğrisininkilerle {corr_xgb_curve}, bağımsız olarak üretilen İSO tahmininkilerle ise yalnızca {corr_xgb_tso} korelasyonludur.",
            },
          },
          {
            kind: "fig",
            fig: "ensemble-calc",
            caption: {
              en: "RMSE of a two-member combination against the weight of XGBoost, with the real error levels and correlations. With the TFT or the LSTM, inverse-MSE weights land on a worse error than XGBoost alone and the optimum is close to w = 1. With the TSO forecast, whose errors are less correlated, a combination would help — but that forecast is issued after the bid gate.",
              tr: "İki üyeli bir birleşimin RMSE'si, XGBoost'un ağırlığına göre, gerçek hata seviyeleri ve korelasyonlarla. TFT ya da LSTM ile ters MSE ağırlıkları tek başına XGBoost'tan daha kötü bir hataya düşer ve en iyi nokta w = 1'e yakındır. Hataları daha az ilişkili olan İSO tahminiyle birleşim yardımcı olurdu — ama bu tahmin teklif kapısından sonra yayımlanır.",
            },
          },
          {
            kind: "callout",
            tone: "history",
            title: { en: "An honest negative result", tr: "Dürüst bir olumsuz sonuç" },
            body: [
              {
                en: "The platform's ensemble weights XGBoost, LSTM and TFT by 1/MSE on the earlier folds. It scores {ens_nrmse} % — worse than XGBoost alone ({xgb_nrmse} %). The networks are weaker and correlated with XGBoost (≥ 0.80) and with each other ({corr_tft_lstm}), so averaging adds error. The result is reported as it is: an ensemble pays only when its members fail differently.",
                tr: "Platformun topluluğu XGBoost, LSTM ve TFT'yi önceki katmanlardaki 1/MSE ile ağırlıklandırır. %{ens_nrmse} alır — tek başına XGBoost'tan (%{xgb_nrmse}) kötü. Ağlar daha zayıftır ve XGBoost ile (≥ 0,80) ve birbirleriyle ({corr_tft_lstm}) ilişkilidir; bu yüzden ortalama almak hata ekler. Sonuç olduğu gibi raporlanır: bir topluluk ancak üyeleri farklı şekilde yanıldığında karşılığını verir.",
              },
            ],
          },
        ],
      },
      {
        id: "shap",
        title: { en: "Explaining a forecast with SHAP", tr: "Bir tahmini SHAP ile açıklamak" },
        blocks: [
          {
            kind: "p",
            text: {
              en: "Shapley values from cooperative game theory distribute a payout fairly among players [@shapley1953]. SHAP applies them to a prediction: each feature receives the average change it causes when added to all possible subsets of the other features, and the contributions add up exactly to the difference between this prediction and the average prediction [@lundberg2017]. For tree ensembles TreeSHAP computes them exactly and fast [@lundberg2020]:",
              tr: "İşbirlikçi oyun teorisinden gelen Shapley değerleri bir kazancı oyuncular arasında adil biçimde dağıtır [@shapley1953]. SHAP bunları bir tahmine uygular: her özellik, diğer özelliklerin tüm olası alt kümelerine eklendiğinde neden olduğu ortalama değişimi alır ve katkılar tam olarak bu tahmin ile ortalama tahmin arasındaki farka eşit olacak şekilde toplanır [@lundberg2017]. Ağaç toplulukları için TreeSHAP bunları tam ve hızlı hesaplar [@lundberg2020]:",
            },
          },
          {
            kind: "eq",
            tex: "\\phi_j = \\sum_{S \\subseteq \\mathcal F \\setminus \\{j\\}} \\frac{|S|!\\,(|\\mathcal F|-|S|-1)!}{|\\mathcal F|!}\\Bigl[f_{S \\cup \\{j\\}}(\\mathbf x) - f_S(\\mathbf x)\\Bigr], \\qquad f(\\mathbf x) = \\mathbb E[f] + \\sum_j \\phi_j",
            where: [
              { sym: "\\phi_j", def: { en: "SHAP value of feature j for this forecast", tr: "bu tahmin için j özelliğinin SHAP değeri" }, unit: "MW" },
              { sym: "\\mathcal F", def: { en: "set of all 15 features", tr: "15 özelliğin tamamının kümesi" } },
              { sym: "\\mathbb E[f]", def: { en: "average prediction over the training data (expected value)", tr: "eğitim verisi üzerindeki ortalama tahmin (beklenen değer)" }, unit: "MW" },
            ],
            source: "Shapley (1953); Lundberg & Lee (2017)",
          },
          {
            kind: "fig",
            fig: "shap-waterfall",
            caption: {
              en: "TreeSHAP decomposition of three real P50 forecasts from the week of Figure 1.2. Starting from the expected value, each bar adds one feature's contribution; the last bar is the forecast. In the calm hour the low Kriegers Flak winds pull the forecast down by about 150 MW and the Rødsand winds by another 60 MW; in the storm hour all four winds push it up. The dashed line is what the farms then produced.",
              tr: "Şekil 1.2'deki haftadan üç gerçek P50 tahmininin TreeSHAP ayrışımı. Beklenen değerden başlayarak her çubuk bir özelliğin katkısını ekler; son çubuk tahmindir. Sakin saatte düşük Kriegers Flak rüzgârları tahmini yaklaşık 150 MW, Rødsand rüzgârları da 60 MW daha aşağı çeker; fırtına saatinde dört rüzgâr da yukarı iter. Kesikli çizgi santrallerin sonra ürettiğidir.",
            },
          },
          {
            kind: "fig",
            fig: "shap-global",
            caption: {
              en: "Mean |SHAP| share per feature over all test hours. The four wind speeds carry most of the attribution, Kriegers Flak — the largest farm — first. Hour of day and direction add small corrections; the spread feature matters in uncertain hours.",
              tr: "Tüm test saatleri üzerinden özellik başına ortalama |SHAP| payı. Atfın çoğunu dört rüzgâr hızı taşır, önce en büyük santral olan Kriegers Flak. Günün saati ve yön küçük düzeltmeler ekler; yayılım özelliği belirsiz saatlerde önem kazanır.",
            },
          },
          {
            kind: "callout",
            tone: "pitfall",
            title: { en: "What SHAP does not tell you", tr: "SHAP'in size söylemediği" },
            body: [
              {
                en: "SHAP explains the model, not the physics: correlated features (the four winds) share credit in ways that depend on the model, and an attribution is not a causal effect. For high-stakes decisions Rudin argues for models that are interpretable by design [@rudin2019]; for forecasting, SHAP is best used to check that the model relies on plausible inputs.",
                tr: "SHAP fiziği değil modeli açıklar: ilişkili özellikler (dört rüzgâr) payı modele bağlı biçimde paylaşır ve bir atıf nedensel bir etki değildir. Yüksek riskli kararlar için Rudin tasarımı gereği yorumlanabilir modelleri savunur [@rudin2019]; tahmin için SHAP en iyi, modelin akla yatkın girdilere dayandığını kontrol etmek için kullanılır.",
              },
            ],
          },
        ],
      },
      {
        id: "physics",
        title: { en: "Physics has the last word", tr: "Son söz fiziğindir" },
        blocks: [
          {
            kind: "p",
            text: {
              en: "A learned model can output any number; the grid cannot receive any number. The platform therefore sorts every set of quantiles so that $q_{0.1} \\le \\dots \\le q_{0.9}$ and passes every model's output through `enforce_physical_constraints`: power is clipped to $0 \\le P \\le C$, and for a single turbine power is zero below cut-in (3 m/s) and above cut-out (25 m/s). This is a non-negotiable rule of the platform: machine learning never overrides physics.",
              tr: "Öğrenilmiş bir model herhangi bir sayı üretebilir; şebeke herhangi bir sayıyı alamaz. Bu yüzden platform her kantil kümesini $q_{0.1} \\le \\dots \\le q_{0.9}$ olacak şekilde sıralar ve her modelin çıktısını `enforce_physical_constraints`'ten geçirir: güç $0 \\le P \\le C$ aralığına kırpılır ve tek bir türbin için güç devreye girme hızının (3 m/s) altında ve devreden çıkma hızının (25 m/s) üstünde sıfırdır. Bu platformun pazarlık konusu olmayan bir kuralıdır: makine öğrenmesi fiziği asla geçersiz kılmaz.",
            },
          },
          {
            kind: "eq",
            tex: "\\hat P \\leftarrow \\min\\bigl(\\max(\\hat P, 0),\\, C\\bigr), \\qquad (\\hat q_{0.1}, \\dots, \\hat q_{0.9}) \\leftarrow \\operatorname{sort}(\\hat q_{0.1}, \\dots, \\hat q_{0.9}), \\qquad \\hat P_{\\text{WTG}} = 0 \\;\\text{if } u < 3 \\text{ or } u > 25\\,\\text{m/s}",
            source: "physical_constraints.py (clip, cut-in/cut-out); real_data._xgb_fold (sort)",
          },
        ],
      },
    ],
    practice: {
      platform: [
        { en: "Ensemble: XGBoost, LSTM and TFT medians weighted by 1/MSE on the earlier test folds only (equal weights in the first fold); scored next to its members.", tr: "Topluluk: XGBoost, LSTM ve TFT medyanları yalnızca önceki test katmanlarındaki 1/MSE ile ağırlıklandırılır (ilk katmanda eşit ağırlık); üyelerinin yanında puanlanır." },
        { en: "SHAP: XGBoost `pred_contribs` for the P50 of every test hour; global importance on the Day-ahead tab, local waterfalls here.", tr: "SHAP: her test saatinin P50'si için XGBoost `pred_contribs`; küresel önem Gün öncesi sekmesinde, yerel şelaleler burada." },
      ],
      files: ["backend/app/services/p4/real_data.py · _ensemble_weights()", "backend/app/services/p4/physical_constraints.py"],
      industry: [
        { en: "Combining several NWP models and several statistical models is standard in commercial forecasting; gains come from diverse inputs, not from averaging similar models [@giebel2011;@sweeney2020].", tr: "Birden çok NWP modelini ve birden çok istatistiksel modeli birleştirmek ticari tahminde standarttır; kazanç benzer modelleri ortalamaktan değil çeşitli girdilerden gelir [@giebel2011;@sweeney2020]." },
        { en: "SHAP is the most widely used explanation method for tree models in industry, from credit scoring to grid operations [@lundberg2020].", tr: "SHAP, kredi skorlamasından şebeke işletmesine kadar sektörde ağaç modelleri için en yaygın kullanılan açıklama yöntemidir [@lundberg2020]." },
      ],
      solves: [
        { en: "Ensembles reduce error when members are diverse; SHAP lets engineers audit a forecast; constraints guarantee physically valid outputs.", tr: "Topluluklar üyeler çeşitli olduğunda hatayı azaltır; SHAP mühendislerin bir tahmini denetlemesini sağlar; kısıtlar fiziksel olarak geçerli çıktıları garanti eder." },
      ],
      limits: [
        { en: "Weights estimated on few folds are noisy; correlated members make combinations useless; SHAP attributions are not causal.", tr: "Az sayıda katmanda tahmin edilen ağırlıklar gürültülüdür; ilişkili üyeler birleşimleri işe yaramaz kılar; SHAP atıfları nedensel değildir." },
      ],
    },
    takeaways: [
      { en: "A combination beats its best member only if the members' errors are not too correlated (ρ < σ_A/σ_B).", tr: "Bir birleşim en iyi üyesini ancak üyelerin hataları çok ilişkili değilse yener (ρ < σ_A/σ_B)." },
      { en: "SHAP splits each forecast into feature contributions that add up to the prediction.", tr: "SHAP her tahmini, toplamı tahmine eşit olan özellik katkılarına ayırır." },
      { en: "After the ML: 0 ≤ P ≤ capacity, sorted quantiles, cut-in/cut-out — physics has the last word.", tr: "ML'den sonra: 0 ≤ P ≤ kapasite, sıralı kantiller, devreye girme/çıkma — son söz fiziğindir." },
    ],
    quiz: [
      {
        q: { en: "Members A (σ = 150 MW) and B (σ = 180 MW) have error correlation 0.9. Will a 50/50 average beat A?", tr: "A (σ = 150 MW) ve B (σ = 180 MW) üyelerinin hata korelasyonu 0,9. 50/50 ortalama A'yı yener mi?" },
        options: [
          { en: "Yes, averaging always helps", tr: "Evet, ortalama almak her zaman yardımcı olur" },
          { en: "No: σ(0.5) ≈ 161 MW > 150 MW", tr: "Hayır: σ(0,5) ≈ 161 MW > 150 MW" },
          { en: "Only if B is unbiased", tr: "Yalnızca B yansızsa" },
        ],
        answer: 1,
        why: { en: "σ² = 0.25·150² + 0.25·180² + 2·0.25·0.9·150·180 = 5625 + 8100 + 12 150 = 25 875 → σ ≈ 161 MW. With ρ = 0.9 > 150/180 = 0.83, B adds error.", tr: "σ² = 0,25·150² + 0,25·180² + 2·0,25·0,9·150·180 = 5625 + 8100 + 12 150 = 25 875 → σ ≈ 161 MW. ρ = 0,9 > 150/180 = 0,83 olduğundan B hata ekler." },
      },
      {
        q: { en: "The SHAP values of an hour sum to −217 MW and the expected value is 290 MW. What is the forecast?", tr: "Bir saatin SHAP değerlerinin toplamı −217 MW ve beklenen değer 290 MW. Tahmin nedir?" },
        options: [
          { en: "73 MW", tr: "73 MW" },
          { en: "507 MW", tr: "507 MW" },
          { en: "−217 MW", tr: "−217 MW" },
        ],
        answer: 0,
        why: { en: "SHAP is additive: f(x) = E[f] + Σφ = 290 − 217 = 73 MW — the calm hour of Figure 13.3.", tr: "SHAP toplamsaldır: f(x) = E[f] + Σφ = 290 − 217 = 73 MW — Şekil 13.3'teki sakin saat." },
      },
    ],
    concepts: ["ensemble", "shap", "physics"],
  },
];
