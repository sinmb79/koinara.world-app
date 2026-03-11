import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { AppProvider } from "../src/state/AppContext";
import { SubmitPage } from "../src/pages/SubmitPage";

describe("submit page", () => {
  it("shows collective gating when prompt becomes large", async () => {
    render(
      <MemoryRouter>
        <AppProvider>
          <SubmitPage />
        </AppProvider>
      </MemoryRouter>
    );

    const textarea = screen.getByPlaceholderText(/ask the network/i);
    fireEvent.change(textarea, { target: { value: "A".repeat(2600) } });

    expect(screen.getAllByText(/collective/i)[0]).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: /submit to koinara/i })[0]).toBeDisabled();
  });

  it("keeps staged networks disabled", async () => {
    render(
      <MemoryRouter>
        <AppProvider>
          <SubmitPage />
        </AppProvider>
      </MemoryRouter>
    );

    fireEvent.click(screen.getAllByLabelText(/ethereum sepolia/i)[0]!);

    expect(screen.getAllByText(/protocol deployment pending on ethereum testnet/i)[0]).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: /submit to koinara/i })[0]).toBeDisabled();
  });
});
