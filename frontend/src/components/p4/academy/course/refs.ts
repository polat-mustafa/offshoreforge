/**
 * Bibliography of the AI Academy. Chapters cite entries as [@key]; each chapter
 * numbers what it cites in order of first appearance (IEEE style) and lists it
 * under "References". A DOI is given only where it is certain; otherwise the
 * venue identifies the work.
 */

import type { Reference } from "./types";

export const REFS: Record<string, Reference> = {
  // ── Wind power forecasting: state of the art, practice, evaluation ──
  giebel2011: {
    authors: "G. Giebel, R. Brownsword, G. Kariniotakis, M. Denhard, C. Draxl",
    year: 2011,
    title: "The State-of-the-Art in Short-Term Prediction of Wind Power: A Literature Overview, 2nd ed.",
    venue: "ANEMOS.plus / SafeWind project report, Risø DTU",
    doi: "10.11581/DTU:00000017",
  },
  pinson2013: {
    authors: "P. Pinson",
    year: 2013,
    title: "Wind energy: Forecasting challenges for its operational management",
    venue: "Statistical Science, vol. 28, no. 4, pp. 564–585",
    doi: "10.1214/13-STS445",
  },
  kariniotakis2017: {
    authors: "G. Kariniotakis (ed.)",
    year: 2017,
    title: "Renewable Energy Forecasting: From Models to Applications",
    venue: "Woodhead Publishing (Elsevier), Cambridge",
  },
  iea2022: {
    authors: "C. Möhrlen, J. W. Zack, G. Giebel (IEA Wind TCP Task 36)",
    year: 2022,
    title: "IEA Wind Recommended Practice for the Implementation of Renewable Energy Forecasting Solutions",
    venue: "IEA Wind Technology Collaboration Programme; book edition Academic Press (Elsevier)",
  },
  madsen2005: {
    authors: "H. Madsen, P. Pinson, G. Kariniotakis, H. A. Nielsen, T. S. Nielsen",
    year: 2005,
    title: "Standardizing the performance evaluation of short-term wind power prediction models",
    venue: "Wind Engineering, vol. 29, no. 6, pp. 475–489",
    doi: "10.1260/030952405776234599",
  },
  messner2020: {
    authors: "J. W. Messner, P. Pinson, J. Browell, M. B. Bjerregård, I. Schicker",
    year: 2020,
    title: "Evaluation of wind power forecasts — An up-to-date view",
    venue: "Wind Energy, vol. 23, no. 6, pp. 1461–1481",
  },
  nielsen1998: {
    authors: "T. S. Nielsen, A. Joensen, H. Madsen, L. Landberg, G. Giebel",
    year: 1998,
    title: "A new reference for wind power forecasting",
    venue: "Wind Energy, vol. 1, no. 1, pp. 29–34",
  },
  murphy1993: {
    authors: "A. H. Murphy",
    year: 1993,
    title: "What is a good forecast? An essay on the nature of goodness in weather forecasting",
    venue: "Weather and Forecasting, vol. 8, no. 2, pp. 281–293",
  },
  hong2016: {
    authors: "T. Hong, P. Pinson, S. Fan, H. Zareipour, A. Troccoli, R. J. Hyndman",
    year: 2016,
    title: "Probabilistic energy forecasting: Global Energy Forecasting Competition 2014 and beyond",
    venue: "International Journal of Forecasting, vol. 32, no. 3, pp. 896–913",
    doi: "10.1016/j.ijforecast.2016.02.001",
  },
  landry2016: {
    authors: "M. Landry, T. P. Erlinger, D. Patschke, C. Varrichio",
    year: 2016,
    title: "Probabilistic gradient boosting machines for GEFCom2014 wind forecasting",
    venue: "International Journal of Forecasting, vol. 32, no. 3, pp. 1061–1066",
  },
  sweeney2020: {
    authors: "C. Sweeney, R. J. Bessa, J. Browell, P. Pinson",
    year: 2020,
    title: "The future of forecasting for renewable energy",
    venue: "WIREs Energy and Environment, vol. 9, no. 2, e365",
  },
  wang2019: {
    authors: "H. Wang, Z. Lei, X. Zhang, B. Zhou, J. Peng",
    year: 2019,
    title: "A review of deep learning for renewable energy forecasting",
    venue: "Energy Conversion and Management, vol. 198, art. 111799",
  },

  // ── Markets and regulation ──
  cacm2015: {
    authors: "European Commission",
    year: 2015,
    title: "Commission Regulation (EU) 2015/1222 establishing a guideline on capacity allocation and congestion management (CACM)",
    venue: "Official Journal of the EU, L 197, 25.7.2015",
    url: "https://eur-lex.europa.eu/eli/reg/2015/1222/oj",
  },
  ebgl2017: {
    authors: "European Commission",
    year: 2017,
    title: "Commission Regulation (EU) 2017/2195 establishing a guideline on electricity balancing (EB GL)",
    venue: "Official Journal of the EU, L 312, 28.11.2017",
    url: "https://eur-lex.europa.eu/eli/reg/2017/2195/oj",
  },
  reg2019: {
    authors: "European Parliament and Council",
    year: 2019,
    title: "Regulation (EU) 2019/943 on the internal market for electricity",
    venue: "Official Journal of the EU, L 158, 14.6.2019 (Art. 5: balance responsibility)",
    url: "https://eur-lex.europa.eu/eli/reg/2019/943/oj",
  },
  pseWdb: {
    authors: "PSE S.A.",
    year: 2024,
    title: "Warunki Dotyczące Bilansowania (Terms and Conditions related to Balancing)",
    venue: "Polskie Sieci Elektroenergetyczne, balancing market reform in force since June 2024",
    url: "https://www.pse.pl",
  },

  // ── Meteorology and wind energy ──
  lorenz1963: {
    authors: "E. N. Lorenz",
    year: 1963,
    title: "Deterministic nonperiodic flow",
    venue: "Journal of the Atmospheric Sciences, vol. 20, no. 2, pp. 130–141",
    doi: "10.1175/1520-0469(1963)020<0130:DNF>2.0.CO;2",
  },
  bauer2015: {
    authors: "P. Bauer, A. Thorpe, G. Brunet",
    year: 2015,
    title: "The quiet revolution of numerical weather prediction",
    venue: "Nature, vol. 525, pp. 47–55",
    doi: "10.1038/nature14956",
  },
  zangl2015: {
    authors: "G. Zängl, D. Reinert, P. Rípodas, M. Baldauf",
    year: 2015,
    title: "The ICON (ICOsahedral Non-hydrostatic) modelling framework of DWD and MPI-M: Description of the non-hydrostatic dynamical core",
    venue: "Quarterly Journal of the Royal Meteorological Society, vol. 141, no. 687, pp. 563–579",
  },
  lam2023: {
    authors: "R. Lam et al.",
    year: 2023,
    title: "Learning skillful medium-range global weather forecasting",
    venue: "Science, vol. 382, no. 6677, pp. 1416–1421",
  },
  burton2011: {
    authors: "T. Burton, N. Jenkins, D. Sharpe, E. Bossanyi",
    year: 2011,
    title: "Wind Energy Handbook, 2nd ed.",
    venue: "John Wiley & Sons, Chichester",
  },
  manwell2009: {
    authors: "J. F. Manwell, J. G. McGowan, A. L. Rogers",
    year: 2009,
    title: "Wind Energy Explained: Theory, Design and Application, 2nd ed.",
    venue: "John Wiley & Sons, Chichester",
  },
  gaertner2020: {
    authors: "E. Gaertner et al.",
    year: 2020,
    title: "Definition of the IEA 15-Megawatt Offshore Reference Wind Turbine",
    venue: "NREL Technical Report NREL/TP-5000-75698, IEA Wind TCP Task 37",
    url: "https://www.nrel.gov/docs/fy20osti/75698.pdf",
  },
  iec61400121: {
    authors: "IEC",
    year: 2017,
    title: "IEC 61400-12-1: Wind energy generation systems — Power performance measurements of electricity producing wind turbines",
    venue: "International Electrotechnical Commission, Geneva",
  },
  barthelmie2009: {
    authors: "R. J. Barthelmie et al.",
    year: 2009,
    title: "Modelling and measuring flow and wind turbine wakes in large wind farms offshore",
    venue: "Wind Energy, vol. 12, no. 5, pp. 431–444",
  },

  // ── Statistical learning ──
  hastie2009: {
    authors: "T. Hastie, R. Tibshirani, J. Friedman",
    year: 2009,
    title: "The Elements of Statistical Learning, 2nd ed.",
    venue: "Springer, New York",
    doi: "10.1007/978-0-387-84858-7",
  },
  bishop2006: {
    authors: "C. M. Bishop",
    year: 2006,
    title: "Pattern Recognition and Machine Learning",
    venue: "Springer, New York",
  },
  goodfellow2016: {
    authors: "I. Goodfellow, Y. Bengio, A. Courville",
    year: 2016,
    title: "Deep Learning",
    venue: "MIT Press, Cambridge MA",
    url: "https://www.deeplearningbook.org",
  },
  hyndman2021: {
    authors: "R. J. Hyndman, G. Athanasopoulos",
    year: 2021,
    title: "Forecasting: Principles and Practice, 3rd ed.",
    venue: "OTexts, Melbourne",
    url: "https://otexts.com/fpp3/",
  },
  rumelhart1986: {
    authors: "D. E. Rumelhart, G. E. Hinton, R. J. Williams",
    year: 1986,
    title: "Learning representations by back-propagating errors",
    venue: "Nature, vol. 323, pp. 533–536",
    doi: "10.1038/323533a0",
  },
  kingma2015: {
    authors: "D. P. Kingma, J. Ba",
    year: 2015,
    title: "Adam: A method for stochastic optimization",
    venue: "International Conference on Learning Representations (ICLR); arXiv:1412.6980",
    url: "https://arxiv.org/abs/1412.6980",
  },
  prechelt1998: {
    authors: "L. Prechelt",
    year: 1998,
    title: "Early stopping — but when?",
    venue: "in Neural Networks: Tricks of the Trade, LNCS 1524, Springer, pp. 55–69",
    doi: "10.1007/3-540-49430-8_3",
  },
  srivastava2014: {
    authors: "N. Srivastava, G. Hinton, A. Krizhevsky, I. Sutskever, R. Salakhutdinov",
    year: 2014,
    title: "Dropout: A simple way to prevent neural networks from overfitting",
    venue: "Journal of Machine Learning Research, vol. 15, pp. 1929–1958",
    url: "https://jmlr.org/papers/v15/srivastava14a.html",
  },
  gal2016: {
    authors: "Y. Gal, Z. Ghahramani",
    year: 2016,
    title: "Dropout as a Bayesian approximation: Representing model uncertainty in deep learning",
    venue: "Proc. 33rd International Conference on Machine Learning (ICML), PMLR 48, pp. 1050–1059",
    url: "https://arxiv.org/abs/1506.02142",
  },

  // ── Validation and leakage ──
  wilks2011: {
    authors: "D. S. Wilks",
    year: 2011,
    title: "Statistical Methods in the Atmospheric Sciences, 3rd ed.",
    venue: "Academic Press (Elsevier), Oxford",
  },
  bergmeir2012: {
    authors: "C. Bergmeir, J. M. Benítez",
    year: 2012,
    title: "On the use of cross-validation for time series predictor evaluation",
    venue: "Information Sciences, vol. 191, pp. 192–213",
  },
  bergmeir2018: {
    authors: "C. Bergmeir, R. J. Hyndman, B. Koo",
    year: 2018,
    title: "A note on the validity of cross-validation for evaluating autoregressive time series prediction",
    venue: "Computational Statistics & Data Analysis, vol. 120, pp. 70–83",
  },
  kaufman2012: {
    authors: "S. Kaufman, S. Rosset, C. Perlich, O. Stitelman",
    year: 2012,
    title: "Leakage in data mining: Formulation, detection, and avoidance",
    venue: "ACM Transactions on Knowledge Discovery from Data, vol. 6, no. 4, art. 15",
  },
  lopezdeprado2018: {
    authors: "M. López de Prado",
    year: 2018,
    title: "Advances in Financial Machine Learning (ch. 7: cross-validation in finance — purging and embargo)",
    venue: "John Wiley & Sons, Hoboken NJ",
  },

  // ── Trees and boosting ──
  breiman1984: {
    authors: "L. Breiman, J. H. Friedman, R. A. Olshen, C. J. Stone",
    year: 1984,
    title: "Classification and Regression Trees",
    venue: "Wadsworth, Belmont CA",
  },
  friedman2001: {
    authors: "J. H. Friedman",
    year: 2001,
    title: "Greedy function approximation: A gradient boosting machine",
    venue: "The Annals of Statistics, vol. 29, no. 5, pp. 1189–1232",
    doi: "10.1214/aos/1013203451",
  },
  chen2016: {
    authors: "T. Chen, C. Guestrin",
    year: 2016,
    title: "XGBoost: A scalable tree boosting system",
    venue: "Proc. 22nd ACM SIGKDD International Conference on Knowledge Discovery and Data Mining, pp. 785–794",
    doi: "10.1145/2939672.2939785",
  },
  grinsztajn2022: {
    authors: "L. Grinsztajn, E. Oyallon, G. Varoquaux",
    year: 2022,
    title: "Why do tree-based models still outperform deep learning on typical tabular data?",
    venue: "Advances in Neural Information Processing Systems 35, Datasets and Benchmarks Track",
    url: "https://arxiv.org/abs/2207.08815",
  },

  // ── Sequence models ──
  bengio1994: {
    authors: "Y. Bengio, P. Simard, P. Frasconi",
    year: 1994,
    title: "Learning long-term dependencies with gradient descent is difficult",
    venue: "IEEE Transactions on Neural Networks, vol. 5, no. 2, pp. 157–166",
    doi: "10.1109/72.279181",
  },
  hochreiter1997: {
    authors: "S. Hochreiter, J. Schmidhuber",
    year: 1997,
    title: "Long short-term memory",
    venue: "Neural Computation, vol. 9, no. 8, pp. 1735–1780",
    doi: "10.1162/neco.1997.9.8.1735",
  },
  gers2000: {
    authors: "F. A. Gers, J. Schmidhuber, F. Cummins",
    year: 2000,
    title: "Learning to forget: Continual prediction with LSTM",
    venue: "Neural Computation, vol. 12, no. 10, pp. 2451–2471",
  },
  bahdanau2015: {
    authors: "D. Bahdanau, K. Cho, Y. Bengio",
    year: 2015,
    title: "Neural machine translation by jointly learning to align and translate",
    venue: "International Conference on Learning Representations (ICLR); arXiv:1409.0473",
    url: "https://arxiv.org/abs/1409.0473",
  },
  vaswani2017: {
    authors: "A. Vaswani, N. Shazeer, N. Parmar, J. Uszkoreit, L. Jones, A. N. Gomez, Ł. Kaiser, I. Polosukhin",
    year: 2017,
    title: "Attention is all you need",
    venue: "Advances in Neural Information Processing Systems 30, pp. 5998–6008",
    url: "https://arxiv.org/abs/1706.03762",
  },
  lim2021: {
    authors: "B. Lim, S. Ö. Arık, N. Loeff, T. Pfister",
    year: 2021,
    title: "Temporal Fusion Transformers for interpretable multi-horizon time series forecasting",
    venue: "International Journal of Forecasting, vol. 37, no. 4, pp. 1748–1764",
    doi: "10.1016/j.ijforecast.2021.03.012",
  },

  // ── Probabilistic forecasting and scoring ──
  koenker1978: {
    authors: "R. Koenker, G. Bassett",
    year: 1978,
    title: "Regression quantiles",
    venue: "Econometrica, vol. 46, no. 1, pp. 33–50",
    doi: "10.2307/1913643",
  },
  gneiting2007: {
    authors: "T. Gneiting, A. E. Raftery",
    year: 2007,
    title: "Strictly proper scoring rules, prediction, and estimation",
    venue: "Journal of the American Statistical Association, vol. 102, no. 477, pp. 359–378",
    doi: "10.1198/016214506000001437",
  },
  gneiting2007b: {
    authors: "T. Gneiting, F. Balabdaoui, A. E. Raftery",
    year: 2007,
    title: "Probabilistic forecasts, calibration and sharpness",
    venue: "Journal of the Royal Statistical Society B, vol. 69, no. 2, pp. 243–268",
    doi: "10.1111/j.1467-9868.2007.00587.x",
  },
  matheson1976: {
    authors: "J. E. Matheson, R. L. Winkler",
    year: 1976,
    title: "Scoring rules for continuous probability distributions",
    venue: "Management Science, vol. 22, no. 10, pp. 1087–1096",
  },
  hersbach2000: {
    authors: "H. Hersbach",
    year: 2000,
    title: "Decomposition of the continuous ranked probability score for ensemble prediction systems",
    venue: "Weather and Forecasting, vol. 15, no. 5, pp. 559–570",
  },
  pinson2007: {
    authors: "P. Pinson, H. A. Nielsen, J. K. Møller, H. Madsen, G. N. Kariniotakis",
    year: 2007,
    title: "Non-parametric probabilistic forecasts of wind power: Required properties and evaluation",
    venue: "Wind Energy, vol. 10, no. 6, pp. 497–516",
  },
  vovk2005: {
    authors: "V. Vovk, A. Gammerman, G. Shafer",
    year: 2005,
    title: "Algorithmic Learning in a Random World",
    venue: "Springer, New York",
  },
  romano2019: {
    authors: "Y. Romano, E. Patterson, E. J. Candès",
    year: 2019,
    title: "Conformalized quantile regression",
    venue: "Advances in Neural Information Processing Systems 32",
    url: "https://arxiv.org/abs/1905.03222",
  },

  // ── Ensembles, explanation, operation ──
  bates1969: {
    authors: "J. M. Bates, C. W. J. Granger",
    year: 1969,
    title: "The combination of forecasts",
    venue: "Operational Research Quarterly, vol. 20, no. 4, pp. 451–468",
  },
  krogh1995: {
    authors: "A. Krogh, J. Vedelsby",
    year: 1995,
    title: "Neural network ensembles, cross validation, and active learning",
    venue: "Advances in Neural Information Processing Systems 7, pp. 231–238",
  },
  shapley1953: {
    authors: "L. S. Shapley",
    year: 1953,
    title: "A value for n-person games",
    venue: "in Contributions to the Theory of Games II, Annals of Mathematics Studies 28, Princeton University Press, pp. 307–317",
  },
  lundberg2017: {
    authors: "S. M. Lundberg, S.-I. Lee",
    year: 2017,
    title: "A unified approach to interpreting model predictions",
    venue: "Advances in Neural Information Processing Systems 30, pp. 4765–4774",
    url: "https://arxiv.org/abs/1705.07874",
  },
  lundberg2020: {
    authors: "S. M. Lundberg et al.",
    year: 2020,
    title: "From local explanations to global understanding with explainable AI for trees",
    venue: "Nature Machine Intelligence, vol. 2, pp. 56–67",
    doi: "10.1038/s42256-019-0138-9",
  },
  rudin2019: {
    authors: "C. Rudin",
    year: 2019,
    title: "Stop explaining black box machine learning models for high stakes decisions and use interpretable models instead",
    venue: "Nature Machine Intelligence, vol. 1, pp. 206–215",
    doi: "10.1038/s42256-019-0048-x",
  },
  sculley2015: {
    authors: "D. Sculley et al.",
    year: 2015,
    title: "Hidden technical debt in machine learning systems",
    venue: "Advances in Neural Information Processing Systems 28, pp. 2503–2511",
  },
  gama2014: {
    authors: "J. Gama, I. Žliobaitė, A. Bifet, M. Pechenizkiy, A. Bouchachia",
    year: 2014,
    title: "A survey on concept drift adaptation",
    venue: "ACM Computing Surveys, vol. 46, no. 4, art. 44",
    doi: "10.1145/2523813",
  },

  // ── Data used on this platform ──
  energinet: {
    authors: "Energinet",
    year: 2026,
    title: "Energi Data Service — datasets ProductionConsumptionSettlement and Forecasts_Hour (CC BY 4.0)",
    venue: "Energinet, Fredericia, Denmark",
    url: "https://www.energidataservice.dk",
  },
  openmeteo: {
    authors: "Open-Meteo",
    year: 2026,
    title: "Previous Runs API — ECMWF IFS 0.25° and DWD ICON forecasts as issued (CC BY 4.0)",
    venue: "Open-Meteo.com",
    url: "https://open-meteo.com/en/docs/previous-runs-api",
  },
};
