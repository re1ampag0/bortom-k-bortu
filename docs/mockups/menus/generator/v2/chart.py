"""Background «штурманская карта» in the manner of 17th–18th century sea charts (portolans) and the chart maps of
naval games: a frame with degree ticks, rhumb-line networks from hidden wind roses, coasts drawn with water-lining,
hachured hills, soundings, wreck and anchorage marks, a scale of leagues and a cartouche. Dark navy ink, low contrast,
so the UI stays readable. One static picture per size (bake as an image in the game)."""
import math, random, os

INK = '#7fb4c8'      # chart ink
GOLD = '#c9a048'
RED = '#b0584a'
LAND = '#142531'


def blob(cx, cy, r, rnd, n=40, rough=.32):
    pts = []
    ph = [rnd.random() * 6.28 for _ in range(4)]
    for i in range(n):
        a = i / n * 6.283
        k = 1 + rough * (.5 * math.sin(2 * a + ph[0]) + .3 * math.sin(3 * a + ph[1]) + .2 * math.sin(5 * a + ph[2])) + rnd.uniform(-.06, .06)
        pts.append((cx + r * k * math.cos(a) * 1.35, cy + r * k * math.sin(a) * .85))
    return pts


def path(pts, close=True):
    d = 'M' + ' L'.join(f'{x:.1f} {y:.1f}' for x, y in pts)
    return d + ('Z' if close else '')


def offset(pts, cx, cy, d):
    out = []
    for x, y in pts:
        vx, vy = x - cx, y - cy
        L = math.hypot(vx, vy) or 1
        out.append((x + vx / L * d, y + vy / L * d))
    return out


def rose(cx, cy, r, op=1.0):
    s = f'<g opacity="{op}">'
    s += f'<circle cx="{cx}" cy="{cy}" r="{r}" fill="none" stroke="{INK}" stroke-width=".9"/><circle cx="{cx}" cy="{cy}" r="{r * .86}" fill="none" stroke="{INK}" stroke-width=".5"/>'
    t = ''.join(f'M{cx + r * math.cos(a):.1f} {cy + r * math.sin(a):.1f}L{cx + r * (.92 if i % 4 else .82) * math.cos(a):.1f} {cy + r * (.92 if i % 4 else .82) * math.sin(a):.1f}'
                for i, a in ((i, i * math.pi / 16) for i in range(32)))
    s += f'<path d="{t}" stroke="{INK}" stroke-width=".7"/>'
    for lvl, L, w, col in ((0, .8, .14, GOLD), (1, .55, .1, INK)):
        for i in range(8 if lvl == 0 else 8):
            a = (i * math.pi / 4 if lvl == 0 else i * math.pi / 4 + math.pi / 8) - math.pi / 2
            tip = (cx + r * L * math.cos(a), cy + r * L * math.sin(a))
            l1 = (cx + r * w * math.cos(a - math.pi / 2), cy + r * w * math.sin(a - math.pi / 2))
            l2 = (cx + r * w * math.cos(a + math.pi / 2), cy + r * w * math.sin(a + math.pi / 2))
            s += f'<path d="M{cx} {cy}L{l1[0]:.1f} {l1[1]:.1f}L{tip[0]:.1f} {tip[1]:.1f}Z" fill="{col}" opacity=".55"/>'
            s += f'<path d="M{cx} {cy}L{l2[0]:.1f} {l2[1]:.1f}L{tip[0]:.1f} {tip[1]:.1f}Z" fill="{col}" opacity=".25"/>'
    # fleur-de-lis style north mark
    s += f'<path d="M{cx} {cy - r * 1.02} l{r * .06:.1f} {-r * .14:.1f} l{-r * .06:.1f} {-r * .1:.1f} l{-r * .06:.1f} {r * .1:.1f} Z" fill="{GOLD}" opacity=".7"/>'
    s += f'<circle cx="{cx}" cy="{cy}" r="{r * .05:.1f}" fill="{GOLD}" opacity=".7"/>'
    return s + '</g>'


def rhumbs(cx, cy, L, op):
    """Portolan network: 32 lines; principal winds gold, half winds ink, quarter winds red — all faint."""
    s = f'<g opacity="{op}" stroke-width=".55">'
    for i in range(32):
        a = i * math.pi / 16
        col = GOLD if i % 4 == 0 else (INK if i % 2 == 0 else RED)
        s += f'<path d="M{cx:.1f} {cy:.1f}L{cx + L * math.cos(a):.1f} {cy + L * math.sin(a):.1f}" stroke="{col}"/>'
    return s + '</g>'


def isle(cx, cy, r, rnd, name=None, label_dx=0, label_dy=0, k=1.0):
    pts = blob(cx, cy, r, rnd)
    s = ''
    # water-lining: concentric contours outside the coast, fading
    for j, (dd, op) in enumerate(((3, .34), (6.5, .22), (10.5, .14), (15, .08))):
        s += f'<path d="{path(offset(pts, cx, cy, dd * k))}" fill="none" stroke="{INK}" stroke-width=".55" opacity="{op}"/>'
    s += f'<path d="{path(pts)}" fill="{LAND}" stroke="{GOLD}" stroke-width=".9" opacity=".95"/>'
    s += f'<path d="{path(offset(pts, cx, cy, -2.2 * k))}" fill="none" stroke="{GOLD}" stroke-width=".35" opacity=".45"/>'
    # hachured hills and little trees
    for _ in range(int(r / 5)):
        hx, hy = cx + rnd.uniform(-.7, .7) * r, cy + rnd.uniform(-.35, .25) * r
        hs = rnd.uniform(3, 6) * k
        s += f'<path d="M{hx - hs:.1f} {hy:.1f} Q{hx:.1f} {hy - hs * 1.3:.1f} {hx + hs:.1f} {hy:.1f}" stroke="{GOLD}" stroke-width=".7" fill="none" opacity=".55"/>'
        s += ''.join(f'<path d="M{hx - hs * .5 + q * hs * .33:.1f} {hy - hs * .55:.1f} l{-.8 * k:.1f} {hs * .5:.1f}" stroke="{GOLD}" stroke-width=".4" opacity=".4"/>' for q in range(3))
    for _ in range(int(r / 4)):
        tx, ty = cx + rnd.uniform(-.8, .8) * r, cy + rnd.uniform(-.1, .45) * r
        s += f'<circle cx="{tx:.1f}" cy="{ty:.1f}" r="{1.1 * k:.1f}" fill="none" stroke="{INK}" stroke-width=".45" opacity=".5"/>'
    if name:
        s += f'<text x="{cx + label_dx:.1f}" y="{cy + r * .95 + 12 * k + label_dy:.1f}" text-anchor="middle" font-family="Alegreya, Georgia, serif" font-style="italic" font-size="{14 * k:.1f}" font-weight="700" fill="{GOLD}" opacity=".9" letter-spacing=".05em" stroke="#0e1b26" stroke-width="3" stroke-linejoin="round" paint-order="stroke">{name}</text>'
    return s


def coast(W, H, side, rnd, depth, k=1.0):
    """A long mainland coast along one edge, with bays and the same water-lining."""
    pts = []
    n = 60
    for i in range(n + 1):
        t = i / n
        v = depth * (.6 + .4 * math.sin(t * 7 + 1) * .5 + .25 * math.sin(t * 17)) + rnd.uniform(-4, 4) * k
        if side == 'left':
            pts.append((v, t * H))
        else:
            pts.append((t * W, H - v))
    if side == 'left':
        land = pts + [(-5, H + 5), (-5, -5)]
        nrm = lambda d: [(x + d, y) for x, y in pts]
    else:
        land = pts + [(W + 5, H + 5), (-5, H + 5)]
        nrm = lambda d: [(x, y - d) for x, y in pts]
    s = ''
    for dd, op in ((3, .34), (6.5, .22), (10.5, .14), (15, .08), (21, .05)):
        s += f'<path d="{path(nrm(dd * k), close=False)}" fill="none" stroke="{INK}" stroke-width=".55" opacity="{op}"/>'
    s += f'<path d="{path(land)}" fill="{LAND}" stroke="{GOLD}" stroke-width=".9" opacity=".95"/>'
    # coastal hills
    for i in range(3, n - 2, 4):
        x, y = pts[i]
        hx, hy = (x - depth * .45, y) if side == 'left' else (x, y + depth * .45)
        hs = 4 * k
        s += f'<path d="M{hx - hs:.1f} {hy:.1f} Q{hx:.1f} {hy - hs * 1.3:.1f} {hx + hs:.1f} {hy:.1f}" stroke="{GOLD}" stroke-width=".6" fill="none" opacity=".45"/>'
    return s, pts


def frame(W, H, m=10, k=1.0):
    """Double border with alternating degree bars and minute ticks, like the neat-line of an old chart."""
    s = f'<rect x="{m}" y="{m}" width="{W - 2 * m}" height="{H - 2 * m}" fill="none" stroke="{GOLD}" stroke-width=".9" opacity=".45"/>'
    s += f'<rect x="{m + 6 * k}" y="{m + 6 * k}" width="{W - 2 * m - 12 * k}" height="{H - 2 * m - 12 * k}" fill="none" stroke="{GOLD}" stroke-width=".5" opacity=".4"/>'
    step = 28 * k
    bars = ''
    x = m
    i = 0
    while x < W - m:
        x2 = min(x + step, W - m)
        if i % 2 == 0:
            bars += f'<rect x="{x:.1f}" y="{m:.1f}" width="{x2 - x:.1f}" height="{6 * k:.1f}"/><rect x="{x:.1f}" y="{H - m - 6 * k:.1f}" width="{x2 - x:.1f}" height="{6 * k:.1f}"/>'
        x, i = x2, i + 1
    y, i = m, 0
    while y < H - m:
        y2 = min(y + step, H - m)
        if i % 2 == 0:
            bars += f'<rect x="{m:.1f}" y="{y:.1f}" width="{6 * k:.1f}" height="{y2 - y:.1f}"/><rect x="{W - m - 6 * k:.1f}" y="{y:.1f}" width="{6 * k:.1f}" height="{y2 - y:.1f}"/>'
        y, i = y2, i + 1
    s += f'<g fill="{GOLD}" opacity=".16">{bars}</g>'
    return s


def scale_bar(x, y, w, k=1.0):
    seg = w / 6
    s = f'<g opacity=".55">'
    for i in range(6):
        s += f'<rect x="{x + i * seg:.1f}" y="{y}" width="{seg:.1f}" height="{4 * k:.1f}" fill="{GOLD if i % 2 == 0 else "none"}" stroke="{GOLD}" stroke-width=".6"/>'
    s += f'<text x="{x + w / 2:.1f}" y="{y - 5 * k:.1f}" text-anchor="middle" font-family="Alegreya SC, Georgia, serif" font-size="{9.5 * k:.1f}" fill="{GOLD}" letter-spacing=".12em">МОРСКИЕ ЛИГИ</text>'
    for i in range(0, 7, 2):
        s += f'<text x="{x + i * seg:.1f}" y="{y + 14 * k:.1f}" text-anchor="middle" font-family="Old Standard TT, Georgia, serif" font-size="{8.5 * k:.1f}" fill="{GOLD}">{i * 5}</text>'
    return s + '</g>'


def cartouche(x, y, w, h, title, sub, k=1.0):
    s = f'<g opacity=".5">'
    s += f'<path d="M{x} {y + h / 2} Q{x} {y} {x + h / 2} {y} H{x + w - h / 2} Q{x + w} {y} {x + w} {y + h / 2} Q{x + w} {y + h} {x + w - h / 2} {y + h} H{x + h / 2} Q{x} {y + h} {x} {y + h / 2} Z" fill="none" stroke="{GOLD}" stroke-width=".9"/>'
    s += f'<path d="M{x - 10 * k} {y + h / 2} C {x - 4 * k} {y + h * .1} {x + 4 * k} {y + h * .1} {x + 2 * k} {y + h / 2} M{x + w + 10 * k} {y + h / 2} C {x + w + 4 * k} {y + h * .9} {x + w - 4 * k} {y + h * .9} {x + w - 2 * k} {y + h / 2}" stroke="{GOLD}" stroke-width=".8" fill="none"/>'
    s += f'<text x="{x + w / 2}" y="{y + h * .48}" text-anchor="middle" font-family="Alegreya SC, Georgia, serif" font-weight="700" font-size="{12 * k:.1f}" fill="{GOLD}" letter-spacing=".1em">{title}</text>'
    s += f'<text x="{x + w / 2}" y="{y + h * .8}" text-anchor="middle" font-family="Alegreya, Georgia, serif" font-style="italic" font-size="{9.5 * k:.1f}" fill="{GOLD}">{sub}</text>'
    return s + '</g>'


def marks(rnd, W, H, avoid, k=1.0, n_sound=60):
    s = ''
    # soundings
    t = []
    for _ in range(n_sound):
        x, y = rnd.uniform(30, W - 30), rnd.uniform(30, H - 30)
        if any((x - ax) ** 2 + (y - ay) ** 2 < ar ** 2 for ax, ay, ar in avoid):
            continue
        t.append(f'<text x="{x:.0f}" y="{y:.0f}">{rnd.choice([3, 5, 7, 8, 9, 12, 14, 15, 18, 22, 25, 31, 36, 40])}</text>')
    s += f'<g font-family="Alegreya, Georgia, serif" font-style="italic" font-size="{9 * k:.1f}" fill="{INK}" opacity=".3">{"".join(t)}</g>'
    # wrecks, rocks and anchorages
    for _ in range(5):
        x, y = rnd.uniform(60, W - 60), rnd.uniform(60, H - 60)
        s += f'<g opacity=".4" stroke="{INK}" stroke-width=".7"><path d="M{x - 5 * k} {y} H{x + 5 * k} M{x} {y - 3 * k} V{y + 3 * k}"/><circle cx="{x - 6.5 * k}" cy="{y}" r=".7" fill="{INK}"/><circle cx="{x + 6.5 * k}" cy="{y}" r=".7" fill="{INK}"/></g>'
    for _ in range(4):
        x, y = rnd.uniform(60, W - 60), rnd.uniform(60, H - 60)
        s += f'<g opacity=".35" fill="none" stroke="{GOLD}" stroke-width=".7"><circle cx="{x}" cy="{y - 4 * k}" r="{1.2 * k}"/><path d="M{x} {y - 2.8 * k} V{y + 4 * k} M{x - 3 * k} {y - 1 * k} H{x + 3 * k} M{x - 4 * k} {y + 1.5 * k} Q{x} {y + 6 * k} {x + 4 * k} {y + 1.5 * k}"/></g>'
    for _ in range(10):
        x, y = rnd.uniform(40, W - 40), rnd.uniform(40, H - 40)
        s += f'<text x="{x:.0f}" y="{y:.0f}" font-size="{8 * k:.1f}" fill="{INK}" opacity=".3">+</text>'
    return s


def little_ship(x, y, k=1.0, flip=False):
    sx = -1 if flip else 1
    return (f'<g opacity=".35" transform="translate({x} {y}) scale({sx * k} {k})" fill="none" stroke="{GOLD}" stroke-width=".8">'
            '<path d="M-12 0 Q0 6 12 0 L10 -2 H-10 Z" fill="#1a2a36"/><path d="M-4 -2 V-20 M4 -2 V-16"/>'
            '<path d="M-4 -19 Q2 -15 -4 -9 M-4 -9 Q3 -6 -4 -3 M4 -15 Q9 -11 4 -7"/><path d="M-4 -20 l5 1.5 -5 1.5"/>'
            '<path d="M-16 3 q3 -1.5 6 0 M10 3 q3 -1.5 6 0" stroke="#7fb4c8" stroke-width=".5"/></g>')


def serpent(x, y, k=1.0):
    return (f'<g opacity=".38" fill="none" stroke="{GOLD}" stroke-width="1" stroke-linecap="round" transform="translate({x} {y}) scale({k})">'
            '<path d="M0 10 C 6 0 12 0 16 8 M22 10 C 28 -2 36 -2 40 8 M46 10 C 52 2 58 4 60 10"/>'
            '<path d="M60 10 C 64 4 70 2 74 4 L80 2 L76 7 C 74 10 68 10 64 10"/><circle cx="73" cy="4.6" r=".8" fill="#c9a048"/>'
            '<path d="M62 4 l2 -5 l2 4 M66 3 l2 -5 l2 4" stroke-width=".7"/>'
            '<path d="M-6 12 C 0 13 4 11 8 12 M18 12 C 24 13 30 11 36 12 M44 12 C 50 13 54 11 58 12" stroke-width=".6" opacity=".7"/></g>')




from engraved import engraved_ship


def town(x, y, name, k=1.0, dx=0, dy=14, anchor='middle'):
    """Town glyph as on old charts: walls, a church with a spire, roofs; name in small caps."""
    g = f'<g opacity=".7" stroke="{GOLD}" stroke-width=".6" fill="{LAND}">'
    g += f'<path d="M{x - 7 * k} {y + 3 * k} H{x + 7 * k} V{y - 1 * k} H{x - 7 * k} Z"/>'
    for i in range(4):
        hx = x - 6 * k + i * 3.6 * k
        g += f'<path d="M{hx} {y - 1 * k} l{1.6 * k} {-2.2 * k} l{1.6 * k} {2.2 * k}"/>'
    g += f'<path d="M{x + 2 * k} {y - 1 * k} V{y - 6 * k} L{x + 3 * k} {y - 9 * k} L{x + 4 * k} {y - 6 * k} V{y - 1 * k}"/>'
    g += f'<path d="M{x + 3 * k} {y - 9 * k} V{y - 11 * k} M{x + 2.2 * k} {y - 10.2 * k} H{x + 3.8 * k}" fill="none"/></g>'
    g += f'<circle cx="{x}" cy="{y + 5 * k}" r="{1.2 * k}" fill="{RED}" opacity=".7"/>'
    g += f'<text x="{x + dx}" y="{y + dy * k}" text-anchor="{anchor}" font-family="Alegreya SC, Georgia, serif" font-size="{9.5 * k:.1f}" fill="{GOLD}" opacity=".65" letter-spacing=".06em">{name}</text>'
    return g


def forest(x, y, n, rnd, k=1.0):
    g = f'<g opacity=".55" fill="none" stroke="{GOLD}" stroke-width=".5">'
    for _ in range(n):
        tx, ty = x + rnd.uniform(-14, 14) * k, y + rnd.uniform(-5, 5) * k
        g += f'<path d="M{tx:.1f} {ty + 2 * k:.1f} V{ty:.1f} M{tx - 1.6 * k:.1f} {ty:.1f} Q{tx:.1f} {ty - 3.4 * k:.1f} {tx + 1.6 * k:.1f} {ty:.1f} Z"/>'
    return g + '</g>'


def shoal(x, y, r, rnd, k=1.0):
    """Sandbank: stipple dots in an oval, as engravers marked shallows."""
    d = ''.join(f'<circle cx="{x + rnd.gauss(0, r * .5):.1f}" cy="{y + rnd.gauss(0, r * .22):.1f}" r=".45"/>' for _ in range(int(r * 3)))
    return f'<g fill="{GOLD}" opacity=".45">{d}</g>'


def reef(x, y, k=1.0):
    g = f'<g stroke="{INK}" stroke-width=".7" opacity=".55">'
    for dx, dy in ((0, 0), (5, 2), (-4, 3), (2, 5)):
        g += f'<path d="M{x + dx - 1.6 * k} {y + dy} h{3.2 * k} M{x + dx} {y + dy - 1.6 * k} v{3.2 * k}"/>'
    g += '</g>'
    return g + f'<text x="{x + 9}" y="{y + 5}" font-family="Alegreya, Georgia, serif" font-style="italic" font-size="{8 * k:.1f}" fill="{INK}" opacity=".45">рифы</text>'


def isobath(pts_fn, rnd, op=.22):
    return ''


# Each screen gets its own chart; features are placed where the screen leaves them visible.
VARIANTS = {
    # start screen: the strip under the sea scene (1366x320); cards cover y 16..216, the tool row y 238..278
    'main': dict(W=1366, H=320, seed=11, coast=('left', 46), sea_name=('Карибское море', .5, .972, 15),
                 isles=[(.1, .86, 18, 'Тортуга'), (.82, .9, 22, None), (.97, .12, 10, None)],
                 towns=[], forests=[(.02, .5, 5)],
                 shoals=[(.2, .93, 14), (.74, .95, 12)], reefs=[(.27, .82)],
                 roses=[(.955, .58, 46, .55)], rhumbs=[(.5, .7, 900), (.955, .58, 600)],
                 egg=('здесь водятся боты', .2, .72), lat=('18°', '17°'), lon=(),
                 route=[(.25, .9), (.38, .915), (.5, .9), (.62, .915), (.76, .9)], serpent=(.3, .62),
                 anchored=(.92, .9, .34), gulls=(.1, .3), frame=False, light=True),
    # team selection: the Windward Passage; open areas are the top band, the margins and the bottom row
    'prep': dict(W=1366, H=660, seed=21, coast=('left', 30), sea_name=('Наветренный пролив', .44, .905, 14),
                 isles=[(.1, .1, 40, 'Куба'), (.88, .1, 44, 'Эспаньола'), (.56, .935, 15, None), (.965, .64, 11, 'Тортуга')],
                 towns=[(.865, .2, 'Порт-де-Пэ', 'middle', 12), (.11, .19, 'Сантьяго', 'middle', 12)],
                 forests=[(.07, .07, 8), (.9, .06, 9)], shoals=[(.42, .94, 16), (.6, .95, 14), (.25, .18, 14)],
                 reefs=[(.33, .9), (.7, .07)], roses=[(.035, .56, 54, .55)], rhumbs=[(.5, .5, 900), (.035, .56, 700)],
                 cartouche=None,
                 egg=('тут был шторм', .31, .86), lat=('21°', '20°', '19°', '18°'), lon=('76°', '75°', '74°', '73°', '72°'),
                 route=[(.33, .965), (.42, .955), (.52, .97), (.62, .955), (.72, .965)], serpent=(.73, .07),
                 anchored=(.61, .085, .42), gulls=(.62, .03), frame=True, light=True),
    # network: Tortuga's harbour; open areas are the bottom band and the corners
    'net': dict(W=1366, H=660, seed=31, coast=('bottom', 22), sea_name=('Бухта Кайон', .5, .975, 15),
                isles=[(.69, .92, 30, None), (.15, .9, 12, None), (.06, .14, 14, None), (.95, .3, 10, None)],
                towns=[(.69, .87, 'Кайон', 'middle', -10), (.06, .2, 'Пор-Марго', 'middle', 13)],
                forests=[(.73, .94, 8)], shoals=[(.32, .92, 16), (.85, .9, 12), (.04, .45, 10)],
                reefs=[(.25, .86), (.9, .4)], roses=[(.91, .19, 60, .5)], rhumbs=[(.5, .6, 900), (.91, .19, 700)],
                egg=('ром здесь', .57, .9), lat=('20°05′', '20°00′', '19°55′'), lon=('73°00′', '72°50′', '72°40′'),
                route=[(.08, .86), (.2, .9), (.33, .87), (.46, .9), (.6, .88)], serpent=(.83, .75),
                anchored=(.78, .95, .36), gulls=(.3, .82), frame=True, light=True),
    'phone-main': dict(W=390, H=560, seed=41, coast=('bottom', 18), sea_name=('Карибское море', .5, .935, 11),
                       isles=[(.82, .93, 12, None), (.12, .92, 9, None)], towns=[], forests=[], shoals=[(.5, .94, 12)], reefs=[],
                       roses=[(.86, .78, 30, .5)], rhumbs=[(.5, .8, 700)], egg=None, lat=(), lon=(),
                       route=[(.18, .9), (.35, .92), (.52, .9), (.68, .92)], serpent=(.03, .72), anchored=None, gulls=(.2, .73),
                       frame=False, sail=False, phone=True, light=False),
    'phone': dict(W=390, H=844, seed=51, coast=('bottom', 16), sea_name=('Наветренный пролив', .5, .99, 11),
                  isles=[(.86, .06, 14, None), (.08, .97, 9, None)], towns=[], forests=[], shoals=[(.5, .97, 10)], reefs=[],
                  roses=[(.88, .5, 30, .45)], rhumbs=[(.5, .6, 900)], egg=None, lat=(), lon=(),
                  route=[(.16, .955), (.35, .965), (.55, .955), (.72, .965)], serpent=(.02, .45), anchored=None, gulls=(.7, .03),
                  frame=True, phone=True, light=False),
}


def chart_v(name):
    v = VARIANTS[name]
    W, H = v['W'], v['H']
    rnd = random.Random(v['seed'])
    phone = v.get('phone', False)
    k = .85 if phone else 1.0
    s = [f'<svg xmlns="http://www.w3.org/2000/svg" width="{W}" height="{H}" viewBox="0 0 {W} {H}">']
    s.append('<defs>'
             f'<radialGradient id="vg" cx=".5" cy=".45" r=".75"><stop offset=".55" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".45"/></radialGradient>'
             f'<linearGradient id="topfade" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0e1b26"/><stop offset="1" stop-color="#0e1b26" stop-opacity="0"/></linearGradient>'
             f'<pattern id="gr" width="56" height="56" patternUnits="userSpaceOnUse"><path d="M56 0 H0 V56" fill="none" stroke="{INK}" stroke-width=".7" opacity=".08"/></pattern>'
             f'<filter id="grain" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves="2" seed="{v["seed"]}"/><feColorMatrix values="0 0 0 0 .5  0 0 0 0 .7  0 0 0 0 .8  0 0 0 .05 0"/></filter>'
             f'<filter id="stain" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency=".006" numOctaves="3" seed="{v["seed"] + 3}"/><feColorMatrix values="0 0 0 0 .35  0 0 0 0 .5  0 0 0 0 .6  0 0 0 .12 -.02"/></filter>'
             '</defs>')
    s.append(f'<rect width="{W}" height="{H}" fill="#0e1b26"/><rect width="{W}" height="{H}" filter="url(#stain)"/><rect width="{W}" height="{H}" fill="url(#gr)"/>')
    for cx, cy, L in v['rhumbs']:
        s.append(rhumbs(W * cx, H * cy, L, .1))
    side, depth = v['coast']
    cs, _ = coast(W, H, side, rnd, depth * k, k)
    s.append(cs)
    avoid = []
    for cx, cy, r, nm in v['isles']:
        s.append(isle(W * cx, H * cy, r * k, rnd, nm, k=k))
        avoid.append((W * cx, H * cy, r * 2.2))
    for x, y, n in v.get('forests', []):
        s.append(forest(W * x, H * y, n, rnd, k))
    for x, y, nm, anc, dy in v.get('towns', []):
        s.append(town(W * x, H * y, nm, k, dy=dy, anchor=anc))
        avoid.append((W * x, H * y, 40))
    for x, y, r in v.get('shoals', []):
        s.append(shoal(W * x, H * y, r * k, rnd, k))
    for x, y in v.get('reefs', []):
        s.append(reef(W * x, H * y, k))
        avoid.append((W * x, H * y, 30))
    nm, nx, ny, fs = v['sea_name']
    s.append(f'<text x="{W * nx:.0f}" y="{H * ny:.0f}" text-anchor="middle" font-family="Alegreya, Georgia, serif" font-style="italic" font-size="{fs + 3}" font-weight="700" fill="{INK}" opacity=".7" letter-spacing=".42em" stroke="#0e1b26" stroke-width="3.5" stroke-linejoin="round" paint-order="stroke">{nm}</text>')
    for cx, cy, r, op in v['roses']:
        s.append(rose(W * cx, H * cy, r * k, op))
        avoid.append((W * cx, H * cy, r * 1.3))
    if v.get('cartouche'):
        t, sub, cx, cy = v['cartouche']
        s.append(cartouche(W * cx - 115, H * cy - 17, 230, 34, t, sub))
        avoid.append((W * cx, H * cy, 130))
    if v.get('anchored'):
        ax, ay, sc = v['anchored']
        s.append(f'<g opacity=".55" transform="translate({W * ax - 56 * sc:.1f} {H * ay - 80 * sc:.1f}) scale({sc})">{engraved_ship("st" + name.replace("-", ""), GOLD, "#0e1b26", 1.1)}</g>')
        avoid.append((W * ax, H * ay - 20, 50))
    s.append(marks(rnd, W, H, avoid, k, int(W * H / 9000)))
    if v.get('egg'):
        t, ex, ey = v['egg']
        s.append(f'<text x="{W * ex:.0f}" y="{H * ey:.0f}" text-anchor="middle" font-family="Alegreya, Georgia, serif" font-style="italic" font-size="12" fill="{GOLD}" opacity=".45" transform="rotate(-6 {W * ex:.0f} {H * ey:.0f})">{t}</text>')
    route = [(W * x, H * y) for x, y in v['route']]
    d = 'M' + f'{route[0][0]:.1f} {route[0][1]:.1f}' + ''.join(
        f' Q{(route[i][0] + route[i + 1][0]) / 2:.1f} {(route[i][1] + route[i + 1][1]) / 2 - 6:.1f} {route[i + 1][0]:.1f} {route[i + 1][1]:.1f}' for i in range(len(route) - 1))
    s.append(f'<path d="{d}" stroke="{RED}" stroke-width="1" stroke-dasharray="4 3" fill="none" opacity=".5"/>')
    ex, ey = route[-1]
    s.append(f'<path d="M{ex - 4} {ey - 4} L{ex + 4} {ey + 4} M{ex + 4} {ey - 4} L{ex - 4} {ey + 4}" stroke="{RED}" stroke-width="1.7" opacity=".7"/>')
    for i, lat in enumerate(v['lat']):
        y = 40 + i * (H - 80) / max(1, len(v['lat']) - 1)
        s.append(f'<text x="24" y="{y:.0f}" font-family="Old Standard TT, Georgia, serif" font-size="10" fill="{INK}" opacity=".45">{lat}</text>')
        s.append(f'<text x="{W - 24}" y="{y:.0f}" text-anchor="end" font-family="Old Standard TT, Georgia, serif" font-size="10" fill="{INK}" opacity=".45">{lat}</text>')
    for i, lon in enumerate(v['lon']):
        x = 70 + i * (W - 140) / max(1, len(v['lon']) - 1)
        s.append(f'<text x="{x:.0f}" y="{H - 22}" text-anchor="middle" font-family="Old Standard TT, Georgia, serif" font-size="10" fill="{INK}" opacity=".45">{lon}</text>')
    if v.get('frame'):
        s.append(frame(W, H, 6 if phone else 10, .8 if phone else 1.0))
    s.append(f'<rect width="{W}" height="{H}" filter="url(#grain)"/><rect width="{W}" height="{H}" fill="url(#vg)"/>')
    if name in ('main', 'phone-main'):
        s.append(f'<rect width="{W}" height="26" fill="url(#topfade)"/>')
    s.append('</svg>')
    return ''.join(s), route


def anim_layer(name, left=0, top=0):
    """Animated pieces over the static chart, one 18 s loop, transform and opacity only:
    the engraved ship sails the dashed route with a wake and fades at both ends; the big rose's needle swings;
    the serpent surfaces; a pair of gulls crosses; small breakers pulse on the coast; a candle-like light drifts over the paper."""
    v = VARIANTS[name]
    W, H = v['W'], v['H']
    _, route = chart_v(name)
    L = [0]
    for i in range(1, len(route)):
        L.append(L[-1] + math.dist(route[i - 1], route[i]))
    tot = L[-1]
    x0, y0 = route[0]
    kf = ['0%{transform:translate(0,0);opacity:0}', '6%{opacity:1}']
    for i, (x, y) in enumerate(route):
        pct = 2 + 86 * L[i] / tot
        kf.append(f'{pct:.1f}%{{transform:translate({x - x0:.1f}px,{y - y0:.1f}px)}}')
    xe, ye = route[-1]
    kf.append(f'84%{{opacity:1}}')
    kf.append(f'92%{{transform:translate({xe - x0:.1f}px,{ye - y0:.1f}px);opacity:0}}')
    kf.append(f'100%{{transform:translate({xe - x0:.1f}px,{ye - y0:.1f}px);opacity:0}}')
    uid = name.replace('-', '')
    css = (f'@keyframes sail{uid}{{{"".join(kf)}}}.sail{uid}{{animation:sail{uid} 18s linear infinite}}')
    k = .85 if v.get('phone') else 1.0
    sc = .36 * k
    ship = engraved_ship('an' + uid, GOLD, '#0e1b26', 1.2)
    out = (f'<svg aria-hidden="true" class="chartAnim" width="{W}" height="{H}" viewBox="0 0 {W} {H}" style="position: absolute; left: {left}px; top: {top}px; pointer-events: none; overflow: visible">')
    if v.get('light'):
        out += (f'<defs><radialGradient id="cl{uid}" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#ffe6a8" stop-opacity=".09"/><stop offset="1" stop-color="#ffe6a8" stop-opacity="0"/></radialGradient></defs>'
                f'<g class="chartLight"><ellipse cx="{W * .2}" cy="{H * .5}" rx="{W * .3}" ry="{H * .6}" fill="url(#cl{uid})"/></g>')
    # breakers on the coast: short arcs that swell and fade, staggered
    side, depth = v['coast']
    for i in range(7):
        if side == 'left':
            bx, by = depth * k + 10, H * (.12 + i * .12)
            d = f'M{bx} {by - 5} q4 5 0 10'
        else:
            bx, by = W * (.08 + i * .13), H - depth * k - 9
            d = f'M{bx - 6} {by} q6 -4 12 0'
        out += f'<path class="brk b{i % 4}" d="{d}" stroke="{INK}" stroke-width=".9" fill="none" stroke-linecap="round"/>'
    # wake: three short curves behind the ship, travelling with it
    wake = ''.join(f'<path class="wk w{j}" d="M{-6 - j * 9} {84 + j * .6} q-4 -2 -8 0" stroke="{GOLD}" stroke-width="1.2" fill="none"/>' for j in range(3))
    if v.get('sail', True):
        out += (f'<g class="sail{uid}" style="transform-origin:{x0}px {y0}px"><g transform="translate({x0 - 56 * sc:.1f} {y0 - 80 * sc:.1f}) scale({sc})">'
                f'<g class="bobc">{ship}{wake}</g></g></g>')
    cx, cy, r, _ = v['roses'][0]
    cx, cy, r = W * cx, H * cy, r * k
    out += (f'<g class="needle" style="transform-origin:{cx:.1f}px {cy:.1f}px"><path d="M{cx:.1f} {cy - r * .7:.1f} L{cx + r * .05:.1f} {cy:.1f} L{cx:.1f} {cy + r * .5:.1f} L{cx - r * .05:.1f} {cy:.1f} Z" fill="{RED}" opacity=".6"/>'
            f'<path d="M{cx:.1f} {cy - r * .7:.1f} L{cx + r * .05:.1f} {cy:.1f} L{cx:.1f} {cy:.1f} Z" fill="#f0d27a" opacity=".7"/><circle cx="{cx:.1f}" cy="{cy:.1f}" r="{r * .045:.1f}" fill="#f0d27a" opacity=".85"/></g>')
    sx, sy = v['serpent']
    out += f'<g class="serp">{serpent(W * sx, H * sy, .9 * k)}</g>'
    if v.get('gulls'):
        gx, gy = W * v['gulls'][0], H * v['gulls'][1]
        g = ''.join(f'<path class="gw g{j}" d="M{gx + j * 11:.1f} {gy + (j % 2) * 5:.1f} q3 -3 6 0 q3 -3 6 0" stroke="{GOLD}" stroke-width=".9" fill="none" stroke-linecap="round"/>' for j in range(2))
        out += f'<g class="gfly">{g}</g>'
    out += '</svg>'
    return out, css


CHART_CSS = ('@keyframes needle{0%,100%{rotate:-7deg}30%{rotate:5deg}55%{rotate:-2deg}75%{rotate:8deg}}.needle{animation:needle 9s ease-in-out infinite}'
             '@keyframes serp{0%,100%{transform:translateY(3px);opacity:.45}50%{transform:translateY(-2px);opacity:1}}.serp{animation:serp 6s ease-in-out infinite}'
             '@keyframes bobc{0%,100%{transform:translateY(0) rotate(-1.5deg)}50%{transform:translateY(-2px) rotate(1.5deg)}}.bobc{transform-box:fill-box;transform-origin:50% 90%;animation:bobc 3s ease-in-out infinite}'
             '@keyframes wk{0%{opacity:.8;transform:translateX(0)}100%{opacity:0;transform:translateX(-10px)}}.wk{animation:wk 1.5s linear infinite}.wk.w1{animation-delay:-.5s}.wk.w2{animation-delay:-1s}'
             '@keyframes brk{0%,100%{opacity:0;transform:scale(.6)}40%{opacity:.7;transform:scale(1)}70%{opacity:0;transform:scale(1.15)}}.brk{transform-box:fill-box;transform-origin:center;animation:brk 4.5s ease-out infinite}'
             '.brk.b1{animation-delay:-1.1s}.brk.b2{animation-delay:-2.3s}.brk.b3{animation-delay:-3.4s}'
             '@keyframes gfly{0%{transform:translate(-40px,6px);opacity:0}10%{opacity:.8}90%{opacity:.8}100%{transform:translate(260px,-14px);opacity:0}}.gfly{animation:gfly 18s linear infinite}'
             '@keyframes gw{0%,100%{transform:scaleY(1)}50%{transform:scaleY(.4)}}.gw{transform-box:fill-box;transform-origin:center;animation:gw .8s ease-in-out infinite}.gw.g1{animation-delay:-.3s}'
             '@keyframes cl{0%,100%{transform:translate(0,0)}50%{transform:translate(55vw,4%)}}.chartLight{animation:cl 18s ease-in-out infinite}'
             '@media (prefers-reduced-motion: reduce){.chartAnim *{animation:none !important}}')


if __name__ == '__main__':
    out = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'out', 'assets', 'bg')
    os.makedirs(out, exist_ok=True)
    for f in os.listdir(out):
        os.remove(os.path.join(out, f))
    for n in VARIANTS:
        open(os.path.join(out, f'chart-{n}.svg'), 'w').write(chart_v(n)[0])
    print('ok', sorted(os.listdir(out)))
