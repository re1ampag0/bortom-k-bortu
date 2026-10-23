import math, random, re
from common import ship, sea, spk, GULLS

CSS = r'''
.sc-cl{animation:sc-cl 90s linear infinite}@keyframes sc-cl{to{transform:translateX(-920px)}}
.sc-tw{animation:sc-tw 2.8s ease-in-out infinite}@keyframes sc-tw{0%,100%{opacity:.15}50%{opacity:1}}
.sc-glint{animation:sc-glint 2.6s ease-in-out infinite}@keyframes sc-glint{0%,100%{opacity:.05}50%{opacity:.95}}
.sc-still{transform-origin:50% 91%;animation:sc-still 11s ease-in-out infinite}@keyframes sc-still{0%,100%{transform:translateY(0) rotate(-.25deg)}50%{transform:translateY(1px) rotate(.25deg)}}
.sc-heel{transform-origin:50% 91%;animation:sc-heel 4.6s ease-in-out infinite}@keyframes sc-heel{0%,100%{transform:translateY(0) rotate(-4.5deg)}50%{transform:translateY(3px) rotate(-2deg)}}
.sc-pitch{transform-origin:50% 91%;animation:sc-pitch 5s ease-in-out infinite}@keyframes sc-pitch{0%,100%{transform:translate(0,0) rotate(-13deg)}50%{transform:translate(-8px,-10px) rotate(-6deg)}}
.sc-inward{transform-origin:50% 91%;animation:sc-inward 6s ease-in-out infinite}@keyframes sc-inward{0%,100%{transform:translate(0,0) rotate(7deg)}50%{transform:translate(26px,4px) rotate(10deg)}}
.sc-inward2{transform-origin:50% 91%;animation:sc-inward2 6s ease-in-out infinite}@keyframes sc-inward2{0%,100%{transform:translate(0,0) rotate(-6deg)}50%{transform:translate(-18px,3px) rotate(-9deg)}}
.sc-gust{animation:sc-gust 3.4s ease-in-out infinite;opacity:0}@keyframes sc-gust{0%{opacity:0;transform:translateX(70px)}30%{opacity:.9}100%{opacity:0;transform:translateX(-150px)}}
.sc-wake{animation:sc-wake 2.4s linear infinite}@keyframes sc-wake{0%{opacity:0;transform:translateX(0)}20%{opacity:.85}100%{opacity:0;transform:translateX(60px)}}
.sc-swell{transform-origin:50% 100%;animation:sc-swell 5s ease-in-out infinite}@keyframes sc-swell{0%,100%{transform:translateY(8px) scale(.97,.94)}50%{transform:translateY(-4px) scale(1.02,1.04)}}
.sc-flick{animation:sc-flick .9s steps(3) infinite alternate}@keyframes sc-flick{from{opacity:.55}to{opacity:1}}
.sc-fly1,.sc-fly2,.sc-fly3{animation:sc-fly1 2.2s ease-out infinite;opacity:0}
.sc-fly2{animation-name:sc-fly2}.sc-fly3{animation-name:sc-fly3}
@keyframes sc-fly1{0%{opacity:0;transform:translate(0,0)}15%{opacity:1}100%{opacity:0;transform:translate(-40px,-30px)}}
@keyframes sc-fly2{0%{opacity:0;transform:translate(0,0)}15%{opacity:1}100%{opacity:0;transform:translate(-60px,-10px)}}
@keyframes sc-fly3{0%{opacity:0;transform:translate(0,0)}15%{opacity:1}100%{opacity:0;transform:translate(-20px,-44px)}}
.sc-spin{animation:sc-spin 9s linear infinite}@keyframes sc-spin{to{transform:rotate(-360deg)}}
.sc-spin-slow{animation:sc-spin 26s linear infinite}
.sc-rays{transform-box:fill-box;transform-origin:50% 50%;animation:sc-rays 40s linear infinite}@keyframes sc-rays{to{transform:rotate(360deg)}}
.sc-halo{transform-box:fill-box;transform-origin:50% 50%;animation:sc-halo 4s ease-in-out infinite}@keyframes sc-halo{0%,100%{opacity:.45;transform:scale(1)}50%{opacity:.8;transform:scale(1.08)}}
.sc-bob{transform-box:fill-box;transform-origin:50% 80%;animation:sc-bob 3.4s ease-in-out infinite}@keyframes sc-bob{0%,100%{transform:translateY(0) rotate(-7deg)}50%{transform:translateY(3px) rotate(7deg)}}
.sc-ring{transform-box:fill-box;transform-origin:50% 50%;animation:sc-ring 3s ease-out infinite}@keyframes sc-ring{0%{opacity:.9;transform:scale(.3)}100%{opacity:0;transform:scale(1.7)}}
.sc-note{animation:sc-note 4s ease-out infinite;opacity:0}@keyframes sc-note{0%{opacity:0;transform:translate(0,6px)}20%{opacity:1}100%{opacity:0;transform:translate(26px,-48px) rotate(14deg)}}
.sc-tail{transform-origin:50% 100%;animation:sc-tail 6s ease-in-out infinite}@keyframes sc-tail{0%,12%{transform:translateY(46px) rotate(-10deg)}35%{transform:translateY(0) rotate(4deg)}55%{transform:translateY(-2px) rotate(-6deg)}78%,100%{transform:translateY(48px) rotate(12deg)}}
.sc-jump{animation:sc-jump 6s ease-in infinite;opacity:0}@keyframes sc-jump{0%,40%{opacity:0;transform:translate(0,0) rotate(0)}42%{opacity:1}60%{transform:translate(26px,-16px) rotate(140deg)}78%{opacity:1;transform:translate(48px,40px) rotate(220deg)}80%,100%{opacity:0;transform:translate(48px,44px) rotate(220deg)}}
.sc-plop{transform-box:fill-box;transform-origin:50% 50%;animation:sc-plop 6s ease-out infinite;opacity:0}@keyframes sc-plop{0%,78%{opacity:0;transform:scale(.2)}80%{opacity:1;transform:scale(.4)}100%{opacity:0;transform:scale(1.8)}}
.sc-over{transform-box:fill-box;transform-origin:50% 100%;animation:sc-over 4.2s ease-out infinite;opacity:0}@keyframes sc-over{0%,40%{opacity:0;transform:translateY(16px) scale(.5,.3)}52%{opacity:1;transform:translateY(0) scale(1,1)}72%{opacity:.7;transform:translateY(-6px) scale(1.15,1.1)}90%,100%{opacity:0;transform:translateY(8px) scale(1.2,.8)}}
.sc-drip{animation:sc-drip 1.8s ease-in infinite;opacity:0}@keyframes sc-drip{0%{opacity:0;transform:translateY(0)}20%{opacity:1}100%{opacity:0;transform:translateY(12px)}}
.sc-burst{transform-box:fill-box;transform-origin:50% 100%;animation:sc-burst 3.6s ease-out infinite;opacity:0}@keyframes sc-burst{0%,55%{opacity:0;transform:scale(.4,.15)}64%{opacity:1;transform:scale(1,1)}82%{opacity:.5;transform:scale(1.2,1.25)}100%{opacity:0;transform:scale(1.3,.9)}}
.sc-zap{transform-box:fill-box;transform-origin:50% 50%;animation:sc-zap 6s linear infinite;opacity:0}@keyframes sc-zap{0%,84%{opacity:0;transform:scale(.3)}85.5%{opacity:1;transform:scale(1.25)}93%{opacity:.4;transform:scale(1.6)}96%,100%{opacity:0;transform:scale(1.7)}}
.sc-elmo{transform-box:fill-box;transform-origin:50% 50%;animation:sc-elmo 1.6s ease-in-out infinite alternate}@keyframes sc-elmo{from{opacity:.4;transform:scale(.8)}to{opacity:1;transform:scale(1.15)}}
.sc-fleet{animation:sc-fleet 24s ease-in-out infinite alternate}@keyframes sc-fleet{to{transform:translateX(-26px)}}
.sc-shim{transform-box:fill-box;transform-origin:50% 50%;animation:sc-shim 2.2s ease-in-out infinite}@keyframes sc-shim{0%,100%{opacity:.25;transform:scaleX(.7)}50%{opacity:1;transform:scaleX(1.15)}}
.sc-flowR{animation:sc-flowR 4s linear infinite}@keyframes sc-flowR{from{transform:translateX(-120px)}to{transform:translateX(0)}}
.sc-flowL{animation:sc-flowL 3s linear infinite}@keyframes sc-flowL{to{transform:translateX(-120px)}}
.sc-ferryR{animation:sc-ferryR 14s ease-in-out infinite}@keyframes sc-ferryR{0%,8%{transform:translateX(0)}46%,58%{transform:translateX(230px)}96%,100%{transform:translateX(0)}}
.sc-ferryL{animation:sc-ferryL 14s ease-in-out infinite}@keyframes sc-ferryL{0%,8%{transform:translateX(0)}46%,58%{transform:translateX(-230px)}96%,100%{transform:translateX(0)}}
.sc-eddy{transform-box:fill-box;transform-origin:50% 50%;animation:sc-rays 5s linear infinite reverse}
.sc-wisp{animation:sc-wisp 5s ease-in-out infinite}@keyframes sc-wisp{0%,100%{opacity:.15;transform:translate(0,0)}50%{opacity:.95;transform:translate(6px,-10px)}}
.sc-sweep{animation:sc-sweep 5s ease-in-out infinite}@keyframes sc-sweep{0%,55%{transform:translateX(-140px) skewX(-20deg)}85%,100%{transform:translateX(140px) skewX(-20deg)}}
.sc-heat{animation:sc-heat 5s ease-in-out infinite}@keyframes sc-heat{0%,100%{opacity:.08;transform:translateX(0)}50%{opacity:.4;transform:translateX(10px)}}
.sc-wave-bob{transform-origin:50% 100%;animation:sc-wave-bob 3.6s ease-in-out infinite}@keyframes sc-wave-bob{0%,100%{transform:translateY(0) rotate(-3deg)}50%{transform:translateY(4px) rotate(3deg)}}
@media (prefers-reduced-motion: reduce){[class*="sc-"]{animation:none !important;opacity:1 !important}}
'''

INK = '#1e140a'


def cloud_path():
    return ('M12 38 C3 38 0 30 6 25 C2 17 10 9 20 12 C22 3 36 -1 45 6 C51 -1 66 0 70 10 C78 6 90 10 90 19 C98 20 101 30 94 35 C92 37 90 38 86 38 Z',
            'M6 30 C20 37 70 37 96 31 C95 35 91 38 86 38 H12 C8 38 6 35 6 30 Z',
            'M22 14 C26 8 34 6 40 9 M52 6 C58 3 64 5 67 9')


def cloud(x, y, s, fill, shade, ink, hi='#ffffff', op=1, flip=False):
    a, b, c = cloud_path()
    sx = -s if flip else s
    return (f'<g transform="translate({x:.0f} {y:.0f}) scale({sx:.2f} {s:.2f})" opacity="{op}">'
            f'<path d="{a}" fill="{fill}" stroke="{ink}" stroke-width="{1.6/s:.2f}" stroke-linejoin="round"></path>'
            f'<path d="{b}" fill="{shade}"></path>'
            f'<path d="{c}" fill="none" stroke="{hi}" stroke-width="{2/s:.2f}" stroke-linecap="round" opacity=".7"></path></g>')


def cloud_strip(specs, top, height, dur, z=0, op=1, cls='sc-cl'):
    """specs: list of (x, y, scale, fill, shade, ink); drawn twice for a seamless loop"""
    g = ''.join(cloud(x + dx, y, s, f, sh, ink) for dx in (0, 920) for (x, y, s, f, sh, ink) in specs)
    return (f'<svg aria-hidden="true" width="1840" height="{height}" viewBox="0 0 1840 {height}" class="{cls}" '
            f'style="position: absolute; left: 0; top: {top}px; z-index: {z}; opacity: {op}; animation-duration: {dur}s; overflow: visible">{g}</svg>')


def svg(x, y, w, h, inner, z=1, cls='', style='', vb=None):
    vb = vb or f'0 0 {w} {h}'
    c = f' class="{cls}"' if cls else ''
    return f'<svg aria-hidden="true"{c} width="{w}" height="{h}" viewBox="{vb}" style="position: absolute; left: {x}px; top: {y}px; z-index: {z}; overflow: visible; {style}">{inner}</svg>'


def gulls(left, top, dur=30, z=3):
    g = re.sub(r'left: \d+px; top: \d+px', f'left: {left}px; top: {top}px', GULLS)
    g = g.replace('z-index: 3', f'z-index: {z}')
    return g.replace('class="w-gulls"', f'class="w-gulls" data-d="{dur}"').replace('aria-hidden="true" style="', f'aria-hidden="true" style="animation-duration: {dur}s; ', 1)


def stars(n, seed, ymax, xs=(0, 920), r=(0.6, 1.6), color='#fff8dc'):
    R = random.Random(seed)
    o = []
    for i in range(n):
        x, y, rr = R.uniform(*xs), R.uniform(4, ymax), R.uniform(*r)
        d = R.uniform(0, 3)
        dur = R.uniform(2, 4)
        if rr > 1.3 and i % 3 == 0:
            o.append(f'<path class="sc-tw" style="animation-delay:-{d:.1f}s;animation-duration:{dur:.1f}s" d="M{x:.1f} {y-rr*2.4:.1f} L{x+rr*.5:.1f} {y-rr*.5:.1f} L{x+rr*2.4:.1f} {y:.1f} L{x+rr*.5:.1f} {y+rr*.5:.1f} L{x:.1f} {y+rr*2.4:.1f} L{x-rr*.5:.1f} {y+rr*.5:.1f} L{x-rr*2.4:.1f} {y:.1f} L{x-rr*.5:.1f} {y-rr*.5:.1f} Z" fill="{color}"></path>')
        else:
            o.append(f'<circle class="sc-tw" style="animation-delay:-{d:.1f}s;animation-duration:{dur:.1f}s" cx="{x:.1f}" cy="{y:.1f}" r="{rr:.1f}" fill="{color}"></circle>')
    return svg(0, 0, 920, 210, ''.join(o), z=0)


def barrel(x, y, s, label='РОМ', wood='#8a5a2e', band='#3a3530', clip_y=None, uid='b'):
    """barrel lying sideways-ish, upright, centre at (x,y); clipped at the waterline clip_y (local)"""
    cp = ''
    clip = ''
    if clip_y is not None:
        cp = f'<clipPath id="{uid}"><rect x="-30" y="-40" width="60" height="{40+clip_y}"></rect></clipPath>'
        clip = f' clip-path="url(#{uid})"'
    fs = 7 if len(label) <= 3 else 5
    txt = f'<text x="0" y="3" text-anchor="middle" font-family="Old Standard TT, Georgia, serif" font-weight="700" font-size="{fs}" fill="#f2e2b8" letter-spacing=".5">{label}</text>' if label else ''
    return (f'<g transform="translate({x} {y}) scale({s})"><defs>{cp}</defs><g{clip}>'
            f'<path d="M-11 -14 C-14 -6 -14 6 -11 14 C-4 16.5 4 16.5 11 14 C14 6 14 -6 11 -14 C4 -16.5 -4 -16.5 -11 -14 Z" fill="{wood}" stroke="{INK}" stroke-width="1.2"></path>'
            f'<path d="M-11 -14 C-14 -6 -14 6 -11 14 C-9.6 14.5 -8.2 14.8 -6.8 15 C-9 6 -9 -6 -6.8 -15 C-8.2 -14.8 -9.6 -14.5 -11 -14 Z" fill="#fff" opacity=".18"></path>'
            f'<path d="M-6 -15.6 C-7.4 -6 -7.4 6 -6 15.6 M0 -16 V16 M6 -15.6 C7.4 -6 7.4 6 6 15.6" stroke="{INK}" stroke-width=".6" opacity=".45" fill="none"></path>'
            f'<path d="M-12.6 -8 C-4 -6.4 4 -6.4 12.6 -8 M-12.6 8 C-4 9.6 4 9.6 12.6 8" stroke="{band}" stroke-width="2.4" fill="none"></path>'
            f'<ellipse cx="0" cy="-14.6" rx="11" ry="2.6" fill="#6a4424" stroke="{INK}" stroke-width="1"></ellipse>'
            f'{txt}</g></g>')


def ripple(x, y, rx, color='#ffffff', delay=0, dur=3, op=.8):
    return f'<ellipse class="sc-ring" style="animation-delay:-{delay:.1f}s;animation-duration:{dur}s" cx="{x}" cy="{y}" rx="{rx}" ry="{rx*.28:.1f}" fill="none" stroke="{color}" stroke-width="1.2" opacity="{op}"></ellipse>'


def sun_disc(x, y, r, core=None, mid=None, glow=None, halo=2.6, halo_op=.5, uid=None, z=0):
    """a painterly, light-like sun: a white-hot disc that melts into its glow (no outline), a fan of fine light rays of
    uneven length slowly turning, a few long thin diffraction spikes that breathe, a faint horizontal flare"""
    uid = uid or f'sun{int(x)}{int(y)}'
    S = r * 4
    R = random.Random(int(x * 13 + y))
    fine = []
    for i in range(28):
        a = i / 28 * math.tau + R.uniform(-.05, .05)
        L = r * R.uniform(1.7, 3.1)
        wd = R.uniform(.025, .05)
        op = R.uniform(.18, .42)
        fine.append(f'<path d="M{math.cos(a-wd)*r*.95:.1f} {math.sin(a-wd)*r*.95:.1f} L{math.cos(a)*L:.1f} {math.sin(a)*L:.1f} L{math.cos(a+wd)*r*.95:.1f} {math.sin(a+wd)*r*.95:.1f} Z" opacity="{op:.2f}"></path>')
    spikes = []
    for k in range(8):
        a = k / 8 * math.tau + math.pi / 8
        L = r * (3.6 if k % 2 == 0 else 2.4)
        w = r * .07
        px, py = -math.sin(a) * w, math.cos(a) * w
        spikes.append(f'<path d="M{px:.1f} {py:.1f} L{math.cos(a)*L:.1f} {math.sin(a)*L:.1f} L{-px:.1f} {-py:.1f} Z"></path>')
    return (f'<svg aria-hidden="true" width="{2*S:.0f}" height="{2*S:.0f}" viewBox="{-S:.0f} {-S:.0f} {2*S:.0f} {2*S:.0f}" style="position: absolute; left: {x-S:.0f}px; top: {y-S:.0f}px; z-index: {z}; overflow: visible; pointer-events: none">'
            f'<defs><radialGradient id="{uid}h"><stop offset="0" stop-color="#fffbe8" stop-opacity="{min(1, halo_op*1.3):.2f}"></stop><stop offset=".25" stop-color="#fff0c0" stop-opacity="{halo_op*.6:.2f}"></stop><stop offset="1" stop-color="#ffe6b0" stop-opacity="0"></stop></radialGradient>'
            f'<radialGradient id="{uid}f" gradientUnits="userSpaceOnUse" cx="0" cy="0" r="{r*3.6:.1f}"><stop offset=".2" stop-color="#fffef4"></stop><stop offset=".5" stop-color="#fff2c0" stop-opacity=".6"></stop><stop offset="1" stop-color="#ffe9a8" stop-opacity="0"></stop></radialGradient>'
            f'<radialGradient id="{uid}d"><stop offset="0" stop-color="#ffffff"></stop><stop offset=".6" stop-color="#fffbe0"></stop><stop offset=".86" stop-color="#fff0a8"></stop><stop offset="1" stop-color="#ffe890" stop-opacity="0"></stop></radialGradient>'
            f'<radialGradient id="{uid}g"><stop offset="0" stop-color="#fffbe6" stop-opacity=".95"></stop><stop offset="1" stop-color="#fff0b8" stop-opacity="0"></stop></radialGradient></defs>'
            f'<circle class="sc-halo" r="{r*3.8:.1f}" fill="url(#{uid}h)"></circle>'
            f'<ellipse rx="{r*4:.1f}" ry="{r*.1:.1f}" fill="url(#{uid}f)" opacity=".55"></ellipse>'
            f'<g class="sc-rays" style="animation-duration:120s" fill="url(#{uid}f)">{"".join(fine)}</g>'
            f'<g class="sc-halo" style="animation-duration:5s" fill="url(#{uid}f)" opacity=".8">{"".join(spikes)}</g>'
            f'<circle r="{r*1.9:.1f}" fill="url(#{uid}g)"></circle>'
            f'<circle r="{r*1.08:.1f}" fill="url(#{uid}d)"></circle>'
            f'</svg>')

def rocks(x, y, s, fill='#5c5650', light='#8a8278', dark='#3a352f', flip=False):
    sx = -s if flip else s
    return (f'<g transform="translate({x} {y}) scale({sx} {s})">'
            f'<path d="M-40 0 L-30 -22 L-22 -16 L-12 -40 L-2 -26 L6 -34 L18 -10 L26 -18 L40 0 Z" fill="{fill}" stroke="{INK}" stroke-width="1.6" stroke-linejoin="round"></path>'
            f'<path d="M-12 -40 L-8 -22 L-2 -26 M-30 -22 L-26 -8 M6 -34 L8 -16 L18 -10" fill="none" stroke="{light}" stroke-width="1.4"></path>'
            f'<path d="M-2 -26 L6 -34 L18 -10 L26 -18 L40 0 H8 C10 -10 6 -18 -2 -26 Z" fill="{dark}" opacity=".55"></path></g>')


def palm(x, y, h, lean=8, trunk='#5a3a1c', leaf='#3f7a3a', leaf2='#4f8a44'):
    tx, ty = x + lean, y - h
    fr = ''.join(f'<path d="M{tx} {ty} q{dx*.5:.1f} {-8+dy*.3:.1f} {dx} {dy}" stroke="{leaf if i % 2 else leaf2}" stroke-width="3.4" fill="none" stroke-linecap="round"></path>'
                 for i, (dx, dy) in enumerate([(-20, 6), (-14, 12), (18, 6), (14, 12), (-4, 14), (6, -6)]))
    return f'<path d="M{x} {y} Q{x+lean*.2} {y-h*.6} {tx} {ty}" stroke="{trunk}" stroke-width="3.2" fill="none" stroke-linecap="round"></path>{fr}'


