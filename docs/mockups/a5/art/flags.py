# Pirate flag emblems, drawn in local units around (0,0); placed with translate+scale.
BONE, BSH, STEEL = '#ece4d0', '#b3a88f', '#d9dee1'

def skull(ink, det=True):
    """Skull about 4 wide, 4.6 tall, centred at 0,-1."""
    if not det:
        return (f'<path d="M-1.8 -1.4 C-1.9 -3.6 1.9 -3.6 1.8 -1.4 C1.8 -.6 1.3 -.2 1.1 .1 V.8 H-1.1 V.1 C-1.3 -.2 -1.8 -.6 -1.8 -1.4 Z" fill="{BONE}"/>'
                f'<circle cx="-.72" cy="-1.3" r=".5" fill="{ink}"/><circle cx=".72" cy="-1.3" r=".5" fill="{ink}"/>')
    return (f'<path d="M-1.9 -1.4 C-2 -3.75 2 -3.75 1.9 -1.4 C1.9 -.55 1.45 -.15 1.2 .12 L1.1 .9 Q0 1.15 -1.1 .9 L-1.2 .12 C-1.45 -.15 -1.9 -.55 -1.9 -1.4 Z" fill="{BONE}"/>'
            # shade on the right (light from the left / sun)
            f'<path d="M.9 -3.1 C1.9 -2.6 2.05 -1.6 1.9 -1.4 C1.9 -.55 1.45 -.15 1.2 .12 L1.1 .9 Q.6 1 .3 1 L.5 .1 C1 -.4 1.3 -1.2 .9 -3.1 Z" fill="{BSH}" opacity=".7"/>'
            f'<path d="M-1.2 -2.9 Q-.6 -3.3 .1 -3.25" stroke="#fff" stroke-width=".22" fill="none" opacity=".7" stroke-linecap="round"/>'
            # eye sockets slanting down to the nose, nose cavity, cheekbones
            f'<path d="M-1.35 -1.55 Q-.95 -2.05 -.3 -1.6 Q-.2 -.95 -.75 -.85 Q-1.4 -.9 -1.35 -1.55 Z" fill="{ink}"/>'
            f'<path d="M1.35 -1.55 Q.95 -2.05 .3 -1.6 Q.2 -.95 .75 -.85 Q1.4 -.9 1.35 -1.55 Z" fill="{ink}"/>'
            f'<path d="M0 -.6 L-.32 -.05 Q0 .1 .32 -.05 Z" fill="{ink}"/>'
            # teeth
            f'<path d="M-.95 .42 H.95" stroke="{ink}" stroke-width=".16"/>'
            f'<path d="M-.6 .2 V.95 M-.2 .22 V1.02 M.2 .22 V1.02 M.6 .2 V.95" stroke="{ink}" stroke-width=".13"/>'
            f'<path d="M-1.6 -2.2 l.35 .25 M1.25 -2.7 l-.2 .3" stroke="{BSH}" stroke-width=".12"/>')

def cutlass(ink, det=True):
    """One cutlass, hilt bottom-left, blade curving up to the right; mirror for the pair."""
    if not det:
        return f'<path d="M-3 3.4 Q.6 2 3.6 -.2" stroke="{STEEL}" stroke-width=".7" fill="none" stroke-linecap="round"/>'
    return (f'<path d="M-2.15 3.0 Q.9 1.75 3.75 -.25 Q3.5 .55 2.75 1.1 Q.7 2.55 -1.9 3.55 Z" fill="{STEEL}"/>'
            f'<path d="M-1.9 3.55 Q.7 2.55 2.75 1.1 Q3.5 .55 3.75 -.25" stroke="#7d868b" stroke-width=".14" fill="none"/>'
            f'<path d="M-1.6 2.95 Q.8 1.9 3.2 .2" stroke="#fff" stroke-width=".12" fill="none" opacity=".8"/>'
            # guard, knuckle bow, grip, pommel
            f'<path d="M-2.45 2.75 L-1.7 3.95" stroke="{BONE}" stroke-width=".42" stroke-linecap="round"/>'
            f'<path d="M-1.75 3.85 Q-2.6 4.75 -3.35 4.1" stroke="{BONE}" stroke-width=".22" fill="none"/>'
            f'<path d="M-2.1 3.35 L-3.25 3.95" stroke="#8a6a44" stroke-width=".5" stroke-linecap="round"/>'
            f'<path d="M-2.4 3.4 l.1 .25 M-2.75 3.6 l.1 .25" stroke="#4a3622" stroke-width=".1"/>'
            f'<circle cx="-3.4" cy="4.05" r=".32" fill="{BONE}"/>')

def bone(det=True):
    """One thigh-bone diagonal, knobbed ends."""
    if not det:
        return f'<path d="M-3 3.4 L3 .4" stroke="{BONE}" stroke-width=".6" stroke-linecap="round"/>'
    return (f'<path d="M-2.8 3.3 L2.8 .5" stroke="{BONE}" stroke-width=".55"/>'
            f'<circle cx="-3.1" cy="3.05" r=".42" fill="{BONE}"/><circle cx="-2.65" cy="3.75" r=".42" fill="{BONE}"/>'
            f'<circle cx="2.65" cy=".05" r=".42" fill="{BONE}"/><circle cx="3.1" cy=".75" r=".42" fill="{BONE}"/>'
            f'<path d="M-2.4 3.6 L2.6 1.1" stroke="{BSH}" stroke-width=".18" opacity=".8"/>')

def calico(ink, det=True):
    """Skull above two crossed cutlasses (the historical Rackham flag)."""
    return cutlass(ink, det) + f'<g transform="scale(-1 1)">{cutlass(ink, det)}</g>' + skull(ink, det)

def crossbones(ink, det=True):
    return f'<g transform="translate(0 .2)">{bone(det)}<g transform="scale(-1 1)">{bone(det)}</g></g>' + skull(ink, det)

def place(svg, x, y, s):
    return f'<g transform="translate({x:.2f} {y:.2f}) scale({s})">{svg}</g>'

def wave_flag(x, y, w, h, fill, line):
    """A rectangular flag flying from a staff at x, rippling along its length; returns (path, shading)."""
    d = (f'M{x} {y} C{x+w*.32:.2f} {y-.9:.2f} {x+w*.62:.2f} {y+.9:.2f} {x+w:.2f} {y-.15:.2f} '
         f'L{x+w+.2:.2f} {y+h-.1:.2f} C{x+w*.62:.2f} {y+h+.9:.2f} {x+w*.32:.2f} {y+h-.7:.2f} {x} {y+h:.2f} Z')
    shade = (f'<path d="M{x+w*.38:.2f} {y-.1:.2f} C{x+w*.46:.2f} {y+h*.4:.2f} {x+w*.36:.2f} {y+h*.7:.2f} {x+w*.44:.2f} {y+h+.15:.2f} '
             f'L{x+w*.62:.2f} {y+h+.4:.2f} C{x+w*.56:.2f} {y+h*.6:.2f} {x+w*.64:.2f} {y+h*.3:.2f} {x+w*.58:.2f} {y+.35:.2f} Z" fill="#000" opacity=".28"/>'
             f'<path d="M{x+w*.1:.2f} {y+.25:.2f} C{x+w*.16:.2f} {y+h*.4:.2f} {x+w*.1:.2f} {y+h*.7:.2f} {x+w*.14:.2f} {y+h-.2:.2f}" stroke="#fff" stroke-width=".35" opacity=".12" fill="none"/>')
    return d, shade
