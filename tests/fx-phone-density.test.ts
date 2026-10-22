import {describe,expect,it} from 'vitest';
import {room,filters,type FxCtx} from '../src/ui/game/fx/primitives';
function context(phone:boolean,rich=true):FxCtx {
 return {rich,board:{clientWidth:phone?430:1366,querySelector:()=>null,ownerDocument:{defaultView:{matchMedia:()=>({matches:phone})}}},layer:{getAnimations:()=>[]}} as unknown as FxCtx;
}
describe('Historical phone effect density',()=>{
 it('rounds odd counts up on a phone and leaves the laptop unchanged',()=>{
  expect(room(context(true),7)).toBe(4);expect(room(context(false),7)).toBe(7);
  expect(room(context(true),0)).toBe(0);expect(room(context(true,false),7)).toBe(0);
 });
 it('omits heavy filters on the phone but retains rich laptop filters',()=>{
  expect(filters(context(true))).toBe(false);expect(filters(context(false))).toBe(true);expect(filters(context(false,false))).toBe(false);
 });
});
