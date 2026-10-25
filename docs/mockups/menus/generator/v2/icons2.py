"""New detailed icons for the menus, same material set as generator/icons.py (brass, iron, oak, leather, paper)."""
import math, os
HERE = os.path.dirname(os.path.abspath(__file__))
D0 = open(os.path.join(HERE, 'defs.txt')).read()
EXTRA = '''<defs>
<radialGradient id="gold" cx=".38" cy=".32" r=".78"><stop offset="0" stop-color="#fff6cc"/><stop offset=".28" stop-color="#f2d27a"/><stop offset=".62" stop-color="#c9973a"/><stop offset=".9" stop-color="#8a5f18"/><stop offset="1" stop-color="#6a4810"/></radialGradient>
<radialGradient id="goldIn" cx=".42" cy=".36" r=".7"><stop offset="0" stop-color="#f8dc8a"/><stop offset=".55" stop-color="#d9a948"/><stop offset="1" stop-color="#a87a26"/></radialGradient>
<linearGradient id="edge" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#6a4810"/><stop offset=".3" stop-color="#b98a2e"/><stop offset=".55" stop-color="#7a5414"/><stop offset="1" stop-color="#4a3008"/></linearGradient>
<radialGradient id="ironR" cx=".36" cy=".3" r=".8"><stop offset="0" stop-color="#9aa4a8"/><stop offset=".25" stop-color="#4a5256"/><stop offset=".7" stop-color="#1c2022"/><stop offset="1" stop-color="#0a0c0d"/></radialGradient>
<linearGradient id="pewter" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#5a6266"/><stop offset=".2" stop-color="#c8d2d6"/><stop offset=".42" stop-color="#8a9498"/><stop offset=".8" stop-color="#3e4548"/><stop offset="1" stop-color="#6a7276"/></linearGradient>
<linearGradient id="staveH" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#4a2c14"/><stop offset=".25" stop-color="#b47c48"/><stop offset=".5" stop-color="#8a5a32"/><stop offset=".85" stop-color="#5a361a"/><stop offset="1" stop-color="#3a2210"/></linearGradient>
<radialGradient id="foam" cx=".4" cy=".35" r=".7"><stop offset="0" stop-color="#fffdf4"/><stop offset=".7" stop-color="#efe2c4"/><stop offset="1" stop-color="#c9b48a"/></radialGradient>
<radialGradient id="spark" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#fffbe0"/><stop offset=".35" stop-color="#ffd25a"/><stop offset=".7" stop-color="#ff7a1a" stop-opacity=".6"/><stop offset="1" stop-color="#ff5a00" stop-opacity="0"/></radialGradient>
<radialGradient id="blackIn" cx=".42" cy=".34" r=".75"><stop offset="0" stop-color="#3a3e46"/><stop offset=".5" stop-color="#16181e"/><stop offset="1" stop-color="#050608"/></radialGradient><radialGradient id="pearl" cx=".36" cy=".3" r=".75"><stop offset="0" stop-color="#9aa4b4"/><stop offset=".25" stop-color="#3a3f4c"/><stop offset=".7" stop-color="#0c0d12"/><stop offset="1" stop-color="#1c1a28"/></radialGradient><linearGradient id="silv" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f4f6f8"/><stop offset=".5" stop-color="#b8c0c6"/><stop offset="1" stop-color="#7a848c"/></linearGradient><linearGradient id="wax" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#d0473a"/><stop offset=".5" stop-color="#9a2218"/><stop offset="1" stop-color="#5e0f0a"/></linearGradient>
<linearGradient id="parch" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f6ead0"/><stop offset=".6" stop-color="#e6d2a4"/><stop offset="1" stop-color="#c9ad74"/></linearGradient>
<linearGradient id="parchRoll" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#b8996a"/><stop offset=".3" stop-color="#fbf2dc"/><stop offset=".6" stop-color="#d9c294"/><stop offset="1" stop-color="#8a6e42"/></linearGradient>
<linearGradient id="plank" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#d4a26c"/><stop offset=".15" stop-color="#b9824e"/><stop offset=".85" stop-color="#8a5a32"/><stop offset="1" stop-color="#5a361a"/></linearGradient>
<radialGradient id="shieldW" cx=".4" cy=".35" r=".75"><stop offset="0" stop-color="#c48e58"/><stop offset=".6" stop-color="#7e4e28"/><stop offset="1" stop-color="#4a2a12"/></radialGradient>
</defs>'''
D = D0 + EXTRA


def w(name, body, vb='0 0 64 64'):
    os.makedirs(os.path.join(HERE, 'icons'), exist_ok=True)
    open(os.path.join(HERE, 'icons', name + '.svg'), 'w').write(
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{vb}" width="128" height="128">{D}{body}</svg>')


def star(cx, cy, r1, r2, n=4, rot=0):
    pts = []
    for i in range(n * 2):
        a = math.pi * i / n + rot
        r = r1 if i % 2 == 0 else r2
        pts.append(f'{cx + r * math.sin(a):.2f},{cy - r * math.cos(a):.2f}')
    return 'M' + ' L'.join(pts) + 'Z'


def skull(cx, cy, k, fill, hi, lo):
    """Embossed skull and crossbones, centred at cx,cy, unit ~ 20*k."""
    s = f'<g transform="translate({cx} {cy}) scale({k})">'
    # bones (behind)
    for a in (35, -35):
        s += f'<g transform="rotate({a})">'
        s += f'<rect x="-15" y="-1.7" width="30" height="3.4" rx="1.6" fill="{fill}" stroke="{lo}" stroke-width=".6"/>'
        for x in (-15, 15):
            s += f'<circle cx="{x}" cy="-1.9" r="2.2" fill="{fill}" stroke="{lo}" stroke-width=".6"/><circle cx="{x}" cy="1.9" r="2.2" fill="{fill}" stroke="{lo}" stroke-width=".6"/>'
        s += f'<path d="M-13 -1 H13" stroke="{hi}" stroke-width=".6" opacity=".8"/></g>'
    # cranium
    s += f'<path d="M-8 -3 C -8.6 -11 -4.6 -14.4 0 -14.4 C 4.6 -14.4 8.6 -11 8 -3 C 7.6 0 6 1 5.2 2.4 L5.2 5.4 C 3 6.6 -3 6.6 -5.2 5.4 L-5.2 2.4 C -6 1 -7.6 0 -8 -3 Z" fill="{fill}" stroke="{lo}" stroke-width=".7"/>'
    s += f'<path d="M-6 -9 C -4.6 -12.4 -1.6 -13.4 1.4 -13" stroke="{hi}" stroke-width="1" fill="none" stroke-linecap="round" opacity=".9"/>'
    s += f'<ellipse cx="-3.3" cy="-5" rx="2.5" ry="2.8" fill="{lo}"/><ellipse cx="3.3" cy="-5" rx="2.5" ry="2.8" fill="{lo}"/>'
    s += f'<path d="M0 -1.6 L-1.3 1 H1.3 Z" fill="{lo}"/>'
    s += f'<path d="M-3 3.2 V5.6 M-1 3.4 V6 M1 3.4 V6 M3 3.2 V5.6" stroke="{lo}" stroke-width=".7"/>'
    return s + '</g>'


# ---------- Doubloon for «Жребий»
def coin(back=False):
    b = '<ellipse cx="32" cy="60" rx="24" ry="3.2" fill="url(#ao)"/>'
    # thickness (edge) seen slightly from below
    b += '<ellipse cx="32" cy="33.6" rx="27" ry="27" fill="url(#edge)"/>'
    # milled rim
    b += '<circle cx="32" cy="31.4" r="27" fill="url(#gold)" stroke="#5a3c0c" stroke-width=".7"/>'
    ticks = ''
    for i in range(72):
        a = 2 * math.pi * i / 72
        x1, y1 = 32 + 25.4 * math.cos(a), 31.4 + 25.4 * math.sin(a)
        x2, y2 = 32 + 26.8 * math.cos(a), 31.4 + 26.8 * math.sin(a)
        ticks += f'M{x1:.2f} {y1:.2f}L{x2:.2f} {y2:.2f}'
    b += f'<path d="{ticks}" stroke="#7a5414" stroke-width=".6" opacity=".7"/>'
    # raised rim ring and inner field
    b += '<circle cx="32" cy="31.4" r="23.6" fill="none" stroke="#6a4810" stroke-width="1.6" opacity=".55"/>'
    field = 'url(#blackIn)' if not back else 'url(#goldIn)'
    b += f'<circle cx="32" cy="31.4" r="22.6" fill="{field}" stroke="#fff0b8" stroke-width=".7" stroke-opacity=".7"/>'
    # beaded legend ring
    dots = ''.join(f'<circle cx="{32 + 20 * math.cos(2 * math.pi * i / 40):.2f}" cy="{31.4 + 20 * math.sin(2 * math.pi * i / 40):.2f}" r=".75"/>' for i in range(40))
    if back:
        b += f'<g fill="#8a5f18" opacity=".75">{dots}</g>'
        b += f'<g fill="#fff3c4" opacity=".5" transform="translate(-.35 -.35)">{dots}</g>'
    else:
        b += f'<g fill="#000" opacity=".8">{dots}</g>'
        b += f'<g fill="#c8ced4" opacity=".55" transform="translate(-.3 -.3)">{dots}</g>'
    # four small stars on the cardinal points of the legend (on the black face: the black pearl takes the top)
    pts_ = ((32, 13.8), (49.6, 31.4), (32, 49), (14.4, 31.4)) if back else ((49.6, 31.4), (32, 49), (14.4, 31.4))
    for (x, y) in pts_:
        b += f'<path d="{star(x, y, 2.3, .8)}" fill="{"#fff0b8" if back else "#dfe4e8"}" stroke="{"#8a5f18" if back else "#3a3e44"}" stroke-width=".35"/>'
    # embossed skull & bones: shadow, body, highlight
    if not back:
        # pirate face: black enamel, silver skull over crossed cutlasses (Calico Jack's flag, as on the Pearl), black pearl
        def cutlass(rot):
            g = f'<g transform="rotate({rot} 32 39)">'
            g += '<path d="M31.2 45 L31.2 18 C 33.8 20.6 34.6 25 33.8 30 L33 45 Z" fill="url(#silv)" stroke="#2a2e32" stroke-width=".45"/>'
            g += '<path d="M31.8 44 L31.9 20.4" stroke="#fff" stroke-width=".4" opacity=".85"/>'
            g += '<rect x="28.8" y="45" width="6.6" height="1.6" rx=".6" fill="url(#brH)" stroke="#5e4210" stroke-width=".35"/>'
            g += '<rect x="31.2" y="46.6" width="1.8" height="4.2" rx=".6" fill="#3a2414"/><circle cx="32.1" cy="51.3" r="1.1" fill="url(#brR)"/>'
            return g + '</g>'
        b += '<g transform="translate(0 -3)">' + cutlass(-34) + cutlass(34) + '</g>'
        b += skull(32.5, 29.6, .62, '#000', '#000', '#000').replace('<g ', '<g opacity=".6" ', 1).replace('<g transform="rotate(35)">', '<g transform="rotate(35)" opacity="0">').replace('<g transform="rotate(-35)">', '<g transform="rotate(-35)" opacity="0">')
        sk = skull(32, 29, .62, '#e8ecee', '#ffffff', '#1a1c20')
        sk = sk.replace('<g transform="rotate(35)">', '<g transform="rotate(35)" opacity="0">').replace('<g transform="rotate(-35)">', '<g transform="rotate(-35)" opacity="0">')
        b += sk
        # black pearl at the top of the legend, in a gold collet
        b += '<circle cx="32" cy="13.6" r="3.3" fill="url(#brR)" stroke="#5e4210" stroke-width=".4"/>'
        b += '<circle cx="32" cy="13.6" r="2.5" fill="url(#pearl)"/><circle cx="31.1" cy="12.7" r=".7" fill="#e8eef8" opacity=".9"/>'
    else:
        # reverse: the Company side — crowned anchor between two laurel sprigs
        b += '<g opacity=".55">' + anchor(32.6, 35.4, .95, '#7a5414', '#7a5414', '#7a5414') + '</g>'
        b += anchor(32, 34.8, .95, '#f4d88a', '#8a5f18', '#fffbe6')
        crown = 'M24.6 22.6 L26 16.4 L29.2 19.6 L32 14.6 L34.8 19.6 L38 16.4 L39.4 22.6 Z'
        b += f'<path d="{crown}" transform="translate(.6 .6)" fill="#7a5414" opacity=".55"/><path d="{crown}" fill="#f4d88a" stroke="#8a5f18" stroke-width=".6"/>'
        b += '<path d="M25 21.4 H39" stroke="#fffbe6" stroke-width=".6" opacity=".8"/>'
        for x in (26, 32, 38):
            b += f'<circle cx="{x}" cy="{16.4 if x != 32 else 14.6}" r="1" fill="#fffbe6" stroke="#8a5f18" stroke-width=".4"/>'
        for sx in (-1, 1):
            g = f'<g transform="translate(32 0) scale({sx} 1) translate(-32 0)">'
            g += '<path d="M19.6 44 C 15.6 38 15.6 31 18.4 25" stroke="#8a5f18" stroke-width="1" fill="none"/>'
            for i, (lx, ly) in enumerate(((17.2, 40.6), (16.4, 36.4), (16.6, 32.2), (17.6, 28.2))):
                g += f'<ellipse cx="{lx}" cy="{ly}" rx="2.2" ry="1" transform="rotate({-50 + i * 12} {lx} {ly})" fill="#f4d88a" stroke="#8a5f18" stroke-width=".4"/>'
            b += g + '</g>'
    # specular sweep
    b += f'<path d="M12.6 22 C 16 12 26 6.6 36 7.2" stroke="#fffbe6" stroke-width="2.2" fill="none" stroke-linecap="round" opacity="{.55 if back else .3}"/>'
    b += '<path d="M48 48 C 44 53 38 55.6 31 55.4" stroke="#fff3c4" stroke-width="1" fill="none" stroke-linecap="round" opacity=".35"/>'
    b += f'<path d="{star(18, 16.5, 3.4, .7)}" fill="#fffef4" opacity=".9"/>'
    w('ic_coin_back' if back else 'ic_coin', b)


# ---------- Swap: two brass arrows around a small anchor
def anchor(cx, cy, k, fill, lo, hi):
    s = f'<g transform="translate({cx} {cy}) scale({k})">'
    s += f'<circle cx="0" cy="-9" r="2.6" fill="none" stroke="{lo}" stroke-width="2.4"/><circle cx="0" cy="-9" r="2.6" fill="none" stroke="{fill}" stroke-width="1.4"/>'
    s += f'<path d="M0 -6.4 V9" stroke="{lo}" stroke-width="3.2" stroke-linecap="round"/><path d="M0 -6.4 V9" stroke="{fill}" stroke-width="2" stroke-linecap="round"/>'
    s += f'<path d="M-5 -3.6 H5" stroke="{lo}" stroke-width="2.8" stroke-linecap="round"/><path d="M-5 -3.6 H5" stroke="{fill}" stroke-width="1.6" stroke-linecap="round"/>'
    s += f'<path d="M-8.6 2.2 C -8 7.6 -4 10 0 10 C 4 10 8 7.6 8.6 2.2" stroke="{lo}" stroke-width="3" fill="none" stroke-linecap="round"/>'
    s += f'<path d="M-8.6 2.2 C -8 7.6 -4 10 0 10 C 4 10 8 7.6 8.6 2.2" stroke="{fill}" stroke-width="1.8" fill="none" stroke-linecap="round"/>'
    s += f'<path d="M-10.6 4.4 L-8.6 1.2 L-6 4 Z M10.6 4.4 L8.6 1.2 L6 4 Z" fill="{fill}" stroke="{lo}" stroke-width=".6"/>'
    s += f'<path d="M-.5 -5 V7" stroke="{hi}" stroke-width=".6" opacity=".8"/>'
    return s + '</g>'


def swap():
    b = '<ellipse cx="32" cy="59" rx="22" ry="3" fill="url(#ao)"/>'
    def arrow(rot):
        # thick curved shaft (quarter+ arc) ending in a broad head
        s = f'<g transform="rotate({rot} 32 31)">'
        shaft = 'M11.4 27 A 21 21 0 0 1 47.4 16.6'
        s += f'<path d="{shaft}" stroke="#3a2808" stroke-width="7.4" fill="none" stroke-linecap="round"/>'
        s += f'<path d="{shaft}" stroke="url(#brH)" stroke-width="5.4" fill="none" stroke-linecap="round"/>'
        s += '<path d="M13.4 24.4 A 19 19 0 0 1 45 15.4" stroke="#fff6d0" stroke-width="1" fill="none" stroke-linecap="round" opacity=".75"/>'
        s += '<path d="M42 8.6 L56.2 17.6 L42.6 27.4 C 44.6 21.6 44.6 14.6 42 8.6 Z" fill="url(#br)" stroke="#3a2808" stroke-width="1"/>'
        s += '<path d="M44.4 12.4 L52 17.6" stroke="#fff6d0" stroke-width=".8" opacity=".8"/>'
        return s + '</g>'
    b += arrow(0) + arrow(180)
    b += '<circle cx="32" cy="31" r="10.4" fill="url(#ironR)" stroke="#0a0c0d" stroke-width=".8"/>'
    b += '<circle cx="32" cy="31" r="9.2" fill="none" stroke="#c9a048" stroke-width=".9" opacity=".8"/>'
    b += anchor(32, 31.4, .62, '#e2bf62', '#3a2808', '#fff6d0')
    w('ic_swap', b)


# ---------- Two tankards clinking: «На одном экране»
def mugs():
    b = '<ellipse cx="32" cy="59.5" rx="26" ry="3" fill="url(#ao)"/>'
    def mug(tx, rot, flip):
        sx = -1 if flip else 1
        s = f'<g transform="translate({tx} 34) rotate({rot}) scale({sx} 1)">'
        # handle
        s += '<path d="M9 -8 C 17 -8 17 8 9 8" stroke="#2a180a" stroke-width="5" fill="none"/><path d="M9 -8 C 17 -8 17 8 9 8" stroke="url(#oakH)" stroke-width="3.2" fill="none"/>'
        # body: staves
        s += '<path d="M-10 -12 L10 -12 L9 16 L-9 16 Z" fill="url(#staveH)" stroke="#2a180a" stroke-width=".8"/>'
        s += '<path d="M-4.6 -12 L-4.2 16 M0 -12 V16 M4.6 -12 L4.2 16" stroke="#3a2210" stroke-width=".55" opacity=".8"/>'
        s += '<path d="M-7.6 -11 L-7 15" stroke="#e0b07a" stroke-width=".7" opacity=".6"/>'
        # brass hoops
        for y in (-8.5, 2.5, 12.4):
            s += f'<rect x="-10.6" y="{y}" width="21" height="2.4" rx=".6" fill="url(#brH)" stroke="#5e4210" stroke-width=".4"/>'
        # foam spilling over
        s += '<path d="M-11 -12 C -12.6 -17 -7 -19.6 -3.6 -17.6 C -2 -21 4 -21 5.6 -17.4 C 9 -19 12.6 -15.6 11 -12 C 12 -10.4 11 -9 9.6 -9.6 C 8.6 -8 6.6 -9.4 6.4 -10.6 L-9 -10.6 C -10.6 -9.6 -12.4 -10.6 -11 -12 Z" fill="url(#foam)" stroke="#a89466" stroke-width=".5"/>'
        s += '<circle cx="-3" cy="-15.4" r="1.4" fill="#fff" opacity=".8"/><circle cx="3.2" cy="-16.6" r=".9" fill="#fff" opacity=".7"/>'
        return s + '</g>'
    b += mug(17, -16, False) + mug(47, 16, True)
    # clink: small spark between the rims
    b += '<circle cx="32" cy="15" r="7" fill="url(#spark)" opacity=".75"/>'
    b += f'<path d="{star(32, 15, 6.4, 1.1)}" fill="#fffbe0"/>'
    b += '<path d="M24 9 L26.4 11.4 M40 9 L37.6 11.4 M32 5 V7.6" stroke="#ffe6a0" stroke-width="1" stroke-linecap="round" opacity=".8"/>'
    w('ic_mugs', b)


# ---------- Cannon on a carriage: «Обычная»
def cannon():
    b = '<ellipse cx="31" cy="58" rx="27" ry="3" fill="url(#ao)"/>'
    # carriage (cheek) and axle
    b += '<path d="M8 50 L10 40 L30 37 L40 44 L40 50 Z" fill="url(#oak)" stroke="#2a180a" stroke-width=".8"/>'
    b += '<path d="M11 40.6 L29.6 37.8" stroke="#e0b07a" stroke-width=".7" opacity=".6"/>'
    b += '<path d="M14 44 H36 M14 47.6 H38" stroke="#4a2c14" stroke-width=".5" opacity=".7"/>'
    # barrel
    b += '<g transform="rotate(-14 30 34)">'
    b += '<path d="M8 28.4 C 8 25.6 10 24.2 12 24 L50 26 L52 25.2 L55 25.4 L55 34.6 L52 34.8 L50 34 L12 36 C 10 35.8 8 34.4 8 31.6 Z" fill="url(#ir)" stroke="#121516" stroke-width=".8"/>'
    b += '<circle cx="6.6" cy="30" r="2.8" fill="url(#ironR)" stroke="#121516" stroke-width=".6"/>'
    for x in (16, 30, 44):
        b += f'<rect x="{x}" y="{24.6 + (x - 16) * .05:.2f}" width="2.4" height="{10.8 - (x - 16) * .1:.2f}" rx=".6" fill="url(#ir)" stroke="#121516" stroke-width=".5"/>'
    b += '<path d="M13 26.6 L49 27.8" stroke="#f2f8fa" stroke-width=".9" opacity=".7"/>'
    b += '<ellipse cx="55" cy="30" rx="1.4" ry="4.6" fill="#0a0c0d"/>'
    b += '</g>'
    # trunnion cap (brass)
    b += '<circle cx="28" cy="36.4" r="2.6" fill="url(#brR)" stroke="#5e4210" stroke-width=".5"/>'
    # wheels
    for cx in (15, 34):
        b += f'<circle cx="{cx}" cy="50" r="6.4" fill="url(#oak)" stroke="#2a180a" stroke-width=".8"/>'
        b += f'<circle cx="{cx}" cy="50" r="4.6" fill="none" stroke="#4a2c14" stroke-width=".6"/>'
        b += f'<path d="M{cx - 4.6} 50 H{cx + 4.6} M{cx} 45.4 V54.6 M{cx - 3.3} 46.7 L{cx + 3.3} 53.3 M{cx + 3.3} 46.7 L{cx - 3.3} 53.3" stroke="#3a2210" stroke-width=".7"/>'
        b += f'<circle cx="{cx}" cy="50" r="1.5" fill="url(#brR)"/>'
    # balls
    for (x, y) in ((48, 53.4), (54.4, 53.4), (51.2, 48)):
        b += f'<circle cx="{x}" cy="{y}" r="3.3" fill="url(#ironR)" stroke="#0a0c0d" stroke-width=".5"/><circle cx="{x - 1}" cy="{y - 1.2}" r=".8" fill="#d8e2e6" opacity=".7"/>'
    w('ic_cannon', b)


# ---------- Sea chart with a route: «Первая партия»
def chart():
    b = '<ellipse cx="32" cy="58.5" rx="27" ry="3" fill="url(#ao)"/>'
    b += '<path d="M9 14 C 20 12 44 16 55 13 L55 50 C 44 53 20 49 9 51 Z" fill="url(#parch)" stroke="#7a5a2a" stroke-width=".8"/>'
    b += '<path d="M9 14 C 20 12 44 16 55 13 L55 50 C 44 53 20 49 9 51 Z" fill="url(#fold)" opacity=".5"/>'
    # rolled ends
    b += '<rect x="5" y="11" width="6" height="43" rx="3" fill="url(#parchRoll)" stroke="#7a5a2a" stroke-width=".7"/>'
    b += '<rect x="53" y="10" width="6" height="43" rx="3" fill="url(#parchRoll)" stroke="#7a5a2a" stroke-width=".7"/>'
    # coast and islands
    b += '<path d="M14 40 C 18 34 22 38 25 33 C 27 30 31 33 30 37 C 29 41 24 44 19 45 C 16 45.6 13 43 14 40 Z" fill="#c9ad74" stroke="#7a5a2a" stroke-width=".6"/>'
    b += '<path d="M40 22 C 43 19 48 21 47 25 C 46 28 41 28 40 26 Z" fill="#c9ad74" stroke="#7a5a2a" stroke-width=".6"/>'
    b += '<g stroke="#7a5a2a" stroke-width=".35" fill="none" opacity=".6"><path d="M12.6 41.4 C 16 36 21 40 24 35.4"/><path d="M38.8 23 C 41.6 19.6 47 20.6 48.4 24.6"/></g>'
    # rhumb lines from a compass point
    b += '<g stroke="#8a6a3a" stroke-width=".3" opacity=".55"><path d="M44 42 L14 18 M44 42 L54 16 M44 42 L12 49 M44 42 L30 14"/></g>'
    b += f'<path d="{star(44, 42, 4.4, 1, 4)}" fill="#8e2b22" stroke="#4a120c" stroke-width=".3"/>'
    b += f'<path d="{star(44, 42, 3, .7, 4, math.pi / 4)}" fill="#2a1e12" opacity=".7"/>'
    # dashed route and X
    b += '<path d="M22 39 C 26 30 32 30 36 26 C 38 24 40 24.6 42 24" stroke="#8e2b22" stroke-width="1.2" stroke-dasharray="2 1.6" fill="none" stroke-linecap="round"/>'
    b += '<path d="M41 21.6 L45.4 26 M45.4 21.6 L41 26" stroke="#8e2b22" stroke-width="1.8" stroke-linecap="round"/>'
    b += '<path d="M19 18 h8 M19 20.6 h5" stroke="#5a4020" stroke-width=".7" opacity=".7"/>'
    w('ic_chart', b)


# ---------- Bomb with a lit fuse: «Быстрый бой»
def bomb():
    b = '<ellipse cx="27" cy="59.5" rx="21" ry="3" fill="url(#ao)"/><g transform="translate(-2 3)">'
    b += '<circle cx="29" cy="37" r="19" fill="url(#ironR)" stroke="#050607" stroke-width=".8"/>'
    b += '<path d="M15.4 30 C 17 22.4 23 18.6 29.6 18.4" stroke="#c8d2d6" stroke-width="1.6" fill="none" stroke-linecap="round" opacity=".55"/>'
    b += '<ellipse cx="21.6" cy="27.6" rx="3.4" ry="2" fill="#e8f0f2" opacity=".55" transform="rotate(-38 21.6 27.6)"/>'
    b += '<path d="M14 44 C 18 52 28 56 38 52" stroke="#000" stroke-width="2" fill="none" opacity=".35"/>'
    # brass collar
    b += '<g transform="rotate(30 40 21)"><rect x="35.6" y="15.4" width="9" height="8" rx="1.4" fill="url(#brH)" stroke="#5e4210" stroke-width=".6"/>'
    b += '<rect x="35" y="14" width="10.2" height="2.6" rx=".8" fill="url(#br)" stroke="#5e4210" stroke-width=".5"/></g>'
    # fuse
    b += '<path d="M43 14 C 46 8 51 9 52 5.6" stroke="#5a4020" stroke-width="2.2" fill="none" stroke-linecap="round"/>'
    b += '<path d="M43 14 C 46 8 51 9 52 5.6" stroke="#c9a875" stroke-width="1" fill="none" stroke-linecap="round" stroke-dasharray="1.4 1.2"/>'
    # spark
    b += '<circle cx="52.4" cy="5.4" r="8" fill="url(#spark)"/>'
    b += f'<path d="{star(52.4, 5.4, 6.6, 1.2, 4, .3)}" fill="#fff6c8"/>'
    b += f'<path d="{star(52.4, 5.4, 4, .9, 4, 1.08)}" fill="#ffd25a"/>'
    b += '<circle cx="58" cy="11" r=".9" fill="#ffd25a"/><circle cx="46.6" cy="2.4" r=".7" fill="#ffe6a0"/><circle cx="59" cy="3" r=".6" fill="#ffb23a"/>'
    b += '</g>'
    w('ic_bomb', b)


# ---------- Card types
def charge():
    """Заряд: a pyramid of round shot and a powder horn."""
    b = '<ellipse cx="32" cy="58.5" rx="25" ry="3" fill="url(#ao)"/>'
    # small powder keg behind the shot
    b += '<path d="M38 12 C 35 20 35 32 38 40 L56 40 C 59 32 59 20 56 12 Z" fill="url(#staveH)" stroke="#2a180a" stroke-width=".8"/>'
    b += '<path d="M42.5 12.4 C 41 20 41 32 42.5 39.6 M47 12 V40 M51.5 12.4 C 53 20 53 32 51.5 39.6" stroke="#3a2210" stroke-width=".5" opacity=".8"/>'
    b += '<path d="M36.4 17 H57.6 M36.2 35 H57.8" stroke="url(#brH)" stroke-width="2.2"/>'
    b += '<ellipse cx="47" cy="12" rx="9" ry="2.2" fill="#6e4526" stroke="#2a180a" stroke-width=".6"/>'
    for (x, y) in ((22, 50), (32, 50), (42, 50), (27, 41.6), (37, 41.6), (32, 33.4)):
        b += f'<circle cx="{x}" cy="{y}" r="5.2" fill="url(#ironR)" stroke="#050607" stroke-width=".6"/><circle cx="{x - 1.6}" cy="{y - 1.9}" r="1.2" fill="#dfe8ea" opacity=".6"/>'
    w('ic_t_charge', b)


def order():
    """Приказ: a sealed scroll with a ribbon."""
    b = '<ellipse cx="32" cy="58.5" rx="25" ry="3" fill="url(#ao)"/>'
    b += '<path d="M14 12 H46 C 48 12 50 14 50 16 V48 C 50 52 47 54 44 54 H18 C 21 52 22 50 22 48 V16 C 22 14 20 12 18 12 Z" fill="url(#parch)" stroke="#7a5a2a" stroke-width=".8"/>'
    b += '<rect x="11" y="9.4" width="13" height="7" rx="3.5" fill="url(#parchRoll)" stroke="#7a5a2a" stroke-width=".7"/>'
    b += '<path d="M14 54 C 9 54 9 46 14 46 C 18 46 18 52 18 54 Z" fill="url(#parchRoll)" stroke="#7a5a2a" stroke-width=".7"/>'
    b += '<g stroke="#5a4020" stroke-width=".9" stroke-linecap="round" opacity=".75"><path d="M27 20 H45 M27 24.4 H43 M27 28.8 H45 M27 33.2 H39"/></g>'
    # ribbon tails and wax seal
    b += '<path d="M33 41 L30 55 L34 52 L36 56 L38 42 Z" fill="#7a1a12"/><path d="M39 41 L42 54 L44 50.6 L47 53 L43 40 Z" fill="#9a2218"/>'
    b += '<circle cx="38" cy="41" r="7" fill="url(#wax)" stroke="#4a0c08" stroke-width=".7"/>'
    b += '<path d="M33.6 39 C 34 36.4 36.6 35 39 35.2" stroke="#ff9a8a" stroke-width=".9" fill="none" opacity=".6"/>'
    b += anchor(38, 41.4, .36, '#5e0f0a', '#3a0604', '#d0473a')
    w('ic_t_order', b)


def repair():
    """Ремонт: a mallet over a nailed plank."""
    b = '<ellipse cx="32" cy="58.5" rx="26" ry="3" fill="url(#ao)"/>'
    b += '<g transform="rotate(-8 32 46)"><rect x="6" y="40" width="52" height="11" rx="1.4" fill="url(#plank)" stroke="#3a2210" stroke-width=".8"/>'
    b += '<path d="M8 43 C 20 42 30 44.6 56 43 M8 47.6 C 24 46.4 40 49 56 47.4" stroke="#5a361a" stroke-width=".45" fill="none" opacity=".8"/>'
    b += '<ellipse cx="22" cy="45.6" rx="2.4" ry="1.3" fill="#5a361a" opacity=".6"/>'
    for x in (11, 53):
        b += f'<circle cx="{x}" cy="45.5" r="1.5" fill="url(#ironR)"/><circle cx="{x - .4}" cy="45.1" r=".4" fill="#dfe8ea"/>'
    b += '</g>'
    # nails
    b += '<g transform="rotate(-8 32 46)"><rect x="45.6" y="35" width="1.6" height="6" fill="url(#ir)"/><rect x="43.8" y="34" width="5.2" height="1.6" rx=".6" fill="url(#ir)"/></g>'
    # mallet
    b += '<g transform="rotate(-38 26 26)"><rect x="24" y="22" width="4.4" height="30" rx="2" fill="url(#oakH)" stroke="#2a180a" stroke-width=".7"/>'
    b += '<path d="M25 24 V50" stroke="#e0b07a" stroke-width=".6" opacity=".6"/>'
    b += '<rect x="13" y="9" width="26" height="14" rx="2.4" fill="url(#oak)" stroke="#2a180a" stroke-width=".8"/>'
    b += '<rect x="12" y="8.4" width="4" height="15.2" rx="1" fill="url(#ir)" stroke="#121516" stroke-width=".5"/><rect x="36" y="8.4" width="4" height="15.2" rx="1" fill="url(#ir)" stroke="#121516" stroke-width=".5"/>'
    b += '<path d="M17 11 H35" stroke="#f0c896" stroke-width=".8" opacity=".6"/></g>'
    w('ic_t_repair', b)


def reaction():
    """Реакция: a round wooden buckler with an iron boss — parry."""
    b = '<ellipse cx="32" cy="59" rx="22" ry="3" fill="url(#ao)"/>'
    b += '<circle cx="32" cy="32" r="24" fill="url(#ir)" stroke="#121516" stroke-width=".8"/>'
    b += '<circle cx="32" cy="32" r="21" fill="url(#shieldW)" stroke="#2a180a" stroke-width=".7"/>'
    # boards
    b += '<g stroke="#3a2210" stroke-width=".6" opacity=".8"><path d="M18 14.6 V49.4 M25 11.6 V52.4 M39 11.6 V52.4 M46 14.6 V49.4"/></g>'
    b += '<path d="M14 24 C 18 16 26 12 34 12" stroke="#e8b47e" stroke-width="1.2" fill="none" opacity=".5"/>'
    # rivets on the rim
    rv = ''.join(f'<circle cx="{32 + 22.5 * math.cos(2 * math.pi * i / 16):.2f}" cy="{32 + 22.5 * math.sin(2 * math.pi * i / 16):.2f}" r="1"/>' for i in range(16))
    b += f'<g fill="url(#brR)">{rv}</g>'
    # boss
    b += '<circle cx="32" cy="32" r="8.4" fill="url(#ironR)" stroke="#050607" stroke-width=".7"/>'
    b += '<circle cx="32" cy="32" r="6" fill="none" stroke="#c9a048" stroke-width=".8" opacity=".7"/>'
    b += '<ellipse cx="29.4" cy="29" rx="2.4" ry="1.4" fill="#e8f0f2" opacity=".6" transform="rotate(-35 29.4 29)"/>'
    # deflection sparks
    b += '<path d="M50 10 L54 6 M53 14 L58 12 M46 7 L48 2" stroke="#ffd25a" stroke-width="1.2" stroke-linecap="round"/>'
    w('ic_t_reaction', b)


if __name__ == '__main__':
    coin(back=True)
    for f in (coin, swap, mugs, cannon, chart, bomb, charge, order, repair, reaction):
        f()
    print('ok')


# ---------- Ship's lantern: «Показ» in Settings
def lantern():
    b = '<ellipse cx="32" cy="60" rx="18" ry="2.8" fill="url(#ao)"/>'
    b += '<circle cx="32" cy="36" r="22" fill="url(#spark)" opacity=".45"/>'
    b += '<path d="M26 6 C 26 2 38 2 38 6" stroke="url(#brH)" stroke-width="2.4" fill="none"/>'
    b += '<path d="M20 14 L32 7 L44 14 Z" fill="url(#br)" stroke="#5e4210" stroke-width=".7"/>'
    b += '<rect x="19" y="14" width="26" height="4" rx="1" fill="url(#brH)" stroke="#5e4210" stroke-width=".6"/>'
    b += '<path d="M21 18 L22 50 L42 50 L43 18 Z" fill="#ffe7a0" opacity=".9"/>'
    b += '<path d="M21 18 L22 50 L42 50 L43 18 Z" fill="url(#glass)"/>'
    b += '<ellipse cx="32" cy="38" rx="3.2" ry="6" fill="#fff6d0"/><path d="M32 30 C 30 34 30.6 38 32 41 C 33.4 38 34 34 32 30 Z" fill="#ff9a30" opacity=".8"/>'
    b += '<rect x="30.6" y="41" width="2.8" height="6" fill="#efe2c4"/>'
    b += '<g stroke="url(#brH)" stroke-width="1.6"><path d="M27.5 18 L27.8 50 M36.5 18 L36.2 50"/></g>'
    b += '<path d="M21.5 18 L22.5 50 M42.5 18 L41.5 50" stroke="#5e4210" stroke-width="1.6"/>'
    b += '<rect x="19" y="50" width="26" height="5" rx="1.2" fill="url(#brH)" stroke="#5e4210" stroke-width=".6"/>'
    b += '<path d="M23 20 L23.6 46" stroke="#fff" stroke-width="1" opacity=".6"/>'
    w('ic_lantern', b)


# ---------- Lashed helm: «Бот у штурвала» (a wheel tied off with rope — a sailor's autopilot)
def autohelm():
    b = '<ellipse cx="32" cy="60" rx="22" ry="2.8" fill="url(#ao)"/>'
    for i in range(8):
        a = i * math.pi / 4
        x1, y1 = 32 + 9 * math.cos(a), 31 + 9 * math.sin(a)
        x2, y2 = 32 + 27 * math.cos(a), 31 + 27 * math.sin(a)
        b += f'<path d="M{x1:.1f} {y1:.1f}L{x2:.1f} {y2:.1f}" stroke="#2a180a" stroke-width="5.2" stroke-linecap="round"/><path d="M{x1:.1f} {y1:.1f}L{x2:.1f} {y2:.1f}" stroke="url(#oakH)" stroke-width="3.4" stroke-linecap="round"/>'
    b += '<circle cx="32" cy="31" r="19" fill="none" stroke="#2a180a" stroke-width="6"/><circle cx="32" cy="31" r="19" fill="none" stroke="url(#oak)" stroke-width="4.2"/>'
    b += '<circle cx="32" cy="31" r="19" fill="none" stroke="#e0b07a" stroke-width=".6" stroke-dasharray="3 4" opacity=".5"/>'
    b += '<circle cx="32" cy="31" r="7.4" fill="url(#knob)" stroke="#2a180a" stroke-width=".8"/><circle cx="32" cy="31" r="3.4" fill="url(#brR)"/>'
    # rope lashing around the lower spokes, running off to the side
    b += '<path d="M24 44 C 22 50 14 54 6 55" stroke="#5a4020" stroke-width="3.4" fill="none" stroke-linecap="round"/>'
    b += '<path d="M24 44 C 22 50 14 54 6 55" stroke="#d8b47a" stroke-width="2" fill="none" stroke-linecap="round" stroke-dasharray="2 1.4"/>'
    for k in range(4):
        b += f'<ellipse cx="{22.6 + k * 1.6:.1f}" cy="{41 + k * 1.1:.1f}" rx="3.6" ry="1.6" transform="rotate(-48 {22.6 + k * 1.6:.1f} {41 + k * 1.1:.1f})" fill="#c9a875" stroke="#5a4020" stroke-width=".6"/>'
    w('ic_autohelm', b)


if __name__ == '__main__':
    lantern(); autohelm()
