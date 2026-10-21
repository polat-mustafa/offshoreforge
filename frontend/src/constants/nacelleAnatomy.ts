/**
 * Nacelle anatomy: what each part does, its data, how it fails and how it is
 * looked after — shown on hover in the 3D exploded view and in drawing A-01.
 *
 * Rules for this file (so it never states more than its sources do):
 *   • every fact, failure rate, failure mode and maintenance line names a
 *     source in ANATOMY_SOURCES; a test checks that none is missing;
 *   • values from constants/reliability.ts are used, not retyped;
 *   • "model" marks values of OffshoreForge's own 3D model that the IEA 15 MW
 *     does not specify (illustrative);
 *   • a maintenance line tagged `derived: true` is our reading of the cited
 *     failure statistics, not a quotation of the source, and the card says so;
 *   • parts with nothing published here say so instead of inventing content.
 */

import {
  CARROLL_2015,
  IEA15_NACELLE,
  IEA15_ONTOLOGY,
  IEA15_OVERVIEW,
  kgToT,
  type Carroll2016Row,
} from "./reliability";
import type { TurbinePartId } from "./turbinePartEducation";

export type AnatomySourceId =
  | "iea15-tabular"
  | "iea15-ontology"
  | "windio-schema"
  | "carroll2016"
  | "carroll2015"
  | "hart2020"
  | "keegan2013"
  | "iec60599"
  | "iec60076-16"
  | "iec61400-24"
  | "iso14520-1"
  | "model";

export interface AnatomySource {
  /** Short label on the card, e.g. "Carroll 2016". */
  short: string;
  citation: string;
  url?: string;
}

const IEA_REPO = "https://github.com/IEAWindTask37/IEA-15-240-RWT/blob/e4993d63de10f165389534461dd544006750fe60";

export const ANATOMY_SOURCES: Record<AnatomySourceId, AnatomySource> = {
  "iea15-tabular": {
    short: "IEA 15 MW data",
    citation: "Gaertner et al. 2020, IEA 15 MW reference turbine — tabular data, sheets Overview and Nacelle Mass Properties",
    url: `${IEA_REPO}/Documentation/IEA-15-240-RWT_tabular.xlsx`,
  },
  "iea15-ontology": {
    short: "IEA 15 MW ontology",
    citation: "IEA-15-240-RWT windIO ontology (WT_Ontology/IEA-15-240-RWT.yaml)",
    url: `${IEA_REPO}/WT_Ontology/IEA-15-240-RWT.yaml`,
  },
  "windio-schema": {
    short: "windIO schema",
    citation: "windIO turbine schema — field definitions and units",
    url: "https://github.com/IEAWindTask37/windIO/blob/63dcad638a9ac41d24f7a68172e24bde378c23e6/windIO/schemas/turbine/turbine_schema.yaml",
  },
  carroll2016: {
    short: "Carroll 2016",
    citation:
      "Carroll, McDonald & McMillan 2016, Failure rate, repair time and unscheduled O&M cost analysis of offshore wind turbines, Wind Energy 19(6):1107–1119 — ~350 offshore turbines, 2–4 MW, geared",
    url: "https://doi.org/10.1002/we.1887",
  },
  carroll2015: {
    short: "Carroll 2015",
    citation:
      "Carroll, McDonald & McMillan 2015, Reliability comparison of wind turbines with DFIG and PMG drive trains, IEEE Trans. Energy Conversion 30(2):663–670 — >1800 DFIG and 400 PMG turbines",
    url: "https://doi.org/10.1109/TEC.2014.2367243",
  },
  hart2020: {
    short: "Hart 2020",
    citation:
      "Hart et al. 2020, A review of wind turbine main bearings: design, operation, modelling, damage mechanisms and fault detection, Wind Energy Science 5:105–124",
    url: "https://doi.org/10.5194/wes-5-105-2020",
  },
  keegan2013: {
    short: "Keegan 2013",
    citation:
      "Keegan, Nash & Stack 2013, On erosion issues associated with the leading edge of wind turbine blades, J. Phys. D: Appl. Phys. 46:383001",
    url: "https://doi.org/10.1088/0022-3727/46/38/383001",
  },
  iec60599: {
    short: "IEC 60599",
    citation: "IEC 60599:2022 — Mineral oil-filled electrical equipment in service: guidance on the interpretation of dissolved and free gases analysis",
    url: "https://webstore.iec.ch/publication/66491",
  },
  "iec60076-16": {
    short: "IEC 60076-16",
    citation: "IEC 60076-16 — Power transformers: transformers for wind turbine applications",
  },
  "iec61400-24": {
    short: "IEC 61400-24",
    citation:
      "IEC 61400-24:2019 — Lightning protection of wind turbines: requirements for blades, structure and electrical/control systems, with test methods",
    url: "https://www.evs.ee/en/evs-en-iec-61400-24-2019",
  },
  "iso14520-1": {
    short: "ISO 14520-1",
    citation: "ISO 14520-1:2023 — Gaseous fire-extinguishing systems, clause 9: inspection, maintenance, testing and training",
    url: "https://standards.iteh.ai/catalog/standards/iso/1d31ce29-1694-4b2d-ad9c-c3061765de95/iso-14520-1-2023",
  },
  model: {
    short: "OffshoreForge model",
    citation: "OffshoreForge 3D model — illustrative value, not specified by the IEA 15 MW reference turbine",
  },
};

export interface AnatomyFact {
  label: string;
  value: string;
  src: AnatomySourceId;
}

export interface AnatomyRate {
  /** Sub-assembly name as printed in the source. */
  label: string;
  src: "carroll2016" | "carroll2015";
  /** Carroll 2016 row (rate and minor-repair hours are read from reliability.ts). */
  row?: Carroll2016Row;
  /** Carroll 2015 value [failures / turbine / year]. */
  perYear?: number;
}

export interface AnatomyNote {
  text: string;
  src: AnatomySourceId;
  /** Our reading of the cited statistics, not the source's own recommendation. */
  derived?: boolean;
}

export interface AnatomyPart {
  /** Item number on drawing A-01 and in the exploded view. */
  item: number;
  /** 3D / drawing selection ids this entry describes. */
  ids: TurbinePartId[];
  title: string;
  /** What it does, in a few words (parts list of drawing A-01). */
  brief: string;
  /** What it does. */
  role: string;
  facts: AnatomyFact[];
  rates: AnatomyRate[];
  failureModes: AnatomyNote[];
  maintenance: AnatomyNote[];
  /** IEA 15 MW mass [t] for the parts list, when the IEA data gives one. */
  massT?: number;
}

const t = (kg: number) => `${kgToT(kg).toFixed(1)} t`;
const N = IEA15_NACELLE;
const O = IEA15_ONTOLOGY;

export const NACELLE_ANATOMY: AnatomyPart[] = [
  {
    item: 1,
    ids: ["blades"],
    title: "Rotor blades",
    brief: "Capture wind; pitch limits power",
    role: "Turn the wind's momentum into torque on the hub; pitching them about their own axis limits power and loads above rated wind.",
    facts: [
      { label: "Mass per blade", value: `${IEA15_OVERVIEW.bladeMassT.toFixed(1)} t`, src: "iea15-tabular" },
      { label: "Three blades", value: t(N.blades.massKg), src: "iea15-tabular" },
    ],
    rates: [{ label: "Blades", src: "carroll2016", row: "Blades" }],
    failureModes: [
      { text: "Leading-edge erosion from rain droplet and hailstone impact.", src: "keegan2013" },
    ],
    maintenance: [],
    massT: kgToT(N.blades.massKg),
  },
  {
    item: 2,
    ids: ["hub"],
    title: "Hub and pitch system",
    brief: "Carries blades, houses pitch",
    role: "Cast hub that carries the three blades and transfers their torque to the main shaft; it houses the pitch bearings and actuators.",
    facts: [
      { label: "Hub system", value: t(N.hub_system.massKg), src: "iea15-tabular" },
      { label: "of which the hub casting", value: `${IEA15_OVERVIEW.hubMassT.toFixed(1)} t`, src: "iea15-tabular" },
      { label: "Hub diameter", value: `${IEA15_OVERVIEW.hubDiameterM} m`, src: "iea15-tabular" },
      { label: "Hub material", value: "cast iron", src: "iea15-ontology" },
    ],
    rates: [
      { label: "Hub", src: "carroll2016", row: "Hub" },
      { label: "Pitch / Hydraulic", src: "carroll2016", row: "Pitch / Hydraulic" },
    ],
    failureModes: [],
    maintenance: [
      {
        text: "Pitch / hydraulic is the most frequently failing sub-assembly in the offshore data set (1.076 failures per turbine per year), so it deserves a place on every service visit.",
        src: "carroll2016",
        derived: true,
      },
    ],
    massT: kgToT(N.hub_system.massKg),
  },
  {
    item: 3,
    ids: ["shaft"],
    title: "Main shaft",
    brief: "Carries rotor torque",
    role: "Short hollow low-speed shaft bolted to the hub: carries rotor torque to the generator rotor while the main bearings take the rotor weight and thrust.",
    facts: [
      { label: "Mass", value: t(N.lss.massKg), src: "iea15-tabular" },
      { label: "Diameter / wall", value: `${O.lssDiameterM} m / ${O.lssWallM} m`, src: "iea15-ontology" },
      { label: "Speed", value: "rotor speed (direct drive, no gearbox)", src: "iea15-tabular" },
    ],
    rates: [],
    failureModes: [],
    maintenance: [],
    massT: kgToT(N.lss.massKg),
  },
  {
    item: 4,
    ids: ["bearing"],
    title: "Main bearings and turret",
    brief: "Carry rotor weight and thrust",
    role: "Two main bearings on the stationary turret (nose) support the rotor: one locates the shaft axially, the other lets it float with thermal growth.",
    facts: [
      { label: "Bearing types (mb1 / mb2)", value: `${O.mb1Type} / ${O.mb2Type}`, src: "iea15-ontology" },
      { label: "Bearing masses (mb1 / mb2)", value: `${t(N.mb1.massKg)} / ${t(N.mb2.massKg)}`, src: "iea15-tabular" },
      { label: "Hub flange → mb1 / mb1 → mb2", value: `${O.distanceHubMbM} m / ${O.distanceMbMbM} m`, src: "iea15-ontology" },
      { label: "Turret (nose) diameter", value: `${O.noseDiameterM} m`, src: "iea15-ontology" },
      { label: "Turret (nose) mass", value: t(N.nose.massKg), src: "iea15-tabular" },
    ],
    rates: [],
    failureModes: [
      { text: "Main-bearing failure rates over a 20-year life can be as high as 30 %.", src: "hart2020" },
      { text: "Damage mechanisms: classical fatigue, micro-pitting, spalling, smearing, abrasive wear from debris and fretting.", src: "hart2020" },
      { text: "Micro-pitting results from an insufficient local lubricant film; grease-lubricated bearings are more likely to run starved.", src: "hart2020" },
    ],
    maintenance: [
      { text: "Monitor vibration (ball-pass frequency) and main-bearing temperature — the signals industry uses most.", src: "hart2020" },
      { text: "Main-bearing faults are indicated fairly consistently 5–6 months before failure: act on the trend.", src: "hart2020" },
      { text: "Keep the automatic re-greasing system working: grease starvation drives micro-pitting.", src: "hart2020", derived: true },
    ],
    massT: kgToT(N.mb1.massKg + N.mb2.massKg + N.nose.massKg),
  },
  {
    item: 5,
    ids: ["brake"],
    title: "Rotor brake and lock",
    brief: "Holds the rotor for service",
    role: "Holds the rotor still for maintenance and stops it in an emergency; the lock pins it mechanically before anyone enters the hub.",
    facts: [{ label: "Mass", value: t(N.brake.massKg), src: "iea15-tabular" }],
    rates: [],
    failureModes: [],
    maintenance: [],
    massT: kgToT(N.brake.massKg),
  },
  {
    item: 6,
    ids: ["generator"],
    title: "Direct-drive generator (PMSG)",
    brief: "Torque to electrical power",
    role: "Permanent-magnet synchronous generator turning at rotor speed: the outer rotor carries the magnets, the stator windings deliver variable-frequency power to the converter.",
    facts: [
      { label: "Mass (rotor + stator)", value: `${t(N.generator.massKg)} (${t(N.generator_rotor.massKg)} + ${t(N.generator_stator.massKg)})`, src: "iea15-tabular" },
      { label: "Length along the shaft", value: `${O.generatorLengthM} m`, src: "iea15-ontology" },
      { label: "Rated efficiency", value: `${(IEA15_OVERVIEW.generatorEfficiency * 100).toFixed(1)} %`, src: "iea15-tabular" },
      { label: "Share of nacelle mass", value: `${((N.generator.massKg / N.nacelle.massKg) * 100).toFixed(0)} %`, src: "iea15-tabular" },
    ],
    rates: [
      { label: "PMG generator", src: "carroll2015", perYear: CARROLL_2015.pmgGenerator },
      { label: "Generator (geared, induction)", src: "carroll2016", row: "Generator" },
    ],
    failureModes: [
      { text: "In the PMG population, lubrication and cooling made up about 89.5 % of generator failures.", src: "carroll2015" },
    ],
    maintenance: [
      { text: "Put the generator's lubrication and cooling circuits first in inspections.", src: "carroll2015", derived: true },
    ],
    massT: kgToT(N.generator.massKg),
  },
  {
    item: 7,
    ids: ["bedplate"],
    title: "Bedplate",
    brief: "Main load path to the tower",
    role: "Main load path of the nacelle: carries the turret, bearings and generator and passes every rotor load into the yaw bearing and tower.",
    facts: [
      { label: "Mass", value: t(N.bedplate.massKg), src: "iea15-tabular" },
      { label: "Wall thickness", value: `${O.bedplateWallM} m`, src: "iea15-ontology" },
    ],
    rates: [],
    failureModes: [],
    maintenance: [],
    massT: kgToT(N.bedplate.massKg),
  },
  {
    item: 8,
    ids: ["yaw", "yaw_brake"],
    title: "Yaw system and brakes",
    brief: "Turns the nacelle into the wind",
    role: "Yaw bearing and drives turn the nacelle into the wind; the yaw brakes hold the heading against the rotor's yaw moment.",
    facts: [
      { label: "Mass", value: t(N.yaw.massKg), src: "iea15-tabular" },
      { label: "Yaw rate", value: `${O.yawRateDegS.toFixed(2)} °/s`, src: "iea15-ontology" },
      { label: "Brake calipers", value: "4 hydraulic calipers", src: "model" },
    ],
    rates: [{ label: "Yaw System", src: "carroll2016", row: "Yaw System" }],
    failureModes: [],
    maintenance: [],
    massT: kgToT(N.yaw.massKg),
  },
  {
    item: 9,
    ids: ["converter"],
    title: "Power converter",
    brief: "Variable frequency to 50 Hz",
    role: "Fully rated back-to-back converter: rectifies the generator's variable-frequency output and feeds 50 Hz power to the grid at the set power factor.",
    facts: [
      { label: "Mass", value: t(N.converter.massKg), src: "iea15-tabular" },
      { label: "Location", value: "up-tower (in the nacelle)", src: "iea15-ontology" },
    ],
    rates: [
      { label: "Fully rated converter (PMG)", src: "carroll2015", perYear: CARROLL_2015.frcConverter },
      { label: "Power Supply / Converter", src: "carroll2016", row: "Power Supply / Converter" },
    ],
    failureModes: [
      { text: "The cooling system caused over 44 % of fully rated converter failures; control modules came second, electrical connections third.", src: "carroll2015" },
      { text: "Fully rated converters failed over 5 times as often as the partially rated converters of DFIG turbines.", src: "carroll2015" },
    ],
    maintenance: [
      { text: "Check the converter cooling circuit first: it is the largest single cause of converter failures.", src: "carroll2015", derived: true },
    ],
    massT: kgToT(N.converter.massKg),
  },
  {
    item: 10,
    ids: ["transformer"],
    title: "Step-up transformer",
    brief: "Steps up to array voltage",
    role: "Raises the converter output to the array voltage (66 kV at SB-510) in the nacelle, so the cables down the tower carry a small current.",
    facts: [
      { label: "Mass", value: t(N.transformer.massKg), src: "iea15-tabular" },
      { label: "Location", value: "up-tower (in the nacelle)", src: "iea15-ontology" },
      { label: "Rating in this model", value: "16 MVA, 66 kV, Dyn11, ONAN", src: "model" },
    ],
    rates: [{ label: "Transformer", src: "carroll2016", row: "Transformer" }],
    failureModes: [],
    maintenance: [
      { text: "Wind-turbine transformers are specified to IEC 60076-16.", src: "iec60076-16" },
      { text: "If the transformer is mineral-oil filled, trend dissolved gas analysis (DGA) and interpret it per IEC 60599.", src: "iec60599" },
    ],
    massT: kgToT(N.transformer.massKg),
  },
  {
    item: 11,
    ids: ["coolant_skid", "cooler"],
    title: "Cooling system",
    brief: "Cools generator and converter",
    role: "Water-glycol loop that takes heat from the generator and converter to the roof cooler, which rejects it to the outside air.",
    facts: [
      { label: "HVAC mass", value: t(N.hvac.massKg), src: "iea15-tabular" },
      { label: "Heat at rated power in this model", value: "≈ 665 kW", src: "model" },
    ],
    rates: [
      { label: "Heaters / Coolers", src: "carroll2016", row: "Heaters / Coolers" },
      { label: "Grease / Oil / Cooling Liq.", src: "carroll2016", row: "Grease / Oil / Cooling Liq." },
    ],
    failureModes: [
      { text: "In the PMG population, lubrication and cooling made up about 89.5 % of generator failures and the cooling system over 44 % of converter failures.", src: "carroll2015" },
    ],
    maintenance: [
      { text: "Treat coolant flow, temperature and leak checks as generator and converter checks.", src: "carroll2015", derived: true },
    ],
    massT: kgToT(N.hvac.massKg),
  },
  {
    item: 12,
    ids: ["hpu"],
    title: "Hydraulic power unit",
    brief: "Hydraulic pressure for the brakes",
    role: "Pump, reservoir and accumulator that supply pressure to the hydraulic brakes (and the pitch cylinders in hydraulic-pitch designs).",
    facts: [{ label: "Pressure / pump in this model", value: "210 bar · 6.5 kW", src: "model" }],
    rates: [{ label: "Pitch / Hydraulic", src: "carroll2016", row: "Pitch / Hydraulic" }],
    failureModes: [],
    maintenance: [],
  },
  {
    item: 13,
    ids: ["control_cabinet"],
    title: "Control and safety cabinets",
    brief: "Control and safety logic",
    role: "Turbine controller (pitch, torque and yaw control) and the independent safety system that trips the turbine.",
    facts: [{ label: "Safety PLC in this model", value: "IEC 61508 SIL 3", src: "model" }],
    rates: [
      { label: "Controls", src: "carroll2016", row: "Controls" },
      { label: "Contactor / Circuit Breaker / Relay", src: "carroll2016", row: "Contactor / Circuit Breaker / Relay" },
      { label: "Electrical Components", src: "carroll2016", row: "Electrical Components" },
    ],
    failureModes: [],
    maintenance: [],
  },
  {
    item: 14,
    ids: ["ups"],
    title: "UPS",
    brief: "Backup power on grid loss",
    role: "Battery backup that keeps the controller, safety system and communications alive when the grid is lost.",
    facts: [{ label: "Battery in this model", value: "6.6 kWh VRLA, 15 min", src: "model" }],
    rates: [],
    failureModes: [],
    maintenance: [],
  },
  {
    item: 15,
    ids: ["nacelle"],
    title: "Nacelle cover",
    brief: "Weather-tight housing",
    role: "Weather-tight housing over the machinery; with the internal platforms it gives technicians a working space.",
    facts: [
      { label: "Cover", value: t(N.cover.massKg), src: "iea15-tabular" },
      { label: "Platforms", value: t(N.platform.massKg), src: "iea15-tabular" },
      { label: "Whole nacelle", value: t(N.nacelle.massKg), src: "iea15-tabular" },
    ],
    rates: [],
    failureModes: [],
    maintenance: [],
    massT: kgToT(N.cover.massKg),
  },
  {
    item: 16,
    ids: ["crane_rail"],
    title: "Service crane",
    brief: "Lifts parts inside the nacelle",
    role: "Ceiling crane for lifting tools and replacement parts inside the nacelle.",
    facts: [{ label: "Safe working load in this model", value: "10 t", src: "model" }],
    rates: [],
    failureModes: [],
    maintenance: [],
  },
  {
    item: 17,
    ids: ["fire_suppression"],
    title: "Fire suppression",
    brief: "Gas flooding on fire alarm",
    role: "Gas cylinders and nozzles that flood the protected zones if a fire is detected.",
    facts: [{ label: "In this model", value: "4 × 20 kg HFC-227ea cylinders", src: "model" }],
    rates: [],
    failureModes: [],
    maintenance: [
      { text: "Inspection, maintenance and testing of gaseous systems: ISO 14520-1 clause 9 (containers, hoses, protected enclosure, service schedule).", src: "iso14520-1" },
    ],
  },
  {
    item: 18,
    ids: ["lightning_conductor"],
    title: "Lightning protection",
    brief: "Leads lightning to earth",
    role: "Receptors and down-conductors that carry lightning current from the blades and nacelle to earth without damaging the machinery.",
    facts: [{ label: "Down-conductor in this model", value: "50 mm² copper", src: "model" }],
    rates: [],
    failureModes: [],
    maintenance: [
      { text: "Protection, test methods and damage reporting of the lightning protection system follow IEC 61400-24.", src: "iec61400-24" },
    ],
  },
  {
    item: 19,
    ids: ["anemometer"],
    title: "Met sensors",
    brief: "Wind speed and direction",
    role: "Wind speed and direction on the nacelle roof feed the yaw control and the turbine's start and stop logic.",
    facts: [],
    rates: [{ label: "Sensors", src: "carroll2016", row: "Sensors" }],
    failureModes: [],
    maintenance: [],
  },
  {
    item: 20,
    ids: ["cable_routing"],
    title: "Cable loop",
    brief: "Lets the nacelle yaw",
    role: "Power and control cables hang from the nacelle into the tower in a loop that allows a limited number of yaw turns before untwisting.",
    facts: [{ label: "Yaw turns in this model", value: "± 3.5", src: "model" }],
    rates: [],
    failureModes: [],
    maintenance: [],
  },
];

const BY_ID = new Map<TurbinePartId, AnatomyPart>();
for (const p of NACELLE_ANATOMY) for (const id of p.ids) BY_ID.set(id, p);

/** Anatomy entry for a 3D / drawing part id, if the anatomy covers it. */
export const anatomyOf = (id: TurbinePartId | null | undefined): AnatomyPart | undefined =>
  id ? BY_ID.get(id) : undefined;

export const ANATOMY_IDS: ReadonlySet<TurbinePartId> = new Set(BY_ID.keys());
