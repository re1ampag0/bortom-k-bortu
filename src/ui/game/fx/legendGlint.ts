// The original 242×366, r=12 outline, 80 px dash and 1216 px dash period.
// Fixed clipping boxes split that dash into straight strokes and quarter circles.
// Only HTML translations/rotations change; no SVG paint property animates.
import {ignoreFxBudget,type FxCtx} from './primitives';
import {spriteA, spriteReady, takeSprite, type SpriteSpec} from './sprites';
const R=12, ARC=Math.PI*R/2, PERIOD=1216, SPEED=PERIOD/2200;
type Segment={x:number;y:number;angle:number;length:number;arc:boolean;start:number};
const segments:Segment[]=[];
let distance=0;
for(const [x,y,angle,length,arc] of [
  [15,3,0,218,0],[233,15,-90,ARC,1],[245,15,90,342,0],[233,357,0,ARC,1],
  [233,369,180,218,0],[15,357,90,ARC,1],[3,357,270,342,0],[15,15,180,ARC,1],
]){segments.push({x,y,angle,length,arc:!!arc,start:distance});distance+=length;}
const stroke='fill="none" stroke="#fff6d8" stroke-width="3"';
const parts=segments.map((s,i)=>`<div style="position:absolute;left:${s.x}px;top:${s.y}px;transform:rotate(${s.angle}deg);transform-origin:0 0"><div style="position:absolute;left:0;top:${s.arc?0:-1.5}px;width:${s.arc?13.5:s.length}px;height:${s.arc?13.5:3}px;overflow:hidden"><div data-sprite-node="part${i}">${s.arc?`<svg width="30" height="30" viewBox="-15 -15 30 30" style="left:-15px;top:-15px"><path d="M12 0 A12 12 0 0 1 0 12" ${stroke}/></svg>`:`<svg width="80" height="3" viewBox="0 -1.5 80 3"><path d="M0 0 H80" ${stroke}/></svg>`}</div></div></div>`).join('');
export const legendGlintSpec:SpriteSpec={key:'legend-glint',count:1,html:parts+[0,1].map(i=>`<div data-sprite-node="cap${i}"><svg width="3" height="3" viewBox="-1.5 -1.5 3 3" style="left:-1.5px;top:-1.5px"><circle r="1.5" fill="#fff6d8"/></svg></div>`).join('')};
function partFrame(s:Segment,q:number):Keyframe {
  const lo=q-s.start,hi=lo+80;
  return {transform:s.arc?`rotate(${Math.max(-90,Math.min(90,hi<s.length?hi/R*180/Math.PI-90:Math.max(0,lo)/R*180/Math.PI))}deg)`:`translateX(${lo}px)`,opacity:s.arc&&(hi<=0||lo>=s.length)?0:1};
}
function point(q:number):{x:number;y:number} {
  const s=segments.find(s=>q<=s.start+s.length)??segments.at(-1)!;
  const t=q-s.start,a=(s.angle+(s.arc?t/R*180/Math.PI:0))*Math.PI/180;
  return s.arc?{x:s.x+R*Math.cos(a),y:s.y+R*Math.sin(a)}:{x:s.x+t*Math.cos(a),y:s.y+t*Math.sin(a)};
}
export function playLegendGlint(ctx:FxCtx,card:HTMLElement,hold:number,delay:number):boolean {
  if(hold*SPEED+80>=distance||!spriteReady(ctx.board,legendGlintSpec.key))return false;
  const sprite=takeSprite(ctx,legendGlintSpec.key,card);sprite.root.classList.add('lc-glint');
  // T.legend.hold is 1700 ms: the original dash does not complete its first 2200 ms lap.
  const end=SPEED*hold;
  for(const [i,s]of segments.entries()){
    const node=sprite.node(`part${i}`),base=partFrame(s,0);Object.assign(node.style,base);
    const knots=[0,end,...[-80,s.length-80,0,s.length].map(v=>s.start+v)].filter(q=>q>=0&&q<=end).sort((a,b)=>a-b);
    const frames:Keyframe[]=[];
    for(const q of [...new Set(knots)]){
      const frame=partFrame(s,q);
      if(s.arc&&q>0&&q<end&&(q===s.start-80||q===s.start+s.length)){
        frames.push({...frame,opacity:q===s.start-80?0:1,offset:q/end});
        frames.push({...frame,opacity:q===s.start-80?1:0,offset:q/end});
      }else frames.push({...frame,offset:q/end});
    }
    if(frames.every(f=>f.opacity===0))continue;
    const animation=spriteA(ctx,node,frames,hold,delay,'linear','none');
    if(i!==0)ignoreFxBudget(animation); // the original single dash owned one budget entry
  }
  for(const cap of [0,1]){
    const node=sprite.node(`cap${cap}`),shift=cap*80;
    // Straight portions are exact; 2° corner samples differ by <.002 CSS px from the circle.
    const knots=[0,end];
    for(const s of segments){const n=s.arc?45:1;for(let i=0;i<=n;i++){const q=s.start+s.length*i/n-shift;if(q>0&&q<end)knots.push(q);}}
    const frames=[...new Set(knots)].sort((a,b)=>a-b).map(q=>{const p=point(q+shift);return{transform:`translate(${p.x}px,${p.y}px)`,offset:q/end}});
    node.style.transform=frames[0].transform;ignoreFxBudget(spriteA(ctx,node,frames,hold,delay,'linear','none'));
  }
  return true;
}
