import { render, screen, cleanup } from "@testing-library/react";
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
  it("renders correctly for guest users", () => {
    // Mock the implementation for a guest
    (useAuth as any).mockReturnValue({
      user: null,
      profile: null,
      isAuthenticated: false,
      signOut: vi.fn(),
    });

    render(
      <MemoryRouter>
        <AppNavbar />
      </MemoryRouter>
    );

    // Should show "Sign In" and "Get Started" buttons
    expect(screen.getByText("Sign In")).toBeInTheDocument();
    expect(screen.getByText("Get Started")).toBeInTheDocument();
    
    // Brand name should be visible
    expect(screen.getByText("CarbonWise")).toBeInTheDocument();
  });

  it("renders correctly for authenticated users", () => {
    // Mock the implementation for an authenticated user
    (useAuth as any).mockReturnValue({
      user: { email: "test@example.com" },
      profile: { full_name: "John Doe" },
      isAuthenticated: true,
      signOut: vi.fn(),
    });

    render(
      <MemoryRouter>
        <AppNavbar />
      </MemoryRouter>
    );

    // Should NOT show "Sign In" button
    expect(screen.queryByText("Sign In")).not.toBeInTheDocument();
    
    // Should show the user's name
    expect(screen.getByText("John Doe")).toBeInTheDocument();
  });
});
