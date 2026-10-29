import {lazy,Suspense,useEffect,useLayoutEffect,useRef,useState,type ReactNode,type RefObject} from 'react';
import type {GameData} from '../../engine/types';
import './menus.css';
import './menus-fix2.css';
import './menus-fix3.css';
import './layout.css';
import {activateMenu,useMenuLayout,MenuOverlayContext} from './layout';
import {menuImagePool} from './assets';
import {initMenuMotion,menuMotionAllowed,subscribeMenuMotion} from './motion';
const Scene=lazy(()=>import('./MenuScene').then(m=>({default:m.MenuScene})));
const icons=import.meta.glob('../../../docs/mockups/menus/assets/icons/*.svg',{eager:true,query:'?url',import:'default'}) as Record<string,string>;
const ships=import.meta.glob('../../../docs/mockups/menus/assets/ships/*.svg',{eager:true,query:'?url',import:'default'}) as Record<string,string>;
const charts=import.meta.glob('./art/chart-*.webp',{eager:true,query:'?url',import:'default'}) as Record<string,string>;
export const menuShip=(name:string)=>ships[`../../../docs/mockups/menus/assets/ships/ship_${name}.svg`];
export function Icon({name,size=32}:{name:string;size?:number}){return <img className="menu-icon" width={size} height={size} src={icons[`../../../docs/mockups/menus/assets/icons/ic_${name}.svg`]} alt=""/>;}
export function MenuScene({name,className=''}:{name:string;className?:string}){return <div className={'menu-scene '+className}><Suspense fallback={null}><Scene name={name}/></Suspense></div>;}
export function useMenuMotion<T extends HTMLElement>(ref:RefObject<T|null>){
 useEffect(()=>{const el=ref.current;if(!el)return;initMenuMotion();const reduced=matchMedia('(prefers-reduced-motion:reduce)');let visible=true;const update=()=>{const run=!document.hidden&&visible&&!reduced.matches&&menuMotionAllowed();el.style.setProperty('--menu-play',run?'running':'paused');el.toggleAttribute('data-menu-still',!run);};const io=new IntersectionObserver(([e])=>{visible=e.isIntersecting;update();});io.observe(el);document.addEventListener('visibilitychange',update);reduced.addEventListener('change',update);const unsubscribe=subscribeMenuMotion(update);update();return()=>{unsubscribe();io.disconnect();document.removeEventListener('visibilitychange',update);reduced.removeEventListener('change',update);};},[]);
}
function ChartPicture({kind}:{kind:string}){
 const layout=useMenuLayout(),phone=layout.mode==='phone',[ready,setReady]=useState('');
 const path=phone?`./art/chart-${kind==='main'?'phone-main':'phone'}.webp`:`./art/chart-${kind}.webp`,url=charts[path]??charts['./art/chart-prep.webp'];

 useEffect(()=>{let alive=true;void menuImagePool.load(url).then(()=>{if(alive)setReady(url)});return()=>{alive=false;};},[url]);
 useEffect(()=>{if(ready===url)document.body.style.setProperty('--menu-background',`url("${url}")`);},[ready,url]);
 return ready===url?<picture className="menu-chart"><img src={url} alt=""/></picture>:null;
}
export function MenuSurface({children,kind='prep',className=''}:{children:ReactNode;kind?:string;className?:string}){
 const ref=useRef<HTMLDivElement>(null),layout=useMenuLayout(),[overlay,setOverlay]=useState<HTMLDivElement|null>(null);
 useMenuMotion(ref);
 useLayoutEffect(()=>activateMenu(),[]);
 useLayoutEffect(()=>{document.body.dataset.menuLayout=layout.mode;document.body.toggleAttribute('data-menu-tablet',layout.tablet);document.body.toggleAttribute('data-menu-transform',layout.k!==1);document.body.toggleAttribute('data-menu-downscaled',layout.k<1);document.body.dataset.menuKind=className.includes('menu-curtain')?(className.includes('pirates')?'pirates':'company'):kind;},[layout.mode,layout.tablet,layout.k,kind,className]);
 useLayoutEffect(()=>{
  const root=ref.current;if(!root||layout.mode!=='phone')return;
  const targets=['.menu-prep-bottom>.menu-primary','.menu-placement-actions>.menu-primary','.menu-curtain main>.menu-primary','.menu-room-actions'];
  let live=true,timer:ReturnType<typeof setTimeout>|undefined;
  const measure=()=>{if(!live||!document.contains(root))return;if(document.body.hasAttribute('data-menu-user-scroll')&&(document.getElementById('root')?.scrollTop??0)>0){root.setAttribute('data-menu-pin','');return;}root.removeAttribute('data-menu-pin');const el=root.querySelector<HTMLElement>(targets.join(','));if(!el)return;const stage=document.getElementById('stage')!.getBoundingClientRect(),r=el.getBoundingClientRect(),bottom=(r.bottom-stage.top)/layout.k;root.toggleAttribute('data-menu-pin',bottom>layout.sceneH-16);};
  const schedule=()=>{clearTimeout(timer);timer=setTimeout(measure,40);};
  measure();void document.fonts.ready.then(measure);const changes=new MutationObserver(schedule);changes.observe(root,{childList:true,subtree:true});root.addEventListener('toggle',schedule,true);root.addEventListener('load',schedule,true);return()=>{live=false;clearTimeout(timer);changes.disconnect();root.removeEventListener('toggle',schedule,true);root.removeEventListener('load',schedule,true);};
 },[layout.mode,layout.sceneH,layout.k]);
 useLayoutEffect(()=>{
  const root=ref.current;if(!root||layout.mode!=='phone'||!className.includes('menu-curtain')||layout.tablet)return;
  const enable=()=>{if(root.scrollHeight<=layout.sceneH||document.body.hasAttribute('data-menu-user-scroll'))return false;document.body.setAttribute('data-menu-user-scroll','');void document.getElementById('root')?.offsetHeight;return true;};
  const touch=()=>{enable();};const wheel=(event:WheelEvent)=>{if(enable()){event.preventDefault();document.getElementById('root')!.scrollTop+=event.deltaY;}};
  const scroller=document.getElementById('root'),scrolled=()=>{if(document.body.hasAttribute('data-menu-user-scroll')&&(scroller?.scrollTop??0)>0)root.setAttribute('data-menu-pin','');};
  scroller?.addEventListener('scroll',scrolled,{passive:true});root.addEventListener('touchstart',touch,{passive:true});root.addEventListener('wheel',wheel,{passive:false});return()=>{scroller?.removeEventListener('scroll',scrolled);root.removeEventListener('touchstart',touch);root.removeEventListener('wheel',wheel);};
 },[layout.mode,layout.sceneH,layout.tablet,className]);
 return <MenuOverlayContext.Provider value={overlay}><><div ref={ref} data-menu-layout={layout.mode} data-menu-tablet={layout.tablet?'':undefined} data-menu-narrow={layout.sceneW<360?'':undefined} className={`menus-surface menu-${kind==='net'?'net-background':kind} ${className}${layout.mode==='phone'?' menu-phone':''}`}><ChartPicture kind={kind}/><MenuScene name={`Chart_${kind}`} className="menu-chart-animation"/>{children}</div><div className="menu-overlays" ref={setOverlay}/></></MenuOverlayContext.Provider>;
}
export function Boat({name,muted=false}:{name:string;muted?:boolean}){return <div className={`menu-boat${muted?' muted':''}`} aria-hidden="true"><MenuScene name={'Boat_'+name}/></div>;}
export function Dock({name}:{name:string}){return <div className="menu-dock"><MenuScene name={'Dock_'+name}/></div>;}

export const shipName=(code:string)=>({'Ж':'pearl','М':'revenge','И':'endeavour','Г':'dutch'}[code]??'pearl');
export function ShipScales({data,code}:{data:GameData;code:string}){const d=data.ships.find(s=>s.code===code)!;return <div className="menu-scales">{(['hull','sails','guns','crew']as const).map((key,i)=><span key={key}><img src={new URL(`../../../docs/mockups/menus/assets/cell_${['hull','sail','gun','crew'][i]}.svg`,import.meta.url).href} alt={['Корпус','Паруса','Пушки','Команда'][i]}/><b>{d[key]}</b></span>)}</div>;}

export function Arrow({back=false,chevron=false}:{back?:boolean;chevron?:boolean}){return <svg className={'menu-arrow'+(back?' back':'')} width={chevron?12:22} height="14" viewBox={chevron?'0 0 12 18':'0 0 22 14'} aria-hidden="true"><path d={chevron?'M2 2L10 9L2 16':'M1 7H20M14 1L20 7L14 13'} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>;}
export function Flourish(){return <img className="menu-flourish" src={new URL('./art/flourish.svg',import.meta.url).href} alt=""/>;}
