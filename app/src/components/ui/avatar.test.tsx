import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import "@testing-library/jest-dom/vitest";
import { Avatar, AvatarImage, AvatarFallback } from "./avatar";

describe("Avatar Components", () => {
  it("renders avatar fallback and image", () => {
    render(
      <Avatar>
        <AvatarImage src="https://github.com/shadcn.png" alt="@shadcn" />
        <AvatarFallback>CN</AvatarFallback>
      </Avatar>
    );

    // Fallback renders before image loads or if it fails
    expect(screen.getByText("CN")).toBeInTheDocument();
  });
});
