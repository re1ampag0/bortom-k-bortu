"""Engraved ship in the manner of the vignettes on 17th–18th century sea charts: one ink, form shown by hatching.
Light comes from the upper left: shadow sides of the sails and the hull carry close hatching, lit sides stay clean.
Local frame: 0..100 wide, 0..90 high, waterline at y=72, bow to the right."""
import math, os


def _hatch(clip_id, x0, y0, x1, y1, step, angle, ink, w):
    """Parallel hatching lines filling a box, clipped by clip_id."""
    a = math.radians(angle)
    dx, dy = math.cos(a), math.sin(a)
    L = (x1 - x0) + (y1 - y0)
    cx, cy = (x0 + x1) / 2, (y0 + y1) / 2
    d = ''
    n = int(L / step)
    for i in range(-n, n + 1):
        ox, oy = -dy * i * step, dx * i * step
        d += f'M{cx + ox - dx * L:.1f} {cy + oy - dy * L:.1f}L{cx + ox + dx * L:.1f} {cy + oy + dy * L:.1f}'
    return f'<g clip-path="url(#{clip_id})"><path d="{d}" stroke="{ink}" stroke-width="{w}" fill="none"/></g>'


def sail(uid, i, x, top, w, h, bulge, ink, paper, wline):
    """A square sail bellied by the wind: curved leech and foot, shadow hatching on the lee (right) half."""
    cid = f'sl{uid}{i}'
    l, r = x - w / 2, x + w / 2
    b = top + h
    d = (f'M{l:.1f} {top:.1f} Q{x:.1f} {top - h * .08:.1f} {r:.1f} {top:.1f} '
         f'Q{r + bulge:.1f} {top + h * .5:.1f} {r - w * .04:.1f} {b:.1f} '
         f'Q{x:.1f} {b + h * .16:.1f} {l + w * .04:.1f} {b:.1f} '
         f'Q{l + bulge * .6:.1f} {top + h * .5:.1f} {l:.1f} {top:.1f} Z')
    shade = f'<clipPath id="{cid}"><path d="{d}"/></clipPath>'
    out = f'<path d="{d}" fill="{paper}"/>'
    # lee shadow: hatching on the right 45 % and along the foot
    out += f'<clipPath id="{cid}s"><rect x="{x + w * .05:.1f}" y="{top - 2:.1f}" width="{w:.1f}" height="{h + 6:.1f}"/></clipPath>'
    out += f'<g clip-path="url(#{cid})">' + _hatch(f'{cid}s', l, top, r + bulge, b + 4, 1.5, 78, ink, wline * .55) + '</g>'
    # belly lines: curved seams following the wind
    for t in (.33, .66):
        yy = top + h * t
        out += f'<path d="M{l + w * .06:.1f} {yy:.1f} Q{x + bulge * .4:.1f} {yy + h * .12:.1f} {r - w * .02 + bulge * .5:.1f} {yy:.1f}" stroke="{ink}" stroke-width="{wline * .45}" fill="none" opacity=".75"/>'
    out += f'<path d="{d}" fill="none" stroke="{ink}" stroke-width="{wline}"/>'
    # yard
    out += f'<path d="M{l - 2:.1f} {top:.1f} L{r + 2:.1f} {top:.1f}" stroke="{ink}" stroke-width="{wline * 1.4}" stroke-linecap="round"/>'
    return shade, out


def engraved_ship(uid='e', ink='#c9a048', paper='#0e1b26', wline=1.0, water=True, flag=True):
    defs, body = [], []
    # hull
    hull = 'M9 60 L86 58.6 Q93 57.6 96.6 52 L99 53 Q97 67 87 76 L22 78 Q12 73 9 60 Z'
    defs.append(f'<clipPath id="hu{uid}"><path d="{hull}"/></clipPath>')
    body.append(f'<path d="{hull}" fill="{paper}"/>')
    # hull shading: dense hatching on the lower body, lighter above the wale
    body.append(f'<g clip-path="url(#hu{uid})">' + f'<path d="M0 67 H100" stroke="{ink}" stroke-width="0"/>')
    hd = ''.join(f'M8 {y:.1f}L100 {y - 1.5:.1f}' for y in [66 + i * 1.15 for i in range(11)])
    body.append(f'<path d="{hd}" stroke="{ink}" stroke-width="{wline * .5}"/></g>')
    body.append(f'<path d="M10 64.4 L87 62.6 Q93 61.4 97 56" stroke="{ink}" stroke-width="{wline * 1.1}" fill="none"/>')
    # gunports
    for gx in range(24, 84, 9):
        gy = 60.4 - (gx - 24) * .022
        body.append(f'<rect x="{gx}" y="{gy:.1f}" width="3" height="2.2" fill="{ink}"/>')
    # stern castle and quarter gallery
    body.append(f'<path d="M10 62 L8 50 L24 50 L24 61" fill="{paper}" stroke="{ink}" stroke-width="{wline}"/>')
    body.append(f'<path d="M10 54 H23 M10.6 58 H23" stroke="{ink}" stroke-width="{wline * .5}"/>')
    for wx in (12, 16, 20):
        body.append(f'<rect x="{wx}" y="51.6" width="2" height="1.8" fill="{ink}"/>')
    body.append(f'<path d="M8 50 L7 46 L10 47 Z" fill="{ink}"/>')   # stern lantern bracket
    body.append(f'<circle cx="7.4" cy="45" r="1.3" fill="none" stroke="{ink}" stroke-width="{wline * .6}"/>')
    # forecastle
    body.append(f'<path d="M80 60.4 L82 55 L94 54.2" fill="none" stroke="{ink}" stroke-width="{wline}"/>')
    body.append(f'<path d="M30 61.4 V58.8 M50 61 V58.4 M70 60.6 V58" stroke="{ink}" stroke-width="{wline * .5}"/>')
    body.append(f'<path d="M24 58.8 H80" stroke="{ink}" stroke-width="{wline * .6}"/>')   # rail
    # masts
    masts = [(30, 14), (52, 6), (74, 16)]
    for mx, top in masts:
        body.append(f'<path d="M{mx} 60 L{mx} {top}" stroke="{ink}" stroke-width="{wline * 1.5}"/>')
    # bowsprit and jib
    body.append(f'<path d="M94 55 L112 44" stroke="{ink}" stroke-width="{wline * 1.3}"/>')
    jib = f'M74 18 L110 45 L84 52 Z'
    defs.append(f'<clipPath id="jb{uid}"><path d="{jib}"/></clipPath>')
    body.append(f'<path d="{jib}" fill="{paper}"/>')
    body.append(_hatch(f'jb{uid}', 74, 18, 112, 54, 1.6, 70, ink, wline * .45).replace('<g clip', '<g opacity=".7" clip'))
    body.append(f'<path d="{jib}" fill="none" stroke="{ink}" stroke-width="{wline}"/>')
    # spanker (fore-and-aft sail on the mizzen)
    sp = 'M30 22 L30 54 L10 52 Q14 34 30 22 Z'
    body.append(f'<path d="{sp}" fill="{paper}" stroke="{ink}" stroke-width="{wline}"/>')
    body.append(f'<path d="M30 30 Q20 38 13 48 M30 38 Q22 44 15 50" stroke="{ink}" stroke-width="{wline * .45}" fill="none"/>')
    # square sails, three tiers on main and fore, two on mizzen
    k = 0
    for mx, top in masts:
        tiers = [(top + 4, 11, 22), (top + 16, 13, 26), (top + 30, 16, 30)] if mx != 30 else [(top + 10, 12, 20), (top + 24, 15, 24)]
        for ty, th, tw in tiers:
            sh, o = sail(uid, k, mx, ty, tw, th, 4, ink, paper, wline)
            defs.append(sh)
            body.append(o)
            k += 1
    # rigging: stays and shrouds
    body.append(f'<g stroke="{ink}" stroke-width="{wline * .35}" fill="none" opacity=".85">'
                '<path d="M52 6 L74 16 L112 44 M52 6 L30 14 L8 48 M30 14 L10 60 M52 6 L40 60 M52 6 L64 60 M74 16 L88 59 M74 16 L62 60"/>'
                '<path d="M28 60 L32 30 M33 60 L31 30 M49 60 L53 24 M55 60 L52 24 M71 60 L75 30 M77 60 L74 30"/></g>')
    if flag:
        body.append(f'<path d="M52 6 L52 1" stroke="{ink}" stroke-width="{wline}"/>'
                    f'<path d="M52 1.4 Q58 0 64 2.4 Q59 3.4 64 5.4 Q58 6 52 4.6 Z" fill="{ink}"/>')
        body.append(f'<path d="M74 16 L74 11 M74 11.4 Q80 10 86 12.2 L74 13.6 Z" stroke="{ink}" stroke-width="{wline * .6}" fill="{ink}"/>')
    if water:
        body.append(f'<g stroke="{ink}" stroke-width="{wline * .6}" fill="none" stroke-linecap="round">'
                    '<path d="M2 78 q4 -2 8 0 t8 0 t8 0" opacity=".8"/><path d="M84 77 q4 -2 8 0 t8 0 t8 0" opacity=".8"/>'
                    '<path d="M30 81 q5 -2 10 0 t10 0 t10 0 t10 0" opacity=".55"/><path d="M12 84 q5 -1.6 10 0 t10 0" opacity=".4"/><path d="M76 84 q5 -1.6 10 0 t10 0" opacity=".4"/>'
                    '<path d="M98 56 q6 4 12 3" opacity=".7"/></g>')
    return f'<defs>{"".join(defs)}</defs>' + ''.join(body)


def standalone(ink, paper, bg=None, w=240, uid='s'):
    bgr = f'<rect x="-8" y="-6" width="128" height="96" fill="{bg}"/>' if bg else ''
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="-6 -4 124 92" width="{w}" height="{w * 92 / 124:.0f}">{bgr}'
            f'{engraved_ship(uid, ink, paper)}</svg>')


if __name__ == '__main__':
    here = os.path.dirname(os.path.abspath(__file__))
    d = os.path.join(here, 'out', 'assets', 'ships')
    os.makedirs(d, exist_ok=True)
    open(os.path.join(d, 'ship_engraved_gold.svg'), 'w').write(standalone('#c9a048', '#0e1b26', uid='g'))
    open(os.path.join(d, 'ship_engraved_ink.svg'), 'w').write(standalone('#24180a', '#e9c977', uid='i'))
    print('ok')
