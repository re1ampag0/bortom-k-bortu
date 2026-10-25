"""Realistic struck coin: a height map (white = raised) lit with SVG lighting filters, clipped to an irregular
hand-struck (cob) outline. One metal per coin face, worn edges, no flat colour fills."""
import math, random, os
HERE = os.path.dirname(os.path.abspath(__file__))


def cob(cx, cy, r, seed):
    rnd = random.Random(seed)
    ph = [rnd.random() * 6.3 for _ in range(3)]
    pts = []
    for i in range(240):
        a = i / 240 * 6.283
        k = 1 + .016 * math.sin(3 * a + ph[0]) + .01 * math.sin(5 * a + ph[1]) + .004 * math.sin(11 * a + ph[2])
        pts.append((cx + r * k * math.cos(a), cy + r * k * math.sin(a)))
    return 'M' + ' L'.join(f'{x:.2f} {y:.2f}' for x, y in pts) + 'Z'


def skull_h(cx, cy, k):
    """Skull as height: cranium raised, sockets and nose cut deep, teeth ridges."""
    s = f'<g transform="translate({cx} {cy}) scale({k})">'
    s += '<path d="M-9 -2 C -9.6 -12 -5 -16 0 -16 C 5 -16 9.6 -12 9 -2 C 8.6 1.5 6.8 2.6 6 4 L6 7.4 C 3.4 8.8 -3.4 8.8 -6 7.4 L-6 4 C -6.8 2.6 -8.6 1.5 -9 -2 Z" fill="#e8e8e8"/>'
    s += '<path d="M-6.6 -10 C -5 -13.6 -1.8 -14.6 1.4 -14.2" stroke="#fff" stroke-width="1.6" fill="none" stroke-linecap="round"/>'
    s += '<path d="M-6.4 -5.6 C -6.4 -9 -1.6 -9 -1.4 -5.4 C -1.4 -2.4 -6.4 -2.2 -6.4 -5.6 Z M6.4 -5.6 C 6.4 -9 1.6 -9 1.4 -5.4 C 1.4 -2.4 6.4 -2.2 6.4 -5.6 Z" fill="#111"/>'
    s += '<path d="M0 -1.4 L-1.6 1.8 H1.6 Z" fill="#222"/>'
    s += '<path d="M-4 4.4 V7.6 M-1.4 4.6 V8.2 M1.4 4.6 V8.2 M4 4.4 V7.6" stroke="#555" stroke-width="1"/>'
    s += '<path d="M-6 3.8 C -2 5 2 5 6 3.8" stroke="#666" stroke-width=".8" fill="none"/>'
    return s + '</g>'


def cutlass_h(rot, k=1.0):
    s = f'<g transform="rotate({rot} 50 58)">'
    s += '<path d="M48.6 72 L48.6 30 C 52.6 34 53.8 41 52.6 49 L51.4 72 Z" fill="#8c8c8c"/>'
    s += '<path d="M49.4 70 L49.6 34" stroke="#b0b0b0" stroke-width=".8"/>'
    s += '<rect x="44.6" y="72" width="11" height="2.6" rx="1" fill="#c8c8c8"/>'
    s += '<rect x="48.6" y="74.6" width="2.8" height="7" rx="1" fill="#a0a0a0"/><circle cx="50" cy="82.6" r="1.8" fill="#c8c8c8"/>'
    return s + '</g>'


def anchor_h(cx, cy, k):
    s = f'<g transform="translate({cx} {cy}) scale({k})" stroke="#e0e0e0" fill="none" stroke-linecap="round">'
    s += '<circle cx="0" cy="-14" r="3.6" stroke-width="2.6"/><path d="M0 -10.4 V14" stroke-width="3.4"/><path d="M-7.5 -6 H7.5" stroke-width="3"/>'
    s += '<path d="M-13 3 C -12 11 -6 15 0 15 C 6 15 12 11 13 3" stroke-width="3"/>'
    s += '<path d="M-16 6 L-13 1 L-9 5.5 Z M16 6 L13 1 L9 5.5 Z" fill="#e0e0e0" stroke-width="1"/></g>'
    return s


def crown_h(cx, cy, k):
    return (f'<g transform="translate({cx} {cy}) scale({k})"><path d="M-11 6 L-13 -6 L-6 -1 L0 -10 L6 -1 L13 -6 L11 6 Z" fill="#e4e4e4"/>'
            '<path d="M-11 6 H11" stroke="#fff" stroke-width="1.6"/>'
            '<circle cx="-13" cy="-6.8" r="1.8" fill="#fff"/><circle cx="0" cy="-11" r="1.8" fill="#fff"/><circle cx="13" cy="-6.8" r="1.8" fill="#fff"/>'
            '<circle cx="-5" cy="2.4" r="1.2" fill="#666"/><circle cx="0" cy="2.4" r="1.2" fill="#666"/><circle cx="5" cy="2.4" r="1.2" fill="#666"/></g>')


def laurel_h(side):
    s = f'<g transform="translate(50 0) scale({side} 1) translate(-50 0)">'
    s += '<path d="M28 74 C 21 64 20 50 25 38" stroke="#cfcfcf" stroke-width="1.6" fill="none"/>'
    for i in range(6):
        t = i / 5
        x = 27.5 - 6 * math.sin(t * 2.6) ; y = 72 - t * 32
        s += f'<ellipse cx="{x - 2:.1f}" cy="{y:.1f}" rx="3.8" ry="1.7" transform="rotate({-55 + t * 30:.0f} {x - 2:.1f} {y:.1f})" fill="#d8d8d8"/>'
    return s + '</g>'


def coin(face, metal, seed):
    """face: 'pirate' | 'company'. metal: (dark, base, light, spec)."""
    dark, base, light, spec = metal
    C, R = 50, 44
    outline = cob(C, C, R, seed)
    rnd = random.Random(seed)
    # height map
    h = f'<rect width="100" height="100" fill="#000"/><path d="{outline}" fill="#5a5a5a"/>'
    h += f'<path d="{cob(C, C, R - 2.2, seed)}" fill="none" stroke="#bdbdbd" stroke-width="3.2"/>'          # raised rim
    h += f'<circle cx="{C}" cy="{C}" r="{R - 6.5}" fill="none" stroke="#3a3a3a" stroke-width="1"/>'          # rim step
    beads = ''.join(f'<circle cx="{C + (R - 9) * math.cos(a):.2f}" cy="{C + (R - 9) * math.sin(a):.2f}" r="1.15" fill="#c8c8c8"/>'
                    for a in (i * 6.283 / 54 for i in range(54)))
    h += beads
    h += f'<circle cx="{C}" cy="{C}" r="{R - 12}" fill="none" stroke="#9a9a9a" stroke-width=".9"/>'
    # legend: small stars and lettering-like dashes around the field
    for i in range(16):
        a = i * 6.283 / 16 - 1.571
        x, y = C + (R - 15.6) * math.cos(a), C + (R - 15.6) * math.sin(a)
        if i % 4 == 0:
            h += f'<circle cx="{x:.2f}" cy="{y:.2f}" r="1.4" fill="#d0d0d0"/>'
        else:
            h += f'<rect x="{x - 1.8:.2f}" y="{y - .7:.2f}" width="3.6" height="1.4" rx=".5" fill="#a8a8a8" transform="rotate({math.degrees(a) + 90:.1f} {x:.2f} {y:.2f})"/>'
    if face == 'pirate':
        h += '<g transform="translate(50 58) scale(.82) translate(-50 -58)">' + cutlass_h(-38) + cutlass_h(38) + '</g>'
        h += skull_h(C, C - 1, 1.55)
    else:
        h += laurel_h(1) + laurel_h(-1)
        h += anchor_h(C, C + 6, .95)
        h += crown_h(C, C - 20, .8)
    # wear: random pits and scratches lower the surface a little
    for _ in range(26):
        x, y = C + rnd.uniform(-R, R) * .8, C + rnd.uniform(-R, R) * .8
        h += f'<circle cx="{x:.1f}" cy="{y:.1f}" r="{rnd.uniform(.3, .9):.2f}" fill="#000" opacity=".35"/>'
    for _ in range(6):
        x, y = C + rnd.uniform(-R, R) * .6, C + rnd.uniform(-R, R) * .6
        a = rnd.uniform(0, 6.28); L = rnd.uniform(4, 10)
        h += f'<path d="M{x:.1f} {y:.1f} l{L * math.cos(a):.1f} {L * math.sin(a):.1f}" stroke="#000" stroke-width=".35" opacity=".4"/>'
    uid = face
    svg = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="256" height="256">
<defs>
<filter id="lit{uid}" x="0" y="0" width="100%" height="100%" color-interpolation-filters="sRGB">
 <feGaussianBlur in="SourceGraphic" stdDeviation=".75" result="hm"/>
 <feColorMatrix in="hm" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  .33 .33 .33 0 0" result="h"/>
 <feDiffuseLighting in="h" surfaceScale="5.6" diffuseConstant="1.05" lighting-color="{light}" result="diff"><feDistantLight azimuth="235" elevation="42"/></feDiffuseLighting>
 <feSpecularLighting in="h" surfaceScale="5.6" specularConstant="1.15" specularExponent="18" lighting-color="{spec}" result="spec"><feDistantLight azimuth="235" elevation="50"/></feSpecularLighting>
 <feFlood flood-color="{base}" result="base"/>
 <feBlend in="diff" in2="base" mode="multiply" result="shaded"/>
 <feComposite in="spec" in2="shaded" operator="arithmetic" k1="0" k2="1" k3=".9" k4="0" result="metal"/>
</filter>
<radialGradient id="ao{uid}" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#000" stop-opacity=".55"/><stop offset="1" stop-color="#000" stop-opacity="0"/></radialGradient>
<radialGradient id="tone{uid}" cx=".35" cy=".3" r=".85"><stop offset="0" stop-color="#fff" stop-opacity=".18"/><stop offset=".6" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".35"/></radialGradient>
<clipPath id="cp{uid}"><path d="{outline}"/></clipPath>
</defs>
<ellipse cx="51" cy="96" rx="38" ry="3.4" fill="url(#ao{uid})"/>
<path d="{outline}" transform="translate(.9 1.6)" fill="{dark}"/>
<g clip-path="url(#cp{uid})"><g filter="url(#lit{uid})">{h}</g><rect width="100" height="100" fill="url(#tone{uid})"/></g>
<path d="{outline}" fill="none" stroke="{dark}" stroke-width=".6" opacity=".8"/>
</svg>'''
    return svg


if __name__ == '__main__':
    out = os.path.join(HERE, 'icons')
    # pirate face: blackened silver; company face: gold
    open(os.path.join(out, 'ic_coin.svg'), 'w').write(coin('pirate', ('#050607', '#2a2c31', '#d4d9e0', '#ffffff'), 7))
    open(os.path.join(out, 'ic_coin_back.svg'), 'w').write(coin('company', ('#4a3008', '#c8962e', '#fff0c8', '#fffbe8'), 7))
    print('ok')


def big_skull_h(cx, cy, k):
    """A large skull that fills the field: wide cranium, deep sockets with brow ridges, cheekbones, a row of teeth."""
    s = f'<g transform="translate({cx} {cy}) scale({k})">'
    s += '<path d="M-15 -3 C -16 -17 -8 -23 0 -23 C 8 -23 16 -17 15 -3 C 14.4 2 12 4 11 6.4 L10 12.6 C 6 15.6 -6 15.6 -10 12.6 L-11 6.4 C -12 4 -14.4 2 -15 -3 Z" fill="#dcdcdc"/>'
    s += '<path d="M-11 -14 C -8 -19.6 -3 -21 2 -20.6" stroke="#fff" stroke-width="2.4" fill="none" stroke-linecap="round"/>'
    # brow ridges and sockets
    s += '<path d="M-12.6 -7.6 C -10 -11 -4 -11 -2 -7.6 M12.6 -7.6 C 10 -11 4 -11 2 -7.6" stroke="#fff" stroke-width="1.6" fill="none"/>'
    s += '<path d="M-11.4 -4.6 C -11.4 -10 -3 -10 -2.6 -4.4 C -2.4 0 -11.4 .6 -11.4 -4.6 Z M11.4 -4.6 C 11.4 -10 3 -10 2.6 -4.4 C 2.4 0 11.4 .6 11.4 -4.6 Z" fill="#0a0a0a"/>'
    s += '<path d="M0 0 L-2.6 5 Q0 6.4 2.6 5 Z" fill="#141414"/>'
    s += '<path d="M-13 1.6 C -10.6 4.6 -8 5 -5.6 4.4 M13 1.6 C 10.6 4.6 8 5 5.6 4.4" stroke="#fff" stroke-width="1.2" fill="none" opacity=".8"/>'
    # teeth: a jaw band with separated teeth
    s += '<rect x="-8.6" y="7.2" width="17.2" height="6.4" rx="1.6" fill="#3a3a3a"/>'
    for i in range(6):
        x = -8 + i * 2.9
        s += f'<rect x="{x:.1f}" y="7.6" width="2.3" height="5.6" rx=".9" fill="#e8e8e8"/>'
    s += '<path d="M-8.6 10.4 H8.6" stroke="#2a2a2a" stroke-width=".7"/>'
    return s + '</g>'


def ornate_ring(C, r0, r1, n=8):
    """Band between r0 and r1, split by raised bars into n panels with alternating curls and star-and-wave marks."""
    s = f'<circle cx="{C}" cy="{C}" r="{(r0 + r1) / 2}" fill="none" stroke="#6a6a6a" stroke-width="{r1 - r0}"/>'
    s += f'<circle cx="{C}" cy="{C}" r="{r0}" fill="none" stroke="#d0d0d0" stroke-width="1.6"/><circle cx="{C}" cy="{C}" r="{r1}" fill="none" stroke="#d0d0d0" stroke-width="1.6"/>'
    for i in range(n):
        a = i * 2 * math.pi / n - math.pi / 2
        x0, y0 = C + r0 * math.cos(a), C + r0 * math.sin(a)
        x1, y1 = C + r1 * math.cos(a), C + r1 * math.sin(a)
        s += f'<path d="M{x0:.2f} {y0:.2f} L{x1:.2f} {y1:.2f}" stroke="#d8d8d8" stroke-width="1.8" stroke-linecap="round"/>'
        s += f'<circle cx="{C + (r1 + .2) * math.cos(a):.2f}" cy="{C + (r1 + .2) * math.sin(a):.2f}" r="1.7" fill="#e0e0e0"/>'
        am = a + math.pi / n
        rm = (r0 + r1) / 2
        mx, my = C + rm * math.cos(am), C + rm * math.sin(am)
        deg = math.degrees(am) + 90
        g = f'<g transform="translate({mx:.2f} {my:.2f}) rotate({deg:.1f})">'
        if i % 2 == 0:
            # double curl (scroll)
            g += '<path d="M-4.6 1.2 C -4.6 -2.6 -.6 -2.6 -.6 0 C -.6 1.6 -2.6 1.8 -2.8 .4 M4.6 1.2 C 4.6 -2.6 .6 -2.6 .6 0 C .6 1.6 2.6 1.8 2.8 .4" stroke="#e4e4e4" stroke-width="1.2" fill="none" stroke-linecap="round"/>'
            g += '<path d="M-5.4 2.6 Q0 4 5.4 2.6" stroke="#bdbdbd" stroke-width=".9" fill="none"/>'
        else:
            # four-point star over a wave
            g += '<path d="M0 -3.6 L.9 -.9 L3.6 0 L.9 .9 L0 3.6 L-.9 .9 L-3.6 0 L-.9 -.9 Z" fill="#e8e8e8" transform="translate(0 -.6) scale(.8)"/>'
            g += '<path d="M-4.6 2.8 q1.15 -1.4 2.3 0 t2.3 0 t2.3 0 t2.3 0" stroke="#c4c4c4" stroke-width=".8" fill="none"/>'
        s += g + '</g>'
    return s


def coin_pirate2(metal, seed):
    dark, base, light, spec = metal
    C, R = 50, 45
    outline = cob(C, C, R, seed)
    rnd = random.Random(seed + 1)
    h = f'<rect width="100" height="100" fill="#000"/><path d="{outline}" fill="#4a4a4a"/>'
    h += f'<path d="{cob(C, C, R - 1.8, seed)}" fill="none" stroke="#c4c4c4" stroke-width="3"/>'
    h += ornate_ring(C, 30, 39.5, 8)
    h += f'<circle cx="{C}" cy="{C}" r="28.2" fill="#3e3e3e"/>'
    h += big_skull_h(C, C + 1, 1.05)
    for _ in range(30):
        x, y = C + rnd.uniform(-R, R) * .8, C + rnd.uniform(-R, R) * .8
        h += f'<circle cx="{x:.1f}" cy="{y:.1f}" r="{rnd.uniform(.3, .8):.2f}" fill="#000" opacity=".3"/>'
    svg = coin('pirate', metal, seed)
    a = svg.index('<g filter="url(#litpirate)">') + len('<g filter="url(#litpirate)">')
    b = svg.index('</g><rect width="100" height="100" fill="url(#tonepirate)"/>')
    svg = svg[:a] + h + svg[b:]
    return svg.replace(cob(C, C, 44, seed), outline)


if __name__ == '__main__':
    out = os.path.join(HERE, 'icons')
    # blackened gold: near-black base, warm gold light — the relief reads gold on a dark coin
    open(os.path.join(out, 'ic_coin.svg'), 'w').write(coin_pirate2(('#060403', '#3a2a10', '#ffc864', '#fff0c0'), 7))
    print('pirate v2')


def cob2(cx, cy, r, seed):
    """Hand-cut cob flan: lumpy outline with a couple of flat clipped sides."""
    rnd = random.Random(seed)
    ph = [rnd.random() * 6.3 for _ in range(4)]
    pts = []
    for i in range(240):
        a = i / 240 * 6.283
        k = 1 + .045 * math.sin(2 * a + ph[0]) + .03 * math.sin(3 * a + ph[1]) + .015 * math.sin(7 * a + ph[2])
        k = min(k, .97 + .05 * math.cos(a - ph[3]))          # a clipped side
        pts.append((cx + r * k * math.cos(a), cy + r * k * math.sin(a)))
    return 'M' + ' L'.join(f'{x:.2f} {y:.2f}' for x, y in pts) + 'Z'


def castle_h(x, y, k):
    return (f'<g transform="translate({x} {y}) scale({k})" fill="#dedede">'
            '<rect x="-5" y="-2" width="10" height="7"/><rect x="-6" y="-5" width="3" height="4"/><rect x="-1.5" y="-7" width="3" height="6"/><rect x="3" y="-5" width="3" height="4"/>'
            '<rect x="-6.4" y="-6.2" width="1.2" height="1.4"/><rect x="-4.6" y="-6.2" width="1.2" height="1.4"/><rect x="3.4" y="-6.2" width="1.2" height="1.4"/><rect x="5.2" y="-6.2" width="1.2" height="1.4"/>'
            '<rect x="-1.2" y="1.4" width="2.4" height="3.6" rx="1.2" fill="#2a2a2a"/></g>')


def lion_h(x, y, k, flip=1):
    """Heraldic lion rampant, simplified silhouette."""
    return (f'<g transform="translate({x} {y}) scale({k * flip} {k})" fill="#dedede">'
            '<path d="M-2 6 L-3.4 2 L-5 1 L-3 -1 L-3.6 -4 L-1.6 -6.4 L1 -6.6 L2.4 -5 L1.2 -3.6 L3.6 -3 L2.6 -1 L4.6 0 L3.2 1.4 L1.6 1 L2 4 L4 6 L1.4 6 L.4 4 L-.6 6 Z"/>'
            '<path d="M-2 4 C -5 4 -6 1 -5 -1" stroke="#dedede" stroke-width="1" fill="none"/><circle cx="1.2" cy="-5" r=".5" fill="#333"/></g>')


def doubloon(metal, seed):
    """Spanish gold escudo cob (c. 1714): cross potent in a quatrefoil, castles and lions in the angles, clipped legend."""
    dark, base, light, spec = metal
    C, R = 50, 44
    outline = cob2(C, C, R, seed)
    rnd = random.Random(seed + 5)
    h = f'<rect width="100" height="100" fill="#000"/><path d="{outline}" fill="#4c4c4c"/>'
    # beaded border, only partly struck (off-centre strike)
    beads = ''
    for i in range(64):
        a = i * 6.283 / 64
        if math.sin(a - 2.2) > -.35:
            beads += f'<circle cx="{C + 1.5 + 38.5 * math.cos(a):.2f}" cy="{C - 1 + 38.5 * math.sin(a):.2f}" r="1.2" fill="#cfcfcf"/>'
    h += beads
    # legend, curved, partly off the flan
    h += (f'<defs><path id="lg" d="M{C - 33} {C} A33 33 0 1 1 {C + 33} {C}"/></defs>'
          '<text font-family="Georgia, serif" font-weight="700" font-size="7.4" fill="#d6d6d6" letter-spacing=".6"><textPath href="#lg" startOffset="3%">PHILIPPVS·V·D·G·HISPAN</textPath></text>')
    h += f'<text x="{C}" y="{C + 36}" text-anchor="middle" font-family="Georgia, serif" font-weight="700" font-size="7" fill="#c8c8c8">1714</text>'
    # quatrefoil (four arcs) frame
    q = 13.5
    qf = ''
    for dx, dy in ((0, -q), (q, 0), (0, q), (-q, 0)):
        qf += f'<circle cx="{C + dx}" cy="{C + 1 + dy}" r="{q * .78:.1f}" fill="none" stroke="#c8c8c8" stroke-width="1.6"/>'
    h += f'<g>{qf}</g><circle cx="{C}" cy="{C + 1}" r="{q * 1.2:.1f}" fill="#4c4c4c"/>'
    # cross potent: slim arms with T ends, leaving room for the charges in the angles
    cr = f'<g transform="translate({C} {C + 1})" fill="#e6e6e6">'
    cr += '<rect x="-1.9" y="-17" width="3.8" height="34"/><rect x="-17" y="-1.9" width="34" height="3.8"/>'
    for (x, y, w, hh) in ((-4.6, -18.2, 9.2, 2.6), (-4.6, 15.6, 9.2, 2.6), (-18.2, -4.6, 2.6, 9.2), (15.6, -4.6, 2.6, 9.2)):
        cr += f'<rect x="{x}" y="{y}" width="{w}" height="{hh}" rx=".8"/>'
    cr += '<circle cx="0" cy="0" r="2.8" fill="#f4f4f4"/></g>'
    h += cr
    o = 9.4
    h += castle_h(C - o, C + 1 - o, 1.05) + castle_h(C + o, C + 1 + o, 1.05)
    h += lion_h(C + o, C + 1 - o, 1.1, -1) + lion_h(C - o, C + 1 + o, 1.1, 1)
    # wear
    for _ in range(40):
        x, y = C + rnd.uniform(-R, R) * .85, C + rnd.uniform(-R, R) * .85
        h += f'<circle cx="{x:.1f}" cy="{y:.1f}" r="{rnd.uniform(.3, .9):.2f}" fill="#000" opacity=".3"/>'
    svg = coin('pirate', metal, seed)
    a = svg.index('<g filter="url(#litpirate)">') + len('<g filter="url(#litpirate)">')
    b = svg.index('</g><rect width="100" height="100" fill="url(#tonepirate)"/>')
    svg = svg[:a] + h + svg[b:]
    # blackened metal: highlights only on the crests, not a white sheen over the whole face
    svg = svg.replace('specularConstant="1.15" specularExponent="18"', 'specularConstant=".9" specularExponent="34"').replace('k3=".9"', 'k3=".75"')
    svg = svg.replace('diffuseConstant="1.05"', 'diffuseConstant="1.5"')
    return svg.replace(cob(C, C, R, seed), outline)


if __name__ == '__main__':
    open(os.path.join(HERE, 'icons', 'ic_coin.svg'), 'w').write(doubloon(('#030302', '#1a150d', '#f0c070', '#fff0c8'), 9))
    print('doubloon')


def mini_cutlasses(s=1.0):
    g = f'<g transform="scale({s})">'
    for r in (-38, 38):
        g += f'<g transform="rotate({r})"><path d="M-.5 3.2 L-.5 -3.4 C .6 -2.6 .9 -1 .7 .6 L.5 3.2 Z" fill="#e6e6e6"/><rect x="-1.6" y="3.2" width="3.2" height=".9" fill="#d0d0d0"/><rect x="-.4" y="4.1" width=".8" height="1.6" fill="#bdbdbd"/></g>'
    return g + '</g>'


def ornate_ring2(C, r0, r1, n=10):
    s = f'<circle cx="{C}" cy="{C}" r="{(r0 + r1) / 2}" fill="none" stroke="#5c5c5c" stroke-width="{r1 - r0}"/>'
    s += f'<circle cx="{C}" cy="{C}" r="{r0}" fill="none" stroke="#e2e2e2" stroke-width="1.4"/><circle cx="{C}" cy="{C}" r="{r1}" fill="none" stroke="#e2e2e2" stroke-width="1.4"/>'
    for i in range(n):
        a = i * 2 * math.pi / n - math.pi / 2
        x0, y0 = C + r0 * math.cos(a), C + r0 * math.sin(a)
        x1, y1 = C + r1 * math.cos(a), C + r1 * math.sin(a)
        s += f'<path d="M{x0:.2f} {y0:.2f} L{x1:.2f} {y1:.2f}" stroke="#ececec" stroke-width="1.5" stroke-linecap="round"/>'
        am = a + math.pi / n
        rm = (r0 + r1) / 2
        mx, my = C + rm * math.cos(am), C + rm * math.sin(am)
        deg = math.degrees(am) + 90
        g = f'<g transform="translate({mx:.2f} {my:.2f}) rotate({deg:.1f})">'
        kind = i % 3
        if kind == 0:     # scroll
            g += '<path d="M-3.8 1.2 C -3.8 -2.2 -.5 -2.2 -.5 0 C -.5 1.4 -2.2 1.6 -2.4 .4 M3.8 1.2 C 3.8 -2.2 .5 -2.2 .5 0 C .5 1.4 2.2 1.6 2.4 .4" stroke="#f0f0f0" stroke-width="1.05" fill="none" stroke-linecap="round"/>'
        elif kind == 1:   # crossed cutlasses
            g += mini_cutlasses(.9)
        else:             # star with a pearl
            g += '<path d="M0 -3.2 L.8 -.8 L3.2 0 L.8 .8 L0 3.2 L-.8 .8 L-3.2 0 L-.8 -.8 Z" fill="#f0f0f0"/><circle cx="0" cy="0" r=".9" fill="#7a7a7a"/>'
        s += g + '</g>'
    return s


def rope_rim(C, r, n=96):
    s = ''
    for i in range(n):
        a = i * 2 * math.pi / n
        x, y = C + r * math.cos(a), C + r * math.sin(a)
        d = math.degrees(a)
        s += f'<ellipse cx="{x:.2f}" cy="{y:.2f}" rx="1.25" ry=".55" transform="rotate({d + 55:.1f} {x:.2f} {y:.2f})" fill="#d4d4d4"/>'
    return s


def coin_pirate3(metal, seed):
    """Own design: big skull in the field, crossbones behind it, a ten-panel band (scrolls, cutlasses, stars),
    a rope rim. Crisp cast relief: flat plateaus, little blur."""
    dark, base, light, spec = metal
    C, R = 50, 45
    outline = cob(C, C, R, seed)
    rnd = random.Random(seed + 2)
    h = f'<rect width="100" height="100" fill="#000"/><path d="{outline}" fill="#3a3a3a"/>'
    h += f'<circle cx="{C}" cy="{C}" r="43.2" fill="none" stroke="#9a9a9a" stroke-width="2.6"/>'
    h += rope_rim(C, 41.6)
    h += ornate_ring2(C, 29.4, 39, 10)
    h += f'<circle cx="{C}" cy="{C}" r="28.2" fill="#323232"/>'
    # crossbones behind the skull
    for r in (40, -40):
        h += (f'<g transform="rotate({r} {C} {C + 3})"><rect x="{C - 22}" y="{C + 1.4}" width="44" height="3.6" rx="1.8" fill="#9a9a9a"/>'
              f'<circle cx="{C - 22}" cy="{C + 1.4}" r="2.4" fill="#a8a8a8"/><circle cx="{C - 22}" cy="{C + 5}" r="2.4" fill="#a8a8a8"/>'
              f'<circle cx="{C + 22}" cy="{C + 1.4}" r="2.4" fill="#a8a8a8"/><circle cx="{C + 22}" cy="{C + 5}" r="2.4" fill="#a8a8a8"/></g>')
    h += big_skull_h(C, C + .5, 1.0)
    # a small pearl above the skull
    h += f'<circle cx="{C}" cy="{C - 25}" r="1.9" fill="#f6f6f6"/>'
    for _ in range(18):
        x, y = C + rnd.uniform(-R, R) * .8, C + rnd.uniform(-R, R) * .8
        h += f'<circle cx="{x:.1f}" cy="{y:.1f}" r="{rnd.uniform(.25, .6):.2f}" fill="#000" opacity=".25"/>'
    svg = coin('pirate', metal, seed)
    a = svg.index('<g filter="url(#litpirate)">') + len('<g filter="url(#litpirate)">')
    b = svg.index('</g><rect width="100" height="100" fill="url(#tonepirate)"/>')
    svg = svg[:a] + h + svg[b:]
    svg = svg.replace('stdDeviation=".75"', 'stdDeviation=".38"').replace('surfaceScale="5.6"', 'surfaceScale="3.6"')
    svg = svg.replace('specularConstant="1.15" specularExponent="18"', 'specularConstant="1.1" specularExponent="30"').replace('diffuseConstant="1.05"', 'diffuseConstant="1.35"')
    return svg.replace(cob(C, C, 44, seed), outline)


if __name__ == '__main__':
    # blackened iron-silver: near-black body, cool silver light on the crests
    open(os.path.join(HERE, 'icons', 'ic_coin.svg'), 'w').write(coin_pirate3(('#030304', '#1d1e22', '#dfe3ea', '#ffffff'), 7))
    print('pirate v3')
