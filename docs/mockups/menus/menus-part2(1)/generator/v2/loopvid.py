"""Seamless looping preview: render L+D seconds frame by frame (animations driven by currentTime),
then cross-fade the last D seconds into the first D, so the end flows into the start without a jump."""
import asyncio, sys, os, subprocess, shutil
from PIL import Image
from playwright.async_api import async_playwright
M = '/tmp/claude-0/-home-claude/c1bcb244-4e9a-5b8b-bab0-16784b5af426/scratchpad/menus2'
OUT = '/tmp/claude-0/-home-claude/c1bcb244-4e9a-5b8b-bab0-16784b5af426/scratchpad/menugal/img'


async def frames(name, w, h, L, D, fps, d):
    async with async_playwright() as p:
        b = await p.chromium.launch()
        pg = await b.new_page(viewport={'width': w, 'height': h})
        await pg.goto(f'http://127.0.0.1:8766/artboards/{name}.dc.html')
        await pg.wait_for_timeout(1500)
        await pg.evaluate("document.getAnimations().forEach(a=>a.pause())")
        n = int(round(L * fps)) + int(round(D * fps))
        for i in range(n):
            t = 3000 + i * 1000 / fps
            await pg.evaluate(f"document.getAnimations().forEach(a=>{{a.currentTime={t}}})")
            await pg.screenshot(path=f'{d}/r{i:04d}.png')
        await b.close()


def main(name, w, h, L, D, fps, tag):
    d = f'{M}/lf_{tag}'
    shutil.rmtree(d, ignore_errors=True); os.makedirs(d)
    asyncio.run(frames(name, w, h, L, D, fps, d))
    N, K = int(round(L * fps)), int(round(D * fps))
    for i in range(N):
        a = Image.open(f'{d}/r{i:04d}.png').convert('RGB')
        if i < K:
            b = Image.open(f'{d}/r{N + i:04d}.png').convert('RGB')
            a = Image.blend(b, a, i / K)       # starts as the frame after the end, eases into the start
        a.save(f'{d}/o{i:04d}.png')
    subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-framerate', str(fps), '-i', f'{d}/o%04d.png', '-c:v', 'libx264', '-pix_fmt', 'yuv420p',
                    '-crf', '20', '-preset', 'slow', '-movflags', '+faststart', f'{OUT}/{tag}.mp4'], check=True)
    shutil.rmtree(d)


if __name__ == '__main__':
    name, w, h, L, D, fps, tag = sys.argv[1], int(sys.argv[2]), int(sys.argv[3]), float(sys.argv[4]), float(sys.argv[5]), int(sys.argv[6]), sys.argv[7]
    main(name, w, h, L, D, fps, tag)
