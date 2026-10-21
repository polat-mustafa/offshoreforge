/**
 * Exploded-view plumbing: a group that slides its children by its share of
 * the shared explode amount, the frame loop that eases that amount, and a
 * group that hides overlays drawn at the assembled positions while the
 * parts are apart. None of them re-render React per frame.
 */

import { useRef, type ReactNode } from "react";
import type { Group } from "three";
import { useFrame } from "@react-three/fiber";

import { explode, isApart, stage, stepExplode, type ExplodeSpec } from "../model/explode";

export function Exploded({ spec, children }: { spec: ExplodeSpec | undefined; children: ReactNode }) {
  const ref = useRef<Group>(null);
  useFrame(() => {
    const g = ref.current;
    if (!g || !spec) return;
    const s = stage(explode.value, spec.delay);
    g.position.set(spec.offset[0] * s, spec.offset[1] * s, spec.offset[2] * s);
  });
  return <group ref={ref}>{children}</group>;
}

/** Eases explode.value toward explode.target; mount once inside the Canvas. */
export function ExplodeDriver() {
  useFrame((_, dt) => stepExplode(Math.min(dt, 0.1)));
  return null;
}

/** Children drawn at the assembled layout (labels, badges, trays): hidden while apart. */
export function HideWhenApart({ children }: { children: ReactNode }) {
  const ref = useRef<Group>(null);
  useFrame(() => {
    if (ref.current) ref.current.visible = !isApart();
  });
  return <group ref={ref}>{children}</group>;
}
