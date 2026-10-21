/**
 * Exploded (anatomy) view of the nacelle: one shared, animated amount and the
 * direction each part travels.
 *
 * `explode.value` (0 = assembled, 1 = fully apart) eases toward
 * `explode.target` in a single frame loop (ExplodeDriver) and every exploding
 * group reads it in its own useFrame, so the animation never re-renders React —
 * the same pattern as the shared rotor phase (hooks/useRotorSpin).
 *
 * Offsets are in the frame of the group a part is drawn in:
 *   yaw frame    metres, +x starboard (the side the cutaway opens), +y up,
 *                +z toward the rotor (model/layout)
 *   shaft frame  metres, +z along the main shaft toward the hub
 * Parts leave in stages (`delay`, a fraction of the travel): the cover lifts
 * first, then the equipment moves out sideways, then the drivetrain and the
 * rotor separate along the shaft — the order a technician would dismantle it.
 */

import type { TurbinePartId } from "../../../../constants/turbinePartEducation";

export const explode = { value: 0, target: 0 };

/** Time constant of the ease [s]: about 1.2 s from assembled to apart. */
export const EXPLODE_TAU_S = 0.28;

export interface ExplodeSpec {
  /** Travel at full explosion [m] in the part's own frame. */
  offset: [number, number, number];
  /** Start of this part's travel, as a fraction of the overall amount (0–0.6). */
  delay: number;
}

/** Yaw-frame parts (nacelle group) and fixed structure. */
export const EXPLODE_YAW: Partial<Record<TurbinePartId | "roof", ExplodeSpec>> = {
  nacelle: { offset: [0, 10, 0], delay: 0 },
  // roof equipment rides up with (and above) the cover
  roof: { offset: [0, 13, 0], delay: 0 },
  crane_rail: { offset: [0, 5, 0], delay: 0.1 },
  fire_suppression: { offset: [0, 3.2, 0], delay: 0.1 },
  control_cabinet: { offset: [-7, 0, 0], delay: 0.2 },
  converter: { offset: [-7.5, 1, 0], delay: 0.2 },
  ups: { offset: [7, 0, 0], delay: 0.2 },
  hpu: { offset: [7.5, 0, 0], delay: 0.2 },
  coolant_skid: { offset: [6, 1.5, 0], delay: 0.2 },
  transformer: { offset: [0, 0, -10], delay: 0.25 },
  bedplate: { offset: [0, -4.5, 0], delay: 0.3 },
  yaw_brake: { offset: [0, -8, 0], delay: 0.35 },
  yaw: { offset: [0, -9.5, 0], delay: 0.35 },
  cable_routing: { offset: [0, -12, 0], delay: 0.4 },
};

/** Shaft-frame parts: apart along the shaft, hub side first. */
export const EXPLODE_SHAFT: Partial<Record<TurbinePartId | "stator", ExplodeSpec>> = {
  hub: { offset: [0, 0, 22], delay: 0.45 }, // the whole rotor, blades included
  shaft: { offset: [0, 0, 14], delay: 0.4 },
  brake: { offset: [0, 3.5, 10], delay: 0.35 },
  generator: { offset: [0, 0, 7], delay: 0.3 }, // outer rotor with the magnets
  stator: { offset: [0, 0, 3], delay: 0.3 },
  bearing: { offset: [0, 0, 0], delay: 0 }, // stays on the bedplate turret
};

/** Smoothstep share of the travel for a part that starts at `delay`. */
export function stage(value: number, delay: number): number {
  const x = Math.min(1, Math.max(0, (value - delay) / (1 - delay)));
  return x * x * (3 - 2 * x);
}

/** One easing step of the shared amount toward its target (frame-rate independent). */
export function stepExplode(dt: number): void {
  const k = 1 - Math.exp(-dt / EXPLODE_TAU_S);
  explode.value += (explode.target - explode.value) * k;
  if (Math.abs(explode.target - explode.value) < 1e-4) explode.value = explode.target;
}

/** True once anything has visibly moved — overlays anchored to the assembled layout hide. */
export const isApart = () => explode.value > 0.02;
