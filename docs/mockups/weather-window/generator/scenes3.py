import math, random, re
from helpers import INK, cloud_strip, svg, sun_disc, ripple
from scenes2 import CSS as CSS2, flapping_gull
import scenes2
from common import ship, sea, spk

# ------------------------------------------------------------------ rain


def rain(key, w, h, sea_top, sea_bot, slant=.3, dens=1.0, color='#cfdde6', splashes=16, curtain='#5a6872', seed=3):
    """Layered rain: far fine drizzle, mid streaks, near long blurred streaks; each layer a seamless tile falling
    along the slant; small crowns and rings where drops hit the sea; distant rain curtains under the clouds."""
    R = random.Random(seed)
    css, html = [], []
    layers = [  # count, Lmin, Lmax, width, opacity range, duration
        (int(170 * dens), 5, 10, .6, (.18, .38), 1.05),
        (int(95 * dens), 11, 19, .85, (.25, .5), .62),
        (int(34 * dens), 24, 40, 1.4, (.25, .45), .36),
    ]
    k = 1 / math.sqrt(1 + slant * slant)
    pad = slant * h + 40
    for li, (n, l0, l1, sw, (o0, o1), dur) in enumerate(layers):
        cls = f'rn-{key}-{li}'
        tx, ty = -slant * h, h
        css.append(f'.{cls}{{animation:{cls} {dur}s linear infinite}}@keyframes {cls}{{from{{transform:translate(0,0)}}to{{transform:translate({tx:.1f}px,{ty}px)}}}}')
        base = []
        for _ in range(n):
            x, y = R.uniform(-40, w + pad), R.uniform(0, h)
            L = R.uniform(l0, l1)
            dx, dy = -slant * L * k, L * k
            base.append(f'<path d="M{x:.1f} {y:.1f} l{dx:.1f} {dy:.1f}" stroke="{color}" stroke-width="{sw * R.uniform(.8, 1.2):.2f}" stroke-linecap="round" opacity="{R.uniform(o0, o1):.2f}"></path>')
        g = ''.join(base)
        html.append(f'<svg aria-hidden="true" width="{w}" height="{h}" viewBox="0 0 {w} {h}" style="position: absolute; left: 0; top: 0; z-index: 4; overflow: hidden; pointer-events: none">'
                    f'<g class="{cls}"><g>{g}</g><g transform="translate({slant * h:.1f} {-h})">{g}</g></g></svg>')
    # distant curtains of rain hanging under the clouds (slowly drifting), behind the sea
    cur = []
    for dx in (0, w):
        for _ in range(5):
            x = R.uniform(0, w) + dx
            ww = R.uniform(60, 160)
            cur.append(f'<path d="M{x:.0f} 10 L{x+ww:.0f} 10 L{x+ww - slant*140:.0f} {sea_top} L{x - slant*140:.0f} {sea_top} Z" fill="url(#rc-{key})"></path>')
    css.append(f'.rn-cur-{key}{{animation:rn-cur-{key} 70s linear infinite}}@keyframes rn-cur-{key}{{to{{transform:translateX(-{w}px)}}}}')
    html.insert(0, f'<svg aria-hidden="true" width="{2*w}" height="{h}" viewBox="0 0 {2*w} {h}" class="rn-cur-{key}" style="position: absolute; left: 0; top: 0; z-index: 0">'
                f'<defs><linearGradient id="rc-{key}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="{curtain}" stop-opacity="0"></stop><stop offset=".35" stop-color="{curtain}" stop-opacity=".35"></stop><stop offset="1" stop-color="{curtain}" stop-opacity=".12"></stop></linearGradient></defs>{"".join(cur)}</svg>')
    # a wet haze softening the horizon
    html.append(f'<div aria-hidden="true" style="position: absolute; left: 0; right: 0; top: {sea_top-40}px; height: 70px; z-index: 1; pointer-events: none; background: linear-gradient(rgba(210,222,230,0), rgba(210,222,230,.22) 55%, rgba(210,222,230,0))"></div>')
    # drops hitting the sea: little crowns and rings
    sp = []
    for i in range(splashes):
        x, y = R.uniform(10, w - 10), R.uniform(sea_top + 4, sea_bot)
        s = .5 + (y - sea_top) / (sea_bot - sea_top) * .9
        d = R.uniform(0, 1.2)
        sp.append(f'<g transform="translate({x:.0f} {y:.0f}) scale({s:.2f})"><path class="rn-crown" style="animation-delay:-{d:.2f}s" d="M-4 0 L-5.5 -4 M-1.5 0 L-1.8 -5.5 M1.5 0 L1.8 -5.5 M4 0 L5.5 -4" stroke="{color}" stroke-width="1.1" stroke-linecap="round" fill="none"></path>'
                  f'<ellipse class="rn-ring" style="animation-delay:-{d:.2f}s" cx="0" cy="0" rx="6" ry="1.6" fill="none" stroke="{color}" stroke-width=".9"></ellipse></g>')
    html.append(f'<svg aria-hidden="true" width="{w}" height="{h}" viewBox="0 0 {w} {h}" style="position: absolute; left: 0; top: 0; z-index: 4; pointer-events: none">{"".join(sp)}</svg>')
    css.append('.rn-crown{transform-box:fill-box;transform-origin:50% 100%;animation:rn-crown 1.2s ease-out infinite;opacity:0}@keyframes rn-crown{0%{opacity:0;transform:scale(.5,.2)}10%{opacity:.85;transform:scale(1,1)}35%,100%{opacity:0;transform:scale(1.25,.5)}}'
               '.rn-ring{transform-box:fill-box;transform-origin:50% 50%;animation:rn-ring 1.2s ease-out infinite;opacity:0}@keyframes rn-ring{0%,5%{opacity:0;transform:scale(.3)}12%{opacity:.7}60%,100%{opacity:0;transform:scale(1.6)}}'
               '@media (prefers-reduced-motion: reduce){[class*="rn-"]{animation:none !important}}')
    return '\n'.join(css), ''.join(html)


def strip_old_rain(html):
    return re.sub(r'<div class="w-rain"[^>]*></div>', '', html)


# ------------------------------------------------------------------ Ясное небо: an exchange of bow-chaser fire

CV_CSS = r'''
.cv-muz,.cv-muzL{transform-box:fill-box;transform-origin:0 50%;animation:cv-muz 4s linear infinite;opacity:0}.cv-muzL{transform-origin:100% 50%}
@keyframes cv-muz{0%{opacity:0;transform:scale(.2,.5)}.8%{opacity:1;transform:scale(1.1,1)}3%{opacity:.55;transform:scale(1.35,.75)}6%,100%{opacity:0;transform:scale(1.5,.4)}}
.cv-glow{animation:cv-glow 4s linear infinite;opacity:0}@keyframes cv-glow{0%{opacity:0}1%{opacity:.75}9%,100%{opacity:0}}
.cv-sA,.cv-sB,.cv-sC,.cv-sD{transform-box:fill-box;transform-origin:50% 50%;animation:cv-sA 4s cubic-bezier(.15,.7,.3,1) infinite;opacity:0}
.cv-sB{animation-name:cv-sB}.cv-sC{animation-name:cv-sC}.cv-sD{animation-name:cv-sD}
@keyframes cv-sA{0%{opacity:0;transform:translate(0,0) scale(.25)}1.5%{opacity:.95}40%{opacity:.75}100%{opacity:0;transform:translate(-26px,-30px) scale(3.4)}}
@keyframes cv-sB{0%{opacity:0;transform:translate(0,0) scale(.3)}2%{opacity:.9}45%{opacity:.7}100%{opacity:0;transform:translate(14px,-22px) scale(2.8)}}
@keyframes cv-sC{0%{opacity:0;transform:translate(0,0) scale(.2)}2.5%{opacity:.85}50%{opacity:.6}100%{opacity:0;transform:translate(-6px,-48px) scale(3.8)}}
@keyframes cv-sD{0%{opacity:0;transform:translate(0,0) scale(.3)}3%{opacity:.8}55%{opacity:.5}100%{opacity:0;transform:translate(30px,-12px) scale(3)}}
.cv-ballR{animation:cv-ballR 4s linear infinite;opacity:0}@keyframes cv-ballR{0%,1%{opacity:0;transform:translate(0,0)}1.5%{opacity:.75}6.5%{transform:translate(92px,-7px)}12%{opacity:.75;transform:translate(181px,10px)}12.5%,100%{opacity:0;transform:translate(181px,10px)}}
.cv-ballL{animation:cv-ballL 4s linear infinite;opacity:0}@keyframes cv-ballL{0%,1%{opacity:0;transform:translate(0,0)}1.5%{opacity:.75}6.5%{transform:translate(-84px,-6px)}12%{opacity:.75;transform:translate(-166px,25px)}12.5%,100%{opacity:0;transform:translate(-166px,25px)}}
.cv-hit{transform-box:fill-box;transform-origin:50% 50%;animation:cv-hit 4s ease-out infinite;opacity:0}@keyframes cv-hit{0%,12%{opacity:0;transform:scale(.3)}12.6%{opacity:1;transform:scale(1)}17%,100%{opacity:0;transform:scale(1.7)}}
.cv-dust{transform-box:fill-box;transform-origin:50% 50%;animation:cv-dust 4s ease-out infinite;opacity:0}@keyframes cv-dust{0%,12%{opacity:0;transform:translate(0,0) scale(.3)}14%{opacity:.8}60%,100%{opacity:0;transform:translate(10px,-16px) scale(2.4)}}
.cv-spl{transform-box:fill-box;transform-origin:50% 100%;animation:cv-spl 4s ease-out infinite;opacity:0}@keyframes cv-spl{0%,12%{opacity:0;transform:scale(.5,0)}14%{opacity:1;transform:scale(1,.8)}22%{opacity:.95;transform:scale(1.1,1.15)}38%{opacity:0;transform:scale(1.35,.45)}100%{opacity:0}}
.cv-sfoam{transform-box:fill-box;transform-origin:50% 50%;animation:cv-sfoam 4s ease-out infinite;opacity:0}@keyframes cv-sfoam{0%,13%{opacity:0;transform:scale(.3)}16%{opacity:.9}55%,100%{opacity:0;transform:scale(1.8)}}
'''


def shard_css():
    R = random.Random(21)
    out = []
    for i in range(7):
        dx, dy = R.uniform(4, 30), R.uniform(-26, -8)
        r = R.uniform(200, 600) * (1 if i % 2 else -1)
        out.append(f'.cv-sh{i}{{transform-box:fill-box;transform-origin:50% 50%;animation:cv-sh{i} 4s ease-out infinite;opacity:0}}'
                   f'@keyframes cv-sh{i}{{0%,12%{{opacity:0;transform:translate(0,0) rotate(0)}}12.8%{{opacity:1}}26%{{transform:translate({dx:.0f}px,{dy:.0f}px) rotate({r*.5:.0f}deg)}}48%,100%{{opacity:0;transform:translate({dx*1.5:.0f}px,{dy+46:.0f}px) rotate({r:.0f}deg)}}}}')
    return ''.join(out)


def drop_css():
    out = []
    for i, (dx, dy) in enumerate([(-10, -26), (6, -34), (14, -20), (-16, -14), (0, -40)]):
        out.append(f'.cv-dr{i}{{animation:cv-dr{i} 4s ease-in infinite;opacity:0}}@keyframes cv-dr{i}{{0%,14%{{opacity:0;transform:translate(0,0)}}15%{{opacity:.9}}24%{{transform:translate({dx}px,{dy}px)}}36%,100%{{opacity:0;transform:translate({dx*1.6:.0f}px,6px)}}}}')
    return ''.join(out)


def volley_defs():
    return ('<defs>'
            '<radialGradient id="cvsm"><stop offset="0" stop-color="#f4f2ec" stop-opacity=".95"></stop><stop offset=".55" stop-color="#e2ded4" stop-opacity=".75"></stop><stop offset="1" stop-color="#d4cfc4" stop-opacity="0"></stop></radialGradient>'
            '<radialGradient id="cvsm2"><stop offset="0" stop-color="#d8d4ca" stop-opacity=".9"></stop><stop offset=".6" stop-color="#bdb8ad" stop-opacity=".6"></stop><stop offset="1" stop-color="#a8a398" stop-opacity="0"></stop></radialGradient>'
            '<linearGradient id="cvfl" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#ffffff"></stop><stop offset=".25" stop-color="#fff2a0"></stop><stop offset=".6" stop-color="#ff9a2a"></stop><stop offset="1" stop-color="#d8401a" stop-opacity="0"></stop></linearGradient>'
            '<linearGradient id="cvflL" x1="1" y1="0" x2="0" y2="0"><stop offset="0" stop-color="#ffffff"></stop><stop offset=".25" stop-color="#fff2a0"></stop><stop offset=".6" stop-color="#ff9a2a"></stop><stop offset="1" stop-color="#d8401a" stop-opacity="0"></stop></linearGradient>'
            '<radialGradient id="cvgl"><stop offset="0" stop-color="#ffe9a0" stop-opacity=".9"></stop><stop offset="1" stop-color="#ffb050" stop-opacity="0"></stop></radialGradient>'
            '<radialGradient id="cvdu"><stop offset="0" stop-color="#b89a70" stop-opacity=".85"></stop><stop offset="1" stop-color="#b89a70" stop-opacity="0"></stop></radialGradient>'
            '<linearGradient id="cvbl" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#3a3a3a" stop-opacity="0"></stop><stop offset="1" stop-color="#2a2a2a"></stop></linearGradient>'
            '<linearGradient id="cvblL" x1="1" y1="0" x2="0" y2="0"><stop offset="0" stop-color="#3a3a3a" stop-opacity="0"></stop><stop offset="1" stop-color="#2a2a2a"></stop></linearGradient>'
            '<linearGradient id="cvsp" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffffff"></stop><stop offset="1" stop-color="#bfe6ef"></stop></linearGradient>'
            '</defs>')


def muzzle(x, y, right, delay):
    d = f'animation-delay:-{delay}s'
    if right:
        fl = (f'<path class="cv-muz" style="{d}" d="M{x} {y} L{x+9} {y-5} L{x+13} {y-1.8} L{x+30} {y-3.4} L{x+17} {y} L{x+33} {y+3.6} L{x+13} {y+2.6} L{x+9} {y+5.6} Z" fill="url(#cvfl)"></path>')
    else:
        fl = (f'<path class="cv-muzL" style="{d}" d="M{x} {y} L{x-9} {y-5} L{x-13} {y-1.8} L{x-30} {y-3.4} L{x-17} {y} L{x-33} {y+3.6} L{x-13} {y+2.6} L{x-9} {y+5.6} Z" fill="url(#cvflL)"></path>')
    glow = f'<circle class="cv-glow" style="{d}" cx="{x}" cy="{y}" r="34" fill="url(#cvgl)"></circle>'
    s = 1 if right else -1
    smoke = ''.join(f'<circle class="cv-s{c}" style="{d}" cx="{x + s*ox}" cy="{y + oy}" r="{r}" fill="url(#{g})"></circle>'
                    for c, ox, oy, r, g in [('A', 6, -2, 11, 'cvsm'), ('B', 14, 1, 9, 'cvsm'), ('C', 3, -6, 10, 'cvsm2'), ('D', 20, -1, 8, 'cvsm'), ('A', 10, 3, 8, 'cvsm2')])
    return glow + smoke + fl


def s_clear():
    pal = ['#3aa6c4', '#156a8a', '#f4fcfd', '#0d4560', '#ffffff']
    h = []
    rays = ''.join(f'<path d="M0 0 L{math.cos(a-0.07)*120:.0f} {math.sin(a-0.07)*120:.0f} L{math.cos(a+0.07)*120:.0f} {math.sin(a+0.07)*120:.0f} Z" fill="#fff6cc" opacity=".22"></path>' for a in [i * math.tau / 16 for i in range(16)])
    h.append(svg(560 - 120, 54 - 120, 240, 240, f'<g transform="translate(120 120)"><g class="sc-rays">{rays}</g></g>', z=0))
    h.append(sun_disc(560, 54, 30, halo=2.4, halo_op=.6))
    h.append(cloud_strip([(860, 18, .35, '#ffffff', '#d6eaf2', '#7fa6bc')], 0, 60, 120))
    # haze of old powder smoke lingering between the ships
    h.append(svg(0, 0, 920, 210, volley_defs().replace('<defs>', '<defs>').replace('</defs>', '</defs>') + ''.join(
        f'<ellipse cx="{x}" cy="{y}" rx="{rx}" ry="{rx*.35:.0f}" fill="url(#cvsm2)" opacity=".35"></ellipse>' for x, y, rx in [(540, 112, 90), (480, 92, 60), (610, 100, 70)]), z=0))
    h.append(sea('back', pal))
    h.append(ship('pearl', 278, 128, cls='w-calm', flip=True, alt='«Чёрная жемчужина» бьёт из погонной пушки'))
    h.append(ship('endeavour', 610, 128, cls='w-calm', style='animation-delay: -2s', alt='«Индевор» отвечает'))
    fx = []
    # «Жемчужина» fires (t = 0): the ball hits «Индевор» on the bow, splinters and dust
    fx.append(muzzle(449, 140, True, 0))
    fx.append('<path class="cv-ballR" d="M435 140 h14" stroke="url(#cvbl)" stroke-width="3" stroke-linecap="round"></path>')
    fx.append('<circle class="cv-hit" cx="632" cy="150" r="7" fill="#fff6d0"></circle><circle class="cv-dust" cx="632" cy="150" r="12" fill="url(#cvdu)"></circle>')
    fx.append(''.join(f'<path class="cv-sh{i}" d="M632 150 l{3 + i%3} {-1 - i%2} l1 2 Z" fill="{["#6a4424", "#a8743e", "#3a2a1a"][i%3]}" stroke="#2a1a0a" stroke-width=".4"></path>' for i in range(7)))
    # «Индевор» fires (t = 2 s): the ball falls short and throws up a column of water before the «Жемчужина»
    fx.append(muzzle(636, 140, False, 2))
    fx.append('<path class="cv-ballL" style="animation-delay:-2s" d="M636 140 h14" stroke="url(#cvblL)" stroke-width="3" stroke-linecap="round"></path>')
    fx.append('<path class="cv-spl" style="animation-delay:-2s" d="M462 166 C460 150 458 136 462 122 C463 116 466 112 468 118 C469 108 472 104 474 112 C476 118 478 128 478 140 C478 150 477 158 476 166 Z" fill="url(#cvsp)" stroke="#9fd0dc" stroke-width=".8" opacity=".95"></path>')
    fx.append('<ellipse class="cv-sfoam" style="animation-delay:-2s" cx="470" cy="166" rx="16" ry="4" fill="#ffffff"></ellipse>')
    fx.append(''.join(f'<circle class="cv-dr{i}" style="animation-delay:-2s" cx="470" cy="116" r="{1.4 + (i%2)*.6}" fill="#ffffff"></circle>' for i in range(5)))
    h.append(svg(0, 0, 920, 210, ''.join(fx), z=3))
    h.append(svg(0, 0, 920, 210, flapping_gull(760, 34, .7) + flapping_gull(790, 46, .55), z=3, cls='w-gulls', style='animation-duration: 34s'))
    h.append(sea('front', pal))
    h.append(spk([(x, 176 + (i * 7) % 28, (i * .37) % 2.2) for i, x in enumerate(range(240, 900, 44))]))
    return ('linear-gradient(#2f8fd0 0%, #6ab8e6 55%, #c4e6f4 100%)', ''.join(h), 'Ясное небо: корабли бьют друг по другу из погонных пушек', '')


# ------------------------------------------------------------------ Гроза: a real strike that sets the sails on fire

TH_CSS = r'''
.th-imp{transform-box:fill-box;transform-origin:50% 50%;animation:th-imp 6s linear infinite;opacity:0}@keyframes th-imp{0%,84.5%{opacity:0;transform:scale(.4)}85.2%{opacity:1;transform:scale(1.1)}87%{opacity:.35}88%{opacity:.95;transform:scale(1)}91%,100%{opacity:0;transform:scale(1.4)}}
.th-fl1,.th-fl2,.th-fl3{transform-box:fill-box;transform-origin:50% 100%;animation:th-fl1 .5s ease-in-out infinite alternate}
.th-fl2{animation-name:th-fl2;animation-duration:.37s}.th-fl3{animation-name:th-fl3;animation-duration:.43s}
@keyframes th-fl1{0%{transform:scale(1,1) skewX(-4deg);opacity:.9}100%{transform:scale(.85,1.22) skewX(5deg);opacity:1}}
@keyframes th-fl2{0%{transform:scale(.9,1.15) skewX(5deg)}100%{transform:scale(1.08,.86) skewX(-6deg)}}
@keyframes th-fl3{0%{transform:scale(1.05,.9) skewX(-2deg)}100%{transform:scale(.88,1.25) skewX(7deg)}}
.th-rim{animation:th-rim 1.1s steps(4) infinite alternate}@keyframes th-rim{from{opacity:.55}to{opacity:1}}
.th-emb{animation:th-emb 2.2s ease-out infinite;opacity:0}@keyframes th-emb{0%{opacity:0;transform:translate(0,0)}10%{opacity:1}100%{opacity:0;transform:translate(-26px,-46px)}}
.th-smk{transform-box:fill-box;transform-origin:50% 50%;animation:th-smk 4.4s ease-out infinite;opacity:0}@keyframes th-smk{0%{opacity:0;transform:translate(0,0) scale(.4)}12%{opacity:.75}100%{opacity:0;transform:translate(-60px,-40px) scale(3)}}
.th-fire-glow{animation:th-fire-glow 1.3s ease-in-out infinite alternate}@keyframes th-fire-glow{from{opacity:.45}to{opacity:.85}}
.th-sglow{transform-box:fill-box;transform-origin:50% 50%;animation:th-sglow 1.8s ease-in-out infinite alternate}@keyframes th-sglow{from{opacity:.35;transform:scale(.85)}to{opacity:.8;transform:scale(1.1)}}
'''


def bolt_path(x0, y0, x1, y1, seed, steps=11, jag=9):
    R = random.Random(seed)
    pts = [(x0, y0)]
    for i in range(1, steps):
        t = i / steps
        pts.append((x0 + (x1 - x0) * t + R.uniform(-jag, jag), y0 + (y1 - y0) * t + R.uniform(-2, 2)))
    pts.append((x1, y1))
    return pts


def poly(pts):
    return 'M' + ' L'.join(f'{x:.1f} {y:.1f}' for x, y in pts)


def bolt_svg(x0, y0, x1, y1, seed=4, cls='w-bolt', style=''):
    main = bolt_path(x0, y0, x1, y1, seed)
    R = random.Random(seed + 1)
    branches = []
    for bi in (3, 5, 8):
        bx, by = main[bi]
        L = R.uniform(18, 34)
        ang = R.choice([-1, 1]) * R.uniform(.5, 1.1)
        ex, ey = bx + math.sin(ang) * L, by + math.cos(ang) * L
        branches.append(poly(bolt_path(bx, by, ex, ey, seed + bi, steps=4, jag=4)))
    m = poly(main)
    b = ''.join(f'<path d="{p}"></path>' for p in branches)
    return (f'<svg class="{cls}" aria-hidden="true" width="920" height="210" viewBox="0 0 920 210" style="position: absolute; left: 0; top: 0; z-index: 3; overflow: visible; {style}">'
            f'<g fill="none" stroke-linecap="round" stroke-linejoin="round">'
            f'<path d="{m}" stroke="#a89cff" stroke-width="12" opacity=".18"></path><path d="{m}" stroke="#cfc6ff" stroke-width="6" opacity=".45"></path>'
            f'<g stroke="#cfc6ff" stroke-width="3" opacity=".5">{b}</g><g stroke="#ffffff" stroke-width="1">{b}</g>'
            f'<path d="{m}" stroke="#ffffff" stroke-width="2.2"></path></g></svg>')


def s_thunder():
    pal = ['#2d2a46', '#0c0b18', '#bcb6d8', '#05040c', '#e8e4ff']
    h = []
    h.append(cloud_strip([(-40, -24, 1.6, '#3a3456', '#26213e', '#0e0b1a'), (240, -10, 1.3, '#433c62', '#2c2646', '#0e0b1a'), (520, -30, 1.8, '#3a3456', '#26213e', '#0e0b1a'), (800, -14, 1.4, '#433c62', '#2c2646', '#0e0b1a')], 0, 90, 60))
    h.append('<div class="sc-cflash" aria-hidden="true" style="position: absolute; inset: 0; z-index: 0; background: radial-gradient(25% 50% at 15% 10%, rgba(210,200,255,.7), rgba(210,200,255,0))"></div>')
    h.append(bolt_svg(150, 10, 132, 70, seed=12, cls='sc-cflash', style='z-index: 0; opacity: 0'))
    h.append('<div class="w-flash" aria-hidden="true" style="position: absolute; inset: 0; z-index: 1; background: radial-gradient(60% 90% at 56% 0%, rgba(230,226,255,.9), rgba(230,226,255,0))"></div>')
    h.append(sea('back', pal))
    # the bolt to the main masthead of the «Жемчужина» (masthead at 515, 39)
    h.append(bolt_svg(590, -14, 515, 39, seed=7))
    # overlays that move with the ship: the burning, scorched main topgallant and topsail
    ov = ('<svg width="231" height="150" viewBox="0 0 231 150" style="position: absolute; left: 0; top: 0; overflow: visible">'
          '<defs><radialGradient id="thf"><stop offset="0" stop-color="#fff6c0"></stop><stop offset=".35" stop-color="#ffc040"></stop><stop offset=".75" stop-color="#ff6a1a"></stop><stop offset="1" stop-color="#c8300a" stop-opacity="0"></stop></radialGradient>'
          '<linearGradient id="thfl" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#ffe680"></stop><stop offset=".45" stop-color="#ff9a2a"></stop><stop offset="1" stop-color="#e0401a" stop-opacity="0"></stop></linearGradient>'
          '<radialGradient id="thsm"><stop offset="0" stop-color="#4a4458" stop-opacity=".9"></stop><stop offset="1" stop-color="#3a3448" stop-opacity="0"></stop></radialGradient>'
          '<radialGradient id="thim"><stop offset="0" stop-color="#ffffff"></stop><stop offset=".3" stop-color="#e6e0ff" stop-opacity=".9"></stop><stop offset="1" stop-color="#b8a8ff" stop-opacity="0"></stop></radialGradient></defs>'
          # glow of the fire on the canvas around
          '<ellipse class="th-fire-glow" cx="116" cy="40" rx="40" ry="34" fill="url(#thf)" opacity=".5"></ellipse>'
          # scorched, torn hole in the topgallant and the head of the topsail, with a smouldering rim
          '<path d="M104 24 C108 18 118 18 124 22 C128 26 126 32 130 36 C128 44 120 46 114 50 C108 46 100 46 100 38 C96 34 100 28 104 24 Z" fill="#1a120c" opacity=".85"></path>'
          '<path class="th-rim" d="M104 24 C108 18 118 18 124 22 C128 26 126 32 130 36 C128 44 120 46 114 50 C108 46 100 46 100 38 C96 34 100 28 104 24 Z" fill="none" stroke="#ff8a2a" stroke-width="1.6" stroke-dasharray="5 3 2 4"></path>'
          '<path d="M112 50 C110 56 112 60 108 66 M122 46 C126 52 124 58 128 62" stroke="#2a1a10" stroke-width="1.4" fill="none" opacity=".8"></path>'
          # flames licking up the sail
          + ''.join(f'<path class="th-fl{1 + i % 3}" style="animation-delay:-{i*.13:.2f}s" d="M{x} {y} C{x-w} {y-hh*.4:.1f} {x-w*.4:.1f} {y-hh*.8:.1f} {x} {y-hh} C{x+w*.5:.1f} {y-hh*.7:.1f} {x+w} {y-hh*.35:.1f} {x} {y} Z" fill="url(#thfl)"></path>'
                    for i, (x, y, w, hh) in enumerate([(104, 30, 6, 18), (113, 24, 7, 24), (122, 28, 6, 20), (128, 40, 5, 14), (100, 42, 5, 12)]))
          + ''.join(f'<path class="th-fl{1 + i % 3}" style="animation-delay:-{i*.2:.2f}s" d="M{x} {y} C{x-3} {y-6} {x-1} {y-10} {x} {y-12} C{x+2} {y-9} {x+3} {y-5} {x} {y} Z" fill="#fff2b0"></path>'
                    for i, (x, y) in enumerate([(108, 28), (116, 22), (124, 30)]))
          # embers and smoke carried off by the wind
          + ''.join(f'<circle class="th-emb" style="animation-delay:-{i*.3:.1f}s;animation-duration:{1.8 + (i%3)*.4:.1f}s" cx="{106 + (i*5)%22}" cy="{20 + (i*7)%14}" r="{1 + (i%2)*.6}" fill="#ffb040"></circle>' for i in range(9))
          + ''.join(f'<circle class="th-smk" style="animation-delay:-{i*.7:.1f}s" cx="{114 + (i%3)*4}" cy="{12 - (i%2)*4}" r="{8 + (i%3)*3}" fill="url(#thsm)"></circle>' for i in range(6))
          # the strike itself: a white burst at the masthead in step with the bolt
          + '<circle class="th-imp" cx="115.5" cy="9.6" r="30" fill="url(#thim)"></circle>'
          '</svg>')
    h.append(ship('pearl', 400, 150, cls='w-bob', extra=ov, alt='Молния ударила в грот-мачту «Жемчужины», паруса горят'))
    # St Elmo's fire on the far «Голландец», soft
    h.append(svg(0, 0, 920, 210, '<defs><radialGradient id="thel"><stop offset="0" stop-color="#e0f4ff"></stop><stop offset=".4" stop-color="#9fd8ff" stop-opacity=".6"></stop><stop offset="1" stop-color="#6fb8ff" stop-opacity="0"></stop></radialGradient></defs>'
                 + ''.join(f'<circle class="th-sglow" style="animation-delay:-{i*.5:.1f}s" cx="{x}" cy="{y}" r="7" fill="url(#thel)"></circle>' for i, (x, y) in enumerate([(751, 92), (727, 99), (776, 100)])), z=3))
    h.append(ship('dutch', 690, 80, cls='w-bob', wl=160, z=1, style='animation-delay: -1.4s', alt='«Летучий голландец» вдали'))
    # the fire lights the water beneath
    h.append(svg(0, 0, 920, 210, '<ellipse class="th-fire-glow" cx="515" cy="170" rx="60" ry="8" fill="#ff8a3a" opacity=".25"></ellipse>', z=3))
    h.append(sea('front', pal))
    return ('linear-gradient(#100d22 0%, #2a2346 55%, #46395e 100%)', ''.join(h), 'Гроза: молния ударила в грот-мачту, паруса горят', '')


CSS = CSS2 + CV_CSS + shard_css() + drop_css() + TH_CSS

RAIN = {  # key: (slant, density, colour, splashes, curtain)
    'storm': (.34, 1.1, '#c8dae6', 18, '#4a5866'),
    'wave': (.3, .9, '#c8dcd6', 14, '#4a5a56'),
    'wet': (.16, 1.4, '#dce8ee', 22, '#6a7880'),
    'thunder': (.26, 1.0, '#c8c2ea', 16, '#3a3456'),
}

SCENES = dict(scenes2.SCENES)
SCENES['clear'] = s_clear
SCENES['thunder'] = s_thunder
