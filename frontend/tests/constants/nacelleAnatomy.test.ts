/**
 * The nacelle anatomy states only what its sources state: every line is
 * sourced, the IEA 15 MW masses add up to the official totals, and the
 * Carroll et al. failure rates match the paper's overall rate and the
 * control-room simulation that uses the same figures.
 */

import { describe, expect, it } from "vitest";

import { ANATOMY_IDS, ANATOMY_SOURCES, NACELLE_ANATOMY, anatomyOf } from "../../src/constants/nacelleAnatomy";
import {
  CARROLL_2015,
  CARROLL_2016,
  CARROLL_2016_OVERALL,
  IEA15_NACELLE,
  IEA15_OVERVIEW,
  carrollTotal,
  type Carroll2016Row,
} from "../../src/constants/reliability";
import { FAILURE_MODES } from "../../src/lib/plant/failures";
import { PART_FOCUS } from "../../src/components/landing/turbine3d/registry/partMeshRegistry";

const kg = (k: keyof typeof IEA15_NACELLE) => IEA15_NACELLE[k].massKg;

describe("nacelle anatomy content", () => {
  it("numbers its items 1…n once each and maps every 3D part id to one entry", () => {
    expect(NACELLE_ANATOMY.map((p) => p.item)).toEqual(NACELLE_ANATOMY.map((_, i) => i + 1));
    const ids = NACELLE_ANATOMY.flatMap((p) => p.ids);
    expect(new Set(ids).size).toBe(ids.length);
    // every id is a selectable part of the 3D view (camera focus exists)
    for (const id of ids) expect(PART_FOCUS[id], id).toBeDefined();
    expect(anatomyOf("generator")?.item).toBe(6);
    expect(ANATOMY_IDS.has("wind")).toBe(false);
  });

  it("names a known source on every fact, rate, failure mode and maintenance line", () => {
    for (const p of NACELLE_ANATOMY) {
      for (const line of [...p.facts, ...p.rates, ...p.failureModes, ...p.maintenance]) {
        expect(ANATOMY_SOURCES[line.src], `${p.title}: ${JSON.stringify(line)}`).toBeDefined();
      }
      // failure modes and maintenance never rest on our own model
      for (const n of [...p.failureModes, ...p.maintenance]) expect(n.src, n.text).not.toBe("model");
      // a Carroll 2016 rate names its row; a Carroll 2015 rate carries its value
      for (const r of p.rates) {
        if (r.src === "carroll2016") expect(CARROLL_2016[r.row as Carroll2016Row], r.label).toBeDefined();
        else expect(r.perYear, r.label).toBeGreaterThan(0);
      }
    }
    // every published source links to its publication or record
    for (const [id, s] of Object.entries(ANATOMY_SOURCES)) {
      if (id !== "model" && id !== "iec60076-16") expect(s.url, id).toMatch(/^https:\/\//);
    }
  });

  it("only writes a percentage or rate into text when the source data says it", () => {
    const text = NACELLE_ANATOMY.flatMap((p) => [...p.failureModes, ...p.maintenance].map((n) => n.text)).join(" ");
    expect(text).toContain(carrollTotal("Pitch / Hydraulic").toFixed(3)); // 1.076
    expect(text).toContain(`${(CARROLL_2015.pmgLubeCoolingShare * 100).toFixed(1)} %`); // 89.5 %
    expect(text).toContain(`over ${CARROLL_2015.frcCoolingShareMin * 100} %`); // over 44 %
    expect(CARROLL_2015.frcConverter / CARROLL_2015.prcConverter).toBeGreaterThan(5); // "over 5 times"
  });
});

describe("IEA 15 MW masses (tabular data)", () => {
  it("components add up to the sheet's own totals", () => {
    // the generator row is the ontology's rounded 368 839 kg; rotor + stator differ by < 1 kg
    expect(Math.abs(kg("generator_rotor") + kg("generator_stator") - kg("generator"))).toBeLessThan(1);
    const aboveYaw = (["mb1", "mb2", "lss", "brake", "generator", "hvac", "nose", "bedplate", "platform", "cover", "transformer", "converter"] as const)
      .reduce((s, k) => s + kg(k), 0);
    expect(aboveYaw).toBeCloseTo(kg("above_yaw"), 3);
    expect(aboveYaw + kg("yaw")).toBeCloseTo(kg("nacelle"), 3);
    expect(kg("nacelle") + kg("hub_system") + kg("blades")).toBeCloseTo(kg("rna"), 3);
    expect(kg("blades") / 3 / 1000).toBeCloseTo(IEA15_OVERVIEW.bladeMassT, 6);
    expect(kg("nacelle") / 1000).toBeCloseTo(IEA15_OVERVIEW.nacelleMassT, 6);
  });

  it("the two main bearings sit 1.2 m apart on the shaft (CoM x)", () => {
    expect(Math.abs(IEA15_NACELLE.mb1.com[0] - IEA15_NACELLE.mb2.com[0])).toBeCloseTo(1.19, 2);
  });
});

describe("Carroll et al. 2016 rates", () => {
  it("sum to the paper's 8.3 failures per turbine per year", () => {
    const total = (Object.keys(CARROLL_2016) as Carroll2016Row[]).reduce((s, r) => s + carrollTotal(r), 0);
    expect(Math.abs(total - CARROLL_2016_OVERALL)).toBeLessThan(0.05);
  });

  it("match the control-room fault simulation (lib/plant/failures)", () => {
    const t = carrollTotal;
    const minor = (r: Carroll2016Row) => CARROLL_2016[r].minorRepair;
    expect(FAILURE_MODES.PITCH_CONTROL_FAULT.rate).toBeCloseTo(t("Pitch / Hydraulic") / 2, 3);
    expect(FAILURE_MODES.HYDRAULIC_PRESSURE_LOW.rate).toBeCloseTo(t("Pitch / Hydraulic") / 2, 3);
    expect(FAILURE_MODES.GENERATOR_WINDING_TEMP.rate).toBeCloseTo(t("Generator"), 3);
    expect(FAILURE_MODES.GENERATOR_WINDING_TEMP.minorShare).toBeCloseTo(minor("Generator") / t("Generator"), 3);
    expect(FAILURE_MODES.VIBRATION_ALARM.rate).toBeCloseTo(t("Blades") + t("Hub"), 3);
    expect(FAILURE_MODES.COOLANT_FLOW_LOW.rate).toBeCloseTo(t("Pumps / Motors") + t("Heaters / Coolers"), 3);
    expect(FAILURE_MODES.BEARING_OVERTEMP.rate).toBeCloseTo(t("Grease / Oil / Cooling Liq."), 3);
    expect(FAILURE_MODES.GRID_FREQUENCY_FAULT.rate).toBeCloseTo(t("Contactor / Circuit Breaker / Relay"), 3);
    expect(FAILURE_MODES.COMMUNICATION_LOSS.rate).toBeCloseTo(t("Controls"), 3);
    expect(FAILURE_MODES.YAW_ERROR.rate).toBeCloseTo(t("Yaw System"), 3);
    expect(FAILURE_MODES.CONVERTER_OVERTEMP.rate).toBeCloseTo(t("Power Supply / Converter"), 3);
    expect(FAILURE_MODES.CONVERTER_OVERTEMP.minorShare).toBeCloseTo(minor("Power Supply / Converter") / t("Power Supply / Converter"), 3);
  });
});
