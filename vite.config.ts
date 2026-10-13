import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

// GitHub Pages serves the site from https://<user>.github.io/bortom-k-bortu/
export default defineConfig({
  base: '/bortom-k-bortu/',
  plugins: [react()],
  // `npm run dev` / `vite preview` next to a game server on port 8080 (`npm run server`): the game goes through it.
  server: { proxy: { '/ws': { target: 'ws://localhost:8080', ws: true } } },
  preview: { proxy: { '/ws': { target: 'ws://localhost:8080', ws: true } } },
  test: {
    include: ['tests/**/*.test.ts'],
  },
});
