import type {Side} from '../../engine/types';
import {Icon} from '../menus/Menus';
/** The verdict still comes from the existing seeded toss; this component only draws it. */
export function Coin({face,spinning}:{face:Side|null;spinning:boolean}){return <span className={`coin menu-coin ${spinning?'toss':face?face==='ПИРАТЫ'?'pirates':'company':'idle'}`} aria-hidden="true"><span className="front"><Icon name="coin" size={118}/></span><span className="back"><Icon name="coin_back" size={118}/></span></span>;}
