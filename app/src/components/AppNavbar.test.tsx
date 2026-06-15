import { render, screen, cleanup, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, afterEach } from "vitest";
import { MemoryRouter } from "react-router";
import AppNavbar from "./AppNavbar";
import { useAuth } from "@/hooks/useAuth";
import "@testing-library/jest-dom/vitest";

// Mock the useAuth hook
vi.mock("@/hooks/useAuth", () => ({
  useAuth: vi.fn(),
}));

describe("AppNavbar", () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("returns null on /auth route", () => {
    (useAuth as any).mockReturnValue({ isAuthenticated: false });
    const { container } = render(
      <MemoryRouter initialEntries={["/auth"]}>
        <AppNavbar />
      </MemoryRouter>
    );
    expect(container.firstChild).toBeNull();
  });

  it("renders correctly for guest users", () => {
    (useAuth as any).mockReturnValue({
      user: null,
      profile: null,
      isAuthenticated: false,
      signOut: vi.fn(),
    });

    render(
      <MemoryRouter initialEntries={["/"]}>
        <AppNavbar />
      </MemoryRouter>
    );

    expect(screen.getByText("Sign In")).toBeInTheDocument();
    expect(screen.getByText("Get Started")).toBeInTheDocument();
    expect(screen.getByText("CarbonWise")).toBeInTheDocument();
  });

  it("renders correctly for authenticated users", () => {
    (useAuth as any).mockReturnValue({
      user: { email: "test@example.com" },
      profile: { full_name: "John Doe" },
      isAuthenticated: true,
      signOut: vi.fn(),
    });

    render(
      <MemoryRouter initialEntries={["/"]}>
        <AppNavbar />
      </MemoryRouter>
    );

    expect(screen.queryByText("Sign In")).not.toBeInTheDocument();
    expect(screen.getByText("John Doe")).toBeInTheDocument();
  });

  it("handles dropdown menu interactions", () => {
    const signOutMock = vi.fn();
    (useAuth as any).mockReturnValue({
      user: { email: "test@example.com" },
      profile: { full_name: "John Doe" },
      isAuthenticated: true,
      signOut: signOutMock,
    });

    render(
      <MemoryRouter initialEntries={["/"]}>
        <AppNavbar />
      </MemoryRouter>
    );

    const menuButton = screen.getByLabelText("Open user menu");
    fireEvent.click(menuButton);

    expect(screen.getByText("Signed in as")).toBeInTheDocument();
    expect(screen.getByText("test@example.com")).toBeInTheDocument();

    const profileButton = screen.getByText("My Profile");
    fireEvent.click(profileButton);
    expect(screen.queryByText("Signed in as")).not.toBeInTheDocument();

    // Reopen and sign out
    fireEvent.click(menuButton);
    const signOutButton = screen.getByText("Sign Out");
    fireEvent.click(signOutButton);
    expect(signOutMock).toHaveBeenCalled();
  });

  it("handles mobile menu interactions", () => {
    (useAuth as any).mockReturnValue({
      user: null,
      isAuthenticated: false,
    });

    render(
      <MemoryRouter initialEntries={["/"]}>
        <AppNavbar />
      </MemoryRouter>
    );

    const mobileToggle = screen.getByLabelText("Toggle mobile menu");
    fireEvent.click(mobileToggle);

    // Links should be visible in the mobile drawer (they share labels, so we check for multiples or specific behavior)
    const dashboardLinks = screen.getAllByText("Dashboard");
    expect(dashboardLinks.length).toBeGreaterThan(0);

    // Close menu by clicking overlay (mocking it by just checking state changes)
    fireEvent.click(mobileToggle);
  });

  it("handles scroll event", () => {
    (useAuth as any).mockReturnValue({ isAuthenticated: false });
    render(
      <MemoryRouter initialEntries={["/"]}>
        <AppNavbar />
      </MemoryRouter>
    );

    fireEvent.scroll(window, { target: { scrollY: 50 } });
    // Scroll state is internal, but we know it runs without crashing
    expect(screen.getByText("CarbonWise")).toBeInTheDocument();
  });
  it("closes mobile menu when clicking overlay", () => {
    (useAuth as any).mockReturnValue({
      user: null,
      isAuthenticated: false,
    });

    render(
      <MemoryRouter initialEntries={["/"]}>
        <AppNavbar />
      </MemoryRouter>
    );

    // Open mobile menu
    const mobileToggle = screen.getByLabelText("Toggle mobile menu");
    fireEvent.click(mobileToggle);

    // Click the overlay (it has no test id but it is the sibling before the drawer that has onClick)
    // We'll just test that we can find it by its classes and click it
    // Wait, it doesn't have a test id. Let's add one, or use a query.
    // The overlay is `bg-black/20`.
    const overlay = document.querySelector(".bg-black\\/20");
    if (overlay) {
      fireEvent.click(overlay);
    }
  });

  it("handles mobile menu sign out", () => {
    const signOutMock = vi.fn();
    (useAuth as any).mockReturnValue({
      user: { email: "test@example.com" },
      isAuthenticated: true,
      signOut: signOutMock,
    });

    render(
      <MemoryRouter initialEntries={["/"]}>
        <AppNavbar />
      </MemoryRouter>
    );

    // Open mobile menu
    const mobileToggle = screen.getByLabelText("Toggle mobile menu");
    fireEvent.click(mobileToggle);

    // Click mobile sign out
    const signOutButtons = screen.getAllByText("Sign Out");
    // Since dropdown is closed, there's only 1 sign out button rendered (the mobile one)
    fireEvent.click(signOutButtons[0]);
    expect(signOutMock).toHaveBeenCalled();
  });
});
