import math
from helpers import INK, cloud_strip, svg, ripple, barrel
from scenes2 import bubbles
import scenes5
from common import ship, sea

CSS6 = r"""
.wvA{transform-origin:50% 100%;will-change:transform;animation:wvA 8s linear infinite}@keyframes wvA{0.0%{transform:translate(14.0px,110.0px) scaleY(0.800)}2.1%{transform:translate(13.9px,109.4px) scaleY(0.801)}4.2%{transform:translate(13.7px,107.7px) scaleY(0.804)}6.2%{transform:translate(13.3px,104.9px) scaleY(0.809)}8.3%{transform:translate(12.9px,101.2px) scaleY(0.816)}10.4%{transform:translate(12.3px,96.7px) scaleY(0.824)}12.5%{transform:translate(11.6px,91.5px) scaleY(0.834)}14.6%{transform:translate(10.9px,85.7px) scaleY(0.844)}16.7%{transform:translate(10.1px,79.4px) scaleY(0.856)}18.8%{transform:translate(9.3px,72.8px) scaleY(0.868)}20.8%{transform:translate(8.4px,65.8px) scaleY(0.880)}22.9%{transform:translate(7.5px,58.7px) scaleY(0.893)}25.0%{transform:translate(6.6px,51.6px) scaleY(0.906)}27.1%{transform:translate(5.7px,44.5px) scaleY(0.919)}29.2%{transform:translate(4.8px,37.5px) scaleY(0.932)}31.2%{transform:translate(3.9px,30.8px) scaleY(0.944)}33.3%{transform:translate(3.1px,24.5px) scaleY(0.955)}35.4%{transform:translate(2.4px,18.7px) scaleY(0.966)}37.5%{transform:translate(1.7px,13.5px) scaleY(0.975)}39.6%{transform:translate(1.1px,9.0px) scaleY(0.984)}41.7%{transform:translate(0.7px,5.2px) scaleY(0.990)}43.8%{transform:translate(0.3px,2.4px) scaleY(0.996)}45.8%{transform:translate(0.1px,0.7px) scaleY(0.999)}47.9%{transform:translate(0.0px,0.0px) scaleY(1.000)}50.0%{transform:translate(0.0px,0.0px) scaleY(1.000)}52.1%{transform:translate(0.0px,0.0px) scaleY(1.000)}54.2%{transform:translate(0.0px,0.0px) scaleY(1.000)}56.2%{transform:translate(-0.0px,0.0px) scaleY(1.000)}58.3%{transform:translate(-0.1px,0.9px) scaleY(0.998)}60.4%{transform:translate(-0.3px,3.1px) scaleY(0.994)}62.5%{transform:translate(-0.6px,6.5px) scaleY(0.988)}64.6%{transform:translate(-1.0px,10.9px) scaleY(0.980)}66.7%{transform:translate(-1.5px,16.3px) scaleY(0.970)}68.8%{transform:translate(-2.0px,22.4px) scaleY(0.959)}70.8%{transform:translate(-2.6px,29.1px) scaleY(0.947)}72.9%{transform:translate(-3.3px,36.3px) scaleY(0.934)}75.0%{transform:translate(-4.0px,43.8px) scaleY(0.920)}77.1%{transform:translate(-4.7px,51.6px) scaleY(0.906)}79.2%{transform:translate(-5.4px,59.4px) scaleY(0.892)}81.2%{transform:translate(-6.1px,67.1px) scaleY(0.878)}83.3%{transform:translate(-6.8px,74.6px) scaleY(0.864)}85.4%{transform:translate(-7.4px,81.8px) scaleY(0.851)}87.5%{transform:translate(-8.0px,88.4px) scaleY(0.839)}89.6%{transform:translate(-8.6px,94.4px) scaleY(0.828)}91.7%{transform:translate(-9.1px,99.7px) scaleY(0.819)}93.8%{transform:translate(-9.5px,104.0px) scaleY(0.811)}95.8%{transform:translate(-9.7px,107.2px) scaleY(0.805)}97.9%{transform:translate(-9.9px,109.3px) scaleY(0.801)}100.0%{transform:translate(-10.0px,110.0px) scaleY(0.800)}}.wvB{transform-origin:62% 42%;will-change:transform,opacity;animation:wvB 8s linear infinite;opacity:0}@keyframes wvB{0.0%{opacity:0.000;transform:translateY(110.0px) scale(0.550,0.550)}1.7%{opacity:0.000;transform:translateY(109.6px) scale(0.550,0.550)}3.3%{opacity:0.000;transform:translateY(108.5px) scale(0.550,0.550)}5.0%{opacity:0.000;transform:translateY(106.7px) scale(0.550,0.550)}6.7%{opacity:0.000;transform:translateY(104.2px) scale(0.550,0.550)}8.3%{opacity:0.000;transform:translateY(101.2px) scale(0.550,0.550)}10.0%{opacity:0.000;transform:translateY(97.7px) scale(0.550,0.550)}11.7%{opacity:0.000;transform:translateY(93.7px) scale(0.550,0.550)}13.3%{opacity:0.000;transform:translateY(89.3px) scale(0.550,0.550)}15.0%{opacity:0.000;transform:translateY(84.5px) scale(0.550,0.550)}16.7%{opacity:0.000;transform:translateY(79.4px) scale(0.550,0.550)}18.3%{opacity:0.000;transform:translateY(74.1px) scale(0.550,0.550)}20.0%{opacity:0.000;transform:translateY(68.6px) scale(0.550,0.550)}21.7%{opacity:0.000;transform:translateY(63.0px) scale(0.550,0.550)}23.3%{opacity:0.000;transform:translateY(57.3px) scale(0.550,0.550)}25.0%{opacity:0.000;transform:translateY(51.6px) scale(0.550,0.550)}26.7%{opacity:0.000;transform:translateY(45.9px) scale(0.550,0.550)}28.3%{opacity:0.000;transform:translateY(40.3px) scale(0.550,0.550)}30.0%{opacity:0.015;transform:translateY(34.7px) scale(0.557,0.557)}31.7%{opacity:0.047;transform:translateY(29.3px) scale(0.571,0.571)}33.3%{opacity:0.095;transform:translateY(24.2px) scale(0.593,0.593)}35.0%{opacity:0.156;transform:translateY(19.4px) scale(0.620,0.620)}36.7%{opacity:0.228;transform:translateY(15.0px) scale(0.653,0.653)}38.3%{opacity:0.308;transform:translateY(11.1px) scale(0.689,0.689)}40.0%{opacity:0.394;transform:translateY(7.7px) scale(0.727,0.727)}41.7%{opacity:0.482;transform:translateY(4.9px) scale(0.767,0.767)}43.3%{opacity:0.571;transform:translateY(2.7px) scale(0.807,0.807)}45.0%{opacity:0.658;transform:translateY(1.1px) scale(0.846,0.846)}46.7%{opacity:0.741;transform:translateY(0.2px) scale(0.883,0.883)}48.3%{opacity:0.816;transform:translateY(0.0px) scale(0.917,0.917)}50.0%{opacity:0.882;transform:translateY(0.0px) scale(0.947,0.947)}51.7%{opacity:0.936;transform:translateY(0.0px) scale(0.971,0.971)}53.3%{opacity:0.975;transform:translateY(0.0px) scale(0.989,0.989)}55.0%{opacity:0.996;transform:translateY(0.0px) scale(0.998,0.998)}56.7%{opacity:0.999;transform:translateY(0.0px) scale(1.000,1.000)}58.3%{opacity:0.990;transform:translateY(0.5px) scale(1.000,1.002)}60.0%{opacity:0.972;transform:translateY(1.3px) scale(1.001,1.006)}61.7%{opacity:0.945;transform:translateY(2.6px) scale(1.002,1.011)}63.3%{opacity:0.911;transform:translateY(4.2px) scale(1.004,1.018)}65.0%{opacity:0.871;transform:translateY(6.2px) scale(1.005,1.026)}66.7%{opacity:0.825;transform:translateY(8.4px) scale(1.007,1.035)}68.3%{opacity:0.773;transform:translateY(10.9px) scale(1.009,1.045)}70.0%{opacity:0.718;transform:translateY(13.5px) scale(1.011,1.056)}71.7%{opacity:0.660;transform:translateY(16.3px) scale(1.014,1.068)}73.3%{opacity:0.599;transform:translateY(19.2px) scale(1.016,1.080)}75.0%{opacity:0.537;transform:translateY(22.2px) scale(1.019,1.093)}76.7%{opacity:0.475;transform:translateY(25.2px) scale(1.021,1.105)}78.3%{opacity:0.413;transform:translateY(28.2px) scale(1.023,1.117)}80.0%{opacity:0.352;transform:translateY(31.1px) scale(1.026,1.130)}81.7%{opacity:0.293;transform:translateY(33.9px) scale(1.028,1.141)}83.3%{opacity:0.237;transform:translateY(36.6px) scale(1.031,1.153)}85.0%{opacity:0.185;transform:translateY(39.1px) scale(1.033,1.163)}86.7%{opacity:0.138;transform:translateY(41.4px) scale(1.034,1.172)}88.3%{opacity:0.096;transform:translateY(43.4px) scale(1.036,1.181)}90.0%{opacity:0.061;transform:translateY(45.1px) scale(1.038,1.188)}91.7%{opacity:0.033;transform:translateY(46.4px) scale(1.039,1.193)}93.3%{opacity:0.013;transform:translateY(47.4px) scale(1.039,1.197)}95.0%{opacity:0.002;transform:translateY(47.9px) scale(1.040,1.200)}96.7%{opacity:0.000;transform:translateY(48.0px) scale(1.040,1.200)}98.3%{opacity:0.000;transform:translateY(48.0px) scale(1.040,1.200)}100.0%{opacity:0.000;transform:translateY(48.0px) scale(1.040,1.200)}}
.wv-spray{position:absolute;z-index:3;border-radius:50%;background:#eef6f8;will-change:transform,opacity;animation:wv-spray 8s cubic-bezier(.2,.6,.35,1) infinite;opacity:0}@keyframes wv-spray{0%,46%{opacity:0;transform:translate(0,0)}54%{opacity:.9}100%{opacity:0;transform:translate(var(--sx),var(--sy))}}
.wv-sheet{animation:wv-sheet 8s cubic-bezier(.4,0,.6,1) infinite;opacity:0}@keyframes wv-sheet{0%,52%{opacity:0;transform:translateY(-4px)}66%{opacity:.85;transform:translateY(0)}100%{opacity:0;transform:translateY(8px)}}
.wv-flow2{animation:wv-flow2 .42s linear infinite}@keyframes wv-flow2{from{transform:translateY(0)}to{transform:translateY(9px)}}
.wv-pulse{transform-box:fill-box;transform-origin:50% 0;animation:wv-pulse .8s ease-in-out infinite alternate}@keyframes wv-pulse{from{opacity:.8;transform:scale(.88,1)}to{opacity:1;transform:scale(1.1,1.02)}}
.wv-drop{animation:wv-drop .5s ease-in infinite;opacity:0}@keyframes wv-drop{0%{opacity:.95;transform:translateY(0)}100%{opacity:0;transform:translateY(7px)}}
.wv-hold{transform-box:fill-box;transform-origin:50% 100%;animation:wv-hold 2.2s ease-in-out infinite alternate}@keyframes wv-hold{from{transform:rotate(-4deg) translateY(0)}to{transform:rotate(3deg) translateY(1px)}}
.wv-slick{transform-box:fill-box;transform-origin:50% 50%;animation:wv-slick 8s ease-out infinite;opacity:0}@keyframes wv-slick{0%{opacity:0;transform:scale(.3)}20%{opacity:.5}100%{opacity:0;transform:scale(2.2)}}
.wv-mist{position:absolute;z-index:3;border-radius:50%;background:radial-gradient(closest-side,rgba(242,248,250,.8),rgba(230,238,242,0));will-change:transform,opacity;animation:wv-mist 8s cubic-bezier(.25,.6,.35,1) infinite;opacity:0}@keyframes wv-mist{0%,40%{opacity:0;transform:scale(.5)}62%{opacity:.8;transform:scale(1)}100%{opacity:0;transform:translate(-28px,-14px) scale(1.8)}}
.wv-foam{position:absolute;z-index:3;border-radius:50%;background:radial-gradient(closest-side,rgba(242,248,250,.9),rgba(242,248,250,0));transform-origin:85% 50%;will-change:transform,opacity;animation:wv-foam 8s cubic-bezier(.3,.5,.4,1) infinite;opacity:0}@keyframes wv-foam{0%,50%{opacity:0;transform:scaleX(.3)}66%{opacity:.85;transform:scaleX(1)}100%{opacity:0;transform:scaleX(1.18)}}
"""


def s_wet():
    pal = ['#56707a', '#24363e', '#d6e2e6', '#141e24', '#eef4f6']
    h = []
    h.append(cloud_strip([(0, -6, 1.2, '#7a868c', '#5a666c', '#2e383d'), (300, 4, 1.0, '#868f94', '#626d72', '#2e383d'), (560, -10, 1.3, '#7a868c', '#5a666c', '#2e383d'), (810, 0, 1.0, '#868f94', '#626d72', '#2e383d')], 0, 70, 40))
    h.append('<div class="sc-cflash" aria-hidden="true" style="position: absolute; inset: 0; z-index: 0; animation-duration: 7s; background: radial-gradient(40% 70% at 80% 0%, rgba(235,240,245,.55), rgba(235,240,245,0))"></div>')
    h.append(sea('back', pal))
    # a rolling sea behind the ship
    h.append(svg(560, 112, 360, 50, '<g class="sc-swell" style="animation-duration:5s;animation-delay:-1s"><path d="M0 50 C60 44 120 22 170 16 C220 10 290 22 360 50 Z" fill="#4a6670" stroke="#24363e" stroke-width="1.2"></path><path d="M130 24 C150 16 180 14 206 18" stroke="#e6eef2" stroke-width="2" fill="none" stroke-linecap="round"></path></g>', z=1))
    # (A) the sea heaves up behind the ship: a wall of water grows out of the sea itself (clipped at the surface)
    import random as _ra
    RA = _ra.Random(3)
    crest = [(120, 112), (150, 86), (180, 68), (210, 58), (240, 60), (268, 72), (292, 92), (316, 118)]
    lace = []
    for i in range(len(crest) - 1):
        (x0, y0), (x1, y1) = crest[i], crest[i + 1]
        for k in range(8):
            t = k / 8
            x, y = x0 + (x1 - x0) * t + RA.uniform(-3, 3), y0 + (y1 - y0) * t + RA.uniform(-2, 4)
            lace.append(f'<circle cx="{x:.1f}" cy="{y:.1f}" r="{RA.uniform(1.4, 4.4):.1f}" fill="#eef6f8" opacity="{RA.uniform(.5, .9):.2f}"></circle>')
    for _ in range(30):
        x, y = RA.uniform(110, 330), RA.uniform(84, 160)
        lace.append(f'<ellipse cx="{x:.1f}" cy="{y:.1f}" rx="{RA.uniform(2, 7):.1f}" ry="{RA.uniform(.6, 1.3):.1f}" fill="#dfeef0" opacity="{RA.uniform(.25, .6):.2f}" transform="rotate({RA.uniform(-25, 25):.0f} {x:.1f} {y:.1f})"></ellipse>')
    wall = ('<defs><linearGradient id="wvA" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8fb4b8"></stop><stop offset=".3" stop-color="#56807f"></stop><stop offset=".75" stop-color="#3a5a62"></stop><stop offset="1" stop-color="#2c4650"></stop></linearGradient>'
            '<linearGradient id="wvAl" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#cfe8e4" stop-opacity="0"></stop><stop offset=".5" stop-color="#cfe8e4" stop-opacity=".45"></stop><stop offset="1" stop-color="#cfe8e4" stop-opacity="0"></stop></linearGradient></defs>'
            '<path d="M0 190 C50 184 96 150 130 110 C158 80 186 60 214 56 C246 54 274 72 298 100 C324 130 352 170 420 190 Z" fill="url(#wvA)"></path>'
            '<path d="M150 98 C176 74 204 64 228 64 C250 66 266 76 278 90 C258 82 236 78 214 80 C192 82 170 92 150 98 Z" fill="url(#wvAl)"></path>'
            '<path d="M110 150 C150 132 190 124 240 126 M90 172 C140 156 200 150 270 154" stroke="#9fc4c4" stroke-width="1.4" fill="none" opacity=".45"></path>'
            + ''.join(lace))
    h.append('<div aria-hidden="true" style="position: absolute; left: 270px; top: 0; width: 420px; height: 168px; overflow: hidden; z-index: 1">'
             f'<div class="wvA" style="position: absolute; left: 0; top: 0; width: 420px; height: 190px"><svg width="420" height="190" viewBox="0 0 420 190" style="display: block">{wall}</svg></div></div>')
    # what rides with the ship (box 231x150, hull top ~ y 100, waterline ~ y 137):
    # water pouring off the deck through the scuppers, a sheet over the side after each sea, a sailor saving a keg, a tarp
    import random as _rr
    RS = _rr.Random(14)
    sdefs, sbody = [], []
    for i, (x, w) in enumerate([(48, 1.0), (82, 1.25), (116, 1.0), (150, 1.35), (184, .95)]):
        wob = RS.uniform(-1.5, 1.5)
        shape = (f'M{x-1.3*w:.1f} 103 C{x-1.6*w:.1f} 110 {x-2.1*w + wob*.4:.1f} 120 {x-1.8*w + wob:.1f} 133 '
                 f'L{x+1.9*w + wob:.1f} 133 C{x+2.2*w + wob*.4:.1f} 120 {x+1.6*w:.1f} 110 {x+1.3*w:.1f} 103 Z')
        sdefs.append(f'<clipPath id="wvc{i}"><path d="{shape}"></path></clipPath>')
        hl = ''.join(f'<ellipse cx="{x + RS.uniform(-.6, .6):.1f}" cy="{y}" rx="{.6*w:.1f}" ry="2.4" fill="#ffffff" opacity="{RS.uniform(.6, .95):.2f}"></ellipse>' for y in range(88, 140, 9))
        d = RS.uniform(0, .6)
        sbody.append(
            # the stream itself: glassy, thicker below, flickering as the flow surges
            f'<path class="wv-pulse" style="animation-delay:-{d:.2f}s" d="{shape}" fill="url(#wvst)"></path>'
            # light running down inside it
            f'<g clip-path="url(#wvc{i})"><g class="wv-flow2" style="animation-delay:-{d:.2f}s">{hl}</g></g>'
            # a thin side trickle down the planks
            f'<path d="M{x+3*w:.1f} 104 C{x+3.4*w:.1f} 112 {x+2.8*w:.1f} 122 {x+3.2*w:.1f} 132" stroke="#e6f2f6" stroke-width=".7" fill="none" opacity=".45"></path>'
            # the stream breaking into drops at the bottom, and its splash on the sea
            + ''.join(f'<circle class="wv-drop" style="animation-delay:-{(d + k*.17):.2f}s" cx="{x + wob + (k-1)*1.4:.1f}" cy="132" r="{.9 + (k%2)*.4:.1f}" fill="#eef6f8"></circle>' for k in range(3))
            + f'<g transform="translate({x + wob:.1f} 137)"><path class="rn-crown" style="animation-duration:.7s;animation-delay:-{d:.2f}s" d="M-3 0 L-4.4 -3.4 M-1 0 L-1.2 -4.6 M1 0 L1.2 -4.6 M3 0 L4.4 -3.4" stroke="#eef6f8" stroke-width="1" stroke-linecap="round" fill="none"></path>'
            f'<ellipse class="rn-ring" style="animation-duration:.9s;animation-delay:-{d:.2f}s" cx="0" cy="0" rx="5" ry="1.3" fill="none" stroke="#eef6f8" stroke-width=".8"></ellipse></g>')
    streams_defs = ''.join(sdefs) + '<linearGradient id="wvst" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f2f8fa" stop-opacity=".9"></stop><stop offset=".6" stop-color="#d8e8ee" stop-opacity=".6"></stop><stop offset="1" stop-color="#cfe2ea" stop-opacity=".35"></stop></linearGradient>'
    streams_body = ''.join(sbody)
    ov = ('<svg width="231" height="150" viewBox="0 0 231 150" style="position: absolute; left: 0; top: 0; overflow: visible">'
          f'<defs>{streams_defs}'
          '<linearGradient id="wvsh" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#e6f2f6" stop-opacity=".9"></stop><stop offset="1" stop-color="#cfe2ea" stop-opacity=".2"></stop></linearGradient></defs>'
          + streams_body +
          '<clipPath id="wvshc"><path d="M70 100 C100 103 140 103 176 99 L180 132 C140 136 100 136 66 132 Z"></path></clipPath>'
          '<g class="wv-sheet"><path d="M70 100 C100 103 140 103 176 99 L180 132 C140 136 100 136 66 132 Z" fill="url(#wvsh)"></path>'
          '<g clip-path="url(#wvshc)"><g class="wv-flow2" style="animation-duration:.55s">'
          + ''.join(f'<path d="M{x} 86 v8 M{x+3} 100 v6 M{x-2} 112 v9 M{x+1} 124 v7" stroke="#ffffff" stroke-width=".8" stroke-linecap="round" opacity=".7"></path>' for x in range(74, 178, 7))
          + '</g></g><path d="M70 100 C100 103 140 103 176 99" stroke="#ffffff" stroke-width="1.4" fill="none" opacity=".8"></path></g>'
          # the tarp the crew drags over the hatch, flapping
          f'<path class="sc-flag" d="M118 92 Q132 84 146 92 L144 100 Q132 94 120 100 Z" fill="#8a8a6a" stroke="{INK}" stroke-width="1"></path>'
          f'<g transform="translate(112 99)"><path d="M0 0 L-1 -9" stroke="#2f3a48" stroke-width="2.2" stroke-linecap="round"></path><path d="M-3 -9 h6 v-8 h-6 Z" fill="#f2ead8" stroke="{INK}" stroke-width=".6"></path><circle cx="0" cy="-20" r="3" fill="#e8c09a" stroke="{INK}" stroke-width=".6"></circle><path d="M3 -14 L8 -9" stroke="#e8c09a" stroke-width="2" stroke-linecap="round"></path></g>'
          # a sailor holding a keg high over his head, out of the water
          f'<g class="wv-hold"><g transform="translate(170 98)"><path d="M-2 0 L-3 -9 M2 0 L3 -9" stroke="#2f3a48" stroke-width="2.4" stroke-linecap="round"></path><path d="M-4 -9 L-4 -19 Q0 -21 4 -19 L4 -9 Z" fill="#f2ead8" stroke="{INK}" stroke-width=".6"></path>'
          f'<path d="M-4 -18 H4 M-4 -14 H4" stroke="#2f4f66" stroke-width="1.4"></path><circle cx="0" cy="-23" r="3.2" fill="#e8c09a" stroke="{INK}" stroke-width=".6"></circle><path d="M-3.4 -24 C-3 -28 3 -28 3.4 -24 Z" fill="#b23a2a"></path>'
          f'<path d="M-4 -18 L-6 -30 M4 -18 L6 -30" stroke="#e8c09a" stroke-width="2" stroke-linecap="round"></path>'
          f'<g transform="translate(0 -35) rotate(90)"><ellipse rx="5.4" ry="7.4" fill="#6a4a32" stroke="{INK}" stroke-width=".8"></ellipse><path d="M-5.4 -2.6 H5.4 M-5.4 2.6 H5.4" stroke="#2e2a26" stroke-width="1.4"></path></g></g></g>'
          '</svg>')
    h.append(ship('endeavour', 340, 150, cls='w-bob', extra=ov, alt='«Индевор»: волна захлёстывает палубу, вода хлещет из шпигатов'))
    # the green sea comes over the weather rail and breaks across the waist: translucent water, lace of foam, mist
    import random as _r
    R = _r.Random(8)
    lip = [(180, 104), (168, 80), (150, 62), (128, 52), (106, 50), (86, 54), (66, 64), (50, 78), (40, 92), (36, 102)]
    foam = []
    for i in range(len(lip) - 1):
        (x0, y0), (x1, y1) = lip[i], lip[i + 1]
        for k in range(9):
            t = k / 9
            x, y = x0 + (x1 - x0) * t + R.uniform(-3, 3), y0 + (y1 - y0) * t + R.uniform(-3, 4)
            rr = R.uniform(1.6, 5.2) * (1.2 if i in (3, 4, 5) else 1)
            foam.append(f'<circle cx="{x:.1f}" cy="{y:.1f}" r="{rr:.1f}" fill="#f6fbfc" opacity="{R.uniform(.55, .95):.2f}"></circle>')
            if R.random() < .35:
                foam.append(f'<circle cx="{x + R.uniform(-2, 2):.1f}" cy="{y + rr*.6:.1f}" r="{rr*.5:.1f}" fill="#b8d0d4" opacity=".55"></circle>')
    # lace of foam streaking down the face
    for _ in range(26):
        x, y = R.uniform(60, 170), R.uniform(64, 104)
        foam.append(f'<ellipse cx="{x:.1f}" cy="{y:.1f}" rx="{R.uniform(1.5, 5):.1f}" ry="{R.uniform(.6, 1.4):.1f}" fill="#eef6f8" opacity="{R.uniform(.35, .75):.2f}" transform="rotate({R.uniform(-30, 10):.0f} {x:.1f} {y:.1f})"></ellipse>')
    strands = ''.join(f'<path d="M{x:.0f} {y:.0f} q{R.uniform(-3, 3):.1f} {L*.5:.0f} {R.uniform(-4, 1):.1f} {L:.0f}" stroke="#e6f2f4" stroke-width="{R.uniform(.8, 1.8):.1f}" stroke-linecap="round" fill="none" opacity="{R.uniform(.5, .85):.2f}"></path>'
                      for x, y, L in [(R.uniform(38, 70), R.uniform(80, 100), R.uniform(10, 24)) for _ in range(9)])
    drops = ''.join(f'<span class="wv-spray" aria-hidden="true" style="left: {380 + R.uniform(40, 130):.0f}px; top: {40 + R.uniform(48, 80):.0f}px; width: {d:.1f}px; height: {d:.1f}px; --sx: {R.uniform(-60, 10):.0f}px; --sy: {R.uniform(-50, -6):.0f}px; animation-delay: {R.uniform(0, .25):.2f}s"></span>' for d in [R.uniform(1.6, 4) for _ in range(22)])
    crash = ('<defs><linearGradient id="wvwg" x1="0" y1="0" x2="0.3" y2="1"><stop offset="0" stop-color="#b8dcd6" stop-opacity=".9"></stop><stop offset=".35" stop-color="#6fa4a4" stop-opacity=".92"></stop><stop offset="1" stop-color="#2f5660" stop-opacity=".95"></stop></linearGradient>'
             '<linearGradient id="wvlt" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#d8f0ea" stop-opacity="0"></stop><stop offset=".5" stop-color="#d8f0ea" stop-opacity=".55"></stop><stop offset="1" stop-color="#d8f0ea" stop-opacity="0"></stop></linearGradient>'
             '<radialGradient id="wvms"><stop offset="0" stop-color="#f2f8fa" stop-opacity=".75"></stop><stop offset="1" stop-color="#e6eef2" stop-opacity="0"></stop></radialGradient></defs>'
             '<g>'
             # the body of water: no outline, darker where thick, glassy where thin under the lip
             '<path d="M186 112 C176 84 156 60 128 52 C100 45 72 52 54 68 C42 79 36 92 37 104 C46 96 56 92 66 92 C60 100 62 108 68 114 C78 104 92 100 106 102 C102 108 104 114 110 118 C124 110 150 108 186 116 Z" fill="url(#wvwg)"></path>'
             '<path d="M150 66 C130 58 104 56 84 62 C72 66 62 74 56 82 C70 74 92 70 114 72 C130 74 146 80 158 88 Z" fill="url(#wvlt)"></path>'
             '<path d="M172 92 C150 84 124 82 100 86 M176 104 C152 98 128 96 108 100" stroke="#9fc8c8" stroke-width="1.2" fill="none" opacity=".5"></path>'
             + ''.join(foam) + strands + '</g>')
    # (B) the curl that spills over the rail and pours down across the deck — appears only once the sea has risen
    h.append('<div class="wvB" aria-hidden="true" style="position: absolute; left: 376px; top: 6px; width: 180px; height: 120px; z-index: 3">'
             f'<svg width="180" height="120" viewBox="0 0 180 120" style="display: block; overflow: visible">{crash}</svg></div>')
    h.append('<div class="wv-mist" aria-hidden="true" style="left: 406px; top: 78px; width: 88px; height: 48px"></div>'
             '<div class="wv-mist" aria-hidden="true" style="left: 394px; top: 116px; width: 60px; height: 32px; animation-delay: .2s"></div>'
             '<div class="wv-foam" aria-hidden="true" style="left: 406px; top: 148px; width: 140px; height: 12px"></div>' + drops)
    h.append(sea('front', pal))
    # powder kegs washed overboard: one floats, one leaks a dark slick of wet powder, one goes under
    kegs = []
    for i, (x, y, s, cls, dur) in enumerate([(640, 186, 1.2, 'sc-bob', 3.4), (770, 192, 1.4, 'sc-bob', 4.1), (250, 190, 1.3, 'sc-sink', 6)]):
        k = barrel(x, y, s, 'ПОРОХ', wood='#6a4a32', band='#2e2a26', clip_y=6, uid=f'wk{i}')
        kegs.append(f'<g class="{cls}" style="animation-delay:-{i*1.1:.1f}s;animation-duration:{dur}s">{k}</g>')
        kegs.append(ripple(x, y + 7 * s, 24 * s, '#eef4f6', i, 3))
    kegs.append('<ellipse class="wv-slick" cx="770" cy="202" rx="22" ry="5" fill="#1a1a1a"></ellipse><ellipse class="wv-slick" style="animation-delay:-3s" cx="770" cy="202" rx="22" ry="5" fill="#1a1a1a"></ellipse>')
    kegs.append(bubbles(250, 198, 6, seed=6, spread=14))
    h.append(svg(0, 0, 920, 210, ''.join(kegs), z=4))
    return ('linear-gradient(#4a565c 0%, #6f7c82 60%, #929da2 100%)', ''.join(h), 'Сырой порох: волна захлёстывает палубу «Индевора», бочонки пороха смыло за борт', '')


CSS = scenes5.CSS + CSS6
RAIN = scenes5.RAIN
rain = scenes5.rain
strip_old_rain = scenes5.strip_old_rain
SCENES = dict(scenes5.SCENES)
SCENES['wet'] = s_wet
