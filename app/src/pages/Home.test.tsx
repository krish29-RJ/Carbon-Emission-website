import { render, screen, cleanup } from "@testing-library/react";
import { describe, it, expect, vi, afterEach } from "vitest";
import { MemoryRouter } from "react-router";
import Home from "./Home";
import "@testing-library/jest-dom/vitest";

// Mock framer-motion to avoid animation issues in jsdom
vi.mock("framer-motion", async () => {
  const actual = await vi.importActual("framer-motion");
  return {
    ...actual,
    motion: {
      div: ({ children, className, ...props }: any) => (
        <div className={className} data-testid="motion-div" {...props}>
          {children}
        </div>
      ),
    },
  };
});

// Mock EcoWorld to avoid rendering complex 3D logic
vi.mock("@/components/EcoWorld", () => ({
  default: () => <div data-testid="mock-eco-world">EcoWorld Mock</div>,
}));

// Mock the Auth hook
vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => ({ isAuthenticated: false }),
}));

describe("Home Page", () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("renders the hero section with core title", () => {
    render(
      <MemoryRouter>
        <Home />
      </MemoryRouter>
    );

    expect(screen.getByText(/Carbon tracking,/i)).toBeInTheDocument();
    expect(screen.getByText(/visually & emotionally alive./i)).toBeInTheDocument();
  });

  it("renders all key feature sections", () => {
    render(
      <MemoryRouter>
        <Home />
      </MemoryRouter>
    );

    expect(screen.getByText("Smart Activity Tracker")).toBeInTheDocument();
    expect(screen.getByText("Dynamic 3D Living World")).toBeInTheDocument();
    expect(screen.getByText("AI Personal Coach")).toBeInTheDocument();
    expect(screen.getByText("Social Competition")).toBeInTheDocument();
    expect(screen.getByText("Gamification Layer")).toBeInTheDocument();
  });

  it("renders the CTA buttons", () => {
    render(
      <MemoryRouter>
        <Home />
      </MemoryRouter>
    );

    const ctaButtons = screen.getAllByText(/Log My First Activity|Enter Sandbox/i);
    expect(ctaButtons.length).toBeGreaterThan(0);
    expect(screen.getByText("View Methodology")).toBeInTheDocument();
  });

  it("renders the mocked EcoWorld component", () => {
    render(
      <MemoryRouter>
        <Home />
      </MemoryRouter>
    );

    expect(screen.getByTestId("mock-eco-world")).toBeInTheDocument();
  });
});
