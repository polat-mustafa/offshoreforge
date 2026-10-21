import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { NacelleSchematic } from "../../../../src/components/landing/turbine3d/schematic/NacelleSchematic";
import { useLandingStore } from "../../../../src/store/landingStore";

describe("NacelleSchematic", () => {
  it("draws the four engineering sheets with a title block", () => {
    render(<NacelleSchematic turbineId="WTG-09" />);
    expect(screen.getByText("SB5-WTG-E-001")).toBeDefined();
    fireEvent.click(screen.getByRole("tab", { name: /M-01/ }));
    expect(screen.getByText("SB5-WTG-M-001")).toBeDefined();
    fireEvent.click(screen.getByRole("tab", { name: /P-01/ }));
    expect(screen.getByText("SB5-WTG-P-001")).toBeDefined();
    fireEvent.click(screen.getByRole("tab", { name: /A-01/ }));
    expect(screen.getByText("SB5-WTG-A-001")).toBeDefined();
  });

  it("A-01 lists every anatomy part with its IEA mass and selects it from the row or the drawing", () => {
    render(<NacelleSchematic turbineId="WTG-09" />);
    fireEvent.click(screen.getByRole("tab", { name: /A-01/ }));
    for (let i = 1; i <= 20; i++) expect(screen.getByTestId(`anatomy-row-${i}`)).toBeDefined();
    // generator: 368.8 t (IEA 15 MW tabular data), PMG rate 0.076 (Carroll 2015)
    const row = screen.getByTestId("anatomy-row-6");
    expect(row.textContent).toContain("368.8");
    expect(row.textContent).toContain("0.076 b");
    fireEvent.click(row);
    expect(useLandingStore.getState().selectedTurbinePart).toBe("generator");
    fireEvent.click(screen.getByTestId("anatomy-transformer"));
    expect(useLandingStore.getState().selectedTurbinePart).toBe("transformer");
  });

  it("selects a part from its symbol and offers the 3D fly-to", () => {
    render(<NacelleSchematic turbineId="WTG-09" />);
    fireEvent.click(screen.getByRole("tab", { name: /M-01/ }));
    fireEvent.click(screen.getByTestId("sym-generator"));
    expect(useLandingStore.getState().selectedTurbinePart).toBe("generator");
    expect(screen.getByText("Open in 3D →")).toBeDefined();
  });
});
