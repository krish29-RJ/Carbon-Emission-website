import { render, screen, cleanup } from "@testing-library/react";
import { describe, it, expect, vi, afterEach } from "vitest";
import { MemoryRouter } from "react-router";
import AuthLayout from "./AuthLayout";
import "@testing-library/jest-dom/vitest";

// Mock the Auth hook
const mockUseAuth = vi.fn();
vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => mockUseAuth(),
}));

// Mock sidebar context so it doesn't crash
vi.mock("@/components/ui/sidebar", async () => {
  return {
    SidebarProvider: ({ children }: any) => <div data-testid="sidebar-provider">{children}</div>,
    Sidebar: ({ children }: any) => <div data-testid="sidebar">{children}</div>,
    SidebarContent: ({ children }: any) => <div data-testid="sidebar-content">{children}</div>,
    SidebarHeader: ({ children }: any) => <div data-testid="sidebar-header">{children}</div>,
    SidebarFooter: ({ children }: any) => <div data-testid="sidebar-footer">{children}</div>,
    SidebarMenu: ({ children }: any) => <div data-testid="sidebar-menu">{children}</div>,
    SidebarMenuItem: ({ children }: any) => <div data-testid="sidebar-menu-item">{children}</div>,
    SidebarMenuButton: ({ children }: any) => <div data-testid="sidebar-menu-button">{children}</div>,
    SidebarInset: ({ children }: any) => <div data-testid="sidebar-inset">{children}</div>,
    SidebarTrigger: ({ children }: any) => <div data-testid="sidebar-trigger">{children}</div>,
    useSidebar: () => ({ state: "expanded", toggleSidebar: vi.fn(), setOpen: vi.fn(), setOpenMobile: vi.fn() }),
  };
});

Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // Deprecated
    removeListener: vi.fn(), // Deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

describe("AuthLayout", () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("renders loading skeleton when isLoading is true", () => {
    mockUseAuth.mockReturnValue({ isLoading: true, user: null });
    render(
      <MemoryRouter>
        <AuthLayout>
          <div>Protected Content</div>
        </AuthLayout>
      </MemoryRouter>
    );

    // Assuming skeleton has this test id, or we just check content is not rendered
    expect(screen.queryByText("Protected Content")).not.toBeInTheDocument();
  });

  it("renders unauthenticated state when user is null", () => {
    mockUseAuth.mockReturnValue({ isLoading: false, user: null });
    render(
      <MemoryRouter>
        <AuthLayout>
          <div>Protected Content</div>
        </AuthLayout>
      </MemoryRouter>
    );

    expect(screen.getByText("Sign in to continue")).toBeInTheDocument();
    expect(screen.getByText("Access to this dashboard requires authentication. Continue to launch the login flow.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Sign in" })).toBeInTheDocument();
    expect(screen.queryByText("Protected Content")).not.toBeInTheDocument();
  });

  it("renders children when authenticated", () => {
    mockUseAuth.mockReturnValue({
      isLoading: false,
      user: { id: "123", email: "test@example.com" },
      profile: { full_name: "Test User" },
      signOut: vi.fn(),
    });

    render(
      <MemoryRouter>
        <AuthLayout>
          <div>Protected Content</div>
        </AuthLayout>
      </MemoryRouter>
    );

    expect(screen.getByText("Protected Content")).toBeInTheDocument();
    expect(screen.getByTestId("sidebar-provider")).toBeInTheDocument();
  });
});
