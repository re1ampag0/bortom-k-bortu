// The same art as legends.ts, prepared outside the rendered document. No gameplay RNG is used here.
import {bigShip} from '../art/bigShips';
import {gapBox, type FxCtx} from './primitives';
import {warmSprites, type SpriteSpec} from './sprites';
const R1=(n:number)=>Math.round(n*10)/10;
const COMPANY=bigShip('company',0,0,1);
const prepared=new WeakMap<HTMLElement,string>();
export function armadaGeometry(ctx:FxCtx){
 const W=ctx.board.clientWidth,g=gapBox(ctx),phone=W<701,n=phone?4:6;
 const k=R1(Math.min(.86,(W/(n*1.4))/120,(g.h*.5)/78)*100)/100;
 return{W,g,phone,n,k,key:`armada-ship-${k}`};
}
const svg=(box:[number,number,number,number],content:string)=>`<svg aria-hidden="true" viewBox="${box.join(' ')}" width="${box[2]}" height="${box[3]}" style="left:${box[0]}px;top:${box[1]}px">${content}</svg>`;
export function prepareArmadaSprites(ctx:FxCtx):void {
 const {k,key,phone,n}=armadaGeometry(ctx);
 if(prepared.get(ctx.board)===key)return;
 prepared.set(ctx.board,key);
 const hull=svg([-66,-82,136,100],COMPANY);
 const wake=svg([-46*k-16,-4,218*k+24,30],`<path d="M${R1(40*k)} 2 C${R1(70*k)} 4 ${R1(110*k)} 10 ${R1(160*k)} 6 M${R1(40*k)} 6 C${R1(70*k)} 10 ${R1(110*k)} 18 ${R1(160*k)} 16" fill="none" stroke="#eef6f8" stroke-width="2" stroke-linecap="round" opacity=".75"/><path d="M${R1(-46*k)} 1 q-8 2 -12 6 M${R1(-46*k)} 4 q-6 3 -9 8" stroke="#fff" stroke-width="1.6" fill="none" stroke-linecap="round"/>`);
 const ship=`<div data-sprite-node="pitch" class="lg-pitch">${wake}<div data-sprite-node="recoil" class="lg-recoil"><div class="sprite-art" style="transform:scale(${k})">${hull}</div></div></div>`;
 const specs:SpriteSpec[]=[{key,html:ship,count:n}];
 // Canonical gradients/circles. Size and placement belong to HTML wrappers, not animated SVG attributes.
 for(const name of ['light','dark']){
  const stops=name==='light'?'<stop offset="0" stop-color="#ffffff"/><stop offset=".5" stop-color="#e9e5dc" stop-opacity=".92"/><stop offset=".8" stop-color="#c8c1b4" stop-opacity=".55"/><stop offset="1" stop-color="#a59d90" stop-opacity="0"/>':'<stop offset="0" stop-color="#8a847a"/><stop offset=".55" stop-color="#5e5850" stop-opacity=".85"/><stop offset=".8" stop-color="#36322c" stop-opacity=".55"/><stop offset="1" stop-color="#000000" stop-opacity="0"/>';
  specs.push({key:`armada-smoke-${name}`,html:svg([-1,-1,2,2],`<defs><radialGradient id="spriteSmoke" cx=".42" cy=".38" r=".62">${stops}</radialGradient></defs><circle r="1" fill="url(#spriteSmoke)"/>`),count:phone?48:96});
 }
 specs.push({key:'armada-ball',html:svg([-6,-6,12,12],'<circle r="5" fill="#1a1714"/><circle cx="-1.4" cy="-1.6" r="1.7" fill="#9a948b"/>'),count:36});
 specs.push({key:'armada-shadow',html:svg([-6,-3,12,6],'<ellipse rx="5" ry="2" fill="#000" opacity=".3"/>'),count:36});
 warmSprites(ctx.board,specs);
}
