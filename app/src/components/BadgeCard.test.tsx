import { render, screen, cleanup, fireEvent } from "@testing-library/react";
import { describe, it, expect, afterEach } from "vitest";
import BadgeCard from "./BadgeCard";
import "@testing-library/jest-dom/vitest";

describe("BadgeCard", () => {
  afterEach(() => {
    cleanup();
  });

  const mockBadge = {
    id: "1",
    name: "First Steps",
    description: "Logged your first activity",
    icon: "Flag",
    category: "general",
    earned: true,
  };

  it("renders earned badge correctly", () => {
    render(<BadgeCard badge={mockBadge} />);
    
    expect(screen.getByText("First Steps")).toBeInTheDocument();
    
    // The description should not be visible initially (tooltip hidden)
    expect(screen.queryByText("Logged your first activity")).not.toBeInTheDocument();
  });

  it("renders locked badge correctly", () => {
    render(<BadgeCard badge={{ ...mockBadge, earned: false }} />);
    
    expect(screen.getByText("First Steps")).toBeInTheDocument();
  });

  it("shows tooltip on hover", () => {
    render(<BadgeCard badge={mockBadge} />);
    
    const cardContainer = screen.getByText("First Steps").closest("div") as HTMLElement;
    
    // Trigger hover
    fireEvent.mouseEnter(cardContainer);
    
    // Now tooltip should be visible
    expect(screen.getByText("First Steps", { selector: "p" })).toBeInTheDocument();
    expect(screen.getByText("Logged your first activity")).toBeInTheDocument();
    
    // Trigger unhover
    fireEvent.mouseLeave(cardContainer);
    
    // Tooltip should be hidden again
    expect(screen.queryByText("Logged your first activity")).not.toBeInTheDocument();
  });
});
