import { render, screen } from "@/test/test-utils";
import { Can } from "./Can";

const mockAuthState = { current: { user: { roleLevel: 50 } } };

vi.mock("@/features/auth/contexts/AuthContext", () => ({
  useAuth: () => ({ user: mockAuthState.current.user }),
}));

describe("Can", () => {
  it("renders children when user role level is >= minLevel", () => {
    mockAuthState.current = { user: { roleLevel: 50 } };
    render(
      <Can minLevel={40}>
        <span>Allowed content</span>
      </Can>
    );
    expect(screen.getByText("Allowed content")).toBeInTheDocument();
  });

  it("renders children when user has role.level instead of roleLevel", () => {
    mockAuthState.current = { user: { role: { level: 60 } } };
    render(
      <Can minLevel={40}>
        <span>Allowed content</span>
      </Can>
    );
    expect(screen.getByText("Allowed content")).toBeInTheDocument();
  });

  it("renders fallback when user role level is below minLevel", () => {
    mockAuthState.current = { user: { roleLevel: 30 } };
    render(
      <Can minLevel={40} fallback={<span>No access</span>}>
        <span>Allowed content</span>
      </Can>
    );
    expect(screen.getByText("No access")).toBeInTheDocument();
    expect(screen.queryByText("Allowed content")).not.toBeInTheDocument();
  });

  it("renders nothing when user is null and no fallback", () => {
    mockAuthState.current = { user: null };
    render(
      <Can minLevel={40}>
        <span>Allowed content</span>
      </Can>
    );
    expect(screen.queryByText("Allowed content")).not.toBeInTheDocument();
  });
});
