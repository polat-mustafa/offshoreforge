/**
 * Part V — in operation: the pipeline end to end, what running it for SB-510 would take,
 * monitoring and drift, and where the field is going.
 */

import type { Chapter } from "./types";

export const PART5: Chapter[] = [
  // ───────────────────────────────────────────────────────────────── 14
  {
    id: "operation",
    n: 14,
    part: "operation",
    title: { en: "From model to control room: the pipeline and SB-510", tr: "Modelden kontrol odasına: hat ve SB-510" },
    lead: {
      en: "A forecast creates value only when it arrives on time, every day, with known quality. This closing chapter follows the platform's pipeline from raw data to the Day-ahead tab, lays out what it would take to run it for SB-510 — data, timing, people — and explains how a forecasting system is monitored once it is live. It ends with the developments most likely to change the field in the coming years.",
      tr: "Bir tahmin ancak her gün, zamanında ve bilinen bir kaliteyle geldiğinde değer yaratır. Bu kapanış bölümü platformun hattını ham veriden Gün öncesi sekmesine kadar izler, onu SB-510 için çalıştırmanın neler gerektireceğini — veri, zamanlama, insanlar — ortaya koyar ve bir tahmin sisteminin canlıya alındıktan sonra nasıl izlendiğini açıklar. Önümüzdeki yıllarda alanı en çok değiştirmesi muhtemel gelişmelerle biter.",
    },
    objectives: [
      { en: "Trace every stage of the platform's forecasting pipeline to the code that implements it.", tr: "Platformun tahmin hattının her aşamasını onu uygulayan koda kadar izlemek." },
      { en: "List the data and the daily schedule a forecasting desk for SB-510 would need.", tr: "SB-510 için bir tahmin masasının ihtiyaç duyacağı veriyi ve günlük programı sıralamak." },
      { en: "Define what to monitor in operation and when to retrain.", tr: "İşletmede neyin izleneceğini ve ne zaman yeniden eğitileceğini tanımlamak." },
    ],
    sections: [
      {
        id: "pipeline",
        title: { en: "The pipeline end to end", tr: "Uçtan uca hat" },
        blocks: [
          {
            kind: "p",
            text: {
              en: "The pipeline has an offline part, run once when data are refreshed, and an online part, run on the server when the Day-ahead tab is first opened. Offline, measured output and as-issued NWP are fetched and stored as one hourly file; the LSTM and TFT, too slow to train on request, are trained on the same folds and their out-of-fold forecasts stored. Online, XGBoost is trained per fold, the band is calibrated, the ensemble is formed, physics is enforced and every forecast is scored on the same hours; the result is cached for a week.",
              tr: "Hattın, veri yenilendiğinde bir kez çalışan çevrimdışı bir kısmı ve Gün öncesi sekmesi ilk açıldığında sunucuda çalışan çevrimiçi bir kısmı vardır. Çevrimdışı olarak ölçülen üretim ve yayımlandığı gibi NWP indirilir ve tek bir saatlik dosyada saklanır; istek üzerine eğitilemeyecek kadar yavaş olan LSTM ve TFT aynı katmanlarda eğitilir ve katman dışı tahminleri saklanır. Çevrimiçi olarak XGBoost her katmanda eğitilir, bant kalibre edilir, topluluk oluşturulur, fizik uygulanır ve her tahmin aynı saatlerde puanlanır; sonuç bir hafta önbellekte tutulur.",
            },
          },
          {
            kind: "fig",
            fig: "pipeline",
            caption: {
              en: "The forecasting pipeline of this platform with the files that implement each stage. Everything you have met in this course appears here: as-issued NWP (chapter 2), causal features (4, 7), time-ordered folds with a gap (6), quantile XGBoost (8), LSTM and TFT (9, 10), conformal band (11), scores (12), ensemble, SHAP and physics (13).",
              tr: "Bu platformun tahmin hattı ve her aşamayı uygulayan dosyalar. Bu kursta karşılaştığınız her şey burada yer alır: yayımlandığı gibi NWP (bölüm 2), nedensel özellikler (4, 7), boşluklu zamana göre sıralı katmanlar (6), kantil XGBoost (8), LSTM ve TFT (9, 10), konformal bant (11), skorlar (12), topluluk, SHAP ve fizik (13).",
            },
          },
          {
            kind: "callout",
            tone: "note",
            title: { en: "Reproducibility", tr: "Yeniden üretilebilirlik" },
            body: [
              {
                en: "Data files are bundled, random seeds are fixed (42) and dependencies are pinned, so the same request always returns the same numbers. The figures of this course are generated from the same evaluation by `backend/scripts/build_academy_figures.py`; regenerating them after a data refresh keeps text, figures and the Day-ahead tab consistent.",
                tr: "Veri dosyaları pakettedir, rastgele tohumlar sabittir (42) ve bağımlılıklar sabitlenmiştir; bu yüzden aynı istek her zaman aynı sayıları döndürür. Bu kursun şekilleri aynı değerlendirmeden `backend/scripts/build_academy_figures.py` ile üretilir; veri yenilendikten sonra onları yeniden üretmek metni, şekilleri ve Gün öncesi sekmesini tutarlı tutar.",
              },
            ],
          },
        ],
      },
      {
        id: "sb510",
        title: { en: "Running it for SB-510", tr: "SB-510 için çalıştırmak" },
        blocks: [
          {
            kind: "p",
            text: {
              en: "SB-510 does not exist yet, so the method is trained on Danish farms. Once the farm operates, the same pipeline would run on its own metering — but an operational system needs more inputs than this demonstration, and it must deliver on a fixed schedule [@iea2022].",
              tr: "SB-510 henüz mevcut değildir; bu yüzden yöntem Danimarka santralleriyle eğitilir. Santral işletmeye girdiğinde aynı hat kendi ölçümleri üzerinde çalışır — ama operasyonel bir sistem bu gösterimden daha fazla girdiye ihtiyaç duyar ve sabit bir programla teslim etmek zorundadır [@iea2022].",
            },
          },
          {
            kind: "table",
            caption: { en: "Inputs an operational SB-510 forecast would add to the platform's demonstration.", tr: "Operasyonel bir SB-510 tahmininin platformun gösterimine ekleyeceği girdiler." },
            head: [
              { en: "Input", tr: "Girdi" },
              { en: "Source", tr: "Kaynak" },
              { en: "Why", tr: "Neden" },
            ],
            rows: [
              [
                { en: "Metered output per hour / 15 min", tr: "Saatlik / 15 dk'lık ölçülen üretim" },
                { en: "settlement metering at the PSE connection point", tr: "PSE bağlantı noktasındaki uzlaştırma ölçümü" },
                { en: "the target; 15-min resolution for settlement", tr: "hedef; uzlaştırma için 15 dk çözünürlük" },
              ],
              [
                { en: "Turbine availability", tr: "Türbin kullanılabilirliği" },
                { en: "SCADA, maintenance plan", tr: "SCADA, bakım planı" },
                { en: "scale the forecast to turbines in service", tr: "tahmini hizmetteki türbinlere ölçeklemek" },
              ],
              [
                { en: "Curtailment and set-points", tr: "Kısıntı ve ayar noktaları" },
                { en: "PSE dispatch orders", tr: "PSE sevk talimatları" },
                { en: "remove curtailed hours from training; cap the forecast", tr: "kısılan saatleri eğitimden çıkarmak; tahmini sınırlamak" },
              ],
              [
                { en: "NWP at hub height (150 m)", tr: "Göbek yüksekliğinde NWP (150 m)" },
                { en: "ECMWF, ICON, regional models; ensembles", tr: "ECMWF, ICON, bölgesel modeller; topluluklar" },
                { en: "the IEA 15 MW hub is 50 m above the 100 m fields used here", tr: "IEA 15 MW göbeği burada kullanılan 100 m alanlarının 50 m üstündedir" },
              ],
              [
                { en: "Met mast / lidar, buoy", tr: "Meteoroloji direği / lidar, şamandıra" },
                { en: "on site", tr: "sahada" },
                { en: "intraday updates and verification of the NWP", tr: "gün içi güncellemeler ve NWP'nin doğrulanması" },
              ],
            ],
          },
          {
            kind: "fig",
            fig: "ops-cycle",
            caption: {
              en: "One operating day of a forecasting desk for SB-510. The 00 UTC NWP arrives in the morning, the day-ahead run and the bid follow before the 12:00 gate; the 12 UTC run feeds intraday updates; SCADA availability and PSE curtailment orders are applied continuously; yesterday's errors and drift indicators are reviewed daily.",
              tr: "SB-510 için bir tahmin masasının bir işletme günü. 00 UTC NWP sabah gelir, gün öncesi koşu ve teklif 12:00 kapısından önce gelir; 12 UTC koşusu gün içi güncellemeleri besler; SCADA kullanılabilirliği ve PSE kısıntı talimatları sürekli uygulanır; dünkü hatalar ve kayma göstergeleri her gün gözden geçirilir.",
            },
          },
        ],
      },
      {
        id: "monitoring",
        title: { en: "Monitoring, drift and retraining", tr: "İzleme, kayma ve yeniden eğitim" },
        blocks: [
          {
            kind: "p",
            text: {
              en: "A model is trained on the past and used on a future that keeps changing: weather models are upgraded, turbines age or are repowered, curtailment rules change. This **concept drift** degrades a model silently unless it is monitored [@gama2014]. Machine-learning systems also accumulate \"hidden technical debt\" — data dependencies, feedback loops, configuration — that costs more than the model itself if left unmanaged [@sculley2015].",
              tr: "Bir model geçmişte eğitilir ve sürekli değişen bir gelecekte kullanılır: hava modelleri güncellenir, türbinler yaşlanır ya da yenilenir, kısıntı kuralları değişir. Bu **kavram kayması**, izlenmezse bir modeli sessizce bozar [@gama2014]. Makine öğrenmesi sistemleri ayrıca \"gizli teknik borç\" — veri bağımlılıkları, geri besleme döngüleri, yapılandırma — biriktirir; yönetilmezse modelin kendisinden daha pahalıya mal olur [@sculley2015].",
            },
          },
          {
            kind: "fig",
            fig: "fold-trend",
            caption: {
              en: "nRMSE of four forecasts in each test fold, in time order. All forecasts move together with the season and the difficulty of the weather; the gaps between them are more stable than their levels. In operation the same plot, updated monthly, is the first drift indicator: a model that drifts away from the others needs attention.",
              tr: "Her test katmanında dört tahminin nRMSE'si, zaman sırasıyla. Tüm tahminler mevsim ve havanın zorluğuyla birlikte hareket eder; aralarındaki farklar seviyelerinden daha kararlıdır. İşletmede aylık güncellenen aynı grafik ilk kayma göstergesidir: diğerlerinden uzaklaşan bir model ilgi gerektirir.",
            },
          },
          {
            kind: "list",
            items: [
              { en: "**Bias per month and per wind bin** — a systematic shift means a changed farm or a changed NWP.", tr: "**Ay ve rüzgâr dilimi başına sapma** — sistematik bir kayma, değişmiş bir santral ya da değişmiş bir NWP demektir." },
              { en: "**Coverage of P10–P90** — should stay near 80 %; re-estimate the conformal margin if it does not.", tr: "**P10–P90 kapsaması** — %80 civarında kalmalıdır; kalmıyorsa konformal payı yeniden tahmin edin." },
              { en: "**Skill against the TSO and persistence** — relative scores are robust to a hard month.", tr: "**İSO'ya ve kalıcılığa karşı beceri** — göreli skorlar zor bir aya karşı sağlamdır." },
              { en: "**Input checks** — missing or frozen NWP fields, timestamp shifts, unit changes.", tr: "**Girdi kontrolleri** — eksik ya da donmuş NWP alanları, zaman damgası kaymaları, birim değişiklikleri." },
              { en: "**Retraining** — on a schedule (e.g. monthly, expanding window) and after known changes; validate the new model on the latest months before switching.", tr: "**Yeniden eğitim** — bir programa göre (örn. aylık, genişleyen pencere) ve bilinen değişikliklerden sonra; geçiş yapmadan önce yeni modeli son aylarda doğrulayın." },
            ],
          },
        ],
      },
      {
        id: "future",
        title: { en: "Where the field is going", tr: "Alan nereye gidiyor" },
        blocks: [
          {
            kind: "p",
            text: {
              en: "Three developments stand out [@sweeney2020]. **Machine-learned weather models** such as GraphCast now match or beat physics-based NWP at medium range at a fraction of the cost [@lam2023], and their ensembles will give cheaper uncertainty information. **Probabilistic and value-oriented forecasting** trains models on the cost of the decision rather than on RMSE. **Spatio-temporal models** learn many farms and grid points jointly — the setting where architectures like the TFT are expected to beat tree ensembles.",
              tr: "Üç gelişme öne çıkar [@sweeney2020]. GraphCast gibi **makine öğrenmeli hava modelleri** artık orta vadede fizik tabanlı NWP'ye maliyetin çok küçük bir kısmıyla eşit ya da üstün geliyor [@lam2023] ve toplulukları daha ucuz belirsizlik bilgisi verecek. **Olasılıksal ve değer odaklı tahmin**, modelleri RMSE yerine kararın maliyeti üzerinde eğitir. **Uzay-zamansal modeller** birçok santrali ve ızgara noktasını birlikte öğrenir — TFT gibi mimarilerin ağaç topluluklarını yenmesinin beklendiği ortam.",
            },
          },
          {
            kind: "p",
            text: {
              en: "None of this changes the foundations of this course: use only information available at the forecast origin, validate in time order, report probabilistic forecasts with proper scores against honest references, explain what the model does, and let physics have the last word.",
              tr: "Bunların hiçbiri bu kursun temellerini değiştirmez: yalnızca tahmin başlangıcında mevcut bilgiyi kullanın, zaman sırasıyla doğrulayın, olasılıksal tahminleri dürüst referanslara karşı uygun skorlarla raporlayın, modelin ne yaptığını açıklayın ve son sözü fiziğe bırakın.",
            },
          },
        ],
      },
    ],
    practice: {
      platform: [
        { en: "Offline: `fetch_real_forecast_data.py`, `train_real_deep_models.py`, `build_academy_figures.py`. Online: `evaluate_real_dayahead()` behind `GET /api/v1/forecast/real-data/day-ahead`, cached in Redis for 7 days.", tr: "Çevrimdışı: `fetch_real_forecast_data.py`, `train_real_deep_models.py`, `build_academy_figures.py`. Çevrimiçi: `GET /api/v1/forecast/real-data/day-ahead` arkasında `evaluate_real_dayahead()`, Redis'te 7 gün önbellekte." },
        { en: "Per-fold scores on the Day-ahead tab are the platform's drift view: fold 5 ({fold_last} %) is the best, trained on the most data.", tr: "Gün öncesi sekmesindeki katman başına skorlar platformun kayma görünümüdür: en çok veriyle eğitilen 5. katman (%{fold_last}) en iyisidir." },
      ],
      files: ["backend/app/routers/p4/real_data.py", "backend/app/services/p4/real_data.py", "backend/scripts/build_academy_figures.py"],
      industry: [
        { en: "Operational forecasting services run exactly this loop — ingest, forecast, deliver, verify, retrain — with service-level agreements on delivery time and accuracy [@iea2022].", tr: "Operasyonel tahmin hizmetleri tam olarak bu döngüyü — al, tahmin et, teslim et, doğrula, yeniden eğit — teslim süresi ve doğruluk için hizmet düzeyi anlaşmalarıyla çalıştırır [@iea2022]." },
        { en: "MLOps practice — versioned data and models, monitoring, automated retraining — comes from large-scale ML systems in industry [@sculley2015].", tr: "MLOps pratiği — sürümlenmiş veri ve modeller, izleme, otomatik yeniden eğitim — sektördeki büyük ölçekli ML sistemlerinden gelir [@sculley2015]." },
      ],
      solves: [
        { en: "Turns a good model into a dependable service: on time, monitored, reproducible.", tr: "İyi bir modeli güvenilir bir hizmete dönüştürür: zamanında, izlenen, yeniden üretilebilir." },
      ],
      limits: [
        { en: "The demonstration has no availability, curtailment or hub-height data; its numbers are for Danish farms, not for SB-510.", tr: "Gösterimde kullanılabilirlik, kısıntı ya da göbek yüksekliği verisi yoktur; sayıları SB-510 için değil Danimarka santralleri içindir." },
      ],
    },
    takeaways: [
      { en: "Offline data and deep-model training, online XGBoost, calibration, ensemble, physics and scoring — every stage is traceable to code.", tr: "Çevrimdışı veri ve derin model eğitimi, çevrimiçi XGBoost, kalibrasyon, topluluk, fizik ve puanlama — her aşama koda kadar izlenebilir." },
      { en: "SB-510 in operation needs availability, curtailment, hub-height NWP and a daily schedule ending at the 12:00 gate.", tr: "İşletmedeki SB-510; kullanılabilirlik, kısıntı, göbek yüksekliğinde NWP ve 12:00 kapısında biten bir günlük program gerektirir." },
      { en: "Monitor bias, coverage and skill; retrain on a schedule and after known changes.", tr: "Sapmayı, kapsamayı ve beceriyi izleyin; bir programa göre ve bilinen değişikliklerden sonra yeniden eğitin." },
    ],
    quiz: [
      {
        q: { en: "The P10–P90 coverage drops from 82 % to 68 % over three months while nRMSE is stable. What do you do first?", tr: "nRMSE sabitken P10–P90 kapsaması üç ayda %82'den %68'e düşüyor. İlk ne yaparsınız?" },
        options: [
          { en: "Nothing, nRMSE is fine", tr: "Hiçbir şey, nRMSE iyi" },
          { en: "Re-estimate the conformal margin on recent data and check for input changes", tr: "Konformal payı son veride yeniden tahmin edin ve girdi değişikliklerini kontrol edin" },
          { en: "Replace XGBoost with a neural network", tr: "XGBoost'u bir sinir ağıyla değiştirin" },
        ],
        answer: 1,
        why: { en: "The point forecast is fine but the band no longer reflects the uncertainty — a calibration drift.", tr: "Nokta tahmini iyi ama bant artık belirsizliği yansıtmıyor — bir kalibrasyon kayması." },
      },
      {
        q: { en: "Why would SB-510 need NWP at 150 m rather than the 100 m fields used here?", tr: "SB-510 neden burada kullanılan 100 m alanları yerine 150 m'de NWP'ye ihtiyaç duyar?" },
        options: [
          { en: "Because the IEA 15 MW hub is at 150 m and wind increases with height", tr: "Çünkü IEA 15 MW göbeği 150 m'dedir ve rüzgâr yükseklikle artar" },
          { en: "Because 100 m data are not available for the Baltic", tr: "Çünkü Baltık için 100 m verisi yoktur" },
          { en: "It would not; height does not matter offshore", tr: "Gerekmez; açık denizde yükseklik önemli değildir" },
        ],
        answer: 0,
        why: { en: "Wind shear makes hub-height wind differ from 100 m wind; a learned model can partly absorb it, but hub-height inputs are better.", tr: "Rüzgâr kesmesi göbek yüksekliğindeki rüzgârı 100 m rüzgârından farklı kılar; öğrenilen bir model bunu kısmen soğurabilir, ama göbek yüksekliği girdileri daha iyidir." },
      },
    ],
    concepts: ["pipeline", "drift"],
  },
];
