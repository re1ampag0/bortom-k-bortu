import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

// GitHub Pages serves the site from https://<user>.github.io/bortom-k-bortu/
export default defineConfig({
  base: '/bortom-k-bortu/',
  plugins: [react()],
  test: {
    include: ['tests/**/*.test.ts'],
  },
});
