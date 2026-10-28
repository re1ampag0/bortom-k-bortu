import{realpathSync}from'node:fs';
import{createServer}from'vite';
const server=await createServer({mode:'e2e',server:{host:'127.0.0.1',port:Number(process.env.PORT??5431),strictPort:true,fs:{allow:[process.cwd(),realpathSync('node_modules')]}}});
await server.listen();server.printUrls();
for(const signal of['SIGINT','SIGTERM'])process.on(signal,async()=>{await server.close();process.exit()});
