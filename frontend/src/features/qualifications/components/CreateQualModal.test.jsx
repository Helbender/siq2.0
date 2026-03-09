import { render, screen } from "@/test/test-utils";
import userEvent from "@testing-library/user-event";
import { CreateQualModal } from "./CreateQualModal";

const mockGet = vi.fn();
const mockPost = vi.fn();

vi.mock("@/api/http", () => ({
  http: {
    get: (...args) => mockGet(...args),
    post: (...args) => mockPost(...args),
  },
}));

vi.mock("@common/CrewTypesProvider", () => ({
  useCrewTypes: () => ({
    getAllCrewTypes: () => ["PILOTO"],
    isLoading: false,
  }),
}));

vi.mock("@/utils/toaster", () => ({
  toaster: {
    create: vi.fn(),
  },
}));

describe("CreateQualModal", () => {
  beforeEach(() => {
    mockGet.mockReset();
    mockPost.mockReset().mockResolvedValue({ data: {} });
    mockGet.mockImplementation((url) => {
      if (url === "/v2/listas") {
        return Promise.resolve({ data: { tipos: ["PILOTO", "OPERADOR CABINE"] } });
      }
      if (url.startsWith("/v2/qualification-groups/")) {
        return Promise.resolve({
          data: [{ value: "GP1", name: "Grupo 1" }],
        });
      }
      return Promise.reject(new Error(`Unexpected GET: ${url}`));
    });
  });

  it("submits qualification form and calls backend with user input with no errors", async () => {
    const user = userEvent.setup();
    render(<CreateQualModal edit={false} />);

    await user.click(screen.getByRole("button", { name: /Nova Qualificação/i }));

    await screen.findByLabelText(/Nome da Qualificação/i);
    await user.type(screen.getByPlaceholderText("Nome da Qualificação"), "Qual Test");
    await user.type(screen.getByPlaceholderText("Validade em dias"), "365");

    const tipoSelect = screen.getByLabelText(/Tipo de Tripulante/i);
    await user.selectOptions(tipoSelect, "PILOTO");

    await vi.waitFor(() => {
      expect(mockGet).toHaveBeenCalledWith(expect.stringContaining("/v2/qualification-groups/"));
    });

    const grupoSelect = await screen.findByLabelText(/Grupo de Qualificação/i);
    await user.selectOptions(grupoSelect, "GP1");

    await user.click(screen.getByRole("button", { name: /Salvar/i }));

    await vi.waitFor(() => {
      expect(mockPost).toHaveBeenCalledWith(
        "/v2/qualificacoes",
        expect.objectContaining({
          nome: "Qual Test",
          validade: "365",
          tipo_aplicavel: "PILOTO",
          grupo: "GP1",
        })
      );
    });
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("does not show error when create succeeds", async () => {
    const user = userEvent.setup();
    render(<CreateQualModal edit={false} />);

    await user.click(screen.getByRole("button", { name: /Nova Qualificação/i }));

    await screen.findByLabelText(/Nome da Qualificação/i);
    await user.type(screen.getByPlaceholderText("Nome da Qualificação"), "Another");
    await user.type(screen.getByPlaceholderText("Validade em dias"), "180");
    await user.selectOptions(screen.getByLabelText(/Tipo de Tripulante/i), "PILOTO");

    await vi.waitFor(() => {
      expect(mockGet).toHaveBeenCalledWith(expect.stringMatching(/\/v2\/qualification-groups\//));
    });

    const grupoSelect = await screen.findByLabelText(/Grupo de Qualificação/i);
    await user.selectOptions(grupoSelect, "GP1");
    await user.click(screen.getByRole("button", { name: /Salvar/i }));

    await vi.waitFor(() => {
      expect(mockPost).toHaveBeenCalled();
    });
    expect(mockPost).toHaveBeenCalledWith("/v2/qualificacoes", expect.any(Object));
  });
});
