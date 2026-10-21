/**
 * Projects every anatomy part's centre (now and assembled) to the viewer's
 * screen once per frame for the exploded-view callouts (model/anatomyCallouts).
 * Mount inside the Canvas; it does nothing unless `active`.
 */

import { useEffect, useRef } from "react";
import { Vector3, type Object3D } from "three";
import { useFrame, useThree } from "@react-three/fiber";

import { NACELLE_ANATOMY } from "../../../../constants/nacelleAnatomy";
import { CALLOUT_ANCHOR, callouts, localCentre, travelOf } from "../model/anatomyCallouts";

interface Anchor {
  item: number;
  obj: Object3D;
  local: Vector3;
  up: number;
}

function findAnchors(scene: Object3D): Anchor[] {
  const out: Anchor[] = [];
  for (const p of NACELLE_ANATOMY) {
    const fixed = CALLOUT_ANCHOR[p.item];
    const ids = fixed ? [fixed.id] : p.ids;
    const obj = ids.map((id) => scene.getObjectByName(id)).find(Boolean);
    if (obj) out.push({ item: p.item, obj, local: localCentre(obj), up: fixed?.up ?? 0 });
  }
  return out;
}

const NOW = new Vector3();
const START = new Vector3();
const TRAVEL = new Vector3();

export function AnatomyProjector({ active }: { active: boolean }) {
  const { scene, camera, size } = useThree();
  const anchors = useRef<Anchor[] | null>(null);
  const frame = useRef(0);

  useEffect(() => {
    anchors.current = null;
    if (!active) callouts.points.clear();
  }, [active, scene]);

  useFrame(() => {
    if (!active) return;
    // (re)find the parts: at the start, after a remount, and twice a second
    // while some are not mounted yet
    const a0 = anchors.current;
    const stale = !a0 || a0.some((a) => !a.obj.parent) || (a0.length < NACELLE_ANATOMY.length && frame.current++ % 30 === 0);
    if (stale) anchors.current = findAnchors(scene);
    for (const a of anchors.current!) {
      NOW.copy(a.local).applyMatrix4(a.obj.matrixWorld);
      NOW.y += a.up;
      START.copy(NOW).sub(travelOf(a.obj, TRAVEL));
      NOW.project(camera);
      START.project(camera);
      let p = callouts.points.get(a.item);
      if (!p) callouts.points.set(a.item, (p = { x: 0, y: 0, x0: 0, y0: 0, on: false }));
      p.x = ((NOW.x + 1) / 2) * size.width;
      p.y = ((1 - NOW.y) / 2) * size.height;
      p.x0 = ((START.x + 1) / 2) * size.width;
      p.y0 = ((1 - START.y) / 2) * size.height;
      p.on = NOW.z < 1 && START.z < 1;
    }
    callouts.draw?.();
  });
  return null;
}
