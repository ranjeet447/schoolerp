import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: ".",
  testMatch: ["src/tests/**/*.spec.ts"],
  fullyParallel: true,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: "line",
  timeout: 60_000,
  webServer: {
    command: "pnpm dev --hostname 127.0.0.1 --port 3001",
    url: "http://127.0.0.1:3001",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
  use: {
    baseURL: "http://127.0.0.1:3001",
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
