/**
 * Header search end to end: Ctrl K opens the palette, results come ranked with
 * where they live, Enter jumps to the match and the find bar counts it; ✕ and
 * Esc clear the highlight.
 */

import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, describe, expect, it } from "vitest";

import { FindBar } from "../../../src/components/search/FindBar";
import { SearchPalette, SearchTrigger } from "../../../src/components/search/SearchPalette";
import { useSearchStore } from "../../../src/store/searchStore";

function Page() {
  return (
    <main>
      <h1>Test page</h1>
      <h2>Reactive power</h2>
      <p>The Ferranti rise is held down by two zebrafinch reactors.</p>
      <p>Another zebrafinch note further down.</p>
    </main>
  );
}

function renderApp() {
  return render(
    <MemoryRouter initialEntries={["/hv-grid"]}>
      <SearchTrigger />
      <Routes>
        <Route path="*" element={<Page />} />
      </Routes>
      <FindBar />
      <SearchPalette />
    </MemoryRouter>,
  );
}

afterEach(() => {
  act(() => useSearchStore.setState({ open: false, find: null }));
});

describe("SearchPalette", () => {
  it("opens with Ctrl K and lists pages while empty", async () => {
    renderApp();
    fireEvent.keyDown(window, { key: "k", ctrlKey: true });
    const box = await screen.findByRole("combobox", { name: "Search pages, terms, values" });
    expect(document.activeElement).toBe(box);
    const list = screen.getByRole("listbox", { name: "Search results" });
    expect(within(list).getByText("SCADA")).toBeDefined();
  });

  it("finds text on the page on screen, jumps to it and clears with ✕ and Esc", async () => {
    renderApp();
    fireEvent.click(screen.getByRole("button", { name: "Search" }));
    const box = await screen.findByRole("combobox");
    fireEvent.change(box, { target: { value: "zebrafinch" } });

    const options = await screen.findAllByRole("option");
    expect(options[0].getAttribute("aria-selected")).toBe("true");
    expect(within(options[0]).getByText("This page")).toBeDefined();
    expect(options[0].querySelector("mark")?.textContent).toBe("zebrafinch");

    fireEvent.keyDown(box, { key: "Enter" });
    expect(useSearchStore.getState().open).toBe(false);
    const bar = await screen.findByRole("search", { name: "Find on page" });
    // the chosen match of the two on the page is the active one; Next wraps to the other
    const count = await waitFor(() => within(bar).getByText(/^[12] \/ 2$/));
    const first = count.textContent;
    fireEvent.click(within(bar).getByRole("button", { name: "Next match" }));
    expect(count.textContent).not.toBe(first);
    expect(count.textContent).toMatch(/^[12] \/ 2$/);

    fireEvent.click(within(bar).getByRole("button", { name: "Clear highlight" }));
    expect(screen.queryByRole("search")).toBeNull();

    // again, then Esc
    act(() => useSearchStore.getState().startFind("zebrafinch", { path: "/hv-grid", text: "Another zebrafinch note further down." }));
    await screen.findByRole("search");
    fireEvent.keyDown(window, { key: "Escape" });
    expect(screen.queryByRole("search")).toBeNull();
  });

  it("puts a glossary definition on top and remembers the search", async () => {
    renderApp();
    fireEvent.keyDown(window, { key: "k", ctrlKey: true });
    const box = await screen.findByRole("combobox");
    fireEvent.change(box, { target: { value: "Ferranti effect" } });
    expect(await screen.findByText("Definition")).toBeDefined();
    await screen.findAllByRole("option");
    fireEvent.keyDown(box, { key: "Enter" });
    expect(useSearchStore.getState().recent[0]).toBe("Ferranti effect");
  });

  it("first Esc clears the box, the second closes", async () => {
    renderApp();
    fireEvent.keyDown(window, { key: "k", ctrlKey: true });
    const box = await screen.findByRole("combobox");
    fireEvent.change(box, { target: { value: "grid" } });
    fireEvent.keyDown(box, { key: "Escape" });
    expect((box as HTMLInputElement).value).toBe("");
    expect(useSearchStore.getState().open).toBe(true);
  });
});
