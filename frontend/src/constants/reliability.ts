/**
 * Published reliability and mass data used by the nacelle anatomy (3D exploded
 * view hover cards and drawing A-01). Every number here is copied from the
 * source named next to it; nothing is estimated.
 *
 * 1. IEA 15 MW reference turbine — official tabular data released with
 *    Gaertner et al. (2020), sheet "Nacelle Mass Properties" (component mass,
 *    centre of mass in the tower-top frame: x downwind, z up) and "Overview".
 *    IEAWindTask37/IEA-15-240-RWT, Documentation/IEA-15-240-RWT_tabular.xlsx.
 *
 * 2. Carroll, McDonald & McMillan (2016), "Failure rate, repair time and
 *    unscheduled O&M cost analysis of offshore wind turbines", Wind Energy
 *    19:1107–1119, doi:10.1002/we.1887. ~350 offshore turbines, 2–4 MW, GEARED
 *    with an induction generator; 1768 turbine-years; 8.3 failures per turbine
 *    per year. Fig. 3 (rate per sub-assembly, split by cost category) and
 *    Fig. 13 (technician hours of a minor repair). The values are the chart's
 *    data labels; lib/plant/failures.ts uses the same figures (a test checks
 *    that the two stay equal).
 *
 * 3. Carroll, McDonald & McMillan (2015),
 *    "Reliability comparison of wind turbines with DFIG and PMG drive trains",
 *    IEEE Trans. Energy Conversion 30(2):663–670, doi:10.1109/TEC.2014.2367243.
 *    >1800 DFIG and 400 PMG turbines, otherwise identical. The PMG + fully rated
 *    converter (FRC) is the electrical layout of the IEA 15 MW.
 */

// ── IEA 15 MW: component masses [kg] and centre of mass [m] ─────────────────

export interface IeaComponent {
  massKg: number;
  /** Centre of mass in the tower-top frame [m]: x along the shaft (negative = upwind), y lateral, z up. */
  com: [number, number, number];
}

/** IEA-15-240-RWT_tabular.xlsx, sheet "Nacelle Mass Properties" (Mass, CoM_TT_x/y/z). */
export const IEA15_NACELLE: Record<string, IeaComponent> = {
  mb1: { massKg: 48092.0017865373, com: [-7.088526180019681, 0, 5.094493537559762] },
  mb2: { massKg: 13479.28387693245, com: [-5.895099905577753, 0, 4.969059381638577] },
  lss: { massKg: 15734.03848697378, com: [-6.989073990482853, 0, 5.084040691232996] },
  brake: { massKg: 24290.3642480768, com: [-7.585787127703818, 0, 5.146757769193589] },
  generator_rotor: { massKg: 130349.249629283, com: [-6.51667609018292, 0, 5.03438967118086] },
  generator_stator: { massKg: 238490.157522527, com: [-6.51667609018292, 0, 5.03438967118086] },
  generator: { massKg: 368839, com: [-6.516676090182924, 0, 5.034389671180861] },
  hvac: { massKg: 9381.777411323368, com: [-6.516676090182924, 0, 5.034389671180861] },
  nose: { massKg: 10875.72252782984, com: [-6.044278189882994, 0, 4.984738651128725] },
  bedplate: { massKg: 42274.27441488182, com: [-1.280786058419792, 0, 2.586079672663417] },
  platform: { massKg: 48672, com: [0, 0, 0] },
  cover: { massKg: 20555.95319345692, com: [-0.2500015099873156, 0, 5.839900000000001] },
  transformer: { massKg: 30635, com: [0, -5.0601298474, 1.8101298474] },
  converter: { massKg: 11983.85, com: [0, 5.0601298474, 1.8101298474] },
  /** Sheet row "Above_yaw": everything above the yaw bearing. */
  above_yaw: { massKg: 644813.2659460122, com: [-5.124510792515304, -0.1463636773428857, 4.31416571115637] },
  yaw: { massKg: 28187.49375044175, com: [0, 0, 0] },
  nacelle: { massKg: 673000.7596964539, com: [-4.909879361782229, -0.1402334833112251, 4.133474207811799] },
  hub_system: { massKg: 69006.03659640333, com: [-11.42028264121408, 0, 5.549779487770752] },
  blades: { massKg: 203762.8979805433, com: [-11.42028264121408, 0, 5.549779487770752] },
  rna: { massKg: 945769.6942734006, com: [-7.320960005800414, -0.09978881896383983, 4.598014624587465] },
};

/** IEA-15-240-RWT_tabular.xlsx, sheet "Overview". */
export const IEA15_OVERVIEW = {
  bladeMassT: 67.92096599351444,
  hubMassT: 21.44050014393094,
  generatorMassT: 368.839,
  nacelleMassT: 673.0007596964539,
  hubDiameterM: 7.94,
  generatorEfficiency: 0.957,
};

/** IEA-15-240-RWT.yaml (windIO ontology), components.drivetrain / hub / control. */
export const IEA15_ONTOLOGY = {
  /** components.drivetrain.other_components — windIO: "Type of bearing for first / second main bearing". */
  mb1Type: "CARB",
  mb2Type: "SRB",
  /** windIO: "Distance from hub flange to first main bearing along shaft" [m]. */
  distanceHubMbM: 1.0,
  /** windIO: "Distance from first to second main bearing along shaft" [m]. */
  distanceMbMbM: 1.2,
  /** lss.diameter / wall_thickness [m]. */
  lssDiameterM: 3.0,
  lssWallM: 0.1,
  /** nose (turret) diameter / wall thickness [m]. */
  noseDiameterM: 2.2,
  noseWallM: 0.1,
  /** bedplate wall thickness [m]. */
  bedplateWallM: 0.05,
  /** generator.length — windIO: "Length of generator along the shaft" [m]. */
  generatorLengthM: 2.15,
  /** other_components.uptower — windIO: "If power electronics are located uptower". */
  powerElectronicsUptower: true,
  /** hub.hub_material / spinner_material. */
  hubMaterial: "cast_iron",
  spinnerMaterial: "glass_uni",
  /** control.yaw_rate — windIO: "Constant rate used during yawing maneuvers" [deg/s]. */
  yawRateDegS: 0.49847328176381617,
} as const;

export const kgToT = (kg: number) => kg / 1000;

// ── Carroll et al. 2016: offshore failure rates per sub-assembly ─────────────

export type Carroll2016Row =
  | "Pitch / Hydraulic"
  | "Other Components"
  | "Generator"
  | "Gearbox"
  | "Blades"
  | "Grease / Oil / Cooling Liq."
  | "Electrical Components"
  | "Contactor / Circuit Breaker / Relay"
  | "Controls"
  | "Safety"
  | "Sensors"
  | "Pumps / Motors"
  | "Hub"
  | "Heaters / Coolers"
  | "Yaw System"
  | "Tower / Foundation"
  | "Power Supply / Converter"
  | "Service Items"
  | "Transformer";

export interface Carroll2016Rate {
  /** Failures per turbine per year by cost category (Fig. 3). */
  minorRepair: number;
  majorRepair: number;
  majorReplacement: number;
  noCostData: number;
}

/** Fig. 3 of Carroll et al. 2016 [failures / turbine / year]. */
export const CARROLL_2016: Record<Carroll2016Row, Carroll2016Rate> = {
  "Pitch / Hydraulic": { minorRepair: 0.824, majorRepair: 0.179, majorReplacement: 0.001, noCostData: 0.072 },
  "Other Components": { minorRepair: 0.812, majorRepair: 0.042, majorReplacement: 0.001, noCostData: 0.15 },
  Generator: { minorRepair: 0.485, majorRepair: 0.321, majorReplacement: 0.095, noCostData: 0.098 },
  Gearbox: { minorRepair: 0.395, majorRepair: 0.038, majorReplacement: 0.154, noCostData: 0.046 },
  Blades: { minorRepair: 0.456, majorRepair: 0.01, majorReplacement: 0.001, noCostData: 0.053 },
  "Grease / Oil / Cooling Liq.": { minorRepair: 0.407, majorRepair: 0.006, majorReplacement: 0, noCostData: 0.058 },
  "Electrical Components": { minorRepair: 0.358, majorRepair: 0.016, majorReplacement: 0.002, noCostData: 0.059 },
  "Contactor / Circuit Breaker / Relay": { minorRepair: 0.326, majorRepair: 0.054, majorReplacement: 0.002, noCostData: 0.048 },
  Controls: { minorRepair: 0.355, majorRepair: 0.054, majorReplacement: 0.001, noCostData: 0.018 },
  Safety: { minorRepair: 0.373, majorRepair: 0.004, majorReplacement: 0, noCostData: 0.015 },
  Sensors: { minorRepair: 0.247, majorRepair: 0.07, majorReplacement: 0, noCostData: 0.029 },
  "Pumps / Motors": { minorRepair: 0.278, majorRepair: 0.043, majorReplacement: 0, noCostData: 0.025 },
  Hub: { minorRepair: 0.182, majorRepair: 0.038, majorReplacement: 0.001, noCostData: 0.014 },
  "Heaters / Coolers": { minorRepair: 0.19, majorRepair: 0.007, majorReplacement: 0, noCostData: 0.016 },
  "Yaw System": { minorRepair: 0.162, majorRepair: 0.006, majorReplacement: 0.001, noCostData: 0.02 },
  "Tower / Foundation": { minorRepair: 0.092, majorRepair: 0.089, majorReplacement: 0, noCostData: 0.004 },
  "Power Supply / Converter": { minorRepair: 0.076, majorRepair: 0.081, majorReplacement: 0.005, noCostData: 0.018 },
  "Service Items": { minorRepair: 0.108, majorRepair: 0.001, majorReplacement: 0, noCostData: 0.016 },
  Transformer: { minorRepair: 0.052, majorRepair: 0.003, majorReplacement: 0.001, noCostData: 0.009 },
};

/** Technician hours of a minor repair, Fig. 13 of Carroll et al. 2016 (only the rows the anatomy shows). */
export const CARROLL_2016_MINOR_REPAIR_H: Partial<Record<Carroll2016Row, number>> = {
  "Pitch / Hydraulic": 9,
  Generator: 7,
  Blades: 9,
  Hub: 10,
  "Grease / Oil / Cooling Liq.": 4,
  "Electrical Components": 5,
  "Contactor / Circuit Breaker / Relay": 4,
  Controls: 8,
  Sensors: 8,
  "Heaters / Coolers": 5,
  "Yaw System": 5,
  "Power Supply / Converter": 7,
  Transformer: 7,
};

export const carrollTotal = (row: Carroll2016Row): number => {
  const r = CARROLL_2016[row];
  return r.minorRepair + r.majorRepair + r.majorReplacement + r.noCostData;
};

/** The paper's overall rate [failures / turbine / year]. */
export const CARROLL_2016_OVERALL = 8.3;

// ── Carroll et al. 2015: DFIG vs PMG with fully rated converter ──────────────

/** Failures / turbine / year, printed in the text of Carroll et al. 2015. */
export const CARROLL_2015 = {
  /** PMG generator: 0.076 in Section V-A (Section V-C prints 0.079). */
  pmgGenerator: 0.076,
  dfigGenerator: 0.123,
  /** Fully rated converter of the PMG turbines. */
  frcConverter: 0.593,
  /** Partially rated converter of the DFIG turbines. */
  prcConverter: 0.106,
  /** Share of PMG generator failures from the lubrication and cooling system (~89.5 %). */
  pmgLubeCoolingShare: 0.895,
  /** Share of FRC failures from the cooling system ("over 44 %"). */
  frcCoolingShareMin: 0.44,
} as const;
