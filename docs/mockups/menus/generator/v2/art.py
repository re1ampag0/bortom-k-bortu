"""Scene art for the menus: sky, stars, moon/sun, clouds, ridges, palms, lighthouse, a detailed sea.
Everything is plain SVG, no outlines on the water, no white lines at hulls."""
import math, random


def mix(a, b, t):
    a = [int(a[i:i + 2], 16) for i in (1, 3, 5)]
    b = [int(b[i:i + 2], 16) for i in (1, 3, 5)]
    return '#' + ''.join(f'{round(x + (y - x) * t):02x}' for x, y in zip(a, b))


SKIES = {
    #        top        upper      lower      horizon    haze       cloudDark  cloudLit   star
    'night': ('#03070f', '#0a1729', '#1a3049', '#46627a', '#7d93a6', '#0e1a28', '#a9bccd', '#fff6dc'),
    'sunset': ('#1a0f22', '#4a2234', '#b0503a', '#f4a35c', '#ffcf8a', '#3a1a24', '#ffb27a', '#ffe8c4'),
    'dawn': ('#13243a', '#3a5272', '#9aa6b4', '#e8d0b0', '#f6e6cc', '#3a4a60', '#ffe2c4', '#fff6e4'),
    'blood': ('#0c0405', '#2a0b0c', '#4e1714', '#7a2a1e', '#9a4a34', '#1a0808', '#c07a62', '#ffd2b8'),
    'deep': ('#020810', '#08182a', '#123050', '#22476a', '#40688a', '#06121e', '#8eb0cc', '#e8f2ff'),
}


def sky(W, H, uid, pal='night', seed=3, stars=0, milky=False):
    top, up, lo, hor, haze, cd, cl, st = SKIES[pal]
    rnd = random.Random(seed)
    s = [f'<defs><linearGradient id="sk{uid}" x1="0" y1="0" x2="0" y2="1">'
         f'<stop offset="0" stop-color="{top}"/><stop offset=".38" stop-color="{up}"/><stop offset=".78" stop-color="{lo}"/><stop offset="1" stop-color="{hor}"/></linearGradient>'
         f'<radialGradient id="hz{uid}" cx=".5" cy="1" r=".7" gradientTransform="translate(.5 1) scale(1.6 .5) translate(-.5 -1)"><stop offset="0" stop-color="{haze}" stop-opacity=".55"/><stop offset="1" stop-color="{haze}" stop-opacity="0"/></radialGradient>'
         f'<radialGradient id="mw{uid}" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#b8c8ee" stop-opacity=".16"/><stop offset=".6" stop-color="#8ea2d0" stop-opacity=".06"/><stop offset="1" stop-color="#8ea2d0" stop-opacity="0"/></radialGradient>'
         '</defs>']
    s.append(f'<rect width="{W}" height="{H}" fill="url(#sk{uid})"/>')
    s.append(f'<rect width="{W}" height="{H}" fill="url(#hz{uid})"/>')
    if milky:
        cx, cy = W * .36, H * .3
        s.append(f'<g transform="rotate(-18 {cx} {cy})"><ellipse cx="{cx}" cy="{cy}" rx="{W * .55}" ry="{H * .2}" fill="url(#mw{uid})"/>'
                 f'<ellipse cx="{cx + 40}" cy="{cy - 6}" rx="{W * .32}" ry="{H * .08}" fill="url(#mw{uid})"/></g>')
        dust = []
        for _ in range(int(stars * 1.4)):
            u = rnd.gauss(0, 1) * W * .3
            v = rnd.gauss(0, 1) * H * .07
            a = math.radians(-18)
            x, y = cx + u * math.cos(a) - v * math.sin(a), cy + u * math.sin(a) + v * math.cos(a)
            if 0 < x < W and 0 < y < H * .8:
                dust.append(f'<circle cx="{x:.1f}" cy="{y:.1f}" r="{.25 + rnd.random() * .45:.2f}" opacity="{.2 + rnd.random() * .5:.2f}"/>')
        s.append(f'<g fill="#dfe6ff">{"".join(dust)}</g>')
    if stars:
        groups = {'': [], 'tw': [], 'tw2': [], 'tw3': []}
        for i in range(stars):
            x = rnd.random() * W
            y = (rnd.random() ** 1.5) * H * .82
            r = .35 + rnd.random() ** 3 * 1.4
            o = .35 + rnd.random() * .6
            g = rnd.choice(list(groups))
            groups[g].append(f'<circle cx="{x:.1f}" cy="{y:.1f}" r="{r:.2f}" opacity="{o:.2f}"/>')
            if r > 1.25:
                L = r * 4.2
                groups[g].append(f'<path d="M{x - L:.1f} {y:.1f}H{x + L:.1f}M{x:.1f} {y - L:.1f}V{y + L:.1f}" stroke="{st}" stroke-width=".35" opacity=".55"/>')
        for g, items in groups.items():
            cls = f' class="{g}"' if g else ''
            s.append(f'<g{cls} fill="{st}">{"".join(items)}</g>')
    return ''.join(s)


def glint_star(x, y, r, color='#fff6dc', cls='tw'):
    L = r * 6
    return (f'<g class="{cls}"><circle cx="{x}" cy="{y}" r="{r * 3}" fill="{color}" opacity=".18"/>'
            f'<path d="M{x - L} {y}Q{x} {y - .8} {x + L} {y}Q{x} {y + .8} {x - L} {y}Z M{x} {y - L}Q{x - .8} {y} {x} {y + L}Q{x + .8} {y} {x} {y - L}Z" fill="{color}" opacity=".85"/>'
            f'<circle cx="{x}" cy="{y}" r="{r}" fill="#fff"/></g>')


def moon(x, y, r, uid):
    s = (f'<defs><radialGradient id="mh{uid}" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#e8f0ff" stop-opacity=".34"/><stop offset=".25" stop-color="#c8d8f0" stop-opacity=".14"/><stop offset="1" stop-color="#c8d8f0" stop-opacity="0"/></radialGradient>'
         f'<radialGradient id="md{uid}" cx=".38" cy=".34" r=".72"><stop offset="0" stop-color="#fffdf2"/><stop offset=".55" stop-color="#f2e8c8"/><stop offset=".9" stop-color="#cfc29a"/><stop offset="1" stop-color="#b4a77e"/></radialGradient>'
         f'<radialGradient id="mt{uid}" cx=".78" cy=".72" r=".6"><stop offset="0" stop-color="#5a5a6e" stop-opacity=".35"/><stop offset="1" stop-color="#5a5a6e" stop-opacity="0"/></radialGradient></defs>')
    s += f'<circle cx="{x}" cy="{y}" r="{r * 9}" fill="url(#mh{uid})"/>'
    s += f'<circle cx="{x}" cy="{y}" r="{r * 2.6}" fill="url(#mh{uid})"/>'
    s += f'<circle cx="{x}" cy="{y}" r="{r * 1.9}" fill="none" stroke="#e8f0ff" stroke-width="{r * .08:.2f}" opacity=".08"/>'
    s += f'<circle cx="{x}" cy="{y}" r="{r}" fill="url(#md{uid})"/>'
    # maria and craters
    rnd = random.Random(11)
    for (dx, dy, rx, ry, o) in ((-.32, -.18, .36, .26, .22), (.18, -.32, .22, .18, .18), (.12, .2, .3, .2, .2), (-.18, .38, .16, .12, .15)):
        s += f'<ellipse cx="{x + dx * r:.1f}" cy="{y + dy * r:.1f}" rx="{rx * r:.1f}" ry="{ry * r:.1f}" fill="#9a9478" opacity="{o}"/>'
    for _ in range(9):
        a = rnd.random() * 6.28
        d = rnd.random() ** .5 * r * .78
        cr = r * (.04 + rnd.random() * .07)
        cx, cy = x + d * math.cos(a), y + d * math.sin(a)
        s += f'<circle cx="{cx:.1f}" cy="{cy:.1f}" r="{cr:.2f}" fill="#a8a084" opacity=".45"/><path d="M{cx - cr:.1f} {cy:.1f}A{cr:.2f} {cr:.2f} 0 0 1 {cx + cr:.1f} {cy:.1f}" stroke="#fffdf2" stroke-width="{cr * .35:.2f}" fill="none" opacity=".55"/>'
    s += f'<circle cx="{x}" cy="{y}" r="{r}" fill="url(#mt{uid})"/>'
    return s


def sun(x, y, r, uid, col=('#fff6d8', '#ffd27a', '#ff9a40'), rays=True):
    a, b, c = col
    s = (f'<defs><radialGradient id="suh{uid}" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="{b}" stop-opacity=".7"/><stop offset=".2" stop-color="{c}" stop-opacity=".35"/><stop offset="1" stop-color="{c}" stop-opacity="0"/></radialGradient>'
         f'<radialGradient id="sud{uid}" cx=".5" cy=".45" r=".55"><stop offset="0" stop-color="{a}"/><stop offset=".6" stop-color="{b}"/><stop offset="1" stop-color="{c}"/></radialGradient>'
         f'<linearGradient id="sur{uid}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="{b}" stop-opacity="0"/><stop offset="1" stop-color="{b}" stop-opacity=".28"/></linearGradient></defs>')
    s += f'<circle cx="{x}" cy="{y}" r="{r * 7}" fill="url(#suh{uid})"/>'
    if rays:
        rr = []
        for i in range(14):
            ang = -math.pi + i * math.pi / 13
            w = .025 + (i % 3) * .012
            L = r * (5.5 + (i % 4))
            p1 = (x + L * math.cos(ang - w), y + L * math.sin(ang - w))
            p2 = (x + L * math.cos(ang + w), y + L * math.sin(ang + w))
            rr.append(f'M{x} {y}L{p1[0]:.1f} {p1[1]:.1f}L{p2[0]:.1f} {p2[1]:.1f}Z')
        s += (f'<defs><filter id="sbl{uid}" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="{r * .25:.1f}"/></filter>'
              f'<radialGradient id="srg{uid}" cx="{x}" cy="{y}" r="{r * 8}" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="{b}" stop-opacity=".5"/><stop offset="1" stop-color="{b}" stop-opacity="0"/></radialGradient></defs>'
              f'<path class="rays" d="{"".join(rr)}" fill="url(#srg{uid})" opacity=".32" filter="url(#sbl{uid})"/>')
    s += f'<circle cx="{x}" cy="{y}" r="{r * 1.8}" fill="url(#suh{uid})"/>'
    s += f'<circle cx="{x}" cy="{y}" r="{r}" fill="url(#sud{uid})"/>'
    return s


def cloud(cx, cy, w, h, uid, dark, lit, light_dx=1.0, light=.5, seed=1, cls='clouds', op=.9):
    """Soft stratocumulus: blurred flattened puffs, dark belly, lit crown toward the light."""
    rnd = random.Random(seed)
    puffs = []
    n = max(6, int(w / (h * .7)))
    for i in range(n):
        t = i / (n - 1)
        px = cx - w / 2 + t * w + (rnd.random() - .5) * h * .5
        py = cy - math.sin(t * math.pi) * h * .35 * (.6 + rnd.random() * .8)
        pr = h * (.4 + math.sin(t * math.pi) * .45 + rnd.random() * .2)
        puffs.append((px, py, pr))
    bl = max(1.2, h * .14)
    s = (f'<defs><linearGradient id="cg{uid}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="{lit}"/><stop offset=".5" stop-color="{mix(lit, dark, .6)}"/><stop offset="1" stop-color="{dark}"/></linearGradient>'
         f'<filter id="cb{uid}" x="-20%" y="-60%" width="140%" height="220%"><feGaussianBlur stdDeviation="{bl:.1f}"/></filter>'
         f'<filter id="cs{uid}" x="-20%" y="-60%" width="140%" height="220%"><feGaussianBlur stdDeviation="{bl * .45:.1f}"/></filter></defs>')
    s += f'<g class="{cls}" opacity="{op}">'
    s += f'<g filter="url(#cb{uid})"><ellipse cx="{cx}" cy="{cy + h * .25:.1f}" rx="{w * .56:.1f}" ry="{h * .34:.1f}" fill="{dark}" opacity=".7"/></g>'
    body = ''.join(f'<ellipse cx="{x:.1f}" cy="{y:.1f}" rx="{r:.1f}" ry="{r * .62:.1f}"/>' for x, y, r in puffs)
    s += f'<g fill="url(#cg{uid})" filter="url(#cs{uid})">{body}</g>'
    rim = ''.join(f'<ellipse cx="{x + light_dx * r * .2:.1f}" cy="{y - r * .22:.1f}" rx="{r * .7:.1f}" ry="{r * .3:.1f}"/>' for x, y, r in puffs)
    s += f'<g fill="{lit}" opacity="{light * .4:.2f}" filter="url(#cb{uid})">{rim}</g>'
    s += f'<g filter="url(#cb{uid})"><rect x="{cx - w * .55:.1f}" y="{cy + h * .18:.1f}" width="{w * 1.1:.1f}" height="{h * .45:.1f}" fill="{dark}" opacity=".5" rx="{h * .22:.1f}"/></g>'
    return s + '</g>'


def ridge(W, y, amp, seed, fill, opacity=1, step=14, rough=.5):
    rnd = random.Random(seed)
    pts = []
    x = -10
    v = 0
    while x <= W + 20:
        v = v * .72 + (rnd.random() - .5) * amp * rough
        h = amp * (.5 + .5 * math.sin(x / (W * .22) + seed)) + v
        pts.append((x, y - max(0, h)))
        x += step
    d = f'M-10 {y + 2}' + ''.join(f'L{px:.1f} {py:.1f}' for px, py in pts) + f'L{W + 20} {y + 2}Z'
    return f'<path d="{d}" fill="{fill}" opacity="{opacity}"/>'


def palm(x, y, h, lean, k=1.0, col='#0d1720', lit=None):
    """Silhouette palm with a segmented trunk and drooping fronds."""
    tx, ty = x + lean, y - h
    s = f'<g>'
    s += f'<path d="M{x - 2.2 * k} {y}Q{x + lean * .2} {y - h * .55} {tx - 1 * k} {ty}L{tx + 1 * k} {ty}Q{x + lean * .25 + 2 * k} {y - h * .5} {x + 2.4 * k} {y}Z" fill="{col}"/>'
    for i in range(1, 7):
        t = i / 7
        px = x + (tx - x) * t ** 1.2
        py = y - h * t
        s += f'<path d="M{px - 2 * k:.1f} {py:.1f}q{2 * k:.1f} -1.2 {4 * k:.1f} 0" stroke="#000" stroke-width=".5" fill="none" opacity=".35"/>'
    for ang, L in ((-160, 22), (-130, 26), (-95, 18), (-60, 26), (-25, 24), (10, 20), (160, 18)):
        a = math.radians(ang)
        ex, ey = tx + L * k * math.cos(a), ty + L * k * math.sin(a) + 10 * k
        mx, my = tx + L * .55 * k * math.cos(a), ty + L * .55 * k * math.sin(a) - 4 * k
        s += f'<path d="M{tx} {ty}Q{mx:.1f} {my:.1f} {ex:.1f} {ey:.1f}Q{mx:.1f} {my + 4 * k:.1f} {tx} {ty + 1.5 * k}Z" fill="{col}"/>'
        if lit:
            s += f'<path d="M{tx} {ty}Q{mx:.1f} {my:.1f} {ex:.1f} {ey:.1f}" stroke="{lit}" stroke-width=".5" fill="none" opacity=".45"/>'
    s += f'<circle cx="{tx - 1.5 * k}" cy="{ty + 2.5 * k}" r="{1.6 * k}" fill="{col}"/><circle cx="{tx + 1.6 * k}" cy="{ty + 3 * k}" r="{1.5 * k}" fill="{col}"/>'
    return s + '</g>'


def lighthouse(x, y, k, uid, beam_cls='beam'):
    s = (f'<defs><linearGradient id="lt{uid}" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#9aa6ae"/><stop offset=".35" stop-color="#e8eef0"/><stop offset="1" stop-color="#6a767e"/></linearGradient>'
         f'<linearGradient id="lr{uid}" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#6a1a14"/><stop offset=".35" stop-color="#b0352a"/><stop offset="1" stop-color="#4a100c"/></linearGradient>'
         f'<linearGradient id="lb{uid}" x1="1" y1="0" x2="0" y2="0"><stop offset="0" stop-color="#fff2c4" stop-opacity=".55"/><stop offset="1" stop-color="#fff2c4" stop-opacity="0"/></linearGradient>'
         f'<radialGradient id="lg{uid}" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#fff2c4" stop-opacity=".95"/><stop offset=".3" stop-color="#ffd27a" stop-opacity=".45"/><stop offset="1" stop-color="#ffd27a" stop-opacity="0"/></radialGradient></defs>')
    g = f'<g transform="translate({x} {y}) scale({k})">'
    # rock
    g += '<path d="M-26 0 C -22 -8 -14 -10 -8 -12 C -2 -14 6 -13 12 -10 C 18 -8 24 -4 28 0 Z" fill="#101a24"/>'
    g += '<path d="M-14 -10 C -8 -13 2 -14 10 -11" stroke="#5a7084" stroke-width=".8" fill="none" opacity=".6"/>'
    # keeper house
    g += '<rect x="6" y="-20" width="12" height="9" fill="#2a3642"/><path d="M5 -20 L12 -25 L19 -20 Z" fill="#1a2430"/><rect x="9" y="-17" width="2.6" height="3" fill="#ffcf6a" class="flick"/>'
    # tower with stripes
    g += f'<path d="M-6 -11 L-4 -56 L4 -56 L6 -11 Z" fill="url(#lt{uid})"/>'
    for yy in (-21, -37):
        g += f'<path d="M{-6 + (11 + yy) * -.0444:.2f} {yy}L{-6 + (11 + yy - 8) * -.0444:.2f} {yy - 8}L{6 - (11 + yy - 8) * -.0444:.2f} {yy - 8}L{6 - (11 + yy) * -.0444:.2f} {yy}Z" fill="url(#lr{uid})"/>'
    g += '<rect x="-1" y="-30" width="2" height="3" fill="#1a2430"/>'
    # gallery and lantern room
    g += '<rect x="-7" y="-58" width="14" height="2.2" fill="#1a2430"/><path d="M-6.6 -58 V-61 M6.6 -58 V-61 M-6.6 -61 H6.6" stroke="#1a2430" stroke-width=".7"/>'
    g += '<rect x="-3.6" y="-66" width="7.2" height="8" fill="#ffe8a0"/><path d="M-1.2 -66 V-58 M1.2 -66 V-58" stroke="#8a6a2a" stroke-width=".5"/>'
    g += '<path d="M-5 -66 L0 -71 L5 -66 Z" fill="#2a1a10"/><circle cx="0" cy="-72" r=".9" fill="#2a1a10"/>'
    g += '</g>'
    lx, ly = x, y - 62 * k
    # a real rotating lens: the beam sweeps around the tower (scaleX follows cos), it flashes when it faces us
    glow = (f'<circle class="lhGlow" cx="{lx}" cy="{ly}" r="{16 * k}" fill="url(#lg{uid})"/>'
            f'<circle class="lhFlash" style="transform-origin:{lx}px {ly}px" cx="{lx}" cy="{ly}" r="{46 * k}" fill="url(#lg{uid})"/>')
    beam = (f'<g class="lhBeam" style="transform-origin:{lx}px {ly}px">'
            f'<path d="M{lx} {ly - 2.5 * k}L{lx - 420 * k} {ly - 40 * k}L{lx - 420 * k} {ly + 26 * k}L{lx} {ly + 2.5 * k}Z" fill="url(#lb{uid})" opacity=".6"/>'
            f'<path d="M{lx} {ly - 1 * k}L{lx - 300 * k} {ly - 12 * k}L{lx - 300 * k} {ly + 8 * k}L{lx} {ly + 1 * k}Z" fill="url(#lb{uid})" opacity=".5"/></g>')
    return s + beam + g + glow


SEAS = {
    #         horizon     mid        bottom     crest      trough     glitter    haze
    'night': ('#45627a', '#1c364c', '#0a1622', '#bcd6e6', '#040b13', '#fff3c4', '#6f8a9c'),
    'sunset': ('#a8573a', '#4a2026', '#120a10', '#ffbf86', '#0a0508', '#ffe0a0', '#e07a3a'),
    'dawn': ('#8e98a0', '#3a4e60', '#0c1a28', '#f0e2c6', '#07101a', '#fff4dc', '#c8bca4'),
    'panel': ('#1d4258', '#163650', '#0e263a', '#a8c8d8', '#081824', '#e8f2f6', '#2c5068'),
    'blood': ('#4a201c', '#280e0e', '#0c0404', '#d09478', '#050202', '#f0c09a', '#5a2a24'),
    'deep': ('#2a4a66', '#10263c', '#040c16', '#a8c4d6', '#02060c', '#e4eef4', '#3a5a76'),
}


def sea(W, H, sid, pal='night', light_x=None, light_w=1.0, seed=7, tile=480, perspective=True, density=1.0, glitter=1.0, drift=True):
    """Perspective swell: rows of crests and troughs, crests brighten toward the light; a glitter path under it."""
    hor, mid, bot, crest, trough, glint, haze = SEAS[pal]
    rnd = random.Random(seed)
    Tw = tile

    def field(seed2, amp, dens):
        r2 = random.Random(seed2)
        rows = []
        if perspective:
            n = max(6, int(H / 4.2))
            for k in range(n):
                f = ((k + .7) / n) ** 1.55
                rows.append((f * H, (1.4 + 12 * f) * amp))
        else:
            n = max(10, int(H / 9))
            for k in range(n):
                rows.append(((k + r2.random() * .6) * H / n, 6.5 * amp))
        buckets = [[] for _ in range(4)]
        dk = [[] for _ in range(4)]
        for ry, sz in rows:
            cx = r2.random() * sz * 3
            while cx < Tw:
                w = sz * (1.1 + r2.random() * 1.8)
                yy = ry + (r2.random() - .5) * sz * .5
                a = r2.random()
                h = sz * (.18 + r2.random() * .16)
                b = min(3, int(a * 4))
                for dx in (0, Tw, -Tw):
                    X = cx + dx
                    if X + w < 0 or X - w > Tw:
                        continue
                    buckets[b].append(f'M{X - w:.1f} {yy:.1f}Q{X:.1f} {yy - h:.1f} {X + w:.1f} {yy:.1f}Q{X:.1f} {yy - h * .3:.1f} {X - w:.1f} {yy:.1f}Z')
                    dk[b].append(f'M{X - w * 1.05:.1f} {yy + h * .2:.1f}Q{X:.1f} {yy + h * 1.8:.1f} {X + w * 1.05:.1f} {yy + h * .2:.1f}Q{X:.1f} {yy + h * .6:.1f} {X - w * 1.05:.1f} {yy + h * .2:.1f}Z')
                cx += w * (1.8 + r2.random() * 1.7)
        op = [.18, .28, .38, .5]
        out = ''
        for i in range(4):
            if dk[i]:
                out += f'<path fill="{trough}" opacity="{min(.75, op[i] * 1.5 * dens):.2f}" d="{"".join(dk[i])}"/>'
        for i in range(4):
            if buckets[i]:
                out += f'<path fill="{crest}" opacity="{op[i] * dens:.2f}" d="{"".join(buckets[i])}"/>'
        return out

    A = field(seed, 1.0, density)
    B = field(seed + 101, .65, density * .7)
    g = [f'<svg aria-hidden="true" width="{W}" height="{H}" viewBox="0 0 {W} {H}" preserveAspectRatio="none" overflow="hidden" style="position:absolute;left:0;top:0">']
    g.append('<defs>')
    g.append(f'<linearGradient id="sb{sid}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="{hor}"/><stop offset=".3" stop-color="{mid}"/><stop offset="1" stop-color="{bot}"/></linearGradient>')
    g.append(f'<linearGradient id="sh{sid}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="{haze}" stop-opacity=".7"/><stop offset="1" stop-color="{haze}" stop-opacity="0"/></linearGradient>')
    g.append(f'<pattern id="sa{sid}" width="{Tw}" height="{H}" patternUnits="userSpaceOnUse">{A}</pattern>')
    g.append(f'<pattern id="sv{sid}" width="{Tw}" height="{H}" patternUnits="userSpaceOnUse">{B}</pattern>')
    if light_x is not None:
        lx = light_x / W
        g.append(f'<radialGradient id="sl{sid}" cx="{lx:.3f}" cy="0" r=".5" gradientTransform="translate({lx:.3f} 0) scale({.32 * light_w:.3f} 2.2) translate({-lx:.3f} 0)"><stop offset="0" stop-color="{glint}" stop-opacity=".42"/><stop offset=".5" stop-color="{glint}" stop-opacity=".12"/><stop offset="1" stop-color="{glint}" stop-opacity="0"/></radialGradient>')
        g.append(f'<linearGradient id="sm{sid}" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#000" stop-opacity="0"/><stop offset="{max(0, lx - .2):.3f}" stop-color="#000" stop-opacity="0"/><stop offset="{lx:.3f}" stop-color="#fff" stop-opacity="1"/><stop offset="{min(1, lx + .2):.3f}" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity="0"/></linearGradient>')
        g.append(f'<mask id="mk{sid}"><rect width="{W}" height="{H}" fill="url(#sm{sid})"/></mask>')
    g.append('</defs>')
    g.append(f'<rect width="{W}" height="{H}" fill="url(#sb{sid})"/>')
    # broad swell bands for depth
    for i in range(5):
        y = H * (.25 + i * .17)
        g.append(f'<ellipse cx="{W * (.2 + .15 * i)}" cy="{y:.1f}" rx="{W * .5}" ry="{H * .05:.1f}" fill="{bot if i % 2 else mid}" opacity=".18"/>')
    if light_x is not None:
        g.append(f'<rect width="{W}" height="{H}" fill="url(#sl{sid})"/>')
    dc = f' class="seaDrift{sid}"' if drift else ''
    g.append(f'<g{dc}><rect x="{-Tw}" width="{W + 2 * Tw}" height="{H}" fill="url(#sa{sid})"/></g>')
    dc2 = f' class="seaSwell{sid}"' if drift else ''
    g.append(f'<g{dc2}><rect x="{-Tw}" width="{W + 2 * Tw}" height="{H}" fill="url(#sv{sid})"/></g>')
    if light_x is not None:
        # brighter crests inside the light column
        g.append(f'<g mask="url(#mk{sid})" opacity=".85"><g{dc}><rect x="{-Tw}" width="{W + 2 * Tw}" height="{H}" fill="url(#sa{sid})" style="mix-blend-mode:screen"/></g></g>')
    if perspective:
        g.append(f'<rect width="{W}" height="{max(4, H * .2):.1f}" fill="url(#sh{sid})"/>')
    if light_x is not None and glitter > 0:
        groups = [[], [], []]
        for _ in range(int(150 * glitter)):
            f = rnd.random() ** 1.25
            yy = f * H
            spread = (6 + 90 * f) * light_w * (W / 1366) ** .3
            xx = light_x + rnd.gauss(0, 1) * spread * .55
            ln = (1.2 + 9 * f * rnd.random())
            groups[rnd.randrange(3)].append(f'<rect x="{xx - ln / 2:.1f}" y="{yy:.1f}" width="{ln:.1f}" height="{max(.45, 1.1 * f):.2f}" rx=".4" opacity="{.3 + .65 * rnd.random():.2f}"/>')
        for i, gg in enumerate(groups):
            g.append(f'<g class="glint{i}" fill="{glint}">{"".join(gg)}</g>')
    # far-field sparkles (moon catching crest tops)
    sp = []
    for _ in range(int(40 * glitter)) if light_x is not None else []:
        f = rnd.random() ** .8
        xx = rnd.random() * W
        yy = f * H
        sp.append(f'<circle cx="{xx:.1f}" cy="{yy:.1f}" r="{.4 + f * .7:.2f}" opacity="{.25 + rnd.random() * .5:.2f}"/>')
    if sp:
        g.append(f'<g class="tw2" fill="{glint}">{"".join(sp)}</g>')
    g.append('</svg>')
    css = ''
    if drift:
        css = (f'@keyframes seaDrift{sid}{{to{{transform:translateX({Tw}px)}}}}.seaDrift{sid}{{animation:seaDrift{sid} {int(Tw / 7)}s linear infinite}}'
               f'@keyframes seaSwell{sid}{{0%{{transform:translate(0,0);opacity:.9}}50%{{transform:translate({-Tw / 2:.0f}px,.8px);opacity:.55}}100%{{transform:translate({-Tw}px,0);opacity:.9}}}}.seaSwell{sid}{{animation:seaSwell{sid} {int(Tw / 4)}s linear infinite}}')
    return ''.join(g), css


SEA_CSS = ('@keyframes gl{0%,100%{opacity:1}30%{opacity:.35}60%{opacity:.85}}'
           '.glint0{animation:gl 2.6s ease-in-out infinite}.glint1{animation:gl 3.4s ease-in-out -1.1s infinite}.glint2{animation:gl 2.9s ease-in-out -2s infinite}'
           '@media (prefers-reduced-motion: reduce){[class^="seaDrift"],[class^="seaSwell"],[class^="glint"]{animation:none !important}}')


def ship(name, L, wy, W, H, flip, cls='bob', refl_h=None, refl_op=.24, rim=None, shadow=True, lantern=None, alt='', sheen=None, cabin=None, k=0):
    """Dry ship on the water: hull clipped at 85 %, contact shadow, rippled reflection, optional rim light and stern lantern."""
    wl = round(H * .85)
    refl_h = refl_h or round(H * .38)
    d = cls.replace('bob', '')
    src = f'../assets/ship_{name}.svg'
    sc = 'scale(-1, -1)' if flip else 'scaleY(-1)'
    mask = ('-webkit-mask-image: linear-gradient(rgba(0,0,0,.9), rgba(0,0,0,0)), repeating-linear-gradient(rgba(0,0,0,1) 0 2px, rgba(0,0,0,.25) 2px 4px); -webkit-mask-composite: source-in; '
            'mask-image: linear-gradient(rgba(0,0,0,.9), rgba(0,0,0,0)), repeating-linear-gradient(rgba(0,0,0,1) 0 2px, rgba(0,0,0,.25) 2px 4px); mask-composite: intersect;')
    out = (f'<div aria-hidden="true" style="position: absolute; left: {L:g}px; top: {wy:g}px; width: {W:g}px; height: {refl_h}px; overflow: hidden; {mask} opacity: {refl_op}; filter: blur(1.1px)">'
           f'<img class="bobR{d}" src="{src}" alt="" style="position: absolute; left: 0; top: {-(H - wl):g}px; width: {W:g}px; height: {H:g}px; transform: {sc}"></div>')
    filt = f'filter: {rim};' if rim else ''
    tr = 'transform: scaleX(-1); ' if flip else ''
    pad = 26
    out += (f'<div style="position: absolute; left: {L:g}px; top: {wy - wl - pad:g}px; width: {W:g}px; height: {wl + pad}px; overflow: hidden">'
            f'<img class="{cls}" src="{src}" alt="{alt}" style="position: absolute; left: 0; top: {pad}px; width: {W:g}px; height: {H:g}px; {tr}{filt}"></div>')
    if sheen:
        # moonlight sliding over the sails from the light side: a brightened copy, masked to that side, fading in and out
        side = 'to left' if sheen == 'left' else 'to right'
        out += (f'<div aria-hidden="true" class="sheen s{k % 4}" style="position: absolute; left: {L:g}px; top: {wy - wl - pad:g}px; width: {W:g}px; height: {wl + pad}px; overflow: hidden; '
                f'-webkit-mask-image: linear-gradient({side}, #000, rgba(0,0,0,0) 70%); mask-image: linear-gradient({side}, #000, rgba(0,0,0,0) 70%); mix-blend-mode: screen">'
                f'<img class="{cls}" src="{src}" alt="" style="position: absolute; left: 0; top: {pad}px; width: {W:g}px; height: {H:g}px; {tr}filter: brightness(2.4) saturate(.2)"></div>')
    if shadow:
        out += (f'<span aria-hidden="true" style="position: absolute; left: {L + W * .1:g}px; top: {wy - 3:g}px; width: {W * .8:g}px; height: 8px; border-radius: 50%; '
                f'background: radial-gradient(closest-side, rgba(0,0,0,.45), rgba(0,0,0,0))"></span>')
    if lantern:
        lx, ly, col = lantern
        out += (f'<div aria-hidden="true" class="flick{d}" style="position: absolute; left: {lx - 15:g}px; top: {ly - 15:g}px; width: 30px; height: 30px; border-radius: 50%; '
                f'background: radial-gradient({col}, rgba(0,0,0,0) 70%)"></div>')
        out += streak(lx, wy + 2, refl_h * .9, 7, col.replace('.6)', '.9)').replace('.55)', '.9)').replace('.5)', '.85)'), f'refl r{k % 4}', .55)
    if cabin:
        cx, cy, cw, ch, col = cabin
        # stern cabin windows: a warm band that breathes, and its long broken reflection
        out += (f'<div aria-hidden="true" class="cabin c{k % 3}" style="position: absolute; left: {cx - cw / 2:g}px; top: {cy - ch / 2:g}px; width: {cw:g}px; height: {ch:g}px; border-radius: 50%; '
                f'background: radial-gradient(closest-side, {col}, rgba(0,0,0,0)); mix-blend-mode: screen"></div>')
        out += streak(cx, wy + 2, refl_h * 1.1, cw * .6, col, f'refl r{(k + 1) % 4}', .4)
    return out


LIGHT_CSS = (
    # lighthouse: one beam turning around a vertical axis
    '@keyframes lhBeam{0%{transform:scaleX(1);animation-timing-function:cubic-bezier(.45,0,1,1)}25%{transform:scaleX(0);animation-timing-function:cubic-bezier(0,0,.55,1)}'
    '50%{transform:scaleX(-1);opacity:.35;animation-timing-function:cubic-bezier(.45,0,1,1)}75%{transform:scaleX(0);opacity:0;animation-timing-function:cubic-bezier(0,0,.55,1)}100%{transform:scaleX(1)}}'
    '.lhBeam{animation:lhBeam 9s linear infinite}'
    '@keyframes lhFlash{0%,17%{opacity:0;transform:scale(.6)}25%{opacity:1;transform:scale(1.15)}33%,100%{opacity:0;transform:scale(.6)}}'
    '.lhFlash{animation:lhFlash 9s linear infinite}'
    '@keyframes lhGlow{0%,100%{opacity:.85}25%{opacity:1}75%{opacity:.55}}.lhGlow{animation:lhGlow 9s linear infinite}'
    '@keyframes lhWater{0%,17%{opacity:.18}25%{opacity:.7}33%,70%{opacity:.18}75%{opacity:.08}100%{opacity:.18}}.lhWater{animation:lhWater 9s linear infinite}'
    # lights reflected on water: broken streaks that shimmer
    '@keyframes refl{0%,100%{opacity:.75;scale:1 1}30%{opacity:.45;scale:.85 1.04}60%{opacity:.9;scale:1.1 .96}}'
    '.refl{transform-origin:50% 0;animation:refl 2.8s ease-in-out infinite}.refl.r1{animation-duration:3.4s;animation-delay:-1.2s}.refl.r2{animation-duration:2.3s;animation-delay:-.6s}.refl.r3{animation-duration:3.9s;animation-delay:-2.1s}'
    # fort windows and torches: each flickers on its own
    '@keyframes fw{0%,100%{opacity:1}12%{opacity:.82}20%{opacity:.95}46%{opacity:.7}58%{opacity:1}80%{opacity:.86}}'
    '.fw1{animation:fw 3.1s ease-in-out infinite}.fw2{animation:fw 2.3s ease-in-out -1s infinite}.fw3{animation:fw 4.2s ease-in-out -2.2s infinite}.fw4{animation:fw 1.7s ease-in-out -.4s infinite}'
    '@keyframes torch{0%,100%{opacity:1;scale:1 1}25%{opacity:.75;scale:.9 1.1}50%{opacity:.95;scale:1.05 .92}75%{opacity:.7;scale:.95 1.06}}'
    '.torch{transform-box:fill-box;transform-origin:50% 100%;animation:torch .9s ease-in-out infinite}.torch.t2{animation-duration:1.1s;animation-delay:-.3s}'
    # moonlight sliding over the sails and the warm glow of stern cabins
    '@keyframes sheen{0%,100%{opacity:0}45%{opacity:.16}60%{opacity:.1}}.sheen{animation:sheen 9s ease-in-out infinite}.sheen.s1{animation-delay:-3s}.sheen.s2{animation-delay:-5.5s}.sheen.s3{animation-delay:-7s}'
    '@keyframes cabin{0%,100%{opacity:.85}30%{opacity:.65}55%{opacity:.95}75%{opacity:.7}}.cabin{animation:cabin 3.6s ease-in-out infinite}.cabin.c1{animation-delay:-1.4s}.cabin.c2{animation-delay:-2.6s}'
    '@media (prefers-reduced-motion: reduce){.lhBeam,.lhFlash,.lhGlow,.lhWater,.refl,.torch,.sheen,.cabin,[class^="fw"]{animation:none !important}}'
)


def streak(x, y, h, w, col, cls='refl', op=.6):
    """Reflection of a point light on rippled water: a column of short horizontal dashes, wider and fainter downward."""
    return (f'<div aria-hidden="true" class="{cls}" style="position: absolute; left: {x - w / 2:g}px; top: {y:g}px; width: {w:g}px; height: {h:g}px; opacity: {op}; '
            f'background: repeating-linear-gradient({col} 0 1.4px, rgba(0,0,0,0) 1.4px 3.6px); '
            f'-webkit-mask-image: radial-gradient(ellipse 50% 100% at 50% 0%, #000 30%, rgba(0,0,0,0) 100%); mask-image: radial-gradient(ellipse 50% 100% at 50% 0%, #000 30%, rgba(0,0,0,0) 100%); filter: blur(.5px)"></div>')


ISLES = {
    #        top-lit     body       base       rim(light)  bush       bushLit    sand       rock
    'night': ('#2a3c4e', '#142230', '#0a131c', '#8eaac0', '#0b1a16', '#3e5a58', '#3a4650', '#1a2834'),
    'dawn': ('#4a5464', '#262f3c', '#141a24', '#f0dcc0', '#1e2a24', '#6a7a60', '#8a8270', '#2e3844'),
    'sunset': ('#5a2c30', '#2e141a', '#160a0e', '#ffb27a', '#1e1010', '#7a4030', '#8a5a40', '#3a1c20'),
}


def island(x0, x1, base, h, uid, pal='night', seed=3, plateau=None, light='right', palms=(), bushes=14, k=1.0, rocks=4):
    """A detailed island: rocky mass with strata, a plateau for a fort, rim light from the light source,
    bushes and palms on the slopes, a strip of beach and boulders at the waterline. Returns (svg, contour points)."""
    top, body, bot, rim, bush, bushL, sand, rock = ISLES[pal]
    rnd = random.Random(seed)
    W = x1 - x0
    pts = []
    n = 46
    for i in range(n + 1):
        t = i / n
        x = x0 + t * W
        env = math.sin(t * math.pi) ** .7
        y = base - h * env * (.82 + .18 * math.sin(t * 9 + seed)) - rnd.random() * h * .06 * env
        if plateau and plateau[0] <= x <= plateau[1]:
            y = min(y, base - h) if False else base - h
        pts.append((x, y))
    # soften the plateau edges
    d = f'M{x0 - 4} {base + 3}' + ''.join(f'L{x:.1f} {y:.1f}' for x, y in pts) + f'L{x1 + 4} {base + 3}Z'
    lx = 1 if light == 'right' else 0
    s = (f'<defs><linearGradient id="ib{uid}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="{top}"/><stop offset=".45" stop-color="{body}"/><stop offset="1" stop-color="{bot}"/></linearGradient>'
         f'<linearGradient id="ir{uid}" x1="{1 - lx}" y1="0" x2="{lx}" y2="0"><stop offset="0" stop-color="{rim}" stop-opacity="0"/><stop offset=".55" stop-color="{rim}" stop-opacity=".25"/><stop offset="1" stop-color="{rim}" stop-opacity=".85"/></linearGradient>'
         f'<linearGradient id="is{uid}" x1="{1 - lx}" y1="0" x2="{lx}" y2="0"><stop offset="0" stop-color="#000" stop-opacity=".35"/><stop offset="1" stop-color="#000" stop-opacity="0"/></linearGradient>'
         f'<clipPath id="ic{uid}"><path d="{d}"/></clipPath></defs>')
    s += f'<path d="{d}" fill="url(#ib{uid})"/>'
    s += f'<g clip-path="url(#ic{uid})">'
    # shaded side away from the light
    s += f'<rect x="{x0}" y="{base - h * 1.2}" width="{W}" height="{h * 1.3}" fill="url(#is{uid})"/>'
    # rock strata following the hill
    for j in range(5):
        off = h * (.18 + j * .16)
        sd = 'M' + ' L'.join(f'{x:.1f} {y + off + math.sin(x * .07 + j) * 1.4 * k:.1f}' for x, y in pts[2:-2])
        s += f'<path d="{sd}" stroke="#05090e" stroke-width="{.7 * k:.2f}" fill="none" opacity="{.45 - j * .05:.2f}"/>'
        s += f'<path d="{sd}" stroke="{rim}" stroke-width="{.4 * k:.2f}" fill="none" opacity=".12" transform="translate(0 -1)"/>'
    # cliff faces on the plateau sides
    if plateau:
        for px in plateau:
            s += f'<path d="M{px - 6 * k} {base - h} L{px - 2 * k} {base - h * .45} L{px + 6 * k} {base - h * .2}" stroke="#05090e" stroke-width="{1 * k:.2f}" fill="none" opacity=".5"/>'
    # beach strip and wet sand
    s += f'<path d="M{x0 + W * .04} {base + 1} Q{x0 + W * .5} {base - 5 * k} {x1 - W * .04} {base + 1} Z" fill="{sand}" opacity=".55"/>'
    s += '</g>'
    # rim light along the crest (strongest toward the light)
    cd = 'M' + ' L'.join(f'{x:.1f} {y + .6:.1f}' for x, y in pts[1:-1])
    s += f'<path d="{cd}" stroke="url(#ir{uid})" stroke-width="{1.3 * k:.2f}" fill="none" stroke-linejoin="round"/>'
    # bushes on the slopes, lit on top
    for _ in range(bushes):
        t = .08 + rnd.random() * .84
        i = int(t * n)
        x, y = pts[i]
        if plateau and plateau[0] - 6 <= x <= plateau[1] + 6:
            continue
        r = (2.2 + rnd.random() * 3.2) * k
        s += f'<g><ellipse cx="{x:.1f}" cy="{y + r * .5:.1f}" rx="{r * 1.3:.1f}" ry="{r:.1f}" fill="{bush}"/>'
        s += f'<ellipse cx="{x + (r * .3 if lx else -r * .3):.1f}" cy="{y + r * .1:.1f}" rx="{r * .8:.1f}" ry="{r * .45:.1f}" fill="{bushL}" opacity=".55"/></g>'
    for (px, ph, lean, pk) in palms:
        i = min(n, max(0, int((px - x0) / W * n)))
        s += palm(px, pts[i][1] + 2 * k, ph, lean, pk, bush, rim)
    # boulders at the waterline
    for _ in range(rocks):
        bx = x0 + W * (.06 + rnd.random() * .88)
        br = (2.5 + rnd.random() * 3.5) * k
        s += f'<path d="M{bx - br * 1.4:.1f} {base + 2} Q{bx - br:.1f} {base - br * 1.1:.1f} {bx:.1f} {base - br * 1.2:.1f} Q{bx + br:.1f} {base - br:.1f} {bx + br * 1.5:.1f} {base + 2} Z" fill="{rock}"/>'
        s += f'<path d="M{bx - br * .6:.1f} {base - br * .9:.1f} Q{bx:.1f} {base - br * 1.25:.1f} {bx + br * .8:.1f} {base - br * .8:.1f}" stroke="{rim}" stroke-width="{.6 * k:.2f}" fill="none" opacity=".45"/>'
    return s, pts


def island_reflection(x0, x1, h, uid, pal='night'):
    """Dark mirrored mass under the island, fading with depth (place at the horizon line)."""
    top, body, bot = ISLES[pal][:3]
    W = x1 - x0
    return (f'<div aria-hidden="true" style="position: absolute; left: {x0:g}px; width: {W:g}px; height: {h * .8:g}px; '
            f'background: radial-gradient(ellipse 50% 100% at 50% 0%, {bot}, rgba(0,0,0,0) 90%); opacity: .75; '
            f'-webkit-mask-image: repeating-linear-gradient(#000 0 2px, rgba(0,0,0,.45) 2px 4px); mask-image: repeating-linear-gradient(#000 0 2px, rgba(0,0,0,.45) 2px 4px); filter: blur(.6px); TOP"></div>')
