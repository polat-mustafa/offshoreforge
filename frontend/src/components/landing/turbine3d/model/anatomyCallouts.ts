/**
 * Callouts of the exploded anatomy view: a numbered balloon on every part
 * (the item numbers of drawing A-01) and a dashed trace line back to where the
 * part sits when assembled.
 *
 * AnatomyProjector (inside the Canvas) writes the screen positions here every
 * frame and calls `draw`; AnatomyCallouts (DOM, outside the Canvas) moves its
 * elements in `draw` — no React re-render per frame, the same pattern as
 * model/explode.
 */

import { Box3, Vector3, type Object3D } from "three";

import type { TurbinePartId } from "../../../../constants/turbinePartEducation";

export interface CalloutPoint {
  /** Balloon: the part's centre now [px, viewer frame]. */
  x: number;
  y: number;
  /** Where that centre sits when assembled [px]. */
  x0: number;
  y0: number;
  /** In front of the camera. */
  on: boolean;
}

export const callouts: { points: Map<number, CalloutPoint>; draw: (() => void) | null } = {
  points: new Map(),
  draw: null,
};

/**
 * Which object anchors an item's balloon (the first of its ids, unless set
 * here) and how far above its centre [m]. The blades take the hub's centre
 * lifted toward a blade root: a blade's own centre is 40 m out and turns with
 * the rotor.
 */
export const CALLOUT_ANCHOR: Partial<Record<number, { id: TurbinePartId; up: number }>> = {
  1: { id: "hub", up: 11 },
};

/** Centre of an object's bounds in its own frame, so it follows the object as it moves, yaws or turns. */
export function localCentre(o: Object3D): Vector3 {
  o.updateWorldMatrix(true, true);
  const c = new Box3().setFromObject(o).getCenter(new Vector3());
  return o.worldToLocal(c);
}

const A = new Vector3();
const B = new Vector3();

/** World travel of an object in the exploded view: the offsets of its exploding ancestors (scene/Exploded). */
export function travelOf(o: Object3D, out: Vector3 = new Vector3()): Vector3 {
  out.set(0, 0, 0);
  for (let p: Object3D | null = o; p; p = p.parent) {
    if (!p.userData.exploded || !p.parent) continue;
    A.set(0, 0, 0).applyMatrix4(p.parent.matrixWorld);
    B.copy(p.position).applyMatrix4(p.parent.matrixWorld);
    out.add(B.sub(A));
  }
  return out;
}
