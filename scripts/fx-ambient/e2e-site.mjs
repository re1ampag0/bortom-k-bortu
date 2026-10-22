import {build,preview} from 'vite';
const outDir='tmp/fx-ambient/e2e-dist';await build({mode:'e2e',build:{outDir,emptyOutDir:true}});await preview({build:{outDir},preview:{host:'127.0.0.1',port:4191,strictPort:true}});
