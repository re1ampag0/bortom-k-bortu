import {build,preview} from 'vite';
const outDir=process.env.SCENE_E2E_OUT??'tmp/ship-window/e2e-dist';
await build({mode:'e2e',build:{outDir,emptyOutDir:true}});
await preview({build:{outDir},preview:{host:'127.0.0.1',port:Number(process.env.SCENE_E2E_PORT??5325),strictPort:true}});
