import asyncio,sys,os,glob
from playwright.async_api import async_playwright
S='/tmp/claude-0/-home-claude/c1bcb244-4e9a-5b8b-bab0-16784b5af426/scratchpad/menus2'
files=sys.argv[1:]
cells=''.join(f'<div class=c><div class=m><img src="file://{f}"></div><div class=b><img src="file://{f}"></div><span>{os.path.basename(f)}</span></div>' for f in files)
html=f'''<style>body{{margin:0;background:#0e1b26;font:12px sans-serif;color:#ccc;display:flex;flex-wrap:wrap;gap:14px;padding:14px}}
.c{{display:flex;flex-direction:column;align-items:center;gap:6px}}.m{{width:66px;height:66px;border-radius:50%;background:radial-gradient(circle at 50% 40%,#fbf4e2 55%,#d8c69a);border:3px solid #c9a048;display:flex;align-items:center;justify-content:center}}.m img{{width:50px}}.b img{{width:150px}}</style>{cells}'''
open(S+'/sheet.html','w').write(html)
async def m():
  async with async_playwright() as p:
    b=await p.chromium.launch(); pg=await b.new_page(viewport={'width':1400,'height':300},device_scale_factor=1.5)
    await pg.goto('file://'+S+'/sheet.html'); await pg.wait_for_timeout(300)
    await pg.screenshot(path=S+'/sheet.png',full_page=True); await b.close()
asyncio.run(m())
