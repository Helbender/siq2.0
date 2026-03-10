import { render, screen } from "@/test/test-utils";
import { HealthCard } from "./HealthCard";

const mockGet = vi.fn();

vi.mock("@/app/config/http", () => ({
  http: {
    get: (...args) => mockGet(...args),
  },
}));

describe("HealthCard", () => {
  beforeEach(() => {
    mockGet.mockReset();
  });

  it("shows loading state before health check resolves", async () => {
    mockGet.mockImplementation(() => new Promise(() => {}));
    render(<HealthCard />);
    expect(screen.getByText("Server Status")).toBeInTheDocument();
    expect(screen.queryByText("Online")).not.toBeInTheDocument();
    expect(screen.queryByText("Offline")).not.toBeInTheDocument();
  });

  it("shows Online when health check succeeds", async () => {
    mockGet.mockResolvedValue({ data: { status: "ok" } });
    render(<HealthCard />);
    await screen.findByText("Online");
    expect(screen.getByText("Online")).toBeInTheDocument();
  });

  it("shows Offline when health check fails", async () => {
    mockGet.mockRejectedValue(new Error("Network error"));
    render(<HealthCard />);
    await screen.findByText("Offline");
    expect(screen.getByText("Offline")).toBeInTheDocument();
  });
});
