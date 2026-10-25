def fort(tx, ty, k=1.0, uid='f', glow=True, moon='right'):
    """A small colonial sea fort, 120x40 local units: bastions, curtain wall, keep, sentry box, gate, cannons, lit windows."""
    lit = '#7f98aa'
    merl = lambda x0, x1, y, step=4.2, w=2.4, h=2.2: ''.join(f'<rect x="{x:.1f}" y="{y-h:.1f}" width="{w}" height="{h}"/>' for x in frange(x0, x1 - w, step))
    s = f'<g transform="translate({tx} {ty}) scale({k})">'
    s += (f'<defs><linearGradient id="fw{uid}" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#1a2530"/><stop offset=".7" stop-color="#2c3a46"/><stop offset="1" stop-color="#46586a"/></linearGradient>'
          f'<linearGradient id="fk{uid}" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#1e2a36"/><stop offset="1" stop-color="#3e5060"/></linearGradient>'
          f'<radialGradient id="fg{uid}" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#ffcf6a" stop-opacity=".7"/><stop offset="1" stop-color="#ffcf6a" stop-opacity="0"/></radialGradient></defs>')
    # rock under the walls
    s += '<path d="M0 40 C 4 35 8 36 10 33 L114 33 C 116 36 120 37 122 40 Z" fill="#141f29"/>'
    # back keep
    s += f'<rect x="52" y="9" width="18" height="16" fill="url(#fk{uid})"/>'
    s += f'<g fill="url(#fk{uid})">{merl(52, 70.5, 9.2, 4.1, 2.4, 2.2)}</g>'
    s += f'<path d="M70 9 V25" stroke="{lit}" stroke-width=".6" opacity=".7"/>'
    s += '<rect x="58.5" y="13" width="2.2" height="3.2" fill="#ffcf6a"/><rect x="63.5" y="13" width="2.2" height="3.2" fill="#ffcf6a" opacity=".75"/>'
    # flag
    s += '<path d="M61 6.8 V-1" stroke="#141f29" stroke-width=".8"/><path class="fortFlag" d="M61.4 -.8 C 64 -1.6 66 .2 69 -.6 L68 1.6 L69 3.8 C 66 4.6 64 2.8 61.4 3.6 Z" fill="#8e2b22"/>'
    # curtain wall with gate
    s += f'<rect x="38" y="22" width="46" height="13" fill="url(#fw{uid})"/>'
    s += f'<g fill="url(#fw{uid})">{merl(38, 84, 22.2)}</g>'
    s += '<path d="M57 35 V29.5 Q61 25.6 65 29.5 V35 Z" fill="#0b1118"/><path d="M58.4 35 V30 Q61 27.6 63.6 30 V35 Z" fill="#ffb84a" opacity=".55"/>'
    # stone courses
    s += '<g stroke="#0e161e" stroke-width=".35" opacity=".7"><path d="M38 26 H84 M38 30 H84 M14 27 H44 M80 26 H110"/><path d="M44 22 V26 M52 26 V30 M70 22 V26 M76 26 V30 M46 30 V35 M80 30 V35"/></g>'
    # left bastion (sloped walls)
    s += f'<path d="M8 35 L13 21 L42 21 L46 35 Z" fill="url(#fw{uid})"/>'
    s += f'<g fill="url(#fw{uid})">{merl(13, 42, 21.2)}</g>'
    s += f'<path d="M42 21 L46 35" stroke="{lit}" stroke-width=".7" opacity=".55"/>'
    # right bastion
    s += f'<path d="M78 35 L81 19 L109 19 L114 35 Z" fill="url(#fw{uid})"/>'
    s += f'<g fill="url(#fw{uid})">{merl(81, 104, 19.2)}</g>'
    s += f'<path d="M109 19 L114 35 M81 19 H109" stroke="{lit}" stroke-width=".7" opacity=".7"/>'
    # sentry box on the corner
    s += f'<rect x="103.5" y="12.5" width="6" height="7" fill="url(#fk{uid})"/><path d="M103 12.8 Q106.5 7.6 110 12.8 Z" fill="#2c3a46"/><path d="M110 12.8 Q108 9 106.5 8.6" stroke="{lit}" stroke-width=".5" fill="none" opacity=".8"/><rect x="105.8" y="14.4" width="1.3" height="2.6" fill="#0b1118"/>'
    # embrasures with cannon muzzles
    for x, y in [(19, 27), (29, 27), (88, 25), (98, 25)]:
        s += f'<rect x="{x}" y="{y}" width="4.2" height="2.6" fill="#0b1118"/><rect x="{x+1}" y="{y+.8}" width="2.6" height="1" fill="#3a4248"/>'
    # lit windows on the walls
    s += '<rect x="46.5" y="27.4" width="1.8" height="2.4" fill="#ffcf6a"/><rect x="73.5" y="27.4" width="1.8" height="2.4" fill="#ffcf6a" opacity=".85"/>'
    if glow:
        s += f'<g class="flick"><circle cx="61" cy="31" r="7" fill="url(#fg{uid})"/><circle cx="62" cy="14.5" r="6" fill="url(#fg{uid})" opacity=".8"/><circle cx="47.4" cy="28.6" r="3.6" fill="url(#fg{uid})"/><circle cx="74.4" cy="28.6" r="3.6" fill="url(#fg{uid})"/></g>'
    # little jetty and a rowboat
    s += '<path d="M8 36.6 H-14" stroke="#2a2018" stroke-width="1.4"/><path d="M-10 36.6 V40 M-4 36.6 V40 M2 36.6 V40" stroke="#2a2018" stroke-width=".8"/>'
    s += '<path d="M-24 38.6 Q-19 41.4 -13 38.6 Z" fill="#3a2818"/>'
    s += '</g>'
    return s

def frange(a, b, st):
    x = a
    while x <= b + 1e-6:
        yield x
        x += st

FORT_CSS = '@keyframes fortFlag{0%,100%{transform:scaleX(1)}50%{transform:scaleX(.82)}}.fortFlag{transform-box:fill-box;transform-origin:left center;animation:fortFlag 2.2s ease-in-out infinite}'
