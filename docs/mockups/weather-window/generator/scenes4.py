import math, random
from helpers import INK, cloud_strip, svg, sun_disc
from scenes2 import flapping_gull
import scenes3
from scenes3 import volley_defs
from common import ship, sea, spk

T = 5  # one exchange of fire, seconds; «Жемчужина» fires at 0 s, «Индевор» at 2.5 s

CV2_CSS = r'''
.c2-muz,.c2-muzL{transform-box:fill-box;transform-origin:0 50%;animation:c2-muz 5s linear infinite;opacity:0}.c2-muzL{transform-origin:100% 50%}
@keyframes c2-muz{0%{opacity:0;transform:scale(.2,.5)}.6%{opacity:1;transform:scale(1.15,1.05)}2.4%{opacity:.5;transform:scale(1.4,.75)}4.5%,100%{opacity:0;transform:scale(1.5,.4)}}
.c2-glow{animation:c2-glow 5s linear infinite;opacity:0}@keyframes c2-glow{0%{opacity:0}.8%{opacity:.85}7%,100%{opacity:0}}
.c2-bR{animation:c2-bR 5s linear infinite;opacity:0}@keyframes c2-bR{0%,.8%{opacity:0;transform:translate(0,0)}1.2%{opacity:.85}9.6%{opacity:.85;transform:translate(var(--d),var(--y))}10%,100%{opacity:0;transform:translate(var(--d),var(--y))}}
.c2-hit{transform-box:fill-box;transform-origin:50% 50%;animation:c2-hit 5s ease-out infinite;opacity:0}@keyframes c2-hit{0%,9.8%{opacity:0;transform:scale(.3)}10.3%{opacity:1;transform:scale(1.15)}15%,100%{opacity:0;transform:scale(1.9)}}
.c2-dust{transform-box:fill-box;transform-origin:50% 50%;animation:c2-dust 5s ease-out infinite;opacity:0}@keyframes c2-dust{0%,10%{opacity:0;transform:translate(0,0) scale(.3)}12%{opacity:.85}55%,100%{opacity:0;transform:translate(-8px,-22px) scale(2.8)}}
.c2-shake{animation:c2-shake 5s ease-out infinite}@keyframes c2-shake{0%,9.8%{transform:translate(0,0) rotate(0)}10.6%{transform:translate(6px,1px) rotate(1.8deg)}12.4%{transform:translate(-2px,0) rotate(-.7deg)}14.5%{transform:translate(1px,0) rotate(.3deg)}16%,100%{transform:translate(0,0) rotate(0)}}
.c2-shakeL{animation:c2-shakeL 5s ease-out infinite}@keyframes c2-shakeL{0%,9.8%{transform:translate(0,0) rotate(0)}10.6%{transform:translate(-6px,1px) rotate(-1.8deg)}12.4%{transform:translate(2px,0) rotate(.7deg)}14.5%{transform:translate(-1px,0) rotate(-.3deg)}16%,100%{transform:translate(0,0) rotate(0)}}
.c2-dmg{animation:c2-dmg 5s ease-out infinite;opacity:0}@keyframes c2-dmg{0%,10%{opacity:0;transform:translateY(10px) scale(.5)}12.5%{opacity:1;transform:translateY(0) scale(1.18)}15%{transform:translateY(0) scale(1)}36%{opacity:1;transform:translateY(-12px) scale(1)}46%,100%{opacity:0;transform:translateY(-20px) scale(.95)}}
.c2-new{transform-box:fill-box;transform-origin:50% 50%;animation:c2-new 5s ease-out infinite}@keyframes c2-new{0%,9.8%{opacity:.55;transform:scale(.85)}10.6%{opacity:1;transform:scale(1.25)}20%,100%{opacity:1;transform:scale(1)}}
.c2-rig{transform-box:fill-box;transform-origin:50% 0;animation:c2-rig 5s ease-in-out infinite}@keyframes c2-rig{0%,10%{transform:rotate(0)}14%{transform:rotate(14deg)}22%{transform:rotate(-8deg)}32%{transform:rotate(5deg)}45%,100%{transform:rotate(0)}}
'''


def shard_css2():
    R = random.Random(33)
    out = []
    for i in range(8):
        dx, dy = R.uniform(-18, 30), R.uniform(-34, -10)
        r = R.uniform(240, 700) * (1 if i % 2 else -1)
        out.append(f'.c2-s{i}{{transform-box:fill-box;transform-origin:50% 50%;animation:c2-s{i} 5s ease-out infinite;opacity:0}}'
                   f'@keyframes c2-s{i}{{0%,10%{{opacity:0;transform:translate(0,0) rotate(0)}}10.5%{{opacity:1}}22%{{transform:translate({dx:.0f}px,{dy:.0f}px) rotate({r*.5:.0f}deg)}}40%,100%{{opacity:0;transform:translate({dx*1.5:.0f}px,{dy+56:.0f}px) rotate({r:.0f}deg)}}}}')
    return ''.join(out)


def impact(x, y, dirn, delay, k):
    """one ball strikes the hull at (x, y): flash, splinters thrown back toward the shooter, a puff of dust"""
    d = f'animation-delay:{delay:.2f}s'
    sh = ''.join(f'<path class="c2-s{(i + k) % 8}" style="{d};transform:scaleX({dirn})" d="M{x} {y} l{3 + i % 3} {-1 - i % 2} l1.4 2.2 Z" fill="{["#6a4424", "#b0824a", "#3a2a1a", "#8a5a2e"][i % 4]}" stroke="#2a1a0a" stroke-width=".4"></path>' for i in range(6))
    return (f'<circle class="c2-hit" style="{d}" cx="{x}" cy="{y}" r="9" fill="#fff6d0"></circle>'
            f'<circle class="c2-hit" style="{d}" cx="{x}" cy="{y}" r="4" fill="#ffffff"></circle>'
            f'<circle class="c2-dust" style="{d}" cx="{x}" cy="{y}" r="13" fill="url(#cvdu)"></circle>' + sh)


def hole(x, y, s=1, cls='', delay=0):
    c = f' class="{cls}" style="animation-delay:{delay:.2f}s"' if cls else ''
    return (f'<g{c}><g transform="translate({x} {y}) scale({s})">'
            '<path d="M-6 -1 L-3 -5 L0 -3 L3 -6 L6 -2 L5 2 L7 5 L2 4 L-1 6 L-4 3 L-7 3 Z" fill="#c9a06a" opacity=".9"></path>'
            '<path d="M-4.4 -.6 L-2 -3.6 L0 -2 L2.4 -4.2 L4.4 -1.4 L3.6 1.6 L4.6 3.6 L1.4 2.8 L-.8 4.2 L-3 2 L-5 2.2 Z" fill="#120c06"></path></g></g>')


def sail_hole(x, y, s=1):
    return (f'<g transform="translate({x} {y}) scale({s})"><path d="M-5 -3 L-1 -6 L3 -4 L6 0 L3 4 L-2 5 L-6 2 Z" fill="#b89a70" opacity=".55"></path>'
            '<path d="M-3.6 -2 L-.8 -4.4 L2 -3 L4.2 0 L2 2.8 L-1.6 3.6 L-4.4 1.4 Z" fill="#8fcbea" stroke="#3a2a1a" stroke-width=".7"></path></g>')


def flames(pts):
    return ''.join(f'<path class="th-fl{1 + i % 3}" style="animation-delay:-{i*.13:.2f}s" d="M{x} {y} C{x-w} {y-hh*.4:.1f} {x-w*.4:.1f} {y-hh*.8:.1f} {x} {y-hh} C{x+w*.5:.1f} {y-hh*.7:.1f} {x+w} {y-hh*.35:.1f} {x} {y} Z" fill="url(#c2fl)"></path>' for i, (x, y, w, hh) in enumerate(pts))


def smoke_col(x, y, n=6, dark=True):
    g = 'c2sm' if dark else 'cvsm2'
    return ''.join(f'<circle class="th-smk" style="animation-delay:-{i*.75:.2f}s;animation-duration:5s" cx="{x + (i % 3) * 3}" cy="{y - (i % 2) * 3}" r="{7 + (i % 3) * 3}" fill="url(#{g})"></circle>' for i in range(n))


def dmg_badge(x, y, n, delay):
    return (f'<div class="c2-dmg" aria-hidden="true" style="position: absolute; left: {x}px; top: {y}px; z-index: 5; animation-delay: {delay}s; display: flex; align-items: center; gap: 4px; padding: 2px 9px 2px 7px; border-radius: 10px; '
            'background: linear-gradient(#a8352a, #7a2018); border: 2px solid #e0bd62; box-shadow: 0 3px 8px rgba(0,0,0,.4), inset 0 1px 0 rgba(255,255,255,.25); '
            'font-family: \'Alegreya SC\', Georgia, serif; font-weight: 700; font-size: 22px; line-height: 1; color: #fff3e0; text-shadow: 0 1px 0 rgba(0,0,0,.5)">'
            f'<span>−{n}</span><span style="font-size: 11px; letter-spacing: .5px; color: #ffd9c8">Корпус</span>'
            '<svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true" style="margin-left: 2px"><circle cx="8" cy="8" r="3.6" fill="#f2c94c" stroke="#8a6420" stroke-width=".8"></circle>'
            + ''.join(f'<path d="M{8 + math.cos(a)*5:.1f} {8 + math.sin(a)*5:.1f} L{8 + math.cos(a)*7:.1f} {8 + math.sin(a)*7:.1f}" stroke="#f2c94c" stroke-width="1.2" stroke-linecap="round"></path>' for a in [i * math.pi / 4 for i in range(8)])
            + '</svg></div>')


def s_clear():
    pal = ['#3aa6c4', '#156a8a', '#f4fcfd', '#0d4560', '#ffffff']
    h = []
    rays = ''.join(f'<path d="M0 0 L{math.cos(a-0.07)*120:.0f} {math.sin(a-0.07)*120:.0f} L{math.cos(a+0.07)*120:.0f} {math.sin(a+0.07)*120:.0f} Z" fill="#fff6cc" opacity=".22"></path>' for a in [i * math.tau / 16 for i in range(16)])
    h.append(sun_disc(560, 54, 28, halo_op=.6))
    defs = (volley_defs()[:-7] +
            '<radialGradient id="c2sm"><stop offset="0" stop-color="#4a4440" stop-opacity=".75"></stop><stop offset="1" stop-color="#5a544e" stop-opacity="0"></stop></radialGradient>'
            '<linearGradient id="c2fl" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#ffe680"></stop><stop offset=".45" stop-color="#ff9a2a"></stop><stop offset="1" stop-color="#e0401a" stop-opacity="0"></stop></linearGradient>'
            '<radialGradient id="c2fg"><stop offset="0" stop-color="#ffb050" stop-opacity=".7"></stop><stop offset="1" stop-color="#ff8030" stop-opacity="0"></stop></radialGradient>'
            '</defs>')
    # a pall of powder smoke between the ships, thickening the longer they fight
    h.append(svg(0, 0, 920, 210, defs + ''.join(
        f'<ellipse cx="{x}" cy="{y}" rx="{rx}" ry="{rx*.38:.0f}" fill="url(#cvsm2)" opacity="{o}"></ellipse>' for x, y, rx, o in [(540, 110, 100, .45), (480, 88, 70, .4), (610, 96, 80, .4), (545, 72, 60, .3)]), z=0))
    h.append(sea('back', pal))

    # ---- the ships, each with its accumulated damage riding along, each shaken when hit
    pearl_dmg = ('<svg width="197" height="128" viewBox="0 0 197 128" style="position: absolute; left: 0; top: 0; overflow: visible">'
                 + hole(117, 100.5, 1.1) + hole(152, 104, .9) + hole(138, 98, 1, 'c2-new', 2.5) + hole(96, 104, 1.1, 'c2-new', 2.74)
                 + sail_hole(95, 66, 1.2) + sail_hole(138, 46, 1) + sail_hole(70, 52, .9)
                 + '<g class="c2-rig" style="animation-delay:2.5s"><path d="M100 26 L86 52" stroke="#2a1a0a" stroke-width="1"></path><path d="M86 52 l-3 5" stroke="#2a1a0a" stroke-width="1.6"></path></g>'
                 + '</svg>')
    endv_dmg = ('<svg width="197" height="128" viewBox="0 0 197 128" style="position: absolute; left: 0; top: 0; overflow: visible">'
                + hole(40, 102.5, 1.1) + hole(90, 98.5, 1) + hole(62, 104, 1, 'c2-new', 0) + hole(114, 102, 1.1, 'c2-new', .24)
                + sail_hole(100, 70, 1.2) + sail_hole(60, 46, 1) + sail_hole(124, 40, .9)
                + '<ellipse class="th-fire-glow" cx="150" cy="80" rx="22" ry="14" fill="url(#c2fg)"></ellipse>'
                + flames([(144, 84, 5, 14), (151, 82, 6, 19), (158, 85, 5, 13)])
                + '<g class="c2-rig"><path d="M98 22 L116 50" stroke="#2a1a0a" stroke-width="1"></path><path d="M116 50 l3 5" stroke="#2a1a0a" stroke-width="1.6"></path></g>'
                + '</svg>')
    h.append(f'<div class="c2-shakeL" style="position: absolute; inset: 0; z-index: 2; transform-origin: 376px 140px; animation-delay: 2.5s">'
             + ship('pearl', 278, 128, cls='w-calm', flip=True, extra=pearl_dmg, alt='«Чёрная жемчужина» в пробоинах') + '</div>')
    h.append(f'<div class="c2-shake" style="position: absolute; inset: 0; z-index: 2; transform-origin: 708px 140px">'
             + ship('endeavour', 610, 128, cls='w-calm', style='animation-delay: -2s', extra=endv_dmg, alt='«Индевор» горит после попадания') + '</div>')

    fx = []
    # smoke columns rising from both damaged ships
    fx.append(smoke_col(318, 126) + smoke_col(760, 124) + smoke_col(700, 140, 4, dark=False))

    def broadside(ports, right, delay):
        o = []
        for j, (x, y) in enumerate(ports):
            dd = delay + j * .1
            d = f'animation-delay:{dd:.2f}s;animation-duration:{T}s'
            o.append(f'<circle class="c2-glow" style="animation-delay:{dd:.2f}s" cx="{x}" cy="{y}" r="36" fill="url(#cvgl)"></circle>')
            s = 1 if right else -1
            o.append(''.join(f'<circle class="cv-s{c}" style="{d}" cx="{x + s*ox}" cy="{y + oy}" r="{r}" fill="url(#{g})"></circle>'
                             for c, ox, oy, r, g in [('A', 6, -2, 12, 'cvsm'), ('B', 15, 1, 10, 'cvsm'), ('C', 3, -6, 11, 'cvsm2'), ('D', 22, -1, 9, 'cvsm'), ('A', 10, 3, 9, 'cvsm2')]))
            if right:
                o.append(f'<path class="c2-muz" style="animation-delay:{dd:.2f}s" d="M{x} {y} L{x+10} {y-6} L{x+14} {y-2} L{x+34} {y-4} L{x+19} {y} L{x+37} {y+4} L{x+14} {y+3} L{x+10} {y+6.4} Z" fill="url(#cvfl)"></path>')
            else:
                o.append(f'<path class="c2-muzL" style="animation-delay:{dd:.2f}s" d="M{x} {y} L{x-10} {y-6} L{x-14} {y-2} L{x-34} {y-4} L{x-19} {y} L{x-37} {y+4} L{x-14} {y+3} L{x-10} {y+6.4} Z" fill="url(#cvflL)"></path>')
        return ''.join(o)

    # «Жемчужина»: Пушки 2 + 1 (ясное небо) = 3 — three balls into «Индевор»
    fx.append(broadside([(449, 140), (443, 147), (452, 133)], True, 0))
    for j, (tx, ty) in enumerate([(640, 150), (662, 145), (684, 153)]):
        sx, sy = [(449, 140), (443, 147), (452, 133)][j]
        fx.append(f'<path class="c2-bR" style="animation-delay:{j*.1:.2f}s;--d:{tx-sx}px;--y:{ty-sy}px" d="M{sx-14} {sy} h14" stroke="url(#cvbl)" stroke-width="3" stroke-linecap="round"></path>')
        fx.append(impact(tx, ty, -1, j * .12, j))
    # «Индевор»: Пушки 3 + 1 = 4 — four balls into «Жемчужина»
    ports = [(636, 140), (642, 147), (632, 133), (646, 152)]
    for j, (tx, ty) in enumerate([(440, 150), (418, 145), (398, 153), (380, 147)]):
        sx, sy = ports[j]
        fx.append(f'<path class="c2-bR" style="animation-delay:{2.5 + j*.1:.2f}s;--d:{tx-sx}px;--y:{ty-sy}px" d="M{sx} {sy} h14" stroke="url(#cvblL)" stroke-width="3" stroke-linecap="round"></path>')
        fx.append(impact(tx, ty, 1, 2.5 + j * .12, j + 3))
    fx.append(broadside(ports, False, 2.5))
    h.append(svg(0, 0, 920, 210, ''.join(fx), z=3))
    # game-style damage plates: 2 + 1 and 3 + 1
    h.append(dmg_badge(642, 76, 3, 0))
    h.append(dmg_badge(352, 76, 4, 2.5))
    h.append(svg(0, 0, 920, 210, flapping_gull(800, 30, .7) + flapping_gull(830, 42, .55), z=3, cls='w-gulls', style='animation-duration: 34s'))
    h.append(sea('front', pal))
    # the burning «Индевор» throws a glow on the water
    h.append(svg(0, 0, 920, 210, '<ellipse class="th-fire-glow" cx="760" cy="170" rx="34" ry="5" fill="#ff9a4a" opacity=".3"></ellipse>', z=3))
    h.append(spk([(x, 176 + (i * 7) % 28, (i * .37) % 2.2) for i, x in enumerate(range(240, 900, 44))]))
    return ('linear-gradient(#2f8fd0 0%, #6ab8e6 55%, #c4e6f4 100%)', ''.join(h), 'Ясное небо: корабли бьют друг по другу в упор, оба в пробоинах, «Индевор» горит', '')


CSS = scenes3.CSS + CV2_CSS + shard_css2()
RAIN = scenes3.RAIN
rain = scenes3.rain
strip_old_rain = scenes3.strip_old_rain
SCENES = dict(scenes3.SCENES)
SCENES['clear'] = s_clear
