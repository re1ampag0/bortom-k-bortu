"""Centering audit: text inside buttons/badges/medals is centred; icons line up with the text beside them."""
import asyncio, sys, json
from playwright.async_api import async_playwright
S = '/tmp/claude-0/-home-claude/c1bcb244-4e9a-5b8b-bab0-16784b5af426/scratchpad/menus2'
C = json.load(open(S + '/out/artboards/canvas.json'))['boards']
JS = r'''
() => {
  const out = [];
  const textBox = el => {
    const r = document.createRange(); r.selectNodeContents(el);
    const rs = [...r.getClientRects()].filter(x => x.width > 0 && x.height > 0);
    if (!rs.length) return null;
    return {l: Math.min(...rs.map(x=>x.left)), r: Math.max(...rs.map(x=>x.right)), t: Math.min(...rs.map(x=>x.top)), b: Math.max(...rs.map(x=>x.bottom))};
  };
  const name = el => (el.innerText || el.getAttribute('aria-label') || el.tagName).trim().replace(/\s+/g,' ').slice(0, 40);
  // 1) centred controls: buttons, gold buttons, badges, segment buttons, round icon buttons
  for (const el of document.querySelectorAll('button, .btn-gold, .badge, .round, .medal, [class*="chip"]')) {
    const b = el.getBoundingClientRect(); if (b.width < 8 || b.height < 8) continue;
    const cs = getComputedStyle(el);
    const kids = [...el.children].filter(k => getComputedStyle(k).position !== 'absolute' && k.getBoundingClientRect().width > 0);
    let box = null;
    const parts = kids.map(k => k.getBoundingClientRect());
    const tb = textBox(el);
    const all = [...parts]; if (tb) all.push({left: tb.l, right: tb.r, top: tb.t, bottom: tb.b});
    if (!all.length) continue;
    box = {l: Math.min(...all.map(x=>x.left)), r: Math.max(...all.map(x=>x.right)), t: Math.min(...all.map(x=>x.top)), b: Math.max(...all.map(x=>x.bottom))};
    const dv = (box.t - b.top) - (b.bottom - box.b);
    const centred = cs.justifyContent === 'center' || cs.textAlign === 'center' || el.matches('.round,.medal,.badge,.btn-gold');
    const dh = (box.l - b.left) - (b.right - box.r);
    if (Math.abs(dv) > 2.5) out.push(['V', name(el), Math.round(dv * 10) / 10]);
    if (centred && Math.abs(dh) > 2.5 && b.width < 420) out.push(['H', name(el), Math.round(dh * 10) / 10]);
  }
  // 2) icon next to text in a flex row: vertical centres must match
  for (const img of document.querySelectorAll('img, svg')) {
    const p = img.parentElement; if (!p) continue;
    const cs = getComputedStyle(p); if (cs.display !== 'flex' && cs.display !== 'inline-flex') continue;
    if (cs.flexDirection.startsWith('column')) continue;
    if (getComputedStyle(img).position === 'absolute') continue;
    const ib = img.getBoundingClientRect(); if (ib.width < 10) continue;
    const tb = textBox(p); if (!tb) continue;
    const d = ((ib.top + ib.bottom) / 2) - ((tb.t + tb.b) / 2);
    if (Math.abs(d) > 2.5) out.push(['I', name(p), Math.round(d * 10) / 10]);
  }
  return out;
}
'''


async def main(names):
    async with async_playwright() as p:
        b = await p.chromium.launch()
        for n in names:
            bd = C[n + '.dc.html']
            ctx = await b.new_context(viewport={'width': bd['w'], 'height': min(bd['h'], 2000)})
            pg = await ctx.new_page()
            await pg.goto(f'http://127.0.0.1:8766/artboards/{n}.dc.html')
            await pg.wait_for_timeout(1800)
            await pg.add_style_tag(content='*{animation:none!important;transition:none!important}')
            await pg.wait_for_timeout(200)
            res = await pg.evaluate(JS)
            print(f'## {n}: {len(res)}')
            for r in res:
                print('  ', r)
            await ctx.close()
        await b.close()

asyncio.run(main(sys.argv[1:]))
