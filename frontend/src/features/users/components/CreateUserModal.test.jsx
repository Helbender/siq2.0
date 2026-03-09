import { render, screen } from "@/test/test-utils";
import userEvent from "@testing-library/user-event";
import { CreateUserModal } from "./CreateUserModal";

const mockOnSubmit = vi.fn();
const mockOnClose = vi.fn();

vi.mock("@features/auth/contexts/AuthContext", () => ({
  useAuth: () => ({ user: { roleLevel: 80 } }),
}));

vi.mock("@common/CrewTypesProvider", () => ({
  useCrewTypes: () => ({
    TipoTripulante: {
      PILOTO: "PILOTO",
      OPERADOR_CABINE: "OPERADOR CABINE",
      COORDENADOR_TATICO: "COORDENADOR TATICO",
      OPERADOR_VIGILANCIA: "OPERADOR VIGILANCIA",
      OPERACOES: "OPERAÇÕES",
    },
    crewTypeToApiFormat: (v) => (v ? v.replace(/\s+/g, "_").replace("OPERAÇÕES", "OPERACOES") : v),
  }),
}));

describe("CreateUserModal", () => {
  beforeEach(() => {
    mockOnSubmit.mockReset().mockResolvedValue(undefined);
    mockOnClose.mockClear();
  });

  it("submits form data with user input and calls backend via onSubmit with no errors", async () => {
    const user = userEvent.setup();
    render(
      <CreateUserModal
        isOpen={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
      />
    );

    await user.type(screen.getByPlaceholderText("Posto"), "Cap");
    await user.type(screen.getByPlaceholderText("NIP"), "12345");
    await user.type(screen.getByPlaceholderText("Primeiro e Último Nome"), "Test User");
    await user.type(screen.getByPlaceholderText("Email"), "test@example.com");

    const submitButton = screen.getByRole("button", { name: /Criar/i });
    await user.click(submitButton);

    expect(mockOnSubmit).toHaveBeenCalledTimes(1);
    const [userNip, formData] = mockOnSubmit.mock.calls[0];
    expect(userNip).toBeNull();
    expect(formData).toMatchObject({
      rank: "Cap",
      nip: "12345",
      name: "Test User",
      email: "test@example.com",
    });
    expect(mockOnClose).toHaveBeenCalled();
  });

  it("does not show error when submit succeeds", async () => {
    const user = userEvent.setup();
    render(
      <CreateUserModal
        isOpen={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
      />
    );

    await user.type(screen.getByPlaceholderText("Posto"), "Maj");
    await user.type(screen.getByPlaceholderText("NIP"), "67890");
    await user.click(screen.getByRole("button", { name: /Criar/i }));

    await vi.waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalled();
    });
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });
});
