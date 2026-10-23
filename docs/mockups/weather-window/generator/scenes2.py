import math, random
from helpers import (CSS as CSS1, INK, cloud, cloud_strip, svg, gulls, stars, barrel, ripple, sun_disc, rocks, palm)
from common import ship, sea, spk

CSS2 = r'''
.sc-fast .ws-r0{animation-duration:6s}.sc-fast .ws-r1{animation-duration:5s}.sc-fast .ws-r2{animation-duration:4.2s}.sc-fast .ws-r3{animation-duration:3.4s}
.sc-fast .ws-r4{animation-duration:2.8s}.sc-fast .ws-r5{animation-duration:2.3s}.sc-fast .ws-r6{animation-duration:1.9s}.sc-fast .ws-r7{animation-duration:1.6s}.sc-fast .ws-edge{animation-duration:1s}
.sc-cross{animation:sc-cross 8s linear infinite}@keyframes sc-cross{from{transform:translateX(0)}to{transform:translateX(-1300px)}}
.sc-cross-far{animation:sc-crossf 26s linear infinite}@keyframes sc-crossf{from{transform:translateX(0)}to{transform:translateX(-1100px)}}
.sc-par{animation:sc-par 40s linear infinite}@keyframes sc-par{to{transform:translateX(-920px)}}
.sc-hat{animation:sc-hat 8s linear infinite;opacity:0}@keyframes sc-hat{0%,40%{opacity:0;transform:translate(0,0) rotate(0)}42%{opacity:1}55%{transform:translate(-180px,-30px) rotate(-260deg)}70%{transform:translate(-380px,6px) rotate(-520deg)}85%{opacity:1;transform:translate(-560px,-22px) rotate(-800deg)}88%,100%{opacity:0;transform:translate(-620px,0) rotate(-860deg)}}
.sc-fish{animation:sc-fish 7s ease-in-out infinite;opacity:0}@keyframes sc-fish{0%,58%{opacity:0;transform:translate(0,0) rotate(-50deg)}60%{opacity:1}72%{transform:translate(22px,-28px) rotate(0)}84%{opacity:1;transform:translate(44px,0) rotate(55deg)}86%,100%{opacity:0;transform:translate(44px,6px) rotate(60deg)}}
.sc-fplop{transform-box:fill-box;transform-origin:50% 50%;animation:sc-fplop 7s ease-out infinite;opacity:0}@keyframes sc-fplop{0%,58%{opacity:0;transform:scale(.2)}60%{opacity:.9;transform:scale(.5)}72%{opacity:0;transform:scale(1.6)}83%{opacity:0;transform:scale(.2)}85%{opacity:.9;transform:scale(.5)}100%{opacity:0;transform:scale(1.8)}}
.sc-shoot{animation:sc-shoot 9s ease-in infinite;opacity:0}@keyframes sc-shoot{0%,82%{opacity:0;transform:translate(0,0)}84%{opacity:1}94%,100%{opacity:0;transform:translate(-190px,70px)}}
.sc-mflash{transform-box:fill-box;transform-origin:50% 50%;animation:sc-mflash 3.4s linear infinite;opacity:0}@keyframes sc-mflash{0%{opacity:0;transform:scale(.4)}2%{opacity:1;transform:scale(1.3)}8%,100%{opacity:0;transform:scale(1.7)}}
.sc-msmoke{transform-box:fill-box;transform-origin:50% 50%;animation:sc-msmoke 3.4s ease-out infinite;opacity:0}@keyframes sc-msmoke{0%{opacity:0;transform:translate(0,0) scale(.4)}4%{opacity:.9}70%,100%{opacity:0;transform:translate(-6px,-26px) scale(2.6)}}
.sc-ballR{animation:sc-ballR 3.4s linear infinite;opacity:0}@keyframes sc-ballR{0%,3%{opacity:0;transform:translate(0,0)}4%{opacity:1}22%{transform:translate(68px,-26px)}40%{opacity:1;transform:translate(136px,6px)}41%,100%{opacity:0;transform:translate(136px,6px)}}
.sc-ballL{animation:sc-ballL 3.4s linear infinite;opacity:0}@keyframes sc-ballL{0%,3%{opacity:0;transform:translate(0,0)}4%{opacity:1}22%{transform:translate(-68px,-26px)}40%{opacity:1;transform:translate(-136px,6px)}41%,100%{opacity:0;transform:translate(-136px,6px)}}
.sc-mhit{transform-box:fill-box;transform-origin:50% 50%;animation:sc-mhit 3.4s ease-out infinite;opacity:0}@keyframes sc-mhit{0%,40%{opacity:0;transform:scale(.3)}42%{opacity:1;transform:scale(1)}60%,100%{opacity:0;transform:scale(1.9)}}
.sc-chips{animation:sc-chips 3.4s ease-out infinite;opacity:0}@keyframes sc-chips{0%,40%{opacity:0;transform:translate(0,0) rotate(0)}42%{opacity:1}70%,100%{opacity:0;transform:translate(var(--cx,10px),18px) rotate(200deg)}}
.sc-sway{transform-box:fill-box;transform-origin:50% 0;animation:sc-sway 2.6s ease-in-out infinite alternate}@keyframes sc-sway{from{transform:rotate(-5deg)}to{transform:rotate(6deg)}}
.sc-arm{transform-box:fill-box;transform-origin:0% 100%;animation:sc-arm .55s ease-in-out infinite alternate}@keyframes sc-arm{from{transform:rotate(-24deg)}to{transform:rotate(14deg)}}
.sc-bub{animation:sc-bub 2.4s ease-in infinite;opacity:0}@keyframes sc-bub{0%{opacity:0;transform:translateY(0)}20%{opacity:1}100%{opacity:0;transform:translateY(-20px)}}
.sc-puff{transform-box:fill-box;transform-origin:50% 50%;animation:sc-puff 3.6s ease-out infinite;opacity:0}@keyframes sc-puff{0%{opacity:0;transform:translate(0,0) scale(.4)}25%{opacity:.7}100%{opacity:0;transform:translate(10px,-26px) scale(1.8)}}
.sc-row{animation:sc-row 22s linear infinite;opacity:0}@keyframes sc-row{0%{opacity:0;transform:translateX(0)}6%{opacity:1}92%{opacity:1}100%{opacity:0;transform:translateX(200px)}}
.sc-oar{transform-box:fill-box;transform-origin:50% 0;animation:sc-oar .8s ease-in-out infinite alternate}@keyframes sc-oar{from{transform:rotate(-28deg)}to{transform:rotate(22deg)}}
.sc-beam{transform-origin:0 50%;animation:sc-beam 6s ease-in-out infinite alternate}@keyframes sc-beam{from{transform:rotate(-24deg)}to{transform:rotate(30deg)}}
.sc-ghost{animation:sc-ghost 6s ease-in-out infinite;opacity:0}@keyframes sc-ghost{0%,100%{opacity:0}40%,60%{opacity:.75}}
.sc-driftR{animation:sc-driftR 16s linear infinite}@keyframes sc-driftR{from{transform:translateX(-60px)}to{transform:translateX(1000px)}}
.sc-driftL{animation:sc-driftL 12s linear infinite}@keyframes sc-driftL{from{transform:translateX(60px)}to{transform:translateX(-1000px)}}
.sc-fin{animation:sc-fin 14s linear infinite}@keyframes sc-fin{0%{transform:translateX(0) scaleX(1)}48%{transform:translateX(-170px) scaleX(1)}50%{transform:translateX(-170px) scaleX(-1)}98%{transform:translateX(0) scaleX(-1)}100%{transform:translateX(0) scaleX(1)}}
.sc-fishsh{animation:sc-fishsh 10s ease-in-out infinite alternate}@keyframes sc-fishsh{from{transform:translateX(0)}to{transform:translateX(120px)}}
.sc-crab{animation:sc-crab 4s ease-in-out infinite alternate}@keyframes sc-crab{0%,20%{transform:translateX(0)}80%,100%{transform:translateX(16px)}}
.sc-creep{animation:sc-creep 18s ease-in-out infinite alternate}@keyframes sc-creep{to{transform:translateX(-40px)}}
.sc-smoke{transform-box:fill-box;transform-origin:50% 50%;animation:sc-smoke 6s ease-out infinite;opacity:0}@keyframes sc-smoke{0%,86%{opacity:0;transform:translate(0,0) scale(.4)}88%{opacity:.8}100%{opacity:0;transform:translate(-30px,-30px) scale(2.4)}}
.sc-cflash{animation:sc-cflash 4.3s linear infinite;opacity:0}@keyframes sc-cflash{0%,30%{opacity:0}31%{opacity:.9}32%{opacity:.1}33.5%{opacity:.7}36%,100%{opacity:0}}
.sc-slide{animation:sc-slide 2.6s ease-in infinite;opacity:0}@keyframes sc-slide{0%{opacity:0;transform:translate(0,0)}15%{opacity:1}100%{opacity:0;transform:translate(-70px,70px)}}
.sc-tumble{animation:sc-tumble 5s ease-in infinite;opacity:0}@keyframes sc-tumble{0%{opacity:0;transform:translate(0,0) rotate(0)}10%{opacity:1}85%{opacity:1;transform:translate(-150px,110px) rotate(-540deg)}100%{opacity:0;transform:translate(-170px,118px) rotate(-600deg)}}
.sc-sink{animation:sc-sink 6s ease-in infinite}@keyframes sc-sink{0%,15%{transform:translateY(0) rotate(0);opacity:1}80%{transform:translateY(16px) rotate(18deg);opacity:1}90%,100%{transform:translateY(20px) rotate(20deg);opacity:0}}
.sc-wing{transform-box:fill-box;transform-origin:50% 100%;animation:sc-wing .35s ease-in-out infinite alternate}@keyframes sc-wing{from{transform:scaleY(1)}to{transform:scaleY(-.4)}}
.sc-glide{animation:sc-glide 26s ease-in-out infinite alternate}@keyframes sc-glide{0%{transform:translate(0,0)}50%{transform:translate(-120px,10px)}100%{transform:translate(-240px,-6px)}}
.sc-flag{transform-box:fill-box;transform-origin:0 50%;animation:sc-flag .45s ease-in-out infinite alternate}@keyframes sc-flag{from{transform:skewY(-10deg) scaleX(.92)}to{transform:skewY(9deg) scaleX(1.04)}}
.sc-eye{transform-box:fill-box;transform-origin:50% 50%;animation:sc-eye 2s ease-in-out infinite}@keyframes sc-eye{0%,100%{transform:scale(1)}50%{transform:scale(1.25)}}
'''
CSS = CSS1 + CSS2


def bubbles(x, y, n=4, color='#e6f6fa', spread=10, seed=1):
    R = random.Random(seed)
    return ''.join(f'<circle class="sc-bub" style="animation-delay:-{R.uniform(0,2.4):.1f}s;animation-duration:{R.uniform(1.8,3):.1f}s" cx="{x + R.uniform(-spread, spread):.0f}" cy="{y}" r="{R.uniform(1, 2.4):.1f}" fill="none" stroke="{color}" stroke-width="1"></circle>' for _ in range(n))


def gull_glide(x, y, s=1, cls='sc-glide', dur=26, delay=0):
    return (f'<g class="{cls}" style="animation-duration:{dur}s;animation-delay:-{delay}s"><g transform="translate({x} {y}) scale({s})">'
            f'<path d="M-12 0 Q-6 -7 0 0 Q6 -7 12 0" fill="none" stroke="#2a2a2a" stroke-width="2" stroke-linecap="round"></path>'
            f'<ellipse cx="0" cy="1" rx="3" ry="1.6" fill="#f4f4f0" stroke="#2a2a2a" stroke-width=".8"></ellipse></g></g>')


def flapping_gull(x, y, s=1):
    return (f'<g transform="translate({x} {y}) scale({s})"><ellipse cx="0" cy="0" rx="5" ry="2.4" fill="#f4f4f0" stroke="#2a2a2a" stroke-width="1"></ellipse>'
            f'<path class="sc-wing" d="M-1 -1 Q-8 -10 -15 -6" fill="none" stroke="#2a2a2a" stroke-width="1.8" stroke-linecap="round"></path>'
            f'<path class="sc-wing" d="M1 -1 Q8 -10 15 -6" fill="none" stroke="#2a2a2a" stroke-width="1.8" stroke-linecap="round" style="animation-delay:-.1s"></path>'
            f'<path d="M-5 0 l-3 1" stroke="#e0a030" stroke-width="1.4"></path></g>')


def pennant(x, y, color='#b23a2a', length=26, z=3, delay=0, left=False):
    if left:
        return svg(x - length, y - 8, length + 4, 16, f'<g class="sc-flag" style="animation-delay:-{delay}s;transform-origin:100% 50%"><path d="M{length} 4 L0 8 L{length} 12 Z" fill="{color}" stroke="{INK}" stroke-width=".8"></path></g>', z=z)
    return svg(x, y - 8, length + 4, 16, f'<g class="sc-flag" style="animation-delay:-{delay}s"><path d="M0 4 L{length} 8 L0 12 Z" fill="{color}" stroke="{INK}" stroke-width=".8"></path></g>', z=z)


# ==================================================================== scenes

def s_calm():
    pal = ['#a6d7dc', '#5aa6b4', '#f4fbfb', '#2f7484', '#ffffff']
    h = []
    h.append(sun_disc(720, 46, 30, halo=3.2, halo_op=.55))
    # sun rays shimmering in the haze
    rays = ''.join(f'<path d="M0 0 L{math.cos(a-0.05)*150:.0f} {math.sin(a-0.05)*150:.0f} L{math.cos(a+0.05)*150:.0f} {math.sin(a+0.05)*150:.0f} Z" fill="#fffbe6" opacity=".18"></path>' for a in [i * math.tau / 12 for i in range(12)])
    h.append(svg(720 - 150, 46 - 150, 300, 300, f'<g transform="translate(150 150)"><g class="sc-rays" style="animation-duration:90s">{rays}</g></g>', z=0))
    strip = []
    for dx in (0, 920):
        for x, y, w_, op in [(120, 40, 220, .5), (420, 26, 160, .4), (560, 70, 260, .35), (830, 34, 140, .45)]:
            strip.append(f'<path d="M{x+dx} {y} h{w_} a5 5 0 0 1 0 10 h-{w_} a5 5 0 0 1 0 -10 Z" fill="#fffdf2" opacity="{op}"></path>')
    h.append(f'<svg aria-hidden="true" width="1840" height="100" viewBox="0 0 1840 100" class="sc-cl" style="position: absolute; left: 0; top: 0; z-index: 0; animation-duration: 240s">{"".join(strip)}</svg>')
    h.append(svg(790, 118, 130, 34, '<path d="M0 34 C18 22 34 8 56 6 C76 4 92 16 104 22 C114 26 124 30 130 34 Z" fill="#a9c6c6" opacity=".7"></path><path d="M60 6 V-6 M60 -6 q-6 -1 -9 3 M60 -6 q6 -2 9 2" stroke="#8fb0b0" stroke-width="2" fill="none" stroke-linecap="round"></path>', z=0))
    # a lazy gull gliding in a wide circle
    h.append(svg(0, 0, 920, 210, gull_glide(330, 46, .9, dur=30) + gull_glide(860, 70, .6, dur=40, delay=8), z=1))
    h.append(sea('back', pal, crest=.3))
    hz = ''.join(f'<path class="sc-heat" style="animation-delay:-{i*1.3:.1f}s" d="M{x} {y} q10 -2 20 0 t20 0 t20 0 t20 0" fill="none" stroke="#ffffff" stroke-width="1.2" stroke-linecap="round"></path>'
                 for i, (x, y) in enumerate([(300, 138), (640, 132), (520, 142), (780, 140), (220, 128)]))
    h.append(svg(0, 0, 920, 210, hz, z=1))
    rh = 140
    rw = round(rh * 120 / 78)
    h.append(f'<div aria-hidden="true" style="position: absolute; left: 400px; top: {round(166 - rh*7/78)}px; width: {rw}px; height: {rh}px; z-index: 1; opacity: .3; transform: scaleY(-1)"><div class="sc-still"><img src="/_blob/da92de2ad61e32aa7ae69311983778f1" alt="" style="width: {rw}px; height: {rh}px; display: block"></div></div>')
    h.append(ship('pearl', 400, rh, cls='sc-still', alt='«Чёрная жемчужина» в штиль'))
    # a sailor on the bowsprit fishing, the line dropping into the water
    h.append(svg(392, 120, 1, 1, f'<path d="M6 8 L-26 46" stroke="#5a3a22" stroke-width="1.6"></path><path d="M-26 46 V47" stroke="#fff" stroke-width="1"></path>' + ripple(-26, 47, 6, '#ffffff', 0, 2.6, .8), z=3))
    gl = ''.join(f'<path class="sc-glint" style="animation-delay:-{(i*.37)%2.6:.2f}s" d="M{720+((-1)**i)*(i%5)*3 - L/2:.0f} {y} h{L}" stroke="#fff6cf" stroke-width="1.6" stroke-linecap="round"></path>'
                 for i, (y, L) in enumerate([(154, 8), (158, 12), (162, 10), (167, 16), (172, 12), (178, 20), (185, 14), (193, 24), (202, 18)]))
    h.append(svg(0, 0, 920, 210, gl, z=3))
    # a flying fish jumps out and back in, twice per loop (two splashes)
    fish = (f'<g class="sc-fish"><path d="M-8 0 C-4 -4 4 -4 8 0 C4 3 -4 3 -8 0 Z M8 0 L13 -4 L12 0 L13 4 Z" fill="#7aa8c0" stroke="{INK}" stroke-width="1"></path>'
            f'<path d="M-2 -2 L-8 -9 L2 -3 Z" fill="#cfe6f0" stroke="{INK}" stroke-width=".6"></path><circle cx="-5" cy="-.6" r=".8" fill="{INK}"></circle></g>')
    h.append(svg(250, 176, 1, 1, fish + '<ellipse class="sc-fplop" cx="0" cy="2" rx="10" ry="3" fill="none" stroke="#ffffff" stroke-width="1.4"></ellipse>'
                 + '<ellipse class="sc-fplop" style="animation-delay:-3.5s" cx="44" cy="2" rx="10" ry="3" fill="none" stroke="#ffffff" stroke-width="1.4"></ellipse>', z=3))
    plank = (f'<g class="sc-bob" style="animation-duration:7s">'
             f'<rect x="-22" y="-3" width="44" height="6" rx="2" fill="#a8703a" stroke="{INK}" stroke-width="1.2"></rect>'
             f'<path d="M-16 -3 V3 M-4 -3 V3 M10 -3 V3" stroke="{INK}" stroke-width=".6" opacity=".5"></path>'
             f'<path d="M2 -3 C2 -12 8 -16 14 -14 C18 -13 19 -9 17 -6 C20 -6 22 -5 23 -4 L17 -3 C14 -2 6 -1 2 -3 Z" fill="#f4f1ea" stroke="{INK}" stroke-width="1.1"></path>'
             f'<path d="M5 -8 C9 -10 13 -9 15 -6" stroke="#8a9096" stroke-width="2.2" fill="none"></path><path class="sc-glint" style="animation-duration:5s" d="M14.6 -11.6 q1 .8 2 0" stroke="{INK}" stroke-width="1" fill="none"></path>'
             f'<text class="sc-note" style="animation-duration:5s" x="20" y="-16" font-family="Alegreya, Georgia, serif" font-style="italic" font-size="9" fill="#2f6070">z</text></g>')
    rings = ''.join(ripple(0, 4, 26, '#ffffff', d, 5, .6) for d in (0, 2.5))
    h.append(svg(660, 178, 1, 1, rings + plank + bubbles(-30, 6, 3, seed=4), z=3))
    return ('linear-gradient(#bfe2ec 0%, #dcebe2 55%, #f4ead0 100%)', ''.join(h), 'Штиль: гладкое море, корабль с обвисшими парусами стоит на месте', '')


def s_wind():
    pal = ['#3f93b4', '#185678', '#eef8fc', '#0f3a52', '#ffffff']
    h = []
    h.append(sun_disc(160, 30, 18, halo=2.2, halo_op=.4))
    # three layers of clouds racing at different speeds
    h.append(cloud_strip([(40, 6, .9, '#ffffff', '#cfe3ee', '#5f86a0'), (330, -4, .7, '#ffffff', '#cfe3ee', '#5f86a0'), (560, 14, 1.1, '#ffffff', '#cfe3ee', '#5f86a0'), (790, 0, .8, '#ffffff', '#cfe3ee', '#5f86a0')], 0, 110, 18))
    h.append(cloud_strip([(150, 52, .45, '#f4fafd', '#d8e8f0', '#7fa0b4'), (480, 62, .4, '#f4fafd', '#d8e8f0', '#7fa0b4'), (700, 54, .5, '#f4fafd', '#d8e8f0', '#7fa0b4')], 0, 120, 30, op=.85))
    h.append(cloud_strip([(260, 84, .28, '#f4fafd', '#d8e8f0', '#9ab4c4'), (620, 90, .25, '#f4fafd', '#d8e8f0', '#9ab4c4'), (880, 80, .3, '#f4fafd', '#d8e8f0', '#9ab4c4')], 0, 120, 55, op=.7))
    # far islands sliding by (parallax): a lighthouse islet and a hilly one, repeated
    isl = ''
    for dx in (0, 920):
        isl += (f'<g transform="translate({120+dx} 0)"><path d="M0 40 C14 30 30 24 50 24 C70 24 86 30 100 40 Z" fill="#6f9a7a" stroke="#3f5a48" stroke-width="1"></path><path d="M44 24 L46 4 H54 L56 24 Z" fill="#f2ead8" stroke="#3f5a48" stroke-width="1"></path><path d="M45 12 H55 M45.6 18 H54.4" stroke="#b23a2a" stroke-width="2.4"></path><rect x="46" y="0" width="8" height="5" fill="#ffe58a" stroke="#3f5a48" stroke-width=".8"></rect></g>'
                f'<g transform="translate({560+dx} 0)"><path d="M0 40 C20 22 40 10 70 12 C100 14 130 26 160 40 Z" fill="#88aa90" stroke="#4f6a58" stroke-width="1"></path><path d="M40 20 Q70 0 100 18" fill="none" stroke="#6f9078" stroke-width="2"></path></g>')
    h.append(f'<svg aria-hidden="true" width="1840" height="40" viewBox="0 0 1840 40" class="sc-par" style="position: absolute; left: 0; top: 112px; z-index: 0">{isl}</svg>')
    h.append(sea('back', pal))
    # a merchant far out, slower
    h.append(f'<div class="sc-cross-far" style="position: absolute; left: 940px; top: 0; width: 1px; height: 210px; z-index: 1">{ship("merchant", 0, 40, cls="w-calm", wl=155, z=1, alt="")}</div>')
    # the hero: «Индевор» runs right-to-left across the whole scene, fast, in a loop
    H = 150
    W = round(H * 120 / 78)
    hero = ship('endeavour', 0, H, cls='sc-heel', alt='«Индевор» несётся под всеми парусами')
    h.append(f'<div class="sc-cross" style="position: absolute; left: 940px; top: 0; width: {W}px; height: 210px; z-index: 2">{hero}'
             + pennant(W // 2, 39, '#2f4f66', 34, left=True) + '</div>')
    # bow spray, wake and foam travel with the ship, above the near water
    spray = ''.join(f'<circle class="sc-fly{1+i%3}" style="animation-delay:-{i*.25:.2f}s;animation-duration:1.4s" cx="{i%4}" cy="{-(i%3)*2}" r="{1.4 + (i%3)*.6:.1f}" fill="#ffffff"></circle>' for i in range(12))
    wake = ''.join(f'<path class="sc-wake" style="animation-delay:-{i*.3:.1f}s;animation-duration:1.2s" d="M{W-40 + i*18} {168 + i*3} q20 -4 44 0" stroke="#ffffff" stroke-width="{2.6 - i*.3:.1f}" fill="none" stroke-linecap="round"></path>' for i in range(6))
    foam = f'<path d="M14 168 C60 172 140 172 {W-30} 168" stroke="#ffffff" stroke-width="3" fill="none" stroke-linecap="round" opacity=".85"></path>'
    h.append(f'<div class="sc-cross" style="position: absolute; left: 940px; top: 0; width: {W+200}px; height: 210px; z-index: 4">'
             + svg(0, 0, W + 200, 210, foam + wake + f'<g transform="translate(22 162)"><path class="ws-splash" d="M-10 8 Q-16 -10 -4 -16 Q-2 -4 6 -10 Q8 2 14 8 Z" fill="#ffffff" opacity=".95"></path>{spray}</g>', z=4) + '</div>')
    # gusts of wind
    gusts = []
    for i, (x, y, s) in enumerate([(640, 30, 1.2), (720, 86, 1), (300, 58, .9), (560, 112, .8), (180, 100, 1), (850, 60, .9), (420, 20, .8)]):
        gusts.append(f'<g class="sc-gust" style="animation-delay:-{i*.5:.1f}s;animation-duration:2.2s"><path transform="translate({x} {y}) scale({s})" d="M0 0 H-60 C-74 0 -78 -12 -68 -16 C-60 -19 -54 -12 -58 -8 M-10 10 H-46" fill="none" stroke="#ffffff" stroke-width="2.4" stroke-linecap="round" opacity=".85"></path></g>')
    h.append(svg(0, 0, 920, 210, ''.join(gusts), z=4))
    # a sailor's hat blown away, tumbling across the scene
    h.append(svg(880, 70, 1, 1, f'<g class="sc-hat"><path d="M-10 2 C-10 -8 10 -8 10 2 Z" fill="#2a2420" stroke="{INK}" stroke-width="1"></path><path d="M-14 2 H14" stroke="{INK}" stroke-width="2.4" stroke-linecap="round"></path><path d="M-9 -1 H9" stroke="#b23a2a" stroke-width="1.6"></path></g>', z=4))
    h.append(svg(0, 0, 920, 210, flapping_gull(300, 40, .9) + flapping_gull(340, 56, .7), z=3, cls='w-gulls', style='animation-duration: 12s'))
    h.append(sea('front', pal))
    h.append(spk([(250, 190, .3), (520, 198, 1.1), (700, 184, .6), (820, 200, 1.6), (430, 186, 2.0), (880, 180, .9), (150, 196, 1.3), (610, 206, .1)]))
    return ('linear-gradient(#5fb0dc 0%, #9fd2ec 60%, #dcf0f6 100%)', ''.join(h), 'Попутный ветер: «Индевор» под всеми парусами проносится мимо островов', 'sc-fast')


def s_wave():
    pal = ['#2f5c62', '#0d2a30', '#cfe3e0', '#06181c', '#eef6f4']
    h = []
    h.append(cloud_strip([(0, -10, 1.3, '#4a5654', '#323c3b', '#1a2120'), (260, 0, 1.0, '#566260', '#3a4544', '#1a2120'), (520, -14, 1.4, '#4a5654', '#323c3b', '#1a2120'), (780, 4, 1.1, '#566260', '#3a4544', '#1a2120')], 0, 90, 30))
    h.append('<div class="sc-cflash" aria-hidden="true" style="position: absolute; inset: 0; z-index: 0; background: radial-gradient(40% 70% at 20% 0%, rgba(220,235,230,.6), rgba(220,235,230,0))"></div>')
    h.append('<div class="w-rain" aria-hidden="true" style="position: absolute; inset: 0; z-index: 4; opacity: .55; background: repeating-linear-gradient(105deg, rgba(200,220,215,0) 0 11px, rgba(200,220,215,.35) 11px 12px, rgba(200,220,215,0) 12px 22px)"></div>')
    h.append(sea('back', pal))
    # a smaller swell behind, rolling in
    h.append(svg(120, 104, 300, 60, '<g class="sc-swell" style="animation-duration:6s;animation-delay:-2s"><path d="M0 60 C60 54 110 30 150 20 C190 12 240 20 300 60 Z" fill="#2f5c62" stroke="#0d2a30" stroke-width="1.4"></path><path d="M120 26 C140 18 166 16 186 20" stroke="#cfe3e0" stroke-width="2" fill="none" stroke-linecap="round"></path></g>', z=1))
    h.append(ship('revenge', 300, 104, cls='sc-pitch', wl=170, alt='«Месть» на склоне огромной волны'))
    # water pouring off the stern as it is lifted
    h.append(svg(388, 140, 1, 1, ''.join(f'<path class="sc-drip" style="animation-delay:-{i*.3:.1f}s;animation-duration:.9s" d="M{i*6} 0 v6" stroke="#cfe3e0" stroke-width="1.6" stroke-linecap="round"></path>' for i in range(4)), z=3))
    wave = (
        '<defs><linearGradient id="scwv" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7fc0bc"></stop><stop offset=".3" stop-color="#3a7a7e"></stop><stop offset="1" stop-color="#0d2a30"></stop></linearGradient>'
        '<linearGradient id="scwl" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#ffffff" stop-opacity="0"></stop><stop offset=".5" stop-color="#e6fbf8" stop-opacity=".55"></stop><stop offset="1" stop-color="#ffffff" stop-opacity="0"></stop></linearGradient></defs>'
        '<g class="sc-swell">'
        f'<path d="M0 230 C60 222 120 196 168 150 C206 112 236 64 284 40 C324 20 372 22 404 44 C428 62 446 92 460 120 V230 Z" fill="url(#scwv)" stroke="{INK}" stroke-width="2"></path>'
        # translucent light band in the lip
        '<path d="M190 120 C220 80 250 56 290 44 C320 36 350 38 380 50 C350 56 320 64 296 80 C270 96 240 118 220 140 Z" fill="url(#scwl)"></path>'
        '<path d="M40 214 C100 196 150 160 190 118 M90 220 C150 200 196 160 226 120 M150 222 C200 204 236 170 262 136 M210 224 C250 208 280 180 300 150" fill="none" stroke="#9fd2d0" stroke-width="2.4" stroke-linecap="round" opacity=".55"></path>'
        # small fish visible inside the wave
        + ''.join(f'<path transform="translate({x} {y}) scale(.8)" d="M-6 0 C-3 -3 3 -3 6 0 C3 2 -3 2 -6 0 Z M6 0 L10 -3 V3 Z" fill="#0d2a30" opacity=".45"></path>' for x, y in [(250, 110), (268, 120), (236, 124)]) +
        f'<path d="M284 40 C246 34 214 52 202 80 C196 96 212 104 222 92 C226 78 240 68 256 68 C244 80 248 96 264 94 C272 76 292 64 314 62 C332 60 352 66 366 78 C360 54 330 36 284 40 Z" fill="#2f6a70" stroke="{INK}" stroke-width="2"></path>'
        f'<path d="M284 40 C324 20 372 22 404 44 C412 50 418 56 424 62 C414 58 404 60 400 66 C396 56 384 54 376 62 C372 50 358 48 350 56 C344 44 330 42 320 50 C312 38 298 36 284 40 Z" fill="#f2fbfa" stroke="{INK}" stroke-width="1.6" stroke-linejoin="round"></path>'
        f'<path d="M202 80 C196 96 212 104 222 92 C218 98 210 100 206 94 Z M222 92 C226 78 240 68 256 68 C250 72 246 78 246 84 C240 78 230 82 222 92 Z" fill="#f2fbfa" stroke="{INK}" stroke-width="1.2"></path>'
        '<path d="M300 34 l4 -10 M330 28 l2 -12 M360 30 l6 -10 M390 38 l8 -8" stroke="#f2fbfa" stroke-width="2.4" stroke-linecap="round"></path>'
        # foam streaks sliding down the face
        + ''.join(f'<path class="sc-slide" style="animation-delay:-{i*.55:.2f}s" d="M{x} {y} q8 -3 16 0" stroke="#f2fbfa" stroke-width="2.2" fill="none" stroke-linecap="round"></path>' for i, (x, y) in enumerate([(270, 70), (300, 64), (240, 96), (330, 70), (210, 120)]))
        # a barrel tumbling down the face of the wave
        + f'<g class="sc-tumble"><g transform="translate(330 60)"><ellipse rx="9" ry="11" fill="#8a5a2e" stroke="{INK}" stroke-width="1.4"></ellipse><path d="M-9 -4 H9 M-9 4 H9" stroke="#3a3530" stroke-width="2"></path></g></g>'
        + '</g>'
        + ''.join(f'<circle class="sc-fly{1+i%3}" style="animation-delay:-{i*.25:.2f}s;animation-duration:1.6s" cx="{200+ (i*37)%200}" cy="{36 + (i*13)%40}" r="{1.6+(i%3)*.8:.1f}" fill="#f2fbfa"></circle>' for i in range(14))
    )
    h.append(svg(470, -10, 460, 230, wave, z=3))
    # a gull fighting the wind
    h.append(svg(0, 0, 920, 210, f'<g class="sc-wave-bob" style="animation-duration:1.6s">{flapping_gull(170, 40, 1)}</g>', z=4))
    h.append(sea('front', pal))
    h.append(spk([(200, 196, .4), (380, 190, 1.2), (130, 200, 1.9), (440, 202, .8)]))
    return ('linear-gradient(#26302f 0%, #44524f 55%, #6a7a74 100%)', ''.join(h), 'Девятый вал: огромная волна нависает над кораблём', '')


def s_maelstrom():
    h = []
    cl = ''.join(f'<path d="M{math.cos(a)*r:.0f} {math.sin(a)*r:.0f} A{r} {r} 0 0 1 {math.cos(a+1.4)*r:.0f} {math.sin(a+1.4)*r:.0f}" fill="none" stroke="{c}" stroke-width="{wd}" stroke-linecap="round" opacity="{op}"></path>'
                 for a, r, c, wd, op in [(0, 420, '#3d5560', 34, .8), (1.9, 380, '#4a6470', 26, .7), (3.6, 440, '#33494f', 38, .8), (5.0, 330, '#55707a', 20, .6), (1.0, 250, '#2a3c44', 26, .7), (3.9, 210, '#3d5560', 18, .6)])
    h.append(f'<div aria-hidden="true" style="position: absolute; left: {470-460}px; top: {-30-460}px; width: 920px; height: 920px; transform: scaleY(.14); z-index: 0"><svg width="920" height="920" viewBox="-460 -460 920 920" class="sc-spin-slow" style="display: block; transform-origin: 50% 50%">{cl}</svg></div>')
    h.append('<div class="sc-cflash" aria-hidden="true" style="position: absolute; inset: 0; z-index: 0; background: radial-gradient(30% 60% at 70% 0%, rgba(200,230,240,.5), rgba(200,230,240,0))"></div>')
    rows = []
    R = random.Random(5)
    for k in range(9):
        y = 104 + k * k * 1.3 + k * 2
        for x in range(-20, 940, 26 + k * 4):
            xx = x + R.uniform(-6, 6)
            L = 6 + k * 1.6
            rows.append(f'<path d="M{xx:.0f} {y:.0f} q{L/2:.1f} -{1+k*.25:.1f} {L:.1f} 0" stroke="#bfe0e6" stroke-width="{.7+k*.12:.2f}" fill="none" opacity="{.25+k*.04:.2f}"></path>')
    h.append(svg(0, 0, 920, 210, '<defs><linearGradient id="scms" x1="0" y1="100" x2="0" y2="210" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#3f6f7e"></stop><stop offset="1" stop-color="#0c222c"></stop></linearGradient></defs>'
                 '<rect x="0" y="100" width="920" height="110" fill="url(#scms)"></rect><path d="M0 100.5 H920" stroke="#bfe0e6" opacity=".5"></path>' + ''.join(rows), z=0))

    def arms(n, r0, r1, turns, w1, w2, c1, c2):
        o = []
        for k in range(n):
            pts = []
            for i in range(60):
                t = i / 59
                r = r0 + t * (r1 - r0)
                a = k * math.tau / n + t * turns
                pts.append(f'{math.cos(a)*r:.1f} {math.sin(a)*r:.1f}')
            o.append(f'<path d="M{" L".join(pts)}" fill="none" stroke="{c2 if k % 2 else c1}" stroke-width="{w2 if k % 2 else w1}" stroke-linecap="round" opacity="{.8 if k % 2 else .5}"></path>')
        return ''.join(o)
    disc = ('<defs><radialGradient id="scvx"><stop offset="0" stop-color="#03090c"></stop><stop offset=".2" stop-color="#0b2129"></stop><stop offset=".55" stop-color="#1e4a58"></stop><stop offset=".85" stop-color="#2f6070" stop-opacity=".8"></stop><stop offset="1" stop-color="#2f6070" stop-opacity="0"></stop></radialGradient></defs>'
            '<circle r="340" fill="url(#scvx)"></circle>' + arms(6, 110, 330, 3.2, 10, 7, '#8fc2cc', '#e6f6f8') +
            '<circle r="300" fill="none" stroke="#e6f6f8" stroke-width="5" stroke-dasharray="30 26" opacity=".6"></circle>'
            f'<g transform="translate(180 -120) rotate(30)"><rect x="-40" y="-9" width="80" height="18" rx="4" fill="#a8703a" stroke="{INK}" stroke-width="4"></rect></g>'
            f'<g transform="translate(-200 60)"><ellipse rx="26" ry="30" fill="#8a5a2e" stroke="{INK}" stroke-width="4"></ellipse><path d="M-26 -8 H26 M-26 10 H26" stroke="#3a3530" stroke-width="6"></path></g>'
            f'<g transform="translate(240 150) rotate(50)"><rect x="-60" y="-5" width="120" height="10" fill="#6a4424" stroke="{INK}" stroke-width="4"></rect><path d="M-10 -5 L10 -40 L30 -5 Z" fill="#e6dcc0" stroke="{INK}" stroke-width="3"></path></g>'
            f'<g transform="translate(-120 -230)"><rect x="-24" y="-18" width="48" height="36" fill="#b0824a" stroke="{INK}" stroke-width="4"></rect><path d="M-24 -18 L24 18 M24 -18 L-24 18" stroke="{INK}" stroke-width="3"></path></g>')
    h.append(f'<div aria-hidden="true" style="position: absolute; left: {470-340}px; top: {162-340}px; width: 680px; height: 680px; transform: scaleY(.15); z-index: 1"><svg width="680" height="680" viewBox="-340 -340 680 680" class="sc-spin" style="display: block; transform-origin: 50% 50%">{disc}</svg></div>')
    # the inner throat spins faster
    inner = arms(5, 30, 130, 2.6, 8, 5, '#5f9aa8', '#cfeef4') + '<circle r="34" fill="#020608"></circle>'
    h.append(f'<div aria-hidden="true" style="position: absolute; left: {470-140}px; top: {162-140}px; width: 280px; height: 280px; transform: scaleY(.15); z-index: 1"><svg width="280" height="280" viewBox="-140 -140 280 280" class="sc-spin" style="display: block; transform-origin: 50% 50%; animation-duration: 3.2s">{inner}</svg></div>')
    # mist rising from the throat, bubbles
    h.append(svg(0, 0, 920, 210, ''.join(f'<ellipse class="sc-puff" style="animation-delay:-{i*.9:.1f}s;animation-duration:3.6s" cx="{450 + i*12}" cy="160" rx="16" ry="6" fill="#cfe6ec" opacity=".5"></ellipse>' for i in range(4)) + bubbles(470, 164, 6, seed=9, spread=24), z=2))
    h.append(ship('revenge', 150, 112, cls='sc-inward', wl=160, alt='«Месть» на краю водоворота'))
    h.append(ship('endeavour', 700, 70, cls='sc-inward2', wl=148, flip=True, z=1, alt='«Индевор» кружит у воронки'))
    h.append(svg(0, 0, 920, 210, ''.join(f'<circle class="sc-glint" style="animation-delay:-{i*.4:.1f}s;animation-duration:1.6s" cx="{x}" cy="{y}" r="2" fill="#ffffff"></circle>' for i, (x, y) in enumerate([(160, 170), (230, 184), (380, 196), (560, 194), (720, 178), (790, 160), (330, 138), (620, 136), (700, 196), (250, 150)])), z=3))
    return ('linear-gradient(#18262e 0%, #2c434c 55%, #4d6670 100%)', ''.join(h), 'Мальстрём: корабли кружат вокруг воронки, обломки затягивает внутрь', '')


def s_clear():
    pal = ['#3aa6c4', '#156a8a', '#f4fcfd', '#0d4560', '#ffffff']
    h = []
    rays = ''.join(f'<path d="M0 0 L{math.cos(a-0.07)*120:.0f} {math.sin(a-0.07)*120:.0f} L{math.cos(a+0.07)*120:.0f} {math.sin(a+0.07)*120:.0f} Z" fill="#fff6cc" opacity=".22"></path>' for a in [i * math.tau / 16 for i in range(16)])
    h.append(svg(560 - 120, 54 - 120, 240, 240, f'<g transform="translate(120 120)"><g class="sc-rays">{rays}</g></g>', z=0))
    h.append(sun_disc(560, 54, 30, halo=2.4, halo_op=.6))
    h.append(cloud_strip([(860, 18, .35, '#ffffff', '#d6eaf2', '#7fa6bc')], 0, 60, 120))
    h.append(sea('back', pal))
    h.append(ship('pearl', 278, 128, cls='w-calm', flip=True, alt='«Чёрная жемчужина»'))
    h.append(ship('endeavour', 610, 128, cls='w-calm', style='animation-delay: -2s', alt='«Индевор» напротив'))
    # both fire point-blank at the ship opposite: flash, smoke, a cannonball, a hit with splinters
    def volley(x0, y0, dirn, delay):
        ball = 'sc-ballR' if dirn > 0 else 'sc-ballL'
        hx = x0 + dirn * 136
        d = f'animation-delay:-{delay}s'
        chips = ''.join(f'<path class="sc-chips" style="{d};--cx:{dirn*k*6}px" d="M{hx} {y0+6} l3 -1 l1 3 Z" fill="#a8703a"></path>' for k in (1, 2, 3))
        return (f'<circle class="sc-mflash" style="{d}" cx="{x0}" cy="{y0}" r="10" fill="#fff3b0"></circle>'
                f'<circle class="sc-mflash" style="{d}" cx="{x0+dirn*6}" cy="{y0}" r="5" fill="#ff9a3a"></circle>'
                + ''.join(f'<circle class="sc-msmoke" style="{d}" cx="{x0+dirn*k*5}" cy="{y0-k*2}" r="{7+k*2}" fill="#eae6dc"></circle>' for k in range(3))
                + f'<circle class="{ball}" style="{d}" cx="{x0}" cy="{y0}" r="3" fill="#1a1a1a"></circle>'
                + f'<circle class="sc-mhit" style="{d}" cx="{hx}" cy="{y0+6}" r="9" fill="#ffd25a" opacity=".9"></circle>' + chips)
    h.append(svg(0, 0, 920, 210, volley(474, 146, 1, 0) + volley(616, 140, -1, 1.7), z=3))
    h.append(svg(0, 0, 920, 210, flapping_gull(700, 40, .8) + flapping_gull(730, 54, .6) + flapping_gull(240, 30, .7), z=3, cls='w-gulls', style='animation-duration: 34s'))
    h.append(sea('front', pal))
    h.append(spk([(x, 176 + (i * 7) % 28, (i * .37) % 2.2) for i, x in enumerate(range(240, 900, 44))]))
    return ('linear-gradient(#2f8fd0 0%, #6ab8e6 55%, #c4e6f4 100%)', ''.join(h), 'Ясное небо: два корабля бьют друг в друга в упор', '')


def s_mermaids():
    pal = ['#5a5a8a', '#22264a', '#e2d8f6', '#101330', '#f2ecff']
    h = []
    h.append(stars(46, 3, 76, color='#fff2e0'))
    h.append(svg(760, 14, 1, 1, '<g class="sc-shoot"><path d="M0 0 L40 -14" stroke="#fff2e0" stroke-width="1.6" stroke-linecap="round" opacity=".7"></path><circle r="2" fill="#fffbe6"></circle></g>', z=0))
    h.append('<div aria-hidden="true" class="sc-halo" style="position: absolute; left: 700px; top: 92px; width: 160px; height: 120px; border-radius: 50%; background: radial-gradient(closest-side, rgba(255,200,150,.7), rgba(255,170,130,0)); z-index: 0"></div>')
    h.append('<div aria-hidden="true" style="position: absolute; left: 752px; top: 126px; width: 56px; height: 56px; border-radius: 50%; background: radial-gradient(circle, #fff0c8, #ffb27a 70%); z-index: 0"></div>')
    h.append(cloud_strip([(100, 54, .6, '#8a5a8a', '#6a4470', '#3a2340'), (520, 40, .5, '#9a6a90', '#74507a', '#3a2340')], 0, 100, 140, op=.8))
    h.append(sea('back', pal))
    h.append(svg(0, 0, 920, 210, ''.join(f'<path class="sc-glint" style="animation-delay:-{i*.3:.1f}s" d="M{780-L/2:.0f} {y} h{L}" stroke="#ffd2a0" stroke-width="2" stroke-linecap="round"></path>' for i, (y, L) in enumerate([(154, 30), (159, 40), (165, 24), (172, 50)])), z=1))
    h.append(ship('revenge', 250, 118, cls='w-calm', alt='«Месть» у скалы русалок'))
    # sailors leaning over the rail, spellbound, and one who jumps
    lean = ''.join(f'<g transform="translate({x} 132)"><circle cx="0" cy="-6" r="3" fill="#e8c09a" stroke="{INK}" stroke-width=".8"></circle><path d="M-3 -8 H3 L2 -10 H-2 Z" fill="{c}"></path><path d="M0 -3 L4 2" stroke="{INK}" stroke-width="2" stroke-linecap="round"></path><path class="sc-note" style="animation-duration:3s;animation-delay:-{i}s" d="M4 -14 c2 -3 5 -3 6 0 c1 -3 4 -3 6 0 c0 3 -6 6 -6 6 c0 0 -6 -3 -6 -6 Z" fill="#ff8aa8"></path></g>' for i, (x, c) in enumerate([(380, '#2f4f66'), (396, '#b23a2a')]))
    h.append(svg(0, 0, 920, 210, lean, z=3))
    sailor = (f'<g class="sc-jump"><g><circle cx="0" cy="-8" r="3" fill="#e8c09a" stroke="{INK}" stroke-width=".8"></circle><path d="M-3 -10 H3 L2 -12 H-2 Z" fill="#b23a2a"></path>'
              f'<path d="M0 -5 V3 M0 -3 L-5 -7 M0 -3 L5 -7 M0 3 L-3 9 M0 3 L3 9" stroke="{INK}" stroke-width="1.6" stroke-linecap="round"></path><path d="M-2 -5 H2 V2 H-2 Z" fill="#f2ead8"></path></g></g>')
    h.append(svg(414, 130, 1, 1, sailor, z=3))
    h.append(svg(462, 172, 1, 1, '<ellipse class="sc-plop" cx="0" cy="0" rx="14" ry="4" fill="none" stroke="#ffffff" stroke-width="1.6"></ellipse>' + ''.join(f'<circle class="sc-plop" style="animation-duration:6s" cx="{dx}" cy="-4" r="1.6" fill="#ffffff"></circle>' for dx in (-6, 0, 6)), z=4))
    hair = f'<path class="sc-sway" d="M-16 -94 C-18 -102 -6 -104 -4 -96 C2 -90 0 -80 4 -70 C6 -64 2 -60 0 -62 C-2 -70 -6 -76 -8 -84 C-10 -90 -14 -92 -16 -88 C-20 -84 -22 -76 -20 -70 C-24 -76 -24 -88 -16 -94 Z" fill="#c2502e" stroke="{INK}" stroke-width="1.1"></path>'
    fluke = f'<path class="sc-sway" style="animation-duration:1.8s" d="M34 -18 C40 -22 48 -20 50 -14 C44 -12 38 -8 34 -10 Z" fill="#5fb09c" stroke="{INK}" stroke-width="1.2"></path>'
    mer = (
        rocks(0, 0, 1.6, '#4a4058', '#7a6c8a', '#2a2238') +
        # pearls in an open shell on the rock
        f'<g transform="translate(26 -18)"><path d="M-8 0 C-8 -6 8 -6 8 0 Z" fill="#e8d6e8" stroke="{INK}" stroke-width=".9"></path><circle class="sc-glint" cx="-3" cy="-2" r="1.6" fill="#ffffff"></circle><circle class="sc-glint" style="animation-delay:-1s" cx="2" cy="-2.4" r="1.4" fill="#ffffff"></circle></g>'
        '<g transform="translate(0 -8)">'
        f'<path d="M-8 -60 C-2 -48 8 -40 20 -38 C30 -36 36 -28 34 -18 C30 -6 26 -8 24 -12 C24 -20 20 -26 12 -28 C0 -30 -10 -40 -16 -54 Z" fill="#3f8a7a" stroke="{INK}" stroke-width="1.4" stroke-linejoin="round"></path>'
        + fluke + ''.join(f'<path d="M{x} {y} q3 2.4 6 0" stroke="#9fd6c4" stroke-width="1" fill="none"></path>' for x, y in [(-8, -50), (-2, -44), (6, -40), (14, -36), (22, -33)]) +
        f'<path d="M-16 -56 C-20 -64 -20 -74 -16 -82 C-14 -86 -8 -86 -6 -82 C-4 -76 -6 -64 -8 -58 Z" fill="#f0c8a8" stroke="{INK}" stroke-width="1.2"></path>'
        f'<path d="M-16 -70 C-14 -66 -10 -66 -8 -68 C-8 -64 -12 -62 -16 -64 Z M-16 -64 C-12 -62 -8 -62 -7 -66" fill="#b45a8a" stroke="{INK}" stroke-width=".8"></path>'
        f'<path d="M-8 -78 C0 -80 6 -84 8 -90" stroke="#f0c8a8" stroke-width="3.4" fill="none" stroke-linecap="round"></path><path d="M-8 -78 C0 -80 6 -84 8 -90" stroke="{INK}" stroke-width=".8" fill="none" opacity=".5"></path>'
        f'<path d="M6 -92 l4 -2 l1 3 l-4 2 Z" fill="#e2b23e" stroke="{INK}" stroke-width=".6"></path>'
        f'<circle cx="-11" cy="-92" r="6" fill="#f0c8a8" stroke="{INK}" stroke-width="1.2"></circle>' + hair +
        f'<path d="M-13 -91 q1.4 1.4 3 0" stroke="{INK}" stroke-width=".8" fill="none"></path><circle cx="-8.6" cy="-89" r=".9" fill="#d97a8a"></circle></g>'
    )
    notes = ''.join(f'<g class="sc-note" style="animation-delay:-{i*1:.1f}s"><path transform="translate({-4 + i*4} {-112})" d="M0 0 V-10 L7 -12 V-2 M0 0 a2.4 1.8 -20 1 1 -1 -2 M7 -2 a2.4 1.8 -20 1 1 -1 -2" fill="#ffe8f2" stroke="#ffe8f2" stroke-width="1.2"></path></g>' for i in range(4))
    h.append(svg(560, 168, 1, 1, mer + notes, z=2))
    tail = (f'<g class="sc-tail"><path d="M28 70 C22 52 24 36 30 24 C34 16 34 8 30 2 L36 0 C42 10 42 22 38 32 C34 44 34 56 38 70 Z" fill="#4f9e8c" stroke="{INK}" stroke-width="1.4"></path>'
            f'<path d="M32 2 C24 0 16 -6 12 -14 C20 -12 26 -10 32 -4 C38 -10 44 -12 52 -12 C48 -4 42 0 34 2 Z" fill="#5fb09c" stroke="{INK}" stroke-width="1.3" stroke-linejoin="round"></path>'
            + ''.join(f'<path d="M{31 - (k > 2)*1} {14 + k*9} q3 2.2 6 0" stroke="#bfeadc" stroke-width="1" fill="none"></path>' for k in range(5))
            + ''.join(f'<circle cx="{x}" cy="{y}" r="1.4" fill="#e6f6fa"></circle>' for x, y in [(14, -16), (50, -14), (32, -18)]) + '</g>')
    h.append(f'<div aria-hidden="true" style="position: absolute; left: 676px; top: 92px; width: 70px; height: 72px; overflow: hidden; z-index: 2"><svg width="70" height="72" viewBox="0 -2 70 72" style="display: block; overflow: visible">{tail}</svg></div>')
    h.append(svg(710, 166, 1, 1, ripple(0, 0, 22, '#f2ecff', 0, 3) + ripple(0, 0, 22, '#f2ecff', 1.5, 3), z=3))
    h.append(sea('front', pal))
    h.append(spk([(600, 196, .3), (820, 186, 1.2), (500, 204, 2.0)]))
    return ('linear-gradient(#251f48 0%, #5e4476 42%, #c9807a 78%, #f0b688 100%)', ''.join(h), 'Русалки поют на скале, заворожённые матросы прыгают за борт', '')


def s_rum():
    pal = ['#3a9cb2', '#16607a', '#eef9fb', '#0e4458', '#ffffff']
    h = []
    h.append(sun_disc(840, 30, 20, halo=2.4, halo_op=.5))
    h.append(cloud_strip([(60, 24, .8, '#ffffff', '#f0dcc0', '#9a7a5a'), (380, 6, .6, '#ffffff', '#f0dcc0', '#9a7a5a'), (640, 30, .9, '#ffffff', '#f0dcc0', '#9a7a5a')], 0, 90, 70))
    h.append(sea('back', pal))
    h.append(ship('pearl', 700, 74, cls='w-calm', wl=158, z=1, alt='«Чёрная жемчужина» вдали'))
    # a jolly boat rowing out to pick the barrels up
    boat = (f'<g class="sc-row" style="animation-duration:30s"><g transform="translate(660 160)"><path d="M-18 0 H18 L13 7 H-13 Z" fill="#8a5a2e" stroke="{INK}" stroke-width="1"></path>'
            f'<circle cx="-6" cy="-5" r="2.4" fill="#e8c09a" stroke="{INK}" stroke-width=".6"></circle><circle cx="6" cy="-5" r="2.4" fill="#e8c09a" stroke="{INK}" stroke-width=".6"></circle>'
            f'<path class="sc-oar" d="M0 -2 L-14 10" stroke="#5a3a22" stroke-width="1.4"></path></g></g>')
    h.append(svg(0, 0, 920, 210, boat, z=1))
    h.append(sea('front', pal))
    items = []
    for i, (x, y, s, lab) in enumerate([(320, 182, 1.15, 'РОМ'), (470, 190, 1.35, 'РОМ'), (600, 180, 1.0, 'РОМ'), (812, 194, 1.2, '')]):
        items.append(f'<g class="sc-bob" style="animation-delay:-{i*.9:.1f}s;animation-duration:{3+i*.4:.1f}s">{barrel(x, y, s, lab, clip_y=6, uid=f"rb{i}")}</g>')
        items.append(ripple(x, y + 7 * s, 22 * s, '#ffffff', i * .8, 3.2))
    # a gull riding the big barrel
    items.append(f'<g class="sc-bob" style="animation-delay:-.9s;animation-duration:3.4s"><g transform="translate(474 166)"><path d="M-6 0 C-6 -8 0 -10 4 -8 C7 -7 7 -3 5 -1 L8 0 Z" fill="#f4f1ea" stroke="{INK}" stroke-width="1"></path><path d="M-3 -3 C0 -4 3 -3 4 -1" stroke="#8a9096" stroke-width="1.8" fill="none"></path><path d="M0 0 V4 M2 0 V4" stroke="#e0a030" stroke-width="1"></path><path d="M6 -6 l3 .5" stroke="#e0a030" stroke-width="1.4"></path></g></g>')
    bottle = (f'<g transform="translate(400 176) rotate(-28)"><defs><clipPath id="rbot"><rect x="-20" y="-30" width="40" height="34"></rect></clipPath></defs><g clip-path="url(#rbot)">'
              f'<path d="M-3 -24 H3 V-17 C8 -15 9 -11 9 -7 V8 C9 10 8 11 6 11 H-6 C-8 11 -9 10 -9 8 V-7 C-9 -11 -8 -15 -3 -17 Z" fill="#3f6a3a" stroke="{INK}" stroke-width="1.2"></path>'
              f'<rect x="-3.6" y="-28" width="7.2" height="5" rx="1.2" fill="#c9a06a" stroke="{INK}" stroke-width="1"></rect>'
              f'<rect x="-7" y="-6" width="14" height="10" rx="1.2" fill="#efe3c8" stroke="{INK}" stroke-width=".8"></rect><path d="M-5 -3 h10 M-5 1 h7" stroke="#8e2b22" stroke-width="1"></path>'
              f'<path d="M-6 -12 V2" stroke="#fff" stroke-width="1.6" opacity=".35"></path></g></g>')
    items.append(f'<g class="sc-bob" style="animation-duration:2.6s">{bottle}</g>' + bubbles(404, 184, 4, seed=2))
    crate = f'<g class="sc-bob" style="animation-delay:-1s;animation-duration:4.2s"><g transform="translate(700 190) rotate(8)"><rect x="-14" y="-12" width="28" height="18" fill="#b0824a" stroke="{INK}" stroke-width="1.2"></rect><path d="M-14 -12 L14 6 M14 -12 L-14 6" stroke="{INK}" stroke-width=".8" opacity=".6"></path></g></g>'
    items.append(crate)
    sailor = (f'<g class="sc-bob" style="animation-delay:-2s;animation-duration:3.2s"><g transform="translate(528 186)">'
              f'<path d="M-9 4 C-9 -2 -5 -6 0 -6 C5 -6 9 -2 9 4 Z" fill="#f2ead8" stroke="{INK}" stroke-width="1"></path>'
              f'<circle cx="0" cy="-12" r="6" fill="#e8c09a" stroke="{INK}" stroke-width="1.1"></circle><path d="M-6 -14 C-6 -20 6 -20 6 -14 Z" fill="#b23a2a" stroke="{INK}" stroke-width=".9"></path>'
              f'<path d="M-2.6 -12 v.2 M2.6 -12 v.2" stroke="{INK}" stroke-width="1.4" stroke-linecap="round"></path><path d="M-2.6 -9 q2.6 2.4 5.2 0" stroke="{INK}" stroke-width="1" fill="none"></path>'
              f'<g class="sc-arm"><path d="M7 -2 C12 -8 14 -16 12 -22" stroke="#e8c09a" stroke-width="3.4" fill="none" stroke-linecap="round"></path><path d="M7 -2 C12 -8 14 -16 12 -22" stroke="{INK}" stroke-width=".7" fill="none"></path></g>'
              f'<path d="M-7 -2 C-12 -1 -16 2 -20 6" stroke="#e8c09a" stroke-width="3.2" fill="none" stroke-linecap="round"></path>'
              f'<text class="sc-note" style="animation-duration:3s" x="10" y="-26" font-family="Alegreya, Georgia, serif" font-weight="700" font-size="10" fill="#8e2b22">йо-хо!</text></g></g>')
    items.append(sailor)
    items.append(ripple(528, 192, 18, '#ffffff', 1.3, 2.8))
    h.append(svg(0, 0, 920, 210, ''.join(items), z=4))
    h.append(svg(0, 0, 920, 210, flapping_gull(760, 40, .8) + flapping_gull(800, 52, .6), z=3, cls='w-gulls', style='animation-duration: 30s'))
    h.append(spk([(260, 196, .3), (640, 202, 1.1), (860, 186, 1.8), (380, 206, .7)]))
    return ('linear-gradient(#58a8d0 0%, #a8d6e4 55%, #f2e2b8 100%)', ''.join(h), 'Ром в волнах: бочонки качаются на волнах, к ним спешит шлюпка', '')


def s_caravan():
    pal = ['#4a92a8', '#1d5a70', '#eef7fa', '#123e50', '#ffffff']
    h = []
    h.append(sun_disc(130, 24, 16, halo=2.4, halo_op=.45))
    h.append(cloud_strip([(200, 20, .7, '#ffffff', '#e8dcc8', '#8a7a64'), (520, 6, .55, '#ffffff', '#e8dcc8', '#8a7a64'), (760, 26, .8, '#ffffff', '#e8dcc8', '#8a7a64')], 0, 90, 80))
    town = ('<path d="M0 50 C30 34 60 24 100 22 C140 20 170 30 200 50 Z" fill="#8aa88a" stroke="#4f6a54" stroke-width="1"></path>'
            + ''.join(f'<rect x="{x}" y="{y}" width="{w}" height="{50-y}" fill="{c}" stroke="#4f4030" stroke-width=".8"></rect><path d="M{x-1} {y} L{x+w/2} {y-6} L{x+w+1} {y} Z" fill="#a8483a" stroke="#4f4030" stroke-width=".8"></path>'
                      for x, y, w, c in [(70, 30, 12, '#f2e6cc'), (86, 34, 10, '#e8d6b0'), (100, 28, 14, '#f4ead6'), (118, 33, 10, '#e2cfa6')])
            + '<rect x="73" y="35" width="3" height="3" fill="#ffd66a"></rect><rect x="104" y="33" width="3" height="3" fill="#ffd66a"></rect>'
            + ''.join(f'<circle class="sc-puff" style="animation-delay:-{i*1.2:.1f}s" cx="{x}" cy="{y}" r="3" fill="#e6e2da"></circle>' for i, (x, y) in enumerate([(108, 20), (108, 20), (76, 22)]))
            + '<path d="M140 30 V12 L150 16 L140 20" fill="#c9a048" stroke="#4f4030" stroke-width=".8"></path>'
            + '<path d="M168 40 V22 H176 V40" fill="#f2ead8" stroke="#4f4030" stroke-width=".8"></path><rect x="168" y="18" width="8" height="5" fill="#ffe58a" stroke="#4f4030" stroke-width=".6"></rect>')
    h.append(svg(720, 102, 200, 50, town, z=0))
    h.append('<div aria-hidden="true" class="sc-beam" style="position: absolute; left: 752px; top: 122px; width: 140px; height: 26px; margin-top: -13px; z-index: 0; transform-origin: 100% 50%; background: linear-gradient(270deg, rgba(255,240,170,.55), rgba(255,240,170,0)); clip-path: polygon(100% 45%, 0 0, 0 100%, 100% 55%)"></div>')
    h.append(sea('back', pal))
    h.append(ship('merchant', 820, 36, cls='w-calm', wl=153, z=1, alt=''))
    h.append(ship('company', 680, 62, cls='w-calm', wl=158, z=1, style='animation-delay: -1s', alt='эскорт Компании'))
    h.append(pennant(727, 106, '#c9a048', 14, z=1, delay=.2))
    h.append(ship('merchant', 500, 96, cls='w-calm', wl=162, style='animation-delay: -3s', alt=''))
    h.append(pennant(574, 82, '#2f4f66', 20, z=2, delay=.1))
    h.append(ship('merchant', 270, 140, cls='w-calm', alt='Торговый караван'))
    # rowboat ferrying goods to the port
    boat = (f'<g class="sc-row"><g transform="translate(640 172)"><path d="M-16 0 H16 L12 6 H-12 Z" fill="#8a5a2e" stroke="{INK}" stroke-width="1"></path><rect x="-10" y="-7" width="8" height="7" fill="#c9a06a" stroke="{INK}" stroke-width=".7"></rect><ellipse cx="4" cy="-3" rx="4" ry="3" fill="#a8743e" stroke="{INK}" stroke-width=".7"></ellipse>'
            f'<circle cx="10" cy="-6" r="2.2" fill="#e8c09a" stroke="{INK}" stroke-width=".6"></circle><path class="sc-oar" d="M10 -2 L18 10" stroke="#5a3a22" stroke-width="1.4"></path></g></g>')
    h.append(svg(0, 0, 920, 210, boat, z=2))
    coins = ''.join(f'<svg class="w-coin" aria-hidden="true" viewBox="0 0 12 12" style="left: {x}px; top: {y}px; z-index: 4; width: 10px; height: 10px; animation-delay: -{d}s"><path d="M6 0 L7 5 L12 6 L7 7 L6 12 L5 7 L0 6 L5 5 Z" fill="#fff4c2"></path></svg>' for x, y, d in [(330, 80, 0), (420, 120, 1.1), (560, 104, 2.0), (720, 120, .6), (380, 60, 1.6), (300, 130, 2.4)])
    h.append(coins)
    h.append(svg(377, 34, 60, 30, '<g class="sc-flag"><path d="M0 6 L44 10 L0 16 Z" fill="#f2c94c" stroke="#7a5a10" stroke-width="1"></path><circle cx="12" cy="11" r="3" fill="#fff4c2" stroke="#7a5a10" stroke-width=".8"></circle></g>', z=3))
    h.append(svg(0, 0, 920, 210, flapping_gull(540, 40, .8) + flapping_gull(570, 30, .6) + flapping_gull(600, 46, .7), z=3, cls='w-gulls', style='animation-duration: 30s'))
    h.append(sea('front', pal))
    h.append(spk([(300, 194, .2), (560, 200, 1.0), (760, 188, 1.7)]))
    return ('linear-gradient(#7ab8d8 0%, #c8e2ee 60%, #f6e8c8 100%)', ''.join(h), 'Торговый караван: купеческие суда идут к порту, шлюпка везёт товар', '')


def s_wet():
    pal = ['#56707a', '#24363e', '#d6e2e6', '#141e24', '#eef4f6']
    h = []
    h.append(cloud_strip([(0, -6, 1.2, '#7a868c', '#5a666c', '#2e383d'), (300, 4, 1.0, '#868f94', '#626d72', '#2e383d'), (560, -10, 1.3, '#7a868c', '#5a666c', '#2e383d'), (810, 0, 1.0, '#868f94', '#626d72', '#2e383d')], 0, 70, 40))
    h.append('<div class="sc-cflash" aria-hidden="true" style="position: absolute; inset: 0; z-index: 0; animation-duration: 7s; background: radial-gradient(40% 70% at 80% 0%, rgba(235,240,245,.55), rgba(235,240,245,0))"></div>')
    h.append('<div class="w-rain" aria-hidden="true" style="position: absolute; inset: 0; z-index: 4; background: repeating-linear-gradient(100deg, rgba(220,232,238,0) 0 7px, rgba(220,232,238,.42) 7px 8px, rgba(220,232,238,0) 8px 14px)"></div>')
    h.append('<div class="w-rain" aria-hidden="true" style="position: absolute; inset: 0; z-index: 4; opacity: .6; animation-duration: .32s; background: repeating-linear-gradient(96deg, rgba(220,232,238,0) 0 13px, rgba(220,232,238,.3) 13px 14px, rgba(220,232,238,0) 14px 26px)"></div>')
    h.append(sea('back', pal))
    h.append(ship('endeavour', 340, 150, cls='w-bob', alt='«Индевор»: волна захлёстывает палубу'))
    # crew scrambling to cover the powder with a tarpaulin
    crew = ''.join(f'<g class="sc-wave-bob" style="animation-duration:.8s;animation-delay:-{i*.4:.1f}s"><g transform="translate({x} 134)"><circle cx="0" cy="-8" r="3" fill="#e8c09a" stroke="{INK}" stroke-width=".8"></circle><path d="M-3 -10 H3 L2 -12 H-2 Z" fill="#2f4f66"></path><path d="M0 -5 V2 M0 -3 L{6*d} -8" stroke="{INK}" stroke-width="1.8" stroke-linecap="round"></path></g></g>' for i, (x, d) in enumerate([(430, 1), (470, -1)]))
    tarp = '<path class="sc-flag" d="M436 126 Q450 118 464 126 L462 134 Q450 128 438 134 Z" fill="#8a8a6a" stroke="#1e140a" stroke-width="1"></path>'
    h.append(svg(0, 0, 920, 210, crew + tarp, z=3))
    over = (f'<path d="M0 60 C10 40 20 30 34 34 C38 18 54 8 66 18 C74 4 94 4 100 20 C112 10 130 16 130 32 C142 30 152 42 150 60 Z" fill="#cfe6ec" stroke="#3a5560" stroke-width="1.6" stroke-linejoin="round" opacity=".95"></path>'
            '<path d="M18 50 C30 44 40 46 48 40 M70 30 C78 26 88 28 94 34 M106 40 C114 36 124 40 128 48" stroke="#ffffff" stroke-width="2" fill="none" stroke-linecap="round"></path>'
            + ''.join(f'<circle cx="{x}" cy="{y}" r="{r}" fill="#e6f4f8"></circle>' for x, y, r in [(20, 26, 3), (60, 2, 2.6), (104, 4, 3), (140, 20, 2.4), (40, 14, 2)]))
    h.append(svg(410, 66, 150, 60, f'<g class="sc-over">{over}</g>', z=3))
    # water streaming off the scuppers
    h.append(svg(0, 0, 920, 210, ''.join(f'<path class="sc-drip" style="animation-delay:-{i*.25:.2f}s;animation-duration:.8s" d="M{x} 146 v8" stroke="#d6e8ee" stroke-width="2" stroke-linecap="round"></path>' for i, x in enumerate([392, 430, 470, 510, 540])), z=3))
    h.append(sea('front', pal))
    kegs = []
    for i, (x, y, s) in enumerate([(640, 184, 1.2), (760, 192, 1.4), (250, 190, 1.3)]):
        k = barrel(x, y, s, 'ПОРОХ', wood='#6a4a32', band='#2e2a26', clip_y=6, uid=f'wk{i}')
        fuse = f'<path d="M{x+4*s:.0f} {y-15*s:.0f} C{x+8*s:.0f} {y-22*s:.0f} {x+16*s:.0f} {y-20*s:.0f} {x+15*s:.0f} {y-12*s:.0f}" stroke="#3a3530" stroke-width="1.6" fill="none" stroke-linecap="round"></path>'
        drops = ''.join(f'<path class="sc-drip" style="animation-delay:-{(i+j)*.5:.1f}s" d="M{x + dx*s:.0f} {y-8*s:.0f} c-1.4 2.6 -1.4 3.6 0 4.2 c1.4 -.6 1.4 -1.6 0 -4.2 Z" fill="#cfe6ee"></path>' for j, dx in enumerate((-12, 12, 15)))
        cls = 'sc-sink' if i == 1 else 'sc-bob'
        kegs.append(f'<g class="{cls}" style="animation-delay:-{i*1.1:.1f}s;animation-duration:{3.4+i*.5 if i != 1 else 6:.1f}s">{k}{fuse}{drops}</g>')
        kegs.append(ripple(x, y + 7 * s, 24 * s, '#eef4f6', i, 3))
    kegs.append(bubbles(760, 196, 6, seed=6, spread=14))
    h.append(svg(0, 0, 920, 210, ''.join(kegs), z=4))
    h.append(svg(0, 0, 920, 210, ''.join(ripple(x, y, 8, '#e6f0f4', (i * .43) % 1.6, 1.6, .7) for i, (x, y) in enumerate([(300, 176), (420, 196), (520, 184), (690, 204), (850, 178), (590, 200), (360, 204), (180, 182), (880, 200)])), z=4))
    return ('linear-gradient(#4a565c 0%, #6f7c82 60%, #929da2 100%)', ''.join(h), 'Сырой порох: ливень, волна над палубой, бочонки пороха тонут', '')


def s_reefs():
    pal = ['#4fc0c0', '#1d8a96', '#f4ffff', '#0f5a66', '#ffffff']
    h = []
    h.append(sun_disc(620, 26, 16, halo=2.4, halo_op=.5))
    h.append(cloud_strip([(60, 30, .6, '#ffffff', '#d4ecee', '#6f9aa4'), (420, 12, .5, '#ffffff', '#d4ecee', '#6f9aa4'), (760, 34, .7, '#ffffff', '#d4ecee', '#6f9aa4')], 0, 80, 90))
    isl = '<path d="M0 40 C20 30 50 24 90 24 C130 24 160 30 180 40 Z" fill="#e8d6a6" stroke="#8a7650" stroke-width="1"></path>' + palm(70, 28, 30, 6) + palm(110, 28, 24, -6)
    h.append(svg(740, 112, 180, 40, isl, z=0))
    h.append(sea('back', pal))
    under = ''.join(f'<ellipse cx="{x}" cy="{y}" rx="{rx}" ry="{rx*.22:.0f}" fill="#0f5a66" opacity=".35"></ellipse>' for x, y, rx in [(300, 168, 70), (520, 158, 50), (700, 176, 80), (860, 162, 40), (420, 196, 60)])
    # coral tufts and a school of fish under the clear water
    under += ''.join(f'<path d="M{x} {y} q-3 -8 0 -12 M{x} {y} q4 -6 6 -9 M{x} {y} q-6 -4 -8 -8" stroke="{c}" stroke-width="2" fill="none" stroke-linecap="round" opacity=".7"></path>' for x, y, c in [(330, 170, '#e07a8a'), (690, 180, '#f0a050'), (510, 162, '#e07a8a')])
    fishes = ''.join(f'<path transform="translate({x} {y})" d="M-5 0 C-2 -2.4 2 -2.4 5 0 C2 2 -2 2 -5 0 Z M5 0 L8 -2.4 V2.4 Z" fill="#0f5a66" opacity=".5"></path>' for x, y in [(560, 166), (572, 170), (552, 172), (566, 176)])
    under += f'<g class="sc-fishsh">{fishes}</g>'
    h.append(svg(0, 0, 920, 210, under, z=1))
    h.append(svg(660, 70, 80, 100, f'<g class="sc-wave-bob" style="animation-duration:5s"><path d="M30 100 L46 4" stroke="#5a3a22" stroke-width="5" stroke-linecap="round"></path><path d="M30 34 L62 40" stroke="#5a3a22" stroke-width="3"></path><path class="sc-flag" d="M38 38 L60 42 L56 64 L48 58 L44 70 L36 60 Z" fill="#e6dcc0" stroke="{INK}" stroke-width="1.2" stroke-linejoin="round"></path><path d="M46 4 L58 8 L46 12" fill="#2a2a2a"></path></g>', z=1))
    h.append(f'<div class="sc-creep" style="position: absolute; inset: 0; z-index: 2">{ship("pearl", 400, 126, cls="w-calm", alt="«Чёрная жемчужина» осторожно идёт среди рифов")}</div>')
    # a leadsman on the bow taking soundings
    h.append(f'<div class="sc-creep" style="position: absolute; inset: 0; z-index: 3">' + svg(408, 124, 1, 1, f'<path d="M0 0 L-8 40" stroke="#5a3a22" stroke-width="1"></path>' + ripple(-8, 42, 6, '#ffffff', 0, 2), z=3) + '</div>')
    rk = (rocks(300, 172, 1.2) + rocks(640, 176, 1.0, flip=True) + rocks(820, 170, .8) + rocks(560, 180, .6))
    gull = f'<g transform="translate(286 120)"><path d="M-6 0 C-6 -8 0 -10 4 -8 C7 -7 7 -3 5 -1 L8 0 Z" fill="#f4f1ea" stroke="{INK}" stroke-width="1"></path><path d="M-3 -3 C0 -4 3 -3 4 -1" stroke="#8a9096" stroke-width="1.8" fill="none"></path><path d="M0 0 V4 M2 0 V4" stroke="#e0a030" stroke-width="1"></path></g>'
    crab = f'<g class="sc-crab"><g transform="translate(624 152)"><ellipse cx="0" cy="0" rx="5" ry="3.4" fill="#d9583a" stroke="{INK}" stroke-width=".9"></ellipse><path d="M-5 0 l-4 -4 M5 0 l4 -4 M-3 2 l-3 3 M3 2 l3 3 M-1 2 l-1 3 M1 2 l1 3" stroke="{INK}" stroke-width=".9"></path><circle cx="-9" cy="-5" r="1.8" fill="#d9583a" stroke="{INK}" stroke-width=".6"></circle><circle cx="9" cy="-5" r="1.8" fill="#d9583a" stroke="{INK}" stroke-width=".6"></circle><path d="M-1.6 -3 v-2 M1.6 -3 v-2" stroke="{INK}" stroke-width=".8"></path></g></g>'
    h.append(svg(0, 0, 920, 210, rk + gull + crab, z=2))
    h.append(sea('front', pal))
    # a shark fin circling between the rocks
    h.append(svg(0, 0, 920, 210, f'<g class="sc-fin"><g transform="translate(860 186)"><path d="M0 0 C2 -8 6 -14 12 -16 C10 -10 10 -4 14 0 Z" fill="#4a5a64" stroke="{INK}" stroke-width="1"></path><path d="M-4 1 q10 -4 22 0" stroke="#ffffff" stroke-width="1.6" fill="none" stroke-linecap="round"></path></g></g>', z=4))
    foam = ''.join(f'<path class="sc-burst" style="animation-delay:-{d:.1f}s" transform="translate({x} {y}) scale({s})" d="M-30 0 C-28 -10 -20 -12 -16 -6 C-14 -18 -2 -22 2 -10 C6 -22 20 -18 18 -6 C24 -12 32 -8 30 0 Z" fill="#ffffff" stroke="#9fdcdc" stroke-width="1"></path>' for x, y, s, d in [(300, 174, 1.3, 0), (640, 178, 1.1, 1.2), (820, 172, .9, 2.2), (560, 182, .7, .6)])
    foam += ''.join(f'<circle class="sc-fly{1+i%3}" style="animation-delay:-{i*.4:.1f}s;animation-duration:2s" cx="{x}" cy="{y}" r="1.6" fill="#ffffff"></circle>' for i, (x, y) in enumerate([(306, 160), (296, 162), (646, 164), (826, 160), (566, 172)]))
    h.append(svg(0, 0, 920, 210, foam, z=4))
    h.append(spk([(250, 198, .2), (470, 204, 1.4), (740, 196, .7), (880, 200, 1.9)]))
    return ('linear-gradient(#69bfe0 0%, #b2e2ee 60%, #e8f4ea 100%)', ''.join(h), 'Рифы: корабль осторожно идёт между камней, вокруг кружит акула', '')


def s_thunder():
    pal = ['#2d2a46', '#0c0b18', '#bcb6d8', '#05040c', '#e8e4ff']
    h = []
    h.append(cloud_strip([(-40, -24, 1.6, '#3a3456', '#26213e', '#0e0b1a'), (240, -10, 1.3, '#433c62', '#2c2646', '#0e0b1a'), (520, -30, 1.8, '#3a3456', '#26213e', '#0e0b1a'), (800, -14, 1.4, '#433c62', '#2c2646', '#0e0b1a')], 0, 90, 60))
    # distant lightning flickering inside the far clouds
    h.append('<div class="sc-cflash" aria-hidden="true" style="position: absolute; inset: 0; z-index: 0; background: radial-gradient(25% 50% at 15% 10%, rgba(210,200,255,.7), rgba(210,200,255,0))"></div>')
    h.append(svg(120, 30, 40, 60, '<path class="sc-cflash" d="M20 0 L10 26 L18 26 L8 60 L28 20 L20 20 L28 0 Z" fill="#e8e0ff"></path>', z=0))
    h.append('<div class="w-flash" aria-hidden="true" style="position: absolute; inset: 0; z-index: 1; background: radial-gradient(60% 90% at 56% 0%, rgba(230,226,255,.9), rgba(230,226,255,0))"></div>')
    h.append(sea('back', pal))
    h.append('<svg class="w-bolt" aria-hidden="true" width="120" height="70" viewBox="0 0 120 70" style="position: absolute; left: 470px; top: -10px; z-index: 3; overflow: visible"><path d="M96 0 L58 30 L74 32 L44 62 L50 48 L36 48 L70 18 L56 18 L82 0 Z" fill="#fff8d0" stroke="#ffe680" stroke-width="2" stroke-linejoin="round"></path><path d="M66 36 L84 40 L80 46 L96 54" fill="none" stroke="#fff8d0" stroke-width="2"></path></svg>')
    h.append(ship('pearl', 400, 150, cls='w-bob', alt='Молния бьёт в мачту «Жемчужины»'))
    sparks = ''.join(f'<path d="M0 0 L{math.cos(a)*16:.1f} {math.sin(a)*16:.1f}" stroke="#ffe680" stroke-width="2" stroke-linecap="round"></path>' for a in [i * math.tau / 10 for i in range(10)])
    falling = ''.join(f'<circle class="sc-fly{1+i%3}" style="animation-delay:-{i*.2:.1f}s;animation-duration:1.4s" cx="{(i%3-1)*4}" cy="0" r="1.4" fill="#ffe680"></circle>' for i in range(6))
    smoke = ''.join(f'<circle class="sc-smoke" style="animation-delay:-{k*.15:.2f}s" cx="{k*4}" cy="{-k*3}" r="{6+k*2}" fill="#5a5470"></circle>' for k in range(3))
    h.append(svg(515, 40, 1, 1, f'<g class="sc-zap"><circle r="10" fill="#fff8d0" opacity=".9"></circle>{sparks}</g>{smoke}<g class="sc-zap">{falling}</g>', z=3))
    elmo = ''.join(f'<circle class="sc-elmo" style="animation-delay:-{i*.5:.1f}s" cx="{x}" cy="{y}" r="5" fill="#9fd8ff" opacity=".8"></circle>' for i, (x, y) in enumerate([(469, 53), (561, 55), (751, 92), (727, 99)]))
    h.append(svg(0, 0, 920, 210, elmo, z=3))
    h.append(ship('dutch', 690, 80, cls='w-bob', wl=160, z=1, style='animation-delay: -1.4s', alt='«Летучий голландец» вдали'))
    h.append('<div class="w-rain" aria-hidden="true" style="position: absolute; inset: 0; z-index: 4; opacity: .8; background: repeating-linear-gradient(108deg, rgba(200,196,235,0) 0 9px, rgba(200,196,235,.34) 9px 10px, rgba(200,196,235,0) 10px 18px)"></div>')
    h.append(sea('front', pal))
    h.append(svg(0, 0, 920, 210, ''.join(ripple(x, y, 8, '#bcb6d8', (i * .5) % 1.6, 1.6, .6) for i, (x, y) in enumerate([(260, 180), (380, 198), (620, 190), (820, 176), (700, 204)])), z=4))
    return ('linear-gradient(#100d22 0%, #2a2346 55%, #46395e 100%)', ''.join(h), 'Гроза: молния бьёт в самую высокую мачту, мачта дымится', '')


def s_fleet():
    pal = ['#5aa0b8', '#22647c', '#eef8fb', '#14485c', '#ffffff']
    h = []
    h.append(cloud_strip([(80, 30, .6, '#ffffff', '#e2e8ea', '#8a9aa2'), (420, 50, .5, '#ffffff', '#e2e8ea', '#8a9aa2'), (860, 20, .55, '#ffffff', '#e2e8ea', '#8a9aa2')], 0, 90, 100))
    h.append(sea('back', pal))
    fl = []
    puffs = []
    for i, (x, hh, k) in enumerate([(420, 22, 'company'), (470, 28, 'endeavour'), (530, 24, 'company'), (590, 32, 'company'), (650, 26, 'endeavour'), (850, 28, 'company'), (890, 22, 'company')]):
        fl.append(ship(k, x, hh, cls='', wl=153, z=1, alt=''))
        if i in (1, 3, 5):
            puffs.append(f'<circle class="sc-msmoke" style="animation-delay:-{i*.9:.1f}s;animation-duration:4s" cx="{x + hh*.4:.0f}" cy="148" r="4" fill="#f4f0e8"></circle>')
    h.append(f'<div class="sc-fleet" aria-hidden="true" style="position: absolute; inset: 0; z-index: 1">{"".join(fl)}' + svg(0, 0, 920, 210, ''.join(puffs), z=1) + '</div>')
    h.append(ship('revenge', 250, 136, cls='w-calm', alt='«Месть» замечает чужой флот'))
    # the lookout's own spyglass glinting in the crow's nest
    h.append(svg(330, 42, 1, 1, '<path class="ia-gleam" d="M0 -7 L1.4 -1.4 L7 0 L1.4 1.4 L0 7 L-1.4 1.4 L-7 0 L-1.4 -1.4 Z" fill="#fffbe6"></path>', z=3))
    inner = (f'<div style="position: absolute; inset: 0; background: linear-gradient(#a8d0e4 0%, #dcecf2 55%, #5aa0b8 55.5%, #22647c 100%)"></div>'
             + ship('company', 2, 50, cls='w-calm', wl=72, z=1, alt='')
             + ship('company', 70, 40, cls='w-calm', wl=70, z=1, style='animation-delay: -2s', alt='')
             + ship('endeavour', 48, 30, cls='w-calm', wl=67, z=0, style='animation-delay: -1s', alt='')
             + '<svg width="128" height="128" style="position: absolute; left: 0; top: 0; z-index: 2" viewBox="0 0 128 128"><path d="M14 82 q6 -3 12 0 t12 0 M70 96 q6 -3 12 0 t12 0" stroke="#ffffff" stroke-width="1.4" fill="none"></path>'
             '<g class="sc-flag"><path d="M40 26 L52 28 L40 31 Z" fill="#c9a048" stroke="#1e140a" stroke-width=".6"></path></g><g class="sc-flag" style="animation-delay:-.2s"><path d="M96 40 L106 42 L96 44 Z" fill="#c9a048" stroke="#1e140a" stroke-width=".6"></path></g>'
             '<path d="M0 64 H128 M64 8 V120" stroke="#1e140a" stroke-width=".6" opacity=".35"></path><path d="M58 64 H70 M64 58 V70" stroke="#1e140a" stroke-width="1" opacity=".5"></path></svg>'
             + '<i class="sc-sweep" style="position: absolute; left: 30px; top: -20px; width: 40px; height: 170px; z-index: 3; background: linear-gradient(90deg, rgba(255,255,255,0), rgba(255,255,255,.45), rgba(255,255,255,0))"></i>')
    h.append(f'<div aria-hidden="true" style="position: absolute; left: 650px; top: 8px; width: 128px; height: 128px; border-radius: 50%; overflow: hidden; z-index: 3; border: 6px solid #c9a048; box-shadow: inset 0 0 0 2px #8a6420, inset 0 0 18px rgba(0,0,0,.45), 0 0 0 2px #5c4615, 0 4px 10px rgba(0,0,0,.35)">{inner}</div>')
    h.append(svg(760, 100, 120, 60, '<path d="M0 6 L80 34 L74 48 L-6 20 Z" fill="#b48a34" stroke="#5c4615" stroke-width="1.6"></path><path d="M30 17 L26 29 M56 26 L52 38" stroke="#5c4615" stroke-width="2"></path><path d="M2 8 L78 36" stroke="#fff3c4" stroke-width="1.4" opacity=".6"></path>', z=2))
    h.append(svg(0, 0, 920, 210, flapping_gull(470, 60, .7) + flapping_gull(500, 70, .5), z=3, cls='w-gulls', style='animation-duration: 28s'))
    h.append(sea('front', pal))
    h.append(spk([(200, 196, .3), (480, 188, 1.2), (620, 202, .8)]))
    return ('linear-gradient(#8cc4e0 0%, #cfe6ee 60%, #f4ecd8 100%)', ''.join(h), 'Флот на горизонте: в подзорную трубу видны чужие паруса, флот даёт сигнальные залпы', '')


def s_moon():
    pal = ['#1f3450', '#08111e', '#c8d8ec', '#03070e', '#eef4ff']
    h = []
    h.append(stars(80, 11, 140, color='#f4eccc'))
    h.append(svg(300, 20, 1, 1, '<g class="sc-shoot" style="animation-duration:11s"><path d="M0 0 L46 -16" stroke="#f4eccc" stroke-width="1.6" stroke-linecap="round" opacity=".7"></path><circle r="2" fill="#fffbe6"></circle></g>', z=0))
    h.append('<div aria-hidden="true" style="position: absolute; left: 0; top: -40px; width: 920px; height: 120px; z-index: 0; background: linear-gradient(170deg, rgba(200,210,255,0) 30%, rgba(200,210,255,.12) 45%, rgba(200,210,255,0) 60%)"></div>')
    h.append('<div aria-hidden="true" class="sc-halo" style="position: absolute; left: 540px; top: -44px; width: 200px; height: 200px; border-radius: 50%; background: radial-gradient(circle, rgba(246,239,208,.45), rgba(246,239,208,0) 65%); z-index: 0"></div>')
    moon = ('<circle cx="40" cy="40" r="38" fill="#f6efd0" stroke="#c9bd8a" stroke-width="1.4"></circle>'
            '<circle cx="28" cy="30" r="7" fill="#e2d6a6"></circle><circle cx="52" cy="46" r="9" fill="#e2d6a6"></circle><circle cx="34" cy="58" r="4" fill="#e2d6a6"></circle><circle cx="56" cy="24" r="3.4" fill="#e2d6a6"></circle>'
            '<path d="M14 26 A30 30 0 0 1 36 8" stroke="#fffbe6" stroke-width="3" fill="none" stroke-linecap="round" opacity=".8"></path>')
    h.append(svg(600, 16, 80, 80, moon, z=0))
    # bats crossing the moon
    bat = '<path d="M0 0 Q-4 -4 -8 -2 Q-6 0 -8 2 Q-4 0 0 2 Q4 0 8 2 Q6 0 8 -2 Q4 -4 0 0 Z" fill="#0a0f1a"></path>'
    h.append(svg(0, 0, 920, 210, f'<g transform="translate(700 50)"><g class="sc-wing" style="animation-duration:.25s">{bat}</g></g><g transform="translate(724 40) scale(.7)"><g class="sc-wing" style="animation-duration:.22s">{bat}</g></g>', z=0, cls='w-gulls', style='animation-duration: 16s'))
    h.append(cloud_strip([(120, 40, .7, '#2c3c5a', '#1e2c48', '#0a1222'), (600, 48, .6, '#33466a', '#22314e', '#0a1222')], 0, 90, 50, op=.85))
    h.append(sea('back', pal))
    h.append(svg(0, 0, 920, 210, ''.join(f'<circle class="sc-wisp" style="animation-delay:-{i*1.2:.1f}s" cx="{x}" cy="{y}" r="3" fill="#8fffd0"></circle>' for i, (x, y) in enumerate([(300, 120), (330, 96), (590, 130), (820, 120), (860, 140), (240, 138)])), z=1))
    h.append(ship('dutch', 330, 150, cls='w-calm', alt='«Летучий голландец» в лунном свете'))
    # the cursed crew shows itself in the moonlight: skeletal silhouettes fade in and out on deck
    crew = ''.join(f'<g class="sc-ghost" style="animation-delay:-{i*1.4:.1f}s"><g transform="translate({x} 124)"><circle cx="0" cy="-10" r="3.4" fill="#cfffe6"></circle><path d="M-1.4 -10.6 h.8 M.8 -10.6 h.8" stroke="#0a1a14" stroke-width="1"></path><path d="M0 -6 V3 M-4 -3 H4 M-3 0 H3 M0 3 L-3 9 M0 3 L3 9" stroke="#cfffe6" stroke-width="1.4" stroke-linecap="round"></path></g></g>' for i, x in enumerate([392, 430, 500, 530]))
    lan = ''.join(f'<circle class="sc-elmo" style="animation-delay:-{i*.6:.1f}s" cx="{x}" cy="{y}" r="4" fill="#7fffc4" opacity=".85"></circle>' for i, (x, y) in enumerate([(340, 126), (552, 118), (446, 60)]))
    h.append(svg(0, 0, 920, 210, crew + lan, z=3))
    h.append(sea('front', pal))
    h.append(''.join(f'<span class="w-fog" aria-hidden="true" style="left: {x}px; top: {y}px; width: {w}px; height: 40px; z-index: 4; opacity: .28; animation-delay: -{d}s; animation-duration: {dur}s"></span>' for x, y, w, d, dur in [(-60, 160, 380, 0, 22), (420, 168, 420, 6, 26), (700, 156, 300, 12, 20)]))
    road = ''.join(f'<path class="sc-shim" style="animation-delay:-{i*.27:.2f}s" d="M{640-L/2:.0f} {y} h{L}" stroke="#f6efd0" stroke-width="{1.6 + i*.15:.2f}" stroke-linecap="round"></path>' for i, (y, L) in enumerate([(153, 14), (157, 22), (162, 18), (167, 30), (173, 26), (180, 40), (188, 34), (197, 52), (206, 44)]))
    h.append(svg(0, 0, 920, 210, road, z=4))
    return ('linear-gradient(#050b18 0%, #13223c 55%, #28405e 100%)', ''.join(h), 'Лунный свет: на палубе «Летучего голландца» проступает проклятая команда', '')


def s_current():
    pal = ['#3d8aa0', '#155470', '#e8f5f9', '#0c3a4e', '#ffffff']
    h = []
    h.append(cloud_strip([(40, 20, .8, '#ffffff', '#d8e2e6', '#7a8e98'), (330, 34, .6, '#f4f8fa', '#d8e2e6', '#7a8e98'), (600, 10, .9, '#ffffff', '#d8e2e6', '#7a8e98'), (840, 36, .6, '#f4f8fa', '#d8e2e6', '#7a8e98')], 0, 90, 60))
    h.append(sea('back', pal))
    bandR = ''.join(f'<path d="M{x} {y} h{L}" stroke="#ffffff" stroke-width="1.6" stroke-linecap="round" opacity=".6"></path>' for x0 in range(-120, 1040, 120) for x, y, L in [(x0, 154, 40), (x0 + 60, 158, 26), (x0 + 30, 162, 34)])
    h.append(f'<svg aria-hidden="true" width="1160" height="210" viewBox="-120 0 1160 210" class="sc-flowR" style="position: absolute; left: -120px; top: 0; z-index: 1">{bandR}<path d="M-120 158 H1040" stroke="#7fc4d8" stroke-width="10" opacity=".2"></path></svg>')
    # driftwood and a barrel riding the far current to the right
    h.append(svg(0, 0, 920, 210, f'<g class="sc-driftR"><rect x="0" y="154" width="22" height="4" rx="2" fill="#a8703a" stroke="{INK}" stroke-width=".8"></rect></g><g class="sc-driftR" style="animation-delay:-8s"><ellipse cx="0" cy="155" rx="5" ry="4" fill="#8a5a2e" stroke="{INK}" stroke-width=".8"></ellipse></g>', z=1))
    h.append(f'<div class="sc-ferryR" style="position: absolute; inset: 0; z-index: 2">{ship("pearl", 300, 112, cls="w-calm", wl=162, flip=True, z=2, alt="«Чёрная жемчужина» несёт течением")}</div>')
    h.append(f'<div class="sc-ferryL" style="position: absolute; inset: 0; z-index: 2">{ship("revenge", 560, 124, cls="w-calm", wl=170, z=2, style="animation-delay: -2s", alt="«Месть» несёт навстречу")}</div>')
    h.append(sea('front', pal))
    bandL = ''.join(f'<path d="M{x} {y} h{L}" stroke="#ffffff" stroke-width="2" stroke-linecap="round" opacity=".7"></path>' for x0 in range(0, 1160, 120) for x, y, L in [(x0, 184, 50), (x0 + 70, 192, 30), (x0 + 30, 200, 44)])
    chev = ''.join(f'<path d="M{x0+20} 178 l-12 10 l12 10" stroke="#ffffff" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round" opacity=".55"></path>' for x0 in range(0, 1160, 240))
    h.append(f'<svg aria-hidden="true" width="1160" height="210" viewBox="0 0 1160 210" class="sc-flowL" style="position: absolute; left: 0; top: 0; z-index: 4">{bandL}{chev}</svg>')
    # seaweed and a crate riding the near current to the left
    h.append(svg(0, 0, 920, 210, f'<g class="sc-driftL" style="animation-delay:-3s"><g transform="translate(900 190)"><path d="M0 0 q6 -6 12 0 t12 0 M4 4 q6 -5 12 0" stroke="#4f8a44" stroke-width="2.4" fill="none" stroke-linecap="round"></path></g></g><g class="sc-driftL" style="animation-delay:-9s"><g transform="translate(900 186) rotate(12)"><rect x="-8" y="-7" width="16" height="12" fill="#b0824a" stroke="{INK}" stroke-width="1"></rect></g></g>', z=4))
    ed = ''.join(f'<g class="sc-eddy" style="animation-delay:-{i:.0f}s"><path transform="translate({x} {y}) scale(1 .35)" d="M0 0 C6 -2 8 -8 2 -10 C-6 -12 -12 -4 -10 4 C-8 12 6 14 14 8 C22 2 20 -12 10 -18" fill="none" stroke="#ffffff" stroke-width="2" stroke-linecap="round" opacity=".7"></path></g>' for i, (x, y) in enumerate([(240, 178), (500, 172), (770, 180), (380, 196)]))
    h.append(svg(0, 0, 920, 210, ed, z=4))
    return ('linear-gradient(#7fa8b8 0%, #b8d0d8 60%, #dfe8e4 100%)', ''.join(h), 'Течение: корабли каждой команды меняются местами', '')


SCENES = {
    'calm': s_calm, 'wind': s_wind, 'wave': s_wave, 'maelstrom': s_maelstrom, 'clear': s_clear,
    'mermaids': s_mermaids, 'rum': s_rum, 'caravan': s_caravan, 'wet': s_wet, 'reefs': s_reefs,
    'thunder': s_thunder, 'fleet': s_fleet, 'moon': s_moon, 'current': s_current,
}
