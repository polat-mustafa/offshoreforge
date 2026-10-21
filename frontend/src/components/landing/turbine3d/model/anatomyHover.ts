/**
 * The part under the pointer in the exploded anatomy view — from the 3D scene,
 * a callout balloon or a row of the parts list — so all three highlight it.
 */

import { create } from "zustand";

import type { TurbinePartId } from "../../../../constants/turbinePartEducation";

interface AnatomyHoverState {
  part: TurbinePartId | null;
  set: (part: TurbinePartId | null) => void;
}

export const useAnatomyHover = create<AnatomyHoverState>((set) => ({
  part: null,
  set: (part) => set((s) => (part === s.part ? s : { part })),
}));
