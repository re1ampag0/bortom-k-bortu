// fx-finish: frames of the real Game at fixed moments of a clip, the same in two builds (a controlled clock: timers,
// rAF and every native animation advance together; Math.random seeded), and the pixel difference between them.
// node scripts/fx-finish/capture.mjs BEFORE_DIST AFTER_DIST [scene ...]   scenes: legend armada bottle idle (or regroup volley card)
import {preview} from 'vite';
import {chromium, expect} from '@playwright/test';
import {PNG} from 'pngjs';
import {existsSync, mkdirSync, readFileSync, writeFileSync, readdirSync} from 'node:fs';

const [beforeDist, afterDist, ...rest] = process.argv.slice(2);
const selected=rest.filter(s=>!s.startsWith('--'));
const tag=rest.find(s=>s.startsWith('--tag='))?.slice(6);
if(tag&&!/^[a-z0-9-]+$/i.test(tag))throw Error('Invalid capture tag');
const scenes = selected.length ? selected : ['legend','armada','bottle','idle'];
// the moments after the press, ms of the clip clock: around the renderWith of each clip and after it
const MOMENTS = {hit:[800,2000,3200,4200,5200],'idle-compositor':[1000,4600,4800,5000],'idle-motion':[1000,4600,4800,5000],legend:[1000,2200],armada:[900],bottle:[6000,8000],idle:[1000,3000],kraken:[6000],jack:[9000],regroup: [150, 400, 700, 1000, 1600], volley: [800, 2000, 3200, 4200, 5200], card: [300, 900, 1500, 2100, 2700]};
const OUT = 'docs/screenshots/fx-finish/'+(tag?'frames-'+tag:'frames');
mkdirSync(OUT, {recursive: true});
// Capture-only hook in generated, unminified temporary builds. Bring canvas to the
// SAME controlled instant as the native wrappers, instead of the preceding rAF.
for(const dist of new Set([beforeDist,afterDist])){
  for(const name of readdirSync(`${dist}/assets`).filter(n=>n.endsWith('.js'))){
    const path=`${dist}/assets/${name}`,source=readFileSync(path,'utf8');
    if(!source.includes('function prepareParticles(')||source.includes('window.fxCaptureParticles='))continue;
    const prep=source.slice(source.indexOf('function prepareParticles('));
    const bank=prep.match(/if \((\w+(?:\$\w+)?)\.has\(board\)\)/)?.[1];
    if(!bank||!source.includes('function draw(b)')||!source.includes('function advance(b)'))throw Error('Unknown particle bundle; capture hook refused');
    writeFileSync(path,source+`\nwindow.fxCaptureParticles=()=>Array.from(document.querySelectorAll('.board')).flatMap(board=>{const b=${bank}.get(board);if(!b)return [];advance(b);draw(b);return [{clock:performance.now(),time:b.now,count:b.items.length}];});\n`);
  }
}


async function shoot(dist, port, tag) {
  const server = await preview({build: {outDir: dist}, preview: {host: '127.0.0.1', port, strictPort: true}});
  const browser = await chromium.launch({executablePath:process.env.CHROMIUM_PATH??'/usr/bin/chromium'});
  try {
    for (const scene of scenes) {
      const page = await browser.newPage({viewport: {width: 390, height: 844}, deviceScaleFactor: 2, isMobile: true, hasTouch: true});
      const errors = [];
      page.on('pageerror', (e) => errors.push(e.message));
      await page.clock.install({time: new Date(0)});
      await page.clock.pauseAt(new Date(1));
      await page.addInitScript(() => {
        let seed = 19427;
        Math.random = () => ((seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0) / 4294967296);
        window.fxAnims = [];
        window.fxCpu={active:true,start:0,svg:[],renders:[]};
        const controlled = new WeakSet(), state = Object.getOwnPropertyDescriptor(Animation.prototype, 'playState').get;
        Object.defineProperty(Animation.prototype, 'playState', {configurable: true, get() { const s = state.call(this); return s === 'paused' && controlled.has(this) && !this.fxHeld ? 'running' : s; }});
        const native = Element.prototype.animate;
        Element.prototype.animate = function (frames, options) {
          const a = native.call(this, frames, options);
          a.pause(); controlled.add(a); a.currentTime = 0;
          window.fxAnims.push({a, at: performance.now()});
          return a;
        };
      });
      const step = async (ms) => {
        for (let t = 0; t < ms; t += 20) {
          await page.clock.runFor(20);
          await page.evaluate(() => {
            const now = performance.now();
            for (const row of window.fxAnims) {
              const a = row.a;
              if (a.playState === 'idle' || a.playState === 'finished') continue;
              const dt = now - row.at, end = a.effect?.getComputedTiming().endTime ?? 0;
              if (dt >= end) a.finish(); else a.currentTime = Math.max(0, dt);
            }
            for (const a of document.getAnimations()) if (a instanceof CSSAnimation) { a.pause(); a.currentTime = 0; }
          });
        }
      };
      const busy = () => page.evaluate(() => { const g = document.querySelector('.game'); return !!g && (g.classList.contains('fx-busy') || g.hasAttribute('data-fx-busy')); });
      const until = async (ok, limit = 60000) => { for (let t = 0; t < limit; t += 200) { if (await ok()) return; await step(200); } throw new Error('timeout'); };
      const click = async (sel) => { const el = page.locator(sel).filter({visible: true}).first(); await expect(el).toBeVisible(); await el.click(); };
      if(['legend','armada','bottle','kraken','jack'].includes(scene)){
        await page.goto(`http://127.0.0.1:${port}/bortom-k-bortu/?fxScene=${scene==='legend'?'bottle':scene}&manual=1&speed=normal&perf=0`);
        await page.evaluate(()=>document.fonts.ready);
        await click('[data-testid="fx-start"]');
        await until(async()=>!!await page.locator(scene==='armada'?'.gun-fire':'.lg-card').count());
        await page.evaluate(()=>document.fonts.ready);
      }else{
      await page.goto(`http://127.0.0.1:${port}/bortom-k-bortu/?seed=1&speed=normal&hints=0&perf=0`);
      for (const id of ['quick-bots', 'pick-pirates', 'prep-start', 'placement-done']) { await click(`[data-testid="${id}"]`); await step(100); }
      await until(async () => !(await busy()) && !!(await page.locator('[data-testid="volley-Ж"]').filter({visible: true}).count()));
      await step(1000);
      if(scene.startsWith('idle')){}
      else if (scene === 'regroup') await click('.regroup');
      else if (scene === 'volley'||scene==='hit') {
        await click('[data-testid="volley-Ж"]');await step(200);await click('[data-testid="plate-И"]');await step(200);
        if(scene==='hit'){await click('.charge-sheet [data-fx-card="Ж-04"]');await step(200);}
        await click('[data-testid="fire"]');
      }
      else { await click('[data-fx-hand] [data-fx-card="Ж-14"]'); await step(200); await click('[data-testid="lift-play"]'); await step(200); await click('[data-testid="plate-И"]'); await step(200); await click('[data-testid="play-card"]'); }
      }
      let at = 0;const sampleClocks={};
      for (const m of MOMENTS[scene]) {
        await step(m - at); at = m;
        if(scene==='idle-motion'||scene==='idle-compositor')await page.evaluate(({phase,scene})=>{
          for(const a of document.getAnimations())if(a instanceof CSSAnimation){a.pause();a.currentTime=phase;}
          // Canonical source-cycle phase for the finite native medal sweeps. During
          // a static hold the driver has no animation, so set the same source transform.
          if(scene==='idle-compositor')for(const el of document.querySelectorAll('.medal-scheduled')){
            const a=el.getAnimations().find(a=>a.id==='medal-glint');
            const frames=a?.effect.getKeyframes();
            const from=frames?.[0]?.transform??'translateX(-85.71428571428571%) skewX(-22deg)',to=frames?.[1]?.transform??'translateX(85.71428571428571%) skewX(-22deg)';
            const demo=el.animate([{transform:from},{transform:to}],{duration:960,delay:4320,easing:'ease-in-out',fill:'both'});
            a?.cancel();demo.pause();demo.currentTime=phase;
          }
        },{phase:m,scene});
        sampleClocks[m]=await page.evaluate(()=>window.fxCaptureParticles?.()??[]);
        await page.screenshot({path: `${OUT}/${scene}-${m}-${tag}.png`});
      }
      writeFileSync(`${OUT}/${scene}-${tag}-clocks.json`,JSON.stringify(sampleClocks,null,1));
      if(errors.length)throw new Error(JSON.stringify(errors));
      if(['armada','bottle','kraken','jack'].includes(scene))await until(()=>page.evaluate(()=>document.body.dataset.fxDone==='1'));
      writeFileSync(`${OUT}/${scene}-${tag}-svg.json`,JSON.stringify(await page.evaluate(()=>window.fxCpu.svg),null,1));
      await page.close();
    }
  } finally {
    await browser.close();
    await new Promise((r) => server.httpServer.close(r));
  }
}

if(!rest.includes('--reuse-before'))await shoot(beforeDist, 5196, 'before');
await shoot(afterDist, 5197, 'after');
const report = existsSync(`${OUT}/differences.json`)?JSON.parse(readFileSync(`${OUT}/differences.json`,'utf8')):{};
for (const scene of scenes) for (const m of MOMENTS[scene]) {
  const a = PNG.sync.read(readFileSync(`${OUT}/${scene}-${m}-before.png`)), b = PNG.sync.read(readFileSync(`${OUT}/${scene}-${m}-after.png`));
  let diff = 0,rgbaDifferentPixels=0,maxChannelDifference=0;
  const side = new PNG({width: a.width * 2 + 8, height: a.height});
  for (let y = 0; y < a.height; y++) for (let x = 0; x < a.width; x++) {
    const i = (y * a.width + x) * 4, j = (y * side.width + x) * 4, k = (y * side.width + x + a.width + 8) * 4;
    const exact=Math.max(...[0,1,2,3].map(c=>Math.abs(a.data[i+c]-b.data[i+c])));
    if(exact)rgbaDifferentPixels++;maxChannelDifference=Math.max(maxChannelDifference,exact);
    if (Math.max(...[0, 1, 2].map((c) => Math.abs(a.data[i + c] - b.data[i + c]))) > 6) diff++;
    for (let c = 0; c < 4; c++) { side.data[j + c] = a.data[i + c]; side.data[k + c] = b.data[i + c]; }
  }
  writeFileSync(`${OUT}/${scene}-${m}-comparison.png`, PNG.sync.write(side));
  report[`${scene}-${m}`] = {rgbaDifferentPixels,maxChannelDifference,differentPixels: diff, share: +(diff / (a.width * a.height) * 100).toFixed(3)};
}
writeFileSync(`${OUT}/differences.json`, JSON.stringify(report, null, 1) + '\n');
console.log(report);
