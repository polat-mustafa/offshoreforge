import { fireEvent, render, screen } from "@testing-library/react";
import { Group, Mesh, BoxGeometry, Vector3 } from "three";
import { describe, expect, it, vi } from "vitest";

import { localCentre, travelOf } from "../../../../src/components/landing/turbine3d/model/anatomyCallouts";
import { useAnatomyHover } from "../../../../src/components/landing/turbine3d/model/anatomyHover";
import { AnatomyPanel } from "../../../../src/components/landing/turbine3d/ui/AnatomyPanel";
import { NACELLE_ANATOMY } from "../../../../src/constants/nacelleAnatomy";

describe("exploded-view callouts", () => {
  it("trace a part back to where it sits assembled, through every exploding ancestor", () => {
    // yawed nacelle (90°), a part 3 m starboard pulled 7 m out sideways, inside a group lifted 2 m
    const yaw = new Group();
    yaw.rotation.y = Math.PI / 2;
    const outer = new Group();
    outer.userData.exploded = true;
    outer.position.set(0, 2, 0);
    const inner = new Group();
    inner.userData.exploded = true;
    inner.position.set(7, 0, 0);
    const part = new Mesh(new BoxGeometry(1, 1, 1));
    part.position.set(3, 0, 0);
    yaw.add(outer);
    outer.add(inner);
    inner.add(part);
    yaw.updateWorldMatrix(true, true);

    const now = localCentre(part).applyMatrix4(part.matrixWorld);
    const assembled = now.clone().sub(travelOf(part));
    // the travel is rotated with the yaw: +x in the nacelle is −z in the world
    expect(travelOf(part).distanceTo(new Vector3(0, 2, -7))).toBeLessThan(1e-9);
    expect(assembled.distanceTo(new Vector3(0, 0, -3))).toBeLessThan(1e-9);
  });

  it("does not count groups that are not part of the explosion", () => {
    const g = new Group();
    g.position.set(5, 5, 5);
    const part = new Mesh(new BoxGeometry(1, 1, 1));
    g.add(part);
    g.updateWorldMatrix(true, true);
    expect(travelOf(part).length()).toBe(0);
  });
});

describe("AnatomyPanel", () => {
  it("lists every part with its item number; a row highlights its part and opens its card", () => {
    const onSelect = vi.fn();
    render(<AnatomyPanel selected={null} onSelect={onSelect} />);
    for (const p of NACELLE_ANATOMY) expect(screen.getByText(p.title)).toBeDefined();
    const generator = screen.getByText("Direct-drive generator (PMSG)").closest("button")!;
    fireEvent.pointerEnter(generator);
    expect(useAnatomyHover.getState().part).toBe("generator");
    fireEvent.click(generator);
    expect(onSelect).toHaveBeenCalledWith("generator");
  });

  it("shows the selected part's sourced card and steps to the neighbouring parts", () => {
    const onSelect = vi.fn();
    render(<AnatomyPanel selected="generator" onSelect={onSelect} />);
    expect(screen.getByText("6 / 20")).toBeDefined();
    expect(screen.getByText("Typical failures")).toBeDefined();
    fireEvent.click(screen.getByLabelText("Next part"));
    expect(onSelect).toHaveBeenLastCalledWith("bedplate");
    fireEvent.click(screen.getByLabelText("Previous part"));
    expect(onSelect).toHaveBeenLastCalledWith("brake");
    fireEvent.click(screen.getByText("All parts"));
    expect(onSelect).toHaveBeenLastCalledWith(null);
  });
});
