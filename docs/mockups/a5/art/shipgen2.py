# Detailed ship drawings (viewBox 0 0 120 78, bow left, waterline ~71). Prints JSON {kind: svg-fragment}.
# Shading is done with translucent black/white overlays so it works for any sail/hull colour.
import json

def f(x):
    return ('%.2f' % x).rstrip('0').rstrip('.')

P = dict(
    pearl=dict(hull='#2a2521', band='#4f4740', trim='#c9a24a', sail='#3b3631', seam='#5a524a', line='#0c0a09', rig='#0c0a09', flag='#14110f', port='#0a0908', light=.10),
    revenge=dict(hull='#5c2a1b', band='#c9a24a', trim='#d8b45a', sail='#ece2c8', seam='#b9aa88', line='#1e0c07', rig='#2a1a12', flag='#14110f', port='#1e0c07', light=.0),
    endeavour=dict(hull='#6b4a24', band='#c9a24a', trim='#e0bd62', sail='#f6eedb', seam='#c9bb98', line='#22160a', rig='#2a2014', flag='#9a2b22', port='#22160a', light=.0),
    dutch=dict(hull='#3d4a3c', band='#5e7563', trim='#9db39f', sail='#aebaa8', seam='#7f8f7a', line='#141a14', rig='#1d261f', flag='#24302a', port='#141a14', light=.06),
)

def sq(X, t, b, w, rag=False):
    wf = w * 1.07
    m = t + (b - t) * .55
    bulge = min(.75, (b - t) * .06)
    belly = min(2.6, (b - t) * .2)
    head = f'M{f(X-w)} {f(t)} L{f(X+w)} {f(t)}'
    side_r = f' Q{f(X+wf+bulge)} {f(m)} {f(X+wf)} {f(b)}'
    side_l = f' Q{f(X-wf-bulge)} {f(m)} {f(X-w)} {f(t)} Z'
    if not rag:
        return head + side_r + f' Q{f(X)} {f(b+belly)} {f(X-wf)} {f(b)}' + side_l
    pts = []
    for i in range(1, 6):
        x = X + wf - 2 * wf * i / 6
        y = b + belly * .5 + (1.8 if i % 2 else -1.6)
        pts.append(f'L{f(x)} {f(y)}')
    return head + side_r + ' ' + ' '.join(pts) + f' L{f(X-wf)} {f(b)}' + side_l

def sq_shade(X, t, b, w):
    """Shadow on the lee (right) third of a bellied sail + a soft fold under the yard."""
    wf = w * 1.07
    m = t + (b - t) * .55
    bulge = min(.75, (b - t) * .06)
    belly = min(2.6, (b - t) * .2)
    x0 = X + w * .25
    return (f'M{f(x0)} {f(t)} L{f(X+w)} {f(t)} Q{f(X+wf+bulge)} {f(m)} {f(X+wf)} {f(b)} '
            f'Q{f(X+wf*.6)} {f(b+belly*.85)} {f(X+w*.2)} {f(b+belly*.9)} Q{f(X+w*.5)} {f(m)} {f(x0)} {f(t)} Z')

def sq_light(X, t, b, w):
    wf = w * 1.07
    m = t + (b - t) * .5
    return (f'M{f(X-w*.75)} {f(t+.8)} L{f(X-w*.1)} {f(t+.8)} Q{f(X-w*.2)} {f(m)} {f(X-w*.25)} {f(b-.4)} '
            f'L{f(X-wf*.8)} {f(b-.6)} Q{f(X-wf*.95)} {f(m)} {f(X-w*.75)} {f(t+.8)} Z')

def ship(kind, water=True):
    c = P[kind]
    L, R = c['line'], c['rig']
    rag = kind == 'dutch'
    dark = kind == 'pearl'
    fore, main, miz = 36, 60, 84
    tops = dict(pearl=(13, 4.5, 12), revenge=(13, 6, 13.5), endeavour=(6.5, 1.5, 10), dutch=(13, 5, 13))[kind]
    st = dict(pearl=47.5, revenge=45.5, endeavour=44.5, dutch=47.5)[kind]
    g = []
    shade_op = .28 if dark else .16
    hi = '#ffffff'
    # --- standing rigging behind the sails: shrouds, stays, backstays
    g.append(f'<g stroke="{R}" stroke-width=".32" fill="none" opacity=".8">'
             f'<path d="M{fore} {tops[0]} L29 55.4 M{fore} {tops[0]} L32 55.4 M{fore} {tops[0]} L40 55.4 M{fore} {tops[0]} L43 55.4 '
             f'M{main} {tops[1]} L52 55.4 M{main} {tops[1]} L55 55.4 M{main} {tops[1]} L65 55.4 M{main} {tops[1]} L68 55.4 '
             f'M{miz} {tops[2]} L79 55 M{miz} {tops[2]} L89.5 51.4 '
             f'M{fore} {tops[0]} L2.5 43.4 M{fore} {f(tops[0]+8)} L7 45.6 M{main} {f(tops[1]+1)} L{fore} {f(tops[0]+3)} M{main} {f(tops[1]+12)} L{fore+1} 36 '
             f'M{miz} {tops[2]} L{main} {f(tops[1]+7)} M{miz} {f(tops[2]+2)} L105 {48 if kind!="endeavour" else 45}"/></g>')
    rat = []
    for X in (fore, main, miz):
        for k in range(5):
            y = 54.6 - k * 2.7
            half = 6 - k * 1.05
            rat.append(f'M{f(X-half)} {f(y)} H{f(X+half)}')
    g.append(f'<path d="{" ".join(rat)}" stroke="{R}" stroke-width=".22" opacity=".65"/>')
    # --- bowsprit with jib-boom, masts with topmasts
    g.append(f'<path d="M18 52.4 L2 42.8" stroke="{L}" stroke-width="1.5" stroke-linecap="round"/>')
    def mx(X, k):  # Dutchman masts lean a little
        return X + (k if rag else 0)
    for X, top, lean in ((fore, tops[0], 1.2), (main, tops[1], -.6), (miz, tops[2], -.8)):
        g.append(f'<path d="M{X} 56 L{f(mx(X, 0))} 36" stroke="{L}" stroke-width="1.35" stroke-linecap="round"/>'
                 f'<path d="M{X} 37 L{f(mx(X, lean))} {top}" stroke="{L}" stroke-width=".95" stroke-linecap="round"/>')
    sail_attr = f'fill="{c["sail"]}" stroke="{L}" stroke-width=".5" stroke-linejoin="round"'
    # --- head sails
    if rag:
        jibs = [f'M{fore-.4} {tops[0]+2} L4 44 L8 45 L9.5 47.6 L13 46.8 L17 49.6 Z']
    else:
        jibs = [f'M{fore-.4} {tops[0]+1.5} L3.5 43.6 L17.5 49.6 Z', f'M{fore-.4} {tops[0]+9} L15 51.5 L33 52 Z']
    for d in jibs:
        g.append(f'<path d="{d}" {sail_attr}/>')
    if not rag:
        g.append(f'<path d="M{fore-.4} {tops[0]+1.5} L10 46.4 L17.5 49.6 Z M{fore-.4} {tops[0]+9} L24 51.7 L33 52 Z" fill="#000" opacity="{shade_op}"/>')
        g.append(f'<path d="M{fore-1} {tops[0]+4} L8 45.6 M{fore-1} {tops[0]+12} L19 51.4" stroke="{c["seam"]}" stroke-width=".3"/>')
    # --- square sails with shading, reef bands and fighting tops
    def mast(X, sails):
        for (t, b, w) in sails:
            g.append(f'<path d="M{f(X-w-1.2)} {f(t)} H{f(X+w+1.2)}" stroke="{L}" stroke-width=".9" stroke-linecap="round"/>')
            g.append(f'<path d="{sq(X, t, b, w, rag)}" {sail_attr}/>')
            g.append(f'<path d="{sq_shade(X, t, b, w)}" fill="#000" opacity="{shade_op}"/>')
            if not dark:
                g.append(f'<path d="{sq_light(X, t, b, w)}" fill="{hi}" opacity=".35"/>')
            else:
                g.append(f'<path d="{sq_light(X, t, b, w)}" fill="{hi}" opacity=".07"/>')
            # vertical seams
            sm = ' '.join(f'M{f(X + k*w)} {f(t+.6)} L{f(X + k*w*1.06)} {f(b + (1.6 if k == 0 else .9))}' for k in (-.66, -.33, 0, .33, .66))
            g.append(f'<path d="{sm}" stroke="{c["seam"]}" stroke-width=".28" fill="none"/>')
            # reef band with points
            if b - t > 8:
                ry = t + 2.2
                g.append(f'<path d="M{f(X-w+.2)} {f(ry)} H{f(X+w-.2)}" stroke="{c["seam"]}" stroke-width=".35"/>')
                pts = ' '.join(f'M{f(X - w + .9 + i*(2*w-1.8)/10)} {f(ry)} v.9' for i in range(11))
                g.append(f'<path d="{pts}" stroke="{L}" stroke-width=".18" opacity=".7"/>')
            # clewlines / buntlines
            g.append(f'<path d="M{f(X-w*.4)} {f(t)} L{f(X-w*.42)} {f(b+.8)} M{f(X+w*.4)} {f(t)} L{f(X+w*.42)} {f(b+.8)}" stroke="{R}" stroke-width=".18" opacity=".45"/>')
        # tops (platforms) at the mast joints
        for (t, b, w) in sails[1:]:
            ty = b + 1.2
            g.append(f'<path d="M{f(X-3.2)} {f(ty)} H{f(X+3.2)} L{f(X+2.2)} {f(ty+1.2)} H{f(X-2.2)} Z" fill="{L}"/>')
    if kind == 'endeavour':
        mast(fore, [(37, 51, 10.1), (23.5, 35, 8.8), (14.5, 21.8, 6.6), (8, 13, 4.6)])
        mast(main, [(35, 51, 12.2), (19, 33, 10.8), (10, 17.2, 8), (6, 8.8, 5)])
    else:
        mast(fore, [(37, 51, 10.1), (23.5, 35, 8.8), (tops[0] + 3.2, 21.8, 6.4)])
        mast(main, [(35, 51, 12.2), (19, 33, 10.8), (tops[1] + 5.4, 17.2, 7.6)])
    # --- mizzen: spanker on a gaff + mizzen topsail
    if rag:
        g.append(f'<path d="M{miz+.6} 25 L98.5 29.5 L100 41 L97.6 44 L99.6 47 L96 50.5 L85.3 52 Z" {sail_attr}/>')
        g.append(f'<path d="M{miz+.6} 25 L92 27.6 L93 51 L85.3 52 Z" fill="#000" opacity="{shade_op*.6}"/>')
    else:
        g.append(f'<path d="M{miz+.6} 24.5 L99 29.6 L100.6 51.4 L85.3 52.4 Z" {sail_attr}/>')
        g.append(f'<path d="M93 27.6 L99 29.6 L100.6 51.4 L94.6 51.8 Z" fill="#000" opacity="{shade_op}"/>')
        g.append(f'<path d="M{miz+.6} 24.5 L99 29.6 M85.3 52.4 L102 51.3" stroke="{L}" stroke-width=".85" stroke-linecap="round"/>')
        g.append(f'<path d="M89.5 26.6 L90.6 51.9 M94.5 28.3 L95.6 51.7 M{miz+.6} 33 L99.6 37 M{miz+.6} 42 L100.2 44.4" stroke="{c["seam"]}" stroke-width=".3"/>')
        mt = tops[2] + 1.2
        mb = 23.6 if kind != 'endeavour' else 22.5
        g.append(f'<path d="M{f(miz-6.8)} {f(mt)} H{f(miz+6.8)}" stroke="{L}" stroke-width=".8" stroke-linecap="round"/>')
        g.append(f'<path d="{sq(miz, mt, mb, 5.6)}" {sail_attr}/>')
        g.append(f'<path d="{sq_shade(miz, mt, mb, 5.6)}" fill="#000" opacity="{shade_op}"/>')
    if rag:
        g.append('<g fill="var(--hole,#efe3c8)"><ellipse cx="33" cy="44" rx="1.6" ry="1.2"/><ellipse cx="64" cy="26" rx="2" ry="1.5"/>'
                 '<ellipse cx="55" cy="42.5" rx="1.3" ry="1"/><ellipse cx="38" cy="29" rx="1.2" ry=".9"/><ellipse cx="93" cy="38" rx="1.1" ry="1.7"/></g>')
    # --- flags and pennants
    t1 = tops[1]
    if kind == 'revenge':
        g.append(f'<path d="M{main} {t1} H{main+8} Q{main+9.2} {t1+2.4} {main+8} {t1+4.8} H{main} Z" fill="{c["flag"]}"/>'
                 f'<circle cx="{main+4}" cy="{t1+1.8}" r="1.1" fill="#efe3c8"/><path d="M{main+2.3} {t1+3.9} L{main+5.7} {t1+3.1} M{main+2.3} {t1+3.1} L{main+5.7} {t1+3.9}" stroke="#efe3c8" stroke-width=".5"/>')
    elif kind == 'dutch':
        g.append(f'<path d="M{main-.6} {t1} L{main+9} {t1+1.6} L{main+5} {t1+2.4} L{main+10} {t1+4} L{main-.6} {t1+3.6} Z" fill="{c["flag"]}"/>')
    else:
        g.append(f'<path d="M{main} {t1} Q{main+6} {t1+.5} {main+13} {t1+1.8} Q{main+6} {t1+2.6} {main} {t1+3.6} Z" fill="{c["flag"]}"/>' +
                 (f'<path d="M{fore} {tops[0]} Q{fore+4} {tops[0]+.4} {fore+8} {tops[0]+1.4} Q{fore+4} {tops[0]+2} {fore} {tops[0]+2.4} Z" fill="{c["flag"]}"/>' if kind != 'endeavour' else ''))
    if kind in ('endeavour', 'pearl', 'revenge'):
        col = c['flag'] if kind != 'revenge' else '#14110f'
        fy = (st if kind != 'endeavour' else 44.5) - 8.4
        g.append(f'<path d="M105.6 {f(fy+8.6)} L108.6 {f(fy)}" stroke="{L}" stroke-width=".7"/><path d="M108.6 {f(fy)} Q112.2 {f(fy-.8)} 116 {f(fy+.6)} L116 {f(fy+5)} Q112.2 {f(fy+3.6)} 108.6 {f(fy+4.4)} Z" fill="{col}" stroke="{L}" stroke-width=".35"/>')
        if kind == 'endeavour':
            g.append(f'<path d="M108.8 {f(fy+.2)} H112 V{f(fy+2.2)} H108.8 Z" fill="#f4ead6"/><path d="M110.4 {f(fy+.2)} V{f(fy+2.2)} M108.8 {f(fy+1.2)} H112" stroke="#9a2b22" stroke-width=".55"/>')
    # --- hull
    st = dict(pearl=47.5, revenge=45.5, endeavour=44.5, dutch=47.5)[kind]
    if kind == 'endeavour':
        sheer = 'M10.5 50.5 L18 51 L23 51.4 L30 52.6 L80 52.6 L86 49 L94 46.6 L104 44.5'
        hull = sheer + ' L106.8 47 C105.8 57 102 65.6 95 71 Q64 73.2 33 72 C23.6 70 16.6 61 13.4 53.4 Z'
        w_y = 52.6
    else:
        sheer = f'M11 52 L18 52.4 L23 53 L30 55.4 L80 55.4 L86 51.6 L94 {f(st+2)} L104 {f(st)}'
        hull = sheer + f' L106.6 {f(st+2.4)} C105.6 57 102 65 95 70.4 Q64 72.6 33 71.4 C24 69.4 17.5 62 14 55 Z'
        w_y = 55.4
    # rudder behind the hull
    g.append(f'<path d="{hull}" fill="{c["hull"]}" stroke="{L}" stroke-width=".75" stroke-linejoin="round"/>')
    # planking
    pl = ' '.join(f'M{f(17 + k*1.2)} {f(w_y + 1.6 + k*3.1)} C36 {f(w_y + 4.2 + k*3.1)} 72 {f(w_y + 4.2 + k*3.1)} {f(104.6 - k*1.4)} {f(w_y - 2.6 + k*3.1 - (2 if kind=="endeavour" else 0))}' for k in range(5))
    g.append(f'<path d="{pl}" stroke="#000" stroke-width=".3" fill="none" opacity=".35"/>')
    # sheer highlight + rails/balusters on forecastle and quarterdeck
    g.append(f'<path d="{sheer}" fill="none" stroke="{c["trim"]}" stroke-width=".7" opacity=".9"/>')
    qd = ' '.join(f'M{f(x)} {f(w_y - 3.4 - (x-86)*.17 if x>86 else w_y-2.8)} v2.4' for x in [87, 89, 91, 93, 95, 97, 99, 101])
    fc = ' '.join(f'M{f(x)} {f(49.2 + (x-12)*.06)} v2.4' for x in [13, 15, 17, 19, 21])
    g.append(f'<path d="M86 {f(w_y-3.6)} L104 {f(st-3.4 if kind!="endeavour" else 41.6)} M12 49.2 L22 49.8" stroke="{L}" stroke-width=".55" fill="none"/>'
             f'<path d="{qd} {fc}" stroke="{L}" stroke-width=".3"/>')
    # gun deck band, ports with lids, main wale
    if kind == 'endeavour':
        g.append(f'<path d="M16.4 56 C34 58.4 74 58.4 105.4 52.4 L105 56.4 C74 62.6 34 62.4 17.6 59.6 Z" fill="{c["band"]}"/>')
        g.append(f'<path d="M19.6 62.4 C36 64.6 72 64.6 103.6 59.4 L102.6 63.2 C72 69 36 68.6 21.4 66 Z" fill="{c["band"]}"/>')
        rows = [(56.9, range(26, 102, 6)), (63.4, range(29, 100, 6))]
        for y0, xs in rows:
            for x in xs:
                y = y0 + (x-20)*-.03
                g.append(f'<rect x="{f(x)}" y="{f(y)}" width="2.6" height="2" fill="{c["port"]}"/><path d="M{f(x+.4)} {f(y+1)} h2" stroke="#4a4744" stroke-width=".7"/>')
    else:
        g.append(f'<path d="M15.6 57.2 C34 59.8 74 59.8 105.2 53 L104.2 57.4 C74 64.2 34 64.2 17.4 61.6 Z" fill="{c["band"]}"/>')
        for x in range(30, 99, 7):
            y = 61.5 - (x-20)*.036 - 1.1
            g.append(f'<rect x="{f(x-1.3)}" y="{f(y)}" width="2.6" height="2.2" fill="{c["port"]}" stroke="{c["trim"] if kind!="revenge" else c["line"]}" stroke-width=".4"/>'
                     f'<path d="M{f(x-1.4)} {f(y-.3)} L{f(x+1.6)} {f(y-2)}" stroke="{c["line"]}" stroke-width=".55"/>'
                     f'<path d="M{f(x-1.6)} {f(y+1.1)} h-1.1" stroke="#45423e" stroke-width=".8" stroke-linecap="round"/>')
    g.append(f'<path d="M21.6 64.9 C36 66.8 72 66.8 102.6 61" fill="none" stroke="{c["line"]}" stroke-width="1.2" opacity=".55"/>'
             f'<path d="M21.2 64.3 C36 66.2 72 66.2 102.6 60.4" fill="none" stroke="{c["trim"]}" stroke-width=".35" opacity=".8"/>')
    # channels with deadeyes under the shrouds
    for x0, x1 in ((28, 44), (51, 69), (78, 90)):
        y = w_y + .9 if x1 < 86 else 52.4
        g.append(f'<path d="M{x0} {f(y)} H{x1}" stroke="{c["line"]}" stroke-width=".9"/>' +
                 ''.join(f'<circle cx="{f(x)}" cy="{f(y-.6)}" r=".45" fill="{c["trim"]}"/>' for x in range(x0+1, x1, 3)))
    # lower hull shade (copper bottom in shadow)
    g.append('<path d="M22 66.4 C40 69.6 74 69.6 101 63.4 C99.6 66.4 97.6 68.8 95 70.4 Q64 72.6 33 71.4 C28.6 70.4 25 68.6 22 66.4 Z" fill="#000" opacity=".28"/>')
    if c['light']:
        g.append(f'<path d="M20 58 C36 60.4 72 60.4 103 54.6" stroke="#fff" stroke-width="1.2" fill="none" opacity="{c["light"]}"/>')
    # beakhead and figurehead
    g.append(f'<path d="M14 55 Q10.6 53.8 9.2 51 Q11.4 51.4 12.8 52.6" fill="{c["trim"]}" stroke="{L}" stroke-width=".35"/>'
             f'<path d="M11 52 Q8.6 52.6 7.4 51.2 Q8 49.6 9.6 50.2" fill="{c["trim"]}" stroke="{L}" stroke-width=".35"/>')
    # anchor at the cathead
    g.append(f'<path d="M19.6 54.4 V58.6 M18.6 55.2 H20.6 M18.2 57.6 Q19.6 59.6 21 57.6" stroke="#2b2a28" stroke-width=".55" fill="none" stroke-linecap="round"/>')
    # stern: quarter gallery with lit windows, carved trim, lanterns
    gy = st + 2.4
    g.append(f'<path d="M95.6 {f(gy)} H104.2 Q105.4 {f(gy+4)} 103.6 {f(gy+8)} H96.4 Q95 {f(gy+4)} 95.6 {f(gy)} Z" fill="{c["hull"]}" stroke="{c["trim"]}" stroke-width=".45"/>')
    g.append(''.join(f'<rect x="{f(96.8 + i*2.3)}" y="{f(gy+1.6)}" width="1.5" height="2" fill="#f0cf7e" stroke="{L}" stroke-width=".2"/>' for i in range(3)))
    g.append(f'<path d="M96.4 {f(gy+5.2)} H103.8" stroke="{c["trim"]}" stroke-width=".4"/><path d="M97.6 {f(gy+8)} Q100 {f(gy+10)} 102.4 {f(gy+8)}" fill="{c["trim"]}" opacity=".8"/>')
    lan = [(102.6, st - 1.4)] + ([(99.8, st - 1), (97, st - .5)] if kind in ('endeavour', 'revenge') else [])
    for x, y in lan:
        g.append(f'<path d="M{f(x)} {f(y+.9)} v1.4" stroke="{L}" stroke-width=".35"/><rect x="{f(x-.7)}" y="{f(y-.9)}" width="1.4" height="1.9" rx=".3" fill="#f0cf7e" stroke="{L}" stroke-width=".3"/>')
    if kind == 'dutch':
        g.append('<path d="M40 71.4 q-.6 1.4 0 2.8 M52 71.6 q.8 1.8 0 3.6 M66 71.6 q-.6 1.2 0 2.4 M78 71.4 q.7 1.6 0 3.2 M88 70.8 q-.6 1.3 0 2.6 M30 70.6 q.5 1 0 2" stroke="#4f6b55" stroke-width=".7" fill="none" stroke-linecap="round"/>'
                 '<g fill="#d9e2d2" opacity=".75"><circle cx="45" cy="66" r=".5"/><circle cx="47" cy="67.3" r=".35"/><circle cx="71" cy="66.6" r=".45"/><circle cx="84" cy="64.6" r=".4"/><circle cx="58" cy="68.2" r=".4"/></g>')
    # water at the hull: bow wave and a wake line
    if water:
        g.append('<path d="M12 70.2 Q20 68 26 70.6 Q30 72.4 36 72 M96 70.6 Q104 71.6 112 70.4" fill="none" stroke="#5f8794" stroke-width=".7" stroke-linecap="round" opacity=".8"/>'
                 '<path d="M14 71 Q18 69.6 22 71" fill="none" stroke="#ffffff" stroke-width=".9" stroke-linecap="round" opacity=".8"/>'
                 '')
    return '\n'.join(g)

if __name__ == '__main__':
    print(json.dumps({k: ship(k) for k in ('pearl', 'revenge', 'endeavour', 'dutch')}, ensure_ascii=False))
