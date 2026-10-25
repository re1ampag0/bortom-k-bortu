import {useRef} from 'react';
import type {Side} from '../../engine/types';
import {Icon,useMenuMotion} from '../menus/Menus';
/** The verdict still comes from the existing seeded toss; this component only draws it. */
export function Coin({face,spinning}:{face:Side|null;spinning:boolean}){const ref=useRef<HTMLSpanElement>(null);useMenuMotion(ref);return <span ref={ref} className={`coin menu-coin ${spinning?'toss':face?face==='ПИРАТЫ'?'pirates':'company':'idle'}`} aria-hidden="true"><span className="front"><Icon name="coin" size={118}/></span><span className="back"><Icon name="coin_back" size={118}/></span></span>;}
