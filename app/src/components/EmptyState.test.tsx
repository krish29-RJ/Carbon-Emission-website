import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { describe, it, expect, vi, afterEach } from "vitest";
import { EmptyState } from "./EmptyState";
import { Leaf } from "lucide-react";
import "@testing-library/jest-dom/vitest";

describe("EmptyState", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders correctly without action button", () => {
    render(
      <EmptyState
        icon={<Leaf data-testid="leaf-icon" />}
        title="No Data Yet"
        description="Please check back later."
      />
    );

    expect(screen.getByText("No Data Yet")).toBeInTheDocument();
    expect(screen.getByText("Please check back later.")).toBeInTheDocument();
    expect(screen.getByTestId("leaf-icon")).toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("renders action button and triggers callback when clicked", () => {
    const handleClick = vi.fn();
    render(
      <EmptyState
        icon={<Leaf />}
        title="No Data Yet"
        description="Please check back later."
        action={{
          label: "Add Data",
          onClick: handleClick,
        }}
      />
    );

    const button = screen.getByRole("button", { name: "Add Data" });
    expect(button).toBeInTheDocument();
    
    fireEvent.click(button);
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});
