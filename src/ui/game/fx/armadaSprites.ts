// The same art as legends.ts, prepared outside the rendered document. No gameplay RNG is used here.
import {bigShip, uidSvg} from '../art/bigShips';
import {boardW, A, gapBox, room, smokeJet, ignoreFxBudget, particleCircle, type Pt, type FxCtx} from './primitives';
import {perfOff} from '../perf/state';
import {warmSprites, takeSprite, spriteReady, spriteA, type Sprite, type SpriteSpec} from './sprites';
import {legendGlintSpec} from './legendGlint';
import {sinkSpecs} from './sinkSprites';
import {motionSpecs,motionSignature} from './legendMotionSprites';
import {legendSpriteSpecs} from './legendSprites';
import {reactionWhirlSpec} from './reactionWhirl';
import {volleySize,volleySpriteSpecs} from './volleySprites';
const R1=(n:number)=>Math.round(n*10)/10;
const COMPANY=bigShip('company',0,0,1);
// Static bright artwork: only the wrapper opacity changes, never a moving filter.
const LIT=uidSvg(COMPANY.replace(/(#[0-9a-f]{6}|#[0-9a-f]{3})(?=[";])/gi,(hex)=>{
 const h=hex.length===4?hex.slice(1).split('').map(c=>c+c).join(''):hex.slice(1);
 const rgb=[0,2,4].map(i=>parseInt(h.slice(i,i+2),16)*1.45),lum=.213*rgb[0]+.715*rgb[1]+.072*rgb[2];
 return '#'+rgb.map(v=>Math.round(Math.max(0,Math.min(255,lum+1.2*(v-lum)))).toString(16).padStart(2,'0')).join('');
}),'spriteLit');
const prepared=new WeakMap<HTMLElement,string>();
export function armadaGeometry(ctx:FxCtx){
 const W=boardW(ctx),g=gapBox(ctx),phone=W<701,n=phone?4:6;
 const k=R1(Math.min(.86,(W/(n*1.4))/120,(g.h*.5)/78)*100)/100;
 return{W,g,phone,n,k,key:`armada-ship-${k}`};
}
const svg=(box:[number,number,number,number],content:string)=>`<svg aria-hidden="true" viewBox="${box.join(' ')}" width="${box[2]}" height="${box[3]}" style="left:${box[0]}px;top:${box[1]}px">${content}</svg>`;
export function prepareArmadaSprites(ctx:FxCtx):void {
 const {k,key,phone,n}=armadaGeometry(ctx);
 const signature=key+':'+volleySize(ctx)+':'+motionSignature(ctx);
 if(prepared.get(ctx.board)===signature&&spriteReady(ctx.board,key))return;
 const hull=svg([-66,-82,136,100],COMPANY),lit=svg([-66,-82,136,100],LIT);
 const wake=svg([-46*k-16,-4,218*k+24,30],`<path d="M${R1(40*k)} 2 C${R1(70*k)} 4 ${R1(110*k)} 10 ${R1(160*k)} 6 M${R1(40*k)} 6 C${R1(70*k)} 10 ${R1(110*k)} 18 ${R1(160*k)} 16" fill="none" stroke="#eef6f8" stroke-width="2" stroke-linecap="round" opacity=".75"/><path d="M${R1(-46*k)} 1 q-8 2 -12 6 M${R1(-46*k)} 4 q-6 3 -9 8" stroke="#fff" stroke-width="1.6" fill="none" stroke-linecap="round"/>`);
 const ship=`<div data-sprite-node="pitch" class="lg-pitch">${wake}<div data-sprite-node="recoil" class="lg-recoil"><div class="sprite-art" style="transform:scale(${k})">${hull}</div>${phone?'':`<div data-sprite-node="light" class="sprite-recoil-light"><div class="sprite-art" style="transform:scale(${k})">${lit}</div></div>`}</div></div>`;
 const specs:SpriteSpec[]=[{key,html:ship,count:n}];
 specs.push({key:'armada-ball',html:svg([-6,-6,12,12],'<g class="ball-svg ball"><circle r="5" fill="#1a1714"/><circle cx="-1.4" cy="-1.6" r="1.7" fill="#9a948b"/></g>'),count:36});
 specs.push({key:'armada-shadow',html:svg([-6,-3,12,6],'<ellipse rx="5" ry="2" fill="#000" opacity=".3"/>'),count:36});
 specs.push({key:'armada-group',html:'',count:4});
 specs.push({key:'armada-haze',html:svg([-160,-70,320,140],'<ellipse cx="0" cy="0" rx="160" ry="70" fill="#e6eaec" opacity=".7"/><ellipse cx="-40" cy="30" rx="120" ry="40" fill="#f2f4f5" opacity=".6"/>'),count:1});

 warmSprites(ctx.board,[...specs,reactionWhirlSpec,legendGlintSpec,...volleySpriteSpecs(ctx),...legendSpriteSpecs(),...motionSpecs(ctx),...sinkSpecs(ctx)]);
 prepared.set(ctx.board,signature);
}

/** Same curves/counts; only the drawing host and animated element change. */
export function armadaBall(ctx:FxCtx,svg:Element,p0:Pt,p1:Pt,d=700,delay=0,lift=20):void {
 const N=28,pts=Array.from({length:N+1},(_,i)=>{const t=i/N,u=1-t;return{x:u*u*p0.x+2*u*t*(p0.x+p1.x)/2+t*t*p1.x,y:u*u*p0.y+2*u*t*(Math.min(p0.y,p1.y)-lift)+t*t*p1.y}});
 const path=(scale:(i:number)=>number)=>pts.map((p,i)=>({transform:`translate(${R1(p.x)}px,${R1(p.y)}px) scale(${scale(i)})`,opacity:i===N?0:1}));
 // Small trails stay grouped, not separate particle layers.
 for(let i=1,m=room(ctx,7);i<=m;i++){
  const trail=particleCircle(ctx,svg,R1(3.6-i*.35),'#cfc8bc','trail',R1(.5-i*.06));
  A(ctx,trail,path(()=>1),d,delay+i*22,'linear');
 }
 const shadow=takeSprite(ctx,'armada-shadow');
 const a=spriteA(ctx,shadow.root,pts.map((_,i)=>{const t=i/N;return{transform:`translate(${R1(p0.x+(p1.x-p0.x)*t)}px,${R1(p0.y+(p1.y-p0.y)*t+8)}px) scale(${R1(1-Math.sin(Math.PI*t)*.5)})`,opacity:i===N?0:1}}),d,delay,'linear');
 void a.finished.then(shadow.release,()=>{});
 const ball=takeSprite(ctx,'armada-ball');const b=spriteA(ctx,ball.root,path(i=>R1(1+Math.sin(Math.PI*i/N)*.15)),d,delay,'linear');void b.finished.then(ball.release,()=>{});
}
export function armadaSmoke(ctx:FxCtx,host:Element,x:number,y:number,ang:number,k=1,n=9,life=5600,delay=0,darkAll=false):void {
 // Every caller is the Armada's canvas-particle context. Keep the original smoke texture/path.
 smokeJet(ctx,host,x,y,ang,k,n,life,delay,darkAll);
}

export function armadaRecoil(ctx:FxCtx,sprite:Sprite,rd:number,duration:number):void {
 spriteA(ctx,sprite.node('recoil'),[{transform:'rotate(0deg) translate(0,0)'},{transform:`rotate(${rd*2.6}deg) translate(${-rd*3}px,0)`,offset:.12},{transform:`rotate(${-rd*.8}deg) translate(0,0)`,offset:.55},{transform:'rotate(0deg) translate(0,0)'}],duration,0,'ease-out','none');
 if(boardW(ctx)>700&&!perfOff('filters')&&!perfOff('light'))ignoreFxBudget(spriteA(ctx,sprite.node('light'),[{opacity:0},{opacity:1,offset:.12},{opacity:0,offset:.55},{opacity:0}],duration,0,'ease-out','none'));
}
export function armadaSmokeHost(ctx:FxCtx,host:Element):HTMLElement {
 const sprite=takeSprite(ctx,'armada-group',host);sprite.root.classList.add('fx-sprite-trace');return sprite.root;
}

export function armadaA(ctx:FxCtx,el:Element,frames:Keyframe[],duration:number,delay=0,easing='ease-out',fill:FillMode='both'):Animation {
 return el.namespaceURI==='http://www.w3.org/1999/xhtml'?spriteA(ctx,el as HTMLElement,frames,duration,delay,easing,fill):A(ctx,el,frames,duration,delay,easing,fill);
}
