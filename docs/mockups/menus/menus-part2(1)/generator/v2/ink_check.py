"""Optical centring audit by ink: screenshot each control with and without its content, diff the pixels,
and compare the ink box with the control's box. Font line boxes lie; pixels don't."""
import asyncio, sys, json, io
from PIL import Image, ImageChops
from playwright.async_api import async_playwright
S = '/tmp/claude-0/-home-claude/c1bcb244-4e9a-5b8b-bab0-16784b5af426/scratchpad/menus2'
C = json.load(open(S + '/out/artboards/canvas.json'))['boards']
SEL = 'button, .btn-gold, .badge, .seg button, a.round, .tile, .medal, .round'


def ink_box(a, b):
    d = ImageChops.difference(a.convert('RGB'), b.convert('RGB')).convert('L').point(lambda v: 255 if v > 40 else 0)
    return d.getbbox()


async def main(names, thr):
    async with async_playwright() as p:
        br = await p.chromium.launch()
        for n in names:
            bd = C[n + '.dc.html']
            ctx = await br.new_context(viewport={'width': bd['w'], 'height': min(bd['h'], 1400)}, device_scale_factor=2)
            pg = await ctx.new_page()
            await pg.goto(f'http://127.0.0.1:8766/artboards/{n}.dc.html')
            await pg.wait_for_timeout(1800)
            await pg.add_style_tag(content='*{animation:none!important;transition:none!important}.plaque::after{display:none}')
            await pg.wait_for_timeout(300)
            cnt = await pg.evaluate(f'document.querySelectorAll({json.dumps(SEL)}).length')
            res = []
            for i in range(cnt):
                info = await pg.evaluate('''([sel,i]) => { const el = document.querySelectorAll(sel)[i]; const b = el.getBoundingClientRect();
                    const cs = getComputedStyle(el); const bw = parseFloat(cs.borderLeftWidth)||0;
                    return {x:b.left+bw, y:b.top+bw, w:b.width-2*bw, h:b.height-2*bw, name:(el.innerText||el.getAttribute('aria-label')||el.className||'').trim().replace(/\\s+/g,' ').slice(0,36),
                            centred: cs.justifyContent==='center'||cs.textAlign==='center'||el.matches('.btn-gold,.badge,.round,.medal,.seg button'), tile: el.matches('.tile')} }''', [SEL, i])
                if info['w'] < 10 or info['h'] < 10 or info['tile']:
                    continue
                clip = {'x': info['x'], 'y': info['y'], 'width': info['w'], 'height': info['h']}
                a = Image.open(io.BytesIO(await pg.screenshot(clip=clip)))
                await pg.evaluate('''([sel,i]) => { const el = document.querySelectorAll(sel)[i]; el.dataset.ink='1';
                    const st = document.createElement('style'); st.id='inkst'; st.textContent='[data-ink] *, [data-ink]{color:transparent!important;text-shadow:none!important;-webkit-text-fill-color:transparent!important} [data-ink] img,[data-ink] svg,[data-ink] i{visibility:hidden!important}'; document.head.appendChild(st); }''', [SEL, i])
                bimg = Image.open(io.BytesIO(await pg.screenshot(clip=clip)))
                await pg.evaluate('''([sel,i]) => { const el = document.querySelectorAll(sel)[i]; delete el.dataset.ink; document.getElementById('inkst').remove(); }''', [SEL, i])
                bb = ink_box(a, bimg)
                if not bb:
                    continue
                W, H = a.size
                top, bot = bb[1] / 2, (H - bb[3]) / 2
                left, right = bb[0] / 2, (W - bb[2]) / 2
                dv = top - bot
                dh = left - right
                flag = []
                if abs(dv) > thr:
                    flag.append(f'V{dv:+.1f}')
                if info['centred'] and abs(dh) > thr:
                    flag.append(f'H{dh:+.1f}')
                if flag:
                    res.append((info['name'], ' '.join(flag)))
            print(f'## {n}: {len(res)}')
            for r in res:
                print('   ', r)
            await ctx.close()
        await br.close()

thr = 2.0
asyncio.run(main(sys.argv[1:], thr))
