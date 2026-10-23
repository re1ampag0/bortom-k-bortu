import json, math, random, re

ROOT = '/mnt/user-data/outputs/artifacts/41bf931a-5c39-4a8a-a663-7380390e04bd/project/'
MAIN = open('/home/claude/gen/project_mine/Main.dc.html', encoding='utf-8').read()
ML = MAIN.split('\n')
WX = json.load(open('/home/claude/gen/wx.json'))
DATA = {c['key']: c for c in json.load(open('/home/claude/bortom-k-bortu/data/game-data.json'))['sea']}

SHIPS = {
    'pearl': ('/_blob/da92de2ad61e32aa7ae69311983778f1', 'Чёрная жемчужина'),
    'revenge': ('/_blob/ea4ab3c34b3858e30fff24482f1f91ef', 'Месть королевы Анны'),
    'merchant': ('/_blob/158c3bcb1a99eebbde66c1dc54ebe467', 'Торговое судно'),
    'endeavour': ('/_blob/57141ce866f43ae8f95e1d9685efe44a', 'Индевор'),
    'dutch': ('/_blob/3e7fef2a992d1ad7503a6cd4bea56b5c', 'Летучий голландец'),
    'company': ('/_blob/822d304f4a8b0d7762e66d56b6cebc81', 'Флагман Компании'),
}

# ---------- template parts from the Буря artboard ----------
HEAD = '\n'.join(ML[:118])            # up to the last CSS rule, </style> follows
ROOT_OPEN = ML[120]
BACK_SEA = ML[125] + '\n' + ML[126]
FRONT_SEA = re.sub(r'<span class="ws-spk".*$', '', ML[128] + '\n' + ML[129] + '\n' + ML[130])
PLAQUE_BOLTS = ML[132][ML[132].index('<span aria-hidden'):]
PLAQUE_OPEN = ML[132].split('<span aria-hidden')[0]
CLOSE_BTN = '\n'.join(ML[137:140])
GULLS = None  # filled from Tortuga below
TORT = open('/home/claude/gen/project_mine/Tortuga.dc.html', encoding='utf-8').read().split('\n')
for l in TORT:
    if 'class="w-gulls"' in l:
        GULLS = l.strip()
        break

SEA_COLORS = ['#2a4656', '#08141c', '#b8ccd6', '#02080c', '#e6f0f4']


def sea(part, pal, crest=1.0, top=None):
    s = BACK_SEA if part == 'back' else FRONT_SEA
    for a, b in zip(SEA_COLORS, pal):
        s = s.replace(a, b)
    if crest != 1.0:
        def mul(m):
            v = float(m.group(1)) * crest
            return f'opacity="{v:.2f}"'
        head, rest = s.split('</defs>', 1)
        rest = re.sub(r'opacity="([0-9.]+)"', mul, rest)
        s = head + '</defs>' + rest
    return s


def ship(kind, x, h, cls='w-calm', flip=False, wl=166, z=2, extra='', alt=None, style='', inner_style=''):
    src, name = SHIPS[kind]
    w = round(h * 120 / 78)
    top = round(wl - h * 71 / 78)
    fl = 'transform: scaleX(-1); ' if flip else ''
    a = alt if alt is not None else f'«{name}»'
    alt_attr = f'alt="{a}"' if a else 'alt="" aria-hidden="true"'
    return (f'<div class="{cls}" style="position: absolute; left: {x}px; top: {top}px; width: {w}px; height: {h}px; z-index: {z}; {style}">'
            f'<img src="{src}" {alt_attr} style="width: {w}px; height: {h}px; display: block; {fl}{inner_style}">{extra}</div>')


def spk(points):
    return ''.join(f'<span class="ws-spk" aria-hidden="true" style="left: {x}px; top: {y}px; animation-delay: -{d:.2f}s"></span>' for x, y, d in points)


# ---------- typography ----------
SHORT = ['в', 'и', 'к', 'с', 'у', 'о', 'а', 'на', 'по', 'до', 'за', 'не', 'из', 'от', 'то', 'же']


def nb(s):
    s = re.sub(r'(?<![\w])(\d+|' + '|'.join(SHORT) + r') ', lambda m: m.group(1) + '&nbsp;', s)
    s = re.sub(r'(?i)(?<![\w])(В|И|К|С|У|О|А|На|По|До|За|Не|Из|От) ', lambda m: m.group(1) + '&nbsp;', s)
    return s


ROMAN = ['', 'I', 'II', 'III', 'IV', 'V', 'VI']

# ---------- richer chart background ----------


def chart_bg(w, h, top, seed=7):
    R = random.Random(seed)
    o = []
    o.append(f'<svg aria-hidden="true" width="{w}" height="{h}" viewBox="0 0 {w} {h}" style="position: absolute; left: 0; top: {top}px; pointer-events: none">')
    o.append('<defs><radialGradient id="wvig" cx=".45" cy=".35" r=".8"><stop offset=".5" stop-color="#000" stop-opacity="0"></stop><stop offset="1" stop-color="#000" stop-opacity=".5"></stop></radialGradient>'
             '<linearGradient id="wgold" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff0b8"></stop><stop offset=".4" stop-color="#d9ae52"></stop><stop offset="1" stop-color="#8a6420"></stop></linearGradient>'
             '<radialGradient id="nbland" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#1c3a48"></stop><stop offset="1" stop-color="#14303d"></stop></radialGradient>'
             '<radialGradient id="nbglow" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#1d3a4c" stop-opacity=".9"></stop><stop offset="1" stop-color="#0e1b26" stop-opacity="0"></stop></radialGradient>'
             '<pattern id="nbhatch" width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(35)"><path d="M0 0 V5" stroke="#7fb4c8" stroke-width=".6" opacity=".35"></path></pattern>'
             '</defs>')
    o.append(f'<rect width="{w}" height="{h}" fill="#0e1b26"></rect>')
    # soft patches of deeper / shallower water
    for _ in range(5 if w > 500 else 6):
        cx, cy, r = R.uniform(0, w), R.uniform(0, h), R.uniform(90, 200)
        o.append(f'<ellipse cx="{cx:.0f}" cy="{cy:.0f}" rx="{r:.0f}" ry="{r*.6:.0f}" fill="url(#nbglow)" opacity=".55"></ellipse>')
    # graticule: meridians and parallels, dashed, with ticks and degrees on the edges
    step = 76
    g = ['<g stroke="#7fb4c8" stroke-width=".6" fill="none" opacity=".09" stroke-dasharray="2 4">']
    for x in range(38, w, step):
        g.append(f'<path d="M{x} 0 V{h}"></path>')
    for y in range(34, h, step):
        g.append(f'<path d="M0 {y} H{w}"></path>')
    g.append('</g>')
    o += g
    ticks = ['<g stroke="#9fd2e2" stroke-width=".8" opacity=".22">']
    for x in range(8, w, 8):
        ln = 6 if (x - 38) % step == 0 else (3.5 if x % 16 == 0 else 2)
        ticks.append(f'<path d="M{x} 6 v{ln}"></path>')
    for y in range(16, h, 8):
        ln = 6 if (y - 34) % step == 0 else (3.5 if y % 16 == 0 else 2)
        ticks.append(f'<path d="M6 {y} h{ln}"></path>')
    ticks.append(f'<path d="M6 6 H{w-6} M6 6 V{h-6}"></path></g>')
    o += ticks
    lab = ['<g font-family="Old Standard TT, Georgia, serif" font-style="italic" font-size="9" fill="#9fd2e2" opacity=".3">']
    lon = 74
    for i, x in enumerate(range(38, w - 20, step)):
        lab.append(f'<text x="{x+3}" y="20">{lon - i*2}°</text>')
    lat = 21
    for i, y in enumerate(range(34, h - 10, step)):
        lab.append(f'<text x="14" y="{y-3}">{lat - i}°</text>')
    lab.append('</g>')
    o += lab
    # wavy current lines (as before, fainter)
    for y in range(20, h, 34):
        a, b, c = R.uniform(-20, 20), R.uniform(-20, 20), R.uniform(-20, 20)
        o.append(f'<path d="M-20 {y} C{w*.3:.0f} {y+a:.0f} {w*.6:.0f} {y+b:.0f} {w+20} {y+c:.0f}" stroke="#7fb4c8" stroke-width=".7" fill="none" opacity=".06"></path>')

    # islands with depth contours, shore hatching, hills and a palm
    def island(cx, cy, sc, rot, name=None):
        pts = []
        n = 22
        rr = random.Random(int(cx * 7 + cy))
        rad = [1 + rr.uniform(-.28, .3) for _ in range(n)]
        for i in range(n):
            a = i / n * math.tau
            r = (rad[i] + rad[i - 1] + rad[(i + 1) % n]) / 3
            pts.append((math.cos(a) * r * 1.6, math.sin(a) * r))

        def path(k):
            p = [(x * k, y * k) for x, y in pts]
            d = f'M{p[0][0]:.1f} {p[0][1]:.1f} '
            for i in range(len(p)):
                x0, y0 = p[i]
                x1, y1 = p[(i + 1) % len(p)]
                d += f'Q{x0:.1f} {y0:.1f} {(x0+x1)/2:.1f} {(y0+y1)/2:.1f} '
            return d + 'Z'
        s = [f'<g transform="translate({cx} {cy}) rotate({rot}) scale({sc})">']
        for k, op in [(2.3, .07), (1.85, .09), (1.45, .12)]:
            s.append(f'<path d="{path(k)}" fill="none" stroke="#7fb4c8" stroke-width="{.8/sc:.2f}" stroke-dasharray="{3/sc:.1f} {3/sc:.1f}" opacity="{op}"></path>')
        s.append(f'<path d="{path(1.12)}" fill="url(#nbhatch)" opacity=".7"></path>')
        s.append(f'<path d="{path(1)}" fill="url(#nbland)" stroke="#5f93a8" stroke-width="{1/sc:.2f}" opacity=".85"></path>')
        s.append(f'<path d="{path(.62)}" fill="none" stroke="#4f8296" stroke-width="{.6/sc:.2f}" opacity=".5"></path>')
        # little hills
        for hx in (-12, -2, 8):
            s.append(f'<path d="M{hx-6} 4 Q{hx} -6 {hx+6} 4" fill="none" stroke="#7fb4c8" stroke-width="{.8/sc:.2f}" opacity=".45"></path>')
        s.append(f'<path d="M18 -2 V-12 M18 -12 q-5 -1 -8 3 M18 -12 q5 -2 8 2 M18 -12 q-3 -4 -7 -4 M18 -12 q3 -4 7 -3" fill="none" stroke="#7fb4c8" stroke-width="{.8/sc:.2f}" opacity=".5"></path>')
        s.append('</g>')
        if name:
            s.append(f'<text x="{cx}" y="{cy + 34*sc:.0f}" text-anchor="middle" font-family="Old Standard TT, Georgia, serif" font-style="italic" font-size="10" letter-spacing="1.5" fill="#9fd2e2" opacity=".28">{name}</text>')
        return ''.join(s)

    if w > 500:
        o.append(island(400, 300, 1.25, -8, 'о. Мертвеца'))
        o.append(island(90, 380, 1.6, 12))
        o.append(island(870, 120, 1.1, 20))
    else:
        o.append(island(300, 120, 1.1, -8, 'о. Мертвеца'))
        o.append(island(60, 560, 1.4, 12))
        o.append(island(330, 860, 1.2, 20, 'Тортуга'))

    # depth soundings
    snd = ['<g font-family="Old Standard TT, Georgia, serif" font-style="italic" font-size="9" fill="#9fd2e2" opacity=".22">']
    for _ in range(int(w * h / 5200)):
        x, y = R.uniform(30, w - 20), R.uniform(30, h - 10)
        snd.append(f'<text x="{x:.0f}" y="{y:.0f}">{R.choice([4,5,7,9,11,12,14,17,18,22,24,30,35,40])}</text>')
    snd.append('</g>')
    o += snd

    # compass rose: rhumb lines, 32 points, degree ring, letters, fleur-de-lis
    def rose(cx, cy, R1, op, rhumbs=True):
        s = []
        if rhumbs:
            s.append(f'<g stroke="#9fd2e2" stroke-width=".55" opacity="{op*.45:.2f}">')
            for i in range(32):
                a = i / 32 * math.tau
                s.append(f'<path d="M{cx} {cy} L{cx + math.cos(a)*1400:.0f} {cy + math.sin(a)*1400:.0f}"></path>')
            s.append('</g>')
        s.append(f'<g transform="translate({cx} {cy})" opacity="{op}">')
        s.append(f'<circle r="{R1*1.12:.0f}" fill="none" stroke="#9fd2e2" stroke-width="1.4"></circle>')
        s.append(f'<circle r="{R1*1.02:.0f}" fill="none" stroke="#9fd2e2" stroke-width=".7"></circle>')
        for i in range(72):
            a = i / 72 * math.tau
            r0 = R1 * (0.94 if i % 2 else 0.9)
            s.append(f'<path d="M{math.cos(a)*r0:.1f} {math.sin(a)*r0:.1f} L{math.cos(a)*R1*1.02:.1f} {math.sin(a)*R1*1.02:.1f}" stroke="#9fd2e2" stroke-width=".6"></path>')
        layers = [([i * 22.5 + 11.25 for i in range(16)], R1 * .5, 3.5, '#2f5f74', '#4f8aa0'),
                  ([i * 90 + 45 for i in range(4)], R1 * .74, 6.5, '#4f8aa0', '#7fb4c8'),
                  ([i * 90 for i in range(4)], R1 * .96, 10, '#7fb4c8', '#cfe8f0')]
        for angs, ln, wd, c1, c2 in layers:
            for deg in angs:
                a = math.radians(deg - 90)
                ca, sa = math.cos(a), math.sin(a)
                px, py = -sa * wd, ca * wd
                tx, ty = ca * ln, sa * ln
                s.append(f'<path d="M0 0 L{px:.1f} {py:.1f} L{tx:.1f} {ty:.1f} Z" fill="{c1}"></path><path d="M0 0 L{-px:.1f} {-py:.1f} L{tx:.1f} {ty:.1f} Z" fill="{c2}"></path>')
        s.append(f'<circle r="{R1*.12:.1f}" fill="#0e1b26" stroke="#9fd2e2" stroke-width="1"></circle>')
        # fleur-de-lis on north
        fy = -R1 * 1.12
        s.append(f'<path d="M0 {fy-16:.1f} C3 {fy-10:.1f} 4 {fy-6:.1f} 0 {fy:.1f} C-4 {fy-6:.1f} -3 {fy-10:.1f} 0 {fy-16:.1f} Z M0 {fy-6:.1f} C5 {fy-12:.1f} 11 {fy-9:.1f} 8 {fy-3:.1f} C6 {fy-6:.1f} 3 {fy-5:.1f} 0 {fy-2:.1f} Z M0 {fy-6:.1f} C-5 {fy-12:.1f} -11 {fy-9:.1f} -8 {fy-3:.1f} C-6 {fy-6:.1f} -3 {fy-5:.1f} 0 {fy-2:.1f} Z" fill="#cfe8f0"></path>')
        s.append('<g font-family="Old Standard TT, Georgia, serif" font-weight="700" font-size="13" fill="#cfe8f0" text-anchor="middle">')
        s.append(f'<text x="{R1*1.27:.0f}" y="5">В</text><text x="0" y="{R1*1.3+8:.0f}">Ю</text><text x="{-R1*1.27:.0f}" y="5">З</text>')
        s.append('</g></g>')
        return ''.join(s)

    if w > 500:
        o.append(rose(560, 290, 70, .16))
        o.append(rose(120, 120, 26, .12, rhumbs=False))
    else:
        o.append(rose(250, 520, 64, .16))
        o.append(rose(80, 220, 24, .12, rhumbs=False))

    # wind arrows (as before)
    for _ in range(10 if w > 500 else 14):
        x, y, r = R.uniform(40, w - 40), R.uniform(30, h - 30), R.uniform(-40, 40)
        o.append(f'<g transform="translate({x:.0f} {y:.0f}) rotate({r:.0f})" opacity=".09"><path d="M-14 0 H14 M8 -5 L14 0 L8 5" stroke="#9fd2e2" stroke-width="1.6" fill="none"></path><path d="M-14 0 l-4 -5 M-10 0 l-4 -5" stroke="#9fd2e2" stroke-width="1.4"></path></g>')

    # a plotted course: dashed track, position fixes, little ship marks, an anchor at the end
    if w > 500:
        pts = [(40, 250), (150, 214), (260, 236), (350, 190), (470, 210), (610, 150), (700, 170)]
    else:
        pts = [(30, 300), (120, 360), (90, 470), (190, 610), (150, 740), (260, 900)]
    d = f'M{pts[0][0]} {pts[0][1]} ' + ' '.join(f'Q{(pts[i][0]+pts[i+1][0])/2 + 10} {(pts[i][1]+pts[i+1][1])/2 - 18} {pts[i+1][0]} {pts[i+1][1]}' for i in range(len(pts) - 1))
    o.append(f'<path d="{d}" fill="none" stroke="#e0bd62" stroke-width="1.1" stroke-dasharray="5 4" opacity=".22"></path>')
    for x, y in pts[1:-1]:
        o.append(f'<g transform="translate({x} {y})" opacity=".3" stroke="#e0bd62" stroke-width="1.1"><circle r="4" fill="none"></circle><path d="M-6 0 H6 M0 -6 V6"></path></g>')
    ax, ay = pts[-1]
    o.append(f'<g transform="translate({ax} {ay}) scale(.9)" fill="none" stroke="#e0bd62" stroke-width="1.6" stroke-linecap="round" opacity=".3"><circle cx="0" cy="-12" r="3"></circle><path d="M0 -9 V10 M-6 -4 H6 M-10 4 Q-8 11 0 11 Q8 11 10 4 M-12 6 L-10 3 L-7 6 M12 6 L10 3 L7 6"></path></g>')

    # sea serpent in a corner and a scale of leagues
    if w > 500:
        sx, sy = 640, 360
    else:
        sx, sy = 250, 980
    sp = [f'<g transform="translate({sx} {sy})" opacity=".13" fill="none" stroke="#9fd2e2" stroke-width="1.3" stroke-linecap="round">']
    sp.append('<path d="M0 0 C6 -16 18 -16 24 0" ></path><path d="M34 0 C40 -20 56 -20 62 0"></path><path d="M72 0 C78 -14 90 -14 96 0"></path>')
    sp.append('<path d="M96 0 C100 -10 104 -18 112 -20 C120 -22 126 -16 124 -10 C120 -12 116 -10 114 -6" fill="#9fd2e2" fill-opacity=".25"></path><circle cx="117" cy="-15" r="1.2" fill="#9fd2e2"></circle>')
    sp.append('<path d="M40 -12 l3 -6 l3 5 l3 -6 l3 6 M6 -10 l3 -5 l3 4 l3 -5"></path><path d="M-4 0 C-8 -4 -12 -2 -14 2 C-10 0 -8 2 -8 4"></path>')
    sp.append('<path d="M-6 6 q6 -3 12 0 t12 0 M28 6 q6 -3 12 0 t12 0 M64 6 q6 -3 12 0 t12 0" stroke-width=".9"></path></g>')
    o += sp
    if w > 500:
        bx, by = 300, 378
    else:
        bx, by = 30, 985
    o.append(f'<g transform="translate({bx} {by})" opacity=".28"><rect x="0" y="-4" width="120" height="4" fill="none" stroke="#9fd2e2" stroke-width=".7"></rect>'
             '<rect x="0" y="-4" width="30" height="4" fill="#9fd2e2"></rect><rect x="60" y="-4" width="30" height="4" fill="#9fd2e2"></rect>'
             '<g font-family="Old Standard TT, Georgia, serif" font-size="8" fill="#9fd2e2"><text x="0" y="-7" text-anchor="middle">0</text><text x="60" y="-7" text-anchor="middle">10</text><text x="120" y="-7" text-anchor="middle">20</text><text x="128" y="0">лиг</text></g></g>')

    # double frame line with corner knots
    o.append(f'<rect x="6" y="8" width="{w-12}" height="{h-14}" rx="6" fill="none" stroke="#c9a048" stroke-width=".8" opacity=".22"></rect>')
    o.append(f'<rect x="10" y="12" width="{w-20}" height="{h-22}" rx="4" fill="none" stroke="#c9a048" stroke-width=".5" stroke-dasharray="1 3" opacity=".3"></rect>')
    for x, y in [(6, 8), (w - 6, 8), (6, h - 6), (w - 6, h - 6)]:
        o.append(f'<g transform="translate({x} {y})" opacity=".35"><circle r="4" fill="#0e1b26" stroke="#c9a048" stroke-width=".9"></circle><circle r="1.4" fill="#c9a048"></circle></g>')

    o.append(f'<path d="M0 2 H{w}" stroke="url(#wgold)" stroke-width="2"></path>')
    o.append(f'<rect width="{w}" height="{h}" fill="url(#wvig)"></rect></svg>')
    return ''.join(o)


def replace_bg(src, w, h, top):
    pat = re.compile(r'(\s*)<svg aria-hidden="true" width="%d" height="%d" viewBox="0 0 %d %d".*?fill="url\(#wvig\)"></rect></svg>' % (w, h, w, h), re.S)
    m = pat.search(src)
    assert m, 'bg not found'
    return src[:m.start()] + m.group(1) + chart_bg(w, h, top) + src[m.end():]


# ---------- body and card ----------
SHIPROWS = [('«Жемчужина»', '#26221f', '#f6efe0'), ('«Месть»', '#8a2e1c', '#fff3e0'), ('«Индевор»', '#7d6122', '#fff6dc'), ('«Голландец»', '#2c6658', '#f2fbf6')]


def icon(key, w=36, h=31):
    return WX[key].replace('width="40" height="34"', f'width="{w}" height="{h}"', 1)


def history(prev, cur_key, rnd):
    cells = []
    for i, k in enumerate(prev):
        cells.append('<div style="display: flex; flex-direction: column; align-items: center; gap: 3px; width: 64px">\n'
                      f'          <span class="" style="width: 46px; height: 46px; border-radius: 50%; display: flex; align-items: center; justify-content: center; background: radial-gradient(circle at 50% 40%, #fbf4e2 55%, #d8c69a); border: 2px solid #5a6e7a; opacity: 0.6">{icon(k)}</span>\n'
                      f'          <span style="font-size: 11.5px; color: #9fb2bc; text-align: center; line-height: 1.15">Раунд {ROMAN[i+1]}<br>{DATA[k]["name"]}</span></div>')
    cells.append('<div style="display: flex; flex-direction: column; align-items: center; gap: 3px; width: 64px">\n'
                 f'          <span class="w-now" style="width: 46px; height: 46px; border-radius: 50%; display: flex; align-items: center; justify-content: center; background: radial-gradient(circle at 50% 40%, #fbf4e2 55%, #d8c69a); border: 2px solid #e0bd62; opacity: 1">{icon(cur_key)}</span>\n'
                 f'          <span style="font-size: 11.5px; color: #f0d27a; text-align: center; line-height: 1.15">Раунд {ROMAN[rnd]}<br>{DATA[cur_key]["name"]}</span></div>')
    return '<div style="display: flex; gap: 6px">' + ''.join(cells) + '</div>'


def rows_html(rows, phone=False):
    out = []
    for (nm, bg, fg), txt in zip(SHIPROWS, rows):
        out.append('<div style="display: flex; align-items: center; gap: 10px; padding: 6px 10px; border-radius: 8px; background: rgba(255,255,255,.06); border: 1px solid rgba(201,160,72,.35)">\n'
                   f'        <span style="flex: none; padding: 2px 9px; border-radius: 6px; background: {bg}; color: {fg}; font-family: \'Alegreya SC\', Georgia, serif; font-weight: 700; font-size: 14px; border: 1px solid #c9a048">{nm}</span>\n'
                   f'        <span style="font-size: 15px; line-height: 1.2; color: #e8eef2">{nb(txt)}</span></div>')
    return ('<div style="display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 6px 10px">' + ''.join(out) + '</div>')


def card(key, rnd):
    c = DATA[key]
    when = 'весь раунд' if c['when'] == 'Весь раунд' else 'сразу'
    text = nb(c['text'])
    return ('<div style="flex: none; width: 236px"><div style="position: relative; display: flex; flex-direction: column; width: 236px; height: 352px; box-sizing: border-box; border: 4px solid #c9a048; border-radius: 14px; overflow: hidden; background: linear-gradient(#f7eed6, #e8d6ae); box-shadow: inset 0 0 0 2px #fff3c4, inset 0 0 0 4px #8a6420, 0 0 24px rgba(160,210,230,.4), 0 12px 26px rgba(10,20,30,.55); color: #2a2018; font-family: \'Old Standard TT\', Georgia, serif">\n'
            f'        <div style="display: flex; justify-content: space-between; align-items: center; padding: 9px 12px 4px; flex: none; font-weight: 700; font-size: 10.5px; letter-spacing: 1.5px; text-transform: uppercase; color: #2f5f74"><span>Море</span><span style="color: #8a6420">{when}</span></div>\n'
            '        <div style="flex: none; align-self: center; width: 150px; height: 150px; border-radius: 50%; display: flex; align-items: center; justify-content: center; background: radial-gradient(circle at 50% 40%, #fbf4e2 55%, #e2cfa2); border: 3px solid #c9a048; box-shadow: inset 0 0 0 3px #fff3c4, inset 0 0 0 5px #8a6420, inset 0 -8px 16px rgba(80,50,10,.18), 0 3px 6px rgba(0,0,0,.25)">\n'
            f'          <span class="w-med" style="display: flex">{icon(key, 118, 100)}</span>\n'
            '        </div>\n'
            f'        <div style="margin: 9px 10px 0; text-align: center; font-weight: 700; font-size: {21 if len(c["name"]) < 15 else 19}px; line-height: 1.05; flex: none">{c["name"]}</div>\n'
            f'        <div style="margin: 5px auto 0; padding: 2px 11px; border-radius: 9px; background: #8e2b22; color: #fff3e0; font-weight: 700; font-size: 13px; line-height: 1.35; flex: none">{c["big"]}</div>\n'
            f'        <div style="flex: 1; display: flex; align-items: center; justify-content: center; padding: 5px 13px 8px; min-height: 0; overflow: hidden"><p style="margin: 0; text-align: center; font-size: {12 if len(c["text"]) < 110 else 11.5}px; line-height: 1.27; color: #3a2e22">{text}</p></div>\n'
            f'        <div class="w-foot" style="display: flex; flex: none; align-items: center; justify-content: center; gap: 10px; height: 26px; background: #24465a; color: #eef6fa; font-weight: 700; font-size: 11px; letter-spacing: 2.6px; text-transform: uppercase; border-top: 2px solid #c9a048"><span>Раунд {ROMAN[rnd]}</span></div>\n'
            '        <i class="w-shine" aria-hidden="true"></i>\n'
            '      </div></div>')


def body(key, rows, prev, rnd):
    c = DATA[key]
    return ('  <div style="position: relative; z-index: 1; display: flex; gap: 24px; padding: 14px 24px 16px; flex: 1; min-height: 0; box-sizing: border-box">\n'
            '    <div style="display: flex; flex-direction: column; gap: 10px; flex: 1; min-width: 0">\n'
            '      <h2 style="margin: 0; font-family: \'Alegreya SC\', Georgia, serif; font-weight: 700; font-size: 16px; color: #f0d27a">Что делает</h2>\n'
            f'      <p style="margin: 0; font-size: 16px; line-height: 1.4; color: #eef3f6">{nb(c["text"])}</p>\n'
            '      <h2 style="margin: 4px 0 0; font-family: \'Alegreya SC\', Georgia, serif; font-weight: 700; font-size: 16px; color: #f0d27a">Сейчас на столе</h2>\n'
            f'      {rows_html(rows)}\n'
            f'      <p style="margin: 2px 0 0; font-family: Alegreya, Georgia, serif; font-style: italic; font-size: 16px; line-height: 1.3; color: #a9bfca">{nb(c["flavor"])}</p>\n'
            '      <div style="display: flex; align-items: flex-end; gap: 14px; margin-top: auto; padding-top: 8px; border-top: 1px solid rgba(201,160,72,.35)">\n'
            f'        {history(prev, key, rnd)}\n'
            f'        <span style="margin-left: auto; font-size: 13.5px; color: #b8c8d0; text-align: right; line-height: 1.35">{deck_line(key, rnd)}</span>\n'
            '      </div>\n'
            '    </div>\n'
            f'    {card(key, rnd)}\n'
            '  </div>')


def plaque(key):
    c = DATA[key]
    when = 'весь раунд' if c['when'] == 'Весь раунд' else 'сразу'
    fs = 30 if len(c['name']) <= 10 else 25
    return (PLAQUE_OPEN + PLAQUE_BOLTS + '\n'
            f'      <span style="font-family: \'Alegreya SC\', Georgia, serif; font-size: 14px; color: #ead07c">Море · {when}</span>\n'
            f'      <h1 style="margin: 0; font-family: \'Alegreya SC\', Georgia, serif; font-weight: 700; font-size: {fs}px; line-height: 1.05; text-shadow: 0 1px 0 rgba(0,0,0,.5)">{c["name"]}</h1>\n'
            f'      <span style="align-self: flex-start; margin-top: 3px; padding: 2px 11px; border-radius: 9px; background: #8e2b22; color: #fff3e0; font-family: \'Old Standard TT\', Georgia, serif; font-weight: 700; font-size: 14px; box-shadow: inset 0 -1px 0 rgba(0,0,0,.25)">{c["big"]}</span>\n'
            '    </div>')


# ---------- v2: clearer logic of the window body ----------
KIND_COL = {'up': '#9fe3b0', 'down': '#ffab96', 'info': '#e8eef2', 'none': '#8fa4ae'}
TEAMS = [('Пираты', '#3a2a22', '#f6efe0', '«Жемчужина» и «Месть»'), ('Компания', '#5a4618', '#fff6dc', '«Индевор» и «Голландец»')]


def fmt_row(text, kind):
    t = text
    if kind in ('up', 'down'):
        c = KIND_COL[kind]
        t = re.sub(r'(\d+) → (\d+)', lambda m: f'{m.group(1)} → <b style="color: {c}">{m.group(2)}</b>', t)
        t = re.sub(r'([−+]\d+)', lambda m: f'<b style="color: {c}">{m.group(1)}</b>', t)
    t = nb(t)
    col = KIND_COL['none'] if kind == 'none' else '#e8eef2'
    style = 'font-style: italic; ' if kind == 'none' else ''
    return f'<span style="font-size: 14.5px; line-height: 1.2; color: {col}; {style}">{t}</span>'


def badge(nm, bg, fg, fs=14):
    return f'<span style="flex: none; padding: 2px 9px; border-radius: 6px; background: {bg}; color: {fg}; font-family: \'Alegreya SC\', Georgia, serif; font-weight: 700; font-size: {fs}px; border: 1px solid #c9a048">{nm}</span>'


def cell(inner, dim=False, span=False):
    sp = ' grid-column: 1 / -1;' if span else ''
    op = ' opacity: .72;' if dim else ''
    bg = 'rgba(255,255,255,.035)' if dim else 'rgba(255,255,255,.07)'
    return f'<div style="display: flex; align-items: center; gap: 10px; padding: 6px 10px; border-radius: 8px; background: {bg}; border: 1px solid rgba(201,160,72,.35);{sp}{op}">{inner}</div>'


def rows2(spec, single=False):
    out = []
    if len(spec) == 2:
        for (team, bg, fg, ships), (txt, kind) in zip(TEAMS, spec):
            inner = badge(team, bg, fg) + f'<span style="flex: none; font-size: 12.5px; color: #9fb2bc">{ships}</span>' + (f'<span style="flex: none; color: #c9a048">·</span>' if not single else '') + fmt_row(txt, kind)
            if single:
                inner = badge(team, bg, fg) + f'<span style="display: flex; flex-direction: column; gap: 1px">' + f'<span style="font-size: 12px; color: #9fb2bc">{ships}</span>' + fmt_row(txt, kind) + '</span>'
            out.append(cell(inner, kind == 'none', span=True))
    else:
        for (nm, bg, fg), (txt, kind) in zip(SHIPROWS, spec):
            out.append(cell(badge(nm, bg, fg) + fmt_row(txt, kind), kind == 'none'))
    cols = '1fr' if single else 'repeat(2, minmax(0, 1fr))'
    return f'<div style="display: grid; grid-template-columns: {cols}; gap: 6px 10px">' + ''.join(out) + '</div>'


def chip(t, strong=False):
    if strong:
        return f'<span style="flex: none; padding: 1px 9px; border-radius: 9px; font-size: 12.5px; line-height: 1.4; color: #2a2018; background: #e0bd62; border: 1px solid #fff0b8; font-weight: 700">{t}</span>'
    return f'<span style="flex: none; padding: 1px 9px; border-radius: 9px; font-size: 12.5px; line-height: 1.4; color: #ead9a8; background: rgba(201,160,72,.14); border: 1px solid rgba(201,160,72,.55)">{t}</span>'


def head_row(title, chips, mt=0):
    return (f'<div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap; margin-top: {mt}px">'
            f'<h2 style="margin: 0; font-family: \'Alegreya SC\', Georgia, serif; font-weight: 700; font-size: 16px; color: #f0d27a">{title}</h2>'
            f'<span style="flex: 1"></span>{"".join(chips)}</div>')


def status(key, rnd, extra=None):
    c = DATA[key]
    if c['when'] == 'Весь раунд':
        ch = [chip(f'до конца раунда {ROMAN[rnd]}')]
    else:
        ch = [chip(f'сработала в начале раунда {ROMAN[rnd]}')]
    for e in (extra or []):
        ch.insert(0, chip(e, strong=True))
    return ch


def table_title(key):
    return 'Что изменилось' if DATA[key]['when'] != 'Весь раунд' and key != 'tortuga' else 'Сейчас на столе'


def body2(key, spec, prev, rnd, extra=None, note=None):
    c = DATA[key]
    note_html = tip_html(note) if note else ''
    return ('  <div style="position: relative; z-index: 1; display: flex; gap: 24px; padding: 14px 24px 16px; flex: 1; min-height: 0; box-sizing: border-box">\n'
            '    <div style="display: flex; flex-direction: column; gap: 10px; flex: 1; min-width: 0">\n'
            f'      {head_row("Что делает", status(key, rnd, extra))}\n'
            f'      <p style="margin: 0; font-size: 16px; line-height: 1.4; color: #eef3f6">{nb(c["text"])}</p>\n'
            f'      {head_row(table_title(key), [], 4)}\n'
            f'      {rows2(spec)}\n'
            f'      {note_html}\n'
            f'      <p style="margin: 2px 0 0; font-family: Alegreya, Georgia, serif; font-style: italic; font-size: 16px; line-height: 1.3; color: #a9bfca">{nb(c["flavor"])}</p>\n'
            '      <div style="display: flex; align-items: flex-end; gap: 14px; margin-top: auto; padding-top: 8px; border-top: 1px solid rgba(201,160,72,.35)">\n'
            f'        {history(prev, key, rnd)}\n'
            f'        <span style="margin-left: auto; font-size: 13.5px; color: #b8c8d0; text-align: right; line-height: 1.35">{deck_line(key, rnd)}</span>\n'
            '      </div>\n'
            '    </div>\n'
            f'    {card(key, rnd)}\n'
            '  </div>')


def deck_line(key, rnd):
    # a «весь раунд» card lies on the table until the round ends; a «сразу» card goes to the discard at once
    if DATA[key]['when'] == 'Весь раунд':
        return f'В колоде моря {17-rnd}<br>в сбросе {rnd-1}, на столе 1'
    return f'В колоде моря {17-rnd}<br>в сбросе {rnd}'


WHISTLE = ('<svg width="18" height="14" viewBox="0 0 18 14" aria-hidden="true" style="flex: none; margin-top: 2px">'
           '<path d="M1 6 H9 A4 4 0 1 1 9 10 H3 Q1 10 1 8 Z" fill="#c9a048" stroke="#5c4615" stroke-width=".9"></path>'
           '<circle cx="11" cy="8" r="2" fill="#5c4615"></circle><path d="M14 3 L17 1 M15 5 L18 5" stroke="#e0bd62" stroke-width="1" stroke-linecap="round"></path></svg>')


def tip_html(t):
    return (f'<div style="display: flex; gap: 7px; align-items: flex-start; margin-top: -2px; font-size: 14px; line-height: 1.3; color: #c8d6dc">{WHISTLE}'
            f'<span><b style="color: #e0bd62; font-family: \'Alegreya SC\', Georgia, serif">Боцман:</b> {nb(t)}</span></div>')
