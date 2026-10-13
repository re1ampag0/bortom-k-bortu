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
  webServer: {
    command: 'npm run build && npx vite preview --port 4173 --strictPort',
    url: 'http://localhost:4173/bortom-k-bortu/',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
