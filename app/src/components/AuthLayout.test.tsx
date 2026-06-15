import { render, screen, cleanup, fireEvent } from "@testing-library/react";
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
let mockSidebarState = "expanded";
const mockToggleSidebar = vi.fn();

vi.mock("@/components/ui/sidebar", async () => {
  return {
    SidebarProvider: ({ children }: any) => <div data-testid="sidebar-provider">{children}</div>,
    Sidebar: ({ children, collapsible }: any) => <div data-testid="sidebar" data-collapsible={collapsible}>{children}</div>,
    SidebarContent: ({ children }: any) => <div data-testid="sidebar-content">{children}</div>,
    SidebarHeader: ({ children }: any) => <div data-testid="sidebar-header">{children}</div>,
    SidebarFooter: ({ children }: any) => <div data-testid="sidebar-footer">{children}</div>,
    SidebarMenu: ({ children }: any) => <div data-testid="sidebar-menu">{children}</div>,
    SidebarMenuItem: ({ children }: any) => <div data-testid="sidebar-menu-item">{children}</div>,
    SidebarMenuButton: ({ children, onClick }: any) => <button data-testid="sidebar-menu-button" onClick={onClick}>{children}</button>,
    SidebarInset: ({ children }: any) => <div data-testid="sidebar-inset">{children}</div>,
    SidebarTrigger: ({ children }: any) => <div data-testid="sidebar-trigger">{children}</div>,
    useSidebar: () => ({ 
      get state() { return mockSidebarState; }, 
      toggleSidebar: mockToggleSidebar, 
      setOpen: vi.fn(), 
      setOpenMobile: vi.fn() 
    }),
  };
});

let isMobileMock = false;
vi.mock("@/hooks/use-mobile", () => ({
  useIsMobile: () => isMobileMock,
}));

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
    mockSidebarState = "expanded";
    isMobileMock = false;
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
    expect(screen.queryByText("Protected Content")).not.toBeInTheDocument();
  });

  it("renders unauthenticated state and handles sign in click", () => {
    mockUseAuth.mockReturnValue({ isLoading: false, user: null });
    
    // Backup window.location
    const originalLocation = window.location;
    // @ts-expect-error: Cannot delete window.location normally
    delete window.location;
    window.location = { href: "" } as any;

    render(
      <MemoryRouter>
        <AuthLayout>
          <div>Protected Content</div>
        </AuthLayout>
      </MemoryRouter>
    );

    const signInButton = screen.getByRole("button", { name: "Sign in" });
    fireEvent.click(signInButton);
    expect(window.location.href).toBe("/login"); // Check LOGIN_PATH

    // Restore
    window.location = originalLocation;
  });

  it("renders children when authenticated and handles navigation", () => {
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
    
    const menuButtons = screen.getAllByTestId("sidebar-menu-button");
    if (menuButtons.length > 0) {
      fireEvent.click(menuButtons[0]);
    }
  });

  it("handles sidebar resizing", () => {
    mockUseAuth.mockReturnValue({
      isLoading: false,
      user: { id: "123", email: "test@example.com" },
      profile: { full_name: "Test User" },
      signOut: vi.fn(),
    });

    const { container } = render(
      <MemoryRouter>
        <AuthLayout>
          <div>Protected Content</div>
        </AuthLayout>
      </MemoryRouter>
    );

    // Find the resizer div. It's the absolute div with cursor-col-resize
    const resizer = container.querySelector(".cursor-col-resize");
    expect(resizer).toBeInTheDocument();

    if (resizer) {
      fireEvent.mouseDown(resizer);
      fireEvent.mouseMove(document, { clientX: 300 });
      fireEvent.mouseUp(document);
    }
  });

  it("handles collapsed sidebar resizing gracefully", () => {
    mockUseAuth.mockReturnValue({
      isLoading: false,
      user: { id: "123", email: "test@example.com" },
      profile: { full_name: "Test User" },
      signOut: vi.fn(),
    });

    mockSidebarState = "collapsed";

    const { container } = render(
      <MemoryRouter>
        <AuthLayout>
          <div>Protected Content</div>
        </AuthLayout>
      </MemoryRouter>
    );

    const resizer = container.querySelector(".cursor-col-resize");
    if (resizer) {
      fireEvent.mouseDown(resizer);
    }
  });

  it("renders mobile top bar when isMobile is true", () => {
    mockUseAuth.mockReturnValue({
      isLoading: false,
      user: { id: "123", email: "test@example.com" },
      profile: null,
      signOut: vi.fn(),
    });
    isMobileMock = true;

    render(
      <MemoryRouter>
        <AuthLayout>
          <div>Protected Content</div>
        </AuthLayout>
      </MemoryRouter>
    );

    expect(screen.getByTestId("sidebar-trigger")).toBeInTheDocument();
  });

  it("toggles sidebar on header button click", () => {
    mockUseAuth.mockReturnValue({
      isLoading: false,
      user: { id: "123", email: "test@example.com" },
      profile: null,
      signOut: vi.fn(),
    });

    render(
      <MemoryRouter>
        <AuthLayout>
          <div>Protected Content</div>
        </AuthLayout>
      </MemoryRouter>
    );

    const toggleBtn = screen.getByLabelText("Toggle navigation");
    fireEvent.click(toggleBtn);
    expect(mockToggleSidebar).toHaveBeenCalled();
  });
});
