import { build, preview } from 'vite';

await build();
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
