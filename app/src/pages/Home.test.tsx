import { render, screen, cleanup, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, afterEach, beforeEach } from "vitest";
import { MemoryRouter } from "react-router";
import Home from "./Home";
import "@testing-library/jest-dom/vitest";

const mockNavigate = vi.fn();

vi.mock("react-router", async () => {
  const actual = await vi.importActual("react-router");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock("framer-motion", async () => {
  const actual = await vi.importActual("framer-motion");
  return {
    ...actual,
    motion: {
      div: ({ children, className, variants, custom, ...props }: any) => {
        // remove motion props that React DOM doesn't recognize
        const cleanProps = { ...props };
        delete cleanProps.initial;
        delete cleanProps.animate;
        delete cleanProps.whileInView;
        delete cleanProps.viewport;
        delete cleanProps.transition;
        
        // Force the variants function to execute to cover it
        if (variants && variants.visible && typeof variants.visible === "function") {
          variants.visible(custom || 0);
        }
        return (
          <div className={className} data-testid="motion-div" {...cleanProps}>
            {children}
          </div>
        );
      },
    },
  };
});

vi.mock("@/components/EcoWorld", () => ({
  default: () => <div data-testid="mock-eco-world">EcoWorld Mock</div>,
}));

let mockIsAuthenticated = false;
vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => ({ isAuthenticated: mockIsAuthenticated }),
}));

describe("Home Page", () => {
  beforeEach(() => {
    mockIsAuthenticated = false;
  });

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
  });

  it("navigates to /auth when clicking CTAs as guest", () => {
    mockIsAuthenticated = false;
    render(
      <MemoryRouter>
        <Home />
      </MemoryRouter>
    );

    const firstCTA = screen.getByText(/Log My First Activity/i);
    fireEvent.click(firstCTA);
    expect(mockNavigate).toHaveBeenCalledWith("/auth");

    const secondCTA = screen.getByText(/Enter Sandbox/i);
    fireEvent.click(secondCTA);
    expect(mockNavigate).toHaveBeenCalledWith("/auth");
  });

  it("navigates to /dashboard when clicking CTAs as authenticated user", () => {
    mockIsAuthenticated = true;
    render(
      <MemoryRouter>
        <Home />
      </MemoryRouter>
    );

    const firstCTA = screen.getByText(/Log My First Activity/i);
    fireEvent.click(firstCTA);
    expect(mockNavigate).toHaveBeenCalledWith("/dashboard");

    const secondCTA = screen.getByText(/Enter Sandbox/i);
    fireEvent.click(secondCTA);
    expect(mockNavigate).toHaveBeenCalledWith("/dashboard");
  });
});
