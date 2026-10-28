import {useLayoutEffect,type RefObject} from 'react';
/** Preserve measured sizes; no estimated row heights and no React render from measurement. */
export function useDeferredPaint<T extends HTMLElement>(ref:RefObject<T>,selector:string){
 useLayoutEffect(()=>{
  const root=ref.current;if(!root||!CSS.supports('content-visibility','auto'))return;
  const saved=new Map<HTMLElement,{visibility:string;size:string}>();
  const observer=new ResizeObserver(entries=>{
   const ready=entries.filter(e=>e.contentRect.width>0&&e.contentRect.height>0).map(e=>({node:e.target as HTMLElement,height:e.contentRect.height}));
   for(const {node,height}of ready){node.style.containIntrinsicBlockSize=`auto ${height}px`;node.style.contentVisibility='auto';}
  });
  const restore=(node:HTMLElement)=>{const old=saved.get(node);if(old){node.style.contentVisibility=old.visibility;node.style.containIntrinsicBlockSize=old.size;}};
  const scan=()=>{
   for(const node of saved.keys())if(!root.contains(node)){observer.unobserve(node);restore(node);saved.delete(node);}
   for(const node of root.querySelectorAll<HTMLElement>(selector))if(!saved.has(node)){saved.set(node,{visibility:node.style.contentVisibility,size:node.style.containIntrinsicBlockSize});observer.observe(node);}
  };
  const reset=()=>{observer.disconnect();for(const node of saved.keys())restore(node);saved.clear();scan();};
  const changes=new MutationObserver(records=>{
   // An appended line leaves previous offscreen lines contained. Only changed content is remeasured.
   const edited=new Set<HTMLElement>();
   for(const record of records){let node=record.target instanceof HTMLElement?record.target:record.target.parentElement;while(node&&node!==root){if(saved.has(node)){edited.add(node);break;}node=node.parentElement;}}
   for(const node of edited){restore(node);observer.unobserve(node);observer.observe(node);}scan();
  });changes.observe(root,{childList:true,subtree:true,characterData:true});
  scan();window.addEventListener('resize',reset);document.fonts.addEventListener('loadingdone',reset);
  return()=>{changes.disconnect();observer.disconnect();window.removeEventListener('resize',reset);document.fonts.removeEventListener('loadingdone',reset);for(const node of saved.keys())restore(node);};
 },[ref,selector]);
}
