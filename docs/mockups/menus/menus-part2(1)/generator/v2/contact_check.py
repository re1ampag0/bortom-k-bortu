"""Contact audit: framed elements must either clearly sit inside their frame (gap >= 6 px) or not touch at all.
Flags near-touches to the parent frame and between neighbouring framed elements."""
import asyncio, sys, json
from playwright.async_api import async_playwright
S = '/tmp/claude-0/-home-claude/c1bcb244-4e9a-5b8b-bab0-16784b5af426/scratchpad/menus2'
C = json.load(open(S + '/out/artboards/canvas.json'))['boards']
JS = r'''
(MIN) => {
  const framed = el => {
    if (el.closest('[aria-hidden="true"]')) return false;
    const cs = getComputedStyle(el);
    if (cs.visibility === 'hidden' || cs.display === 'none') return false;
    const b = el.getBoundingClientRect(); if (b.width < 6 || b.height < 6) return false;
    if (el.tagName === 'IMG') return true;
    const bw = parseFloat(cs.borderTopWidth) > .5 && cs.borderTopColor !== 'rgba(0, 0, 0, 0)';
    const bg = cs.backgroundImage !== 'none' || (cs.backgroundColor !== 'rgba(0, 0, 0, 0)' && cs.backgroundColor !== 'transparent');
    return bw || (bg && el.tagName !== 'HTML' && el.tagName !== 'BODY');
  };
  const name = el => ((el.className && el.className.baseVal === undefined ? el.className : '') + ' ' + (el.innerText || el.getAttribute('alt') || el.tagName)).trim().replace(/\s+/g, ' ').slice(0, 46);
  const els = [...document.querySelectorAll('body *')].filter(framed);
  const set = new Set(els);
  const out = [];
  const big = e => { const b = e.getBoundingClientRect(); return b.width > 1300 || b.height > 600; };
  for (const e of els) {
    let a = e.parentElement; while (a && !set.has(a)) a = a.parentElement;
    if (!a || big(a)) continue;
    if (getComputedStyle(e).position === 'absolute' && e.tagName !== 'IMG' && !e.matches('button,a,.badge')) continue;
    const eb = e.getBoundingClientRect(), ab = a.getBoundingClientRect(), cs = getComputedStyle(a);
    const bl = parseFloat(cs.borderLeftWidth), bt = parseFloat(cs.borderTopWidth);
    const inner = {l: ab.left + bl, r: ab.right - bl, t: ab.top + bt, b: ab.bottom - bt};
    const ov = getComputedStyle(a).overflow;
    const d = {L: eb.left - inner.l, R: inner.r - eb.right, T: eb.top - inner.t, B: inner.b - eb.bottom};
    for (const [k, v] of Object.entries(d)) {
      if (v > .5 && v < MIN) out.push(['frame', k, Math.round(v * 10) / 10, name(e), '→', name(a)]);
      if (v < -.5 && v > -12 && ov === 'visible') out.push(['sticks-out', k, Math.round(v * 10) / 10, name(e), '→', name(a)]);
    }
  }
  // neighbours
  for (let i = 0; i < els.length; i++) for (let j = i + 1; j < els.length; j++) {
    const x = els[i], y = els[j];
    if (x.contains(y) || y.contains(x) || x.parentElement !== y.parentElement) continue;
    const p = x.getBoundingClientRect(), q = y.getBoundingClientRect();
    const gx = Math.max(q.left - p.right, p.left - q.right), gy = Math.max(q.top - p.bottom, p.top - q.bottom);
    if (gx < 0 && gy < 0) {
      if (Math.min(p.right, q.right) - Math.max(p.left, q.left) < 10 || Math.min(p.bottom, q.bottom) - Math.max(p.top, q.top) < 10)
        out.push(['overlap-edge', '', 0, name(x), '×', name(y)]);
      continue;
    }
    const g = Math.max(gx, gy);
    if (g > .5 && g < 4 && (gx < 0 || gy < 0)) out.push(['gap', '', Math.round(g * 10) / 10, name(x), '|', name(y)]);
  }
  return out;
}
'''


async def main(names):
    async with async_playwright() as p:
        b = await p.chromium.launch()
        for n in names:
            bd = C[n + '.dc.html']
            ctx = await b.new_context(viewport={'width': bd['w'], 'height': min(bd['h'], 1400)})
            pg = await ctx.new_page()
            await pg.goto(f'http://127.0.0.1:8766/artboards/{n}.dc.html')
            await pg.wait_for_timeout(1500)
            await pg.add_style_tag(content='*{animation:none!important;transition:none!important}')
            await pg.wait_for_timeout(200)
            res = await pg.evaluate(JS, 6)
            print(f'## {n}: {len(res)}')
            for r in res[:40]:
                print('   ', r)
            await ctx.close()
        await b.close()

asyncio.run(main(sys.argv[1:]))
