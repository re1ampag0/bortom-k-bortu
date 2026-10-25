"""Measure each icon's ink centre and, with --fix, recentre it by shifting the viewBox (scale unchanged)."""
import asyncio, re, glob, io, os, sys
from PIL import Image
from playwright.async_api import async_playwright
D = '/tmp/claude-0/-home-claude/c1bcb244-4e9a-5b8b-bab0-16784b5af426/scratchpad/menus2/out/assets/icons'
FIX = '--fix' in sys.argv


async def m():
    async with async_playwright() as p:
        b = await p.chromium.launch()
        pg = await b.new_page(viewport={'width': 512, 'height': 512})
        for f in sorted(glob.glob(D + '/*.svg')):
            n = os.path.basename(f)
            await pg.goto('http://127.0.0.1:8766/README.md')
            await pg.set_content(f'<html><body style="margin:0;background:transparent"><img src="http://127.0.0.1:8766/assets/icons/{n}?v={os.path.getmtime(f)}" style="width:512px;height:512px;display:block"></body></html>')
            await pg.wait_for_timeout(150)
            png = await pg.screenshot(omit_background=True)
            a = Image.open(io.BytesIO(png)).split()[-1]
            # ignore the soft ground shadow: only fairly opaque pixels count
            bb = a.point(lambda v: 255 if v > 150 else 0).getbbox()
            s = open(f).read()
            vb = [float(x) for x in re.search(r'viewBox="([^"]+)"', s).group(1).split()]
            k = vb[2] / 512
            cx, cy = vb[0] + (bb[0] + bb[2]) / 2 * k, vb[1] + (bb[1] + bb[3]) / 2 * k
            ox, oy = cx - (vb[0] + vb[2] / 2), cy - (vb[1] + vb[3] / 2)
            print(f'{n:20s} off {ox:+5.1f},{oy:+5.1f}')
            if FIX and (abs(ox) > .8 or abs(oy) > .8):
                nvb = f'{vb[0] + ox:.2f} {vb[1] + oy:.2f} {vb[2]:g} {vb[3]:g}'
                s = re.sub(r'viewBox="[^"]+"', f'viewBox="{nvb}"', s, count=1)
                open(f, 'w').write(s)
        await b.close()

asyncio.run(m())
