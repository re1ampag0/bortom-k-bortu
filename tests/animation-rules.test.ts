import {test,expect} from 'vitest';
import {animationSources} from './helpers/animationInventory';
import exceptions from './fixtures/animation-exceptions.json';
/** Explicit legacy artwork only; adding/changing a forbidden animation requires a reason and review. */
test('animation rules: no new painting keyframes or SMIL beyond the exact reviewed artwork',()=>{
 const actual=animationSources(),keys=(r:{path:string;kind:string;hash:string})=>`${r.path}:${r.kind}:${r.hash}`;
 const known=new Map(exceptions.map(e=>[keys(e),e]));
 expect(actual.filter(e=>!known.has(keys(e))),'Unreviewed animation source').toEqual([]);
 expect(exceptions.filter(e=>!actual.some(r=>keys(r)===keys(e))),'Remove stale exceptions when converting artwork').toEqual([]);
 for(const exception of exceptions)expect(exception.reason.length).toBeGreaterThan(30);
});
