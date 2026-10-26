// Offline/export/measurement harness. It is not an application entry or a test.
import {createRoot} from 'react-dom/client';
import {PreparedScene,sceneUrls} from '../../src/ui/game/scene-window/PreparedScene';
import {createSceneCache} from '../../src/ui/game/scene-window/assets';
import '../../src/ui/fonts';
const q=new URLSearchParams(location.search),family=q.get('family')??'menus',name=q.get('name')??'Main',before=q.has('before');
const folder=family==='menus'?'src/ui/menus':`src/ui/game/${family}-window`,base=before?'/bortom-k-bortu/@fs/workspace/menus-speed-before/':'/bortom-k-bortu/';
const manifest=await fetch(base+folder+'/scenes.json').then(r=>r.json()),original=manifest[name];
const cache=createSceneCache(src=>before?base+folder+'/art/'+src:src.startsWith('art-')?'/bortom-k-bortu/src/ui/game/scene-window/art/'+src:'/bortom-k-bortu/'+folder+'/art/'+src);
const store={get:()=>({busy:true}),subscribe:()=>()=>{}},root=document.getElementById('root')!,react=createRoot(root);
root.style.width=original.width+'px';root.style.height=original.height+'px';
await document.fonts.ready;await cache.prepare(name,sceneUrls(original));
function render(scene:typeof original){react.render(<PreparedScene scene={scene} cache={cache} cacheKey={name} ready={true} store={store} narrow={false}/>);}
render(original);
Object.assign(window,{sceneData:original,sceneCache:cache,renderScene:render});
