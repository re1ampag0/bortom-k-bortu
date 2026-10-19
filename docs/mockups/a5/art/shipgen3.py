# Detailed ships v3 — built on shipgen2 (viewBox 0 0 120 78, bow left, waterline ~71).
# More hull work (wales, planking with butts, chainplates, hammock netting, open ports with guns, head rails,
# two-tier stern gallery, rudder), more rig (jib-boom, spritsail yard, bobstays, footropes, braces, mast bands,
# crosstrees), sails with gradient, bolt-ropes, patches and tears, flags of each ship.
# small=True gives a lighter version for the 58x28 icon in the plank head.
import json, sys
sys.path.insert(0, '.')
from shipgen2 import f, sq, sq_shade, sq_light

P = dict(
    pearl=dict(hull='#1d1916', hullTop='#3b332c', band='#2a2420', wale='#0b0908', trim='#a8894a', sail='#34302c', sail2='#1b1816',
               seam='#4c453e', line='#080706', rig='#0b0908', flag='#0d0b0a', port='#030303', patch='#463f38', glow='#ffcf6a',
               lid='#1d1916', shade=.3, hi=.07, net='#2a2420'),
    revenge=dict(hull='#4a1a10', hullTop='#7a2e1c', band='#1a1311', wale='#0e0a08', trim='#d6c294', sail='#cdb184', sail2='#a3865a',
                 seam='#8f744c', line='#160806', rig='#24140c', flag='#0d0b0a', port='#0a0504', patch='#a88a5a', glow='#ffbe5a',
                 lid='#4a1a10', shade=.2, hi=.22, net='#6b5a44'),
    endeavour=dict(hull='#221e1a', hullTop='#3e3730', band='#d2a440', wale='#0f0d0b', trim='#ecd08a', sail='#f8f3e6', sail2='#ddd3bb',
                   seam='#c9bb98', line='#14100c', rig='#2a2014', flag='#a3261c', port='#0f0d0b', patch=None, glow='#ffd98a',
                   lid='#221e1a', shade=.15, hi=.35, net='#e8e0cc'),
    company=dict(hull='#2c2016', hullTop='#4a3624', band='#cfa044', wale='#120d08', trim='#e8cb84', sail='#f6f0e0', sail2='#d8cdb2',
                 seam='#c4b592', line='#140e08', rig='#2a2014', flag='#a3261c', port='#120d08', patch=None, glow='#ffd98a',
                 lid='#2c2016', shade=.15, hi=.33, net='#e2d9c2'),
    merchant=dict(hull='#5a3a22', hullTop='#8a5e38', band='#2f5470', wale='#1a120a', trim='#d6c294', sail='#efe6cf', sail2='#cdbf9e',
                  seam='#b9a982', line='#1e140a', rig='#2a2014', flag='#2f4f66', port='#140e08', patch='#d9caa4', glow='#ffd98a',
                  lid='#5a3a22', shade=.16, hi=.3, net='#cdbf9e'),
    dutch=dict(hull='#2e3a34', hullTop='#4a5a51', band='#25302b', wale='#121a16', trim='#7f978a', sail='#879a8f', sail2='#56685e',
               seam='#63756b', line='#0e1411', rig='#18221d', flag='#1e2824', port='#060a08', patch=None, glow='#9affd0',
               lid='#2e3a34', shade=.24, hi=.08, net='#4a5a51'),
)

def ship(kind, small=False):
    c = P[kind]; k = kind
    L, R = c['line'], c['rig']
    rag = kind == 'dutch'
    two = kind in ('endeavour', 'company')
    dark = kind in ('pearl',)
    fore, main, miz = 36, 60, 84
    tops = dict(pearl=(13, 4.5, 12), revenge=(13, 6, 13.5), endeavour=(6.5, 1.8, 10), company=(6.5, 1.8, 10), merchant=(12, 5, 13), dutch=(14.5, 5, 13))[kind]
    st = dict(pearl=47.5, revenge=45.5, endeavour=44.5, company=44.5, merchant=46.5, dutch=47.5)[kind]
    g = []
    det = not small
    sw = (lambda w: f(w * 1.5)) if small else f
    # ---------- defs
    g.append(f'<defs>'
             f'<linearGradient id="{k}H" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="{c["hullTop"]}"/><stop offset=".45" stop-color="{c["hull"]}"/><stop offset="1" stop-color="{c["hull"]}"/></linearGradient>'
             f'<linearGradient id="{k}S" x1="0" y1="0" x2="1" y2=".3"><stop offset="0" stop-color="{c["sail"]}"/><stop offset=".55" stop-color="{c["sail"]}"/><stop offset="1" stop-color="{c["sail2"]}"/></linearGradient>'
             f'<linearGradient id="{k}Y" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#000" stop-opacity="{.45 if dark else .28}"/><stop offset="1" stop-color="#000" stop-opacity="0"/></linearGradient>'
             f'<linearGradient id="{k}L" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#fff" stop-opacity=".1"/><stop offset=".4" stop-color="#fff" stop-opacity="0"/><stop offset=".75" stop-color="#000" stop-opacity=".12"/><stop offset="1" stop-color="#000" stop-opacity=".32"/></linearGradient>'
             f'<radialGradient id="{k}G"><stop offset="0" stop-color="{c["glow"]}" stop-opacity=".9"/><stop offset="1" stop-color="{c["glow"]}" stop-opacity="0"/></radialGradient>'
             f'</defs>')
    # ---------- shadow on the water (the reflection is drawn after the hull)
    g.append('<ellipse cx="60" cy="72.4" rx="48" ry="1.8" fill="#000" opacity=".14"/>')
    # ---------- standing rigging behind the sails
    g.append(f'<g stroke="{R}" stroke-width="{sw(.32)}" fill="none" opacity=".8">'
             f'<path d="M{fore} {tops[0]} L29 55.4 M{fore} {tops[0]} L32 55.4 M{fore} {tops[0]} L40 55.4 M{fore} {tops[0]} L43 55.4 '
             f'M{main} {tops[1]} L52 55.4 M{main} {tops[1]} L55 55.4 M{main} {tops[1]} L65 55.4 M{main} {tops[1]} L68 55.4 '
             f'M{miz} {tops[2]} L79 55 M{miz} {tops[2]} L89.5 51.4 '
             f'M{fore} {tops[0]} L1.6 42.4 M{fore} {f(tops[0]+8)} L7 45.6 M{main} {f(tops[1]+1)} L{fore} {f(tops[0]+3)} M{main} {f(tops[1]+12)} L{fore+1} 36 '
             f'M{miz} {tops[2]} L{main} {f(tops[1]+7)} M{miz} {f(tops[2]+2)} L105 {48 if not two else 45}"/></g>')
    if det:
        rat = []
        for X in (fore, main, miz):
            for kk in range(7):
                y = 54.8 - kk * 2.1
                half = 6.2 - kk * .82
                rat.append(f'M{f(X-half)} {f(y)} H{f(X+half)}')
        g.append(f'<path d="{" ".join(rat)}" stroke="{R}" stroke-width=".18" opacity=".6"/>')
        # backstays to the channels
        g.append(f'<path d="M{fore} {f(tops[0]+1)} L46 55.2 M{main} {f(tops[1]+1)} L71 55.2 M{miz} {f(tops[2]+1)} L92 50.6" stroke="{R}" stroke-width=".26" opacity=".55"/>')
    # ---------- bowsprit, jib-boom, spritsail yard, bobstays
    g.append(f'<path d="M18 52.4 L5 44.6" stroke="{L}" stroke-width="{sw(1.6)}" stroke-linecap="round"/>'
             f'<path d="M7.4 46 L1.4 42.4" stroke="{L}" stroke-width="{sw(.95)}" stroke-linecap="round"/>')
    if det:
        g.append(f'<path d="M6.2 45.4 L6.8 48.8 M9.6 47.4 L13 54 M6.8 48.8 L13.4 55 M6.8 48.8 L1.6 42.6" stroke="{R}" stroke-width=".3" fill="none" opacity=".8"/>'
                 f'<path d="M7.6 50.4 L12.4 43.6" stroke="{L}" stroke-width=".7" stroke-linecap="round"/>'
                 f'<path d="M8.4 46 v1 M10.6 47.3 v1 M12.8 48.6 v1 M15 49.9 v1" stroke="{c["trim"]}" stroke-width=".5" opacity=".7"/>')
    # ---------- masts with bands, caps and crosstrees
    def mx(X, kk): return X + (kk if rag else 0)
    for X, top, lean in ((fore, tops[0], 1.2), (main, tops[1], -.6), (miz, tops[2], -.8)):
        g.append(f'<path d="M{X} 56 L{f(mx(X, 0))} 36" stroke="{L}" stroke-width="{sw(1.45)}" stroke-linecap="round"/>'
                 f'<path d="M{X} 37 L{f(mx(X, lean))} {top}" stroke="{L}" stroke-width="{sw(1)}" stroke-linecap="round"/>')
        if det:
            g.append(f'<path d="M{f(X-.25)} 55 V37.5" stroke="#fff" stroke-width=".3" opacity="{.12 if dark else .3}"/>' +
                     ''.join(f'<path d="M{f(X-.8)} {f(y)} h1.6" stroke="{c["trim"]}" stroke-width=".35" opacity=".8"/>' for y in (40, 44, 48)) +
                     f'<path d="M{f(X-2.6)} 36.4 h5.2 M{f(X-.9)} 35.4 h1.8 v1.6 h-1.8 z" stroke="{L}" stroke-width=".45" fill="{L}"/>')
    if kind == 'dutch':  # the broken fore topgallant hangs aslant
        g.append(f'<path d="M{fore+1.2} {tops[0]} L{fore+4.4} {tops[0]-5.4}" stroke="{L}" stroke-width="{sw(.8)}" stroke-linecap="round"/>'
                 f'<path d="M{fore+2.4} {tops[0]-2.6} L{fore+7.2} {tops[0]-.6}" stroke="{L}" stroke-width="{sw(.6)}" stroke-linecap="round"/>')
    sa = f'fill="url(#{k}S)" stroke="{L}" stroke-width="{sw(.5)}" stroke-linejoin="round"'
    shade_op = c['shade']
    # ---------- head sails
    if rag:
        jibs = [f'M{fore-.4} {tops[0]+2} L4.6 43.8 L8 45 L9.5 47.6 L13 46.8 L17 49.6 Z']
    else:
        jibs = [f'M{fore-.4} {tops[0]+1.5} L3 43 L17.5 49.6 Z', f'M{fore-.4} {tops[0]+9} L15 51.5 L33 52 Z']
    for d in jibs:
        g.append(f'<path d="{d}" {sa}/>')
    if not rag:
        g.append(f'<path d="M{fore-.4} {tops[0]+1.5} L10 46.4 L17.5 49.6 Z M{fore-.4} {tops[0]+9} L24 51.7 L33 52 Z" fill="#000" opacity="{shade_op}"/>')
        if det:
            g.append(f'<path d="M{fore-1} {tops[0]+4} L8 45.6 M{fore-1} {tops[0]+7} L13 47.8 M{fore-1} {tops[0]+12} L19 51.4 M{fore-1} {tops[0]+15} L26 51.8" stroke="{c["seam"]}" stroke-width=".26"/>')
    # ---------- square sails
    def patch(X, y, w, h):
        if not c['patch'] or not det: return ''
        return (f'<rect x="{f(X)}" y="{f(y)}" width="{f(w)}" height="{f(h)}" fill="{c["patch"]}" stroke="{c["seam"]}" stroke-width=".22"/>'
                f'<rect x="{f(X+.35)}" y="{f(y+.35)}" width="{f(w-.7)}" height="{f(h-.7)}" fill="none" stroke="{L}" stroke-width=".14" stroke-dasharray=".5 .4" opacity=".7"/>')
    def mast(X, sails, mi):
        for si, (t, b, w) in enumerate(sails):
            g.append(f'<path d="M{f(X-w-1.3)} {f(t)} H{f(X+w+1.3)}" stroke="{L}" stroke-width="{sw(.95)}" stroke-linecap="round"/>')
            g.append(f'<path d="{sq(X, t, b, w, rag)}" {sa}/>')
            g.append(f'<path d="{sq_shade(X, t, b, w)}" fill="#000" opacity="{shade_op}"/>')
            g.append(f'<path d="{sq_light(X, t, b, w)}" fill="#fff" opacity="{c["hi"]}"/>')
            g.append(f'<path d="M{f(X-w)} {f(t)} H{f(X+w)} L{f(X+w*1.01)} {f(t+min(2.2,(b-t)*.24))} H{f(X-w*1.01)} Z" fill="url(#{k}Y)"/>')
            if det:
                g.append(f'<path d="M{f(X-w*1.07)} {f(b)} Q{f(X)} {f(b+min(2.6,(b-t)*.2))} {f(X+w*1.07)} {f(b)}" stroke="#000" stroke-width=".55" fill="none" opacity=".18"/>'
                         f'<path d="M{f(X-w+.3)} {f(t+.8)} Q{f(X-w*1.07-.2)} {f(t+(b-t)*.55)} {f(X-w*1.07+.3)} {f(b-.4)}" stroke="#fff" stroke-width=".35" fill="none" opacity="{.12 if dark else .5}"/>')
            if det:
                sm = ' '.join(f'M{f(X + q*w)} {f(t+.6)} L{f(X + q*w*1.06)} {f(b + (1.6 if q == 0 else .9))}' for q in (-.8, -.6, -.4, -.2, 0, .2, .4, .6, .8))
                g.append(f'<path d="{sm}" stroke="{c["seam"]}" stroke-width=".2" fill="none" opacity=".85"/>')
                if b - t > 8:
                    for ry in (t + 2.2, t + 4.2):
                        g.append(f'<path d="M{f(X-w+.2)} {f(ry)} H{f(X+w-.2)}" stroke="{c["seam"]}" stroke-width=".3"/>')
                        pts = ' '.join(f'M{f(X - w + .9 + i*(2*w-1.8)/12)} {f(ry)} v.8' for i in range(13))
                        g.append(f'<path d="{pts}" stroke="{L}" stroke-width=".14" opacity=".6"/>')
                g.append(f'<path d="M{f(X-w*.4)} {f(t)} L{f(X-w*.42)} {f(b+.8)} M{f(X+w*.4)} {f(t)} L{f(X+w*.42)} {f(b+.8)}" stroke="{R}" stroke-width=".16" opacity=".45"/>')
                # footrope under the yard and the lifts to the mast
                g.append(f'<path d="M{f(X-w-1)} {f(t+.3)} Q{f(X-w/2)} {f(t+1.4)} {f(X)} {f(t+.5)} Q{f(X+w/2)} {f(t+1.4)} {f(X+w+1)} {f(t+.3)}" stroke="{R}" stroke-width=".16" fill="none" opacity=".6"/>'
                         f'<path d="M{f(X-w-1.2)} {f(t)} L{f(X)} {f(t-3.4)} L{f(X+w+1.2)} {f(t)}" stroke="{R}" stroke-width=".14" fill="none" opacity=".45"/>')
                # braces aft
                g.append(f'<path d="M{f(X+w+1.2)} {f(t)} L{f(X+w+9)} {f(t+5.4)}" stroke="{R}" stroke-width=".16" opacity=".45"/>')
            # patches and tears
            if kind == 'pearl' and det:
                if (mi + si) % 2 == 0: g.append(patch(X - w * .6, t + (b - t) * .45, w * .42, (b - t) * .26))
                if si == 0: g.append(f'<path d="M{f(X+w*.3)} {f(t+(b-t)*.3)} l.9 1.6 l-.3 1.4 l.7 1.8 l-.5 -.1 l-.6 -1.6 l.2 -1.3 Z" fill="var(--hole,#efe3c8)" stroke="{L}" stroke-width=".15"/>')
            if kind == 'revenge' and det and (mi + si) % 3 == 1:
                g.append(patch(X + w * .1, t + (b - t) * .3, w * .44, (b - t) * .3))
        for (t, b, w) in sails[1:]:
            ty = b + 1.2
            g.append(f'<path d="M{f(X-3.2)} {f(ty)} H{f(X+3.2)} L{f(X+2.2)} {f(ty+1.2)} H{f(X-2.2)} Z" fill="{L}"/>')
            if det: g.append(f'<path d="M{f(X-3)} {f(ty)} H{f(X+3)}" stroke="{c["trim"]}" stroke-width=".25" opacity=".7"/>')
    if two:
        mast(fore, [(37, 51, 10.1), (23.5, 35, 8.8), (14.5, 21.8, 6.6), (8, 13, 4.6)], 0)
        mast(main, [(35, 51, 12.2), (19, 33, 10.8), (10, 17.2, 8), (5.4, 8.8, 5)], 1)
    else:
        mast(fore, [(37, 51, 10.1), (23.5, 35, 8.8), (tops[0] + 3.2, 21.8, 6.4)], 0)
        mast(main, [(35, 51, 12.2), (19, 33, 10.8), (tops[1] + 5.4, 17.2, 7.6)], 1)
    # ---------- mizzen: spanker + topsail
    if rag:
        g.append(f'<path d="M{miz+.6} 25 L98.5 29.5 L100 41 L97.6 44 L99.6 47 L96 50.5 L85.3 52 Z" {sa}/>')
        g.append(f'<path d="M{miz+.6} 25 L92 27.6 L93 51 L85.3 52 Z" fill="#000" opacity="{shade_op*.6}"/>')
        g.append(f'<path d="M{miz+.6} 25 L98.5 29.5" stroke="{L}" stroke-width="{sw(.8)}" stroke-linecap="round"/>')
    else:
        g.append(f'<path d="M{miz+.6} 24.5 L99 29.6 L100.6 51.4 L85.3 52.4 Z" {sa}/>')
        g.append(f'<path d="M93 27.6 L99 29.6 L100.6 51.4 L94.6 51.8 Z" fill="#000" opacity="{shade_op}"/>')
        g.append(f'<path d="M{miz+.6} 24.5 L99 29.6 M85.3 52.4 L102 51.3" stroke="{L}" stroke-width="{sw(.85)}" stroke-linecap="round"/>')
        if det:
            g.append(f'<path d="M87.4 25.8 L88.4 52.1 M89.5 26.6 L90.6 51.9 M91.6 27.2 L92.7 51.8 M94.5 28.3 L95.6 51.7 M96.8 29 L97.8 51.6 M{miz+.6} 33 L99.6 37 M{miz+.6} 42 L100.2 44.4" stroke="{c["seam"]}" stroke-width=".22"/>'
                     f'<path d="M99 29.6 L106.4 41.4 M100.6 51.4 L106 47.4" stroke="{R}" stroke-width=".2" opacity=".6"/>')
        mt = tops[2] + 1.2
        mb = 23.6 if not two else 22.5
        g.append(f'<path d="M{f(miz-6.8)} {f(mt)} H{f(miz+6.8)}" stroke="{L}" stroke-width="{sw(.8)}" stroke-linecap="round"/>')
        g.append(f'<path d="{sq(miz, mt, mb, 5.6)}" {sa}/>')
        g.append(f'<path d="{sq_shade(miz, mt, mb, 5.6)}" fill="#000" opacity="{shade_op}"/>')
        if kind == 'pearl' and det: g.append(f'<path d="M{miz-2} {f(mt+3)} l.8 1.4 l-.2 1.4 l-.5 -.1 l-.1 -1.2 Z" fill="var(--hole,#efe3c8)" stroke="{L}" stroke-width=".15"/>')
    if rag and det:  # rags hanging from the yards
        for X, t, w in ((fore, 37, 10.1), (main, 35, 12.2), (main, 19, 10.8), (fore, 23.5, 8.8)):
            for q in (-.85, .7):
                x = X + q * w
                g.append(f'<path d="M{f(x-.5)} {f(t)} L{f(x+.6)} {f(t)} L{f(x+.4)} {f(t+3.2)} L{f(x+.1)} {f(t+2.4)} L{f(x-.3)} {f(t+3.8)} Z" fill="{c["sail2"]}" stroke="{L}" stroke-width=".15"/>')
    if rag:
        g.append('<g fill="var(--hole,#efe3c8)"><ellipse cx="33" cy="44" rx="1.6" ry="1.2"/><ellipse cx="64" cy="26" rx="2" ry="1.5"/>'
                 '<ellipse cx="55" cy="42.5" rx="1.3" ry="1"/><ellipse cx="38" cy="29" rx="1.2" ry=".9"/><ellipse cx="93" cy="38" rx="1.1" ry="1.7"/>'
                 '<ellipse cx="66" cy="45.6" rx=".9" ry=".7"/><ellipse cx="57" cy="22.4" rx=".8" ry="1.1"/></g>')
        if det:
            g.append(f'<path d="M30 40 l-1.6 3 M41 46 l1.4 2.4 M68 28 l1.2 2.6 M51 24 l-1 2 M88 33 l1.4 1.6" stroke="{c["sail2"]}" stroke-width=".5" fill="none"/>'
                     f'<path d="M26.4 51.6 q-.4 1.8 .4 3 M47 51.6 q.5 1.6 -.2 2.8 M72 51.6 q-.4 1.4 .3 2.6" stroke="{c["sail"]}" stroke-width=".5" fill="none" opacity=".8"/>')
    # ---------- flags and pennants
    from flags import calico, crossbones, skull, place, wave_flag
    t1 = tops[1] - (2.6 if kind in ('pearl', 'revenge') else 0)
    ink = '#15110e'
    if kind in ('pearl', 'revenge'):  # a flagstaff above the main truck so the flag clears the topgallant
        g.append(f'<path d="M{main} {tops[1]+.4} V{f(t1-.3)}" stroke="{L}" stroke-width="{sw(.45)}"/><circle cx="{main}" cy="{f(t1-.5)}" r=".45" fill="{c["trim"]}"/>')
    if kind == 'revenge':  # Blackbeard's flag: a horned skeleton, spear at a bleeding heart, hourglass raised
        d, sh = wave_flag(main, t1, 11.6, 7, ink, L)
        g.append(f'<path d="{d}" fill="{ink}" stroke="{L}" stroke-width=".25"/>' + (sh if det else ''))
        x, y = main, t1
        B = '#ece4d0'
        if det:
            g.append(f'<g stroke="{B}" stroke-linecap="round" fill="none">'
                     # horns
                     f'<path d="M{f(x+2.62)} {f(y+1.55)} q-.55 -.3 -.45 -1 M{f(x+3.38)} {f(y+1.55)} q.55 -.3 .45 -1" stroke-width=".22"/>'
                     # spine, pelvis, legs
                     f'<path d="M{f(x+3)} {f(y+2.7)} V{f(y+4.9)}" stroke-width=".3"/>'
                     f'<path d="M{f(x+2.4)} {f(y+5)} q.6 .4 1.2 0 M{f(x+2.6)} {f(y+5.2)} L{f(x+2.2)} {f(y+6.6)} M{f(x+3.4)} {f(y+5.2)} L{f(x+3.9)} {f(y+6.6)}" stroke-width=".26"/>'
                     # ribs
                     f'<path d="M{f(x+2.2)} {f(y+3.1)} q.8 .3 1.6 0 M{f(x+2.25)} {f(y+3.6)} q.75 .3 1.5 0 M{f(x+2.35)} {f(y+4.1)} q.65 .25 1.3 0" stroke-width=".18"/>'
                     # arms: left raises the hourglass, right thrusts the spear
                     f'<path d="M{f(x+2.3)} {f(y+2.95)} L{f(x+1.5)} {f(y+2.4)} L{f(x+1.3)} {f(y+1.6)} M{f(x+3.7)} {f(y+2.95)} L{f(x+4.6)} {f(y+3.5)} L{f(x+5.3)} {f(y+3.2)}" stroke-width=".22"/>'
                     # spear
                     f'<path d="M{f(x+4.6)} {f(y+3.7)} L{f(x+8)} {f(y+2.7)}" stroke-width=".18"/></g>'
                     f'<path d="M{f(x+8)} {f(y+2.35)} l.9 .1 l-.65 .62 Z" fill="{B}"/>'
                     + place(skull(ink), x + 3, y + 2.3, .32) +
                     # hourglass
                     f'<path d="M{f(x+.7)} {f(y+.5)} h1.2 M{f(x+.7)} {f(y+1.9)} h1.2" stroke="{B}" stroke-width=".22"/>'
                     f'<path d="M{f(x+.85)} {f(y+.6)} L{f(x+1.75)} {f(y+.6)} L{f(x+1.3)} {f(y+1.2)} L{f(x+1.75)} {f(y+1.8)} L{f(x+.85)} {f(y+1.8)} L{f(x+1.3)} {f(y+1.2)} Z" fill="{B}"/>'
                     f'<path d="M{f(x+1.05)} {f(y+1.75)} L{f(x+1.3)} {f(y+1.45)} L{f(x+1.55)} {f(y+1.75)} Z" fill="#c9a24a"/>'
                     # bleeding heart with three drops
                     f'<path d="M{f(x+9.3)} {f(y+2)} q.55 -.7 1.05 -.05 q.5 -.65 1.05 .05 q.05 .95 -1.05 1.85 q-1.1 -.9 -1.05 -1.85 Z" fill="#c8281c"/>'
                     f'<path d="M{f(x+9.6)} {f(y+1.8)} q.2 -.25 .45 -.1" stroke="#ff8a7a" stroke-width=".15" fill="none"/>'
                     f'<g fill="#c8281c"><ellipse cx="{f(x+9.9)}" cy="{f(y+4.5)}" rx=".18" ry=".26"/><ellipse cx="{f(x+10.5)}" cy="{f(y+5.2)}" rx=".15" ry=".22"/><ellipse cx="{f(x+10)}" cy="{f(y+5.9)}" rx=".14" ry=".2"/></g>')
        else:
            g.append(place(skull(ink, False), x + 3.4, y + 3.4, .5) + f'<path d="M{f(x+9.4)} {f(y+2.4)} q.6 -.7 1.1 0 q.5 -.7 1.1 0 q0 1 -1.1 1.9 q-1.1 -.9 -1.1 -1.9 Z" fill="#c8281c"/>')
        # the red "no quarter" pennant on the fore
        g.append(f'<path d="M{fore} {tops[0]} Q{fore+5} {tops[0]-.2} {fore+11} {tops[0]+1.4} Q{fore+6} {tops[0]+1.4} {fore+9} {tops[0]+2.2} Q{fore+5} {tops[0]+2.2} {fore} {tops[0]+2.8} Z" fill="#9a1f16" stroke="{L}" stroke-width=".2"/>')
    elif kind == 'dutch':  # a rotted flag in shreds, the old skull barely showing through
        d = (f'M{main-.6} {t1} C{main+3} {t1-.6} {main+7} {t1+.6} {main+10.4} {t1+.4} L{main+9} {t1+1.8} L{main+10.8} {t1+2.6} L{main+8.4} {t1+3.2} '
             f'L{main+10} {t1+4.8} L{main+7} {t1+4.4} L{main+7.6} {t1+6.2} L{main+4.8} {t1+5.2} L{main+3.6} {t1+6.8} L{main+2.4} {t1+5.6} L{main-.6} {t1+6.2} Z')
        g.append(f'<path d="{d}" fill="{c["flag"]}" stroke="{L}" stroke-width=".2"/>')
        if det:
            g.append(f'<g opacity=".38">{place(skull(c["flag"]), main + 4.4, t1 + 3.6, .62)}</g>'
                     f'<ellipse cx="{main+2}" cy="{t1+2}" rx=".5" ry=".35" fill="var(--hole,#efe3c8)" opacity=".85"/><ellipse cx="{main+6.8}" cy="{t1+1.6}" rx=".35" ry=".5" fill="var(--hole,#efe3c8)" opacity=".85"/>')
    elif kind == 'pearl':  # Jack Rackham's flag: skull over crossed cutlasses
        d, sh = wave_flag(main, t1, 11.6, 7.2, ink, L)
        g.append(f'<path d="{d}" fill="{ink}" stroke="{L}" stroke-width=".25"/>' + (sh if det else '') + place(calico(ink, det), main + 5.8, t1 + 3.9, .78))
        g.append(f'<path d="M{fore} {tops[0]} Q{fore+4} {tops[0]+.4} {fore+8} {tops[0]+1.4} Q{fore+4} {tops[0]+2} {fore} {tops[0]+2.4} Z" fill="{ink}"/>')
    else:  # navy and merchants: a long commissioning pennant
        g.append(f'<path d="M{main} {t1} Q{main+9} {t1+.4} {main+20} {t1+1.6} Q{main+9} {t1+1.6} {main} {t1+2.2} Z" fill="{c["flag"]}"/>')
    # stern ensign
    fy = (st if not two else 44.5) - 8.4
    if kind != 'dutch':
        col = ink if kind in ('pearl', 'revenge') else c['flag']
        g.append(f'<path d="M105.6 {f(fy+8.6)} L108.6 {f(fy)}" stroke="{L}" stroke-width=".7"/><path d="M108.6 {f(fy)} Q112.2 {f(fy-.8)} 116 {f(fy+.6)} L116 {f(fy+5)} Q112.2 {f(fy+3.6)} 108.6 {f(fy+4.4)} Z" fill="{col}" stroke="{L}" stroke-width=".35"/>')
        if det: g.append(f'<path d="M112 {f(fy-.3)} Q112.6 {f(fy+2)} 112 {f(fy+4)} L113.4 {f(fy+4)} Q114 {f(fy+2)} 113.4 {f(fy-.2)} Z" fill="#000" opacity=".2"/>')
        if kind == 'company':  # the striped company ensign
            g.append(f'<clipPath id="{k}F"><path d="M108.6 {f(fy)} Q112.2 {f(fy-.8)} 116 {f(fy+.6)} L116 {f(fy+5)} Q112.2 {f(fy+3.6)} 108.6 {f(fy+4.4)} Z"/></clipPath><g clip-path="url(#{k}F)">' + ''.join(f'<rect x="108.4" y="{f(fy-1+i*.9)}" width="7.6" height=".45" fill="#f4ead6"/>' for i in range(8)) + f'<rect x="108.6" y="{f(fy-1)}" width="3.2" height="{f(3.2)}" fill="#f4ead6"/><path d="M110.2 {f(fy-1)} V{f(fy+2.2)} M108.6 {f(fy+.7)} H111.8" stroke="#a3261c" stroke-width=".6"/></g>')
        elif kind == 'merchant':
            g.append(f'<path d="M110.6 {f(fy-.2)} V{f(fy+4.6)} M108.6 {f(fy+2.2)} H116" stroke="#f4ead6" stroke-width=".8"/>')
        elif two:
            g.append(f'<path d="M108.8 {f(fy+.2)} H112 V{f(fy+2.3)} H108.8 Z" fill="#f4ead6"/><path d="M110.4 {f(fy+.2)} V{f(fy+2.3)} M108.8 {f(fy+1.25)} H112" stroke="#a3261c" stroke-width=".6"/><path d="M108.8 {f(fy+.2)} L112 {f(fy+2.3)} M112 {f(fy+.2)} L108.8 {f(fy+2.3)}" stroke="#a3261c" stroke-width=".25"/>')
        elif kind == 'pearl':
            g.append(place(calico(col, det), 112.3, fy + 2.1, .5))
        elif kind == 'revenge':
            g.append(place(crossbones(col, det), 112.3, fy + 2.1, .5))
    # ---------- hull
    if two:
        sheer = 'M10.5 50.5 L18 51 L23 51.4 L30 52.6 L80 52.6 L86 49 L94 46.6 L104 44.5'
        hull = sheer + ' L106.8 47 C105.8 57 102 65.6 95 71 Q64 73.2 33 72 C23.6 70 16.6 61 13.4 53.4 Z'
        w_y = 52.6
    else:
        sheer = f'M11 52 L18 52.4 L23 53 L30 55.4 L80 55.4 L86 51.6 L94 {f(st+2)} L104 {f(st)}'
        hull = sheer + f' L106.6 {f(st+2.4)} C105.6 57 102 65 95 70.4 Q64 72.6 33 71.4 C24 69.4 17.5 62 14 55 Z'
        w_y = 55.4
    # rudder behind the stern
    g.append(f'<path d="M105.9 {f(st+3)} L107.7 {f(st+3.5)} C107.2 58 104.2 66.6 97.8 70.8 L95.6 70.4 C102 65 105.6 57 105.9 {f(st+3)} Z" fill="{c["hull"]}" stroke="{L}" stroke-width=".4"/>')
    if det: g.append(f'<path d="M106.6 {f(st+3.6)} C106.2 58 103.4 66 97.4 70.2" stroke="{c["trim"]}" stroke-width=".25" fill="none" opacity=".5"/>')
    g.append(f'<clipPath id="{k}C"><path d="{hull}"/></clipPath>')
    g.append(f'<path d="{hull}" fill="url(#{k}H)" stroke="{L}" stroke-width="{sw(.75)}" stroke-linejoin="round"/>')
    g.append(f'<g clip-path="url(#{k}C)">')
    if det:
        pl = ' '.join(f'M{f(14 + q*1.1)} {f(w_y + .8 + q*2.05)} C36 {f(w_y + 3.4 + q*2.05)} 72 {f(w_y + 3.4 + q*2.05)} {f(106 - q*1.2)} {f(w_y - 3.4 + q*2.05 - (2 if kind=="endeavour" else 0))}' for q in range(9))
        g.append(f'<path d="{pl}" stroke="#000" stroke-width=".26" fill="none" opacity=".4"/>')
        g.append(f'<path d="{pl}" stroke="#fff" stroke-width=".14" fill="none" opacity=".07" transform="translate(0 .4)"/>')
        butts = ' '.join(f'M{f(x)} {f(w_y + 1 + q*2.05 + (x-20)*(.04 if x<60 else -.05) + 2.4)} v1.6' for q in range(8) for x in (24 + (q*13) % 26, 52 + (q*17) % 22, 80 + (q*7) % 18))
        g.append(f'<path d="{butts}" stroke="#000" stroke-width=".22" opacity=".35"/>')
        if kind == 'pearl':  # scorched, scratched black paint
            g.append('<path d="M34 64 l3 -.4 M48 66.8 l4 -.3 M66 63.6 l2.6 .3 M82 61.4 l3 -.5 M27 61.2 l2 .2 M58 68.4 l3 0" stroke="#8a7a66" stroke-width=".2" opacity=".5"/>')
        if kind == 'dutch':  # rot holes and barnacles
            g.append('<g fill="#060a08"><path d="M40 60.4 l1.6 -.6 l.8 1.2 l-1 1.2 l-1.4 -.4 Z"/><path d="M73 62 l1.2 -.8 l1.4 .6 l-.6 1.4 l-1.6 .2 Z"/><path d="M58 66.4 l1 -.4 l.6 .9 l-.9 .6 Z"/></g>')
            bs = ''.join(f'<circle cx="{f(x)}" cy="{f(y)}" r="{f(r)}" fill="#c9d3cc" opacity=".7"/><circle cx="{f(x-.12)}" cy="{f(y-.12)}" r="{f(r*.4)}" fill="#2e3a34" opacity=".8"/>'
                         for x, y, r in [(28, 67, .5), (29.4, 67.8, .4), (34, 69, .55), (45, 68, .45), (46.2, 68.8, .35), (61, 69.6, .5), (70, 68.6, .4), (71.2, 69.4, .5), (83, 66.8, .45), (91, 64.6, .4), (92.2, 65.4, .35), (52, 69.8, .4)])
            g.append(bs)
            g.append('<path d="M20 58 q2 4 1 8 M36 61 q1 3 0 6 M66 63 q1.4 3 .4 6 M88 60 q1 3 .2 6" stroke="#4f6b5c" stroke-width=".5" fill="none" opacity=".5"/>')
    g.append(f'<path d="{hull}" fill="url(#{k}L)"/>')
    g.append('</g>')
    g.append(f'<path d="{sheer}" fill="none" stroke="{c["trim"]}" stroke-width="{sw(.7)}" opacity=".9"/>')
    if det: g.append(f'<path d="{sheer}" fill="none" stroke="#fff" stroke-width=".35" opacity=".25" transform="translate(0 .9)"/>')
    # rails: forecastle, quarterdeck, waist bulwark with hammock netting
    qd = ' '.join(f'M{f(x)} {f(w_y - 3.4 - (x-86)*.17 if x>86 else w_y-2.8)} v2.4' for x in [87, 89, 91, 93, 95, 97, 99, 101])
    fc = ' '.join(f'M{f(x)} {f(49.2 + (x-12)*.06)} v2.4' for x in [13, 15, 17, 19, 21])
    g.append(f'<path d="M86 {f(w_y-3.6)} L104 {f(st-3.4 if not two else 41.6)} M12 49.2 L22 49.8" stroke="{L}" stroke-width="{sw(.55)}" fill="none"/>')
    if det:
        g.append(f'<path d="{qd} {fc}" stroke="{L}" stroke-width=".3"/>')
        g.append(f'<path d="M23 {f(w_y-2.1-(2.3 if not two else 0))} L30 {f(w_y-2.1)} H80 L86 {f(w_y-2.1-3.7)}" stroke="{L}" stroke-width=".5" fill="none"/>'
                 f'<path d="M30.4 {f(w_y-1.9)} H79.6 V{f(w_y-.1)} H30.4 Z" fill="{c["net"]}" opacity=".55"/>' +
                 f'<path d="{" ".join(f"M{f(x)} {f(w_y-1.9)} v1.8" for x in range(32, 80, 3))}" stroke="{L}" stroke-width=".22" opacity=".7"/>')
    # gun bands, wales, ports with lids and guns
    def ports(xs, y0, slope, lid=True):
        out = []
        for x in xs:
            y = y0 + (x - 20) * slope
            out.append(f'<rect x="{f(x-1.4)}" y="{f(y)}" width="2.8" height="2.3" fill="{c["port"]}" stroke="{c["wale"]}" stroke-width=".3"/>')
            if kind == 'dutch' and det: out.append(f'<rect x="{f(x-1.2)}" y="{f(y+.2)}" width="2.4" height="1.9" fill="#3cffb0" opacity=".22"/>')
            if det:
                out.append(f'<circle cx="{f(x)}" cy="{f(y+1.2)}" r=".72" fill="#3a4044"/><circle cx="{f(x)}" cy="{f(y+1.2)}" r=".38" fill="#000"/><path d="M{f(x-.5)} {f(y+.8)} a.6 .6 0 0 1 .5 -.3" stroke="#c4cccf" stroke-width=".18" fill="none"/>')
            if lid:
                out.append(f'<path d="M{f(x-1.4)} {f(y-.2)} L{f(x+1.6)} {f(y-.2)} L{f(x+1.9)} {f(y-2.2)} L{f(x-1.1)} {f(y-2.2)} Z" fill="{c["lid"]}" stroke="{c["wale"]}" stroke-width=".25"/>' +
                           (f'<path d="M{f(x-1)} {f(y-.4)} L{f(x-.8)} {f(y-2)} M{f(x+1.3)} {f(y-.4)} L{f(x+1.5)} {f(y-2)}" stroke="{R}" stroke-width=".14" opacity=".7"/>' if det else ''))
        return ''.join(out)
    if two:
        g.append(f'<path d="M16.4 55.6 C34 58 74 58 105.4 52 L105 56.4 C74 62.6 34 62.4 17.6 59.6 Z" fill="{c["band"]}"/>')
        g.append(f'<path d="M19.6 62 C36 64.2 72 64.2 103.6 59 L102.6 63.2 C72 69 36 68.6 21.4 66 Z" fill="{c["band"]}"/>')
        g.append(ports(range(26, 102, 6), 56.6, -.03, lid=False) + ports(range(29, 95, 6), 63.2, -.03, lid=False))
        g.append(f'<path d="M16.6 55.4 C34 57.8 74 57.8 105.4 51.8 M19.8 61.8 C36 64 72 64 103.6 58.8" stroke="{c["wale"]}" stroke-width=".7" fill="none"/>')
        g.append(f'<path d="M17.6 59.8 C34 62.6 74 62.6 105 56.6 M21.4 66.2 C36 68.8 72 68.8 102.6 63.4" stroke="{c["wale"]}" stroke-width="1.1" fill="none"/>')
    else:
        g.append(f'<path d="M15.6 57.2 C34 59.8 74 59.8 105.2 53 L104.2 57.4 C74 64.2 34 64.2 17.4 61.6 Z" fill="{c["band"]}"/>')
        g.append(ports(range(30, 99, 7), 60.4, -.036, lid=True))
        g.append(f'<path d="M15.8 57 C34 59.6 74 59.6 105.2 52.8" stroke="{c["wale"]}" stroke-width=".8" fill="none"/>')
    if not two:
        g.append(f'<path d="M21.6 64.9 C36 66.8 72 66.8 102.6 61" fill="none" stroke="{c["wale"]}" stroke-width="{sw(1.4)}"/>'
                 f'<path d="M21.2 64.3 C36 66.2 72 66.2 102.6 60.4" fill="none" stroke="{c["trim"]}" stroke-width=".35" opacity=".8"/>')
    else:
        g.append(f'<path d="M23 68.2 C40 70.6 74 70.4 100.4 65.4" fill="none" stroke="{c["trim"]}" stroke-width=".3" opacity=".6"/>')
    # channels, deadeyes, chainplates
    for x0, x1 in ((28, 44), (51, 69), (78, 90)):
        y = w_y + .9 if x1 < 86 else 52.4
        g.append(f'<path d="M{x0} {f(y)} H{x1}" stroke="{c["wale"]}" stroke-width="{sw(1)}"/>')
        if det:
            g.append(''.join(f'<circle cx="{f(x)}" cy="{f(y-.7)}" r=".5" fill="{c["trim"]}" stroke="{L}" stroke-width=".15"/><path d="M{f(x)} {f(y+.4)} L{f(x+.3)} {f(y+3.4)}" stroke="{c["wale"]}" stroke-width=".3"/>' for x in range(x0+1, x1, 3)))
    # lower hull shade and reflected light
    g.append('<path d="M22 66.4 C40 69.6 74 69.6 101 63.4 C99.6 66.4 97.6 68.8 95 70.4 Q64 72.6 33 71.4 C28.6 70.4 25 68.6 22 66.4 Z" fill="#000" opacity=".3"/>')
    if dark or rag:
        g.append(f'<path d="M20 58 C36 60.4 72 60.4 103 54.6" stroke="#fff" stroke-width="1.2" fill="none" opacity=".08"/>')
    # head: stem, head rails, figurehead, cathead with anchor, hawse
    g.append(f'<path d="M14 55 Q10.6 53.8 9.2 51 Q11.4 51.4 12.8 52.6" fill="{c["trim"]}" stroke="{L}" stroke-width=".35"/>'
             f'<path d="M11 52 Q8.6 52.6 7.4 51.2 Q8 49.6 9.6 50.2" fill="{c["trim"]}" stroke="{L}" stroke-width=".35"/>')
    if det:
        g.append(f'<path d="M12.6 52.8 Q16 54.6 22 55.2 M11.8 53.6 Q15.6 56.2 21.6 57" stroke="{c["trim"]}" stroke-width=".4" fill="none"/>'
                 f'<path d="M14.6 54 v2.2 M17 54.6 v2.2 M19.4 55 v2" stroke="{c["trim"]}" stroke-width=".25"/>'
                 f'<ellipse cx="17.4" cy="57.6" rx=".55" ry=".42" fill="#000"/>')
    g.append(f'<path d="M20.4 53.4 h2.4" stroke="{c["wale"]}" stroke-width=".9"/><path d="M21.6 54 V58.6 M20.6 55 H22.6 M20.2 57.6 Q21.6 59.6 23 57.6" stroke="#2b2a28" stroke-width=".55" fill="none" stroke-linecap="round"/>')
    # stern: two tiers of gallery windows, carvings, lanterns
    gy = st + 2.4
    g.append(f'<path d="M95.6 {f(gy)} H104.2 Q105.4 {f(gy+4)} 103.6 {f(gy+8)} H96.4 Q95 {f(gy+4)} 95.6 {f(gy)} Z" fill="{c["hull"]}" stroke="{c["trim"]}" stroke-width=".45"/>')
    win = c['glow']
    g.append(''.join(f'<rect x="{f(96.6 + i*2.3)}" y="{f(gy+1.2)}" width="1.6" height="2.1" fill="{win}" stroke="{L}" stroke-width=".22"/>' for i in range(3)))
    g.append(''.join(f'<rect x="{f(97 + i*2.2)}" y="{f(gy+4.6)}" width="1.4" height="1.6" fill="{win}" opacity=".8" stroke="{L}" stroke-width=".2"/>' for i in range(3)))
    if det:
        g.append(''.join(f'<path d="M{f(97.4 + i*2.3)} {f(gy+1.2)} v2.1 M{f(96.6 + i*2.3)} {f(gy+2.25)} h1.6" stroke="{L}" stroke-width=".14"/>' for i in range(3)))
        g.append(f'<circle cx="100.2" cy="{f(gy+3.4)}" r="4.6" fill="url(#{k}G)" opacity=".5"/>')
    g.append(f'<path d="M96.4 {f(gy+4)} H103.8 M96.6 {f(gy+6.6)} H103.6" stroke="{c["trim"]}" stroke-width=".4"/><path d="M97.6 {f(gy+8)} Q100 {f(gy+10)} 102.4 {f(gy+8)}" fill="{c["trim"]}" opacity=".85"/>')
    if det: g.append(f'<path d="M98.6 {f(gy+8.6)} q1.4 1 2.8 0" stroke="{L}" stroke-width=".2" fill="none"/>')
    lan = [(102.6, st - 1.4)] + ([(99.8, st - 1), (97, st - .5)] if kind in ('endeavour', 'company', 'revenge') else [])
    for x, y in lan:
        g.append(f'<path d="M{f(x)} {f(y+.9)} v1.4" stroke="{L}" stroke-width=".35"/><rect x="{f(x-.75)}" y="{f(y-1)}" width="1.5" height="2" rx=".3" fill="{win}" stroke="{L}" stroke-width=".3"/><path d="M{f(x-.9)} {f(y-1.1)} h1.8 l-.9 -.8 z" fill="{L}"/>')
        if det: g.append(f'<circle cx="{f(x)}" cy="{f(y)}" r="2.6" fill="url(#{k}G)" opacity=".6"/>')
    if kind == 'dutch':
        if det: g.append(f'<circle cx="60" cy="40" r="26" fill="url(#{k}G)" opacity=".1"/>')
    # reflection of the hull in the water, squashed and broken by ripples
    if det:
        g.append(f'<g transform="matrix(1 0 0 -.24 0 88.04)" opacity=".2"><path d="{hull}" fill="{c["hull"]}"/></g>'
                 '<path d="M22 72.6 h10 M40 73.4 h14 M62 72.8 h12 M80 73.6 h10 M30 74.6 h8 M56 75 h10 M74 74.6 h6" stroke="#f4ead6" stroke-width=".35" opacity=".5"/>')
        if kind == 'dutch':  # mist along the waterline
            g.append('<g stroke="#e6f2ec" stroke-linecap="round" fill="none"><path d="M6 73.4 q8 -1.2 16 0 t16 0 M50 74.2 q9 -1.1 18 0 t18 0 M90 73.2 q7 -1 14 0 t12 .2" stroke-width="1.1" opacity=".22"/><path d="M14 75.6 q10 -.8 20 0 M60 76.2 q12 -.9 24 0 M96 75.4 q6 -.6 12 0" stroke-width=".7" opacity=".16"/></g>')
    # water: bow wave, foam, wake
    g.append('<path d="M12 70.2 Q20 68 26 70.6 Q30 72.4 36 72 M96 70.6 Q104 71.6 112 70.4" fill="none" stroke="#5f8794" stroke-width=".7" stroke-linecap="round" opacity=".8"/>'
             '<path d="M14 71 Q18 69.6 22 71" fill="none" stroke="#ffffff" stroke-width=".9" stroke-linecap="round" opacity=".85"/>')
    if det:
        g.append('<path d="M17.6 70.2 q1.4 -.8 2.6 0 M23 70.8 q1.2 -.6 2.2 .2 M100 71 q1.6 -.7 3 0 M106 70.8 q1.2 -.5 2.4 0" stroke="#fff" stroke-width=".45" fill="none" opacity=".7"/>'
                 '<g fill="#fff" opacity=".7"><circle cx="13.4" cy="69.6" r=".3"/><circle cx="15.6" cy="69" r=".25"/><circle cx="11.6" cy="70.4" r=".25"/></g>')
    return '\n'.join(g)

if __name__ == '__main__':
    KS = ('pearl', 'revenge', 'endeavour', 'dutch', 'company', 'merchant')
    out = {k: ship(k) for k in KS}
    out.update({k + '_s': ship(k, small=True) for k in KS})
    print(json.dumps(out, ensure_ascii=False))
