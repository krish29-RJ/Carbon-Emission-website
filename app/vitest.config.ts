import { defineConfig } from "vitest/config";
import path from "path";

const templateRoot = path.resolve(import.meta.dirname);

export default defineConfig({
  root: templateRoot,
  resolve: {
    alias: {
      "@": path.resolve(templateRoot, "src"),
      "@contracts": path.resolve(templateRoot, "contracts"),
      "@assets": path.resolve(templateRoot, "attached_assets"),
    },
  },
  test: {
    environment: "jsdom",
    include: [
      "server/**/*.test.ts",
      "server/**/*.spec.ts",
      "src/**/*.test.ts",
      "src/**/*.spec.ts",
      "src/**/*.test.tsx",
      "src/**/*.spec.tsx"
    ],
  },
});
