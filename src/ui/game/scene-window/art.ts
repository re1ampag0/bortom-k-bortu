// Vite emits each content-addressed file once, even when several families use it.
const files=import.meta.glob('./art/*',{eager:true,query:'?url',import:'default'}) as Record<string,string>;
export const sharedSceneArt=(name:string)=>files['./art/'+name];
