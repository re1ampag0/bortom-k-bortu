// A2: the Volley on the table (the animation layer) through «?fxScene=<id>» — scenes of the reference
// (docs/mockups/anim/level1/scenes.js) played on the table of the game. The layer never takes a press, a card of the
// hand opens during the show, the numbers after the show are the result of the scene; in a bot match a Volley of the
// bots is shown by the layer. Frames go to e2e-shots/a2/, next to the frames of the reference
// (capture.mjs → e2e-shots/a2/ref/), at the same milliseconds from the load of the page.
import { expect, test } from '@playwright/test';
import { clickMisses, expectResult, open, playing } from './fx-scene';

const SHOTS = 'e2e-shots/a2';

test.describe('the Volley on the table through ?fxScene (1366×660)', () => {
  test.use({ viewport: { width: 1366, height: 660 } });

  for (const id of ['plain', 'storm', 'joint', 'both']) {
    test(`${id}: the layer takes no press, a hand card opens during the show, the numbers are the result`, async ({ page }) => {
      const errors: string[] = [];
      page.on('pageerror', (e) => errors.push(e.message));
      await open(page, id);
      await playing(page);

      // elementFromPoint over the planks and the cards of the hand gives the element itself (clickthrough of the reference).
      const misses = await clickMisses(page);
      expect(misses.planks).toBe(4);
      expect(misses.layer).toBeGreaterThan(0);
      expect(misses.out).toEqual([]);

      // A card of the hand opens during the show and does not stop it.
      const card = page.locator('[data-fx-hand] [data-fx-card]:visible').last();
      await card.click();
      await expect(page.getByTestId('card-detail')).toBeVisible();
      expect(await page.evaluate(() => document.body.dataset.fxDone)).toBeUndefined();
      await page.getByTestId('card-detail').getByRole('button', { name: 'Закрыть' }).click();

      // After the show the numbers of the tracks are the result of the scene.
      await expectResult(page, id);
      expect(errors).toEqual([]);
    });
  }

  // FX-D: the A5 broadside (gunFire, ballFly, hitBlast, missSplash) keeps to the budget of the layer: at most ~200
  // animations at once (TASKS.md, «Как переносить из прототипа», 5), in the heaviest scene — two broadsides.
  test('both: the A5 shots keep to the budget of the layer, no error', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await open(page, 'both');
    await page.evaluate(() => {
      const w = window as unknown as { __peak: number };
      w.__peak = 0;
      const tick = () => {
        const run = (q: string) => document.querySelector(q)?.getAnimations({ subtree: true }).filter((a) => a.playState === 'running').length ?? 0;
        const particles = (document.querySelector('.fx-layer')?.parentElement as HTMLElement & {fxParticles?: () => {active:number}})?.fxParticles?.().active ?? 0;
        const n = run('.fx-layer') + run('.fx-scars') + particles;
        w.__peak = Math.max(w.__peak, n);
        if (!document.body.dataset.fxDone) requestAnimationFrame(tick);
      };
      tick();
    });
    await expectResult(page, 'both');
    const peak = await page.evaluate(() => (window as unknown as { __peak: number }).__peak);
    expect(peak).toBeGreaterThan(20);
    expect(peak).toBeLessThanOrEqual(210);
    expect(errors).toEqual([]);
  });

  test('a press on the table shows the result at once', async ({ page }) => {
    await open(page, 'storm');
    await playing(page);
    await page.mouse.click(5, 300); // the table, beside the planks: not the hand, not a panel
    await page.waitForFunction(() => document.body.dataset.fxDone === '1', null, { timeout: 3000 });
    expect(await page.locator('.fx-layer > *').count()).toBe(0);
  });
});

test.describe('V5: the breakdown plate (1366×660)', () => {
  test.use({ viewport: { width: 1366, height: 660 } });

  test('it stays ≈ 2 s after the clip, then goes by itself; the layer is empty meanwhile', async ({ page }) => {
    await open(page, 'storm');
    await page.waitForFunction(() => document.body.dataset.fxDone === '1', null, { timeout: 30_000 });
    expect(await page.locator('.fx-layer > *').count()).toBe(0);
    await expect(page.locator('.fx-scars > .plate')).toHaveCount(1);
    await expect(page.locator('.fx-scars > .plate')).toHaveCount(0, { timeout: 8000 });
  });

  test('a press on the table takes it away at once', async ({ page }) => {
    await open(page, 'storm');
    await page.waitForFunction(() => document.body.dataset.fxDone === '1', null, { timeout: 30_000 });
    await expect(page.locator('.fx-scars > .plate')).toHaveCount(1);
    await page.mouse.click(5, 300);
    await expect(page.locator('.fx-scars > .plate')).toHaveCount(0, { timeout: 500 });
  });
});

test.describe('V5: the plate on a phone (430×680)', () => {
  test.use({ viewport: { width: 430, height: 680 } });

  test('the compact plate stays between the planks on a short phone', async ({ page }) => {
    await open(page, 'plain');
    await page.waitForFunction(() => !!document.querySelector('.fx-layer > .plate'));
    const box = await page.locator('.fx-layer > .plate').first().boundingBox();
    expect(box).not.toBeNull();
    expect(box!.x).toBeGreaterThanOrEqual(8);
    expect(box!.x + box!.width).toBeLessThanOrEqual(422);
    const top = (await page.locator('.planks.top').boundingBox())!;
    const bottom = (await page.locator('.planks.bottom').boundingBox())!;
    expect(box!.y).toBeGreaterThanOrEqual(top.y + top.height);
    expect(box!.y + box!.height).toBeLessThanOrEqual(bottom.y);
  });
});

// V5: a ball the modifier took falls short; at its splash — the pill of that modifier. Frames go to
// e2e-shots/a5-windows/ (b-volley-miss-*), next to b-volley-ref-*.
for (const { width, height } of [
  { width: 1366, height: 660 },
  { width: 390, height: 844 },
]) {
  test.describe(`V5: the pill of a miss (${width}×${height})`, () => {
    test.use({ viewport: { width, height } });
    for (const [id, text] of [
      ['storm', 'Буря −1'],
      ['diag', 'Диагональ −1'],
    ]) {
      test(`${id}: «${text}» at the splash`, async ({ page }) => {
        await open(page, id);
        const pill = page.locator('.fx-layer > .tag.mod', { hasText: text });
        await expect(pill).toHaveCount(1, { timeout: 15_000 });
        await page.waitForFunction((t) => Array.from(document.querySelectorAll('.fx-layer > .tag.mod')).some((e) => e.textContent === t && Number(getComputedStyle(e).opacity) > 0.95), text);
        const box = (await pill.boundingBox())!;
        expect(box.x).toBeGreaterThanOrEqual(0);
        expect(box.x + box.width).toBeLessThanOrEqual(width);
        // beside the plate, not over it
        const plate = (await page.locator('.fx-layer > .plate').boundingBox())!;
        expect(box.x + box.width <= plate.x || box.x >= plate.x + plate.width || box.y + box.height <= plate.y || box.y >= plate.y + plate.height).toBe(true);
        await page.screenshot({ path: `e2e-shots/a5-windows/b-volley-miss-${id}-${width}x${height}.png` });
      });
    }
  });
}

test.describe('a bot match (1366×660)', () => {
  test.use({ viewport: { width: 1366, height: 660 } });

  test('the layer is the last child of the table, a Volley of the bots shows its plate', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await page.goto('?seed=3&speed=fast');
    await page.getByTestId('quick-bots').click();
    await page.getByTestId('pick-company').click();
    await page.getByTestId('prep-start').click();
    await page.getByTestId('placement-done').click();
    await expect(page.getByTestId('game')).toBeVisible();
    const dom = await page.evaluate(() => {
      const board = document.querySelector('.board')!;
      const last = board.lastElementChild!;
      return { last: last.className, before: last.previousElementSibling?.className, gap: !!board.querySelector('[data-fx-gap]'), hand: !!board.querySelector('[data-fx-hand]'), events: getComputedStyle(last).pointerEvents };
    });
    // FX-A: the traces of the effects (.fx-scars) lie between the weather and the layer (ANIMATIONS.md §1)
    expect(dom).toEqual({ last: 'fx-layer', before: 'fx-scars', gap: true, hand: true, events: 'none' });
    // fx-ambient: the weather may carry .wx-paused while a clip plays — the order of the layers is what is checked
    expect(await page.evaluate(() => { const w = document.querySelector('.board > .fx-scars')!.previousElementSibling!; return getComputedStyle(w).zIndex + ' ' + w.classList.contains('fx-weather'); })).toBe('1 true');
    expect(await page.evaluate(() => getComputedStyle(document.querySelector('.board > .fx-scars')!).pointerEvents)).toBe('none');
    await expect(page.locator('.fx-layer .plate')).toBeVisible({ timeout: 60_000 });
    expect(errors).toEqual([]);
  });
});

/** The frames of the game at the moments of the reference frames (capture.mjs: from the load of the page). */
const FRAMES: { id: string; times: number[]; width: number; height: number }[] = [
  { id: 'plain', times: [1200, 2400], width: 1366, height: 660 },
  { id: 'storm', times: [2000, 3000], width: 1366, height: 660 },
  { id: 'joint', times: [1000, 2000], width: 1366, height: 660 },
  { id: 'both', times: [3000, 4000], width: 1366, height: 660 },
  { id: 'plain', times: [1200, 2400], width: 430, height: 932 },
];
test.describe('frames for the comparison with the reference', () => {
  for (const f of FRAMES) {
    test(`${f.id} ${f.width}×${f.height}`, async ({ browser }) => {
      const page = await browser.newPage({ viewport: { width: f.width, height: f.height } });
      await page.goto(`?fxScene=${f.id}&speed=normal`);
      let last = 0;
      for (const t of f.times) {
        await page.waitForTimeout(t - last);
        last = t;
        await page.screenshot({ path: `${SHOTS}/game-${f.id}-${f.width}x${f.height}-${t}.png` });
      }
      await page.close();
    });
  }
});

// A11 (a): the first iron ball that falls short skips off the water — one more ball (the hop) than the Volley has shots. The scene
// «plain» has 3 balls; with «&diag=1» (Диагональ −1) it has 2 hits and 1 ball into the water, which skips: 4 balls.
for (const [q, balls] of [['', 3], ['&diag=1', 4]] as const) {
  test(`ricochet: «plain${q}» draws ${balls} iron balls`, async ({ page }) => {
    await page.setViewportSize({ width: 1366, height: 660 });
    await page.addInitScript(() => {
      const w = window as unknown as { __n: number };
      w.__n = 0;
      const tick = () => {
        document.querySelectorAll<SVGGElement & { __id?: number }>('.fx-layer svg g.ball').forEach((g) => { if (!g.__id) g.__id = ++w.__n; });
        requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    });
    await page.goto(`?fxScene=plain&speed=normal${q}`);
    await page.waitForFunction(() => document.body.dataset.fxDone === '1', null, { timeout: 60_000 });
    expect(await page.evaluate(() => (window as unknown as { __n: number }).__n)).toBe(balls);
  });
}

// A11 (c): the powder smoke the guns breathe out is drawn in the top layer, over the planks' edge, and is gone within 800 ms
// (the long smoke of the Volley lies under the planks). The puffs of a gun sit in a host group of several wrapped circles; the black smoke
// of a hit sits straight in the layer svg and is not this one.
test('powder smoke in the top layer is seen and lives at most 800 ms', async ({ page }) => {
  await page.setViewportSize({ width: 1366, height: 660 });
  await page.addInitScript(() => {
    const w = window as unknown as { __smoke: { max: number; seen: number } };
    w.__smoke = { max: 0, seen: 0 };
    const since = new Map<number, number>();
    const tick = () => {
      const now = performance.now();
      const board = document.querySelector('.fx-layer')?.parentElement as HTMLElement & {fxParticles?: () => {visible:{id:number;kind:string;level:string;x:number;y:number;opacity:number}[]}};
      const rows = board?.fxParticles?.().visible.filter(p => p.kind === 'powder-smoke' && p.level === 'top' && p.opacity > .05) ?? [];
      const canvas = document.querySelector<HTMLCanvasElement>('.fx-layer > .fx-particle-canvas[data-particle-level=top]');
      const active = new Set<number>();
      for(const puff of rows){
        if(!canvas)continue;
        const k=canvas.width/board.clientWidth,x=Math.floor(puff.x*k),y=Math.floor(puff.y*k);
        if(x<0||y<0||x>=canvas.width||y>=canvas.height||!canvas.getContext('2d')!.getImageData(x,y,1,1).data[3])continue;
        active.add(puff.id);
        if(!since.has(puff.id)){since.set(puff.id,now);w.__smoke.seen++;}
        w.__smoke.max=Math.max(w.__smoke.max,now-since.get(puff.id)!);
      }
      for(const id of since.keys())if(!active.has(id))since.delete(id);
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  });
  await page.goto('?fxScene=plain&speed=normal');
  await page.waitForFunction(() => document.body.dataset.fxDone === '1', null, { timeout: 60_000 });
  const r = await page.evaluate(() => (window as unknown as { __smoke: { max: number; seen: number } }).__smoke);
  expect(r.seen, 'puffs of powder smoke in the top layer').toBeGreaterThan(0);
  expect(r.max, 'the longest a puff stays visible there, ms').toBeLessThanOrEqual(850);
});

// User's iPhone regression: backwards-filled impact particles used to wait visibly on the target.
// Observe real clip clocks/results; do not infer an arrival from a hard-coded sleep.
test('hull impact: no debris or damage before arrival; the plate stays above wreckage', async ({ page }) => {
  test.setTimeout(60000);
  const evidence=[];
  for(const viewport of [{width:430,height:932},{width:1366,height:660}]){
    await page.setViewportSize(viewport);
    await page.addInitScript(()=>{
      type Shot={a:Animation;el:Element;arrival:number};
      const shots:Shot[]=[],early:string[]=[];
      const values=new Map<Element,string|null>();
      const data={early,framesBefore:0,visibleBoards:0,impacts:0};
      (window as unknown as {impactAudit:typeof data}).impactAudit=data;
      const native=Element.prototype.animate;
      Element.prototype.animate=function(frames,options){
        const a=native.call(this,frames,options);
        if((this as HTMLElement).dataset.volleyArt==='blast'){
          if(!shots.length)document.querySelectorAll('[data-fx-value]').forEach(el=>values.set(el,el.textContent));
          shots.push({a,el:this,arrival:performance.now()+Number(a.effect!.getTiming().delay)});data.impacts++;
        }
        return a;
      };
      function frame(){
        if(shots.length){
          const now=performance.now(),first=Math.min(...shots.map(s=>s.arrival));
          const board=document.querySelector('.board') as HTMLElement & {fxParticles?:()=>{visible:{kind:string}[]}};
          const boards=board?.fxParticles?.().visible.filter(p=>p.kind==='fall-board').length??0;
          data.visibleBoards+=boards;
          if(now<first-20){
            data.framesBefore++;
            if(boards)early.push('falling board before the first arrival');
            for(const [el,value]of values)if(el.textContent!==value)early.push('track changed before the first arrival');
            if(document.querySelector('.hitframe'))early.push('hit frame before arrival');
          }
          for(const shot of shots)if(now<shot.arrival-20&&Number(getComputedStyle(shot.el).opacity)>.01)early.push('fireball before its own arrival');
        }
        if(!document.body.dataset.fxDone)requestAnimationFrame(frame);
      }
      requestAnimationFrame(frame);
    });
    await open(page,'plain','fast','&manual=1&seed=1');
    await page.getByTestId('fx-start').click();
    await expectResult(page,'plain');
    const audit=await page.evaluate(()=>(window as unknown as {impactAudit:{early:string[];framesBefore:number;visibleBoards:number;impacts:number}}).impactAudit);
    expect([...new Set(audit.early)]).toEqual([]);expect(audit.framesBefore).toBeGreaterThan(3);
    expect(audit.impacts).toBeGreaterThan(0);expect(audit.visibleBoards).toBeGreaterThan(0);
    const stack=await page.evaluate(()=>{
      const plate=document.querySelector('.fx-scars > .plate')!;
      return {plate:Number(getComputedStyle(plate).zIndex),wrecks:Array.from(document.querySelectorAll('.fx-scars > .volley-flotsam')).map(el=>Number(getComputedStyle(el).zIndex)||0)};
    });
    expect(stack.wrecks.length).toBeGreaterThan(0);
    expect(stack.plate).toBeGreaterThan(38); // also above the front particle canvas, not just a DOM trace
    for(const z of stack.wrecks)expect(stack.plate).toBeGreaterThan(z);
    const presses=await clickMisses(page);
    expect(presses.planks).toBe(4);
    // The phone fan may extend beyond the viewport; audit the four on-screen ships.
    expect(presses.out.filter(message=>message.startsWith('plank '))).toEqual([]);
    evidence.push({viewport,audit,stack});
  }
  const {mkdirSync,writeFileSync}=await import('node:fs');
  mkdirSync('e2e-shots/fx-finish/checks',{recursive:true});
  writeFileSync('e2e-shots/fx-finish/checks/impact-arrival.json',JSON.stringify(evidence,null,1)+'\n');
});
