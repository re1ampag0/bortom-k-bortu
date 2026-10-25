import {lazy,Suspense,useEffect,useRef,type ReactNode,type RefObject} from 'react';
import type {GameData} from '../../engine/types';
import './menus.css';
const Scene=lazy(()=>import('./MenuScene').then(m=>({default:m.MenuScene})));
const icons=import.meta.glob('../../../docs/mockups/menus/assets/icons/*.svg',{eager:true,query:'?url',import:'default'}) as Record<string,string>;
const ships=import.meta.glob('../../../docs/mockups/menus/assets/ships/*.svg',{eager:true,query:'?url',import:'default'}) as Record<string,string>;
const charts=import.meta.glob('./art/chart-*.webp',{eager:true,query:'?url',import:'default'}) as Record<string,string>;
export const menuShip=(name:string)=>ships[`../../../docs/mockups/menus/assets/ships/ship_${name}.svg`];
export function Icon({name,size=32}:{name:string;size?:number}){return <img className="menu-icon" width={size} height={size} src={icons[`../../../docs/mockups/menus/assets/icons/ic_${name}.svg`]} alt=""/>;}
export function MenuScene({name,className=''}:{name:string;className?:string}){return <div className={'menu-scene '+className}><Suspense fallback={null}><Scene name={name}/></Suspense></div>;}
export function useMenuMotion<T extends HTMLElement>(ref:RefObject<T|null>){
 useEffect(()=>{const el=ref.current;if(!el)return;const reduced=matchMedia('(prefers-reduced-motion:reduce)');let visible=true;const update=()=>el.style.setProperty('--menu-play',!document.hidden&&visible&&!reduced.matches?'running':'paused');const io=new IntersectionObserver(([e])=>{visible=e.isIntersecting;update();});io.observe(el);document.addEventListener('visibilitychange',update);reduced.addEventListener('change',update);update();return()=>{io.disconnect();document.removeEventListener('visibilitychange',update);reduced.removeEventListener('change',update);};},[]);
}
export function MenuSurface({children,kind='prep',className=''}:{children:ReactNode;kind?:string;className?:string}){
 const ref=useRef<HTMLDivElement>(null);
 useMenuMotion(ref);
 return <div ref={ref} className={`menus-surface menu-${kind} ${className}`}><picture className="menu-chart"><source media="(max-width:700px)" srcSet={charts[`./art/chart-${kind==='main'?'phone-main':'phone'}.webp`]}/><img src={charts[`./art/chart-${kind}.webp`]??charts['./art/chart-prep.webp']} alt=""/></picture><MenuScene name={`Chart_${kind}`} className="menu-chart-animation"/>{children}</div>;
}
export function Boat({name,muted=false}:{name:string;muted?:boolean}){const ref=useRef<HTMLDivElement>(null);useMenuMotion(ref);return <div ref={ref} className={`menu-boat${muted?' muted':''}`} aria-hidden="true"><i className="menu-contact"/><div className="menu-hull"><img src={menuShip(name)} alt=""/></div><div className="menu-reflection"><img src={menuShip(name)} alt=""/></div></div>;}
export const shipName=(code:string)=>({'Ж':'pearl','М':'revenge','И':'endeavour','Г':'dutch'}[code]??'pearl');
export function ShipScales({data,code}:{data:GameData;code:string}){const d=data.ships.find(s=>s.code===code)!;return <div className="menu-scales">{(['hull','sails','guns','crew']as const).map((key,i)=><span key={key}><img src={new URL(`../../../docs/mockups/menus/assets/cell_${['hull','sail','gun','crew'][i]}.svg`,import.meta.url).href} alt={['Корпус','Паруса','Пушки','Команда'][i]}/><b>{d[key]}</b></span>)}</div>;}
