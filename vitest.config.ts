import { resolve } from "node:path"
import { defineConfig } from "vitest/config"

const launchDirectory = process.cwd()

export default defineConfig({
  test: {
    environment: "jsdom",
    setupFiles: [resolve(launchDirectory, "tests/setup.ts")],
    include: ["tests/**/*.test.ts", "tests/**/*.test.tsx"],
    exclude: ["tests/e2e/**"],
    maxWorkers: 1,
    pool: "threads",
  },
  resolve: {
    preserveSymlinks: true,
    alias: {
      "@": resolve(launchDirectory, "src"),
    },
  },
})
