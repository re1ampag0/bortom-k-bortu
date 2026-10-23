// Original sinking art, prepared off-document. HTML wrappers carry movement; the SVG artwork stays bounded.
import {CELLS} from '../art/cells';
import {uidSvg} from '../art/bigShips';
import {boardW,bx,plank,filters,ignoreFxBudget,type FxCtx} from './primitives';
import {particleArt} from './particleArt';
import {takeSprite,type SpriteSpec} from './sprites';
const R1=(n:number)=>Math.round(n*10)/10;
const SAILOR = CELLS.CREW.replace(/<svg[^>]*>/, '').replace('</svg>', '');
const CAPTAIN = SAILOR.replace('fill="#ece4d0"', 'fill="#8a1c14"').replace(/fill="#3a2a22"/g, 'fill="#5a1410"').replace('fill="#9b2a1f"', 'fill="#1c1814"').replace('fill="#7e1f16"', 'fill="none"').replace('stroke="#4e120c" stroke-width=".25"', 'stroke="none"')
  + '<path d="M1.2 4.8 Q7 -1.8 12.8 4.8 Q10.2 3.4 7 4.2 Q3.8 3.4 1.2 4.8 Z" fill="#1c1814" stroke="#e0bd62" stroke-width=".45"/><path d="M6.4 2.2 L7 1.4 L7.6 2.2 Z" fill="#e0bd62"/>';
const OAR = '<g class="oar"><path d="M0 0 L22 9" stroke="#6b4422" stroke-width="1.6" stroke-linecap="round"/><path d="M19 7.6 L27 11.4 L26 13.4 L18.4 9.6 Z" fill="#8a5a32" stroke="#2a1a0c" stroke-width=".5"/></g>';
export const SINK_DEBRIS = [
  '<rect x="-9" y="-2.4" width="18" height="4.8" rx="1" fill="#a8703a" stroke="#3a2412" stroke-width=".7"/>',
  '<g><ellipse rx="6" ry="7.4" fill="#8a5a32" stroke="#3a2412" stroke-width=".7"/><path d="M-6 -2.4 H6 M-6 2.4 H6" stroke="#3a3530" stroke-width="1.1"/></g>',
  '<rect x="-16" y="-1.6" width="32" height="3.2" rx="1" fill="#6b4422" stroke="#22190f" stroke-width=".6"/>',
  '<path d="M-6 -5 L6 -3 L4 5 L-5 4 Z" fill="#e8dcc0" stroke="#22190f" stroke-width=".6"/>',
];

const svg=(x:number,y:number,w:number,h:number,art:string)=>`<svg aria-hidden="true" width="${w}" height="${h}" viewBox="${x} ${y} ${w} ${h}" style="left:${x}px;top:${y}px">${art}</svg>`;
export const SINK_WAKE='<path d="M0 0 q-10 3 -22 1 M0 4 q-10 4 -24 6" fill="none" stroke="#eef6f8" stroke-width="1.2" stroke-linecap="round"/>';
const boatArt=(color:string,live:boolean)=>{
 const man=(x:number,kk:number,body:string)=>`<g transform="translate(${(x-7*kk).toFixed(1)} ${(-.6-16.8*kk).toFixed(1)}) scale(${kk})">${body}</g>`;
 const HULL_B = 'M-28 -3 Q-26 7 -10 9 L14 9 Q27 7 31 -5 Q12 -1 -28 -3 Z';
    const art = uidSvg(`<g><g>
${man(-9, 0.82, SAILOR)}${man(5, 0.82, SAILOR)}${man(-21, 0.98, CAPTAIN)}
<ellipse cx="2" cy="11" rx="32" ry="3" fill="#0b2430" opacity=".35"/>
<g opacity=".22" transform="matrix(1 0 0 -.35 0 12.2)"><path d="M-28 -3 Q-26 7 -10 9 L14 9 Q27 7 31 -5 Q12 -1 -28 -3 Z" fill="#5a3418"/></g>
<defs><linearGradient id="pgBoatH" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#a06a3a"/><stop offset=".5" stop-color="#7a4a26"/><stop offset="1" stop-color="#4a2a12"/></linearGradient>
<linearGradient id="pgBoatL" x1="0" x2="1"><stop offset="0" stop-color="#fff" stop-opacity=".12"/><stop offset=".6" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".25"/></linearGradient>
<clipPath id="pgBoatC"><path d="${HULL_B}"/></clipPath></defs>
<path d="${HULL_B}" fill="url(#pgBoatH)" stroke="#2a1a0c" stroke-width="1"/>
<g clip-path="url(#pgBoatC)">
<path d="M-27.4 -.6 Q2 2.6 30.2 -2.6 M-26.4 2.4 Q2 5.8 28.6 .6 M-24.6 5.4 Q0 8.4 25.4 3.8" fill="none" stroke="#2a1a0c" stroke-width=".8"/>
<path d="M-27.4 0 Q2 3.2 30 -2 M-26.2 3 Q2 6.4 28.2 1.2 M-24.2 6 Q0 9 25 4.4" fill="none" stroke="#d9a46c" stroke-width=".45" opacity=".7"/>
${[-20, -12, -4, 4, 12, 20].map((x) => `<circle cx="${x}" cy="${(0.6 + Math.abs(x) * 0.02).toFixed(1)}" r=".45" fill="#e0c08a"/><circle cx="${x + 2}" cy="${(3.7 + Math.abs(x) * 0.02).toFixed(1)}" r=".45" fill="#e0c08a"/>`).join('')}
<path d="${HULL_B}" fill="url(#pgBoatL)"/></g>
<path d="M-28.6 -3.4 Q12 -1.4 31.4 -5.6" fill="none" stroke="#3a2210" stroke-width="2.4" stroke-linecap="round"/><path d="M-28 -3.8 Q12 -1.8 31 -6" fill="none" stroke="#e0b07a" stroke-width="1" stroke-linecap="round"/>
<path d="M-28.4 -3.6 Q-27.6 3 -25 7.2" fill="none" stroke="#3a2210" stroke-width="1.6"/><path d="M31.2 -5.6 Q32.6 -7.6 32 -9.4" fill="none" stroke="#3a2210" stroke-width="1.8" stroke-linecap="round"/>
<path d="M-10 9.4 L14 9.4" stroke="#2a1a0c" stroke-width="1.4" stroke-linecap="round"/>
${[-9, 5].map((x) => `<path d="M${x - 1} ${(-2.6 - (x + 28) * 0.006).toFixed(1)} v-1.6 M${x + 1} ${(-2.8 - (x + 28) * 0.006).toFixed(1)} v-1.6" stroke="#2b2f31" stroke-width=".6"/>`).join('')}
<path d="M-2 9 q-.6 .8 0 1.6 M20 7.4 q.6 .8 0 1.6" stroke="#eef6f8" stroke-width=".6" fill="none" opacity=".6"/>
<path d="M-29 -2 V-22" stroke="#4a2a12" stroke-width="1"/><path d="M-29 -22 L-17 -19 L-29 -16 Z" fill="${color}">${live ? '<animateTransform attributeName="transform" type="skewY" values="0;-8;0;6;0" dur="1.2s" repeatCount="indefinite"/>' : ''}</path>
<path d="M28 -5 L33 -14" stroke="#4a2a12" stroke-width="1"/><g transform="translate(33 -15)"><circle r="6" fill="#ffd27a" opacity=".35">${live ? '<animate attributeName="opacity" values=".35;.2;.4;.25;.35" dur=".9s" repeatCount="indefinite"/>' : ''}</circle><rect x="-1.8" y="-2.6" width="3.6" height="4.6" rx=".8" fill="#ffe7a0" stroke="#3a2412" stroke-width=".6"/><path d="M-1.8 -2.6 H1.8 M0 -2.6 V-4" stroke="#3a2412" stroke-width=".6"/></g></g></g>`, 'boat');

 return svg(-34,-2,68,16,'<path d="M-30 6 Q-2 10 30 4" fill="none" stroke="#eef6f8" stroke-width="2" opacity=".7"/>')+
 [-9,5].map((x,i)=>`<div style="position:absolute;left:${x}px;top:1px"><div data-sprite-node="oar${i}">${svg(-30,-30,64,64,OAR)}</div></div>`).join('')+svg(-42,-30,88,60,art);
};
export function sinkSpecs(ctx:FxCtx):SpriteSpec[]{
 const small=boardW(ctx)<=700,live=filters(ctx),dpr=small?Math.min(devicePixelRatio,2):devicePixelRatio;
 for(const art of [...SINK_DEBRIS,SINK_WAKE])particleArt(art,dpr);
 const swR=(i:number)=>R1((small?70:140)*(1-i*26/140)),r=small?72:142;
 const specs:SpriteSpec[]=[{key:'sink-swirl-'+small,count:1,html:svg(-r,-r,r*2,r*2,`<g>${[0,1,2,3].map(i=>`<ellipse rx="${swR(i)}" ry="${R1(swR(i)*.34)}" fill="none" stroke="#e6f2f4" stroke-width="${2-i*.3}" stroke-dasharray="14 10" opacity="${.8-i*.12}"/>`).join('')}</g>`) }];
 for(const ship of ctx.data.ships){
  specs.push({key:'sink-boat-'+ship.code+'-'+live,count:1,html:boatArt(ship.color,live)});
  const b=bx(ctx,plank(ctx,ship.code)),w=b.w-16,h=small?20:30;
  specs.push({key:'sink-bed-'+ship.code+'-'+small+'-'+w,count:1,html:svg(-12,-h*.4,w+24,h*.8,`<defs><radialGradient id="sinkGlow"><stop offset="0" stop-color="#ffc66a" stop-opacity=".6"/><stop offset="1" stop-color="#ffc66a" stop-opacity="0"/></radialGradient></defs><ellipse cx="${R1(w/2)}" cy="0" rx="${R1(w/2+10)}" ry="${R1(h*.32)}" fill="url(#sinkGlow)"/><path d="M0 1 H${R1(w)}" stroke="#ffb347" stroke-width="${R1(h*.1)}" stroke-linecap="round" opacity=".55"${live?' style="filter:blur(2px)"':''}/>`)});
 }
 const wreck=([[0,0,'mast',3.6],[70,6,'barrel',2.8],[-60,10,'plank',3],[130,-4,'plank',3.4],[40,-12,'plank',2.6]] as const).map(([x,y,k,d])=>{
  const art='<ellipse cx="0" cy="4" rx="16" ry="3.4" fill="none" stroke="#e6f2f4" stroke-width="1" opacity=".6"/>'+(k==='mast'?'<rect x="-24" y="-2" width="48" height="4" rx="1.4" fill="#6b4422" stroke="#22190f" stroke-width=".8"/><path d="M-8 -2 L4 -16 L14 -2 Z" fill="#e8dcc0" stroke="#22190f" stroke-width=".7"/>':k==='barrel'?'<ellipse rx="8" ry="6.4" fill="#8a5a32" stroke="#22190f" stroke-width=".8"/><path d="M-3 -6 V6 M3 -6 V6" stroke="#3a3530" stroke-width="1.2"/>':'<rect x="-11" y="-2.6" width="22" height="5.2" rx="1" fill="#a8703a" stroke="#22190f" stroke-width=".7"/>');
  return `<div style="position:absolute;left:${x}px;top:${y}px"><div class="sink-wreck-rock" style="${live?`animation:sink-wreck-rock ${d}s linear infinite;`:''}">${svg(-28,-20,56,40,art)}</div></div>`;
 }).join('');
 specs.push({key:'sink-wreck-'+live,count:4,html:wreck});return specs;
}
export function sinkSticker(ctx:FxCtx,name:string,host:Element=ctx.layer):HTMLElement{
 const root=takeSprite(ctx,name,host).root;return root;
}
export function sinkWreck(ctx:FxCtx,host:Element):HTMLElement{
 const root=sinkSticker(ctx,'sink-wreck-'+filters(ctx),host);
 for(const a of root.getAnimations({subtree:true}))ignoreFxBudget(a);
 return root;
}
