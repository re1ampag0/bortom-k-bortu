// Isolated output/port for the addressed e2e runs of fx-smooth-a: never reuse another package's preview.
import {build, preview} from 'vite';
const outDir = 'tmp/fx-smooth-a/e2e-dist';
await build({mode: 'e2e', logLevel: 'warn', build: {outDir, emptyOutDir: true}});
await preview({build: {outDir}, preview: {host: '127.0.0.1', port: 4193, strictPort: true}});
