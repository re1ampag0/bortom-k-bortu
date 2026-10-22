// Isolated output/port: never reuse an old package's preview or overwrite its dist.
import {build,preview} from 'vite';
const outDir='tmp/fx-smooth-b/e2e-dist';
await build({mode:'e2e',build:{outDir,emptyOutDir:true}});
await preview({build:{outDir},preview:{host:'127.0.0.1',port:5283,strictPort:true}});
