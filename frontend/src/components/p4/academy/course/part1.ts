/**
 * Part I — the forecasting problem: why the grid needs wind forecasts, where their skill
 * comes from, and what any forecast must beat.
 */

import type { Chapter } from "./types";

export const PART1: Chapter[] = [
  // ───────────────────────────────────────────────────────────────── 1
  {
    id: "why",
    n: 1,
    part: "problem",
    title: { en: "Why forecast wind power?", tr: "Rüzgâr gücü neden tahmin edilir?" },
    lead: {
      en: "An electricity system has almost no storage: every second, generation must equal consumption plus losses, or the frequency leaves 50 Hz. A wind farm cannot choose its fuel, so the only way it can take part in this balance is to say in advance how much it will produce. This chapter explains who needs that number, when it is needed, and what an error costs — using one real week of the Danish Baltic farms the platform is trained on.",
      tr: "Bir elektrik sisteminde neredeyse hiç depolama yoktur: her saniye üretim, tüketim artı kayıplara eşit olmalıdır; aksi hâlde frekans 50 Hz'den sapar. Bir rüzgâr santrali yakıtını seçemez; bu dengeye katılmasının tek yolu ne kadar üreteceğini önceden söylemektir. Bu bölüm, bu sayıya kimin, ne zaman ihtiyaç duyduğunu ve bir hatanın neye mal olduğunu, platformun eğitildiği Danimarka Baltık santrallerinden gerçek bir hafta üzerinden açıklar.",
    },
    objectives: [
      { en: "Explain the role of a wind power forecast in day-ahead trading, intraday trading and real-time balancing.", tr: "Rüzgâr gücü tahmininin gün öncesi ticaret, gün içi ticaret ve gerçek zamanlı dengelemedeki rolünü açıklamak." },
      { en: "Place the forecast on the market timeline: what is decided at 12:00 on day D−1 and what is settled after delivery.", tr: "Tahmini piyasa zaman çizelgesine yerleştirmek: D−1 günü 12:00'de neyin kararlaştırıldığını ve teslimattan sonra neyin uzlaştırıldığını." },
      { en: "Estimate the imbalance energy and its cost from a forecast and the measured output.", tr: "Bir tahmin ve ölçülen üretimden dengesizlik enerjisini ve maliyetini hesaplamak." },
      { en: "Name the forecast users — TSO, balance-responsible party, plant operator — and what each one needs.", tr: "Tahmin kullanıcılarını — İSO, dengeden sorumlu taraf, santral işletmecisi — ve her birinin neye ihtiyaç duyduğunu saymak." },
    ],
    sections: [
      {
        id: "balance",
        title: { en: "A system that must balance every second", tr: "Her saniye dengelenmesi gereken bir sistem" },
        blocks: [
          {
            kind: "p",
            text: {
              en: "The transmission system operator (TSO) — **PSE** in Poland, Energinet in Denmark — keeps the frequency at 50 Hz by activating reserves that it buys in advance: frequency containment reserve within seconds, automatic and manual frequency restoration reserves within minutes [@ebgl2017]. Every megawatt of uncertainty in the wind forecast is a megawatt of reserve that someone must hold and pay for. As wind grows to a large share of supply, its forecast error becomes one of the main drivers of balancing needs [@pinson2013].",
              tr: "İletim sistemi işletmecisi (İSO) — Polonya'da **PSE**, Danimarka'da Energinet — frekansı önceden satın aldığı rezervleri devreye alarak 50 Hz'de tutar: saniyeler içinde frekans sınırlama rezervi, dakikalar içinde otomatik ve manuel frekans geri getirme rezervleri [@ebgl2017]. Rüzgâr tahminindeki her megavatlık belirsizlik, birinin tutması ve ödemesi gereken bir megavatlık rezerv demektir. Rüzgârın arzdaki payı büyüdükçe, tahmin hatası dengeleme ihtiyacının başlıca nedenlerinden biri olur [@pinson2013].",
            },
          },
          {
            kind: "p",
            text: {
              en: "European rules make the producer responsible for this error. Under Regulation (EU) 2019/943 every market participant is financially responsible for the imbalances it causes, either directly or through a **balance-responsible party** (BRP) [@reg2019]. For an offshore farm such as SB-510 the forecast is therefore not a scientific curiosity: it is the volume it sells, and the basis on which it is penalised.",
              tr: "Avrupa kuralları bu hatanın sorumluluğunu üreticiye yükler. (AB) 2019/943 sayılı Tüzük uyarınca her piyasa katılımcısı, doğrudan ya da bir **dengeden sorumlu taraf** (BRP) aracılığıyla, yol açtığı dengesizliklerden mali olarak sorumludur [@reg2019]. SB-510 gibi bir açık deniz santrali için tahmin bilimsel bir merak konusu değildir: sattığı miktardır ve cezalandırılmasının dayanağıdır.",
            },
          },
        ],
      },
      {
        id: "timeline",
        title: { en: "The market timeline: from D−1 to settlement", tr: "Piyasa zaman çizelgesi: D−1'den uzlaştırmaya" },
        blocks: [
          {
            kind: "p",
            text: {
              en: "Most energy is sold the day before delivery. In the single European day-ahead coupling (SDAC), bids for every market time unit of day D close at **12:00 CET on day D−1** [@cacm2015]; in Poland mainly on the power exchange TGE. After that, continuous intraday trading (SIDC) lets the farm correct its position until shortly before delivery. During delivery the TSO balances the system in real time, and afterwards it settles every deviation between the schedule and the metered output in 15-minute imbalance settlement periods [@ebgl2017;@pseWdb].",
              tr: "Enerjinin büyük kısmı teslimattan bir gün önce satılır. Tek Avrupa gün öncesi piyasa birleşmesinde (SDAC), D gününün her piyasa zaman birimi için teklifler **D−1 günü saat 12:00 CET'te kapanır** [@cacm2015]; Polonya'da teklifler ağırlıklı olarak enerji borsası TGE'de verilir. Bundan sonra sürekli gün içi ticaret (SIDC), santralin pozisyonunu teslimattan kısa süre öncesine kadar düzeltmesine izin verir. Teslimat sırasında İSO sistemi gerçek zamanlı dengeler; ardından programla ölçülen üretim arasındaki her sapmayı 15 dakikalık dengesizlik uzlaştırma dönemlerinde uzlaştırır [@ebgl2017;@pseWdb].",
            },
          },
          {
            kind: "fig",
            fig: "market-timeline",
            caption: {
              en: "From the weather model run to the imbalance bill. The day-ahead bid is made with forecasts 12–36 h ahead of the delivery hours; intraday trading and the TSO's real-time balancing absorb what the bid got wrong.",
              tr: "Hava modeli koşusundan dengesizlik faturasına. Gün öncesi teklif, teslimat saatlerinden 12–36 sa önceki tahminlerle verilir; teklifin yanıldığı kısmı gün içi ticaret ve İSO'nun gerçek zamanlı dengelemesi karşılar.",
            },
            source: { en: "CACM [@cacm2015], EB GL [@ebgl2017], PSE balancing terms [@pseWdb].", tr: "CACM [@cacm2015], EB GL [@ebgl2017], PSE dengeleme şartları [@pseWdb]." },
          },
          {
            kind: "callout",
            tone: "note",
            title: { en: "Why the day-ahead horizon matters most", tr: "Gün öncesi ufuk neden en önemlisidir" },
            body: [
              {
                en: "The day-ahead auction sets the bulk of the volume and the price. Intraday markets are thinner and the TSO's balancing energy is expensive, so the better the D−1 forecast, the less must be bought back later. That is why this platform scores a strict day-ahead forecast: only information available at 12:00 D−1 may be used (chapter 7).",
                tr: "Gün öncesi açık artırma, hacmin ve fiyatın büyük kısmını belirler. Gün içi piyasalar daha sığdır ve İSO'nun dengeleme enerjisi pahalıdır; D−1 tahmini ne kadar iyiyse sonradan o kadar az geri alım gerekir. Bu platformun katı bir gün öncesi tahmini puanlamasının nedeni budur: yalnızca D−1 12:00'de mevcut bilgi kullanılabilir (bölüm 7).",
              },
            ],
          },
        ],
      },
      {
        id: "cost",
        title: { en: "What a forecast error costs", tr: "Bir tahmin hatası neye mal olur" },
        blocks: [
          {
            kind: "p",
            text: {
              en: "When the farm delivers less than it sold it is **short** and must pay for the missing energy at the imbalance price; when it delivers more it is **long** and the surplus is settled at the imbalance price instead of the day-ahead price. With a single imbalance price the sign of the whole system's imbalance decides whether a given deviation costs or earns, but on average deviations cost money because they are correlated with the system's need for reserves [@pinson2013]. A first-order estimate multiplies the absolute imbalance energy by a typical price spread:",
              tr: "Santral sattığından az teslim ettiğinde **açık** pozisyondadır ve eksik enerjiyi dengesizlik fiyatından öder; fazla teslim ettiğinde **fazla** pozisyondadır ve fazlalık gün öncesi fiyat yerine dengesizlik fiyatından uzlaştırılır. Tek dengesizlik fiyatında, belirli bir sapmanın maliyet mi gelir mi doğuracağına tüm sistemin dengesizlik yönü karar verir; ancak ortalamada sapmalar para kaybettirir, çünkü sistemin rezerv ihtiyacıyla ilişkilidir [@pinson2013]. Birinci dereceden bir tahmin, mutlak dengesizlik enerjisini tipik bir fiyat farkıyla çarpar:",
            },
          },
          {
            kind: "eq",
            tex: "C \\;\\approx\\; \\lambda_{\\text{spread}} \\sum_{t} \\bigl|\\hat P_t - P_t\\bigr|\\,\\Delta t",
            where: [
              { sym: "C", def: { en: "imbalance cost over the period", tr: "dönem boyunca dengesizlik maliyeti" }, unit: "€" },
              { sym: "\\hat P_t,\\;P_t", def: { en: "scheduled (forecast) and metered power in period t", tr: "t döneminde programlanan (tahmin) ve ölçülen güç" }, unit: "MW" },
              { sym: "\\Delta t", def: { en: "length of the settlement period", tr: "uzlaştırma döneminin uzunluğu" }, unit: "h" },
              { sym: "\\lambda_{\\text{spread}}", def: { en: "typical gap between imbalance and day-ahead price", tr: "dengesizlik ile gün öncesi fiyat arasındaki tipik fark" }, unit: "€/MWh" },
            ],
          },
          {
            kind: "fig",
            fig: "real-week-imbalance",
            caption: {
              en: "One week of the last test fold (late August 2026): measured output of Kriegers Flak, Rødsand II and Nysted ({capacity} MW) against a day-ahead forecast. Shaded areas are imbalance energy; switch forecasts and the spread to see the cost change. The week holds several swings of 500–800 MW within half a day; on 29 August at 13:00 the farms produced 141 MW while every day-ahead forecast expected about 600 MW — a timing error of the weather model that no conversion model can repair.",
              tr: "Son test katmanından bir hafta (Ağustos 2026 sonu): Kriegers Flak, Rødsand II ve Nysted'in ({capacity} MW) ölçülen üretimi ve bir gün öncesi tahmin. Taralı alanlar dengesizlik enerjisidir; maliyetin nasıl değiştiğini görmek için tahmini ve fiyat farkını değiştirin. Haftada yarım gün içinde 500–800 MW'lık birkaç salınım vardır; 29 Ağustos saat 13:00'te santraller 141 MW üretirken tüm gün öncesi tahminler yaklaşık 600 MW bekliyordu — hiçbir dönüşüm modelinin düzeltemeyeceği bir hava modeli zamanlama hatası.",
            },
            source: {
              en: "measured output: Energinet [@energinet]; NWP: Open-Meteo Previous Runs [@openmeteo]; forecasts: this platform's out-of-fold predictions.",
              tr: "ölçülen üretim: Energinet [@energinet]; NWP: Open-Meteo Previous Runs [@openmeteo]; tahminler: bu platformun katman dışı tahminleri.",
            },
          },
          {
            kind: "steps",
            title: { en: "Order of magnitude for SB-510", tr: "SB-510 için büyüklük mertebesi" },
            given: {
              en: "SB-510 has 510 MW. Assume a day-ahead nMAE of 10 % of capacity — close to the {xgb_nmae} % XGBoost reaches on the measured DK2 data — and a typical spread of 30 €/MWh.",
              tr: "SB-510 510 MW'tır. Kapasitenin %10'u kadar bir gün öncesi nMAE — XGBoost'un ölçülmüş DK2 verisinde ulaştığı %{xgb_nmae}'a yakın — ve 30 €/MWh tipik fiyat farkı varsayın.",
            },
            steps: [
              { en: "Mean absolute imbalance: $0.10 \\times 510\\,\\text{MW} = 51\\,\\text{MW}$.", tr: "Ortalama mutlak dengesizlik: $0{,}10 \\times 510\\,\\text{MW} = 51\\,\\text{MW}$." },
              { en: "Energy per year: $51\\,\\text{MW} \\times 8760\\,\\text{h} \\approx 447\\,\\text{GWh}$.", tr: "Yıllık enerji: $51\\,\\text{MW} \\times 8760\\,\\text{h} \\approx 447\\,\\text{GWh}$." },
              { en: "Cost: $447\\,000\\,\\text{MWh} \\times 30\\,\\text{€/MWh} \\approx 13.4\\,\\text{M€}$ per year.", tr: "Maliyet: $447\\,000\\,\\text{MWh} \\times 30\\,\\text{€/MWh} \\approx 13{,}4\\,\\text{M€}$/yıl." },
              { en: "One percentage point of nMAE is therefore worth ≈ 1.3 M€ per year for this farm.", tr: "Dolayısıyla bu santral için nMAE'deki bir puan yılda ≈ 1,3 M€ eder." },
            ],
            result: {
              en: "≈ 13 M€/a of imbalance cost at 10 % nMAE; each point of forecast improvement saves about 1.3 M€/a. Real costs depend on the imbalance price regime and on intraday corrections.",
              tr: "%10 nMAE'de ≈ 13 M€/yıl dengesizlik maliyeti; tahmindeki her puanlık iyileşme yılda yaklaşık 1,3 M€ kazandırır. Gerçek maliyetler dengesizlik fiyat rejimine ve gün içi düzeltmelere bağlıdır.",
            },
          },
        ],
      },
      {
        id: "users",
        title: { en: "Who uses the forecast, and for what", tr: "Tahmini kim, ne için kullanır" },
        blocks: [
          {
            kind: "table",
            caption: { en: "Users of wind power forecasts, their horizon and the decision the forecast supports.", tr: "Rüzgâr gücü tahmininin kullanıcıları, ufukları ve tahminin desteklediği karar." },
            head: [
              { en: "User", tr: "Kullanıcı" },
              { en: "Horizon", tr: "Ufuk" },
              { en: "Decision", tr: "Karar" },
              { en: "Needs", tr: "İhtiyaç" },
            ],
            rows: [
              [
                { en: "Balance-responsible party / trader", tr: "Dengeden sorumlu taraf / tüccar" },
                { en: "12–36 h, then intraday", tr: "12–36 sa, sonra gün içi" },
                { en: "volume to bid, intraday corrections", tr: "teklif miktarı, gün içi düzeltmeler" },
                { en: "P50 and the cost-optimal quantile", tr: "P50 ve maliyet açısından en iyi kantil" },
              ],
              [
                { en: "TSO (PSE)", tr: "İSO (PSE)" },
                { en: "minutes to days", tr: "dakikalardan günlere" },
                { en: "reserves, congestion, unit commitment", tr: "rezervler, sıkışıklık, ünite devreye alma" },
                { en: "uncertainty bands, ramp warnings", tr: "belirsizlik bantları, rampa uyarıları" },
              ],
              [
                { en: "Plant operator / O&M", tr: "Santral işletmecisi / B&O" },
                { en: "1–10 days", tr: "1–10 gün" },
                { en: "maintenance windows, vessel planning", tr: "bakım pencereleri, gemi planlaması" },
                { en: "low-wind periods, wave height", tr: "düşük rüzgâr dönemleri, dalga yüksekliği" },
              ],
              [
                { en: "Grid owner (export cable)", tr: "Şebeke sahibi (ihracat kablosu)" },
                { en: "hours to days", tr: "saatlerden günlere" },
                { en: "thermal loading, reactive power plan", tr: "termal yüklenme, reaktif güç planı" },
                { en: "power and its uncertainty", tr: "güç ve belirsizliği" },
              ],
            ],
            source: { en: "after [@giebel2011;@iea2022].", tr: "[@giebel2011;@iea2022] esas alınarak." },
          },
        ],
      },
    ],
    practice: {
      platform: [
        { en: "The Day-ahead tab forecasts every hour of day D from the NWP issued the day before and scores it like a bid: XGBoost reaches {xgb_nrmse} % nRMSE, the TSO's own day-ahead forecast {tso_nrmse} %, 24-hour persistence {pers_nrmse} %.", tr: "Gün öncesi sekmesi, D gününün her saatini bir gün önce yayımlanan NWP'den tahmin eder ve bir teklif gibi puanlar: XGBoost %{xgb_nrmse} nRMSE'ye ulaşır, İSO'nun kendi gün öncesi tahmini %{tso_nrmse}, 24 saatlik kalıcılık %{pers_nrmse}." },
        { en: "SB-510 is not built, so the method is trained on the measured output of three Danish Baltic farms ({capacity} MW), 230–310 km west of the SB-510 site in the same Baltic wind regime; the same pipeline would run on SB-510 metering.", tr: "SB-510 inşa edilmediği için yöntem, SB-510 sahasının 230–310 km batısında, aynı Baltık rüzgâr rejimindeki üç Danimarka santralinin ({capacity} MW) ölçülen üretimiyle eğitilir; aynı hat SB-510 ölçümleriyle de çalışır." },
      ],
      files: ["backend/app/services/p4/real_data.py", "frontend/src/components/p4/RealDataPanel.tsx"],
      industry: [
        { en: "Every TSO with significant wind runs its own forecast; Energinet publishes its day-ahead and intraday wind forecasts openly, which is the benchmark used here [@energinet].", tr: "Önemli rüzgâr kapasitesine sahip her İSO kendi tahminini çalıştırır; Energinet gün öncesi ve gün içi rüzgâr tahminlerini açıkça yayımlar; burada kullanılan karşılaştırma budur [@energinet]." },
        { en: "Utilities and traders buy forecasts from specialised vendors or run in-house teams; best practice for selecting and evaluating them is collected in the IEA Wind Recommended Practice [@iea2022].", tr: "Enerji şirketleri ve tüccarlar tahminleri uzman sağlayıcılardan satın alır ya da kendi ekiplerini çalıştırır; bunları seçme ve değerlendirme konusundaki en iyi uygulamalar IEA Wind Önerilen Uygulamasında toplanmıştır [@iea2022]." },
      ],
      solves: [
        { en: "Turns a weather-driven, uncontrollable source into a schedulable market participant.", tr: "Hava koşullarına bağlı, kontrol edilemeyen bir kaynağı programlanabilir bir piyasa katılımcısına dönüştürür." },
        { en: "Reduces imbalance costs for the farm and reserve costs for the system.", tr: "Santral için dengesizlik maliyetini, sistem için rezerv maliyetini azaltır." },
      ],
      limits: [
        { en: "A forecast cannot remove weather uncertainty; it can only quantify it. Large errors cluster in storms and fronts, exactly when the system is stressed.", tr: "Tahmin hava belirsizliğini ortadan kaldıramaz; yalnızca ölçebilir. Büyük hatalar fırtına ve cephelerde, yani sistemin en zorlandığı anlarda kümelenir." },
        { en: "The cost estimate above is first-order: real imbalance prices are asymmetric and depend on the system's direction.", tr: "Yukarıdaki maliyet tahmini birinci derecedendir: gerçek dengesizlik fiyatları asimetriktir ve sistemin yönüne bağlıdır." },
      ],
    },
    takeaways: [
      { en: "Generation must match demand every second; wind takes part in that balance through its forecast.", tr: "Üretim her saniye talebe eşit olmalıdır; rüzgâr bu dengeye tahmini aracılığıyla katılır." },
      { en: "The day-ahead bid closes at 12:00 CET on D−1 — lead times of 12 to 36 hours.", tr: "Gün öncesi teklif D−1 günü 12:00 CET'te kapanır — 12 ila 36 saatlik öncü süreler." },
      { en: "Imbalance cost ≈ spread × |forecast − measured|; for SB-510 one point of nMAE is worth roughly a million euros a year.", tr: "Dengesizlik maliyeti ≈ fark × |tahmin − ölçüm|; SB-510 için nMAE'nin bir puanı yılda yaklaşık bir milyon avro eder." },
    ],
    quiz: [
      {
        q: { en: "A wind farm sold 400 MW for 14:00–15:00 and delivered 340 MW. What is its position?", tr: "Bir rüzgâr santrali 14:00–15:00 için 400 MW sattı ve 340 MW teslim etti. Pozisyonu nedir?" },
        options: [
          { en: "Long by 60 MWh", tr: "60 MWh fazla" },
          { en: "Short by 60 MWh", tr: "60 MWh açık" },
          { en: "Balanced — the TSO covers it", tr: "Dengeli — İSO karşılar" },
        ],
        answer: 1,
        why: { en: "It delivered less than it sold, so it is short 60 MWh and pays for the missing energy at the imbalance price.", tr: "Sattığından az teslim etti; 60 MWh açıktır ve eksik enerjiyi dengesizlik fiyatından öder." },
      },
      {
        q: { en: "When must the day-ahead forecast for 23:00 on day D be final?", tr: "D gününün 23:00 saati için gün öncesi tahmin ne zaman kesinleşmelidir?" },
        options: [
          { en: "At 23:00 on day D−1", tr: "D−1 günü 23:00'te" },
          { en: "At 12:00 CET on day D−1 — 35 hours before", tr: "D−1 günü 12:00 CET'te — 35 saat önce" },
          { en: "One hour before delivery", tr: "Teslimattan bir saat önce" },
        ],
        answer: 1,
        why: { en: "All hours of day D are bid together at the 12:00 CET gate on D−1; 23:00 on D is 35 hours later.", tr: "D gününün tüm saatleri D−1 12:00 CET kapısında birlikte teklif edilir; D günü 23:00, 35 saat sonradır." },
      },
    ],
    concepts: ["grid", "market", "imbalance"],
  },

  // ───────────────────────────────────────────────────────────────── 2
  {
    id: "nwp",
    n: 2,
    part: "problem",
    title: { en: "Where the skill comes from: weather models and the power curve", tr: "Beceri nereden gelir: hava modelleri ve güç eğrisi" },
    lead: {
      en: "Beyond a few hours, no statistical trick on past production can tell what tomorrow's wind will be — only a physical model of the atmosphere can. A day-ahead wind power forecast is therefore a chain: numerical weather prediction (NWP) gives the wind, a conversion model turns wind into power. This chapter follows that chain on real data and shows why the steep part of the power curve makes small wind errors expensive.",
      tr: "Birkaç saatin ötesinde, geçmiş üretim üzerindeki hiçbir istatistiksel yöntem yarının rüzgârını söyleyemez — bunu yalnızca atmosferin fiziksel bir modeli yapabilir. Gün öncesi rüzgâr gücü tahmini bu yüzden bir zincirdir: sayısal hava tahmini (NWP) rüzgârı verir, bir dönüşüm modeli rüzgârı güce çevirir. Bu bölüm bu zinciri gerçek veri üzerinde izler ve güç eğrisinin dik kısmının küçük rüzgâr hatalarını neden pahalı hâle getirdiğini gösterir.",
    },
    objectives: [
      { en: "Describe the steps from atmospheric observations to a farm's power forecast.", tr: "Atmosfer gözlemlerinden bir santralin güç tahminine kadar olan adımları tanımlamak." },
      { en: "Explain why forecast error grows with lead time and why a farm's power curve differs from a turbine's.", tr: "Tahmin hatasının öncü süreyle neden büyüdüğünü ve bir santralin güç eğrisinin türbininkinden neden farklı olduğunu açıklamak." },
      { en: "Propagate a wind-speed error through the power curve and quantify the power error.", tr: "Bir rüzgâr hızı hatasını güç eğrisinden geçirerek güç hatasını hesaplamak." },
    ],
    sections: [
      {
        id: "chain",
        title: { en: "The forecasting chain", tr: "Tahmin zinciri" },
        blocks: [
          {
            kind: "p",
            text: {
              en: "Weather centres such as ECMWF and DWD collect millions of observations every few hours, combine them with the previous forecast in a **data assimilation** step (4D-Var at ECMWF) into the best estimate of the current state of the atmosphere, and integrate the equations of fluid dynamics and thermodynamics forward in time [@bauer2015]. The ECMWF IFS and DWD's ICON [@zangl2015] are global models of this kind; their output — wind at 100 m, every hour, for every grid point — is the main input of every day-ahead wind power forecast [@giebel2011].",
              tr: "ECMWF ve DWD gibi hava merkezleri birkaç saatte bir milyonlarca gözlem toplar, bunları bir önceki tahminle birlikte bir **veri özümleme** adımında (ECMWF'de 4D-Var) atmosferin şimdiki durumunun en iyi tahminine dönüştürür ve akışkanlar dinamiği ile termodinamiğin denklemlerini zamanda ileri doğru çözer [@bauer2015]. ECMWF IFS ve DWD'nin ICON modeli [@zangl2015] bu türden küresel modellerdir; çıktıları — her ızgara noktası için saatlik 100 m rüzgârı — her gün öncesi rüzgâr gücü tahmininin ana girdisidir [@giebel2011].",
            },
          },
          {
            kind: "fig",
            fig: "forecast-chain",
            caption: {
              en: "The forecasting chain. Steps 1–3 run at weather centres on supercomputers; steps 4–6 are the forecaster's work and what this platform implements. Each link adds error.",
              tr: "Tahmin zinciri. 1–3. adımlar hava merkezlerinde süper bilgisayarlarda çalışır; 4–6. adımlar tahmincinin işidir ve bu platformun uyguladığı kısımdır. Her halka hata ekler.",
            },
          },
          {
            kind: "p",
            text: {
              en: "The atmosphere is chaotic: two states that differ by less than any measurement error drift apart exponentially [@lorenz1963]. The error of the NWP wind therefore grows with lead time, and a forecast for tomorrow afternoon is fundamentally less certain than one for the next hour. Modern models have gained about one day of skill per decade [@bauer2015], and machine-learned weather models such as GraphCast now rival them at medium range [@lam2023] — but none removes the growth of uncertainty with lead time.",
              tr: "Atmosfer kaotiktir: herhangi bir ölçüm hatasından daha az farklı iki durum üstel olarak birbirinden uzaklaşır [@lorenz1963]. Bu yüzden NWP rüzgârının hatası öncü süreyle büyür ve yarın öğleden sonrası için bir tahmin, bir sonraki saat için olandan temelde daha belirsizdir. Modern modeller her on yılda yaklaşık bir günlük beceri kazanmıştır [@bauer2015] ve GraphCast gibi makine öğrenmeli hava modelleri artık orta vadede onlarla yarışmaktadır [@lam2023] — ama hiçbiri belirsizliğin öncü süreyle büyümesini ortadan kaldırmaz.",
            },
          },
          {
            kind: "callout",
            tone: "note",
            title: { en: "The NWP used on this platform", tr: "Bu platformda kullanılan NWP" },
            body: [
              {
                en: "For each hour the platform uses the 100 m wind and direction that the ECMWF IFS (0.25°) and DWD ICON runs of the **previous day** predicted for Kriegers Flak and Rødsand, from the Open-Meteo Previous Runs archive [@openmeteo]. Four wind series — two models × two sites — and their directions are the inputs; measured power is never an input (chapter 7).",
                tr: "Platform her saat için, ECMWF IFS (0,25°) ve DWD ICON'un **bir önceki gün** Kriegers Flak ve Rødsand için öngördüğü 100 m rüzgârı ve yönü Open-Meteo Previous Runs arşivinden kullanır [@openmeteo]. Dört rüzgâr serisi — iki model × iki saha — ve yönleri girdidir; ölçülen güç asla girdi değildir (bölüm 7).",
              },
            ],
          },
        ],
      },
      {
        id: "curve",
        title: { en: "From wind to power: the power curve", tr: "Rüzgârdan güce: güç eğrisi" },
        blocks: [
          {
            kind: "p",
            text: {
              en: "The kinetic power of the wind through the rotor disc grows with the cube of the wind speed. A turbine extracts a fraction $C_p$ of it, bounded by the Betz limit $16/27 \\approx 0.593$ [@burton2011;@manwell2009]:",
              tr: "Rotor diskinden geçen rüzgârın kinetik gücü, rüzgâr hızının küpüyle artar. Türbin bunun $C_p$ kadarlık bir kısmını alır; bu oran Betz sınırı $16/27 \\approx 0{,}593$ ile sınırlıdır [@burton2011;@manwell2009]:",
            },
          },
          {
            kind: "eq",
            tex: "P \\;=\\; \\tfrac{1}{2}\\,\\rho\\,A\\,C_p(\\lambda,\\beta)\\,u^3 ,\\qquad 0 \\le P \\le P_{\\text{rated}}",
            where: [
              { sym: "\\rho", def: { en: "air density (≈ 1.225 at 15 °C, sea level)", tr: "hava yoğunluğu (15 °C, deniz seviyesinde ≈ 1,225)" }, unit: "kg/m³" },
              { sym: "A", def: { en: "rotor swept area; IEA 15 MW: D = 240 m → 45 239 m²", tr: "rotor süpürme alanı; IEA 15 MW: D = 240 m → 45 239 m²" }, unit: "m²" },
              { sym: "C_p", def: { en: "power coefficient, a function of tip-speed ratio λ and pitch β", tr: "güç katsayısı, uç hız oranı λ ve hatve β'nın fonksiyonu" }, unit: "–" },
              { sym: "u", def: { en: "wind speed at hub height", tr: "göbek yüksekliğinde rüzgâr hızı" }, unit: "m/s" },
            ],
            source: "Burton et al. (2011), ch. 3",
          },
          {
            kind: "p",
            text: {
              en: "Between cut-in (3 m/s for the IEA 15 MW reference turbine that models SB-510 [@gaertner2020]) and rated speed (10.66 m/s) power follows the cube law; above rated the blades pitch to hold 15 MW; above cut-out (25 m/s) the turbine stops. A **single turbine** is measured against this curve under IEC 61400-12-1 [@iec61400121]. A **farm** behaves differently: turbines in the wake of others see less wind [@barthelmie2009], winds differ across tens of kilometres, some turbines are unavailable and the TSO may curtail output. Figure 2.2 shows the result on the measured DK2 data.",
              tr: "Devreye girme (SB-510'u modelleyen IEA 15 MW referans türbini için 3 m/s [@gaertner2020]) ile nominal hız (10,66 m/s) arasında güç küp yasasını izler; nominalin üstünde kanatlar 15 MW'ı korumak için hatve açısını değiştirir; devreden çıkma hızının (25 m/s) üstünde türbin durur. **Tek bir türbin** bu eğriye göre IEC 61400-12-1 kapsamında ölçülür [@iec61400121]. Bir **santral** farklı davranır: diğerlerinin izindeki türbinler daha az rüzgâr görür [@barthelmie2009], rüzgâr onlarca kilometre boyunca değişir, bazı türbinler kullanılamaz durumdadır ve İSO üretimi kısabilir. Şekil 2.2 bunun ölçülmüş DK2 verisindeki sonucunu gösterir.",
            },
          },
          {
            kind: "fig",
            fig: "power-curve-scatter",
            caption: {
              en: "Day-ahead NWP wind (mean of four series) against measured output, all {hours} hours. The empirical farm curve rises earlier and more gently than a single turbine's and never quite reaches capacity; at any wind the P10–P90 spread is several hundred MW — this scatter is the irreducible part of the day-ahead problem.",
              tr: "Gün öncesi NWP rüzgârı (dört serinin ortalaması) ve ölçülen üretim, tüm {hours} saat. Deneysel santral eğrisi tek bir türbininkinden daha erken ve daha yumuşak yükselir ve kapasiteye neredeyse hiç ulaşmaz; her rüzgârda P10–P90 yayılımı birkaç yüz MW'tır — bu saçılım gün öncesi problemin indirgenemez kısmıdır.",
            },
            source: { en: "Energinet [@energinet], Open-Meteo [@openmeteo]; IEA 15 MW curve [@gaertner2020].", tr: "Energinet [@energinet], Open-Meteo [@openmeteo]; IEA 15 MW eğrisi [@gaertner2020]." },
          },
        ],
      },
      {
        id: "amplification",
        title: { en: "Why small wind errors become large power errors", tr: "Küçük rüzgâr hataları neden büyük güç hatalarına dönüşür" },
        blocks: [
          {
            kind: "p",
            text: {
              en: "To first order, a wind error $\\delta u$ becomes a power error proportional to the local slope of the curve:",
              tr: "Birinci dereceden, bir rüzgâr hatası $\\delta u$, eğrinin yerel eğimiyle orantılı bir güç hatasına dönüşür:",
            },
          },
          {
            kind: "eq",
            tex: "\\delta P \\;\\approx\\; \\frac{\\mathrm{d}P}{\\mathrm{d}u}\\bigg|_{u}\\,\\delta u, \\qquad \\frac{\\delta P}{P} \\;\\approx\\; 3\\,\\frac{\\delta u}{u}\\;\\;\\text{(below rated)}",
            where: [
              { sym: "\\mathrm{d}P/\\mathrm{d}u", def: { en: "slope of the power curve at the forecast wind", tr: "tahmin rüzgârında güç eğrisinin eğimi" }, unit: "MW/(m/s)" },
              { sym: "\\delta u", def: { en: "wind-speed error of the NWP", tr: "NWP'nin rüzgâr hızı hatası" }, unit: "m/s" },
            ],
          },
          {
            kind: "fig",
            fig: "error-amplification",
            caption: {
              en: "A wind error of ±δu around the forecast wind, mapped through the IEA 15 MW curve. At 8 m/s, ±1 m/s spans 4.2 to 9.0 MW — a third of rated power; at 13 m/s the same error costs nothing because the turbine is at rated.",
              tr: "Tahmin rüzgârı etrafındaki ±δu rüzgâr hatasının IEA 15 MW eğrisinden geçirilmesi. 8 m/s'de ±1 m/s, 4,2 ile 9,0 MW arasını kapsar — nominal gücün üçte biri; 13 m/s'de türbin nominalde olduğu için aynı hata hiçbir şeye mal olmaz.",
            },
            source: { en: "IEA-15-240-RWT power table [@gaertner2020] as used across the platform.", tr: "Platform genelinde kullanılan IEA-15-240-RWT güç tablosu [@gaertner2020]." },
          },
          {
            kind: "steps",
            title: { en: "One turbine at 8 m/s", tr: "8 m/s'de tek türbin" },
            given: { en: "IEA 15 MW curve: $P(7) = 4.25$ MW, $P(8) = 6.34$ MW, $P(9) = 9.03$ MW. The NWP forecasts 8 m/s with an error of ±1 m/s.", tr: "IEA 15 MW eğrisi: $P(7) = 4{,}25$ MW, $P(8) = 6{,}34$ MW, $P(9) = 9{,}03$ MW. NWP 8 m/s öngörüyor, hata ±1 m/s." },
            steps: [
              { en: "Relative wind error: $1/8 = 12.5\\,\\%$.", tr: "Göreli rüzgâr hatası: $1/8 = \\%12{,}5$." },
              { en: "Power range: $9.03 - 4.25 = 4.78$ MW, i.e. $-33\\,\\%$ to $+42\\,\\%$ of the central 6.34 MW.", tr: "Güç aralığı: $9{,}03 - 4{,}25 = 4{,}78$ MW, yani merkezdeki 6,34 MW'ın $-\\%33$ ile $+\\%42$'si." },
              { en: "Cube-law check: $3 \\times 12.5\\,\\% = 37.5\\,\\%$ — the same order, the curve is steeper than $u^3$ here.", tr: "Küp yasası kontrolü: $3 \\times \\%12{,}5 = \\%37{,}5$ — aynı mertebe; eğri burada $u^3$'ten daha diktir." },
              { en: "For 34 turbines erring alike: $34 \\times 4.78 \\approx 163$ MW of uncertainty on a 510 MW farm.", tr: "Aynı şekilde yanılan 34 türbin için: 510 MW'lık santralde $34 \\times 4{,}78 \\approx 163$ MW belirsizlik." },
            ],
            result: { en: "A 12.5 % wind error becomes a ≈ 40 % power error in the steep part of the curve. This is why forecast error peaks at moderate winds, not in storms.", tr: "%12,5'lik rüzgâr hatası, eğrinin dik kısmında ≈ %40'lık güç hatasına dönüşür. Tahmin hatasının fırtınada değil orta rüzgârlarda zirve yapmasının nedeni budur." },
          },
          {
            kind: "fig",
            fig: "error-by-wind",
            caption: {
              en: "Measured day-ahead RMSE per 1 m/s bin of forecast wind, test hours. The error rises with wind through the steep part of the farm curve; it stays high at 12–17 m/s because a forecast of 13 m/s may verify anywhere from 9 to 17 m/s, and because of curtailment and high-wind shutdowns.",
              tr: "Tahmin rüzgârının 1 m/s'lik dilimleri başına ölçülmüş gün öncesi RMSE, test saatleri. Hata, santral eğrisinin dik kısmı boyunca rüzgârla artar; 12–17 m/s'de yüksek kalır, çünkü 13 m/s tahmini 9 ile 17 m/s arasında herhangi bir değerde gerçekleşebilir ve kısıntılar ile yüksek rüzgâr duruşları vardır.",
            },
            source: { en: "this platform's out-of-fold forecasts on {scored_hours} test hours.", tr: "bu platformun {scored_hours} test saatindeki katman dışı tahminleri." },
          },
        ],
      },
    ],
    practice: {
      platform: [
        { en: "The physics-only baseline \"NWP power curve\" bins the training hours by forecast wind (1 m/s) and predicts the bin mean — it scores {curve_nrmse} % nRMSE, close to XGBoost's {xgb_nrmse} %: most of the skill is the weather model's.", tr: "Yalnızca fizik temelli \"NWP güç eğrisi\" referansı eğitim saatlerini tahmin rüzgârına göre (1 m/s) dilimlere ayırır ve dilim ortalamasını tahmin eder — %{curve_nrmse} nRMSE alır, XGBoost'un %{xgb_nrmse}'sine yakın: becerinin çoğu hava modelinindir." },
        { en: "Every module of the platform (layout, SCADA, digital twin, 3D) uses the same IEA-15-240-RWT curve: 3 / 10.66 / 25 m/s, 15 MW.", tr: "Platformun her modülü (yerleşim, SCADA, dijital ikiz, 3B) aynı IEA-15-240-RWT eğrisini kullanır: 3 / 10,66 / 25 m/s, 15 MW." },
      ],
      files: ["backend/app/services/p4/real_data.py · power_curve_forecast()", "backend/app/services/p1/turbine_models.py", "backend/scripts/fetch_real_forecast_data.py"],
      industry: [
        { en: "Commercial forecasters blend several NWP models (ECMWF, ICON, GFS, regional models) because their errors partly cancel, and many add ensemble NWP to estimate uncertainty [@giebel2011;@sweeney2020].", tr: "Ticari tahminciler birden çok NWP modelini (ECMWF, ICON, GFS, bölgesel modeller) harmanlar, çünkü hataları kısmen birbirini götürür; çoğu belirsizliği tahmin etmek için topluluk NWP'si de ekler [@giebel2011;@sweeney2020]." },
        { en: "Power-curve modelling of whole farms from SCADA and NWP is standard in operational forecasting; turbine-level curves are certified under IEC 61400-12-1 [@iec61400121].", tr: "SCADA ve NWP'den tüm santralin güç eğrisinin modellenmesi operasyonel tahminde standarttır; türbin düzeyindeki eğriler IEC 61400-12-1 kapsamında belgelendirilir [@iec61400121]." },
      ],
      solves: [
        { en: "NWP provides the only skill beyond a few hours; the power curve converts it into the quantity that is traded.", tr: "NWP birkaç saatin ötesinde tek beceri kaynağıdır; güç eğrisi bunu ticareti yapılan büyüklüğe dönüştürür." },
      ],
      limits: [
        { en: "NWP grids (9–25 km) do not resolve farm-scale flow; the 100 m wind must be extrapolated to SB-510's 150 m hub height (shear).", tr: "NWP ızgaraları (9–25 km) santral ölçeğindeki akışı çözemez; 100 m rüzgârı SB-510'un 150 m göbek yüksekliğine taşınmalıdır (rüzgâr kesmesi)." },
        { en: "Availability, wakes and curtailment are not in the weather; without SCADA they appear as unexplained scatter.", tr: "Kullanılabilirlik, iz ve kısıntı havada yer almaz; SCADA olmadan açıklanamayan saçılım olarak görünürler." },
      ],
    },
    takeaways: [
      { en: "Day-ahead skill comes from numerical weather prediction; its error grows with lead time because the atmosphere is chaotic.", tr: "Gün öncesi beceri sayısal hava tahmininden gelir; atmosfer kaotik olduğundan hatası öncü süreyle büyür." },
      { en: "δP ≈ (dP/du)·δu: wind errors matter most between cut-in and rated, where the curve is steep.", tr: "δP ≈ (dP/du)·δu: rüzgâr hataları en çok eğrinin dik olduğu devreye girme ile nominal arasında önem taşır." },
      { en: "A farm's power curve is flatter and noisier than a turbine's: wakes, spatial averaging, availability and curtailment.", tr: "Bir santralin güç eğrisi bir türbininkinden daha yatık ve gürültülüdür: iz, mekânsal ortalama, kullanılabilirlik ve kısıntı." },
    ],
    quiz: [
      {
        q: { en: "At which forecast wind does a 1 m/s NWP error cost the IEA 15 MW turbine the most power?", tr: "Hangi tahmin rüzgârında 1 m/s'lik NWP hatası IEA 15 MW türbinine en çok güç kaybettirir?" },
        options: [
          { en: "4 m/s", tr: "4 m/s" },
          { en: "10 m/s", tr: "10 m/s" },
          { en: "18 m/s", tr: "18 m/s" },
        ],
        answer: 1,
        why: { en: "The slope dP/du is largest just below rated (≈ 3.7 MW per m/s at 10 m/s); at 18 m/s the turbine is at rated and the slope is zero.", tr: "dP/du eğimi nominalin hemen altında en büyüktür (10 m/s'de ≈ 3,7 MW/(m/s)); 18 m/s'de türbin nominaldedir ve eğim sıfırdır." },
      },
      {
        q: { en: "Why does the measured farm curve reach capacity less often than a single turbine reaches rated power?", tr: "Ölçülen santral eğrisi neden tek bir türbinin nominal güce ulaşmasından daha seyrek kapasiteye ulaşır?" },
        options: [
          { en: "Because the NWP wind is always too low", tr: "Çünkü NWP rüzgârı her zaman çok düşüktür" },
          { en: "Wakes, unavailable turbines, curtailment and wind differences across the farms", tr: "İz, kullanılamayan türbinler, kısıntı ve santraller arasındaki rüzgâr farkları" },
          { en: "Because air density offshore is lower", tr: "Çünkü açık denizde hava yoğunluğu daha düşüktür" },
        ],
        answer: 1,
        why: { en: "All turbines must be available, unwaked and uncurtailed at once for the aggregate to reach capacity — rare in practice.", tr: "Toplamın kapasiteye ulaşması için tüm türbinlerin aynı anda kullanılabilir, izsiz ve kısıntısız olması gerekir — pratikte nadirdir." },
      },
    ],
    concepts: ["nwp", "powercurve", "chaos"],
  },

  // ───────────────────────────────────────────────────────────────── 3
  {
    id: "baselines",
    n: 3,
    part: "problem",
    title: { en: "Horizons, baselines and the methods landscape", tr: "Ufuklar, referanslar ve yöntemler" },
    lead: {
      en: "A forecast is only good relative to something simpler. Persistence and climatology are the two references every wind forecast must beat, and how hard they are to beat depends on the horizon. This chapter derives their errors from the measured autocorrelation, shows where the day-ahead models sit, and maps the families of methods used in practice.",
      tr: "Bir tahmin ancak daha basit bir şeye göre iyidir. Kalıcılık ve klimatoloji, her rüzgâr tahmininin yenmesi gereken iki referanstır; onları yenmenin zorluğu ufka bağlıdır. Bu bölüm bu referansların hatalarını ölçülmüş otokorelasyondan türetir, gün öncesi modellerin nerede durduğunu gösterir ve pratikte kullanılan yöntem ailelerini haritalar.",
    },
    objectives: [
      { en: "Define persistence, climatology and the Nielsen reference and compute their RMSE from the autocorrelation.", tr: "Kalıcılık, klimatoloji ve Nielsen referansını tanımlamak ve RMSE'lerini otokorelasyondan hesaplamak." },
      { en: "Explain why persistence wins in the first hours and NWP-based models beyond.", tr: "Kalıcılığın neden ilk saatlerde, NWP tabanlı modellerin ise sonrasında kazandığını açıklamak." },
      { en: "Classify forecasting methods by horizon and by approach (physical, statistical, machine learning, hybrid).", tr: "Tahmin yöntemlerini ufka ve yaklaşıma (fiziksel, istatistiksel, makine öğrenmesi, hibrit) göre sınıflandırmak." },
    ],
    sections: [
      {
        id: "references",
        title: { en: "Reference forecasts", tr: "Referans tahminler" },
        blocks: [
          {
            kind: "p",
            text: {
              en: "**Persistence** says the output stays as it was: $\\hat P(t+k\\,|\\,t) = P(t)$. **Climatology** forecasts the long-term mean $\\bar P$. Both need no weather model, and both are mandatory references in the standard evaluation protocol for wind power forecasts [@madsen2005]. Nielsen et al. showed that the best linear combination of the two weights persistence by the autocorrelation at the forecast lag [@nielsen1998]:",
              tr: "**Kalıcılık** üretimin olduğu gibi kalacağını söyler: $\\hat P(t+k\\,|\\,t) = P(t)$. **Klimatoloji** uzun dönem ortalamasını $\\bar P$ tahmin eder. İkisi de hava modeline ihtiyaç duymaz ve ikisi de rüzgâr gücü tahminlerinin standart değerlendirme protokolünde zorunlu referanslardır [@madsen2005]. Nielsen ve arkadaşları, ikisinin en iyi doğrusal birleşiminin kalıcılığı tahmin gecikmesindeki otokorelasyonla ağırlıklandırdığını göstermiştir [@nielsen1998]:",
            },
          },
          {
            kind: "eq",
            tex: "\\hat P_{\\text{NR}}(t+k\\,|\\,t) \\;=\\; \\rho_k\\,P(t) + (1-\\rho_k)\\,\\bar P",
            where: [
              { sym: "\\rho_k", def: { en: "autocorrelation of the output at lag k (Figure 6.1)", tr: "üretimin k gecikmesindeki otokorelasyonu (Şekil 6.1)" }, unit: "–" },
              { sym: "\\bar P", def: { en: "climatological mean of the output", tr: "üretimin klimatolojik ortalaması" }, unit: "MW" },
            ],
            source: "Nielsen et al. (1998)",
          },
          {
            kind: "p",
            text: {
              en: "For a stationary series with standard deviation $\\sigma$, the expected errors follow directly: climatology has RMSE $\\sigma$, persistence $\\sigma\\sqrt{2(1-\\rho_k)}$ and the Nielsen reference $\\sigma\\sqrt{1-\\rho_k^2}$. Persistence beats climatology only while $\\rho_k > 0.5$ — for the DK2 output, the first {acf_half} hours. Inserting the measured autocorrelation ($\\rho_1$ = {acf1}, $\\rho_6$ = {acf6}, $\\rho_{24}$ = {acf24}) gives Figure 3.1.",
              tr: "Standart sapması $\\sigma$ olan durağan bir seri için beklenen hatalar doğrudan çıkar: klimatolojinin RMSE'si $\\sigma$, kalıcılığınki $\\sigma\\sqrt{2(1-\\rho_k)}$ ve Nielsen referansınınki $\\sigma\\sqrt{1-\\rho_k^2}$'dir. Kalıcılık klimatolojiyi ancak $\\rho_k > 0{,}5$ olduğu sürece yener — DK2 üretimi için ilk {acf_half} saat. Ölçülen otokorelasyonu ($\\rho_1$ = {acf1}, $\\rho_6$ = {acf6}, $\\rho_{24}$ = {acf24}) yerine koymak Şekil 3.1'i verir.",
            },
          },
          {
            kind: "fig",
            fig: "horizon-skill",
            caption: {
              en: "Expected RMSE of the three references against lead time, computed from the measured autocorrelation of the DK2 output, with the scored day-ahead forecasts at their NWP lead of 24–47 h. Persistence beats the day-ahead models for the first 2–3 hours; beyond, only weather information helps. The formula predicts {pers_nrmse} % for 24-hour persistence — exactly what the test hours give.",
              tr: "Üç referansın beklenen RMSE'sinin öncü süreye göre değişimi; DK2 üretiminin ölçülmüş otokorelasyonundan hesaplanmış, puanlanan gün öncesi tahminler 24–47 sa'lik NWP öncü sürelerinde gösterilmiştir. Kalıcılık ilk 2–3 saat boyunca gün öncesi modelleri yener; ötesinde yalnızca hava bilgisi yardımcı olur. Formül 24 saatlik kalıcılık için %{pers_nrmse} öngörür — test saatlerinin verdiği değerin aynısı.",
            },
            source: { en: "σ ≈ climatology RMSE ({clim_nrmse} %); ρₖ from {hours} hours of Energinet data [@energinet].", tr: "σ ≈ klimatoloji RMSE'si (%{clim_nrmse}); ρₖ, {hours} saatlik Energinet verisinden [@energinet]." },
          },
          {
            kind: "callout",
            tone: "pitfall",
            title: { en: "Pick the reference that fits the horizon", tr: "Ufka uyan referansı seçin" },
            body: [
              {
                en: "A day-ahead model that beats 1-hour persistence is excellent; one that only beats 24-hour persistence may still be worse than climatology. Always report skill against both persistence and climatology, on the same hours, as the Day-ahead tab does [@madsen2005;@messner2020].",
                tr: "1 saatlik kalıcılığı yenen bir gün öncesi model mükemmeldir; yalnızca 24 saatlik kalıcılığı yenen bir model ise klimatolojiden bile kötü olabilir. Beceriyi her zaman, Gün öncesi sekmesinin yaptığı gibi, aynı saatlerde hem kalıcılığa hem klimatolojiye karşı raporlayın [@madsen2005;@messner2020].",
              },
            ],
          },
        ],
      },
      {
        id: "landscape",
        title: { en: "Horizons and families of methods", tr: "Ufuklar ve yöntem aileleri" },
        blocks: [
          {
            kind: "table",
            caption: { en: "Forecast horizons, their main inputs and typical methods.", tr: "Tahmin ufukları, ana girdileri ve tipik yöntemler." },
            head: [
              { en: "Horizon", tr: "Ufuk" },
              { en: "Main information", tr: "Ana bilgi" },
              { en: "Typical methods", tr: "Tipik yöntemler" },
              { en: "Used for", tr: "Kullanım" },
            ],
            rows: [
              [
                { en: "Very short-term, 0–6 h", tr: "Çok kısa vade, 0–6 sa" },
                { en: "recent measurements (SCADA)", tr: "son ölçümler (SCADA)" },
                { en: "persistence, ARIMA, gradient boosting on lags", tr: "kalıcılık, ARIMA, gecikmeler üzerinde gradient boosting" },
                { en: "intraday trading, balancing", tr: "gün içi ticaret, dengeleme" },
              ],
              [
                { en: "Short-term, 6–72 h", tr: "Kısa vade, 6–72 sa" },
                { en: "NWP + history", tr: "NWP + geçmiş" },
                { en: "power curve, MOS, ML (XGBoost, LSTM, TFT)", tr: "güç eğrisi, MOS, ML (XGBoost, LSTM, TFT)" },
                { en: "day-ahead market, unit commitment", tr: "gün öncesi piyasa, ünite devreye alma" },
              ],
              [
                { en: "Medium range, 3–15 days", tr: "Orta vade, 3–15 gün" },
                { en: "ensemble NWP", tr: "topluluk NWP" },
                { en: "ensemble post-processing", tr: "topluluk son işleme" },
                { en: "maintenance, vessel planning", tr: "bakım, gemi planlaması" },
              ],
              [
                { en: "Seasonal and beyond", tr: "Mevsimlik ve ötesi" },
                { en: "climate indices, reanalysis", tr: "iklim endeksleri, yeniden analiz" },
                { en: "statistical, climatology", tr: "istatistiksel, klimatoloji" },
                { en: "hedging, yield assessment", tr: "riskten korunma, verim değerlendirmesi" },
              ],
            ],
            source: { en: "after [@giebel2011;@kariniotakis2017].", tr: "[@giebel2011;@kariniotakis2017] esas alınarak." },
          },
          {
            kind: "p",
            text: {
              en: "By approach, **physical** methods downscale the NWP wind to each turbine with flow models and apply the power curve; **statistical** methods (MOS, ARIMA, regression) learn the mapping from data; **machine-learning** methods are statistical methods with flexible function classes — trees, neural networks — that learn non-linear interactions; **hybrids** feed physical quantities into learned models [@giebel2011;@wang2019]. The models of this platform are hybrids in that sense: their inputs are physical NWP fields, their mapping is learned.",
              tr: "Yaklaşım açısından **fiziksel** yöntemler NWP rüzgârını akış modelleriyle her türbine indirger ve güç eğrisini uygular; **istatistiksel** yöntemler (MOS, ARIMA, regresyon) eşlemeyi veriden öğrenir; **makine öğrenmesi** yöntemleri, doğrusal olmayan etkileşimleri öğrenen esnek fonksiyon sınıflarına — ağaçlar, sinir ağları — sahip istatistiksel yöntemlerdir; **hibrit** yöntemler fiziksel büyüklükleri öğrenilen modellere besler [@giebel2011;@wang2019]. Bu platformun modelleri bu anlamda hibrittir: girdileri fiziksel NWP alanlarıdır, eşlemeleri öğrenilir.",
            },
          },
        ],
      },
    ],
    practice: {
      platform: [
        { en: "The score table reports every forecast against persistence 24 h ({pers_nrmse} %) and climatology ({clim_nrmse} %): XGBoost's skill is {xgb_ss_pers} against persistence and {xgb_ss_clim} against climatology.", tr: "Skor tablosu her tahmini 24 saatlik kalıcılığa (%{pers_nrmse}) ve klimatolojiye (%{clim_nrmse}) karşı raporlar: XGBoost'un becerisi kalıcılığa karşı {xgb_ss_pers}, klimatolojiye karşı {xgb_ss_clim}'dir." },
        { en: "Climatology is computed on each training block only, never on the test hours, so the reference itself does not peek into the future.", tr: "Klimatoloji yalnızca her eğitim bloğunda hesaplanır, asla test saatlerinde değil; böylece referansın kendisi de geleceğe bakmaz." },
      ],
      files: ["backend/app/services/p4/real_data.py · persistence_24h()", "frontend/src/components/p4/RealDataPanel.tsx"],
      industry: [
        { en: "The persistence/climatology protocol of Madsen et al. is the basis of forecast tenders and benchmarks; vendors are compared on skill, not on raw error [@madsen2005;@iea2022].", tr: "Madsen ve arkadaşlarının kalıcılık/klimatoloji protokolü tahmin ihalelerinin ve kıyaslamaların temelidir; sağlayıcılar ham hata ile değil beceri ile karşılaştırılır [@madsen2005;@iea2022]." },
      ],
      solves: [
        { en: "Gives a fair yardstick: the same RMSE is excellent at 36 h and poor at 1 h.", tr: "Adil bir ölçüt sağlar: aynı RMSE 36 saatte mükemmel, 1 saatte kötüdür." },
      ],
      limits: [
        { en: "The formulas assume a stationary series; seasons and trends (new farms) violate that, so measured skill is the final word.", tr: "Formüller durağan bir seri varsayar; mevsimler ve eğilimler (yeni santraller) bunu bozar; son sözü ölçülen beceri söyler." },
      ],
    },
    takeaways: [
      { en: "Persistence: RMSE = σ√(2(1−ρₖ)); climatology: σ; their best mix (Nielsen): σ√(1−ρₖ²).", tr: "Kalıcılık: RMSE = σ√(2(1−ρₖ)); klimatoloji: σ; en iyi karışımları (Nielsen): σ√(1−ρₖ²)." },
      { en: "For the DK2 output persistence rules for 2–3 hours; day-ahead skill comes from NWP.", tr: "DK2 üretimi için kalıcılık 2–3 saat hâkimdir; gün öncesi beceri NWP'den gelir." },
      { en: "Always report skill against persistence and climatology on the same hours.", tr: "Beceriyi her zaman aynı saatlerde kalıcılığa ve klimatolojiye karşı raporlayın." },
    ],
    quiz: [
      {
        q: { en: "The autocorrelation at lag 24 h is 0.33. Which reference is better at 24 h?", tr: "24 saat gecikmedeki otokorelasyon 0,33'tür. 24 saatte hangi referans daha iyidir?" },
        options: [
          { en: "Persistence, because it uses the latest data", tr: "Kalıcılık, çünkü en son veriyi kullanır" },
          { en: "Climatology, because ρ < 0.5 makes persistence worse than the mean", tr: "Klimatoloji, çünkü ρ < 0,5 kalıcılığı ortalamadan kötü yapar" },
          { en: "They are equal", tr: "Eşittirler" },
        ],
        answer: 1,
        why: { en: "√(2(1−0.33)) = 1.16 > 1: persistence's RMSE is 16 % larger than climatology's.", tr: "√(2(1−0,33)) = 1,16 > 1: kalıcılığın RMSE'si klimatolojininkinden %16 büyüktür." },
      },
      {
        q: { en: "What does a skill score of 0.82 against persistence mean?", tr: "Kalıcılığa karşı 0,82'lik beceri skoru ne anlama gelir?" },
        options: [
          { en: "The model is right 82 % of the time", tr: "Model zamanın %82'sinde haklıdır" },
          { en: "The model's MSE is 18 % of persistence's", tr: "Modelin MSE'si kalıcılığınkinin %18'idir" },
          { en: "The model's error is 82 % of capacity", tr: "Modelin hatası kapasitenin %82'sidir" },
        ],
        answer: 1,
        why: { en: "SS = 1 − MSE/MSE_ref, so MSE = 0.18 × MSE_ref (chapter 12).", tr: "SS = 1 − MSE/MSE_ref, dolayısıyla MSE = 0,18 × MSE_ref (bölüm 12)." },
      },
    ],
    concepts: ["persistence", "climatology", "horizon"],
  },
];
