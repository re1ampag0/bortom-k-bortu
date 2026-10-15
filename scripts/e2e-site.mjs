import { build, preview } from 'vite';

// The e2e build: mode «e2e» keeps «?fxScene» (FxScene.tsx), the build for GitHub Pages (`npm run build`) has none.
await build({ mode: 'e2e' });
const server = await preview({
  preview: { host: '127.0.0.1', port: 4173, strictPort: true },
});
for (const httpServer of server.httpServer ? [server.httpServer] : []) {
  httpServer.on('error', (error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
console.log('E2E site ready at http://127.0.0.1:4173/bortom-k-bortu/');
