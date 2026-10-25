"""Light theme concept «Полдень в лагуне»: the start screen at bright noon.
Not a recoloured night: turquoise lagoon, white cumulus, a sandstone fort with terracotta roofs, a white-and-red lighthouse
by day, a dolphin jumping between the fleets. UI is sailcloth in teak frames with a stitched seam, sea-teal ink and coral
accents; the lower part is a real parchment chart, hand-coloured. Laptop 1366x660 and phone 390x844."""
import math, os, re, random
import art
from art import sky, cloud, ridge, palm, lighthouse, sea, ship, island, island_reflection, sun, SEA_CSS, mix
import chart
from common import board, flourish, SCREWS
from main_board import gulls, bottle_svg, title_block, FK, FX

IC = '../assets/icons/'
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'out')

art.SKIES['noon'] = ('#4f9fd6', '#79b9e2', '#b4daf0', '#e6f4f8', '#ffffff', '#b8cddd', '#ffffff', '#ffffff')
art.SEAS['lagoon'] = ('#3f86ae', '#1f93a8', '#22b3ad', '#ffffff', '#0f5f7c', '#ffffff', '#c4e8f0')
art.ISLES['noon'] = ('#7d9e5c', '#4d7445', '#2d5034', '#fff1c8', '#2e5a36', '#8fb766', '#f1dfb0', '#968670')

PAPER = '#f1e4c4'
INK_NAVY = '#10324a'
TEAL = '#0f5a66'
CORAL = '#b8432a'

TEAK = 'linear-gradient(140deg,#c08a52 0%,#7a4a24 22%,#a86e3c 46%,#5e3618 70%,#9a6436 88%,#6a3e1c 100%) border-box'

LIGHT_UI = r'''
.sail{position:relative;border:4px solid transparent;border-radius:12px;
 background:SCREWS,repeating-linear-gradient(0deg,rgba(120,90,40,.045) 0 1px,rgba(0,0,0,0) 1px 3px),repeating-linear-gradient(90deg,rgba(120,90,40,.035) 0 1px,rgba(0,0,0,0) 1px 3px),
  radial-gradient(ellipse 90% 60% at 30% 0%,rgba(255,255,255,.7),rgba(255,255,255,0) 60%),linear-gradient(#fbf6e8,#efe3c4) padding-box,TEAK;
 box-shadow:inset 0 0 0 1px #4e2c12,0 12px 24px rgba(20,60,80,.28),0 2px 0 rgba(60,36,14,.35);color:#4a3e2c}
.sail::before{content:"";position:absolute;inset:6px;border:1.5px dashed rgba(120,78,34,.42);border-radius:7px;pointer-events:none}
.sail h2{color:#0f5a66;text-shadow:0 1px 0 rgba(255,255,255,.8)}
.sail .go{color:#b8432a}
.tealc{position:relative;border:3px solid transparent;border-radius:12px;
 background:SCREWS,radial-gradient(ellipse 120% 70% at 50% 0%,rgba(160,240,230,.16),rgba(0,0,0,0) 60%),linear-gradient(#17707c,#0d4f5a 70%,#0a434d) padding-box,BRASS border-box;
 box-shadow:inset 0 0 0 1px #3a2a0c,0 12px 24px rgba(20,60,80,.32);color:#eaf6f4}
.roundL{width:58px;height:58px;border-radius:50%;flex:none;display:flex;align-items:center;justify-content:center;
 background:radial-gradient(circle at 50% 38%,#fffaf0 0 46%,#efe3c4 70%,#d2bf90) padding-box,linear-gradient(150deg,#fff0b8,#c9a048 35%,#6a4a14 60%,#e2bf62 85%,#8a6420) border-box;border:3px solid transparent;
 box-shadow:inset 0 0 0 1.5px #6a4a14,0 4px 10px rgba(40,50,60,.35)}
.roundL img{display:block;transition:rotate .3s ease,scale .3s ease}
.lift:hover .roundL img{rotate:-8deg;scale:1.07}.lift.spin:hover .roundL img{rotate:120deg;scale:1.07}
.toolL{display:flex;align-items:center;gap:12px;color:#10324a;text-decoration:none;font-family:'Alegreya SC',Georgia,serif;font-weight:700;font-size:16.5px;letter-spacing:.02em;line-height:1;text-shadow:0 1px 0 rgba(255,250,235,.8)}
.btn-teal{display:inline-flex;align-items:center;justify-content:center;gap:10px;min-height:46px;padding:0 22px;border-radius:9px;border:2px solid #3a2a0c;
 background:radial-gradient(ellipse 80% 60% at 50% 0%,rgba(255,255,255,.55),rgba(255,255,255,0) 60%),linear-gradient(#f8e29c,#d6ad54 50%,#a8822e 51%,#c69a40);
 color:#24180a;font-family:'Alegreya SC',Georgia,serif;font-weight:800;font-size:17px;letter-spacing:.04em;line-height:1;text-decoration:none;text-shadow:0 1px 0 rgba(255,246,214,.6);padding-bottom:4px;
 box-shadow:inset 0 1px 0 rgba(255,255,255,.75),inset 0 -2px 0 rgba(90,60,10,.35),0 3px 0 #3a2a0c,0 8px 16px rgba(0,40,50,.4)}
/* daylight motion: transform/opacity only */
@keyframes jump{0%,62%{transform:rotate(-70deg);opacity:0}64%{opacity:1}84%{transform:rotate(70deg);opacity:1}86%,100%{transform:rotate(70deg);opacity:0}}
.dolphin{animation:jump 9s cubic-bezier(.4,0,.6,1) infinite}
@keyframes splash{0%,62%{opacity:0;transform:scale(.3)}64%{opacity:.9;transform:scale(1)}70%{opacity:0;transform:scale(1.4)}84%{opacity:0;transform:scale(.3)}86%{opacity:.9;transform:scale(1)}93%,100%{opacity:0;transform:scale(1.5)}}
.splash{transform-box:fill-box;transform-origin:50% 100%;animation:splash 9s ease-out infinite}
@keyframes foam{0%,100%{opacity:.25;transform:scaleX(.92)}50%{opacity:.9;transform:scaleX(1.04)}}
.foam{transform-box:fill-box;transform-origin:center;animation:foam 4s ease-in-out infinite}.foam.f1{animation-delay:-1.3s}.foam.f2{animation-delay:-2.6s}
@keyframes frond{0%,100%{rotate:0deg}50%{rotate:2.4deg}}
.frond{transform-box:fill-box;transform-origin:50% 100%;animation:frond 5s ease-in-out infinite}.frond.p1{animation-delay:-1.7s}.frond.p2{animation-delay:-3.1s}
@keyframes soar{0%{transform:translate(0,0)}50%{transform:translate(-180px,18px)}100%{transform:translate(0,0)}}
.soar{animation:soar 36s ease-in-out infinite}
@keyframes tilt{0%,100%{rotate:-4deg}50%{rotate:5deg}}.tilt{transform-box:fill-box;transform-origin:center;animation:tilt 6s ease-in-out infinite}
@keyframes lamp{0%,80%,100%{opacity:0}88%{opacity:.9}}.lamp9{animation:lamp 9s ease-in-out infinite}
@keyframes shade{0%,100%{opacity:0}50%{opacity:.14}}.cshade{animation:shade 18s ease-in-out infinite}
@media (prefers-reduced-motion: reduce){.dolphin,.splash,.foam,.frond,.soar,.tilt,.lamp9,.cshade{animation:none !important}}
'''.replace('SCREWS', SCREWS).replace('TEAK', TEAK).replace('BRASS', 'linear-gradient(140deg,#fff0b8 0%,#e2bf62 14%,#8a6420 32%,#f0d27a 50%,#9a7020 68%,#e8c870 84%,#6a4a14 100%)')

ARROW_C = f'<svg aria-hidden="true" width="22" height="14" viewBox="0 0 22 14"><path d="M1 7 H19 M13 1.5 L19.5 7 L13 12.5" stroke="{CORAL}" stroke-width="1.9" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>'
CHEV_C = f'<svg aria-hidden="true" width="12" height="20" viewBox="0 0 12 20"><path d="M2 2 L10 10 L2 18" stroke="{CORAL}" stroke-width="2.2" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>'


# ---------- scene pieces drawn for daylight ----------
def fort_day(tx, ty, k=1.0, uid='d'):
    """Sandstone fort at noon, sun from the upper right: lit faces warm, shaded faces cool, terracotta roofs, a flag."""
    lit, mid, sh, dk = '#efd9a8', '#d8bc84', '#a88e62', '#6e5a3e'
    roof, roofS = '#c4613a', '#8a3a22'
    s = (f'<g transform="translate({tx} {ty}) scale({k})"><defs>'
         f'<linearGradient id="fwD{uid}" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="{sh}"/><stop offset=".35" stop-color="{mid}"/><stop offset="1" stop-color="{lit}"/></linearGradient>'
         f'<linearGradient id="frD{uid}" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="{roofS}"/><stop offset=".6" stop-color="{roof}"/><stop offset="1" stop-color="#de7a4e"/></linearGradient></defs>')
    # rock base and bastion
    s += f'<path d="M0 40 C 4 35 8 36 10 33 L114 33 C 116 36 120 37 122 40 Z" fill="#a8977a"/><path d="M10 33 L114 33" stroke="{lit}" stroke-width=".7"/>'
    # curtain wall with crenellations
    s += f'<rect x="10" y="22" width="102" height="11.5" fill="url(#fwD{uid})"/>'
    s += ''.join(f'<rect x="{x}" y="19.6" width="4" height="2.6" fill="{mid if x < 60 else lit}"/>' for x in range(12, 110, 7))
    s += f'<path d="M10 26 H112 M10 30 H112" stroke="{sh}" stroke-width=".35" opacity=".7"/>'
    # gate with shadow
    s += f'<path d="M56 33.5 V27.6 Q61 23 66 27.6 V33.5 Z" fill="{dk}"/><path d="M57.4 33.5 V28.2 Q61 25 64.6 28.2 V33.5" fill="none" stroke="#4a3a26" stroke-width=".5"/>'
    # cannons in the embrasures
    for x in (22, 36, 84, 98):
        s += f'<rect x="{x}" y="23.6" width="4.4" height="2.8" fill="{dk}"/><rect x="{x + 1.2}" y="24.4" width="3.6" height="1.1" fill="#2a2a2a"/>'
    # keep
    s += f'<rect x="40" y="8" width="44" height="14.5" fill="url(#fwD{uid})"/>'
    s += ''.join(f'<rect x="{x}" y="5.8" width="3.4" height="2.4" fill="{mid if x < 62 else lit}"/>' for x in range(41, 84, 6))
    for x in (46, 54, 68, 76):
        s += f'<rect x="{x}" y="12" width="2.2" height="3.6" rx="1.1" fill="{dk}"/>'
    s += f'<path d="M40 8 V22.5" stroke="{sh}" stroke-width="1.2" opacity=".6"/>'
    # round towers with conical roofs
    for cx, w in ((19, 12), (105, 12)):
        s += f'<rect x="{cx - w / 2}" y="13" width="{w}" height="20.5" fill="url(#fwD{uid})"/>'
        s += f'<path d="M{cx - w / 2 - 1.4} 13.4 L{cx} 3 L{cx + w / 2 + 1.4} 13.4 Z" fill="url(#frD{uid})"/>'
        s += f'<path d="M{cx} 3 L{cx + w / 2 + 1.4} 13.4" stroke="#f0a070" stroke-width=".5" opacity=".8"/>'
        s += f'<rect x="{cx - 1}" y="18" width="2" height="3.4" rx="1" fill="{dk}"/>'
        s += f'<path d="M{cx - w / 2} 13.4 H{cx + w / 2}" stroke="{sh}" stroke-width=".8"/>'
    # flag on the keep's sunny corner
    s += f'<path d="M80 6 V-2" stroke="#3a2e22" stroke-width=".8"/><path class="fortFlag" d="M80.4 -1.8 C 83.4 -2.6 85.6 -.6 89 -1.4 L87.8 1 L89 3.4 C 85.6 4.2 83.4 2.2 80.4 3 Z" fill="#f6f0e2"/>'
    s += f'<path class="fortFlag" d="M80.4 .6 C 83.4 -.2 85.6 1.8 88.6 1" stroke="{CORAL}" stroke-width="1.3" fill="none"/>'
    # cast shadow of the keep on the wall (sun from the right)
    s += f'<path d="M40 22.5 L36 22.5 L33 33.5 L40 33.5 Z" fill="#000" opacity=".12"/>'
    return s + '</g>'


def lighthouse_day(x, y, k, uid):
    s = lighthouse(x, y, k, uid)
    s = re.sub(r'<g class="lhBeam".*?</g>', '', s, flags=re.S)
    s = re.sub(r'<circle class="lh(Glow|Flash)"[^>]*/>', '', s)
    s = (s.replace('fill="#101a24"', 'fill="#9a8a72"').replace('stroke="#5a7084"', 'stroke="#efe2c4"')
         .replace('fill="#2a3642"', 'fill="#f2ead8"').replace('fill="#1a2430"', 'fill="#b5552e"')
         .replace('fill="#ffcf6a" class="flick"', 'fill="#5a6a74"').replace('fill="#ffe8a0"', 'fill="#cfe6f0"'))
    lx, ly = x, y - 62 * k
    # sun catching the lens every few seconds: a quick white glint
    s += (f'<g class="lamp9"><circle cx="{lx}" cy="{ly}" r="{7 * k}" fill="#fff" opacity=".7"/>'
          f'<path d="M{lx - 14 * k} {ly}H{lx + 14 * k}M{lx} {ly - 14 * k}V{ly + 14 * k}" stroke="#fff" stroke-width="{.9 * k}"/></g>')
    return s


def dolphin(px, py, R, k=1.0):
    """A dolphin leaping along an arc around (px, py+R): rotation only, with a splash at entry and exit."""
    body = (f'<g transform="translate(0 {-R}) scale({k})">'
            '<path d="M-14 0 C -8 -5 4 -6 12 -2 L18 -3 L14 0 L18 3 L12 2 C 4 5 -8 4 -14 0 Z" fill="#46606e"/>'
            '<path d="M-2 -4.6 L2 -9 L4 -4.2 Z" fill="#46606e"/><path d="M-10 -1 C -4 -4 4 -4.6 10 -2" stroke="#9ab6c2" stroke-width=".8" fill="none"/>'
            '<path d="M-12 1 C -4 3.6 4 3.6 10 1.6" stroke="#e8f2f4" stroke-width="1" fill="none" opacity=".7"/>'
            '<circle cx="-9" cy="-1" r=".7" fill="#0c1a22"/></g>')
    cx, cy = px, py + R
    sp = lambda x: (f'<g class="splash" style="transform-origin:{x}px {py}px"><path d="M{x - 7} {py} Q{x - 5} {py - 7} {x - 2} {py - 2} M{x + 7} {py} Q{x + 5} {py - 8} {x + 1} {py - 2} M{x} {py} V{py - 9}" '
                    f'stroke="#fff" stroke-width="1.3" fill="none" stroke-linecap="round"/><ellipse cx="{x}" cy="{py + 1}" rx="9" ry="1.8" fill="#fff" opacity=".7"/></g>')
    return (sp(cx - R * .94) + sp(cx + R * .94) +
            f'<g class="dolphin" style="transform-origin:{cx}px {cy}px"><g transform="translate({cx} {cy}) rotate(90)"><g transform="rotate(-90)">'
            f'<g transform="translate(0 0)">{body}</g></g></g></g>')


def frigatebird(x, y, k=1.0):
    return (f'<g class="soar"><g class="tilt"><path transform="translate({x} {y}) scale({k})" d="M-22 2 C -14 -2 -8 -4 -2 0 L0 2 L2 0 C 8 -4 14 -2 22 2 C 14 0 8 1 2 3 L0 6 L-2 3 C -8 1 -14 0 -22 2 Z" fill="#23384a"/></g></g>')


def foam_line(x0, x1, y, n=5):
    out = ''
    for i in range(n):
        a = x0 + (x1 - x0) * (i + .15) / n
        w = (x1 - x0) / n * .8
        out += f'<path class="foam f{i % 3}" d="M{a:.1f} {y + (i % 2) * .8:.1f} q{w / 2:.1f} -2 {w:.1f} 0" stroke="#ffffff" stroke-width="1.4" fill="none" stroke-linecap="round"/>'
    return out


def palm_day(x, y, h, lean, k, cls):
    return f'<g class="frond {cls}">{palm(x, y, h, lean, k, "#2f5a2e", "#b8e08a")}</g>'


# ---------- parchment chart ----------
def parchment(name, W=None):
    """Recolour the per-screen chart to a hand-coloured parchment: sepia ink, blue water-lining, ochre land."""
    saved = (chart.INK, chart.GOLD, chart.LAND, chart.RED)
    chart.INK, chart.GOLD, chart.LAND, chart.RED = '#3f7590', '#6b4a22', '#e3cd96', '#a63a26'
    try:
        svg, route = chart.chart_v(name)
        al, acss = chart.anim_layer(name, 0, 0)
    finally:
        chart.INK, chart.GOLD, chart.LAND, chart.RED = saved
    rep = [('fill="#0e1b26"', f'fill="{PAPER}"'), ('stop-color="#0e1b26"', f'stop-color="{PAPER}"'), ('stroke="#0e1b26"', f'stroke="{PAPER}"'),
           ('0 0 0 0 .35  0 0 0 0 .5  0 0 0 0 .6  0 0 0 .12 -.02', '0 0 0 0 .55  0 0 0 0 .38  0 0 0 0 .16  0 0 0 .22 -.04'),
           ('0 0 0 0 .5  0 0 0 0 .7  0 0 0 0 .8  0 0 0 .05 0', '0 0 0 0 .4  0 0 0 0 .3  0 0 0 0 .2  0 0 0 .07 0'),
           ('stop-color="#000" stop-opacity=".45"', 'stop-color="#7a5426" stop-opacity=".32"'),
           ('fill="#f0d27a"', 'fill="#a63a26"'), ('stop-color="#ffe6a8" stop-opacity=".09"', 'stop-color="#ffffff" stop-opacity=".0"')]
    for a, b in rep:
        svg = svg.replace(a, b)
        al = al.replace(a, b)
    # hand colouring: a soft blue wash along the water-lining and a green wash on land
    wash = (f'<defs><filter id="wash" x="-5%" y="-5%" width="110%" height="110%"><feGaussianBlur stdDeviation="7"/></filter></defs>')
    svg = svg.replace('</defs>', '</defs>' + wash, 1)
    svg = re.sub(r'(<path d="[^"]+" fill="#e3cd96" stroke="#6b4a22" stroke-width="\.9" opacity="\.95"/>)',
                 lambda m: m.group(1).replace('<path', '<path filter="url(#wash)"', 1).replace('fill="#e3cd96"', 'fill="none"').replace('stroke="#6b4a22" stroke-width=".9" opacity=".95"', 'stroke="#5f9fb8" stroke-width="14" opacity=".28"') + m.group(1)
                 .replace('fill="#e3cd96"', 'fill="#d9cf92"'), svg)
    al = al.replace('class="chartAnim"', 'class="chartAnim"')
    return svg, al.replace(f'chartAnim', 'chartAnim') , acss


def scene_laptop():
    W, SH, HOR = 1366, 340, 262
    FY = HOR + 1 - 36 - 34 * FK
    s = [f'<svg aria-hidden="true" width="{W}" height="{HOR + 2}" viewBox="0 0 {W} {HOR + 2}" style="position: absolute; left: 0; top: 0">']
    s.append(sky(W, HOR + 2, 'L', 'noon', seed=5))
    s.append(sun(1150, 54, 24, 'L', col=('#ffffff', '#fff8d8', '#ffe7a0')))
    s.append(cloud(250, 92, 330, 34, 'l1', '#b6cbdb', '#ffffff', 1, 1, seed=3, op=.95))
    s.append(cloud(980, 150, 260, 26, 'l2', '#bcd0de', '#ffffff', 1, 1, seed=8, cls='clouds2', op=.9))
    s.append(cloud(560, 54, 200, 18, 'l3', '#c4d6e2', '#ffffff', 1, 1, seed=12, op=.85))
    s.append(cloud(1300, 196, 220, 16, 'l4', '#c6d8e4', '#ffffff', 1, 1, seed=21, cls='clouds2', op=.85))
    s.append(cloud(120, 206, 240, 14, 'l5', '#c6d8e4', '#ffffff', 1, 1, seed=33, op=.8))
    s.append(frigatebird(860, 96, .9))
    s.append(ridge(W, HOR + 1, 16, 4, '#8fb3a8', .8, step=12, rough=.7))
    s.append(ridge(W, HOR + 1, 9, 9, '#6f9a86', 1, step=9, rough=.9))
    isl, _ = island(462, 918, HOR + 1, 36, 'IL', 'noon', seed=4, plateau=(FX + 4 * FK, FX + 118 * FK), light='right', palms=(), bushes=26, k=1.0, rocks=6)
    s.append(isl)
    for i, (px, h, lean, kk) in enumerate(((528, 34, -8, 1.0), (552, 42, 6, 1.1), (850, 36, 10, 1.0), (874, 28, -6, .85))):
        s.append(palm_day(px, HOR - 4, h, lean, kk, f'p{i % 3}'))
    s.append(fort_day(FX, FY, FK, 'L'))
    # pier and rowboat by day
    s.append(f'<g><path d="M598 {HOR - 1.5} H632" stroke="#7a5a3a" stroke-width="2.2"/><path d="M601 {HOR - 1} V{HOR + 3} M610 {HOR - 1} V{HOR + 3.5} M619 {HOR - 1} V{HOR + 3.5} M628 {HOR - 1} V{HOR + 3}" stroke="#5a3e24" stroke-width="1.2"/>'
             f'<path d="M578 {HOR + 1} Q586 {HOR + 4.2} 596 {HOR + 1} L594 {HOR - .6} L580 {HOR - .6} Z" fill="#b5552e"/><path d="M580 {HOR - .6} H594" stroke="#f2d2a8" stroke-width=".6"/></g>')
    s.append(f'<g opacity=".8"><path d="M462 {HOR - 1} L486 {HOR - 1} L482 {HOR + 2} L466 {HOR + 2} Z" fill="#4a5a62"/><path d="M474 {HOR - 2} V{HOR - 24} L486 {HOR - 4} Z M473 {HOR - 3} L463 {HOR - 3} L473 {HOR - 19} Z" fill="#f6f2e8"/></g>')
    s.append(gulls(700, 150, 1.0, 3, '#33485a'))
    s.append(gulls(380, 128, .8, 2, '#33485a'))
    s.append(lighthouse_day(1334, HOR + 2, 1.0, 'L'))
    s.append('</svg>')
    sea_svg, sea_css = sea(W, SH - HOR, 'L', 'lagoon', light_x=1150, light_w=1.4, seed=7, tile=480, density=1.35, glitter=1.8)
    s.append(f'<div style="position: absolute; left: 0; top: {HOR}px; width: {W}px; height: {SH - HOR}px; overflow: hidden">{sea_svg}</div>')
    s.append(island_reflection(462, 918, 36, 'IL', 'noon').replace('TOP', f'top: {HOR + 1}px').replace('opacity', 'opacity'))
    s.append(f'<svg aria-hidden="true" width="{W}" height="{SH}" viewBox="0 0 {W} {SH}" style="position: absolute; left: 0; top: 0; overflow: visible">'
             f'{foam_line(470, 910, HOR + 2.5, 9)}{foam_line(1306, 1362, HOR + 3, 2)}</svg>')
    rim = 'drop-shadow(-1.5px -1px 0 rgba(255,255,255,.35)) drop-shadow(0 3px 4px rgba(10,50,70,.25))'
    for name, L, wy, W_, H_, flip, cls, alt in (
            ('revenge', 270, 296, 190, 123, True, 'bob d1', '«Месть королевы Анны»'),
            ('pearl', 52, 304, 220, 143, True, 'bob', '«Чёрная жемчужина»'),
            ('dutch', 1114, 296, 190, 123, False, 'bob d3', '«Летучий голландец»'),
            ('endeavour', 900, 304, 220, 143, False, 'bob d2', '«Индевор»')):
        s.append(ship(name, L, wy, W_, H_, flip, cls, rim=rim, alt=alt, refl_op=.3))
    s.append(f'<svg aria-hidden="true" width="{W}" height="{SH}" viewBox="0 0 {W} {SH}" style="position: absolute; left: 0; top: 0; overflow: visible">'
             f'{dolphin(560, 314, 40, 1.0)}{bottle_svg(760, 320, 1.1)}</svg>')
    s.append(f'<div style="position: absolute; left: 0; top: {SH - 30}px; width: {W}px; height: 30px; background: linear-gradient(rgba(241,228,196,0), {PAPER})"></div>')
    return ''.join(s), sea_css


def title_light(left, top, width, size=70, sub=17, eyebrow=15, gap=6):
    t = title_block(left, top, width, size, sub, eyebrow, gap)
    t = t.replace('class="eyebrow"', f'class="eyebrow" style="color: {CORAL}; text-shadow: 0 1px 0 rgba(255,255,255,.6)"').replace('" style="color', '; color', 0)
    t = t.replace('<div class="eyebrow" style="color', '<div class="eyebrow" style="color')
    t = t.replace('class="sc gold-text"', 'class="sc"').replace('filter: drop-shadow(0 2px 0 #4a3610) drop-shadow(0 8px 18px rgba(0,0,0,.65))',
                                                               f'color: {INK_NAVY}; text-shadow: 0 2px 0 rgba(255,255,255,.75), 0 3px 0 #c9a048, 0 10px 22px rgba(255,255,255,.7)')
    t = t.replace('color: #e6edf2; text-shadow: 0 2px 8px rgba(0,0,0,.8)', f'color: {INK_NAVY}; text-shadow: 0 1px 0 rgba(255,255,255,.8), 0 0 12px rgba(255,255,255,.9)')
    t = t.replace(flourish(240), flourish(240, '#8a6420'))
    return t


def fix_eyebrow(t):
    # title_block puts style after class; merge the two style attributes into one
    return re.sub(r'class="eyebrow" style="([^"]*)" style="([^"]*)"', r'class="eyebrow" style="\2; \1"', t)


def mode_card_l(cls, icon, title, text, cta, h=200, pad='20px 22px 18px'):
    return (f'<a class="sail lift rise {cls}" href="#" style="height: {h}px; box-sizing: border-box; display: flex; flex-direction: column; padding: {pad}; text-decoration: none">'
            f'<div style="display: flex; align-items: center; gap: 12px; min-height: 68px">'
            f'<span class="medal"><img src="{IC}{icon}.svg" alt="" width="50" height="50"></span>'
            f'<h2 class="sc" style="margin: 0; font-size: 23px; line-height: 1.08; font-weight: 800">{title}</h2></div>'
            f'<p style="margin: 14px 0 0; font-size: 15.5px; line-height: 1.4; color: #4a3e2c">{text}</p>'
            f'<span class="go">{cta}{ARROW_C}</span></a>')


def laptop():
    W, H = 1366, 660
    sc, sea_css = scene_laptop()
    csvg, al, acss = parchment('main')
    open(os.path.join(OUT, 'assets', 'bg', 'chart-main-light.svg'), 'w').write(csvg)
    al = al.replace('style="position: absolute; left: 0px; top: 0px;', 'style="position: absolute; left: 0px; top: 340px;')
    b = [f'<div style="width: {W}px; height: {H}px; position: relative; overflow: hidden; font-family: \'Alegreya Sans\', system-ui, sans-serif; color: #3a3226; background: {PAPER}">']
    b.append('<div aria-hidden="true" style="position: absolute; left: 0; top: 340px; width: 1366px; height: 320px; background: url(../assets/bg/chart-main-light.svg)"></div>')
    b.append(al)
    b.append(f'<div style="position: absolute; left: 0; top: 0; width: {W}px; height: 340px; overflow: hidden">{sc}</div>')
    b.append(fix_eyebrow(title_light(333, 18, 700)))
    b.append('<div style="position: absolute; left: 83px; top: 356px; width: 1200px; display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 20px">')
    b.append('<div class="tealc lift rise" style="height: 200px; box-sizing: border-box; display: flex; flex-direction: column; padding: 16px 18px 18px">'
             '<div style="display: flex; align-items: center; gap: 12px; padding-right: 30px">'
             f'<img src="{IC}ic_logbook.svg" alt="" width="50" height="50" style="flex: none; display: block">'
             '<div style="min-width: 0"><div class="sc" style="font-size: 12px; line-height: 1; font-weight: 700; letter-spacing: .14em; color: #f2c9a0">Сохранённая партия</div>'
             '<h2 class="sc" style="margin: 6px 0 0; font-size: 25px; line-height: 1; font-weight: 800; color: #fff6dc">Продолжить</h2></div></div>'
             '<button aria-label="Удалить сохранение" title="Удалить сохранение" style="position: absolute; right: 10px; top: 10px; width: 28px; height: 28px; display: flex; align-items: center; justify-content: center; padding: 0; border-radius: 50%; border: 1px solid rgba(240,210,122,.6); background: rgba(0,0,0,.18); cursor: pointer">'
             '<svg aria-hidden="true" width="10" height="10" viewBox="0 0 10 10"><path d="M1 1 L9 9 M9 1 L1 9" stroke="#f0d27a" stroke-width="1.6" stroke-linecap="round"/></svg></button>'
             '<p style="margin: 12px 0 0; font-size: 14.5px; line-height: 1.4; color: #d4ece8">Против ботов, вы за Пиратов<br>Раунд IV, ходит Компания</p>'
             '<a class="btn-teal" href="#" style="margin-top: auto; align-self: stretch">Вернуться к столу</a></div>')
    b.append(mode_card_l('d1', 'ic_cutlasses', 'Против ботов', 'Вы командуете одной стороной, боты другой.', 'Выбрать сторону'))
    b.append(mode_card_l('d2', 'ic_flags', 'Игра по сети', 'Каждый играет со своего телефона или ноутбука.', 'Комната по коду'))
    b.append(mode_card_l('d3', 'ic_mugs', 'На одном экране', 'Играете вдвоём, передавая устройство друг другу.', 'Сесть за стол'))
    b.append('</div>')
    tools = [('ic_book', 'Правила', ''), ('ic_cards', 'Коллекция карт', ''), ('ic_wheel', 'Настройки', ' spin'), ('ic_spyglass', 'Матч ботов', '')]
    b.append('<nav class="rise d4" aria-label="Ещё" style="position: absolute; left: 83px; top: 578px; width: 1200px; display: flex; align-items: center; justify-content: center; gap: 52px">')
    for ic, t, x in tools:
        b.append(f'<a class="toolL lift{x}" href="#"><span class="roundL"><img src="{IC}{ic}.svg" alt="" width="40" height="40"></span>{t}</a>')
    b.append('</nav>')
    b.append('<div style="position: absolute; right: 83px; bottom: 10px; font-size: 12px; line-height: 1; color: #7a6646">Версия 1a2b3c4 · сборка 24.10, 18:40</div>')
    b.append('</div>')
    from fort import FORT_CSS
    return board('Стартовый экран, светлая тема', W, H, ''.join(b), SEA_CSS + sea_css + FORT_CSS + chart.CHART_CSS + acss + LIGHT_UI)


def scene_phone():
    W, SH, HOR = 390, 300, 236
    s = [f'<svg aria-hidden="true" width="{W}" height="{HOR + 2}" viewBox="0 0 {W} {HOR + 2}" style="position: absolute; left: 0; top: 0">']
    s.append(sky(W, HOR + 2, 'Q', 'noon', seed=6))
    s.append(sun(330, 150, 15, 'Q', col=('#ffffff', '#fff8d8', '#ffe7a0')))
    s.append(cloud(90, 160, 160, 18, 'q1', '#bcd0de', '#ffffff', 1, 1, seed=12, cls='clouds2', op=.9))
    s.append(cloud(250, 200, 140, 12, 'q2', '#c4d6e2', '#ffffff', 1, 1, seed=3, op=.85))
    s.append(frigatebird(300, 112, .6))
    s.append(ridge(W, HOR + 1, 10, 4, '#8fb3a8', .8, step=8, rough=.7))
    pfk = .92
    pfx = 210 - 61 * pfk
    isl, _ = island(138, 286, HOR + 1, 18, 'IQ', 'noon', seed=7, plateau=(pfx + 4 * pfk, pfx + 118 * pfk), light='right', palms=(), bushes=10, k=.6, rocks=3)
    s.append(isl)
    s.append(palm_day(152, HOR - 2, 22, -5, .62, 'p0'))
    s.append(palm_day(272, HOR - 2, 24, 6, .65, 'p1'))
    s.append(fort_day(pfx, HOR + 1 - 18 - 34 * pfk, pfk, 'Q'))
    s.append(gulls(110, 196, .7, 3, '#33485a'))
    s.append('</svg>')
    sea_svg, sea_css = sea(W, SH - HOR, 'Q', 'lagoon', light_x=330, light_w=.6, seed=9, tile=390, glitter=1.6)
    s.append(f'<div style="position: absolute; left: 0; top: {HOR}px; width: {W}px; height: {SH - HOR}px; overflow: hidden">{sea_svg}</div>')
    s.append(f'<svg aria-hidden="true" width="{W}" height="{SH}" viewBox="0 0 {W} {SH}" style="position: absolute; left: 0; top: 0; overflow: visible">{foam_line(142, 282, HOR + 2.4, 5)}</svg>')
    rim = 'drop-shadow(-1px -1px 0 rgba(255,255,255,.35)) drop-shadow(0 2px 3px rgba(10,50,70,.25))'
    s.append(ship('revenge', 74, 270, 100, 65, True, 'bob d1', rim=rim, alt='«Месть королевы Анны»', refl_op=.3))
    s.append(ship('pearl', -6, 276, 114, 74, True, 'bob', rim=rim, alt='«Чёрная жемчужина»', refl_op=.3))
    s.append(ship('dutch', 290, 270, 100, 65, False, 'bob d3', rim=rim, alt='«Летучий голландец»', refl_op=.3))
    s.append(ship('endeavour', 200, 276, 114, 74, False, 'bob d2', rim=rim, alt='«Индевор»', refl_op=.3))
    s.append(f'<svg aria-hidden="true" width="{W}" height="{SH}" viewBox="0 0 {W} {SH}" style="position: absolute; left: 0; top: 0; overflow: visible">{dolphin(190, 278, 20, .55)}</svg>')
    s.append(f'<div style="position: absolute; left: 0; top: {SH - 40}px; width: {W}px; height: 40px; background: linear-gradient(rgba(241,228,196,0), {PAPER})"></div>')
    return ''.join(s), sea_css


def phone():
    W, H = 390, 844
    sc, sea_css = scene_phone()
    csvg, al, acss = parchment('phone-main')
    open(os.path.join(OUT, 'assets', 'bg', 'chart-phone-main-light.svg'), 'w').write(csvg)
    al = al.replace('style="position: absolute; left: 0px; top: 0px;', 'style="position: absolute; left: 0px; top: 284px;')
    b = [f'<div style="width: {W}px; height: {H}px; position: relative; overflow: hidden; font-family: \'Alegreya Sans\', system-ui, sans-serif; color: #3a3226; background: {PAPER}">']
    b.append('<div aria-hidden="true" style="position: absolute; left: 0; top: 300px; width: 390px; height: 544px; background: url(../assets/bg/chart-phone-main-light.svg) center bottom/390px 560px no-repeat"></div>')
    b.append(al)
    b.append(f'<div style="position: absolute; left: 0; top: 0; width: {W}px; height: 300px; overflow: hidden">{sc}</div>')
    b.append(fix_eyebrow(title_light(0, 26, W, size=50, sub=15, eyebrow=12, gap=4)))
    b.append('<div style="position: absolute; left: 16px; top: 290px; width: 358px; display: flex; flex-direction: column; gap: 12px">')
    b.append('<div class="tealc rise" style="box-sizing: border-box; height: 80px; display: flex; align-items: center; gap: 10px; padding: 0 12px 0 20px">'
             '<div style="flex: 1; min-width: 0"><div class="sc" style="font-size: 11.5px; line-height: 1; font-weight: 700; letter-spacing: .06em; white-space: nowrap; color: #f2c9a0">Сохранённая партия</div>'
             '<div style="margin-top: 7px; font-size: 14px; line-height: 1.25; color: #d4ece8">Против ботов<br>Раунд IV</div></div>'
             '<a class="btn-teal" href="#" style="min-height: 42px; padding: 0 16px 4px; font-size: 16px">Продолжить</a>'
             '<button aria-label="Удалить сохранение" style="width: 30px; height: 30px; flex: none; display: flex; align-items: center; justify-content: center; padding: 0; border-radius: 50%; border: 1px solid rgba(240,210,122,.6); background: rgba(0,0,0,.18)">'
             '<svg aria-hidden="true" width="10" height="10" viewBox="0 0 10 10"><path d="M1 1 L9 9 M9 1 L1 9" stroke="#f0d27a" stroke-width="1.6" stroke-linecap="round"/></svg></button></div>')
    for i, (ic, t, d) in enumerate([('ic_cutlasses', 'Против ботов', 'Вы командуете одной стороной, боты другой'),
                                     ('ic_flags', 'Игра по сети', 'Каждый со своего телефона или ноутбука'),
                                     ('ic_mugs', 'На одном экране', 'Вдвоём, передавая устройство')]):
        b.append(f'<a class="sail lift rise d{i + 1}" href="#" style="box-sizing: border-box; height: 92px; display: flex; align-items: center; gap: 14px; padding: 0 18px 0 22px; text-decoration: none">'
                 f'<span class="medal" style="width: 60px; height: 60px"><img src="{IC}{ic}.svg" alt="" width="44" height="44"></span>'
                 f'<div style="flex: 1; min-width: 0"><h2 class="sc" style="margin: 0; font-size: 20px; line-height: 1.05; font-weight: 800">{t}</h2>'
                 f'<p style="margin: 6px 0 0; font-size: 14px; line-height: 1.3; color: #4a3e2c">{d}</p></div>{CHEV_C}</a>')
    b.append('</div>')
    b.append('<div style="position: absolute; left: 16px; top: 706px; width: 358px; display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 8px">')
    for ic, t, x in [('ic_book', 'Правила', ''), ('ic_cards', 'Карты', ''), ('ic_wheel', 'Настройки', ' spin'), ('ic_spyglass', 'Матч ботов', '')]:
        b.append(f'<a class="lift{x}" href="#" style="display: flex; flex-direction: column; align-items: center; gap: 8px; text-decoration: none; color: {INK_NAVY}; font-family: \'Alegreya SC\', Georgia, serif; font-weight: 700; font-size: 13.5px; line-height: 1; text-shadow: 0 1px 0 rgba(255,250,235,.8)">'
                 f'<span class="roundL" style="width: 54px; height: 54px"><img src="{IC}{ic}.svg" alt="" width="36" height="36"></span>{t}</a>')
    b.append('</div>')
    b.append('<div style="position: absolute; left: 0; right: 0; bottom: 14px; text-align: center; font-size: 12px; line-height: 1; color: #7a6646">Версия 1a2b3c4 · сборка 24.10, 18:40</div>')
    b.append('</div>')
    from fort import FORT_CSS
    return board('Стартовый экран, светлая тема, телефон', W, H, ''.join(b), SEA_CSS + sea_css + FORT_CSS + chart.CHART_CSS + acss + LIGHT_UI)


if __name__ == '__main__':
    d = os.path.join(OUT, 'artboards')
    open(os.path.join(d, 'MainLight.dc.html'), 'w').write(laptop())
    open(os.path.join(d, 'StartPhoneLight.dc.html'), 'w').write(phone())
    print('ok')
