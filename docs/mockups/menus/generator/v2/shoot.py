import asyncio,sys,json
from playwright.async_api import async_playwright
S='/tmp/claude-0/-home-claude/c1bcb244-4e9a-5b8b-bab0-16784b5af426/scratchpad/menus2'
C=json.load(open(S+'/out/artboards/canvas.json'))['boards']
async def m():
  async with async_playwright() as p:
    b=await p.chromium.launch()
    for n in sys.argv[1:]:
      bd=C[n+'.dc.html']; ctx=await b.new_context(viewport={'width':bd['w'],'height':bd['h']},device_scale_factor=1)
      pg=await ctx.new_page(); errs=[]; pg.on('pageerror',lambda e: errs.append(str(e))); pg.on('console',lambda m: errs.append(m.text) if m.type=='error' else None)
      await pg.goto(f'http://127.0.0.1:8766/artboards/{n}.dc.html'); await pg.wait_for_timeout(2200)
      await pg.screenshot(path=f'{S}/shot_{n}.png'); print(n,errs[:3]); await ctx.close()
    await b.close()
asyncio.run(m())
