/**
 * Part II — learning from data: supervised learning, loss and optimisation, validation of
 * a time-series model, and leakage.
 */

import type { Chapter } from "./types";

export const PART2: Chapter[] = [
  // ───────────────────────────────────────────────────────────────── 4
  {
    id: "ml",
    n: 4,
    part: "learning",
    title: { en: "Supervised learning: features, target and generalisation", tr: "Denetimli öğrenme: özellikler, hedef ve genelleme" },
    lead: {
      en: "Machine learning for forecasting is function fitting: from past examples of inputs and outcomes, find a function that maps tomorrow's inputs to tomorrow's outcome. Everything that makes it hard — choosing inputs that carry the physics, avoiding a function that memorises noise, judging it honestly — is in the details. This chapter sets up the problem exactly as the platform solves it.",
      tr: "Tahmin için makine öğrenmesi fonksiyon uydurmadır: girdi ve sonuçların geçmiş örneklerinden, yarının girdilerini yarının sonucuna eşleyen bir fonksiyon bulmak. Onu zorlaştıran her şey — fiziği taşıyan girdileri seçmek, gürültüyü ezberleyen bir fonksiyondan kaçınmak, onu dürüstçe değerlendirmek — ayrıntılardadır. Bu bölüm problemi tam olarak platformun çözdüğü şekilde kurar.",
    },
    objectives: [
      { en: "State a forecasting problem as supervised learning: features, target, model, loss.", tr: "Bir tahmin problemini denetimli öğrenme olarak ifade etmek: özellikler, hedef, model, kayıp." },
      { en: "Design features that encode physics: cyclic direction and time, model disagreement.", tr: "Fiziği kodlayan özellikler tasarlamak: döngüsel yön ve zaman, modeller arası fark." },
      { en: "Explain under- and over-fitting with the bias–variance decomposition.", tr: "Eksik ve aşırı öğrenmeyi yanlılık–varyans ayrışımıyla açıklamak." },
      { en: "Assign the roles of training, validation and test data in the platform's pipeline.", tr: "Platformun hattında eğitim, doğrulama ve test verisinin rollerini belirlemek." },
    ],
    sections: [
      {
        id: "problem",
        title: { en: "The learning problem", tr: "Öğrenme problemi" },
        blocks: [
          {
            kind: "p",
            text: {
              en: "We observe pairs $(\\mathbf x_i, y_i)$: a vector of **features** known at forecast time and the **target** that happened. A model $f_\\theta$ with parameters $\\theta$ is chosen to make a **loss** $L$ small on these examples — empirical risk minimisation [@hastie2009]:",
              tr: "$(\\mathbf x_i, y_i)$ çiftlerini gözlemleriz: tahmin anında bilinen bir **özellik** vektörü ve gerçekleşen **hedef**. $\\theta$ parametreli bir $f_\\theta$ modeli, bu örneklerdeki bir **kaybı** $L$ küçültecek şekilde seçilir — ampirik risk minimizasyonu [@hastie2009]:",
            },
          },
          {
            kind: "eq",
            tex: "\\hat\\theta \\;=\\; \\arg\\min_{\\theta}\\; \\frac{1}{n}\\sum_{i=1}^{n} L\\bigl(y_i,\\, f_\\theta(\\mathbf x_i)\\bigr) \\;+\\; \\Omega(\\theta)",
            where: [
              { sym: "\\mathbf x_i", def: { en: "features of hour i: the 15 NWP columns", tr: "i saatinin özellikleri: 15 NWP sütunu" }, unit: "–" },
              { sym: "y_i", def: { en: "target: mean measured power of the three farms in hour i", tr: "hedef: i saatinde üç santralin ölçülen ortalama gücü" }, unit: "MW" },
              { sym: "L", def: { en: "loss: squared, absolute or pinball (chapter 5)", tr: "kayıp: kare, mutlak ya da pinball (bölüm 5)" }, unit: "–" },
              { sym: "\\Omega", def: { en: "regulariser that penalises complexity", tr: "karmaşıklığı cezalandıran düzenlileştirici" }, unit: "–" },
            ],
          },
          {
            kind: "fig",
            fig: "feature-table",
            caption: {
              en: "Four rows of the table the models learn from, from the week of Figure 1.2. Each row is one delivery hour: inputs are the wind speed, direction and spread forecast the day before; the target is what the farms then produced. Note the first row: the winds at Kriegers Flak and Rødsand differ by up to 9.6 m/s — a front lies between the farms, and the spread feature flags the hour as uncertain.",
              tr: "Modellerin öğrendiği tablodan dört satır, Şekil 1.2'deki haftadan. Her satır bir teslimat saatidir: girdiler bir gün önce tahmin edilen rüzgâr hızı, yön ve yayılımdır; hedef santrallerin sonra ürettiğidir. İlk satıra dikkat: Kriegers Flak ve Rødsand'daki rüzgârlar 9,6 m/s'ye kadar farklıdır — santraller arasında bir cephe vardır ve yayılım özelliği saati belirsiz olarak işaretler.",
            },
            source: { en: "Energinet [@energinet], Open-Meteo [@openmeteo]; `build_features()`.", tr: "Energinet [@energinet], Open-Meteo [@openmeteo]; `build_features()`." },
          },
        ],
      },
      {
        id: "features",
        title: { en: "Features that carry the physics", tr: "Fiziği taşıyan özellikler" },
        blocks: [
          {
            kind: "p",
            text: {
              en: "A learning algorithm only sees numbers, so the way physics is encoded matters. **Direction** is an angle: 359° and 1° are neighbours, yet as numbers they are far apart. Encoding it as $(\\sin\\theta, \\cos\\theta)$ places directions on a circle where neighbours stay neighbours. The **hour of day** is cyclic in the same way and carries the diurnal cycle of stability over the sea. The **spread** — largest minus smallest of the four NWP winds — is a cheap proxy for forecast uncertainty: it grows when ECMWF and ICON disagree and when the two farms, about 100 km apart, see different winds, as when a front lies between them; both mark hours that are hard to predict [@giebel2011].",
              tr: "Bir öğrenme algoritması yalnızca sayı görür; bu yüzden fiziğin nasıl kodlandığı önemlidir. **Yön** bir açıdır: 359° ve 1° komşudur, ama sayı olarak birbirinden uzaktır. Onu $(\\sin\\theta, \\cos\\theta)$ olarak kodlamak, yönleri komşuların komşu kaldığı bir çember üzerine yerleştirir. **Günün saati** de aynı şekilde döngüseldir ve deniz üzerindeki kararlılığın günlük döngüsünü taşır. **Yayılım** — dört NWP rüzgârının en büyüğü eksi en küçüğü — tahmin belirsizliği için ucuz bir göstergedir: ECMWF ve ICON anlaşamadığında ve yaklaşık 100 km aralıklı iki santral farklı rüzgâr gördüğünde, örneğin aralarında bir cephe olduğunda büyür; ikisi de tahmini zor saatleri işaret eder [@giebel2011].",
            },
          },
          {
            kind: "eq",
            tex: "\\theta \\mapsto (\\sin\\theta,\\;\\cos\\theta), \\qquad h \\mapsto \\Bigl(\\sin\\tfrac{2\\pi h}{24},\\;\\cos\\tfrac{2\\pi h}{24}\\Bigr), \\qquad s = \\max_j u_j - \\min_j u_j",
            where: [
              { sym: "\\theta", def: { en: "NWP wind direction (from which the wind blows)", tr: "NWP rüzgâr yönü (rüzgârın estiği yön)" }, unit: "°" },
              { sym: "h", def: { en: "hour of day (UTC)", tr: "günün saati (UTC)" }, unit: "h" },
              { sym: "u_j", def: { en: "the four NWP wind speeds (2 models × 2 sites)", tr: "dört NWP rüzgâr hızı (2 model × 2 saha)" }, unit: "m/s" },
            ],
          },
          {
            kind: "callout",
            tone: "pitfall",
            title: { en: "Scaling is part of the model", tr: "Ölçekleme modelin parçasıdır" },
            body: [
              {
                en: "Neural networks need inputs on similar scales, so the LSTM and TFT min–max scale every feature. The minimum and maximum must come from the **training block of each fold only**; computed over all data, they would carry information about the test period into training — a subtle leak (chapter 7). Trees are scale-invariant and need no scaling.",
                tr: "Sinir ağları benzer ölçekte girdilere ihtiyaç duyar; bu yüzden LSTM ve TFT her özelliği min–maks ölçekler. Minimum ve maksimum **yalnızca her katmanın eğitim bloğundan** alınmalıdır; tüm veri üzerinden hesaplanırsa test dönemine ait bilgiyi eğitime taşır — sinsi bir sızıntı (bölüm 7). Ağaçlar ölçekten bağımsızdır ve ölçeklemeye ihtiyaç duymaz.",
              },
            ],
          },
        ],
      },
      {
        id: "generalisation",
        title: { en: "Generalisation: bias and variance", tr: "Genelleme: yanlılık ve varyans" },
        blocks: [
          {
            kind: "p",
            text: {
              en: "A model is useful only if it works on data it has not seen. Its expected squared error on a new point splits into three parts [@hastie2009;@bishop2006]: the noise that no model can remove, the **bias** of a model too simple to follow the true relation, and the **variance** of a model so flexible that it follows the noise of its particular training sample.",
              tr: "Bir model ancak görmediği veride çalışıyorsa yararlıdır. Yeni bir noktadaki beklenen kare hatası üç parçaya ayrılır [@hastie2009;@bishop2006]: hiçbir modelin gideremeyeceği gürültü, gerçek ilişkiyi izleyemeyecek kadar basit bir modelin **yanlılığı** ve kendi eğitim örneğinin gürültüsünü izleyecek kadar esnek bir modelin **varyansı**.",
            },
          },
          {
            kind: "eq",
            tex: "\\mathbb E\\bigl[(y - \\hat f(\\mathbf x))^2\\bigr] \\;=\\; \\underbrace{\\sigma_\\varepsilon^2}_{\\text{noise}} \\;+\\; \\underbrace{\\bigl(\\mathbb E[\\hat f(\\mathbf x)] - f(\\mathbf x)\\bigr)^2}_{\\text{bias}^2} \\;+\\; \\underbrace{\\operatorname{Var}\\bigl[\\hat f(\\mathbf x)\\bigr]}_{\\text{variance}}",
            where: [
              { sym: "f", def: { en: "the true (unknown) relation", tr: "gerçek (bilinmeyen) ilişki" } },
              { sym: "\\hat f", def: { en: "the model fitted to one training sample", tr: "bir eğitim örneğine uydurulan model" } },
              { sym: "\\sigma_\\varepsilon^2", def: { en: "irreducible noise variance", tr: "indirgenemez gürültü varyansı" } },
            ],
            source: "Hastie, Tibshirani & Friedman (2009), §7.3",
          },
          {
            kind: "fig",
            fig: "bias-variance",
            caption: {
              en: "A regression tree of growing depth fitted to 40 noisy samples of a power curve. Depth 0–1 cannot follow the curve (bias); from depth 4 the tree fits individual noisy points and the error on 400 unseen samples rises again (variance). The training error always falls — it is useless for choosing complexity.",
              tr: "Bir güç eğrisinin 40 gürültülü örneğine uydurulan, derinliği artan bir regresyon ağacı. 0–1 derinlik eğriyi izleyemez (yanlılık); 4 derinlikten itibaren ağaç tek tek gürültülü noktalara uyar ve 400 görülmemiş örnekteki hata yeniden yükselir (varyans). Eğitim hatası her zaman düşer — karmaşıklığı seçmek için işe yaramaz.",
            },
          },
          {
            kind: "p",
            text: {
              en: "Every model in this course controls variance with some form of **regularisation**: XGBoost limits tree depth, shrinks each tree and penalises leaf weights; the neural networks use dropout and early stopping (chapters 5 and 8).",
              tr: "Bu kurstaki her model varyansı bir tür **düzenlileştirme** ile kontrol eder: XGBoost ağaç derinliğini sınırlar, her ağacı küçültür ve yaprak ağırlıklarını cezalandırır; sinir ağları dropout ve erken durdurma kullanır (bölüm 5 ve 8).",
            },
          },
        ],
      },
      {
        id: "splits",
        title: { en: "Training, validation and test data", tr: "Eğitim, doğrulama ve test verisi" },
        blocks: [
          {
            kind: "table",
            caption: { en: "Roles of the data in each of the five folds of the platform.", tr: "Platformun beş katmanının her birinde verinin rolleri." },
            head: [
              { en: "Part", tr: "Bölüm" },
              { en: "Used for", tr: "Kullanım" },
              { en: "Never used for", tr: "Asla kullanılmaz" },
            ],
            rows: [
              [
                { en: "Older 80 % of the training block", tr: "Eğitim bloğunun eski %80'i" },
                { en: "fitting trees and network weights", tr: "ağaçları ve ağ ağırlıklarını uydurmak" },
                { en: "—", tr: "—" },
              ],
              [
                { en: "Newest 20 % of the training block", tr: "Eğitim bloğunun en yeni %20'si" },
                { en: "early stopping (LSTM, TFT); conformal margin of the band (XGBoost)", tr: "erken durdurma (LSTM, TFT); bandın konformal payı (XGBoost)" },
                { en: "scoring", tr: "puanlama" },
              ],
              [
                { en: "48 h gap", tr: "48 sa boşluk" },
                { en: "nothing — it separates training and test weather", tr: "hiçbir şey — eğitim ve test havasını ayırır" },
                { en: "anything", tr: "hiçbir şey" },
              ],
              [
                { en: "Test block (≈ 142 days)", tr: "Test bloğu (≈ 142 gün)" },
                { en: "scores in the table and on the charts", tr: "tablodaki ve grafiklerdeki skorlar" },
                { en: "fitting, tuning, choosing weights", tr: "uydurma, ayarlama, ağırlık seçimi" },
              ],
            ],
          },
          {
            kind: "callout",
            tone: "pitfall",
            title: { en: "The test set is used once", tr: "Test seti bir kez kullanılır" },
            body: [
              {
                en: "Each time a model is changed after looking at test scores, the test set becomes a little more of a training set. Hyper-parameters should be chosen on validation data; the platform keeps its settings fixed (400 trees, depth 5, η = 0.05) and does not tune them on the test folds.",
                tr: "Test skorlarına bakıldıktan sonra model her değiştirildiğinde, test seti biraz daha eğitim setine dönüşür. Hiper parametreler doğrulama verisinde seçilmelidir; platform ayarlarını sabit tutar (400 ağaç, derinlik 5, η = 0,05) ve bunları test katmanlarında ayarlamaz.",
              },
            ],
          },
        ],
      },
    ],
    practice: {
      platform: [
        { en: "`build_features()` creates the 15 columns of Figure 4.1; there is no measured power or wind among them. The same matrix feeds XGBoost directly and the LSTM/TFT as 24-hour windows.", tr: "`build_features()` Şekil 4.1'deki 15 sütunu oluşturur; aralarında ölçülmüş güç ya da rüzgâr yoktur. Aynı matris XGBoost'a doğrudan, LSTM/TFT'ye 24 saatlik pencereler olarak verilir." },
        { en: "Global SHAP shows what the model learned: the Kriegers Flak winds of ICON and ECMWF carry {shap_kf} % of the attribution — the largest farm dominates the output.", tr: "Küresel SHAP modelin ne öğrendiğini gösterir: ICON ve ECMWF'nin Kriegers Flak rüzgârları atfın %{shap_kf}'sini taşır — en büyük santral üretime hâkimdir." },
      ],
      files: ["backend/app/services/p4/real_data.py · build_features()", "backend/app/services/p4/lstm_model.py · _fold_normalized()"],
      industry: [
        { en: "Feature engineering from NWP — interpolating grid points, deriving direction and stability, combining models — is where operational forecasters spend much of their effort; GEFCom2014's best wind entries were largely won on features [@hong2016;@landry2016].", tr: "NWP'den özellik mühendisliği — ızgara noktalarını enterpolasyon, yön ve kararlılık türetme, modelleri birleştirme — operasyonel tahmincilerin emeğinin büyük kısmını harcadığı yerdir; GEFCom2014'ün en iyi rüzgâr çözümleri büyük ölçüde özelliklerle kazanıldı [@hong2016;@landry2016]." },
      ],
      solves: [
        { en: "Learns the farm-specific mapping from weather to power — wakes, availability patterns, local effects — that no generic power curve contains.", tr: "Hiçbir genel güç eğrisinin içermediği, santrale özgü hava–güç eşlemesini — iz, kullanılabilirlik desenleri, yerel etkiler — öğrenir." },
      ],
      limits: [
        { en: "A learned model can only reproduce relations present in its training data; a new farm layout or a new turbine type needs new data.", tr: "Öğrenilen bir model yalnızca eğitim verisinde bulunan ilişkileri yeniden üretebilir; yeni bir santral yerleşimi ya da yeni bir türbin tipi yeni veri gerektirir." },
      ],
    },
    takeaways: [
      { en: "Supervised learning = minimise a loss over (features, target) pairs, plus regularisation.", tr: "Denetimli öğrenme = (özellik, hedef) çiftleri üzerinde bir kaybı en aza indirmek, artı düzenlileştirme." },
      { en: "Encode angles and hours as sine and cosine; give the model a measure of uncertainty such as NWP spread.", tr: "Açıları ve saatleri sinüs ve kosinüs olarak kodlayın; modele NWP yayılımı gibi bir belirsizlik ölçüsü verin." },
      { en: "Error on unseen data = noise + bias² + variance; only unseen data can choose the complexity.", tr: "Görülmemiş verideki hata = gürültü + yanlılık² + varyans; karmaşıklığı yalnızca görülmemiş veri seçebilir." },
    ],
    quiz: [
      {
        q: { en: "Why is wind direction given to the model as (sin θ, cos θ) instead of θ in degrees?", tr: "Rüzgâr yönü modele neden derece cinsinden θ yerine (sin θ, cos θ) olarak verilir?" },
        options: [
          { en: "Because trees cannot split on degrees", tr: "Çünkü ağaçlar dereceler üzerinden bölemez" },
          { en: "So that 359° and 1° are close, as they are physically", tr: "Böylece 359° ve 1°, fiziksel olarak olduğu gibi yakın olur" },
          { en: "To make the values smaller", tr: "Değerleri küçültmek için" },
        ],
        answer: 1,
        why: { en: "On the unit circle 359° and 1° are 2° apart; as raw numbers they are 358 apart and the model would see a fake jump.", tr: "Birim çember üzerinde 359° ve 1° arası 2°'dir; ham sayı olarak 358 farklıdırlar ve model sahte bir sıçrama görür." },
      },
      {
        q: { en: "Training error keeps falling as a tree gets deeper, but test error starts rising. What is happening?", tr: "Ağaç derinleştikçe eğitim hatası düşmeye devam ediyor ama test hatası yükselmeye başlıyor. Ne oluyor?" },
        options: [
          { en: "Under-fitting: the model is too simple", tr: "Eksik öğrenme: model çok basit" },
          { en: "Over-fitting: variance dominates", tr: "Aşırı öğrenme: varyans baskın" },
          { en: "The noise level has changed", tr: "Gürültü seviyesi değişti" },
        ],
        answer: 1,
        why: { en: "The model fits the noise of its training sample; that does not repeat on new data, so the test error grows.", tr: "Model eğitim örneğinin gürültüsüne uyar; bu yeni veride tekrarlanmaz, bu yüzden test hatası büyür." },
      },
    ],
    concepts: ["features", "target", "overfitting", "validation"],
  },

  // ───────────────────────────────────────────────────────────────── 5
  {
    id: "optim",
    n: 5,
    part: "learning",
    title: { en: "How models learn: loss functions and gradient descent", tr: "Modeller nasıl öğrenir: kayıp fonksiyonları ve gradyan inişi" },
    lead: {
      en: "The loss defines what \"good\" means; the optimiser finds parameters that achieve it. The choice of loss decides which statistic the forecast estimates — the mean, the median or a quantile — and the optimiser's step size decides whether training converges at all. This chapter covers both, ending with the early stopping that protects the platform's neural networks from over-fitting.",
      tr: "Kayıp \"iyi\"nin ne demek olduğunu tanımlar; optimize edici onu sağlayan parametreleri bulur. Kayıp seçimi tahminin hangi istatistiği — ortalama, medyan ya da bir kantil — tahmin ettiğine karar verir; optimize edicinin adım boyu ise eğitimin yakınsayıp yakınsamayacağına. Bu bölüm ikisini de ele alır ve platformun sinir ağlarını aşırı öğrenmeden koruyan erken durdurmayla biter.",
    },
    objectives: [
      { en: "Relate squared, absolute and pinball loss to the mean, median and quantile they estimate.", tr: "Kare, mutlak ve pinball kaybını tahmin ettikleri ortalama, medyan ve kantille ilişkilendirmek." },
      { en: "Apply the gradient-descent update and explain the stability limit on the learning rate.", tr: "Gradyan inişi güncellemesini uygulamak ve öğrenme oranı üzerindeki kararlılık sınırını açıklamak." },
      { en: "Describe mini-batch training, Adam and early stopping as used for the LSTM and TFT.", tr: "LSTM ve TFT için kullanılan mini-batch eğitimi, Adam'ı ve erken durdurmayı tanımlamak." },
    ],
    sections: [
      {
        id: "loss",
        title: { en: "The loss decides what is forecast", tr: "Kayıp neyin tahmin edildiğine karar verir" },
        blocks: [
          {
            kind: "p",
            text: {
              en: "For a fixed distribution of outcomes $Y$, the constant guess $q$ that minimises the expected loss is a property of that distribution. Squared error is minimised by the **mean**, absolute error by the **median**, and the pinball loss with level $\\tau$ by the **τ-quantile** [@koenker1978;@gneiting2007]. Training a model with one of these losses therefore produces a forecast of that statistic, conditional on the features.",
              tr: "Sabit bir sonuç dağılımı $Y$ için beklenen kaybı en aza indiren sabit tahmin $q$, o dağılımın bir özelliğidir. Kare hata **ortalama**, mutlak hata **medyan**, $\\tau$ seviyeli pinball kaybı ise **τ-kantil** tarafından en aza indirilir [@koenker1978;@gneiting2007]. Bir modeli bu kayıplardan biriyle eğitmek, özelliklere koşullu olarak o istatistiğin tahminini üretir.",
            },
          },
          {
            kind: "eq",
            tex: "\\arg\\min_q \\mathbb E\\bigl[(Y-q)^2\\bigr] = \\mathbb E[Y], \\qquad \\arg\\min_q \\mathbb E\\,|Y-q| = \\operatorname{med}(Y), \\qquad \\arg\\min_q \\mathbb E\\,\\ell_\\tau(Y-q) = F_Y^{-1}(\\tau)",
            where: [
              { sym: "\\ell_\\tau(e)", def: { en: "pinball loss $\\max(\\tau e,\\,(\\tau-1)e)$, $e = y - q$", tr: "pinball kaybı $\\max(\\tau e,\\,(\\tau-1)e)$, $e = y - q$" } },
              { sym: "F_Y^{-1}(\\tau)", def: { en: "τ-quantile of the outcome distribution", tr: "sonuç dağılımının τ-kantili" } },
            ],
            source: "Koenker & Bassett (1978); Gneiting & Raftery (2007)",
          },
          {
            kind: "fig",
            fig: "loss-shapes",
            caption: {
              en: "Squared loss punishes large errors heavily and is pulled by outliers; absolute loss grows linearly; the pinball loss is a tilted V — with τ = 0.9 an under-forecast (e > 0) costs nine times more than an over-forecast of the same size.",
              tr: "Kare kayıp büyük hataları ağır cezalandırır ve aykırı değerlerden etkilenir; mutlak kayıp doğrusal büyür; pinball kaybı eğik bir V'dir — τ = 0,9'da eksik tahmin (e > 0), aynı büyüklükteki fazla tahminden dokuz kat pahalıdır.",
            },
          },
          {
            kind: "callout",
            tone: "note",
            title: { en: "Which loss for a wind farm?", tr: "Bir rüzgâr santrali için hangi kayıp?" },
            body: [
              {
                en: "If imbalance costs were symmetric and linear, the cost-optimal bid would be the median — an absolute-error forecast. If the two sides cost differently, the expected cost is minimised by bidding the quantile $\\tau = c_{\\text{long}}/(c_{\\text{short}}+c_{\\text{long}})$ of the output distribution — when being short is expensive, bid low [@pinson2013]. This is one reason the platform forecasts nine quantiles rather than one number.",
                tr: "Dengesizlik maliyetleri simetrik ve doğrusal olsaydı, maliyet açısından en iyi teklif medyan — bir mutlak hata tahmini — olurdu. İki tarafın bedeli farklıysa beklenen maliyet, üretim dağılımının $\\tau = c_{\\text{fazla}}/(c_{\\text{açık}}+c_{\\text{fazla}})$ kantilini teklif ederek en aza iner — açık kalmak pahalıysa düşük teklif verin [@pinson2013]. Platformun tek bir sayı yerine dokuz kantil tahmin etmesinin bir nedeni budur.",
              },
            ],
          },
        ],
      },
      {
        id: "descent",
        title: { en: "Gradient descent", tr: "Gradyan inişi" },
        blocks: [
          {
            kind: "p",
            text: {
              en: "For a model with millions of parameters there is no closed-form minimum. Gradient descent starts somewhere and repeatedly steps against the gradient — the direction of steepest increase of the loss. For neural networks the gradient of every weight is computed by back-propagation, the chain rule applied layer by layer [@rumelhart1986;@goodfellow2016].",
              tr: "Milyonlarca parametreli bir model için kapalı formda bir minimum yoktur. Gradyan inişi bir yerden başlar ve tekrar tekrar gradyanın — kaybın en dik artış yönünün — tersine adım atar. Sinir ağlarında her ağırlığın gradyanı geri yayılımla, yani zincir kuralının katman katman uygulanmasıyla hesaplanır [@rumelhart1986;@goodfellow2016].",
            },
          },
          {
            kind: "eq",
            tex: "\\theta_{k+1} \\;=\\; \\theta_k - \\eta\\,\\nabla_\\theta L(\\theta_k), \\qquad \\text{stable on a quadratic bowl if } \\; 0 < \\eta < \\frac{2}{\\lambda_{\\max}}",
            where: [
              { sym: "\\eta", def: { en: "learning rate (step size)", tr: "öğrenme oranı (adım boyu)" } },
              { sym: "\\nabla_\\theta L", def: { en: "gradient of the loss with respect to the parameters", tr: "kaybın parametrelere göre gradyanı" } },
              { sym: "\\lambda_{\\max}", def: { en: "largest curvature (eigenvalue of the Hessian)", tr: "en büyük eğrilik (Hessian'ın özdeğeri)" } },
            ],
            source: "Goodfellow, Bengio & Courville (2016), §4.3, §8.2",
          },
          {
            kind: "fig",
            fig: "descent-contour",
            caption: {
              en: "Gradient descent on a loss surface that is four times steeper along w₂ than along w₁ (curvature ≈ 2.8–3.5 vs 0.7). With η = 0.05 progress is slow; 0.2 converges; 0.5 zig-zags across the steep direction; above 2/λ_max ≈ 0.6 each step overshoots further and the parameters diverge. Adam rescales each direction by its own gradient history and handles the elongated valley without tuning.",
              tr: "w₂ boyunca w₁ boyuncakinden dört kat daha dik bir kayıp yüzeyinde gradyan inişi (eğrilik ≈ 2,8–3,5'e karşı 0,7). η = 0,05 ile ilerleme yavaştır; 0,2 yakınsar; 0,5 dik yön boyunca zikzak çizer; 2/λ_max ≈ 0,6'nın üstünde her adım daha fazla aşar ve parametreler ıraksar. Adam her yönü kendi gradyan geçmişiyle yeniden ölçekler ve uzamış vadiyi ayar gerektirmeden aşar.",
            },
          },
        ],
      },
      {
        id: "adam",
        title: { en: "Mini-batches and Adam", tr: "Mini-batch'ler ve Adam" },
        blocks: [
          {
            kind: "p",
            text: {
              en: "Computing the gradient over all of up to ≈ 17 000 training windows for every step is wasteful. **Mini-batch** gradient descent estimates it from a random batch (64 windows here); the noise of that estimate even helps escape shallow minima. One pass over all training data is an **epoch**. **Adam** keeps running averages of the gradient and of its square and divides one by the other, so every parameter gets its own effective step size [@kingma2015]:",
              tr: "Her adımda gradyanı ≈ 17 000'e varan eğitim penceresinin tamamı üzerinden hesaplamak savurganlıktır. **Mini-batch** gradyan inişi onu rastgele bir gruptan (burada 64 pencere) tahmin eder; bu tahminin gürültüsü sığ minimumlardan kaçmaya bile yardım eder. Tüm eğitim verisinin bir kez geçilmesine **epoch** denir. **Adam** gradyanın ve karesinin hareketli ortalamalarını tutar ve birini diğerine böler; böylece her parametre kendi etkin adım boyunu alır [@kingma2015]:",
            },
          },
          {
            kind: "eq",
            tex: "m_k = \\beta_1 m_{k-1} + (1-\\beta_1) g_k, \\qquad v_k = \\beta_2 v_{k-1} + (1-\\beta_2) g_k^2, \\qquad \\theta_{k+1} = \\theta_k - \\eta\\,\\frac{\\hat m_k}{\\sqrt{\\hat v_k} + \\epsilon}",
            where: [
              { sym: "g_k", def: { en: "mini-batch gradient at step k", tr: "k adımındaki mini-batch gradyanı" } },
              { sym: "\\hat m_k, \\hat v_k", def: { en: "bias-corrected averages, $m_k/(1-\\beta_1^k)$ and $v_k/(1-\\beta_2^k)$", tr: "yanlılığı düzeltilmiş ortalamalar, $m_k/(1-\\beta_1^k)$ ve $v_k/(1-\\beta_2^k)$" } },
              { sym: "\\beta_1, \\beta_2", def: { en: "decay rates, 0.9 and 0.999 by default", tr: "sönüm oranları, varsayılan 0,9 ve 0,999" } },
            ],
            source: "Kingma & Ba (2015)",
          },
        ],
      },
      {
        id: "early",
        title: { en: "Early stopping and dropout", tr: "Erken durdurma ve dropout" },
        blocks: [
          {
            kind: "p",
            text: {
              en: "A neural network with enough parameters will eventually memorise its training data. While training proceeds, the loss on held-out validation data first falls, then rises as the network starts to fit noise. **Early stopping** watches that validation loss and keeps the weights of its minimum, stopping once it has not improved for a set number of epochs (the *patience*) [@prechelt1998]. **Dropout** randomly switches off a fraction of the units in every training step, so no unit can rely on a particular partner — an effective regulariser for recurrent networks [@srivastava2014].",
              tr: "Yeterli parametresi olan bir sinir ağı sonunda eğitim verisini ezberler. Eğitim ilerlerken ayrılmış doğrulama verisindeki kayıp önce düşer, sonra ağ gürültüye uymaya başladıkça yükselir. **Erken durdurma** bu doğrulama kaybını izler, minimumundaki ağırlıkları saklar ve belirli sayıda epoch (*sabır*) boyunca iyileşmediğinde durur [@prechelt1998]. **Dropout** her eğitim adımında birimlerin bir kısmını rastgele kapatır; böylece hiçbir birim belirli bir ortağa güvenemez — yinelemeli ağlar için etkili bir düzenlileştirici [@srivastava2014].",
            },
          },
          {
            kind: "fig",
            fig: "learning-curve",
            caption: {
              en: "A small network (1–48–1, tanh, Adam) trained in your browser on 20 noisy samples of a farm-like power curve. Training loss keeps falling; validation loss on 300 unseen samples reaches its minimum and then rises. Early stopping keeps the green weights and ends training after the patience runs out. Shorten the patience to see training stop too early on a noisy plateau.",
              tr: "Tarayıcınızda, santral benzeri bir güç eğrisinin 20 gürültülü örneği üzerinde eğitilen küçük bir ağ (1–48–1, tanh, Adam). Eğitim kaybı düşmeye devam eder; 300 görülmemiş örnekteki doğrulama kaybı minimumuna ulaşır, sonra yükselir. Erken durdurma yeşil ağırlıkları saklar ve sabır tükenince eğitimi bitirir. Eğitimin gürültülü bir platoda erken durduğunu görmek için sabrı kısaltın.",
            },
          },
          {
            kind: "code",
            caption: {
              en: "Training settings of the LSTM on the real DK2 data (the TFT uses the same, with dropout 0.1). Early stopping watches the newest 20 % of each training block — never the test fold.",
              tr: "Gerçek DK2 verisinde LSTM'in eğitim ayarları (TFT aynısını, dropout 0,1 ile kullanır). Erken durdurma her eğitim bloğunun en yeni %20'sini izler — asla test katmanını değil.",
            },
            file: "backend/scripts/train_real_deep_models.py",
            symbol: "lstm_model.LSTMConfig",
            code: "LSTMConfig(\n    lookback=24,            # 24 hourly NWP rows per window\n    hidden_units=(64, 32),  # LSTM(64) → LSTM(32) → Dense(1)\n    dropout=0.2,\n    learning_rate=0.001,    # Adam\n    batch_size=64,\n    epochs=60,              # upper limit\n    patience=10,            # early stopping on the validation slice\n    mc_samples=1,           # point forecast; bands come from XGBoost / TFT\n    gap=48,                 # hours left out between train and test\n)",
          },
        ],
      },
    ],
    practice: {
      platform: [
        { en: "XGBoost minimises the pinball loss for nine levels τ = 0.1 … 0.9 at once (`objective=\"reg:quantileerror\"`); the LSTM minimises squared error; the TFT the sum of nine pinball losses.", tr: "XGBoost dokuz seviye τ = 0,1 … 0,9 için pinball kaybını aynı anda en aza indirir (`objective=\"reg:quantileerror\"`); LSTM kare hatayı; TFT dokuz pinball kaybının toplamını." },
        { en: "Both networks use Adam (η = 10⁻³), mini-batches of 64 windows, at most 60 epochs and early stopping with patience 10 on the newest 20 % of each training block.", tr: "İki ağ da Adam (η = 10⁻³), 64 pencerelik mini-batch'ler, en fazla 60 epoch ve her eğitim bloğunun en yeni %20'si üzerinde sabrı 10 olan erken durdurma kullanır." },
      ],
      files: ["backend/app/services/p4/lstm_model.py", "backend/app/services/p4/tft_model.py · _quantile_loss()", "backend/scripts/train_real_deep_models.py"],
      industry: [
        { en: "Adam and its variants train most deep networks in research and industry; early stopping and dropout are standard regularisers in every deep-learning framework [@goodfellow2016].", tr: "Adam ve türevleri araştırmada ve sektörde çoğu derin ağı eğitir; erken durdurma ve dropout her derin öğrenme çerçevesinde standart düzenlileştiricilerdir [@goodfellow2016]." },
        { en: "The pinball loss is the official score of probabilistic energy forecasting competitions such as GEFCom2014 [@hong2016].", tr: "Pinball kaybı, GEFCom2014 gibi olasılıksal enerji tahmini yarışmalarının resmî skorudur [@hong2016]." },
      ],
      solves: [
        { en: "Turns \"fit the data\" into a computable procedure that scales to millions of parameters.", tr: "\"Veriye uy\" ifadesini milyonlarca parametreye ölçeklenen hesaplanabilir bir yönteme dönüştürür." },
        { en: "The choice of loss aligns the model with the decision: mean, median or a cost-optimal quantile.", tr: "Kayıp seçimi modeli kararla hizalar: ortalama, medyan ya da maliyet açısından en iyi kantil." },
      ],
      limits: [
        { en: "Gradient descent finds a local minimum; results depend on initialisation and random seeds (the platform fixes seed 42).", tr: "Gradyan inişi yerel bir minimum bulur; sonuçlar başlangıç değerlerine ve rastgele tohumlara bağlıdır (platform tohumu 42'ye sabitler)." },
        { en: "Early stopping needs a validation slice that resembles the test period; a calm validation month can stop training at the wrong time.", tr: "Erken durdurma, test dönemine benzeyen bir doğrulama dilimi gerektirir; sakin bir doğrulama ayı eğitimi yanlış zamanda durdurabilir." },
      ],
    },
    takeaways: [
      { en: "Squared loss → mean, absolute → median, pinball τ → τ-quantile.", tr: "Kare kayıp → ortalama, mutlak → medyan, pinball τ → τ-kantil." },
      { en: "θ ← θ − η∇L; too large an η (above 2/λ_max) diverges, too small crawls; Adam adapts the step per parameter.", tr: "θ ← θ − η∇L; çok büyük η (2/λ_max üstü) ıraksar, çok küçük sürünür; Adam adımı parametre başına uyarlar." },
      { en: "Stop when the validation loss stops improving and keep the best weights.", tr: "Doğrulama kaybı iyileşmeyi bıraktığında durun ve en iyi ağırlıkları saklayın." },
    ],
    quiz: [
      {
        q: { en: "Being short costs 3 × more than being long. Which quantile should the bid be?", tr: "Açık kalmak, fazla kalmaktan 3 kat pahalı. Teklif hangi kantil olmalı?" },
        options: [
          { en: "P25", tr: "P25" },
          { en: "P50", tr: "P50" },
          { en: "P75", tr: "P75" },
        ],
        answer: 0,
        why: { en: "Expected cost c_short·E(q − Y)⁺ + c_long·E(Y − q)⁺ is minimal where F(q) = c_long/(c_short + c_long) = 1/(3 + 1) = 0.25: bid the 25th percentile, so that delivering less than sold is rare.", tr: "Beklenen maliyet c_açık·E(q − Y)⁺ + c_fazla·E(Y − q)⁺, F(q) = c_fazla/(c_açık + c_fazla) = 1/(3 + 1) = 0,25 olduğunda en küçüktür: satılandan az teslimatın nadir olması için 25. yüzdeliği teklif edin." },
      },
      {
        q: { en: "Training loss falls steadily, validation loss rises after epoch 40. What should you do?", tr: "Eğitim kaybı sürekli düşüyor, doğrulama kaybı 40. epoch'tan sonra yükseliyor. Ne yapmalısınız?" },
        options: [
          { en: "Train longer with a larger learning rate", tr: "Daha büyük öğrenme oranıyla daha uzun eğitin" },
          { en: "Keep the weights from about epoch 40 (early stopping)", tr: "Yaklaşık 40. epoch'taki ağırlıkları saklayın (erken durdurma)" },
          { en: "Evaluate on the training set instead", tr: "Bunun yerine eğitim setinde değerlendirin" },
        ],
        answer: 1,
        why: { en: "From epoch 40 the network fits noise; the weights at the validation minimum generalise best.", tr: "40. epoch'tan itibaren ağ gürültüye uyar; doğrulama minimumundaki ağırlıklar en iyi genellenir." },
      },
    ],
    concepts: ["loss", "gradient", "epoch", "earlystop", "dropout"],
  },

  // ───────────────────────────────────────────────────────────────── 6
  {
    id: "validation",
    n: 6,
    part: "learning",
    title: { en: "Validating a time-series model", tr: "Bir zaman serisi modelini doğrulamak" },
    lead: {
      en: "Cross-validation as taught for independent samples quietly fails on time series: neighbouring hours are nearly identical, so a shuffled test set is mostly a memory test. This chapter measures how strongly the DK2 output and its forecast errors depend on the past, shows the five time-ordered folds the platform actually uses, and quantifies on real data how optimistic shuffling would have been.",
      tr: "Bağımsız örnekler için öğretilen çapraz doğrulama zaman serilerinde sessizce başarısız olur: komşu saatler neredeyse aynıdır, bu yüzden karıştırılmış bir test seti çoğunlukla bir ezber testidir. Bu bölüm DK2 üretiminin ve tahmin hatalarının geçmişe ne kadar güçlü bağlı olduğunu ölçer, platformun gerçekten kullandığı zamana göre sıralı beş katmanı gösterir ve karıştırmanın ne kadar iyimser olacağını gerçek veri üzerinde sayıyla ortaya koyar.",
    },
    objectives: [
      { en: "Read an autocorrelation function and estimate the effective number of independent samples.", tr: "Bir otokorelasyon fonksiyonunu okumak ve bağımsız örneklerin etkin sayısını tahmin etmek." },
      { en: "Set up expanding-window cross-validation with a gap (TimeSeriesSplit).", tr: "Boşluklu genişleyen pencere çapraz doğrulaması (TimeSeriesSplit) kurmak." },
      { en: "Explain why shuffled K-fold is optimistic and by how much on the DK2 data.", tr: "Karıştırılmış K-fold'un neden iyimser olduğunu ve DK2 verisinde ne kadar iyimser olduğunu açıklamak." },
    ],
    sections: [
      {
        id: "dependence",
        title: { en: "Dependence in time", tr: "Zamandaki bağımlılık" },
        blocks: [
          {
            kind: "p",
            text: {
              en: "The autocorrelation $\\rho_k$ measures how strongly the series at time $t$ resembles itself at $t-k$. Weather systems take one to three days to pass the Baltic, so wind power is strongly autocorrelated: $\\rho_1$ = {acf1}, $\\rho_{24}$ = {acf24}. More important for validation, the **forecast errors** are autocorrelated too ($\\rho_1$ = {acf_err1}, $\\rho_{24}$ = {acf_err24}): when the NWP misplaces a front, the error persists for many hours [@pinson2013].",
              tr: "Otokorelasyon $\\rho_k$, serinin $t$ anında $t-k$ anındaki kendisine ne kadar benzediğini ölçer. Hava sistemlerinin Baltık'ı geçmesi bir ila üç gün sürer, bu yüzden rüzgâr gücü güçlü bir otokorelasyona sahiptir: $\\rho_1$ = {acf1}, $\\rho_{24}$ = {acf24}. Doğrulama için daha önemlisi **tahmin hataları** da otokorelelidir ($\\rho_1$ = {acf_err1}, $\\rho_{24}$ = {acf_err24}): NWP bir cepheyi yanlış konumlandırdığında hata saatlerce sürer [@pinson2013].",
            },
          },
          {
            kind: "fig",
            fig: "autocorrelation",
            caption: {
              en: "Autocorrelation of the measured DK2 output (bars) and of the XGBoost day-ahead error (line) over one week of lags. The output forgets slowly; the error decays faster but keeps a daily bump at 24 h. The shaded 48 h are the gap the platform leaves between training and test, where the error correlation is still ≈ {acf_err48}.",
              tr: "Ölçülen DK2 üretiminin (çubuklar) ve XGBoost gün öncesi hatasının (çizgi) bir haftalık gecikmeler boyunca otokorelasyonu. Üretim yavaş unutur; hata daha hızlı söner ama 24 saatte günlük bir tümsek korur. Taralı 48 saat, platformun eğitim ile test arasında bıraktığı boşluktur; burada hata korelasyonu hâlâ ≈ {acf_err48}'dir.",
            },
            source: { en: "{hours} hours of Energinet data [@energinet]; out-of-fold XGBoost errors on {scored_hours} test hours.", tr: "{hours} saatlik Energinet verisi [@energinet]; {scored_hours} test saatinde katman dışı XGBoost hataları." },
          },
          {
            kind: "p",
            text: {
              en: "Dependence also shrinks the information in a sample. For a series that behaves like a first-order autoregressive process, the variance of a mean is that of only $n_{\\text{eff}}$ independent values [@wilks2011]:",
              tr: "Bağımlılık bir örnekteki bilgiyi de küçültür. Birinci dereceden özbağlanımlı bir süreç gibi davranan bir seri için bir ortalamanın varyansı yalnızca $n_{\\text{eff}}$ bağımsız değerinkine eşittir [@wilks2011]:",
            },
          },
          {
            kind: "eq",
            tex: "n_{\\text{eff}} \\;\\approx\\; n\\,\\frac{1-\\rho_1}{1+\\rho_1}",
            where: [
              { sym: "n", def: { en: "number of hourly samples", tr: "saatlik örnek sayısı" } },
              { sym: "\\rho_1", def: { en: "lag-1 autocorrelation", tr: "1 gecikmeli otokorelasyon" } },
            ],
            source: "Wilks (2011), §5.2.4",
          },
          {
            kind: "p",
            text: {
              en: "With $\\rho_1$ = {acf1}, the {scored_hours} scored hours carry about as much information about the mean level as ≈ {n_eff} independent ones. Differences of a few tenths of a percentage point between forecasts should be read with that in mind — this is why the platform reports a score per fold.",
              tr: "$\\rho_1$ = {acf1} ile, puanlanan {scored_hours} saat ortalama seviye hakkında yaklaşık ≈ {n_eff} bağımsız saat kadar bilgi taşır. Tahminler arasındaki onda birkaç puanlık farklar bunu akılda tutarak okunmalıdır — platformun katman başına skor raporlamasının nedeni budur.",
            },
          },
        ],
      },
      {
        id: "tss",
        title: { en: "TimeSeriesSplit with a gap", tr: "Boşluklu TimeSeriesSplit" },
        blocks: [
          {
            kind: "p",
            text: {
              en: "Expanding-window cross-validation — \"evaluation on a rolling forecasting origin\" [@hyndman2021] — mimics operation: train on everything up to a point, forecast the next block, move the point forward. scikit-learn's `TimeSeriesSplit` cuts the series into $K+1$ blocks; fold $k$ trains on blocks $1 … k$ and tests on block $k+1$. A **gap** removes the hours between the two, so that the last training days do not share their weather with the first test days — the time-series counterpart of purging and embargo in finance [@lopezdeprado2018].",
              tr: "Genişleyen pencereli çapraz doğrulama — \"kayan bir tahmin başlangıcında değerlendirme\" [@hyndman2021] — işletmeyi taklit eder: bir noktaya kadar her şeyle eğit, sonraki bloğu tahmin et, noktayı ileri kaydır. scikit-learn'ün `TimeSeriesSplit` sınıfı seriyi $K+1$ bloğa böler; $k$ katmanı $1 … k$ bloklarında eğitir ve $k+1$ bloğunda test eder. Bir **boşluk** ikisi arasındaki saatleri çıkarır; böylece son eğitim günleri havalarını ilk test günleriyle paylaşmaz — finanstaki temizleme ve ambargonun zaman serisi karşılığı [@lopezdeprado2018].",
            },
          },
          {
            kind: "eq",
            tex: "\\mathcal T_k^{\\text{train}} = \\{1, \\dots, k\\,m\\},\\qquad \\mathcal T_k^{\\text{test}} = \\{k\\,m + g + 1, \\dots, (k+1)\\,m + g\\},\\qquad k = 1,\\dots,K",
            where: [
              { sym: "m", def: { en: "block length, ≈ n/(K+1) — here ≈ 3 400 h", tr: "blok uzunluğu, ≈ n/(K+1) — burada ≈ 3 400 sa" }, unit: "h" },
              { sym: "g", def: { en: "gap between training and test", tr: "eğitim ile test arasındaki boşluk" }, unit: "48 h" },
              { sym: "K", def: { en: "number of folds", tr: "katman sayısı" }, unit: "5" },
            ],
          },
          {
            kind: "fig",
            fig: "fold-timeline",
            caption: {
              en: "The five folds on the real calendar. The first fold trains on June–October 2024 only and is tested over winter; later folds have more data and see every season. As training grows the test nRMSE falls from {fold_max} % (fold 2) to {fold_last} % (fold 5) — part data volume, part season; over all test hours it is {xgb_nrmse} %.",
              tr: "Gerçek takvim üzerinde beş katman. İlk katman yalnızca Haziran–Ekim 2024 ile eğitilir ve kış boyunca test edilir; sonraki katmanlar daha fazla veriye sahiptir ve her mevsimi görür. Eğitim büyüdükçe test nRMSE'si %{fold_max}'ten (2. katman) %{fold_last}'e (5. katman) düşer — kısmen veri hacmi, kısmen mevsim; tüm test saatlerinde %{xgb_nrmse}'tür.",
            },
            source: { en: "`TimeSeriesSplit(n_splits=5, gap=48)` on the {hours} hours.", tr: "{hours} saat üzerinde `TimeSeriesSplit(n_splits=5, gap=48)`." },
          },
        ],
      },
      {
        id: "shuffle",
        title: { en: "What shuffling would have done", tr: "Karıştırma ne yapardı" },
        blocks: [
          {
            kind: "p",
            text: {
              en: "To make the effect concrete, the same model was validated both ways on the same rows. Shuffled 5-fold K-fold puts hours from the same storm into training and test; the model has effectively seen the test weather's error pattern, and the score improves without any real gain in skill [@bergmeir2012].",
              tr: "Etkiyi somutlaştırmak için aynı model aynı satırlar üzerinde iki şekilde doğrulandı. Karıştırılmış 5 katlı K-fold aynı fırtınadan saatleri hem eğitime hem teste koyar; model test havasının hata desenini fiilen görmüş olur ve skor, gerçek bir beceri kazancı olmadan iyileşir [@bergmeir2012].",
            },
          },
          {
            kind: "fig",
            fig: "shuffle-vs-time",
            caption: {
              en: "nRMSE of an XGBoost P50 estimated with time-ordered folds ({ts_nrmse} %) and with shuffled folds ({shuffled_nrmse} %). The shuffled number is not achievable in operation.",
              tr: "Bir XGBoost P50'nin zamana göre sıralı katmanlarla (%{ts_nrmse}) ve karıştırılmış katmanlarla (%{shuffled_nrmse}) tahmin edilen nRMSE'si. Karıştırılmış sayıya işletmede ulaşılamaz.",
            },
            source: { en: "computed for this course with `backend/scripts/build_academy_figures.py`.", tr: "bu kurs için `backend/scripts/build_academy_figures.py` ile hesaplandı." },
          },
          {
            kind: "callout",
            tone: "note",
            title: { en: "When is K-fold acceptable?", tr: "K-fold ne zaman kabul edilebilir?" },
            body: [
              {
                en: "Bergmeir, Hyndman and Koo showed that standard K-fold is valid for purely autoregressive models **if** the residuals are uncorrelated [@bergmeir2018]. Day-ahead wind errors are strongly correlated (Figure 6.1), so the condition fails here — time-ordered validation is the safe default for any forecast with weather inputs.",
                tr: "Bergmeir, Hyndman ve Koo, standart K-fold'un saf özbağlanımlı modeller için, artıklar **ilişkisizse** geçerli olduğunu gösterdi [@bergmeir2018]. Gün öncesi rüzgâr hataları güçlü biçimde ilişkilidir (Şekil 6.1); bu yüzden koşul burada sağlanmaz — hava girdili her tahmin için zamana göre sıralı doğrulama güvenli varsayılandır.",
              },
            ],
          },
        ],
      },
    ],
    practice: {
      platform: [
        { en: "All forecasts — XGBoost, LSTM, TFT, ensemble, baselines — are produced out of fold with `TimeSeriesSplit(n_splits=5, gap=48)` and scored on the same {scored_hours} hours.", tr: "Tüm tahminler — XGBoost, LSTM, TFT, topluluk, referanslar — `TimeSeriesSplit(n_splits=5, gap=48)` ile katman dışı üretilir ve aynı {scored_hours} saatte puanlanır." },
        { en: "The deep models use the same folds over their 24-hour windows, and scale each fold with its own training statistics; a regression test fails if a measured value enters the features.", tr: "Derin modeller 24 saatlik pencereleri üzerinde aynı katmanları kullanır ve her katmanı kendi eğitim istatistikleriyle ölçekler; ölçülmüş bir değer özelliklere girerse bir regresyon testi başarısız olur." },
      ],
      files: ["backend/app/services/p4/real_data.py · evaluate_real_dayahead()", "backend/scripts/train_real_deep_models.py"],
      industry: [
        { en: "Rolling-origin evaluation is the standard in forecasting practice and in benchmark studies of wind power forecasts [@hyndman2021;@messner2020].", tr: "Kayan başlangıçlı değerlendirme, tahmin pratiğinde ve rüzgâr gücü tahminlerinin kıyaslama çalışmalarında standarttır [@hyndman2021;@messner2020]." },
        { en: "Purged and embargoed cross-validation was formalised in quantitative finance, where leaking information across time costs real money [@lopezdeprado2018].", tr: "Temizlenmiş ve ambargolu çapraz doğrulama, zaman boyunca bilgi sızdırmanın gerçek paraya mal olduğu nicel finansta biçimselleştirildi [@lopezdeprado2018]." },
      ],
      solves: [
        { en: "Gives an error estimate that a forecast of the future can actually achieve.", tr: "Geleceğin tahmininin gerçekten ulaşabileceği bir hata tahmini verir." },
        { en: "Per-fold scores show how stable the method is across seasons and data volume.", tr: "Katman başına skorlar yöntemin mevsimler ve veri hacmi boyunca ne kadar kararlı olduğunu gösterir." },
      ],
      limits: [
        { en: "Early folds train on little data and one season, so their errors are pessimistic; averages over folds mix both effects.", tr: "İlk katmanlar az veri ve tek mevsimle eğitilir, bu yüzden hataları kötümserdir; katmanlar üzerinden ortalamalar iki etkiyi karıştırır." },
      ],
    },
    takeaways: [
      { en: "Wind power and its forecast errors are strongly autocorrelated; neighbouring hours are not independent samples.", tr: "Rüzgâr gücü ve tahmin hataları güçlü biçimde otokorelelidir; komşu saatler bağımsız örnekler değildir." },
      { en: "Validate with expanding windows and a gap; never shuffle a time series.", tr: "Genişleyen pencereler ve boşlukla doğrulayın; bir zaman serisini asla karıştırmayın." },
      { en: "On the DK2 data shuffling would report {shuffled_nrmse} % instead of the honest {ts_nrmse} %.", tr: "DK2 verisinde karıştırma, dürüst %{ts_nrmse} yerine %{shuffled_nrmse} raporlardı." },
    ],
    quiz: [
      {
        q: { en: "Why does the platform leave 48 hours out between each training and test block?", tr: "Platform neden her eğitim ve test bloğu arasında 48 saat bırakır?" },
        options: [
          { en: "To save computing time", tr: "Hesaplama süresinden tasarruf etmek için" },
          { en: "Because the weather — and the forecast error — of the last training hours persists into the first test hours", tr: "Çünkü son eğitim saatlerinin havası — ve tahmin hatası — ilk test saatlerine taşınır" },
          { en: "Because the NWP is issued every 48 hours", tr: "Çünkü NWP her 48 saatte bir yayımlanır" },
        ],
        answer: 1,
        why: { en: "Errors are still correlated at 24–48 h (Figure 6.1); the gap keeps the test hours from sharing a weather situation with training.", tr: "Hatalar 24–48 saatte hâlâ ilişkilidir (Şekil 6.1); boşluk test saatlerinin eğitimle aynı hava durumunu paylaşmasını önler." },
      },
      {
        q: { en: "A colleague reports 9 % nRMSE day-ahead with shuffled 10-fold CV. What is your first question?", tr: "Bir meslektaşınız karıştırılmış 10 katlı ÇD ile gün öncesi %9 nRMSE raporluyor. İlk sorunuz ne olur?" },
        options: [
          { en: "Which XGBoost version did you use?", tr: "Hangi XGBoost sürümünü kullandın?" },
          { en: "What is the error with time-ordered folds and a gap?", tr: "Zamana göre sıralı katmanlar ve boşlukla hata nedir?" },
          { en: "How many trees?", tr: "Kaç ağaç?" },
        ],
        answer: 1,
        why: { en: "Shuffled CV on autocorrelated data is optimistic; only a time-ordered estimate is comparable with operation.", tr: "Otokoreleli veride karıştırılmış ÇD iyimserdir; yalnızca zamana göre sıralı bir tahmin işletmeyle karşılaştırılabilir." },
      },
    ],
    concepts: ["tscv", "autocorrelation", "validation"],
  },

  // ───────────────────────────────────────────────────────────────── 7
  {
    id: "leakage",
    n: 7,
    part: "learning",
    title: { en: "Information at forecast time: data leakage", tr: "Tahmin anındaki bilgi: veri sızıntısı" },
    lead: {
      en: "The most dangerous error in forecasting does not show up as a bad score — it shows up as an excellent one. Leakage means that information the forecast could not have had at its issue time enters training or evaluation. This chapter defines the information set of a day-ahead bid, measures what a single leaky feature does on the real data, and tells the story of the leak this project found in its own code.",
      tr: "Tahmindeki en tehlikeli hata kötü bir skor olarak değil, mükemmel bir skor olarak ortaya çıkar. Sızıntı, tahminin yayımlandığı anda sahip olamayacağı bilginin eğitime ya da değerlendirmeye girmesidir. Bu bölüm bir gün öncesi teklifin bilgi kümesini tanımlar, tek bir sızıntılı özelliğin gerçek veride ne yaptığını ölçer ve bu projenin kendi kodunda bulduğu sızıntının hikâyesini anlatır.",
    },
    objectives: [
      { en: "Define the information set at the forecast origin for a day-ahead bid.", tr: "Bir gün öncesi teklif için tahmin başlangıcındaki bilgi kümesini tanımlamak." },
      { en: "Recognise target, temporal and preprocessing leakage, and \"as-issued\" versus reanalysed weather.", tr: "Hedef, zamansal ve ön işleme sızıntısını ve \"yayımlandığı gibi\" ile yeniden analiz edilmiş hava verisini ayırt etmek." },
      { en: "Audit a feature table with a short checklist.", tr: "Bir özellik tablosunu kısa bir kontrol listesiyle denetlemek." },
    ],
    sections: [
      {
        id: "origin",
        title: { en: "The information set at the forecast origin", tr: "Tahmin başlangıcındaki bilgi kümesi" },
        blocks: [
          {
            kind: "p",
            text: {
              en: "A forecast issued at time $t_0$ is a function of the information $\\mathcal F_{t_0}$ available then — nothing else. For the day-ahead market $t_0$ is 12:00 CET on D−1, and the target hours run from 00:00 to 24:00 on D. Leakage is any dependence of the forecast on information outside $\\mathcal F_{t_0}$ [@kaufman2012]:",
              tr: "$t_0$ anında yayımlanan bir tahmin, o anda mevcut olan $\\mathcal F_{t_0}$ bilgisinin bir fonksiyonudur — başka hiçbir şeyin değil. Gün öncesi piyasa için $t_0$, D−1 günü 12:00 CET'tir ve hedef saatler D günü 00:00'dan 24:00'e uzanır. Sızıntı, tahminin $\\mathcal F_{t_0}$ dışındaki bilgiye herhangi bir bağımlılığıdır [@kaufman2012]:",
            },
          },
          {
            kind: "eq",
            tex: "\\hat P(t \\mid t_0) \\;=\\; f\\bigl(\\mathcal F_{t_0}\\bigr), \\qquad t_0 = \\text{12:00 D−1}, \\quad t \\in [\\text{00:00 D},\\, \\text{24:00 D}) \\;\\Rightarrow\\; t - t_0 \\in [12, 36)\\,\\text{h}",
            where: [
              { sym: "\\mathcal F_{t_0}", def: { en: "everything known at the bid: NWP runs issued before $t_0$, measurements up to ≈ $t_0$", tr: "teklif anında bilinen her şey: $t_0$'dan önce yayımlanan NWP koşuları, ≈ $t_0$'a kadarki ölçümler" } },
            ],
          },
          {
            kind: "fig",
            fig: "info-timeline",
            caption: {
              en: "What a day-ahead bid can know. Measurements stop at the bid; the 00 UTC NWP run of D−1 is available by ≈ 07:00 and covers all of D. A feature that uses the measured wind during D — however natural it looks in a table — is leakage.",
              tr: "Bir gün öncesi teklifin bilebileceği. Ölçümler teklifte durur; D−1'in 00 UTC NWP koşusu ≈ 07:00'de mevcuttur ve D'nin tamamını kapsar. D sırasında ölçülen rüzgârı kullanan bir özellik — tabloda ne kadar doğal görünürse görünsün — sızıntıdır.",
            },
          },
          {
            kind: "callout",
            tone: "note",
            title: { en: "As-issued forecasts, not reanalysis", tr: "Yeniden analiz değil, yayımlandığı gibi tahminler" },
            body: [
              {
                en: "Weather archives are often **reanalyses** (e.g. ERA5): the past re-computed with all observations, including those at time $t$. Training a forecast on reanalysed wind leaks the observation of the target hour into the input. The platform uses the Open-Meteo *Previous Runs* archive — the forecasts **as they were issued** the day before [@openmeteo].",
                tr: "Hava arşivleri çoğunlukla **yeniden analizlerdir** (örn. ERA5): geçmiş, $t$ anındakiler dahil tüm gözlemlerle yeniden hesaplanmıştır. Bir tahmini yeniden analiz rüzgârıyla eğitmek, hedef saatin gözlemini girdiye sızdırır. Platform Open-Meteo *Previous Runs* arşivini kullanır — tahminleri bir gün önce **yayımlandıkları gibi** [@openmeteo].",
              },
            ],
          },
        ],
      },
      {
        id: "experiment",
        title: { en: "One leaky feature, measured", tr: "Tek bir sızıntılı özellik, ölçüldü" },
        blocks: [
          {
            kind: "p",
            text: {
              en: "Add a single column to the feature table — the power measured one hour before each target hour — and retrain the same XGBoost on the same folds. For the day-ahead bid this value does not exist: for most hours of D it lies in the future at 12:00 D−1. The score nevertheless improves dramatically, because power one hour earlier is almost the answer ($\\rho_1$ = {acf1}).",
              tr: "Özellik tablosuna tek bir sütun ekleyin — her hedef saatten bir saat önce ölçülen güç — ve aynı XGBoost'u aynı katmanlarda yeniden eğitin. Gün öncesi teklif için bu değer yoktur: D'nin çoğu saati için 12:00 D−1'de gelecektedir. Yine de skor çarpıcı biçimde iyileşir, çünkü bir saat önceki güç neredeyse cevabın kendisidir ($\\rho_1$ = {acf1}).",
            },
          },
          {
            kind: "fig",
            fig: "leak-experiment",
            caption: {
              en: "The leak halves the error, from {ts_nrmse} % to {leaky_nrmse} % — better than the TSO's professional forecast and impossible to deliver at the bid. A result that beats every benchmark by a wide margin is a reason to audit, not to celebrate.",
              tr: "Sızıntı hatayı yarıya indirir, %{ts_nrmse}'ten %{leaky_nrmse}'e — İSO'nun profesyonel tahmininden daha iyi ve teklifte sunulması imkânsız. Her referansı büyük farkla yenen bir sonuç kutlamak için değil, denetlemek için bir nedendir.",
            },
            source: { en: "same rows and folds as the Day-ahead tab; `build_academy_figures.py`.", tr: "Gün öncesi sekmesiyle aynı satırlar ve katmanlar; `build_academy_figures.py`." },
          },
          {
            kind: "callout",
            tone: "history",
            title: { en: "The leak this platform had", tr: "Bu platformun sahip olduğu sızıntı" },
            body: [
              {
                en: "An earlier version of P4 forecast 10-minute power from SCADA-style features. Its XGBoost reached a skill of **0.996** against persistence — almost perfect. The reason: the feature table contained the wind speed measured *at* the target time $t$, and power follows from that wind through the power curve. The \"forecast\" was a power-curve lookup with information from the future.",
                tr: "P4'ün daha eski bir sürümü 10 dakikalık gücü SCADA tarzı özelliklerden tahmin ediyordu. XGBoost'u kalıcılığa karşı **0,996** beceriye ulaştı — neredeyse kusursuz. Nedeni: özellik tablosu hedef zaman $t$'de ölçülen rüzgâr hızını içeriyordu ve güç bu rüzgârdan güç eğrisi üzerinden gelir. \"Tahmin\", gelecekten gelen bilgiyle bir güç eğrisi okumasıydı.",
              },
              {
                en: "The fix moved every measured channel to its last value before $t$ and kept only the NWP for $t$ itself; the skill fell to about 0.15 — lower, but honest — and a regression test now fails if the skill approaches 1 again (commit 80b4855, October 2026). The current day-ahead pipeline avoids the trap by construction: measured values are not features at all.",
                tr: "Düzeltme her ölçülen kanalı $t$'den önceki son değerine taşıdı ve $t$'nin kendisi için yalnızca NWP'yi bıraktı; beceri yaklaşık 0,15'e düştü — daha düşük ama dürüst — ve beceri yeniden 1'e yaklaşırsa artık bir regresyon testi başarısız olur (commit 80b4855, Ekim 2026). Mevcut gün öncesi hat tuzaktan yapısı gereği kaçınır: ölçülen değerler hiç özellik değildir.",
              },
            ],
          },
        ],
      },
      {
        id: "checklist",
        title: { en: "A leakage audit", tr: "Bir sızıntı denetimi" },
        blocks: [
          {
            kind: "p",
            text: {
              en: "Kaufman et al. classify leakage by where it enters [@kaufman2012]. For a wind power forecast, the questions below catch nearly all cases:",
              tr: "Kaufman ve arkadaşları sızıntıyı girdiği yere göre sınıflandırır [@kaufman2012]. Bir rüzgâr gücü tahmini için aşağıdaki sorular neredeyse tüm durumları yakalar:",
            },
          },
          {
            kind: "list",
            ordered: true,
            items: [
              { en: "**Timing** — for every feature: at 12:00 D−1, would I have this value for this target hour? Check issue times, not valid times.", tr: "**Zamanlama** — her özellik için: 12:00 D−1'de bu hedef saat için bu değere sahip olur muydum? Geçerlilik zamanlarını değil yayım zamanlarını kontrol edin." },
              { en: "**Timestamps** — are measurements hour-beginning or hour-ending, UTC or local time? A one-hour shift in the target is a leak or a handicap.", tr: "**Zaman damgaları** — ölçümler saat başı mı saat sonu mu, UTC mi yerel saat mi? Hedefteki bir saatlik kayma bir sızıntı ya da bir handikaptır." },
              { en: "**Revised data** — are weather inputs as issued, or reanalysed with later observations?", tr: "**Revize veri** — hava girdileri yayımlandığı gibi mi, yoksa sonraki gözlemlerle yeniden analiz edilmiş mi?" },
              { en: "**Preprocessing** — are scalers, imputers, power-curve bins and climatology fitted on training data only?", tr: "**Ön işleme** — ölçekleyiciler, eksik değer doldurucular, güç eğrisi dilimleri ve klimatoloji yalnızca eğitim verisinde mi uydurulmuş?" },
              { en: "**Validation** — time-ordered folds with a gap; no tuning on the test folds.", tr: "**Doğrulama** — boşluklu, zamana göre sıralı katmanlar; test katmanlarında ayar yok." },
              { en: "**Benchmarks** — is a reference issued later than the bid? Energinet's day-ahead forecast is issued ≈ 17:50 D−1, after the gate, so it is a slightly favoured benchmark.", tr: "**Referanslar** — bir referans tekliften sonra mı yayımlanıyor? Energinet'in gün öncesi tahmini ≈ 17:50 D−1'de, kapıdan sonra yayımlanır; bu yüzden hafifçe avantajlı bir referanstır." },
              { en: "**Plausibility** — compare with the literature: day-ahead nRMSE for a single farm is typically 10–20 % [@giebel2011]. Far below that, look for a leak.", tr: "**Akla yatkınlık** — literatürle karşılaştırın: tek bir santral için gün öncesi nRMSE tipik olarak %10–20'dir [@giebel2011]. Çok altındaysa bir sızıntı arayın." },
            ],
          },
        ],
      },
    ],
    practice: {
      platform: [
        { en: "The day-ahead features are only NWP issued the day before (lead 24–47 h), hour of day and NWP spread; measured power and wind are never inputs. Persistence is a reference, not a feature.", tr: "Gün öncesi özellikler yalnızca bir gün önce yayımlanan NWP (öncü süre 24–47 sa), günün saati ve NWP yayılımıdır; ölçülen güç ve rüzgâr asla girdi değildir. Kalıcılık bir özellik değil, bir referanstır." },
        { en: "Scalers, power-curve bins, climatology and the TSO rescaling are fitted per training block; the conformal margin uses the newest 20 % of training, never test hours.", tr: "Ölçekleyiciler, güç eğrisi dilimleri, klimatoloji ve İSO yeniden ölçeklemesi eğitim bloğu başına uydurulur; konformal pay eğitimin en yeni %20'sini kullanır, asla test saatlerini değil." },
      ],
      files: ["backend/app/services/p4/real_data.py", "backend/scripts/fetch_real_forecast_data.py", "backend/tests/test_p4_real_data.py"],
      industry: [
        { en: "Leakage is among the most common causes of models that look good in development and fail in production; it was documented across competitions and industry projects by Kaufman et al. [@kaufman2012].", tr: "Sızıntı, geliştirmede iyi görünüp üretimde başarısız olan modellerin en yaygın nedenleri arasındadır; Kaufman ve arkadaşları tarafından yarışmalarda ve sektör projelerinde belgelenmiştir [@kaufman2012]." },
        { en: "Forecast tenders specify the issue time and the data a vendor may use, precisely to prevent this [@iea2022].", tr: "Tahmin ihaleleri, tam da bunu önlemek için yayım zamanını ve bir sağlayıcının kullanabileceği veriyi belirtir [@iea2022]." },
      ],
      solves: [
        { en: "Keeps reported skill equal to the skill the forecast will deliver in operation.", tr: "Raporlanan beceriyi tahminin işletmede sağlayacağı beceriye eşit tutar." },
      ],
      limits: [
        { en: "No test can prove the absence of leakage; it takes an explicit information-set argument for every feature, reviewed whenever the pipeline changes.", tr: "Hiçbir test sızıntının yokluğunu kanıtlayamaz; her özellik için açık bir bilgi kümesi gerekçesi gerekir ve hat her değiştiğinde gözden geçirilmelidir." },
      ],
    },
    takeaways: [
      { en: "A forecast may depend only on the information available at its issue time — for the day-ahead bid, 12:00 D−1.", tr: "Bir tahmin yalnızca yayımlandığı anda mevcut bilgiye bağlı olabilir — gün öncesi teklif için 12:00 D−1." },
      { en: "One leaky column halves the DK2 error on paper; in operation it does not exist.", tr: "Tek bir sızıntılı sütun DK2 hatasını kâğıt üzerinde yarıya indirir; işletmede ise yoktur." },
      { en: "Too good to be true usually is: audit timing, timestamps, revised data, preprocessing and benchmarks.", tr: "Gerçek olamayacak kadar iyi olan genellikle gerçek değildir: zamanlamayı, zaman damgalarını, revize veriyi, ön işlemeyi ve referansları denetleyin." },
    ],
    quiz: [
      {
        q: { en: "Which of these features is legitimate for the day-ahead bid for 18:00 on day D?", tr: "D günü 18:00 için gün öncesi teklifte bu özelliklerden hangisi meşrudur?" },
        options: [
          { en: "ERA5 reanalysis wind at 18:00 on D", tr: "D günü 18:00'de ERA5 yeniden analiz rüzgârı" },
          { en: "ICON wind for 18:00 on D from the run issued on D−1 morning", tr: "D−1 sabahı yayımlanan koşudan D günü 18:00 için ICON rüzgârı" },
          { en: "Measured farm power at 17:00 on D", tr: "D günü 17:00'de ölçülen santral gücü" },
        ],
        answer: 1,
        why: { en: "Only the NWP run issued before 12:00 D−1 is in the information set; reanalysis and measurements during D are not.", tr: "Bilgi kümesinde yalnızca 12:00 D−1'den önce yayımlanan NWP koşusu vardır; D sırasındaki yeniden analiz ve ölçümler yoktur." },
      },
      {
        q: { en: "A min–max scaler is fitted on the full data set before cross-validation. Is that leakage?", tr: "Çapraz doğrulamadan önce tüm veri setinde bir min–maks ölçekleyici uyduruluyor. Bu sızıntı mıdır?" },
        options: [
          { en: "No, scaling does not change the information", tr: "Hayır, ölçekleme bilgiyi değiştirmez" },
          { en: "Yes — the test period's extremes leak into training", tr: "Evet — test döneminin uç değerleri eğitime sızar" },
          { en: "Only for tree models", tr: "Yalnızca ağaç modelleri için" },
        ],
        answer: 1,
        why: { en: "The scaler encodes the minimum and maximum of future data; fit it on each training block only.", tr: "Ölçekleyici gelecekteki verinin minimum ve maksimumunu kodlar; onu yalnızca her eğitim bloğunda uydurun." },
      },
    ],
    concepts: ["leakage", "origin", "nwp"],
  },
];
