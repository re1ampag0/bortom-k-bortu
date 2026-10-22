// Small weather paint islands. SVG paths/filters/keyframes stay unchanged; only the
// compositor boundary moves to an HTML box. No raster atlas, timers or per-frame DOM work.
function frame(source: SVGSVGElement): HTMLDivElement {
  const box=document.createElement('div');box.className=source.getAttribute('class')??'';
  box.style.cssText=source.style.cssText;
  box.style.position='absolute';
  box.style.width=source.getAttribute('width')+'px';box.style.height=source.getAttribute('height')+'px';
  return box;
}
function svgPart(source: SVGSVGElement,nodes: Element[]): SVGSVGElement {
  const svg=source.cloneNode(false) as SVGSVGElement;
  svg.removeAttribute('class');svg.style.cssText='position:absolute;left:0;top:0;overflow:visible;pointer-events:none';
  const defs=source.querySelector(':scope > defs');if(defs)svg.append(defs.cloneNode(true));
  svg.append(...nodes);return svg;
}
/** Bounds are read only at weather creation, before any frame is displayed. */
function island(source: SVGSVGElement,node: SVGGraphicsElement,pad=4): HTMLDivElement {
  const b=node.getBBox(),box=document.createElement('div'),svg=svgPart(source,[]);
  const x=b.x-pad,y=b.y-pad,w=Math.max(1,b.width+pad*2),h=Math.max(1,b.height+pad*2);
  box.className='wx-island';box.style.cssText=`position:absolute;left:${x}px;top:${y}px;width:${w}px;height:${h}px;pointer-events:none;will-change:transform`;
  svg.setAttribute('width',String(w));svg.setAttribute('height',String(h));svg.setAttribute('viewBox',`${x} ${y} ${w} ${h}`);
  svg.style.overflow='hidden';svg.append(node);box.append(svg);return box;
}
/** The crest's global translation composes with the unchanged local spray animations. */
function wave(source: SVGSVGElement): void {
  const crest=source.querySelector<SVGGElement>('.crest');if(!crest)return;
  const box=frame(source),motion=document.createElement('div');motion.className=crest.getAttribute('class')??'';
  motion.style.cssText='position:absolute;left:0;top:0;width:100%;height:100%;transform-origin:0 0;will-change:transform;pointer-events:none';
  crest.removeAttribute('class');source.replaceWith(box);source.removeAttribute('class');
  source.style.cssText='position:absolute;left:0;top:0;overflow:visible;opacity:1;pointer-events:none';
  motion.append(source);box.append(motion);
  // Local spray must not invalidate the otherwise static SVG of the moving crest.
  for(const drop of crest.querySelectorAll<SVGGraphicsElement>('.sp')){
    const flight=document.createElement('div');flight.className=drop.getAttribute('class')??'';
    flight.style.cssText='position:absolute;left:0;top:0;width:0;height:0;transform-origin:0 0;will-change:transform,opacity;pointer-events:none';
    drop.removeAttribute('class');
    const art=island(source,drop);art.style.willChange='auto';flight.append(art);motion.append(flight);
  }
}
/** Rain sheets / whitecaps / distant lightning each keep their existing keyframe class. */
function storm(source: SVGSVGElement,soft: boolean): void {
  const box=frame(source),children=[...source.children],style=source.querySelector(':scope > style');
  let staticNodes: Element[]=[];
  const flush=()=>{if(staticNodes.length){box.append(svgPart(source,staticNodes));staticNodes=[];}};
  for(const node of children){
    if(node.tagName==='defs'||node.tagName==='style')continue;
    const animated=node.classList.contains('wx-loop')?node:node.querySelector('.wx-loop');
    if(!animated){staticNodes.push(node);continue;}
    flush();
    const motion=document.createElement('div');motion.className=animated.getAttribute('class')??'';
    motion.style.cssText='position:absolute;left:0;top:0;width:0;height:0;transform-origin:0 0;will-change:transform,opacity;pointer-events:none';
    // Opacity keyframes override the presentation attribute, rather than multiplying it.
    if(animated.matches('.wc,.bo'))animated.removeAttribute('opacity');
    animated.removeAttribute('class');
    const art=island(source,node as SVGGraphicsElement,soft?110:4);art.style.willChange='auto';
    motion.append(art);box.append(motion);
  }
  flush();if(style)box.querySelector('svg')!.append(style);source.replaceWith(box);
}
/** One bounded surface around the whirlpool, keeping all of its original painter order.
 * Stroke-dashoffset still paints, but never invalidates an SVG as large as the sea. */
function maelstrom(source: SVGSVGElement): void {
  const box=frame(source),group=document.createElementNS(source.namespaceURI,'g') as SVGGElement;
  const style=source.querySelector(':scope > style');
  group.append(...[...source.children].filter(node=>!node.matches('defs,style')));source.append(group);
  const art=island(source,group);if(style)art.querySelector('svg')!.append(style);
  box.append(art);source.replaceWith(box);
}
/** Reefs: the surf scales about its original (0,4) centre, under each unchanged rock. */
function reefs(source: SVGSVGElement): void {
  const box=frame(source),style=source.querySelector(':scope > style');
  for(const rock of source.querySelectorAll<SVGGElement>(':scope > g')){
    const surf=rock.querySelector<SVGGraphicsElement>('.sf');if(!surf)continue;
    const anchor=document.createElement('div'),m=rock.transform.baseVal.consolidate()?.matrix;
    anchor.style.cssText='position:absolute;left:0;top:0;width:0;height:0;transform-origin:0 0;pointer-events:none';
    if(m)anchor.style.transform=`matrix(${m.a},${m.b},${m.c},${m.d},${m.e},${m.f})`;
    const motion=document.createElement('div');motion.className=surf.getAttribute('class')??'';
    motion.style.cssText='position:absolute;left:0;top:0;width:0;height:0;transform-origin:0px 4px;will-change:transform,opacity;pointer-events:none';
    surf.removeAttribute('class');surf.removeAttribute('style');
    const art=island(source,surf);art.style.willChange='auto';motion.append(art);
    anchor.append(motion,svgPart(source,[...rock.children]));box.append(anchor);
  }
  if(style)box.querySelector('svg')!.append(style);
  source.replaceWith(box);
}
export function compositeWeather(source: SVGSVGElement,key: string,soft: boolean): void {
  if(key==='wave')wave(source);
  else if(key==='storm')storm(source,soft);
  else if(key==='maelstrom')maelstrom(source);
  else if(key==='reefs')reefs(source);
}
