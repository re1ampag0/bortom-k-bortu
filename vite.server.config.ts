// The game server is bundled from TypeScript into one file for Node.js (`npm run build:server` → dist-server/main.js).
// The engine and the game data go into the bundle; ws and qrcode stay npm dependencies.
import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    ssr: 'server/main.ts',
    outDir: 'dist-server',
    target: 'node22',
    emptyOutDir: true,
    rollupOptions: { output: { entryFileNames: 'main.js', format: 'es' } },
  },
});
