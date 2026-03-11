import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { ProcessShowcase } from "../src/components/ProcessShowcase";

describe("process showcase", () => {
  it("switches to collective messaging for the collective sample", () => {
    render(
      <MemoryRouter>
        <ProcessShowcase />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByRole("button", { name: /collective review/i }));

    expect(screen.getByText("Collective")).toBeInTheDocument();
    expect(screen.getByText(/parallel specialists run in separate lanes/i)).toBeInTheDocument();
  });
});
