import{createServer}from'vite';
const server=await createServer({mode:'e2e',server:{host:'127.0.0.1',port:5370,strictPort:true,fs:{allow:['/workspace']}}});await server.listen();server.printUrls();
