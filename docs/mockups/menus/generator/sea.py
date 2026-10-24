"""A realistic-looking sea in plain SVG: perspective rows of crests and troughs, horizon haze, light glitter.
No outlines, no white lines. The wave field is one seamless tile, so it can drift with a cheap transform."""
import random

PALETTES = {
    # base_top (at horizon), base_bottom, crest (light side), trough (shadow), glitter, haze
    'night':   ('#3a566c', '#0b1824', '#9fbfd2', '#050d16', '#fff3c4', '#6f8a9c'),
    'sunset':  ('#6a3a2c', '#140c12', '#ffb27a', '#0a0508', '#ffd68a', '#c0602a'),
    'dawn':    ('#5c6c78', '#0e1c2a', '#d8d2bc', '#07101a', '#fff0d0', '#a8a48e'),
    'panel':   ('#1d4258', '#122c3e', '#a8c8d8', '#081824', '#e8f2f6', '#2c5068'),
    'blood':   ('#3a1c1a', '#100606', '#c08a72', '#050202', '#e8b48a', '#4a2420'),
    'deep':    ('#1e3a52', '#06101c', '#9fbfd2', '#03080e', '#dfe8ee', '#2a4a62'),
}


def sea(W, H, sid, pal='night', light_x=None, perspective=True, seed=7, tile=None, x=None, y=None,
        style=None, drift=True, scale=1.0, glitter=0.0):
    rnd = random.Random(seed)
    top, bot, crest, trough, glint, haze = PALETTES[pal]
    Tw = tile or max(240, min(480, W))
    def field(seed2, amp, density):
        r2 = random.Random(seed2)
        rows = []
        if perspective:
            n = max(5, int(H / 5.5))
            for k in range(n):
                f = ((k + 0.8) / n) ** 1.45
                rows.append((f * H, (1.8 + 11 * f) * scale * amp))
        else:
            n = max(8, int(H / 11))
            for k in range(n):
                rows.append(((k + r2.random() * 0.6) * H / n, 6.5 * scale * amp))
        L, Dk = [], []
        for ry, s in rows:
            cx = r2.random() * s * 3
            while cx < Tw:
                w = s * (1.1 + r2.random() * 1.7)
                yy = ry + (r2.random() - .5) * s * .5
                a = (.22 + r2.random() * .3) * density
                h = s * (.2 + r2.random() * .14)
                for dx in (0, Tw, -Tw):
                    X = cx + dx
                    if X + w < 0 or X - w > Tw:
                        continue
                    b = min(2, int((a / density - .22) / .1))
                    L.append((b, f'M{X-w:.1f} {yy:.1f}Q{X:.1f} {yy-h:.1f} {X+w:.1f} {yy:.1f}Q{X:.1f} {yy-h*.3:.1f} {X-w:.1f} {yy:.1f}Z'))
                    Dk.append((b, f'M{X-w*1.05:.1f} {yy+h*.2:.1f}Q{X:.1f} {yy+h*1.7:.1f} {X+w*1.05:.1f} {yy+h*.2:.1f}Q{X:.1f} {yy+h*.6:.1f} {X-w*1.05:.1f} {yy+h*.2:.1f}Z'))
                cx += w * (1.9 + r2.random() * 1.8)
        op = [.26, .38, .5]
        out = ''
        for bk in range(3):
            d = ''.join(s for b, s in Dk if b == bk)
            if d: out += f'<path fill="{trough}" opacity="{min(.7, op[bk]*1.5*density):.2f}" d="{d}"/>'
        for bk in range(3):
            d = ''.join(s for b, s in L if b == bk)
            if d: out += f'<path fill="{crest}" opacity="{op[bk]*density:.2f}" d="{d}"/>'
        return out
    layerA = field(seed, 1.0, 1.0)
    layerB = field(seed + 101, .7, .7)
    pos = ''
    if x is not None: pos += f' x="{x}"'
    if y is not None: pos += f' y="{y}"'
    st = f' style="{style}"' if style else ''
    g = []
    g.append(f'<svg aria-hidden="true"{pos} width="{W}" height="{H}" viewBox="0 0 {W} {H}" preserveAspectRatio="none" overflow="hidden"{st}>')
    g.append('<defs>')
    g.append(f'<linearGradient id="sb{sid}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="{top}"/><stop offset="{.35 if perspective else .5}" stop-color="{_mix(top, bot, .55)}"/><stop offset="1" stop-color="{bot}"/></linearGradient>')
    g.append(f'<linearGradient id="sh{sid}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="{haze}" stop-opacity=".55"/><stop offset="1" stop-color="{haze}" stop-opacity="0"/></linearGradient>')
    if light_x is not None:
        g.append(f'<radialGradient id="sl{sid}" cx="{light_x/W:.3f}" cy="0" r="{.55 if perspective else .7}" gradientTransform="translate({light_x/W:.3f} 0) scale(.55 1) translate({-light_x/W:.3f} 0)"><stop offset="0" stop-color="{glint}" stop-opacity=".28"/><stop offset="1" stop-color="{glint}" stop-opacity="0"/></radialGradient>')
    g.append(f'<pattern id="sw{sid}" width="{Tw}" height="{H}" patternUnits="userSpaceOnUse">{layerA}</pattern>')
    g.append(f'<pattern id="sv{sid}" width="{Tw}" height="{H}" patternUnits="userSpaceOnUse">{layerB}</pattern>')
    g.append('</defs>')
    g.append(f'<rect width="{W}" height="{H}" fill="url(#sb{sid})"/>')
    if light_x is not None:
        g.append(f'<rect width="{W}" height="{H}" fill="url(#sl{sid})"/>')
    dcls = f' class="seaDrift{sid}"' if drift else ''
    g.append(f'<g{dcls}><rect x="{-Tw}" width="{W + 2*Tw}" height="{H}" fill="url(#sw{sid})"/></g>')
    dcl2 = f' class="seaSwell{sid}"' if drift else ''
    g.append(f'<g{dcl2}><rect x="{-Tw}" width="{W + 2*Tw}" height="{H}" fill="url(#sv{sid})"/></g>')
    if perspective:
        g.append(f'<rect width="{W}" height="{max(3, H*.18):.1f}" fill="url(#sh{sid})"/>')
    if light_x is not None and glitter > 0:
        gl = []
        for _ in range(int(60 * glitter)):
            f = rnd.random() ** 1.3
            yy = f * H
            spread = (8 + 70 * f) * scale
            xx = light_x + (rnd.random() - .5) * 2 * spread * (rnd.random() ** .7)
            ln = (1.5 + 7 * f * rnd.random()) * scale
            gl.append(f'<rect x="{xx-ln/2:.1f}" y="{yy:.1f}" width="{ln:.1f}" height="{max(.5, .9*f*scale):.2f}" rx=".4" opacity="{.25+.6*rnd.random():.2f}"/>')
        g.append(f'<g class="seaGlint" fill="{glint}">{"".join(gl)}</g>')
    g.append('</svg>')
    css = (f'@keyframes seaDrift{sid}{{to{{transform:translateX({Tw}px)}}}}.seaDrift{sid}{{animation:seaDrift{sid} {int(Tw/7)}s linear infinite}}'
           f'@keyframes seaSwell{sid}{{0%{{transform:translate(0,0);opacity:.9}}50%{{transform:translate({-Tw/2:.0f}px,.8px);opacity:.55}}100%{{transform:translate({-Tw}px,0);opacity:.9}}}}.seaSwell{sid}{{animation:seaSwell{sid} {int(Tw/4)}s linear infinite}}' if drift else '')
    return ''.join(g), css


SEA_CSS = ('@keyframes seaGlint{0%,100%{opacity:1}35%{opacity:.55}60%{opacity:.9}80%{opacity:.6}}'
           '.seaGlint{animation:seaGlint 3.4s ease-in-out infinite}'
           '@media (prefers-reduced-motion: reduce){[class^="seaDrift"],[class^="seaSwell"],.seaGlint{animation:none !important}}')


def _mix(a, b, t):
    a = [int(a[i:i+2], 16) for i in (1, 3, 5)]
    b = [int(b[i:i+2], 16) for i in (1, 3, 5)]
    return '#' + ''.join(f'{round(x + (y - x) * t):02x}' for x, y in zip(a, b))


def contact_shadow(L, W, wy, k=1.0):
    """Soft darkening where the hull meets the water — instead of any white line."""
    return (f'<span aria-hidden="true" style="position: absolute; left: {L + W*.1:g}px; top: {wy - 3*k:g}px; width: {W*.8:g}px; height: {7*k:g}px; '
            f'border-radius: 50%; background: radial-gradient(closest-side, rgba(0,0,0,.42), rgba(0,0,0,0))"></span>')


REFL_MASK = ('-webkit-mask-image: linear-gradient(rgba(0,0,0,.9), rgba(0,0,0,0)), repeating-linear-gradient(rgba(0,0,0,1) 0 2px, rgba(0,0,0,.25) 2px 4px); '
             '-webkit-mask-composite: source-in; mask-image: linear-gradient(rgba(0,0,0,.9), rgba(0,0,0,0)), repeating-linear-gradient(rgba(0,0,0,1) 0 2px, rgba(0,0,0,.25) 2px 4px); mask-composite: intersect;')
