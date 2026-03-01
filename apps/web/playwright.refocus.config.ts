import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: ".",
  testMatch: ["src/tests/refocus-*.spec.ts"],
  fullyParallel: false,
  retries: 0,
  workers: 1,
  reporter: "line",
  timeout: 60_000,
  webServer: {
    command: "pnpm dev --hostname 127.0.0.1 --port 3002",
    url: "http://127.0.0.1:3002",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
  use: {
    baseURL: "http://127.0.0.1:3002",
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
