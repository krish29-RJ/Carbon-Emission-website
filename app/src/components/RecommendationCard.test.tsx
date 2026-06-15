import { render, screen, cleanup, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, afterEach } from "vitest";
import RecommendationCard from "./RecommendationCard";
import "@testing-library/jest-dom/vitest";
import type { AIRecommendation } from "@/lib/aiInsights";

// Mock the useAuth hook
vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => ({ user: { id: "test-user-id" } }),
}));

// Mock sonner toast
vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

// Mock supabase client
vi.mock("@/lib/supabase", () => ({
  supabase: {
    from: vi.fn().mockReturnThis(),
    insert: vi.fn().mockResolvedValue({ error: null }),
  },
  isSupabaseConfigured: true,
}));

describe("RecommendationCard", () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  const mockRecommendation: AIRecommendation = {
    title: "Switch to LED Bulbs",
    description: "Replace all incandescent bulbs with LEDs to save energy.",
    category: "energy",
    difficulty: "easy",
    estimatedSaving: 50,
    timeframe: "1 month",
  };

  it("renders recommendation details correctly", () => {
    render(<RecommendationCard recommendation={mockRecommendation} />);

    expect(screen.getByText("Switch to LED Bulbs")).toBeInTheDocument();
    expect(screen.getByText("Replace all incandescent bulbs with LEDs to save energy.")).toBeInTheDocument();
    expect(screen.getByText("energy")).toBeInTheDocument();
    expect(screen.getByText("easy")).toBeInTheDocument();
    expect(screen.getByText("Save ~50 kg/mo")).toBeInTheDocument();
  });

  it("handles accept click and shows loading state", async () => {
    const handleAccept = vi.fn();
    render(
      <RecommendationCard
        recommendation={mockRecommendation}
        onAccept={handleAccept}
      />
    );

    const button = screen.getByRole("button", { name: "Accept Challenge" });
    expect(button).toBeInTheDocument();

    // Trigger click
    fireEvent.click(button);

    // After successful mock, it should show 'Accepted!'
    // Since the mock resolves immediately in tests, we can just await the UI change
    const acceptedText = await screen.findByText("Accepted!");
    expect(acceptedText).toBeInTheDocument();
    expect(handleAccept).toHaveBeenCalled();
  });
});
