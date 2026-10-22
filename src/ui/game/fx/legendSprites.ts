// Static Legend art stays in the detached sprite bank. Only its HTML motion wrappers move.
import {bigShip,type BigShipKind} from '../art/bigShips';
import {bottleArt,CORK} from '../art/legendArt';
import {spriteReady,takeSprite,type SpriteSpec} from './sprites';
import type {FxCtx} from './primitives';
const svg=(x:number,y:number,w:number,h:number,art:string)=>`<svg aria-hidden="true" width="${w}" height="${h}" viewBox="${x} ${y} ${w} ${h}" style="left:${x}px;top:${y}px">${art}</svg>`;
export function legendSpriteSpecs():SpriteSpec[]{
 return [
  {key:'legend-bottle',count:1,html:svg(-130,-65,280,130,bottleArt())},
  {key:'legend-cork',count:1,html:svg(-20,-20,40,40,CORK)},
  {key:'legend-drop',count:1,html:''},
  ...(['pearl','revenge','endeavour','dutch'] as BigShipKind[]).map(kind=>({key:`legend-mini-${kind}`,count:1,html:`<div data-sprite-node="rock" class="lg-rock">${svg(-60,-60,120,90,bigShip(kind,0,0,.62,false,`data-kind="${kind}"`))}</div>`})),
 ];
}
const planes=new WeakMap<Element,HTMLElement>();
export function legendSprite(ctx:FxCtx,host:Element,key:string):HTMLElement|null {
 if(!spriteReady(ctx.board,key))return null;
 let plane=planes.get(host);
 if(!plane?.isConnected){plane=document.createElement('div');plane.className='volley-sprite-plane';plane.style.zIndex=(host as SVGElement).style.zIndex;host.after(plane);planes.set(host,plane);}
 return takeSprite(ctx,key,plane).root;
}
