/**
 * Part III — the models: regression trees and gradient boosting (XGBoost), recurrent
 * networks and the LSTM, attention and the Temporal Fusion Transformer.
 */

import type { Chapter } from "./types";

export const PART3: Chapter[] = [
  // ───────────────────────────────────────────────────────────────── 8
  {
    id: "xgboost",
    n: 8,
    part: "models",
    title: { en: "Decision trees and gradient boosting (XGBoost)", tr: "Karar ağaçları ve gradient boosting (XGBoost)" },
    lead: {
      en: "On tabular data — rows of features such as the platform's NWP table — ensembles of decision trees remain the strongest general-purpose method. This chapter builds them from the ground up: a single regression tree, gradient boosting as gradient descent in the space of functions, and the regularised second-order formulation that makes XGBoost fast and robust. It ends with the exact configuration that produces the platform's best day-ahead forecast.",
      tr: "Tablo verisinde — platformun NWP tablosu gibi özellik satırlarında — karar ağacı toplulukları en güçlü genel amaçlı yöntem olmayı sürdürüyor. Bu bölüm onları temelden kurar: tek bir regresyon ağacı, fonksiyon uzayında gradyan inişi olarak gradient boosting ve XGBoost'u hızlı ve sağlam yapan düzenlileştirilmiş ikinci dereceden formülasyon. Bölüm, platformun en iyi gün öncesi tahminini üreten yapılandırmanın tam hâliyle biter.",
    },
    objectives: [
      { en: "Explain how a regression tree chooses its splits and why one tree is a crude model.", tr: "Bir regresyon ağacının bölünmelerini nasıl seçtiğini ve tek bir ağacın neden kaba bir model olduğunu açıklamak." },
      { en: "Derive gradient boosting as fitting trees to negative gradients, with shrinkage.", tr: "Gradient boosting'i, küçültmeli olarak negatif gradyanlara ağaç uydurma şeklinde türetmek." },
      { en: "Compute XGBoost's optimal leaf weight and split gain from gradients and Hessians.", tr: "XGBoost'un en iyi yaprak ağırlığını ve bölünme kazancını gradyanlardan ve Hessian'lardan hesaplamak." },
      { en: "Read the platform's XGBoost configuration and explain each setting.", tr: "Platformun XGBoost yapılandırmasını okumak ve her ayarı açıklamak." },
    ],
    sections: [
      {
        id: "tree",
        title: { en: "A regression tree", tr: "Bir regresyon ağacı" },
        blocks: [
          {
            kind: "p",
            text: {
              en: "A regression tree partitions the feature space with yes/no questions on one feature at a time — \"is the forecast wind below 8.4 m/s?\" — and predicts a constant in every leaf. It is grown greedily: at each node the split that most reduces the squared error is chosen, and the process repeats in both children until a depth limit or a minimum leaf size is reached [@breiman1984;@hastie2009].",
              tr: "Bir regresyon ağacı öznitelik uzayını her seferinde tek bir özellik üzerinde evet/hayır sorularıyla bölümler — \"tahmin rüzgârı 8,4 m/s'nin altında mı?\" — ve her yaprakta bir sabit tahmin eder. Açgözlü biçimde büyütülür: her düğümde kare hatayı en çok azaltan bölünme seçilir ve süreç bir derinlik sınırına ya da en küçük yaprak boyutuna ulaşılana kadar iki çocukta tekrarlanır [@breiman1984;@hastie2009].",
            },
          },
          {
            kind: "eq",
            tex: "(j^*, s^*) = \\arg\\min_{j,\\,s}\\Bigl[\\sum_{x_{ij} < s}(y_i - \\bar y_L)^2 + \\sum_{x_{ij} \\ge s}(y_i - \\bar y_R)^2\\Bigr]",
            where: [
              { sym: "j, s", def: { en: "feature index and threshold of the split", tr: "bölünmenin özellik indeksi ve eşiği" } },
              { sym: "\\bar y_L, \\bar y_R", def: { en: "mean target in the left and right child", tr: "sol ve sağ çocuktaki ortalama hedef" }, unit: "MW" },
            ],
            source: "Breiman et al. (1984); Hastie et al. (2009), §9.2",
          },
          {
            kind: "fig",
            fig: "tree-diagram",
            caption: {
              en: "A depth-3 tree fitted to 120 noisy samples of the IEA 15 MW power curve (top) and its prediction (bottom). Three levels of yes/no questions about the wind give six constant steps (nodes with fewer than ten samples are not split further): the tree finds cut-in and rated speed by itself, but the steep part of the curve is a coarse staircase.",
              tr: "IEA 15 MW güç eğrisinin 120 gürültülü örneğine uydurulmuş 3 derinlikli bir ağaç (üstte) ve tahmini (altta). Rüzgârla ilgili üç seviye evet/hayır sorusu altı sabit basamak verir (ondan az örnekli düğümler daha fazla bölünmez): ağaç devreye girme ve nominal hızı kendisi bulur, ama eğrinin dik kısmı kaba bir merdivendir.",
            },
          },
        ],
      },
      {
        id: "boosting",
        title: { en: "Gradient boosting", tr: "Gradient boosting" },
        blocks: [
          {
            kind: "p",
            text: {
              en: "Boosting builds a strong model from many weak ones, added in sequence. Friedman's gradient boosting [@friedman2001] starts from a constant and, at each step $m$, fits a small tree to the **negative gradient** of the loss at the current predictions — for squared loss, simply the residuals $y_i - F_{m-1}(\\mathbf x_i)$ — and adds a fraction $\\eta$ of it. Each tree corrects what the ensemble still gets wrong; the procedure is gradient descent in the space of functions.",
              tr: "Boosting, sırayla eklenen birçok zayıf modelden güçlü bir model kurar. Friedman'ın gradient boosting'i [@friedman2001] bir sabitten başlar ve her $m$ adımında, mevcut tahminlerdeki kaybın **negatif gradyanına** — kare kayıp için yalnızca artıklar $y_i - F_{m-1}(\\mathbf x_i)$ — küçük bir ağaç uydurur ve onun $\\eta$ kadarlık bir kısmını ekler. Her ağaç topluluğun hâlâ yanlış yaptığını düzeltir; yöntem fonksiyon uzayında gradyan inişidir.",
            },
          },
          {
            kind: "eq",
            tex: "F_0 = \\arg\\min_c \\sum_i L(y_i, c), \\qquad r_{im} = -\\frac{\\partial L(y_i, F)}{\\partial F}\\bigg|_{F = F_{m-1}(\\mathbf x_i)}, \\qquad F_m = F_{m-1} + \\eta\\, h_m",
            where: [
              { sym: "h_m", def: { en: "regression tree fitted to the pseudo-residuals $r_{im}$", tr: "sözde artıklara $r_{im}$ uydurulan regresyon ağacı" } },
              { sym: "\\eta", def: { en: "learning rate (shrinkage), typically 0.01–0.3", tr: "öğrenme oranı (küçültme), tipik olarak 0,01–0,3" } },
            ],
            source: "Friedman (2001)",
          },
          {
            kind: "fig",
            fig: "boosting",
            caption: {
              en: "Gradient boosting trained in your browser. Press *Add trees* and watch the model approach the power curve tree by tree; the thin lines are the residuals the next tree learns. Then choose η = 1 and depth 5: the training error keeps falling, but the error on unseen samples reaches its minimum early and rises again — over-fitting. Small η with more trees generalises better, which is why the platform uses η = 0.05.",
              tr: "Tarayıcınızda eğitilen gradient boosting. *Ağaç ekle*'ye basın ve modelin ağaç ağaç güç eğrisine yaklaşmasını izleyin; ince çizgiler bir sonraki ağacın öğrendiği artıklardır. Sonra η = 1 ve derinlik 5'i seçin: eğitim hatası düşmeye devam eder, ama görülmemiş örneklerdeki hata erkenden minimumuna ulaşır ve yeniden yükselir — aşırı öğrenme. Küçük η ve daha çok ağaç daha iyi genellenir; platformun η = 0,05 kullanmasının nedeni budur.",
            },
          },
        ],
      },
      {
        id: "xgb",
        title: { en: "What XGBoost adds", tr: "XGBoost neler ekler" },
        blocks: [
          {
            kind: "p",
            text: {
              en: "XGBoost [@chen2016] makes three changes. It adds a **regulariser** to the objective that penalises the number of leaves $T$ and the size of the leaf weights $w$; it approximates the loss to **second order**, using both the gradient $g_i$ and the Hessian $h_i$ of every sample; and it finds splits with a fast, cache-aware, sparsity-aware algorithm. With the second-order expansion the best weight of a leaf and the gain of a split have closed forms:",
              tr: "XGBoost [@chen2016] üç değişiklik yapar. Amaç fonksiyonuna yaprak sayısını $T$ ve yaprak ağırlıklarının büyüklüğünü $w$ cezalandıran bir **düzenlileştirici** ekler; kaybı her örneğin hem gradyanını $g_i$ hem Hessian'ını $h_i$ kullanarak **ikinci dereceden** yaklaştırır; ve bölünmeleri hızlı, önbellek ve seyreklik farkında bir algoritmayla bulur. İkinci dereceden açılımla bir yaprağın en iyi ağırlığı ve bir bölünmenin kazancı kapalı forma sahiptir:",
            },
          },
          {
            kind: "eq",
            tex: "\\mathcal L = \\sum_i L(y_i, \\hat y_i) + \\sum_k \\Bigl(\\gamma T_k + \\tfrac12 \\lambda \\lVert w_k \\rVert^2\\Bigr), \\qquad w_j^* = -\\frac{G_j}{H_j + \\lambda}",
            where: [
              { sym: "G_j = \\sum_{i \\in j} g_i", def: { en: "sum of gradients in leaf j", tr: "j yaprağındaki gradyanların toplamı" } },
              { sym: "H_j = \\sum_{i \\in j} h_i", def: { en: "sum of Hessians in leaf j (= number of samples for squared loss)", tr: "j yaprağındaki Hessian'ların toplamı (kare kayıp için = örnek sayısı)" } },
              { sym: "\\gamma, \\lambda", def: { en: "penalty per leaf and L2 penalty on leaf weights", tr: "yaprak başına ceza ve yaprak ağırlıkları üzerindeki L2 cezası" } },
            ],
            source: "Chen & Guestrin (2016), eqs. 2 and 5",
          },
          {
            kind: "eq",
            tex: "\\text{Gain} = \\frac12\\left[\\frac{G_L^2}{H_L+\\lambda} + \\frac{G_R^2}{H_R+\\lambda} - \\frac{(G_L+G_R)^2}{H_L+H_R+\\lambda}\\right] - \\gamma",
            source: "Chen & Guestrin (2016), eq. 7",
          },
          {
            kind: "steps",
            title: { en: "Splitting six hours at 9 m/s", tr: "Altı saati 9 m/s'de bölmek" },
            given: {
              en: "Squared loss, so $g_i = \\hat y_i - y_i$ and $h_i = 1$. Residuals $y - \\hat y$ of six hours [MW]: below 9 m/s −40, −60, −50; above +70, +90, +80. Take $\\lambda = 1$, $\\gamma = 0$, $\\eta = 0.05$.",
              tr: "Kare kayıp; dolayısıyla $g_i = \\hat y_i - y_i$ ve $h_i = 1$. Altı saatin artıkları $y - \\hat y$ [MW]: 9 m/s altında −40, −60, −50; üstünde +70, +90, +80. $\\lambda = 1$, $\\gamma = 0$, $\\eta = 0{,}05$ alın.",
            },
            steps: [
              { en: "Left: $G_L = 40+60+50 = 150$, $H_L = 3$. Right: $G_R = -240$, $H_R = 3$.", tr: "Sol: $G_L = 40+60+50 = 150$, $H_L = 3$. Sağ: $G_R = -240$, $H_R = 3$." },
              { en: "Gain $= \\tfrac12\\bigl[150^2/4 + 240^2/4 - 90^2/7\\bigr] = \\tfrac12[5625 + 14\\,400 - 1157] \\approx 9434$ — large, so the split is made.", tr: "Kazanç $= \\tfrac12\\bigl[150^2/4 + 240^2/4 - 90^2/7\\bigr] = \\tfrac12[5625 + 14\\,400 - 1157] \\approx 9434$ — büyük, bu yüzden bölünme yapılır." },
              { en: "Leaf weights: $w_L^* = -150/4 = -37.5$ MW, $w_R^* = 240/4 = +60$ MW. λ pulls them towards zero from the leaf means −50 and +80.", tr: "Yaprak ağırlıkları: $w_L^* = -150/4 = -37{,}5$ MW, $w_R^* = 240/4 = +60$ MW. λ onları yaprak ortalamaları −50 ve +80'den sıfıra doğru çeker." },
              { en: "Shrinkage: this tree changes the forecast by $0.05 \\times (-37.5) = -1.9$ MW and $+3.0$ MW; hundreds of trees accumulate the correction.", tr: "Küçültme: bu ağaç tahmini $0{,}05 \\times (-37{,}5) = -1{,}9$ MW ve $+3{,}0$ MW değiştirir; yüzlerce ağaç düzeltmeyi biriktirir." },
            ],
            result: {
              en: "Regularisation (λ) and shrinkage (η) make each tree a cautious step — the reason boosting with many small steps generalises well.",
              tr: "Düzenlileştirme (λ) ve küçültme (η) her ağacı temkinli bir adım yapar — çok sayıda küçük adımlı boosting'in iyi genellenmesinin nedeni budur.",
            },
          },
        ],
      },
      {
        id: "platform",
        title: { en: "Quantile XGBoost in this platform", tr: "Bu platformda kantil XGBoost" },
        blocks: [
          {
            kind: "p",
            text: {
              en: "Since version 2.0 XGBoost has a native quantile objective that fits several quantiles in one model. The platform trains one model per fold for the nine levels τ = 0.1 … 0.9 at once, sorts the nine outputs so that quantiles never cross, widens the band with a conformal margin (chapter 11) and clips to 0 ≤ P ≤ capacity. Training all five folds takes one to two minutes on a CPU.",
              tr: "XGBoost, 2.0 sürümünden beri birden çok kantili tek bir modelde uyduran yerleşik bir kantil amaç fonksiyonuna sahiptir. Platform her katman için dokuz seviye τ = 0,1 … 0,9'u aynı anda bir modelde eğitir, kantiller hiç kesişmesin diye dokuz çıktıyı sıralar, bandı konformal bir payla genişletir (bölüm 11) ve 0 ≤ P ≤ kapasite aralığına kırpar. Beş katmanın tamamını eğitmek bir CPU'da bir-iki dakika sürer.",
            },
          },
          {
            kind: "code",
            caption: {
              en: "The model behind the Day-ahead tab. Depth 5 allows interactions of up to five features (e.g. wind × direction × hour); subsample 0.8 trains each tree on a random 80 % of the hours, another regulariser.",
              tr: "Gün öncesi sekmesinin arkasındaki model. Derinlik 5, beş özelliğe kadar etkileşimlere izin verir (örn. rüzgâr × yön × saat); subsample 0,8 her ağacı saatlerin rastgele %80'i üzerinde eğitir — bir başka düzenlileştirici.",
            },
            file: "backend/app/services/p4/real_data.py",
            symbol: "_xgb_fold()",
            code: "xgb.XGBRegressor(\n    objective=\"reg:quantileerror\",\n    quantile_alpha=np.array([0.1, 0.2, ..., 0.9]),  # nine quantiles, one model\n    n_estimators=400,     # trees\n    max_depth=5,\n    learning_rate=0.05,   # η, shrinkage\n    subsample=0.8,        # rows per tree\n    random_state=42,\n)\n# then: sort quantiles, conformal margin, clip to 0 … capacity",
          },
          {
            kind: "p",
            text: {
              en: "On the measured DK2 data this model is the best of all forecasts scored: {xgb_nrmse} % nRMSE against {tso_nrmse} % for the TSO's own day-ahead forecast. That trees do so well is consistent with a broad benchmark study: on medium-sized tabular data, tree ensembles still outperform deep networks, partly because they cope better with uninformative features and irregular functions [@grinsztajn2022].",
              tr: "Ölçülmüş DK2 verisinde bu model puanlanan tüm tahminlerin en iyisidir: İSO'nun kendi gün öncesi tahmininin %{tso_nrmse}'ine karşı %{xgb_nrmse} nRMSE. Ağaçların bu kadar iyi olması geniş bir kıyaslama çalışmasıyla tutarlıdır: orta büyüklükteki tablo verisinde ağaç toplulukları hâlâ derin ağlardan daha iyidir; kısmen bilgi taşımayan özelliklerle ve düzensiz fonksiyonlarla daha iyi başa çıktıkları için [@grinsztajn2022].",
            },
          },
        ],
      },
    ],
    practice: {
      platform: [
        { en: "XGBoost is the platform's main day-ahead model: nine quantiles per fold, conformal band, SHAP attribution. It is trained live on the server the first time the Day-ahead tab opens and then cached for a week.", tr: "XGBoost platformun ana gün öncesi modelidir: katman başına dokuz kantil, konformal bant, SHAP atfı. Gün öncesi sekmesi ilk açıldığında sunucuda canlı eğitilir ve sonra bir hafta önbellekte tutulur." },
      ],
      files: ["backend/app/services/p4/real_data.py · _xgb_fold()", "frontend/src/components/p4/academy/boosting.ts"],
      industry: [
        { en: "Gradient boosting machines were among the top-ranked methods of the GEFCom2014 wind forecasting track [@landry2016;@hong2016] and are widely used by forecast vendors and TSOs.", tr: "Gradient boosting makineleri GEFCom2014 rüzgâr tahmini kategorisinin en üst sıralardaki yöntemleri arasındaydı [@landry2016;@hong2016] ve tahmin sağlayıcıları ile İSO'lar tarafından yaygın olarak kullanılır." },
        { en: "Beyond energy, XGBoost and its relatives (LightGBM, CatBoost) dominate tabular problems in finance, insurance and industry [@grinsztajn2022].", tr: "Enerjinin ötesinde XGBoost ve akrabaları (LightGBM, CatBoost) finans, sigorta ve sanayideki tablo problemlerine hâkimdir [@grinsztajn2022]." },
      ],
      solves: [
        { en: "Learns non-linear interactions — wind × direction × hour — with little tuning, no scaling, and robustness to irrelevant features.", tr: "Doğrusal olmayan etkileşimleri — rüzgâr × yön × saat — az ayarla, ölçekleme olmadan ve ilgisiz özelliklere karşı sağlamlıkla öğrenir." },
        { en: "Fits all quantiles in one model and explains itself exactly with TreeSHAP.", tr: "Tüm kantilleri tek modelde uydurur ve kendisini TreeSHAP ile tam olarak açıklar." },
      ],
      limits: [
        { en: "Trees cannot extrapolate: a wind beyond anything in training gets the prediction of the nearest leaf.", tr: "Ağaçlar dışdeğerleme yapamaz: eğitimde görülen her şeyin ötesindeki bir rüzgâr, en yakın yaprağın tahminini alır." },
        { en: "Each row is treated independently; temporal patterns enter only through features.", tr: "Her satır bağımsız ele alınır; zamansal desenler yalnızca özellikler aracılığıyla girer." },
      ],
    },
    takeaways: [
      { en: "A tree splits greedily to reduce squared error; boosting adds many small trees, each fitted to the negative gradient.", tr: "Bir ağaç kare hatayı azaltmak için açgözlü böler; boosting her biri negatif gradyana uydurulan birçok küçük ağaç ekler." },
      { en: "XGBoost: w* = −G/(H+λ), gain from G²/(H+λ); regularisation and shrinkage keep each step small.", tr: "XGBoost: w* = −G/(H+λ), kazanç G²/(H+λ)'dan; düzenlileştirme ve küçültme her adımı küçük tutar." },
      { en: "On the platform: 400 trees, depth 5, η = 0.05, nine quantiles — the best forecast on the measured data.", tr: "Platformda: 400 ağaç, derinlik 5, η = 0,05, dokuz kantil — ölçülmüş verideki en iyi tahmin." },
    ],
    quiz: [
      {
        q: { en: "What does each new tree in gradient boosting with squared loss learn?", tr: "Kare kayıplı gradient boosting'de her yeni ağaç neyi öğrenir?" },
        options: [
          { en: "The target y directly", tr: "Doğrudan hedef y'yi" },
          { en: "The residuals y − F(x) of the current ensemble", tr: "Mevcut topluluğun artıklarını y − F(x)" },
          { en: "A random subset of the target", tr: "Hedefin rastgele bir alt kümesini" },
        ],
        answer: 1,
        why: { en: "For squared loss the negative gradient is the residual, so each tree fits what is still wrong.", tr: "Kare kayıp için negatif gradyan artıktır; bu yüzden her ağaç hâlâ yanlış olanı uydurur." },
      },
      {
        q: { en: "In XGBoost, increasing λ…", tr: "XGBoost'ta λ'yı artırmak…" },
        options: [
          { en: "shrinks leaf weights towards zero and lowers split gains", tr: "yaprak ağırlıklarını sıfıra doğru küçültür ve bölünme kazançlarını düşürür" },
          { en: "makes trees deeper", tr: "ağaçları derinleştirir" },
          { en: "raises the learning rate", tr: "öğrenme oranını yükseltir" },
        ],
        answer: 0,
        why: { en: "λ appears in every denominator H + λ: weights −G/(H+λ) and gains G²/(H+λ) both shrink.", tr: "λ her paydada H + λ olarak yer alır: ağırlıklar −G/(H+λ) ve kazançlar G²/(H+λ) birlikte küçülür." },
      },
    ],
    concepts: ["tree", "boosting", "xgboost", "residual"],
  },

  // ───────────────────────────────────────────────────────────────── 9
  {
    id: "lstm",
    n: 9,
    part: "models",
    title: { en: "Recurrent networks and the LSTM", tr: "Yinelemeli ağlar ve LSTM" },
    lead: {
      en: "A tree looks at one hour at a time. A recurrent network reads a sequence — here the 24 hourly rows of NWP up to the target hour — and carries a memory from step to step, so it can recognise a rising wind, a passing front or a timing shift. This chapter explains why plain recurrent networks forget, how the LSTM's gated cell state fixes that, and how the platform's LSTM is built, trained and how it scores.",
      tr: "Bir ağaç her seferinde bir saate bakar. Yinelemeli bir ağ bir diziyi — burada hedef saate kadarki 24 saatlik NWP satırını — okur ve adımdan adıma bir hafıza taşır; böylece yükselen bir rüzgârı, geçen bir cepheyi ya da bir zamanlama kaymasını tanıyabilir. Bu bölüm düz yinelemeli ağların neden unuttuğunu, LSTM'in kapılı hücre durumunun bunu nasıl çözdüğünü ve platformun LSTM'inin nasıl kurulduğunu, eğitildiğini ve nasıl puan aldığını açıklar.",
    },
    objectives: [
      { en: "Write the recurrence of a simple RNN and explain the vanishing-gradient problem.", tr: "Basit bir RNN'in yineleme denklemini yazmak ve kaybolan gradyan problemini açıklamak." },
      { en: "State the LSTM equations and the role of the forget, input and output gates.", tr: "LSTM denklemlerini ve unutma, giriş ve çıkış kapılarının rolünü ifade etmek." },
      { en: "Describe the platform's LSTM and interpret its score relative to XGBoost.", tr: "Platformun LSTM'ini tanımlamak ve skorunu XGBoost'a göre yorumlamak." },
    ],
    sections: [
      {
        id: "rnn",
        title: { en: "Reading a sequence", tr: "Bir diziyi okumak" },
        blocks: [
          {
            kind: "p",
            text: {
              en: "A recurrent neural network applies the same cell at every time step, combining the new input with a hidden state that summarises everything read so far. After the last step a dense layer turns the final state into the forecast. For the day-ahead problem, a window of 24 hourly NWP rows lets the network see how the forecast wind evolves into the target hour — useful when the NWP places a front correctly but a few hours early or late [@goodfellow2016;@wang2019].",
              tr: "Yinelemeli bir sinir ağı her zaman adımında aynı hücreyi uygular; yeni girdiyi o ana kadar okunan her şeyi özetleyen bir gizli durumla birleştirir. Son adımdan sonra yoğun bir katman son durumu tahmine çevirir. Gün öncesi problem için 24 saatlik NWP satırından oluşan bir pencere, ağın tahmin rüzgârının hedef saate doğru nasıl geliştiğini görmesini sağlar — NWP bir cepheyi doğru ama birkaç saat erken ya da geç yerleştirdiğinde yararlıdır [@goodfellow2016;@wang2019].",
            },
          },
          {
            kind: "eq",
            tex: "\\mathbf h_t = \\tanh\\bigl(W \\mathbf h_{t-1} + U \\mathbf x_t + \\mathbf b\\bigr), \\qquad \\hat P(t) = \\mathbf v^{\\!\\top}\\mathbf h_t + c",
            where: [
              { sym: "\\mathbf x_t", def: { en: "input at step t: the 15 NWP features of that hour", tr: "t adımındaki girdi: o saatin 15 NWP özelliği" } },
              { sym: "\\mathbf h_t", def: { en: "hidden state, the network's memory", tr: "gizli durum, ağın hafızası" } },
              { sym: "W, U, \\mathbf b", def: { en: "weights shared by all time steps", tr: "tüm zaman adımlarının paylaştığı ağırlıklar" } },
            ],
          },
          {
            kind: "fig",
            fig: "rnn-unrolled",
            caption: {
              en: "The platform's LSTM unrolled over its 24-hour window: the same two LSTM layers process every hour, passing hidden and cell state forward; only the state after the target hour t feeds the output layer.",
              tr: "Platformun LSTM'i 24 saatlik penceresi boyunca açılmış hâlde: aynı iki LSTM katmanı her saati işler, gizli durumu ve hücre durumunu ileri aktarır; yalnızca hedef saat t'den sonraki durum çıkış katmanını besler.",
            },
          },
        ],
      },
      {
        id: "vanishing",
        title: { en: "Why plain RNNs forget", tr: "Düz RNN'ler neden unutur" },
        blocks: [
          {
            kind: "p",
            text: {
              en: "Training by back-propagation through time multiplies one Jacobian per step. If its norm is below one, the gradient that tells step $t-k$ how it affected the loss shrinks geometrically with $k$; if above one, it explodes. Bengio, Simard and Frasconi showed that learning long dependencies with gradient descent is therefore difficult for plain RNNs [@bengio1994].",
              tr: "Zamanda geri yayılımla eğitim, adım başına bir Jacobian çarpar. Normu birden küçükse, $t-k$ adımına kaybı nasıl etkilediğini söyleyen gradyan $k$ ile geometrik olarak küçülür; birden büyükse patlar. Bengio, Simard ve Frasconi, bu yüzden düz RNN'ler için gradyan inişiyle uzun bağımlılıkları öğrenmenin zor olduğunu gösterdi [@bengio1994].",
            },
          },
          {
            kind: "eq",
            tex: "\\frac{\\partial L}{\\partial \\mathbf h_{t-k}} = \\frac{\\partial L}{\\partial \\mathbf h_t}\\prod_{i=0}^{k-1}\\frac{\\partial \\mathbf h_{t-i}}{\\partial \\mathbf h_{t-i-1}}, \\qquad \\Bigl\\lVert \\tfrac{\\partial \\mathbf h_{t-i}}{\\partial \\mathbf h_{t-i-1}} \\Bigr\\rVert \\approx \\gamma < 1 \\;\\Rightarrow\\; \\propto \\gamma^{k}",
            source: "Bengio, Simard & Frasconi (1994)",
          },
          {
            kind: "fig",
            fig: "gradient-memory",
            caption: {
              en: "Relative size of the gradient reaching k hours back. With a per-step factor of 0.7, a plain RNN passes only 0.7²⁴ ≈ 2·10⁻⁴ of the signal back one day; the LSTM's cell state passes gradients through the forget gate, which can stay close to 1 (0.98²⁴ ≈ 0.6). Factors chosen for illustration.",
              tr: "k saat geriye ulaşan gradyanın göreli büyüklüğü. Adım başına 0,7 çarpanla düz bir RNN sinyalin bir gün geriye yalnızca 0,7²⁴ ≈ 2·10⁻⁴'ünü aktarır; LSTM'in hücre durumu gradyanları 1'e yakın kalabilen unutma kapısından geçirir (0,98²⁴ ≈ 0,6). Çarpanlar gösterim amaçlı seçilmiştir.",
            },
          },
        ],
      },
      {
        id: "cell",
        title: { en: "The LSTM cell", tr: "LSTM hücresi" },
        blocks: [
          {
            kind: "p",
            text: {
              en: "Hochreiter and Schmidhuber's long short-term memory [@hochreiter1997], with the forget gate added by Gers et al. [@gers2000], keeps a separate **cell state** $\\mathbf c_t$ that is updated additively. Three gates — small sigmoid layers with outputs between 0 and 1 — decide what to erase from it, what to write to it, and what to expose as output:",
              tr: "Hochreiter ve Schmidhuber'in uzun kısa süreli belleği [@hochreiter1997], Gers ve arkadaşlarının eklediği unutma kapısıyla [@gers2000] birlikte, toplamsal olarak güncellenen ayrı bir **hücre durumu** $\\mathbf c_t$ tutar. Üç kapı — çıktıları 0 ile 1 arasında olan küçük sigmoid katmanları — ondan neyin silineceğine, ona neyin yazılacağına ve neyin çıktı olarak gösterileceğine karar verir:",
            },
          },
          {
            kind: "eq",
            tex: "\\begin{aligned} \\mathbf f_t &= \\sigma(W_f[\\mathbf h_{t-1},\\mathbf x_t] + \\mathbf b_f) & \\mathbf i_t &= \\sigma(W_i[\\mathbf h_{t-1},\\mathbf x_t] + \\mathbf b_i) \\\\ \\tilde{\\mathbf c}_t &= \\tanh(W_c[\\mathbf h_{t-1},\\mathbf x_t] + \\mathbf b_c) & \\mathbf o_t &= \\sigma(W_o[\\mathbf h_{t-1},\\mathbf x_t] + \\mathbf b_o) \\\\ \\mathbf c_t &= \\mathbf f_t \\odot \\mathbf c_{t-1} + \\mathbf i_t \\odot \\tilde{\\mathbf c}_t & \\mathbf h_t &= \\mathbf o_t \\odot \\tanh(\\mathbf c_t) \\end{aligned}",
            where: [
              { sym: "\\mathbf f_t, \\mathbf i_t, \\mathbf o_t", def: { en: "forget, input and output gates, element-wise in (0, 1)", tr: "unutma, giriş ve çıkış kapıları, eleman bazında (0, 1)" } },
              { sym: "\\tilde{\\mathbf c}_t", def: { en: "candidate content, in (−1, 1)", tr: "aday içerik, (−1, 1)" } },
              { sym: "\\odot", def: { en: "element-wise product", tr: "eleman bazında çarpım" } },
            ],
            source: "Hochreiter & Schmidhuber (1997); Gers et al. (2000)",
          },
          {
            kind: "p",
            text: {
              en: "The key is the additive update of $\\mathbf c_t$: its derivative with respect to $\\mathbf c_{t-1}$ is simply $\\mathbf f_t$. Where the network learns to keep the forget gate open, information and gradients flow across many steps unchanged.",
              tr: "Anahtar, $\\mathbf c_t$'nin toplamsal güncellenmesidir: $\\mathbf c_{t-1}$'e göre türevi yalnızca $\\mathbf f_t$'dir. Ağın unutma kapısını açık tutmayı öğrendiği yerde bilgi ve gradyanlar birçok adım boyunca değişmeden akar.",
            },
          },
          {
            kind: "fig",
            fig: "lstm-cell",
            caption: {
              en: "One LSTM unit with hand-set weights reading a slowly rising wind with a two-step gust at steps 31–32. Scrub or play the sequence: while the input agrees with the memory the input gate is open and the cell state follows the ramp; when the gust arrives the input gate closes (≈ 0.03) and the forget gate opens fully (≈ 1.00), so the memory holds its value instead of jumping. The weights are chosen to show the mechanism; a trained network learns its own.",
              tr: "Yavaşça yükselen bir rüzgârı ve 31–32. adımlarda iki adımlık bir hamleyi okuyan, ağırlıkları elle ayarlanmış tek bir LSTM birimi. Diziyi kaydırın ya da oynatın: girdi hafızayla uyumlu olduğu sürece giriş kapısı açıktır ve hücre durumu rampayı izler; hamle geldiğinde giriş kapısı kapanır (≈ 0,03) ve unutma kapısı tamamen açılır (≈ 1,00); böylece hafıza sıçramak yerine değerini korur. Ağırlıklar mekanizmayı göstermek için seçilmiştir; eğitilmiş bir ağ kendi ağırlıklarını öğrenir.",
            },
          },
        ],
      },
      {
        id: "platform",
        title: { en: "The LSTM in this platform", tr: "Bu platformda LSTM" },
        blocks: [
          {
            kind: "p",
            text: {
              en: "The network is LSTM(64) → dropout 0.2 → LSTM(32) → dropout 0.2 → dense(1), reading 24 hourly rows of the 15 NWP features. It is trained offline with Adam on the same five folds (≈ 15 minutes on a CPU for both deep models) and its out-of-fold forecasts are bundled with the platform. On the test hours it scores **{lstm_nrmse} % nRMSE** — clearly better than persistence ({pers_nrmse} %), but behind XGBoost ({xgb_nrmse} %) and even the physics-only NWP curve ({curve_nrmse} %).",
              tr: "Ağ LSTM(64) → dropout 0,2 → LSTM(32) → dropout 0,2 → yoğun(1) yapısındadır ve 15 NWP özelliğinin 24 saatlik satırını okur. Aynı beş katmanda Adam ile çevrimdışı eğitilir (iki derin model için bir CPU'da ≈ 15 dakika) ve katman dışı tahminleri platformla birlikte paketlenir. Test saatlerinde **%{lstm_nrmse} nRMSE** alır — kalıcılıktan (%{pers_nrmse}) açıkça iyi, ama XGBoost'un (%{xgb_nrmse}) ve hatta yalnızca fizik temelli NWP eğrisinin (%{curve_nrmse}) gerisinde.",
            },
          },
          {
            kind: "callout",
            tone: "note",
            title: { en: "Why the LSTM does not win here", tr: "LSTM burada neden kazanmıyor" },
            body: [
              {
                en: "Three reasons stand out. The data are small for a neural network — about 17 000 training windows, and fewer in early folds. The NWP features already summarise the weather dynamics, so the sequence adds little beyond the current hour. And trees handle tabular inputs with uninformative features more robustly [@grinsztajn2022]. Deep models gain where data are large, inputs are raw fields (e.g. NWP grids) or many sites are learned jointly [@wang2019].",
                tr: "Üç neden öne çıkar. Veri bir sinir ağı için küçüktür — yaklaşık 17 000 eğitim penceresi, ilk katmanlarda daha az. NWP özellikleri hava dinamiğini zaten özetler; bu yüzden dizi mevcut saatin ötesinde az şey ekler. Ve ağaçlar bilgi taşımayan özellikli tablo girdilerini daha sağlam işler [@grinsztajn2022]. Derin modeller verinin büyük olduğu, girdilerin ham alanlar (örn. NWP ızgaraları) olduğu ya da birçok sahanın birlikte öğrenildiği yerde kazanır [@wang2019].",
              },
            ],
          },
          {
            kind: "callout",
            tone: "pitfall",
            title: { en: "Monte-Carlo dropout bands are too narrow", tr: "Monte-Carlo dropout bantları çok dardır" },
            body: [
              {
                en: "Running the network many times with dropout active gives a spread of forecasts — an estimate of **model** (epistemic) uncertainty [@gal2016]. It ignores the irreducible scatter of the weather itself, and the Gaussian band it implies is symmetric while power is bounded by 0 and capacity. Such bands are usually far too narrow, so the platform scores the LSTM as a point forecast and takes its bands from quantile models.",
                tr: "Ağı dropout etkin hâlde birçok kez çalıştırmak bir tahmin yayılımı verir — **model** (epistemik) belirsizliğinin bir tahmini [@gal2016]. Havanın kendisinin indirgenemez saçılımını yok sayar ve ima ettiği Gauss bandı simetrikken güç 0 ve kapasiteyle sınırlıdır. Bu tür bantlar genellikle çok dardır; bu yüzden platform LSTM'i nokta tahmini olarak puanlar ve bantlarını kantil modellerinden alır.",
              },
            ],
          },
        ],
      },
    ],
    practice: {
      platform: [
        { en: "LSTM(64) → LSTM(32) → dense, 24-hour windows, Adam, early stopping on the newest 20 % of each training block; out-of-fold forecasts are scored next to XGBoost on the same hours.", tr: "LSTM(64) → LSTM(32) → yoğun, 24 saatlik pencereler, Adam, her eğitim bloğunun en yeni %20'sinde erken durdurma; katman dışı tahminler aynı saatlerde XGBoost'un yanında puanlanır." },
        { en: "Its errors correlate {corr_tft_lstm} with the TFT's — the two networks fail in nearly the same hours (chapter 13).", tr: "Hataları TFT'ninkilerle {corr_tft_lstm} korelasyonludur — iki ağ neredeyse aynı saatlerde yanılır (bölüm 13)." },
      ],
      files: ["backend/app/services/p4/lstm_model.py", "backend/scripts/train_real_deep_models.py", "backend/app/services/p4/data/dk2_deep_predictions.csv.gz"],
      industry: [
        { en: "LSTMs are the most widely studied deep architecture for wind and solar forecasting [@wang2019] and are used operationally for very-short-term forecasts from SCADA sequences.", tr: "LSTM'ler rüzgâr ve güneş tahmini için en çok çalışılan derin mimaridir [@wang2019] ve SCADA dizilerinden çok kısa vadeli tahminler için operasyonel olarak kullanılır." },
        { en: "Outside energy, LSTMs powered speech recognition and machine translation before transformers [@goodfellow2016].", tr: "Enerjinin dışında LSTM'ler, transformer'lardan önce konuşma tanıma ve makine çevirisinin temelini oluşturdu [@goodfellow2016]." },
      ],
      solves: [
        { en: "Learns from the order of inputs — ramps, timing shifts, persistence of regimes — without hand-made lag features.", tr: "Girdilerin sırasından — rampalar, zamanlama kaymaları, rejimlerin kalıcılığı — elle yapılmış gecikme özellikleri olmadan öğrenir." },
      ],
      limits: [
        { en: "Needs more data and tuning than trees, trains slower, and is harder to explain.", tr: "Ağaçlardan daha fazla veri ve ayar gerektirir, daha yavaş eğitilir ve açıklanması daha zordur." },
      ],
    },
    takeaways: [
      { en: "RNNs carry a hidden state through time; their gradients vanish or explode over long sequences.", tr: "RNN'ler zaman boyunca gizli bir durum taşır; gradyanları uzun dizilerde kaybolur ya da patlar." },
      { en: "The LSTM's additive cell state, guarded by forget/input/output gates, keeps information and gradients alive.", tr: "LSTM'in unutma/giriş/çıkış kapılarıyla korunan toplamsal hücre durumu bilgiyi ve gradyanları canlı tutar." },
      { en: "On {hours} hours of tabular NWP features the LSTM ({lstm_nrmse} %) trails XGBoost ({xgb_nrmse} %).", tr: "{hours} saatlik tablo NWP özelliklerinde LSTM (%{lstm_nrmse}) XGBoost'un (%{xgb_nrmse}) gerisinde kalır." },
    ],
    quiz: [
      {
        q: { en: "Which LSTM equation makes long-range gradient flow possible?", tr: "Hangi LSTM denklemi uzun menzilli gradyan akışını mümkün kılar?" },
        options: [
          { en: "h_t = o_t ⊙ tanh(c_t)", tr: "h_t = o_t ⊙ tanh(c_t)" },
          { en: "c_t = f_t ⊙ c_{t−1} + i_t ⊙ c̃_t", tr: "c_t = f_t ⊙ c_{t−1} + i_t ⊙ c̃_t" },
          { en: "o_t = σ(W_o[h_{t−1}, x_t] + b_o)", tr: "o_t = σ(W_o[h_{t−1}, x_t] + b_o)" },
        ],
        answer: 1,
        why: { en: "The additive update gives ∂c_t/∂c_{t−1} = f_t, which the network can keep near 1.", tr: "Toplamsal güncelleme ∂c_t/∂c_{t−1} = f_t verir; ağ bunu 1'e yakın tutabilir." },
      },
      {
        q: { en: "Why does the platform not use the LSTM's Monte-Carlo dropout spread as its uncertainty band?", tr: "Platform LSTM'in Monte-Carlo dropout yayılımını neden belirsizlik bandı olarak kullanmaz?" },
        options: [
          { en: "It is too slow to compute", tr: "Hesaplaması çok yavaştır" },
          { en: "It captures only model uncertainty and is usually far too narrow", tr: "Yalnızca model belirsizliğini yakalar ve genellikle çok dardır" },
          { en: "Dropout is not allowed at prediction time", tr: "Tahmin anında dropout'a izin verilmez" },
        ],
        answer: 1,
        why: { en: "The weather's own scatter dominates day-ahead uncertainty; quantile models learn it directly.", tr: "Gün öncesi belirsizliğe havanın kendi saçılımı hâkimdir; kantil modelleri bunu doğrudan öğrenir." },
      },
    ],
    concepts: ["lstm", "sequence", "vanishing"],
  },

  // ───────────────────────────────────────────────────────────────── 10
  {
    id: "tft",
    n: 10,
    part: "models",
    title: { en: "Attention and the Temporal Fusion Transformer", tr: "Dikkat ve Temporal Fusion Transformer" },
    lead: {
      en: "Attention lets a network decide, for every forecast, which past moments to look at — and report the weights it used. It is the core of the transformer, the architecture behind today's large language models. The Temporal Fusion Transformer (TFT) adapts it to multi-horizon forecasting with learned variable selection and quantile outputs. This chapter explains attention with a geometric example and shows the TFT exactly as the platform implements it.",
      tr: "Dikkat, bir ağın her tahmin için hangi geçmiş anlara bakacağına karar vermesini — ve kullandığı ağırlıkları raporlamasını — sağlar. Bugünün büyük dil modellerinin arkasındaki mimari olan transformer'ın çekirdeğidir. Temporal Fusion Transformer (TFT) onu öğrenilmiş değişken seçimi ve kantil çıktılarla çok ufuklu tahmine uyarlar. Bu bölüm dikkati geometrik bir örnekle açıklar ve TFT'yi tam olarak platformun uyguladığı şekliyle gösterir.",
    },
    objectives: [
      { en: "Compute scaled dot-product attention for a small example and interpret the weights.", tr: "Küçük bir örnek için ölçekli nokta çarpım dikkatini hesaplamak ve ağırlıkları yorumlamak." },
      { en: "Name the components of the TFT — variable selection, gated residual networks, attention, quantile heads.", tr: "TFT'nin bileşenlerini — değişken seçimi, kapılı artık ağlar, dikkat, kantil başları — saymak." },
      { en: "Assess the platform's TFT: accuracy, calibration and what it offers beyond the LSTM.", tr: "Platformun TFT'sini değerlendirmek: doğruluk, kalibrasyon ve LSTM'in ötesinde ne sunduğu." },
    ],
    sections: [
      {
        id: "attention",
        title: { en: "Attention as weighted look-up", tr: "Ağırlıklı başvuru olarak dikkat" },
        blocks: [
          {
            kind: "p",
            text: {
              en: "Attention was introduced for machine translation to let a decoder look back at all encoder states instead of one fixed summary [@bahdanau2015]. In its scaled dot-product form [@vaswani2017] every time step produces a **query** $\\mathbf q$, a **key** $\\mathbf k$ and a **value** $\\mathbf v$ by linear projections. The weight of step $j$ for the current step is the softmax of the query–key similarity, and the output is the weighted sum of values:",
              tr: "Dikkat, makine çevirisinde kod çözücünün tek bir sabit özet yerine tüm kodlayıcı durumlarına geri bakabilmesi için önerildi [@bahdanau2015]. Ölçekli nokta çarpım biçiminde [@vaswani2017] her zaman adımı doğrusal izdüşümlerle bir **sorgu** $\\mathbf q$, bir **anahtar** $\\mathbf k$ ve bir **değer** $\\mathbf v$ üretir. $j$ adımının mevcut adım için ağırlığı sorgu–anahtar benzerliğinin softmax'ıdır ve çıktı değerlerin ağırlıklı toplamıdır:",
            },
          },
          {
            kind: "eq",
            tex: "\\alpha_j = \\frac{\\exp\\!\\bigl(\\mathbf q^{\\top}\\mathbf k_j/\\sqrt{d_k}\\bigr)}{\\sum_{l}\\exp\\!\\bigl(\\mathbf q^{\\top}\\mathbf k_l/\\sqrt{d_k}\\bigr)}, \\qquad \\operatorname{Attention}(Q,K,V) = \\operatorname{softmax}\\!\\Bigl(\\frac{QK^{\\top}}{\\sqrt{d_k}}\\Bigr)V",
            where: [
              { sym: "\\mathbf q, \\mathbf k_j, \\mathbf v_j", def: { en: "query of the current step, key and value of step j", tr: "mevcut adımın sorgusu, j adımının anahtarı ve değeri" } },
              { sym: "d_k", def: { en: "key dimension; dividing by √dₖ keeps the softmax from saturating", tr: "anahtar boyutu; √dₖ'ye bölmek softmax'ın doymasını önler" } },
              { sym: "\\alpha_j", def: { en: "attention weight, ≥ 0, summing to 1", tr: "dikkat ağırlığı, ≥ 0, toplamı 1" } },
            ],
            source: "Vaswani et al. (2017), eq. 1",
          },
          {
            kind: "fig",
            fig: "attention-geometry",
            caption: {
              en: "Attention in two dimensions. Five past hours have keys (blue arrows) and values (power); rotate the query (orange) and the weights follow its alignment with each key. Lengthen the query and the softmax sharpens towards a single hour (low entropy); shorten it and attention spreads evenly. In a trained network $Q$, $K$ and $V$ are learned projections — the vectors here are chosen for illustration.",
              tr: "İki boyutta dikkat. Beş geçmiş saatin anahtarları (mavi oklar) ve değerleri (güç) vardır; sorguyu (turuncu) döndürün, ağırlıklar her anahtarla hizalanmasını izler. Sorguyu uzatın, softmax tek bir saate doğru keskinleşir (düşük entropi); kısaltın, dikkat eşit yayılır. Eğitilmiş bir ağda $Q$, $K$ ve $V$ öğrenilmiş izdüşümlerdir — buradaki vektörler gösterim için seçilmiştir.",
            },
          },
          {
            kind: "p",
            text: {
              en: "**Multi-head** attention runs several attentions in parallel with different projections, so one head can track the most recent hours while another tracks the same hour of the previous day. Because every weight $\\alpha_j$ is explicit, attention can be inspected: which past hours drove this forecast? [@vaswani2017;@lim2021]",
              tr: "**Çok başlı** dikkat, farklı izdüşümlerle birkaç dikkati paralel çalıştırır; böylece bir baş en son saatleri izlerken diğeri bir önceki günün aynı saatini izleyebilir. Her ağırlık $\\alpha_j$ açık olduğu için dikkat incelenebilir: bu tahmini hangi geçmiş saatler yönlendirdi? [@vaswani2017;@lim2021]",
            },
          },
        ],
      },
      {
        id: "tft",
        title: { en: "The Temporal Fusion Transformer", tr: "Temporal Fusion Transformer" },
        blocks: [
          {
            kind: "p",
            text: {
              en: "Lim et al. designed the TFT for interpretable multi-horizon forecasting [@lim2021]. Its building block is the **gated residual network** (GRN): a small two-layer network whose output passes through a gated linear unit (GLU) and is added to its input, so the network can switch a block off where it does not help. A **variable selection network** applies a GRN to every input and a softmax across inputs, giving learned, inspectable feature weights. An LSTM encoder captures local order, interpretable multi-head attention captures longer patterns, and separate output heads give the quantiles, trained with the summed pinball loss.",
              tr: "Lim ve arkadaşları TFT'yi yorumlanabilir çok ufuklu tahmin için tasarladı [@lim2021]. Yapı taşı **kapılı artık ağdır** (GRN): çıktısı bir kapılı doğrusal birimden (GLU) geçen ve girdisine eklenen küçük iki katmanlı bir ağ; böylece ağ yardımcı olmadığı yerde bir bloğu kapatabilir. **Değişken seçim ağı** her girdiye bir GRN ve girdiler boyunca bir softmax uygular; öğrenilmiş, incelenebilir özellik ağırlıkları verir. Bir LSTM kodlayıcı yerel sırayı, yorumlanabilir çok başlı dikkat daha uzun desenleri yakalar ve ayrı çıkış başları toplam pinball kaybıyla eğitilen kantilleri verir.",
            },
          },
          {
            kind: "eq",
            tex: "\\operatorname{GRN}(\\mathbf a) = \\operatorname{LayerNorm}\\bigl(\\mathbf a + \\operatorname{GLU}(W_2\\,\\operatorname{ELU}(W_1\\mathbf a + \\mathbf b_1) + \\mathbf b_2)\\bigr), \\qquad \\operatorname{GLU}(\\boldsymbol\\gamma) = \\boldsymbol\\gamma_1 \\odot \\sigma(\\boldsymbol\\gamma_2)",
            where: [
              { sym: "\\operatorname{ELU}", def: { en: "exponential linear unit activation", tr: "üstel doğrusal birim aktivasyonu" } },
              { sym: "\\boldsymbol\\gamma_1, \\boldsymbol\\gamma_2", def: { en: "the two halves of the layer output: value and gate", tr: "katman çıktısının iki yarısı: değer ve kapı" } },
            ],
            source: "Lim et al. (2021), eqs. 2–5",
          },
          {
            kind: "fig",
            fig: "tft-architecture",
            caption: {
              en: "The TFT as implemented in this platform: variable selection over the 15 NWP features, an LSTM encoder with 32 units, two-head attention, a gated residual network and nine linear quantile heads. Gated skip paths let each block be bypassed when it does not help.",
              tr: "Bu platformda uygulandığı şekliyle TFT: 15 NWP özelliği üzerinde değişken seçimi, 32 birimli bir LSTM kodlayıcı, iki başlı dikkat, bir kapılı artık ağ ve dokuz doğrusal kantil başı. Kapılı atlama yolları, yardımcı olmadığında her bloğun atlanmasını sağlar.",
            },
          },
        ],
      },
      {
        id: "platform",
        title: { en: "The TFT in this platform", tr: "Bu platformda TFT" },
        blocks: [
          {
            kind: "p",
            text: {
              en: "The platform's TFT reads the same 24-hour windows as the LSTM and outputs P10 … P90 directly. It scores **{tft_nrmse} % nRMSE** for its median — better than the LSTM ({lstm_nrmse} %), behind XGBoost — and its P10–P90 band contains **{tft_cov} %** of the test hours instead of 80 %: the band is too narrow, i.e. the model is over-confident. Pinball training rewards calibration but does not guarantee it on new data; without a conformal correction, quantile networks are commonly under-dispersed (chapter 11).",
              tr: "Platformun TFT'si LSTM ile aynı 24 saatlik pencereleri okur ve P10 … P90'ı doğrudan verir. Medyanı için **%{tft_nrmse} nRMSE** alır — LSTM'den (%{lstm_nrmse}) iyi, XGBoost'un gerisinde — ve P10–P90 bandı test saatlerinin %80'i yerine **%{tft_cov}**'ünü içerir: bant çok dardır, yani model aşırı güvenlidir. Pinball eğitimi kalibrasyonu ödüllendirir ama yeni veride garanti etmez; konformal düzeltme olmadan kantil ağları genellikle dar dağılımlıdır (bölüm 11).",
            },
          },
          {
            kind: "callout",
            tone: "note",
            title: { en: "Simplifications in this implementation", tr: "Bu uygulamadaki sadeleştirmeler" },
            body: [
              {
                en: "The original TFT also encodes static covariates (e.g. site identity), known future inputs and a separate decoder for many horizons at once. The day-ahead target here is one hour per window and there is one site, so the platform's TFT keeps the variable selection, LSTM, attention, GRN and quantile heads and drops the rest. With several farms, the static encoders would let one model learn all sites jointly — where the TFT is expected to pay off.",
                tr: "Özgün TFT ayrıca statik eş değişkenleri (örn. saha kimliği), bilinen gelecek girdilerini ve aynı anda birçok ufuk için ayrı bir kod çözücüyü kodlar. Buradaki gün öncesi hedef pencere başına bir saattir ve tek bir saha vardır; bu yüzden platformun TFT'si değişken seçimini, LSTM'i, dikkati, GRN'yi ve kantil başlarını tutar, gerisini bırakır. Birden çok santralde statik kodlayıcılar tek bir modelin tüm sahaları birlikte öğrenmesini sağlardı — TFT'nin karşılığını vermesi beklenen yer orasıdır.",
              },
            ],
          },
        ],
      },
    ],
    practice: {
      platform: [
        { en: "TFT: variable selection → LSTM(32) → 2-head attention → GRN → 9 quantile heads, 24-hour windows, dropout 0.1, Adam, early stopping; out-of-fold quantiles bundled and scored with the rest.", tr: "TFT: değişken seçimi → LSTM(32) → 2 başlı dikkat → GRN → 9 kantil başı, 24 saatlik pencereler, dropout 0,1, Adam, erken durdurma; katman dışı kantiller paketlenir ve diğerleriyle birlikte puanlanır." },
        { en: "Its reliability curve (Figure 12.3) lies outside the diagonal at both ends: the over-confidence is visible, not hidden.", tr: "Güvenilirlik eğrisi (Şekil 12.3) iki uçta da köşegenin dışında kalır: aşırı güven gizli değil, görünürdür." },
      ],
      files: ["backend/app/services/p4/tft_model.py", "backend/scripts/train_real_deep_models.py"],
      industry: [
        { en: "The TFT is a common baseline in forecasting research and is offered in open-source libraries and cloud forecasting services; it was shown on electricity, traffic and retail data [@lim2021].", tr: "TFT tahmin araştırmalarında yaygın bir temel modeldir ve açık kaynak kütüphanelerde ve bulut tahmin hizmetlerinde sunulur; elektrik, trafik ve perakende verilerinde gösterilmiştir [@lim2021]." },
        { en: "Transformers also power the new generation of machine-learned weather models that feed wind forecasts [@lam2023].", tr: "Transformer'lar rüzgâr tahminlerini besleyen yeni nesil makine öğrenmeli hava modellerinin de temelindedir [@lam2023]." },
      ],
      solves: [
        { en: "Combines sequence modelling, learned feature selection and quantile outputs in one network, with built-in interpretability.", tr: "Dizi modellemeyi, öğrenilmiş özellik seçimini ve kantil çıktıları yerleşik yorumlanabilirlikle tek bir ağda birleştirir." },
      ],
      limits: [
        { en: "Many parameters for a small data set; calibration is not automatic; attention weights explain where the model looked, not why.", tr: "Küçük bir veri seti için çok sayıda parametre; kalibrasyon otomatik değildir; dikkat ağırlıkları modelin nereye baktığını açıklar, nedenini değil." },
      ],
    },
    takeaways: [
      { en: "Attention: softmax(QKᵀ/√dₖ)V — a learned, explicit weighting of past steps.", tr: "Dikkat: softmax(QKᵀ/√dₖ)V — geçmiş adımların öğrenilmiş, açık ağırlıklandırması." },
      { en: "TFT = variable selection + GRNs + LSTM + interpretable attention + quantile heads.", tr: "TFT = değişken seçimi + GRN'ler + LSTM + yorumlanabilir dikkat + kantil başları." },
      { en: "Here the TFT is more accurate than the LSTM but over-confident ({tft_cov} % coverage instead of 80 %).", tr: "Burada TFT LSTM'den daha doğrudur ama aşırı güvenlidir (%80 yerine %{tft_cov} kapsama)." },
    ],
    quiz: [
      {
        q: { en: "Why is the dot product divided by √dₖ in scaled dot-product attention?", tr: "Ölçekli nokta çarpım dikkatinde nokta çarpım neden √dₖ'ye bölünür?" },
        options: [
          { en: "To make the weights sum to one", tr: "Ağırlıkların toplamını bir yapmak için" },
          { en: "To keep the scores from growing with dimension and saturating the softmax", tr: "Skorların boyutla büyüyüp softmax'ı doyurmasını önlemek için" },
          { en: "To normalise the values", tr: "Değerleri normalize etmek için" },
        ],
        answer: 1,
        why: { en: "The variance of qᵀk grows with dₖ; large scores push the softmax into a near one-hot regime with tiny gradients.", tr: "qᵀk'nin varyansı dₖ ile büyür; büyük skorlar softmax'ı gradyanların çok küçük olduğu neredeyse tek-sıcak bir rejime iter." },
      },
      {
        q: { en: "The TFT's P10–P90 band holds 75 % of the test hours. What does that mean?", tr: "TFT'nin P10–P90 bandı test saatlerinin %75'ini içeriyor. Bu ne anlama gelir?" },
        options: [
          { en: "The band is too wide — under-confident", tr: "Bant çok geniş — yetersiz güvenli" },
          { en: "The band is too narrow — over-confident", tr: "Bant çok dar — aşırı güvenli" },
          { en: "The band is perfectly calibrated", tr: "Bant mükemmel kalibre edilmiş" },
        ],
        answer: 1,
        why: { en: "A calibrated 80 % band holds 80 %; 75 % means outcomes fall outside more often than the model claims.", tr: "Kalibre edilmiş bir %80 bandı %80'i içerir; %75, sonuçların modelin iddia ettiğinden daha sık dışarıda kaldığı anlamına gelir." },
      },
    ],
    concepts: ["attention", "tft", "quantile"],
  },
];
