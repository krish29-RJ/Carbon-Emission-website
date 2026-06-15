import { render, screen, cleanup } from "@testing-library/react";
import { describe, it, expect, afterEach } from "vitest";
import StatCard from "./StatCard";
import { Leaf } from "lucide-react";
import "@testing-library/jest-dom/vitest";

describe("StatCard", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders basic props correctly", () => {
    render(
      <StatCard
        icon={<Leaf data-testid="icon" />}
        iconBg="bg-emerald-500"
        label="Total Impact"
        value="1,200"
        unit="kg"
      />
    );

    expect(screen.getByText("Total Impact")).toBeInTheDocument();
    expect(screen.getByText("1,200")).toBeInTheDocument();
    expect(screen.getByText("kg")).toBeInTheDocument();
    expect(screen.getByTestId("icon")).toBeInTheDocument();
  });

  it("renders positive trend (downward arrow, green text)", () => {
    render(
      <StatCard
        icon={<Leaf />}
        iconBg="bg-emerald-500"
        label="Emissions"
        value={500}
        trend={-12}
        trendLabel="vs last month"
      />
    );

    expect(screen.getByText("12%")).toBeInTheDocument();
    expect(screen.getByText("vs last month")).toBeInTheDocument();
    
    // Check for positive trend color (green text)
    const trendContainer = screen.getByText("12%").closest("div");
    expect(trendContainer).toHaveClass("text-emerald-400");
  });

  it("renders negative trend (upward arrow, red text)", () => {
    render(
      <StatCard
        icon={<Leaf />}
        iconBg="bg-emerald-500"
        label="Emissions"
        value={600}
        trend={5}
        trendLabel="vs last month"
      />
    );

    expect(screen.getByText("5%")).toBeInTheDocument();
    
    // Check for negative trend color (red text)
    const trendContainer = screen.getByText("5%").closest("div");
    expect(trendContainer).toHaveClass("text-red-400");
  });

  it("renders subtext when no trend is provided", () => {
    render(
      <StatCard
        icon={<Leaf />}
        iconBg="bg-emerald-500"
        label="Emissions"
        value={600}
        subtext="Estimated for this month"
      />
    );

    expect(screen.getByText("Estimated for this month")).toBeInTheDocument();
  });
});
