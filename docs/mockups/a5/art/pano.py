"""Victory panorama: the winners under sail in the low sun, the losers burning and going down by the sun path."""
import json, os, re, random
H = os.path.dirname(os.path.abspath(__file__))
SH = json.load(open(os.path.join(H, 'ships3.json')))
_n = [0]
def uniq(svg, tag):
    _n[0] += 1; sfx = f'{tag}{_n[0]}'
    svg = re.sub(r'id="([^"]+)"', lambda m: f'id="{m.group(1)}_{sfx}"', svg)
    return re.sub(r'url\(#([^)]+)\)', lambda m: f'url(#{m.group(1)}_{sfx})', svg)

def ship(kind, x, y, s, rot=0, extra=''):
    return f'<g transform="translate({x} {y}) rotate({rot}) scale({s})" {extra}><g transform="translate(-60 -71)">{uniq(SH[kind], "p")}</g></g>'

def cloud(x, y, w, p):
    """A soft cumulus: lit top, warm underside."""
    k = w / 100
    blobs = [(0, 0, 22, 9), (20, -7, 20, 11), (42, -4, 22, 10), (62, 1, 18, 8), (-18, 3, 14, 6)]
    body = ''.join(f'<ellipse cx="{x+a*k:.1f}" cy="{y+b*k:.1f}" rx="{rx*k:.1f}" ry="{ry*k:.1f}"/>' for a, b, rx, ry in blobs)
    under = f'<ellipse cx="{x+24*k:.1f}" cy="{y+6*k:.1f}" rx="{46*k:.1f}" ry="{4.5*k:.1f}" fill="{p}rose)" opacity=".55"/>'
    return f'<g fill="#fff6e2" opacity=".85">{body}</g>{under}'.replace(f'{p}rose)', '#f2b48a')

def gull(x, y, s=1, o=.75):
    return f'<path d="M{x-5*s:.1f} {y:.1f} q{2.5*s:.1f} {-3*s:.1f} {5*s:.1f} 0 q{2.5*s:.1f} {-3*s:.1f} {5*s:.1f} 0" stroke="#3a2e26" stroke-width="{max(.8, 1.1*s):.1f}" fill="none" opacity="{o}" stroke-linecap="round"/>'

def palm(x, y, h, lean=4):
    tx, ty = x + lean, y - h
    fr = ''.join(f'<path d="M{tx} {ty} q{dx*.5} {dy-3} {dx} {dy}" stroke="#55665f" stroke-width="1.6" fill="none" stroke-linecap="round"/>' for dx, dy in [(-9, 3), (-6, 6), (8, 2), (6, 6), (1, -4)])
    return f'<path d="M{x} {y} Q{x+lean*.2} {y-h*.6} {tx} {ty}" stroke="#55665f" stroke-width="1.6" fill="none"/>' + fr

def smoke(x, y, h, w, drift, dark=True):
    """A rising column bending with the wind (to the left)."""
    out = []
    rnd = random.Random(int(x * 7 + y))
    n = 16
    for i in range(n):
        t = i / (n - 1)
        cx = x - drift * t * t + rnd.uniform(-2, 2); cy = y - h * t
        r = w * (.6 + t * 1.1) * rnd.uniform(.85, 1.15)
        c = ('#4a4440' if dark else '#7c7570') if t < .45 else ('#8a847c' if t < .75 else '#b8b2a8')
        out.append(f'<circle cx="{cx:.1f}" cy="{cy:.1f}" r="{r:.1f}" fill="{c}" opacity="{.6 - t*.38:.2f}"/>')
    # the sunlit edge of the smoke
    for i in range(5, n, 2):
        t = i / (n - 1); cx = x - drift * t * t; cy = y - h * t; r = w * (.6 + t * 1.1)
        out.append(f'<path d="M{cx+r*.2:.1f} {cy-r*.95:.1f} A{r:.1f} {r:.1f} 0 0 1 {cx+r*.95:.1f} {cy-r*.1:.1f}" stroke="#ffd9a0" stroke-width="{max(.8, r*.18):.1f}" fill="none" opacity=".45"/>')
    return '<g filter="url(#vsoft)">' + ''.join(out) + '</g>'

def flames(x, y, s=1):
    return (f'<ellipse cx="{x}" cy="{y}" rx="{12*s}" ry="{8*s}" fill="url(#vfire)"/>'
            f'<path d="M{x-4*s} {y+2*s} q{-1*s} {-5*s} {2*s} {-9*s} q{0} {4*s} {2*s} {5*s} q{1*s} {-4*s} {3*s} {-6*s} q{2*s} {5*s} {-1*s} {10*s} Z" fill="#f08a2c"/>'
            f'<path d="M{x-2*s} {y+2*s} q{0} {-3*s} {1.5*s} {-5*s} q{.5*s} {2.5*s} {1.5*s} {2.5*s} q{.5*s} {1.5*s} {-.5*s} {2.5*s} Z" fill="#ffd36a"/>')

def plank(x, y, w, rot):
    return f'<g transform="translate({x} {y}) rotate({rot})"><rect x="{-w/2}" y="-1.2" width="{w}" height="2.4" rx=".6" fill="#6b4a2c"/><rect x="{-w/2}" y="-1.2" width="{w}" height=".8" fill="#a07a4c"/></g>'

def barrel(x, y):
    return (f'<g transform="translate({x} {y}) rotate(-12)"><rect x="-4" y="-3.4" width="8" height="5" rx="1.6" fill="#7a5230"/>'
            f'<path d="M-4 -1.8 H4 M-4 .4 H4" stroke="#2f2a26" stroke-width=".8"/><path d="M-3.2 -3 H-1" stroke="#c49a62" stroke-width=".8"/></g>'
            f'<path d="M{x-7} {y+2} q3 -1.4 6 0 t6 0" stroke="#e3f0f1" stroke-width=".8" fill="none" opacity=".7"/>')

def longboat(x, y, s=1):
    k = s
    rowers = ''.join(f'<circle cx="{x+dx*k:.1f}" cy="{y-5.2*k:.1f}" r="{1.3*k:.1f}" fill="#2f2620"/><path d="M{x+dx*k:.1f} {y-4*k:.1f} v{2.6*k:.1f}" stroke="#2f2620" stroke-width="{1.8*k:.1f}"/>'
                     f'<path d="M{x+(dx-1)*k:.1f} {y-2.6*k:.1f} L{x+(dx-5)*k:.1f} {y+2.2*k:.1f}" stroke="#6b4a2c" stroke-width="{.7*k:.1f}"/>' for dx in (-4, 1, 6))
    return (f'<ellipse cx="{x}" cy="{y+1.4*k}" rx="{13*k}" ry="{1.4*k}" fill="#173844" opacity=".45"/>{rowers}'
            f'<path d="M{x-11*k} {y-2.4*k} L{x+10*k} {y-2.4*k} L{x+12*k} {y-3.6*k} Q{x+10*k} {y+1.2*k} {x+6*k} {y+1.2*k} L{x-8*k} {y+1.2*k} Q{x-11*k} {y} {x-11*k} {y-2.4*k} Z" fill="#7a5230" stroke="#2a1d12" stroke-width="{.6*k}"/>'
            f'<path d="M{x-10.6*k} {y-1.6*k} L{x+10.6*k} {y-1.6*k}" stroke="#b08454" stroke-width="{.6*k}"/>'
            f'<path d="M{x-14*k} {y+1.6*k} q4 -1.6 8 0 M{x+11*k} {y+1.2*k} q3 -1 6 0" stroke="#e3f0f1" stroke-width=".8" fill="none" opacity=".7"/>')

def sunpath(sx, y0, y1, spread, n=34, seed=3):
    rnd = random.Random(seed); out = [f'<path d="M{sx-spread*.25} {y0} L{sx+spread*.25} {y0} L{sx+spread*1.4} {y1} L{sx-spread*1.4} {y1} Z" fill="#ffe2a0" opacity=".12"/>']
    for i in range(n):
        t = rnd.random() ** .8; y = y0 + (y1 - y0) * t
        w = 1.5 + t * 9 * rnd.uniform(.4, 1.3); x = sx + rnd.gauss(0, .55) * spread * (.2 + t * 1.1)
        out.append(f'<path d="M{x-w/2:.1f} {y:.1f} q{w/2:.1f} -.6 {w:.1f} 0" stroke="#fff0c0" stroke-width="{.5+t*.7:.1f}" fill="none" stroke-linecap="round" opacity="{.9 - t*.45:.2f}"/>')
    return ''.join(out)

def pano(W, H, L):
    hz = L['hz']; sx, sy = L['sun']
    d = [f'<svg viewBox="0 0 {W} {H}" width="100%" height="{"100%" if L.get("fill") else ""}" preserveAspectRatio="xMidYMid slice" style="display:block" aria-hidden="true">'.replace(' height=""', ''),
         '<defs>'
         '<linearGradient id="vsky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#c9a27a"/><stop offset=".35" stop-color="#ebc48e"/><stop offset=".75" stop-color="#f8e2b6"/><stop offset="1" stop-color="#fcefd2"/></linearGradient>'
         '<linearGradient id="vsea" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7a9ea2"/><stop offset=".25" stop-color="#4f7f8c"/><stop offset="1" stop-color="#1f4352"/></linearGradient>'
         '<radialGradient id="vsun"><stop offset="0" stop-color="#fff7d8"/><stop offset=".25" stop-color="#ffe39a" stop-opacity=".9"/><stop offset="1" stop-color="#ffcf7a" stop-opacity="0"/></radialGradient>'
         '<radialGradient id="vfire"><stop offset="0" stop-color="#ffcf6a" stop-opacity=".95"/><stop offset=".5" stop-color="#f07a2a" stop-opacity=".55"/><stop offset="1" stop-color="#c8401a" stop-opacity="0"/></radialGradient>'
         '<radialGradient id="vvig" cx=".5" cy=".45" r=".75"><stop offset=".6" stop-color="#2a1a10" stop-opacity="0"/><stop offset="1" stop-color="#2a1a10" stop-opacity=".35"/></radialGradient>'
         # the sun is behind and to the right: dim the ships a touch and put a warm rim on their right/top edges
         '<filter id="vlit" x="-4%" y="-4%" width="108%" height="108%" color-interpolation-filters="sRGB">'
         '<feOffset in="SourceAlpha" dx="-.55" dy=".45" result="o"/><feComposite in="SourceAlpha" in2="o" operator="out" result="rim"/>'
         '<feFlood flood-color="#ffd585"/><feComposite in2="rim" operator="in" result="rimc"/>'
         '<feComponentTransfer in="SourceGraphic" result="dim"><feFuncR type="linear" slope=".9" intercept=".02"/><feFuncG type="linear" slope=".84"/><feFuncB type="linear" slope=".76"/></feComponentTransfer>'
         '<feMerge><feMergeNode in="dim"/><feMergeNode in="rimc"/></feMerge></filter>'
         # the losers are backlit against the sun: almost silhouettes, warm haze
         '<filter id="vback" color-interpolation-filters="sRGB"><feColorMatrix type="matrix" values=".32 .12 .04 0 .12  .22 .2 .04 0 .08  .14 .12 .1 0 .06  0 0 0 1 0"/></filter>'
         '<filter id="vsoft" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="1.4"/></filter><filter id="vblur"><feGaussianBlur stdDeviation="1.1"/></filter>'
         f'<clipPath id="vseaC"><rect x="0" y="{hz}" width="{W}" height="{H-hz}"/></clipPath>'
         + ''.join(f'<clipPath id="vsink{i}"><rect x="0" y="0" width="{W}" height="{wl}"/></clipPath>' for i, (_, _, wl, _, _, _) in enumerate(L['sink'])) +
         '</defs>',
         f'<rect width="{W}" height="{H}" fill="url(#vsky)"/>',
         f'<circle cx="{sx}" cy="{sy}" r="{L["sunR"]*5}" fill="url(#vsun)"/>',
         ''.join(cloud(*c, '') for c in L['clouds']),
         f'<circle cx="{sx}" cy="{sy}" r="{L["sunR"]}" fill="#fff4cf"/>',
         # sun rays through the haze
         f'<g opacity=".18" fill="#fff2c8">' + ''.join(f'<path d="M{sx} {sy} L{sx+a} {0} L{sx+a+b} 0 Z"/>' for a, b in L['rays']) + '</g>',
         # a hazy island on the horizon with palms
         f'<g opacity=".72"><path d="{L["island"]}" fill="#8f9c92"/>' + ''.join(palm(*p) for p in L['palms']) + '</g>',
         ''.join(gull(*g) for g in L['gulls']),
    ]
    # the sea
    d.append(f'<rect x="0" y="{hz}" width="{W}" height="{H-hz}" fill="url(#vsea)"/>')
    d.append(f'<rect x="0" y="{hz-.5}" width="{W}" height="2" fill="#fff0c4" opacity=".55"/>')
    d.append(sunpath(sx, hz + 2, H, L['spread']))
    d.append(f'<g stroke="#cfe3e6" fill="none" stroke-linecap="round">' + ''.join(f'<path d="M{x} {y} q{w/4} -{w/8} {w/2} 0 t{w/2} 0" stroke-width="{1+ (y-hz)/(H-hz):.1f}" opacity="{.25 + .35*(y-hz)/(H-hz):.2f}"/>' for x, y, w in L['ripples']) + '</g>')
    # the losers: burning, heeling, going down near the sun
    for i, (kind, x, wl, s, rot, fire) in enumerate(L['sink']):
        d.append(smoke(fire[0], fire[1], *L['smoke'][i]))
        d.append(f'<g clip-path="url(#vsink{i})"><g filter="url(#vback)" opacity=".92">{ship(kind, x, wl + 6 * s, s, rot)}</g></g>')
        d.append(flames(fire[0], fire[1] + 3, s * 1.1))
        d.append(f'<path d="M{x-46*s:.1f} {wl:.1f} q{12*s:.1f} -{3*s:.1f} {24*s:.1f} 0 t{24*s:.1f} 0 t{24*s:.1f} 0 t{24*s:.1f} 0" stroke="#fff3d6" stroke-width="1.2" fill="none" opacity=".8"/>')
        d.append(''.join(f'<circle cx="{x+dx*s:.1f}" cy="{wl+3+dy:.1f}" r="{r}" fill="none" stroke="#e8f3f4" stroke-width=".6" opacity=".7"/>' for dx, dy, r in ((-20, 2, 1.2), (6, 4, .9), (22, 1, 1.4), (-6, 6, .7))))
    # debris and a longboat of survivors
    d.append(''.join(plank(*p) for p in L['planks']) + ''.join(barrel(*b) for b in L['barrels']) + ''.join(longboat(*b) for b in L['boats']))
    # the winners: reflections first (blurred, broken), then the ships lit from behind
    for kind, x, y, s in L['win']:
        d.append(f'<g clip-path="url(#vseaC)" opacity=".26" filter="url(#vblur)"><g transform="translate(0 {2*y}) scale(1 -1)">{ship(kind, x, y + 1.5, s)}</g></g>')
    for kind, x, y, s in L['win']:
        d.append(f'<g filter="url(#vlit)">{ship(kind, x, y, s)}</g>')
        d.append(f'<path d="M{x-58*s:.1f} {y+1.5:.1f} q{6*s:.1f} -{2*s:.1f} {12*s:.1f} 0 M{x+30*s:.1f} {y+2:.1f} q{10*s:.1f} {2*s:.1f} {24*s:.1f} 0" stroke="#fff" stroke-width="1.3" fill="none" opacity=".75" stroke-linecap="round"/>')
    # foreground swell, warm light, vignette
    d.append(f'<path d="M0 {H-6} q{W/16} -5 {W/8} 0 t{W/8} 0 t{W/8} 0 t{W/8} 0 t{W/8} 0 t{W/8} 0 t{W/8} 0 t{W/8} 0 V{H} H0 Z" fill="#183a48" opacity=".55"/>')
    d.append(f'<rect width="{W}" height="{H}" fill="url(#vvig)"/>')
    d.append('</svg>')
    return ''.join(d)

WIDE = dict(hz=118, sun=(598, 100), sunR=13, spread=26, fill=True,
            clouds=[(70, 30, 120), (250, 22, 90), (470, 42, 110), (690, 26, 80)],
            rays=[(-180, 40), (-60, 30), (60, 34), (170, 40)],
            island=f'M466 118 Q478 109 492 110 Q506 101 522 106 Q536 104 548 113 L556 118 Z',
            palms=[(498, 110, 13, 3), (512, 106, 15, -4), (528, 107, 11, 4)],
            gulls=[(300, 40, 1), (318, 50, .8), (720, 60, .7), (120, 66, .6)],
            ripples=[(30, 140, 26), (150, 160, 30), (300, 152, 22), (520, 160, 30), (640, 146, 26), (720, 160, 28), (440, 136, 18), (90, 124, 14), (360, 126, 12)],
            sink=[('endeavour', 620, 124, .62, 14, (612, 96)), ('dutch', 712, 126, .5, -20, (712, 106))],
            smoke=[(84, 9, 70), (64, 7, 52)],
            planks=[(560, 140, 14, 18), (586, 134, 9, -10), (680, 146, 12, 6), (742, 138, 8, 30), (520, 152, 10, -6)],
            barrels=[(640, 150)], boats=[(486, 146, 1.1)],
            win=[('pearl', 168, 150, 1.95), ('revenge', 386, 140, 1.62)])
PHONE = dict(hz=108, sun=(356, 90), sunR=10, spread=16,
            clouds=[(30, 22, 64), (190, 14, 52), (318, 30, 44)],
            rays=[(-120, 26), (-40, 20), (40, 22)],
            island='M196 108 Q204 102 212 103 Q222 97 232 101 Q240 101 246 106 L250 108 Z',
            palms=[(214, 102, 9, 2), (224, 100, 10, -3)],
            gulls=[(150, 30, .8), (162, 38, .6), (300, 52, .5)],
            ripples=[(14, 132, 20), (120, 146, 22), (210, 128, 16), (300, 146, 20), (370, 132, 14)],
            sink=[('endeavour', 352, 114, .36, 14, (348, 98)), ('dutch', 390, 116, .28, -20, (390, 106))],
            smoke=[(56, 5, 40), (40, 4, 30)],
            planks=[(318, 124, 8, 18), (334, 132, 6, -10), (372, 138, 7, 6)],
            barrels=[(356, 142)], boats=[(300, 136, .7)],
            win=[('pearl', 98, 142, 1.45), ('revenge', 252, 134, 1.18)])

if __name__ == '__main__':  # python3 pano.py → pano-victory.json next to it
    json.dump({'wide': pano(772, 170, WIDE), 'phone': pano(400, 150, PHONE)}, open(os.path.join(H, 'pano-victory.json'), 'w'), ensure_ascii=False)
