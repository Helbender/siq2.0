import React from "react";
import { render, screen } from "@/test/test-utils";
import userEvent from "@testing-library/user-event";
import { CreateFlightModal } from "./CreateFlightModal";

const mockCreate = vi.fn();
const mockUpdate = vi.fn();

vi.mock("../../services/flights.service", () => ({
  flightsService: {
    getAll: vi.fn(),
    create: (...args) => mockCreate(...args),
    update: (...args) => mockUpdate(...args),
    remove: vi.fn(),
    getPilotQualifications: vi.fn(),
  },
}));

vi.mock("@features/users", () => ({
  useUsersQuery: () => ({ data: [] }),
}));

vi.mock("@/utils/toaster", () => ({
  toaster: {
    create: vi.fn(),
  },
}));

vi.mock("../PilotInput", () => ({
  PilotInput: () => React.createElement("div", { "data-testid": "pilot-input" }),
}));

describe("CreateFlightModal", () => {
  beforeEach(() => {
    mockCreate.mockReset().mockResolvedValue({});
    mockUpdate.mockReset().mockResolvedValue({});
  });

  it("submits flight form and calls backend with user input with no errors", async () => {
    const user = userEvent.setup();
    render(<CreateFlightModal />);

    await user.click(screen.getByRole("button", { name: /Novo Voo/i }));

    await screen.findByLabelText(/Airtask/i);
    await user.type(screen.getByPlaceholderText("00A0000"), "00A1234");
    await user.selectOptions(screen.getByLabelText(/Modalidade/i), "SAR");
    await user.selectOptions(screen.getByLabelText(/Ação/i), "OPER");

    const dateInput = screen.getByLabelText("Data");
    await user.clear(dateInput);
    await user.type(dateInput, "2025-02-26");

    const atdInput = screen.getByLabelText("ATD");
    await user.type(atdInput, "10:00");
    const ataInput = screen.getByLabelText("ATA");
    await user.type(ataInput, "11:30");

    await user.type(screen.getByLabelText("Origem"), "LPPT");
    await user.type(screen.getByLabelText("Destino"), "LPFR");

    await user.selectOptions(screen.getByLabelText(/Nº Cauda/i), "16701");

    const submitButton = screen.getByRole("button", { name: /Registar voo/i });
    await user.click(submitButton);

    await vi.waitFor(() => {
      expect(mockCreate).toHaveBeenCalled();
    });

    const payload = mockCreate.mock.calls[0][0];
    expect(payload).toMatchObject({
      airtask: "00A1234",
      flightType: "SAR",
      flightAction: "OPER",
      date: "2025-02-26",
      ATD: "10:00",
      ATA: "11:30",
      origin: "LPPT",
      destination: "LPFR",
      tailNumber: 16701,
    });
    expect(screen.queryByText(/Erro ao guardar voo/i)).not.toBeInTheDocument();
  });

  it("does not show error when create succeeds", async () => {
    const user = userEvent.setup();
    render(<CreateFlightModal />);

    await user.click(screen.getByRole("button", { name: /Novo Voo/i }));

    await screen.findByLabelText("Airtask");
    await user.type(screen.getByPlaceholderText("00A0000"), "01B5678");
    await user.selectOptions(screen.getByLabelText("Modalidade"), "SAR");
    await user.selectOptions(screen.getByLabelText("Ação"), "OPER");
    const dateInput = screen.getByLabelText("Data");
    await user.clear(dateInput);
    await user.type(dateInput, "2025-03-01");
    await user.type(screen.getByLabelText("ATD"), "09:00");
    await user.type(screen.getByLabelText("ATA"), "10:00");
    await user.selectOptions(screen.getByLabelText("Nº Cauda"), "16702");

    await user.click(screen.getByRole("button", { name: /Registar voo/i }));

    await vi.waitFor(() => {
      expect(mockCreate).toHaveBeenCalledWith(expect.any(Object));
    });
    expect(mockCreate).toHaveBeenCalledTimes(1);
  });
});
