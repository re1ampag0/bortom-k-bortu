// Regression guard of known page facts, never a GPU benchmark. Run only in Chromium.
import {test,expect} from '@playwright/test';
import {mkdirSync,writeFileSync} from 'node:fs';
test.use({actionTimeout:8000});

test('perf guard: Volley, ordinary card, Legend and Armada, sinking, idle',async({page},info)=>{
 test.skip(info.project.name!=='chromium','Native animation diagnostics are guarded in Chromium.');
 test.setTimeout(60000);
 await page.setViewportSize({width:430,height:932});
 await page.addInitScript(()=>{
  let seed=19427;Math.random=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296);
  // Exact existing exceptions. These brief local colour/line effects preserve the ordinary UI/reference.
  const exceptions:[string,string,string][]=[
   ['[data-fx-keg]','background','Powder expenditure, small keg only (native shorthand)'],
   ['[data-fx-keg]','backgroundColor','Powder expenditure, small keg only'],
   ['[data-fx-value]','color','The displayed track number flashes on damage'],
   ['[data-fx-hold]','backgroundColor','Original local Powder income flash'],
   ['[data-fx-track]','boxShadow','Original 700 ms local track change flash on phone'],
   ['[data-fx-track]','backgroundColor','Brief local track blink on damage'],
   ['.plate .terms span','backgroundColor','Existing card absorption highlight; ordinary plate is preserved'],
   ['.fx-sinkwater','backgroundPosition','Same local rising-water shorthand exposed by native keyframes'],
   ['.plank[data-fx-ship]','boxShadow','misc.ts sink: original 1400 ms captain-arrival glow, native keyframes only'],
   ['.fx-sinkwater','backgroundPositionY','Existing water rising inside the two local sinking halves'],
   ['[data-fx-status="Переговоры"]','boxShadow','misc.ts flag: original 380 ms landing highlight on this one status chip'],
   ['.plank.own','filter','Existing CSS transition into the awaiting/disabled own-plank state'],
   ['.plank.aimable','outlineColor','Target-selection aimpulse, existing UI outside effect artwork'],
   ...['borderBottomColor','borderLeftColor','borderRightColor','borderTopColor','boxShadow'].map(property=>['.plank',property,'Existing short target/hit frame CSS transition'] as [string,string,string]),
   ['.fx-cracks .rv','strokeDashoffset','Short local crack line, not the board SVG'],
  ];
  const allowed=new Set(['transform','opacity','translate','rotate','scale']);
  const meta=new Set(['offset','computedOffset','easing','composite']);
  type Entry={target:Element;name:string;animation:Animation;native:boolean};
  const entries:Entry[]=[],seen=new WeakSet<Animation>();
  let active=false;
  const problems:string[]=[],used=new Set<string>();
  const check=(e:Entry)=>{
   const frames=(e.animation.effect as KeyframeEffect|null)?.getKeyframes()??[];
   for(const key of new Set(frames.flatMap(f=>Object.keys(f)))){
    if(meta.has(key)||allowed.has(key))continue;
    // Shorthands expand into constant longhands in getKeyframes; constants do not animate.
    if(new Set(frames.map(f=>String((f as unknown as Record<string,unknown>)[key]))).size<2)continue;
    const exception=exceptions.find(([selector,property])=>property===key&&e.target.matches(selector)&&
     (!['.plank','.plank.own'].includes(selector)||e.animation instanceof CSSTransition)&&
     (selector!=='.plank.aimable'||e.name==='aimpulse')&&
     (selector!=='.plank[data-fx-ship]'||e.native&&Number(e.animation.effect?.getTiming().duration)===840&&String(frames[0]?.boxShadow).includes('22px'))&&
     (selector!=='[data-fx-status="Переговоры"]'||e.native&&Number(e.animation.effect?.getTiming().duration)<=380));
    if(exception)used.add(exception.join(' · '));else problems.push(`${e.target.tagName}.${e.target.getAttribute('class')??''}: ${key} (${e.name})`);
   }
  };
  const keep=(a:Animation,native=false,target?:Element)=>{
   const el=target??(a.effect as KeyframeEffect|null)?.target;
   if(!active||!(el instanceof Element)||!el.closest('.board')||seen.has(a))return;
   seen.add(a);const entry={target:el,name:a instanceof CSSAnimation?a.animationName:a.id,animation:a,native};entries.push(entry);check(entry);
  };
  const native=Element.prototype.animate;
  Element.prototype.animate=function(frames,options){const a=native.call(this,frames,options);keep(a,true,this);return a;};
  const sample=()=>document.getAnimations().forEach(a=>keep(a));
  // Catch CSS transitions while playing; native handles are also captured at creation, even for one-frame effects.
  setInterval(sample,100);
  const idleAllowed=(a:Animation,el:Element)=>{
   const name=a instanceof CSSAnimation?a.animationName:a.id;
   return (name==='deck-warm-flick'&&el.matches('.game,.phone-deck-warm'))||
    (name==='sea-drift'&&el.matches('.sea-water'))||
    (/^wx-loop-[1-7]$/.test(name)&&el.matches('.fx-weather .sf.wx-loop'))||
    (name==='medal-glint'&&el.matches('.medal-scheduled'))||
    (name==='volley-float-rock'&&el.matches('.volley-flotsam .volley-float-rotate'))||
    (name==='volley-float-heave'&&el.matches('.volley-flotsam .volley-float-heave'));
  };
  const guard={
   start:()=>{entries.length=0;problems.length=0;used.clear();active=true;sample();},
   report:()=>{sample();active=false;return {animations:entries.length,problems:[...new Set(problems)],exceptions:[...used]};},
   idle:()=>document.getAnimations().filter(a=>a.playState==='running').flatMap(a=>{
    const el=(a.effect as KeyframeEffect|null)?.target;if(!(el instanceof Element)||!el.closest('.game'))return [];
    return idleAllowed(a,el)?[]:[`${el.tagName}.${el.getAttribute('class')??''}: ${a instanceof CSSAnimation?a.animationName:a.id}`];
   }),
  };
  (window as unknown as {fxGuard:typeof guard}).fxGuard=guard;
 });
 type Guard={start:()=>void;report:()=>{animations:number;problems:string[];exceptions:string[]};idle:()=>string[]};
 const rows:unknown[]=[];
 const start=()=>page.evaluate(()=>(window as unknown as {fxGuard:Guard}).fxGuard.start());
 const result=async(scene:string)=>{
  const value=await page.getByRole('textbox',{name:'Числа последнего клипа',includeHidden:true}).inputValue();
  const report=await page.evaluate(()=>(window as unknown as {fxGuard:Guard}).fxGuard.report());
  rows.push({scene,report,diagnostics:value});
  mkdirSync('docs/screenshots/fx-finish/checks',{recursive:true});
  writeFileSync('docs/screenshots/fx-finish/checks/perf-guard-observation.json',JSON.stringify(rows,null,1)+'\n');
  expect(value,scene).toContain('рендеры Game: 0');
  expect(value,scene).toContain('анимации в SVG на весь стол: нет');
  expect(report.animations,scene).toBeGreaterThan(0);expect(report.problems,scene).toEqual([]);
 };
 async function quiet(){
  await expect(page.locator('.game')).not.toHaveAttribute('data-fx-busy');
  await expect(page.getByTestId('end-turn').filter({visible:true}).first()).toHaveAttribute('aria-disabled','false');
 }
 async function game(side:'pirates'|'company'){
  await page.goto('?seed=1&speed=fast&hints=0&perf=1');
  for(const id of ['quick-bots',`pick-${side}`,'prep-start','placement-done'])await page.getByTestId(id).click();
  await quiet();
 }
 await game('pirates');
 // Check idle on the FIRST fresh table, before any clip aftermath exists.
 await page.waitForTimeout(3000);
 const idle=await page.evaluate(()=>(window as unknown as {fxGuard:Guard}).fxGuard.idle());
 expect(idle).toEqual([]);rows.push({scene:'idle-3s',unexpectedAnimations:idle});
 await page.getByTestId('volley-Ж').filter({visible:true}).first().click();await page.getByTestId('plate-И').click();
 // An ordinary hit costs one Powder, leaving the other for the following Order.
 const before=await page.locator('[data-fx-ship="И"] [data-fx-value]').first().textContent();
 await start();await page.getByTestId('fire').click();
 await expect(page.getByTestId('perf-clip')).toContainText('shot');await quiet();
 expect(await page.locator('[data-fx-ship="И"] [data-fx-value]').first().textContent()).not.toBe(before);
 await result('volley-hit');
 await page.locator('[data-fx-hand] [data-fx-card="Ж-14"]').first().click();await page.getByTestId('lift-play').click();
 await page.getByTestId('plate-И').click();await start();await page.getByTestId('play-card').click();
 await expect(page.getByTestId('perf-clip')).toContainText('card');await quiet();await result('ordinary-card');
 await game('company');
 await page.getByTestId('star-И').filter({visible:true}).first().click();
 await page.getByRole('button',{name:'Разыграть Легенду',exact:true}).click();
 await start();await page.getByTestId('legend-confirm').getByRole('button',{name:/^Сыграть/}).click();
 await expect(page.getByTestId('perf-clip')).toContainText('legend');await quiet();await result('legend-intro-and-armada');
 await page.goto('?fxScene=sink&manual=1&speed=fast&seed=1&perf=1');
 await start();await page.getByTestId('fx-start').click();
 // The complete fast sinking takes ~8.6 s; the generic 8 s action timeout cannot cover it.
 await page.waitForFunction(()=>document.body.dataset.fxDone==='1',null,{timeout:20000});await result('sinking');
 mkdirSync('docs/screenshots/fx-finish/checks',{recursive:true});
 writeFileSync(`docs/screenshots/fx-finish/checks/perf-guard-${info.repeatEachIndex+1}.json`,JSON.stringify(rows,null,1)+'\n');
});
