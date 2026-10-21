/**
 * The part under the pointer in the exploded anatomy view, and where the
 * pointer is (client px) so the hover card can follow it.
 */

import { create } from "zustand";

import type { TurbinePartId } from "../../../../constants/turbinePartEducation";

interface AnatomyHoverState {
  part: TurbinePartId | null;
  x: number;
  y: number;
  set: (part: TurbinePartId | null, x?: number, y?: number) => void;
}

export const useAnatomyHover = create<AnatomyHoverState>((set) => ({
  part: null,
  x: 0,
  y: 0,
  set: (part, x, y) =>
    set((s) =>
      part === s.part && x === undefined ? s : { part, x: x ?? s.x, y: y ?? s.y },
    ),
}));
