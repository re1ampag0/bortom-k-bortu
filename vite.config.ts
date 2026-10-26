import { defineConfig } from 'vitest/config';
import {compressedAssets} from './scripts/compressed-assets';
import react from '@vitejs/plugin-react';
import { execSync } from 'node:child_process';

/** The commit of the build for ⚙ «Версия»: GitHub Actions gives it; locally — git; in Docker (no .git) — none. */
function commit(): string {
  if (process.env.GITHUB_SHA) return process.env.GITHUB_SHA.slice(0, 7);
  try {
    return execSync('git rev-parse --short HEAD', { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim();
  } catch {
    return '';
  }
}

// GitHub Pages serves the site from https://<user>.github.io/bortom-k-bortu/
export default defineConfig({
  base: '/bortom-k-bortu/',
  plugins: [react(),compressedAssets()],
  define: { __APP_COMMIT__: JSON.stringify(commit()), __APP_BUILT__: JSON.stringify(new Date().toISOString()) },
  // `npm run dev` / `vite preview` next to a game server on port 8080 (`npm run server`): the game goes through it.
  server: { proxy: { '/ws': { target: 'ws://localhost:8080', ws: true } } },
  preview: { proxy: { '/ws': { target: 'ws://localhost:8080', ws: true } } },
  test: {
    include: ['tests/**/*.test.ts'],
  },
});
