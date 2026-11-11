import { defineConfig, devices } from '@playwright/test';

// PW_PORT låter parallella worktrees köra e2e utan att dela dev-server.
const port = Number(process.env['PW_PORT'] ?? 4200);
// Offline-testerna (ticket 08) kräver produktionsbygget med service worker, serverat från dist/.
const offlinePort = Number(process.env['PW_OFFLINE_PORT'] ?? 4280);
const OFFLINE_SPECS = /offline\.spec\.ts$/;

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env['CI'],
  retries: process.env['CI'] ? 2 : 0,
  workers: process.env['CI'] ? 1 : undefined,
  reporter: 'list',
  use: {
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      testIgnore: OFFLINE_SPECS,
      use: { ...devices['Desktop Chrome'], baseURL: `http://localhost:${port}` },
    },
    {
      name: 'offline',
      testMatch: OFFLINE_SPECS,
      use: {
        ...devices['Desktop Chrome'],
        baseURL: `http://localhost:${offlinePort}/yardage/`,
        serviceWorkers: 'allow',
      },
    },
  ],
  webServer: [
    {
      command: `npm start -- --host 0.0.0.0 --port ${port}`,
      url: `http://localhost:${port}`,
      reuseExistingServer: !process.env['CI'],
      timeout: 120 * 1000,
    },
    {
      // Förutsätter `npm run build` (se `npm run check`); servern avbryter annars med tydligt fel.
      command: `node e2e/support/static-server.mjs ${offlinePort}`,
      url: `http://localhost:${offlinePort}/yardage/`,
      reuseExistingServer: !process.env['CI'],
      timeout: 30 * 1000,
    },
  ],
});
