// Browser tests of the published site (docs/TZ.md, stage 7): the built site is served by `vite preview`.
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: 'e2e',
  timeout: 180_000,
  fullyParallel: false,
  workers: 1,
  reporter: [['list']],
  use: { baseURL: 'http://localhost:4173/bortom-k-bortu/' },
  projects: [
    { name: 'chromium', use: { browserName: 'chromium' }, grepInvert: /@iphone/ },
    // WebKit is installed on GitHub Actions (E2E_WEBKIT=1); the cloud sessions have only Chromium.
    ...(process.env.E2E_WEBKIT ? [{ name: 'iphone', use: { ...devices['iPhone 15 Pro Max'] }, grep: /@iphone/ }] : []),
  ],
  webServer: [
    {
      command: 'npm run build && npx vite preview --port 4173 --strictPort',
      url: 'http://localhost:4173/bortom-k-bortu/',
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
    },
    // The game server for the network tests (e2e/net.spec.ts): it serves the same built site; rooms in a temporary folder.
    {
      command: 'npm run build:server && node dist-server/main.js --port 8090',
      url: 'http://localhost:8090/health',
      env: { DATA_DIR: 'test-results/server-data', STATIC_DIR: 'dist' },
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
    },
  ],
});
