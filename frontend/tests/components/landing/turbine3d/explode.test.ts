import { describe, expect, it } from "vitest";

import { EXPLODE_SHAFT, EXPLODE_YAW, explode, stage, stepExplode } from "../../../../src/components/landing/turbine3d/model/explode";
import { ANATOMY_IDS } from "../../../../src/constants/nacelleAnatomy";

describe("exploded nacelle", () => {
  it("each part starts after its delay and arrives together at full explosion", () => {
    expect(stage(0.2, 0.3)).toBe(0);
    expect(stage(1, 0.3)).toBe(1);
    let prev = 0;
    for (let v = 0; v <= 1; v += 0.05) {
      const s = stage(v, 0.25);
      expect(s).toBeGreaterThanOrEqual(prev);
      prev = s;
    }
  });

  it("eases to the target in about a second and settles exactly", () => {
    explode.value = 0;
    explode.target = 1;
    for (let t = 0; t < 1.2; t += 1 / 60) stepExplode(1 / 60);
    expect(explode.value).toBeGreaterThan(0.98);
    for (let t = 0; t < 2; t += 1 / 60) stepExplode(1 / 60);
    expect(explode.value).toBe(1);
    explode.target = 0;
    for (let t = 0; t < 4; t += 1 / 60) stepExplode(1 / 60);
    expect(explode.value).toBe(0);
  });

  it("moves only parts the anatomy describes (plus the roof group and the stator)", () => {
    for (const k of Object.keys(EXPLODE_YAW)) if (k !== "roof") expect(ANATOMY_IDS.has(k as never), k).toBe(true);
    for (const k of Object.keys(EXPLODE_SHAFT)) if (k !== "stator") expect(ANATOMY_IDS.has(k as never), k).toBe(true);
  });
});
