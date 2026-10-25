// Development-only comparison server. No production configuration is changed.
import{createServer}from'vite';import{resolve}from'node:path';import{realpathSync}from'node:fs';
const kind=process.argv[2]??'after',root=resolve(process.argv[3]??'.'),port=kind==='before'?5361:5362;
const server=await createServer({root,mode:'e2e',configFile:resolve(root,'vite.config.ts'),define:{__APP_COMMIT__:JSON.stringify('scale-compare'),__APP_BUILT__:JSON.stringify('2026-10-25T00:00:00Z')},server:{host:'127.0.0.1',port,strictPort:true,fs:{allow:[root,realpathSync('node_modules')]},proxy:{'/ws':{target:'ws://127.0.0.1:5350',ws:true},'/bortom-k-bortu/lan':{target:'http://127.0.0.1:5350'}}}});await server.listen();server.printUrls();
