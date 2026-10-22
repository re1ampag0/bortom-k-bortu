import config from '../../playwright.config';
export default {
  ...config,
  testDir: process.cwd() + '/e2e',
  use: {...config.use, baseURL: 'http://127.0.0.1:4193/bortom-k-bortu/'},
  webServer: {command: 'node scripts/fx-smooth-a/e2e-site.mjs', url: 'http://127.0.0.1:4193/bortom-k-bortu/', cwd: process.cwd(), reuseExistingServer: false, timeout: 180000},
  projects: config.projects?.filter((project) => project.name === 'chromium'),
};
