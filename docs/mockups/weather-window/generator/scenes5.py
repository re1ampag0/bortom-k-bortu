import math, random
from helpers import INK, cloud_strip, svg, sun_disc, ripple, barrel, palm, rocks
from scenes2 import flapping_gull, pennant, bubbles
import scenes4
from common import ship, sea, spk

CSS5 = r'''
.tr-net{animation:tr-net 7s ease-in-out infinite}@keyframes tr-net{0%,8%{opacity:0;transform:translate(0,0)}12%{opacity:1}55%{transform:translate(-226px,12px)}62%{opacity:1;transform:translate(-226px,12px)}68%,100%{opacity:0;transform:translate(-226px,12px)}}
.tr-sw{transform-box:fill-box;transform-origin:50% 0;animation:tr-sw 1.4s ease-in-out infinite alternate}@keyframes tr-sw{from{transform:rotate(-7deg)}to{transform:rotate(7deg)}}
.tr-bag{animation:tr-bag 7s ease-in-out infinite;opacity:0}@keyframes tr-bag{0%,60%{opacity:0;transform:translate(0,0) rotate(0)}63%{opacity:1}80%{opacity:1;transform:translate(150px,-30px) rotate(300deg)}88%{transform:translate(214px,-6px) rotate(380deg)}90%,100%{opacity:0;transform:translate(214px,-6px) rotate(380deg)}}
.tr-catch{transform-box:fill-box;transform-origin:50% 100%;animation:tr-catch 7s ease-in-out infinite}@keyframes tr-catch{0%,84%{transform:rotate(0)}88%{transform:rotate(-16deg)}94%,100%{transform:rotate(0)}}
.tr-scale{transform-box:fill-box;transform-origin:50% 0;animation:tr-scale 2.4s ease-in-out infinite alternate}@keyframes tr-scale{from{transform:rotate(-9deg)}to{transform:rotate(9deg)}}
.wp-arm{transform-box:view-box;transform-origin:458px 152px;animation:wp-arm 4.4s ease-in-out infinite}@keyframes wp-arm{0%,12%{transform:rotate(-16deg)}30%,62%{transform:rotate(0)}78%,100%{transform:rotate(-16deg)}}
.wp-spark{animation:wp-spark 4.4s linear infinite;opacity:0}@keyframes wp-spark{0%,30%{opacity:0}32%{opacity:1}36%{opacity:.4}38%{opacity:1}42%,100%{opacity:0}}
.wp-fizz{transform-box:fill-box;transform-origin:50% 100%;animation:wp-fizz 4.4s ease-out infinite;opacity:0}@keyframes wp-fizz{0%,40%{opacity:0;transform:translate(0,0) scale(.4)}46%{opacity:.9}90%,100%{opacity:0;transform:translate(-4px,-34px) scale(2.2)}}
.wp-txt{animation:wp-txt 4.4s ease-out infinite;opacity:0}@keyframes wp-txt{0%,42%{opacity:0;transform:translate(0,4px)}50%{opacity:1}85%{opacity:1;transform:translate(6px,-14px)}95%,100%{opacity:0;transform:translate(8px,-18px)}}
.wp-sigh{animation:wp-sigh 4.4s ease-in-out infinite}@keyframes wp-sigh{0%,55%{transform:translateY(0)}65%,80%{transform:translateY(2px)}90%,100%{transform:translateY(0)}}
.wp-stream{animation:wp-stream .5s linear infinite}@keyframes wp-stream{to{transform:translateY(12px)}}
.wp-bucket{transform-box:view-box;transform-origin:716px 150px;animation:wp-bucket 2.6s ease-in-out infinite}@keyframes wp-bucket{0%,40%{transform:rotate(0)}55%,65%{transform:rotate(-60deg)}85%,100%{transform:rotate(0)}}
.wp-throw{animation:wp-throw 2.6s ease-out infinite;opacity:0}@keyframes wp-throw{0%,52%{opacity:0;transform:translate(0,0)}56%{opacity:.95}80%{opacity:.6;transform:translate(46px,-10px)}92%,100%{opacity:0;transform:translate(70px,20px)}}
.tg-sway{transform-box:fill-box;transform-origin:50% 100%;animation:tg-sway 2.2s ease-in-out infinite alternate}@keyframes tg-sway{from{transform:rotate(-7deg)}to{transform:rotate(6deg)}}
.tg-pig{animation:tg-pig 9s ease-in-out infinite alternate}@keyframes tg-pig{0%,15%{transform:translateX(0)}85%,100%{transform:translateX(-34px)}}
.tg-mug{transform-box:fill-box;transform-origin:0 100%;animation:tg-mug 1.6s ease-in-out infinite}@keyframes tg-mug{0%,50%,100%{transform:rotate(0)}70%{transform:rotate(-40deg)}}
'''


# ------------------------------------------------------------------ Торговый караван: a merchant sells powder to the pirates

def s_caravan():
    pal = ['#4a92a8', '#1d5a70', '#eef7fa', '#123e50', '#ffffff']
    h = []
    h.append(sun_disc(870, 34, 15, halo_op=.5, uid='cvsun'))
    h.append(cloud_strip([(200, 20, .7, '#ffffff', '#e8dcc8', '#8a7a64'), (520, 6, .55, '#ffffff', '#e8dcc8', '#8a7a64'), (700, 30, .6, '#ffffff', '#e8dcc8', '#8a7a64')], 0, 90, 80))
    # the convoy waiting its turn further out: two merchants under escort
    h.append(sea('back', pal))
    h.append(ship('merchant', 780, 44, cls='w-calm', wl=156, z=1, alt=''))
    h.append(ship('company', 840, 36, cls='w-calm', wl=154, z=1, style='animation-delay: -2s', alt=''))
    h.append(ship('merchant', 720, 32, cls='w-calm', wl=153, z=1, style='animation-delay: -1s', alt=''))
    h.append(pennant(749, 120, '#c9a048', 14, z=1))
    # cargo piled on the merchant's deck (box 200x130, deck at ~ y 87)
    cargo = ('<svg width="200" height="130" viewBox="0 0 200 130" style="position: absolute; left: 0; top: 0; overflow: visible">'
             + ''.join(f'<g transform="translate({x} {y})"><rect x="0" y="0" width="{w}" height="{hh}" fill="{c}" stroke="{INK}" stroke-width="1"></rect><path d="M0 0 L{w} {hh} M{w} 0 L0 {hh}" stroke="{INK}" stroke-width=".6" opacity=".5"></path></g>'
                       for x, y, w, hh, c in [(62, 74, 16, 12, '#b0824a'), (78, 76, 14, 10, '#c09458'), (68, 64, 14, 10, '#a8743e'), (130, 76, 15, 11, '#b0824a')])
             + ''.join(f'<g transform="translate({x} {y})"><ellipse cx="0" cy="0" rx="5.5" ry="7" fill="#8a5a2e" stroke="{INK}" stroke-width=".9"></ellipse><path d="M-5.5 -2.5 H5.5 M-5.5 2.5 H5.5" stroke="#3a3530" stroke-width="1.3"></path></g>' for x, y in [(100, 80), (111, 80), (105, 70)])
             + ''.join(f'<g transform="translate({x} {y})"><path d="M-8 6 C-9 -2 -6 -6 0 -6 C6 -6 9 -2 8 6 Z" fill="#e2cfa0" stroke="{INK}" stroke-width=".9"></path><path d="M-6 -1 H6 M0 -6 V6" stroke="#8a6a3a" stroke-width=".8"></path></g>' for x, y in [(148, 80), (160, 81)])
             + '<path d="M120 74 L126 56 L132 74 Z" fill="#c9a048" stroke="#5c4615" stroke-width=".8"></path>'
             # the merchant at the stern, tricorn and coat, a pair of scales in hand
             + f'<g transform="translate(176 86)"><path d="M-5 0 L-6 -16 C-6 -20 6 -20 6 -16 L5 0 Z" fill="#2f4f66" stroke="{INK}" stroke-width=".9"></path><circle cx="0" cy="-23" r="4.4" fill="#e8c09a" stroke="{INK}" stroke-width=".8"></circle>'
             f'<path d="M-7 -26 L0 -30 L7 -26 L0 -24 Z" fill="#2a2420" stroke="{INK}" stroke-width=".7"></path><path d="M5 -14 L12 -22" stroke="#2f4f66" stroke-width="2.4" stroke-linecap="round"></path>'
             f'<g class="tr-scale"><g transform="translate(12 -22)"><path d="M0 0 V4 M-7 4 H7 M-7 4 L-9 9 H-5 Z M7 4 L5 9 H9 Z" stroke="#c9a048" stroke-width="1" fill="#e0bd62"></path></g></g></g>'
             + '</svg>')
    h.append(ship('merchant', 500, 130, cls='w-calm', extra=cargo, alt='Купец гружён ящиками и бочками'))
    h.append(pennant(600, 58, '#c9a048', 30, z=3))
    # the pirates come alongside to buy
    buyer = (f'<svg width="185" height="120" viewBox="0 0 185 120" style="position: absolute; left: 0; top: 0; overflow: visible">'
             f'<g class="tr-catch" style="transform-origin:150px 80px"><g transform="translate(150 80)"><path d="M-4 0 L-5 -14 C-5 -18 5 -18 5 -14 L4 0 Z" fill="#f2ead8" stroke="{INK}" stroke-width=".9"></path><path d="M-4 -12 H4 M-4 -8 H4 M-4 -4 H4" stroke="#b23a2a" stroke-width="1.2"></path>'
             f'<circle cx="0" cy="-21" r="4.2" fill="#e8c09a" stroke="{INK}" stroke-width=".8"></circle><path d="M-4.4 -23 C-4 -28 4 -28 4.4 -23 Z" fill="#b23a2a"></path><path d="M4 -12 L10 -20 M-4 -12 L-10 -18" stroke="#e8c09a" stroke-width="2.2" stroke-linecap="round"></path></g></g></svg>')
    h.append(ship('revenge', 268, 120, cls='w-calm', style='animation-delay: -1.5s', extra=buyer, alt='«Месть» покупает Порох у купца'))
    # a line rigged between the ships; a cargo net with powder kegs runs along it to the pirates
    h.append(svg(0, 0, 920, 210, '<path d="M362 66 Q480 84 600 60" stroke="#3a2a1a" stroke-width="1.2" fill="none"></path>', z=3))
    net = (f'<g class="tr-net"><g transform="translate(588 66)"><circle r="2" fill="#5a3a22"></circle><g class="tr-sw"><path d="M0 0 L-9 16 M0 0 L9 16" stroke="#3a2a1a" stroke-width="1"></path>'
           f'<g transform="translate(0 25)">{barrel(-6, 0, .55, "", wood="#6a4a32", band="#2e2a26", uid="tn1")}{barrel(6, 0, .55, "", wood="#6a4a32", band="#2e2a26", uid="tn2")}{barrel(0, -8, .55, "", wood="#6a4a32", band="#2e2a26", uid="tn3")}</g>'
           f'<path d="M-12 14 Q0 40 12 14 M-12 22 H12 M-10 30 H10 M-6 14 V36 M6 14 V36" stroke="#d8c8a0" stroke-width=".9" fill="none"></path>'
           f'<rect x="-11" y="34" width="22" height="7" rx="1" fill="#f2e2b8" stroke="{INK}" stroke-width=".6"></rect><text x="0" y="39.6" text-anchor="middle" font-family="Old Standard TT, Georgia, serif" font-weight="700" font-size="5.4" fill="#8e2b22">ПОРОХ ×2</text></g></g></g>')
    # and a fat purse is tossed back to the merchant
    bag = (f'<g class="tr-bag"><g transform="translate(410 70)"><path d="M-6 4 C-8 -2 -4 -6 0 -6 C4 -6 8 -2 6 4 Z" fill="#8a5a2e" stroke="{INK}" stroke-width=".9"></path>'
           f'<path d="M-3 -6 L0 -9 L3 -6" stroke="{INK}" stroke-width="1" fill="#c9a048"></path><circle cx="0" cy="0" r="2" fill="#f2c94c" stroke="#8a6420" stroke-width=".5"></circle></g></g>')
    h.append(svg(0, 0, 920, 210, net + bag, z=3))
    coins = ''.join(f'<svg class="w-coin" aria-hidden="true" viewBox="0 0 12 12" style="left: {x}px; top: {y}px; z-index: 4; width: 10px; height: 10px; animation-delay: -{d}s"><path d="M6 0 L7 5 L12 6 L7 7 L6 12 L5 7 L0 6 L5 5 Z" fill="#fff4c2"></path></svg>' for x, y, d in [(660, 112, 0), (690, 130, 1.1), (520, 104, 2.0), (420, 60, .6), (612, 52, 1.6)])
    h.append(coins)
    # a jolly boat ferrying more goods across
    boat = (f'<g class="sc-row" style="animation-duration:26s"><g transform="translate(420 176)"><path d="M-16 0 H16 L12 6 H-12 Z" fill="#8a5a2e" stroke="{INK}" stroke-width="1"></path><rect x="-10" y="-7" width="8" height="7" fill="#c9a06a" stroke="{INK}" stroke-width=".7"></rect><ellipse cx="4" cy="-3" rx="4" ry="3" fill="#a8743e" stroke="{INK}" stroke-width=".7"></ellipse>'
            f'<circle cx="10" cy="-6" r="2.2" fill="#e8c09a" stroke="{INK}" stroke-width=".6"></circle><path class="sc-oar" d="M10 -2 L18 10" stroke="#5a3a22" stroke-width="1.4"></path></g></g>')
    h.append(sea('front', pal))
    h.append(svg(0, 0, 920, 210, boat, z=4))
    h.append(svg(0, 0, 920, 210, flapping_gull(560, 30, .7) + flapping_gull(590, 22, .55), z=3, cls='w-gulls', style='animation-duration: 30s'))
    h.append(spk([(300, 194, .2), (560, 200, 1.0), (760, 188, 1.7)]))
    return ('linear-gradient(#7ab8d8 0%, #c8e2ee 60%, #f6e8c8 100%)', ''.join(h), 'Торговый караван: купец продаёт пиратам Порох — бочонки идут по канату, обратно летит кошель', '')


# ------------------------------------------------------------------ Сырой порох: on deck in the rain, the gun will not fire

def s_wet():
    pal = ['#56707a', '#24363e', '#d6e2e6', '#141e24', '#eef4f6']
    h = []
    h.append(cloud_strip([(0, -6, 1.2, '#7a868c', '#5a666c', '#2e383d'), (300, 4, 1.0, '#868f94', '#626d72', '#2e383d'), (560, -10, 1.3, '#7a868c', '#5a666c', '#2e383d'), (810, 0, 1.0, '#868f94', '#626d72', '#2e383d')], 0, 70, 40))
    h.append('<div class="sc-cflash" aria-hidden="true" style="position: absolute; inset: 0; z-index: 0; animation-duration: 7s; background: radial-gradient(40% 70% at 80% 0%, rgba(235,240,245,.55), rgba(235,240,245,0))"></div>')
    h.append(sea('back', pal))
    # the enemy is out there on the horizon, and it is perfectly dry by the look of it
    h.append(ship('endeavour', 760, 70, cls='w-bob', wl=168, z=1, alt='«Индевор» ждёт на горизонте'))
    # a wet sail sagging overhead, the water pouring off its corner into an open keg
    sail = (f'<path d="M230 -4 L470 -4 C452 22 420 52 384 70 C340 52 290 26 230 -4 Z" fill="#cfc6ae" stroke="{INK}" stroke-width="1.4"></path>'
            f'<path d="M260 4 C300 24 340 44 380 62 M300 -2 C330 20 360 40 386 56 M430 6 C412 30 396 48 386 62" stroke="#9a8f74" stroke-width="1.1" fill="none"></path>'
            f'<path d="M230 -4 L470 -4 L470 4 L230 4 Z" fill="#6a4424"></path>'
            + ''.join(f'<path class="sc-drip" style="animation-delay:-{i*.3:.1f}s;animation-duration:1s" d="M{x} {y} v6" stroke="#dce8ee" stroke-width="1.6" stroke-linecap="round"></path>' for i, (x, y) in enumerate([(300, 32), (340, 50), (420, 48), (450, 28)])))
    stream = ''.join(f'<path d="M384 {y} v7" stroke="#dce8ee" stroke-width="{3 - (i%2)*.8}" stroke-linecap="round" opacity=".85"></path>' for i, y in enumerate(range(60, 180, 12)))
    h.append(svg(0, 0, 920, 210, sail + f'<defs><clipPath id="wpst"><rect x="370" y="70" width="30" height="96"></rect></clipPath></defs><g clip-path="url(#wpst)"><g class="wp-stream">{stream}</g></g>', z=3))
    # the ship's side and deck in the foreground
    bul = ['<defs><linearGradient id="wpbw" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#6a4a30"></stop><stop offset="1" stop-color="#4a3220"></stop></linearGradient>'
           '<linearGradient id="wpdk" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7a5a3a"></stop><stop offset="1" stop-color="#5a3e26"></stop></linearGradient></defs>']
    bul.append('<path d="M0 158 H920 V188 H0 Z" fill="url(#wpbw)"></path>')
    bul.append(''.join(f'<path d="M0 {y} H920" stroke="#3a2618" stroke-width=".9"></path>' for y in (166, 174, 182)))
    bul.append('<path d="M0 154 H920 V160 H0 Z" fill="#8a6440" stroke="#2a1a0e" stroke-width="1"></path><path d="M0 155 H920" stroke="#c8a070" stroke-width="1" opacity=".6"></path>')
    bul.append('<rect x="586" y="160" width="40" height="22" fill="#1e2c34" stroke="#2a1a0e" stroke-width="1.4"></rect><path d="M586 168 H626" stroke="#56707a" stroke-width="1" opacity=".6"></path>')
    bul.append(''.join(f'<rect x="{x}" y="160" width="6" height="28" fill="#5a3e26" stroke="#2a1a0e" stroke-width=".8"></rect>' for x in (120, 300, 520, 680, 860)))
    bul.append('<path d="M0 188 H920 V210 H0 Z" fill="url(#wpdk)"></path>')
    bul.append(''.join(f'<path d="M{x} 188 L{x + (x-460)*.25:.0f} 210" stroke="#3a2618" stroke-width=".9"></path>' for x in range(20, 920, 46)))
    bul.append('<path d="M0 194 H920 M0 202 H920" stroke="#3a2618" stroke-width=".6" opacity=".6"></path>')
    # puddles shining on the deck
    bul.append(''.join(f'<ellipse cx="{x}" cy="{y}" rx="{rx}" ry="{rx*.18:.1f}" fill="#9fb8c4" opacity=".55"></ellipse><path d="M{x-rx*.6:.0f} {y-1} h{rx*.5:.0f}" stroke="#eef6fa" stroke-width="1" opacity=".7"></path>' for x, y, rx in [(250, 200, 40), (560, 204, 54), (800, 198, 34), (400, 206, 22)]))
    h.append(svg(0, 0, 920, 210, ''.join(bul), z=2))
    # the powder: a stack of kegs, the top one open and brimming with rain
    kegs = (barrel(300, 172, 1.05, 'ПОРОХ', wood='#6a4a32', band='#2e2a26') + barrel(334, 174, 1.0, 'ПОРОХ', wood='#6a4a32', band='#2e2a26')
            + barrel(384, 168, 1.2, 'ПОРОХ', wood='#6a4a32', band='#2e2a26')
            + '<ellipse cx="384" cy="150.4" rx="13" ry="3" fill="#9fc4d4" stroke="#2e2a26" stroke-width="1"></ellipse>'
            + ripple(384, 150.4, 8, '#ffffff', 0, 1.2, .9) + ripple(384, 150.4, 8, '#ffffff', .6, 1.2, .9)
            + ''.join(f'<path class="sc-drip" style="animation-delay:-{i*.35:.1f}s;animation-duration:1.2s" d="M{x} 153 c-1.4 2.6 -1.4 3.6 0 4.2 c1.4 -.6 1.4 -1.6 0 -4.2 Z" fill="#cfe6ee"></path>' for i, x in enumerate((372, 396, 390)))
            + '<path d="M410 196 Q430 200 452 196" stroke="#2a2a2a" stroke-width="2" fill="none" opacity=".6"></path>'
            + '<text x="328" y="146" font-family="Alegreya, Georgia, serif" font-style="italic" font-size="10" fill="#eef4f6" opacity=".85">хлюп</text>')
    h.append(svg(0, 0, 920, 210, kegs, z=3))
    # the gun on its carriage, run out to the port
    gun = (f'<g><path d="M486 168 L606 162 L606 178 L486 180 Z" fill="#3a3a38" stroke="{INK}" stroke-width="1.4"></path>'
           f'<path d="M486 168 C478 168 476 180 486 180 Z" fill="#2a2a28" stroke="{INK}" stroke-width="1.2"></path><circle cx="476" cy="174" r="3" fill="#2a2a28" stroke="{INK}" stroke-width="1"></circle>'
           f'<path d="M510 167 V180 M560 165 V179 M600 163 V178" stroke="#5a5a56" stroke-width="2.4"></path><path d="M488 170 L604 164.5" stroke="#8a8a84" stroke-width="1.2" opacity=".6"></path>'
           f'<rect x="490" y="180" width="80" height="12" fill="#6a4424" stroke="{INK}" stroke-width="1.2"></rect>'
           f'<circle cx="502" cy="194" r="6" fill="#4a3018" stroke="{INK}" stroke-width="1.2"></circle><circle cx="558" cy="194" r="6" fill="#4a3018" stroke="{INK}" stroke-width="1.2"></circle>'
           f'<circle cx="502" cy="194" r="1.6" fill="{INK}"></circle><circle cx="558" cy="194" r="1.6" fill="{INK}"></circle>'
           f'<path d="M500 166 v-3" stroke="{INK}" stroke-width="1.4"></path></g>')
    # the gunner reaches with the linstock... fizzle
    gunner = (f'<g class="wp-sigh"><path d="M446 200 L450 178 M458 200 L454 178" stroke="#2f3a48" stroke-width="5" stroke-linecap="round"></path>'
              f'<path d="M444 152 Q452 148 460 152 L462 180 H442 Z" fill="#f2ead8" stroke="{INK}" stroke-width="1"></path>'
              + ''.join(f'<path d="M443 {y} H461" stroke="#2f4f66" stroke-width="2"></path>' for y in (157, 163, 169, 175)) +
              f'<circle cx="452" cy="142" r="7" fill="#e8c09a" stroke="{INK}" stroke-width="1"></circle><path d="M445 140 C445 132 459 132 459 140 Z" fill="#b23a2a" stroke="{INK}" stroke-width=".8"></path><path d="M445 140 L440 146" stroke="#b23a2a" stroke-width="2.4" stroke-linecap="round"></path>'
              f'<path d="M454 141 v1 M458 141 v1" stroke="{INK}" stroke-width="1.4" stroke-linecap="round"></path><path d="M453 146 q3 -1.4 6 0" stroke="{INK}" stroke-width="1" fill="none"></path>'
              f'<path d="M446 156 L440 170" stroke="#e8c09a" stroke-width="3.4" stroke-linecap="round"></path></g>'
              f'<g class="wp-arm"><path d="M458 152 L474 158" stroke="#e8c09a" stroke-width="3.4" stroke-linecap="round"></path><path d="M470 162 L500 162" stroke="#5a3a22" stroke-width="2" stroke-linecap="round"></path>'
              f'<circle cx="500" cy="162" r="1.8" fill="#ff8a2a"></circle><circle class="wp-spark" cx="500" cy="162" r="4" fill="#ffd25a"></circle></g>')
    fizz = (''.join(f'<circle class="wp-fizz" style="animation-delay:{i*.08:.2f}s" cx="{500 + i*2}" cy="160" r="{3 + i}" fill="#e6ecef"></circle>' for i in range(3))
            + '<text class="wp-txt" x="508" y="146" font-family="Alegreya, Georgia, serif" font-style="italic" font-weight="700" font-size="13" fill="#ffffff">пш-ш-ш…</text>')
    h.append(svg(0, 0, 920, 210, gun + gunner + fizz, z=3))
    # a deckhand bailing water over the side with a bucket
    bailer = (f'<path d="M706 200 L710 178 M718 200 L714 178" stroke="#3a3530" stroke-width="5" stroke-linecap="round"></path>'
              f'<path d="M704 152 Q712 148 720 152 L722 180 H702 Z" fill="#9a8a6a" stroke="{INK}" stroke-width="1"></path>'
              f'<circle cx="712" cy="142" r="7" fill="#e8c09a" stroke="{INK}" stroke-width="1"></circle><path d="M705 141 C705 133 719 133 719 141 Z" fill="#2f4f66" stroke="{INK}" stroke-width=".8"></path>'
              f'<g class="wp-bucket"><path d="M716 156 L732 150" stroke="#e8c09a" stroke-width="3.4" stroke-linecap="round"></path><path d="M730 142 L744 142 L742 156 L732 156 Z" fill="#8a6440" stroke="{INK}" stroke-width="1.1"></path><path d="M731 147 H743" stroke="#3a3530" stroke-width="1.2"></path></g>'
              + ''.join(f'<circle class="wp-throw" style="animation-delay:{i*.04:.2f}s" cx="{742 + i*3}" cy="{142 - (i%2)*3}" r="{2.4 - (i%3)*.5:.1f}" fill="#cfe6ee"></circle>' for i in range(6)))
    h.append(svg(0, 0, 920, 210, bailer, z=3))
    return ('linear-gradient(#4a565c 0%, #6f7c82 60%, #929da2 100%)', ''.join(h), 'Сырой порох: на палубе под ливнем пушка не стреляет — фитиль шипит, бочонок полон воды', '')


# ------------------------------------------------------------------ Тортуга: the turtle island at sunset

def s_tortuga():
    pal = ['#3e98a8', '#17586a', '#f2fbfc', '#14485a', '#ffffff']
    h = []
    # a big setting sun behind the island
    h.append(sun_disc(330, 104, 34, halo_op=.7, uid='tgsun'))
    h.append(cloud_strip([(140, 20, .6, '#f8d8b0', '#e8a878', '#8a5a3a'), (520, 8, .5, '#f8d8b0', '#e8a878', '#8a5a3a'), (780, 30, .55, '#f8d8b0', '#e8a878', '#8a5a3a')], 0, 90, 110, op=.9))
    I = []
    I.append('<defs><linearGradient id="tgsh" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#6f9a5a"></stop><stop offset="1" stop-color="#3f6a3a"></stop></linearGradient>'
             '<linearGradient id="tgrk" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#9a8a72"></stop><stop offset="1" stop-color="#6a5a48"></stop></linearGradient></defs>')
    # the island is a turtle: a domed shell, flippers of rock, a head on the right with an eye-cave
    I.append(f'<path d="M0 152 C30 140 60 112 110 84 C170 50 270 40 340 56 C390 68 420 96 440 128 L460 152 Z" fill="url(#tgsh)" stroke="{INK}" stroke-width="1.6"></path>')
    shell = [(150, 76), (210, 62), (272, 60), (330, 72), (120, 104), (180, 96), (244, 92), (306, 100), (370, 112), (210, 124), (280, 126), (346, 132)]
    I.append(''.join(f'<path d="M{x-16} {y} L{x-8} {y-10} L{x+8} {y-10} L{x+16} {y} L{x+8} {y+10} L{x-8} {y+10} Z" fill="none" stroke="#2f5a2a" stroke-width="1.2" opacity=".55"></path>' for x, y in shell))
    I.append(f'<path d="M440 128 C452 112 474 100 498 102 C520 104 532 118 528 132 C524 144 506 150 488 150 L460 152 Z" fill="url(#tgrk)" stroke="{INK}" stroke-width="1.4"></path>'
             f'<ellipse cx="500" cy="118" rx="5" ry="4" fill="#2a1a10"></ellipse><circle cx="501" cy="117" r="1.2" fill="#ffd66a" class="w-win"></circle>'
             f'<path d="M512 136 C518 138 522 134 524 130" stroke="{INK}" stroke-width="1.2" fill="none"></path>')
    I.append(f'<path d="M40 152 C34 146 20 144 6 150 Z M380 152 C392 144 412 144 430 152 Z" fill="url(#tgrk)" stroke="{INK}" stroke-width="1.1"></path>')
    I.append('<path d="M10 152 C80 146 200 144 300 146 C380 147 430 150 470 152 Z" fill="#e8d0a0"></path>')
    # palms and jungle tufts on the shell
    I.append(palm(92, 104, 30, 5) + palm(388, 104, 26, -6) + palm(420, 124, 22, 4))
    I.append(''.join(f'<ellipse cx="{x}" cy="{y}" rx="{r}" ry="{r*.7:.1f}" fill="#4f7a44" stroke="#2f4a2a" stroke-width=".8"></ellipse>' for x, y, r in [(120, 92, 9), (360, 80, 10), (400, 98, 8), (70, 120, 9)]))
    # the fort on the crown of the shell, a black flag over it
    I.append(f'<g transform="translate(230 40)"><path d="M-40 18 V0 H-34 V-5 H-28 V0 H-22 V-5 H-16 V0 H-10 V-5 H-4 V0 H2 V-5 H8 V0 H14 V-5 H20 V0 H26 V-5 H32 V0 H38 V18 Z" fill="#b8a888" stroke="{INK}" stroke-width="1.2"></path>'
             f'<path d="M-6 0 V-24 H10 V0" fill="#a89878" stroke="{INK}" stroke-width="1.2"></path><path d="M-8 -24 H12 L8 -30 H-4 Z" fill="#8a7a62" stroke="{INK}" stroke-width="1"></path>'
             f'<rect x="-30" y="6" width="5" height="5" fill="#2a1a10"></rect><rect x="20" y="6" width="5" height="5" fill="#2a1a10"></rect><path d="M-32 9 h-8 M27 9 h8" stroke="#2a2a2a" stroke-width="2.4"></path>'
             f'<rect x="0" y="-16" width="4" height="6" fill="#ffd66a" class="w-win"></rect><path d="M2 -30 V-48" stroke="#3a2a1a" stroke-width="1.4"></path>'
             f'<g class="sc-flag"><path d="M2 -48 L22 -46 L20 -40 L22 -36 L2 -38 Z" fill="#1a1612" stroke="{INK}" stroke-width=".6"></path><circle cx="10" cy="-43" r="2.2" fill="#f2ead8"></circle><path d="M7 -39.6 L13 -40.6 M7 -40.6 L13 -39.6" stroke="#f2ead8" stroke-width=".9"></path></g></g>')
    # the town tumbling down the slope: whitewashed houses, red roofs, lit windows, smoke
    houses = [(150, 106, 14, 12), (168, 112, 12, 11), (186, 104, 16, 13), (206, 114, 13, 11), (226, 108, 15, 12), (248, 116, 12, 11), (266, 110, 14, 12), (290, 118, 13, 11), (310, 112, 15, 13),
              (160, 126, 13, 11), (182, 130, 15, 12), (204, 128, 14, 12), (330, 124, 14, 12), (352, 130, 12, 10), (130, 120, 12, 10)]
    hs = []
    for i, (x, y, w, hh) in enumerate(houses):
        c = ['#f2e6cc', '#e8d6b0', '#f4ead6', '#e2cfa6', '#efdcbc'][i % 5]
        hs.append(f'<rect x="{x}" y="{y}" width="{w}" height="{hh}" fill="{c}" stroke="{INK}" stroke-width=".8"></rect><path d="M{x-1.5} {y} L{x+w/2} {y-6} L{x+w+1.5} {y} Z" fill="{["#a8483a", "#b85a3a", "#8e3a2a"][i % 3]}" stroke="{INK}" stroke-width=".8"></path>'
                  f'<rect class="w-win" style="animation-delay:-{(i*.37)%1.4:.2f}s" x="{x+3}" y="{y+3}" width="3" height="3.4" fill="#ffd66a"></rect>' + (f'<rect x="{x+w-6}" y="{y+3}" width="3" height="3.4" fill="#ffd66a" class="w-win" style="animation-delay:-.7s"></rect>' if w > 13 else ''))
    I.append(''.join(hs))
    I.append(''.join(f'<circle class="sc-puff" style="animation-delay:-{i*1.1:.1f}s" cx="{x}" cy="{y}" r="3" fill="#e6e2da"></circle>' for i, (x, y) in enumerate([(192, 96), (192, 96), (272, 102), (316, 104)])))
    # the tavern on the waterfront with a hanging sign
    I.append(f'<g transform="translate(250 126)"><rect x="0" y="0" width="56" height="26" fill="#a8743e" stroke="{INK}" stroke-width="1.2"></rect><path d="M-4 0 L28 -12 L60 0 Z" fill="#6a3a1a" stroke="{INK}" stroke-width="1.1"></path>'
             f'<rect class="w-win" x="6" y="8" width="9" height="8" fill="#ffd66a" stroke="{INK}" stroke-width=".7"></rect><rect class="w-win" style="animation-delay:-.6s" x="40" y="8" width="9" height="8" fill="#ffd66a" stroke="{INK}" stroke-width=".7"></rect><rect x="22" y="10" width="11" height="16" fill="#4a2c14"></rect>'
             f'<path d="M56 6 H66 M62 6 V8" stroke="{INK}" stroke-width="1"></path><g class="tr-sw"><rect x="58" y="8" width="16" height="9" fill="#f2e2b8" stroke="{INK}" stroke-width=".7"></rect><text x="66" y="15" text-anchor="middle" font-family="Old Standard TT, Georgia, serif" font-weight="700" font-size="6" fill="#8e2b22">РОМ</text></g></g>')
    h.append(svg(400, 0, 540, 156, ''.join(I), z=0))
    h.append(sea('back', pal))
    # the pier with an arch reading ТОРТУГА, lanterns, barrels, a drunk crowd and the famous pigs
    P = []
    P.append(f'<path d="M560 150 H760 V156 H560 Z" fill="#6a4424" stroke="{INK}" stroke-width="1"></path>' + ''.join(f'<path d="M{x} 156 V170" stroke="#4a2c14" stroke-width="3"></path>' for x in range(566, 760, 26)))
    P.append(f'<g transform="translate(600 150)"><path d="M0 0 V-38 M70 0 V-38" stroke="#4a2c14" stroke-width="4"></path><path d="M-6 -36 Q35 -50 76 -36 L76 -28 Q35 -42 -6 -28 Z" fill="#8a5a2e" stroke="{INK}" stroke-width="1.2"></path>'
             f'<text x="35" y="-33" text-anchor="middle" font-family="Old Standard TT, Georgia, serif" font-weight="700" font-size="8.6" letter-spacing="1.2" fill="#ffe6a8">ТОРТУГА</text>'
             f'<path d="M-6 -28 v4 M76 -28 v4" stroke="{INK}" stroke-width=".8"></path><circle class="w-win" cx="-6" cy="-21" r="2.6" fill="#ffd66a" stroke="{INK}" stroke-width=".6"></circle><circle class="w-win" style="animation-delay:-.5s" cx="76" cy="-21" r="2.6" fill="#ffd66a" stroke="{INK}" stroke-width=".6"></circle></g>')
    P.append(barrel(580, 144, .45, '', uid='tgb1') + barrel(590, 145, .42, '', uid='tgb2') + barrel(740, 144, .45, '', uid='tgb3'))
    # pirates on the pier: one sways with a mug, one raises a mug, one sleeps against a barrel
    def pirate(x, cls, hat='#b23a2a', shirt='#f2ead8', mug=False):
        m = (f'<g class="tg-mug"><path d="M{x+3} {-11} L{x+8} {-16}" stroke="#e8c09a" stroke-width="1.8" stroke-linecap="round"></path><rect x="{x+7}" y="-20" width="4" height="5" fill="#c9a048" stroke="{INK}" stroke-width=".5"></rect></g>' if mug else '')
        return (f'<g class="{cls}"><g transform="translate(0 150)"><path d="M{x-2} 0 L{x-1} -7 M{x+2} 0 L{x+1} -7" stroke="#2f3a48" stroke-width="2" stroke-linecap="round"></path>'
                f'<path d="M{x-3} -7 L{x-3} -15 Q{x} -17 {x+3} -15 L{x+3} -7 Z" fill="{shirt}" stroke="{INK}" stroke-width=".6"></path><circle cx="{x}" cy="-19" r="3" fill="#e8c09a" stroke="{INK}" stroke-width=".6"></circle>'
                f'<path d="M{x-3.4} -20 C{x-3} -24 {x+3} -24 {x+3.4} -20 Z" fill="{hat}"></path>{m}</g></g>')
    P.append(pirate(630, 'tg-sway', mug=True) + pirate(652, 'tg-sway', '#2a2420', '#d8c8a0', mug=True) + pirate(714, '', '#2f4f66'))
    P.append(f'<g transform="translate(744 150)"><path d="M-12 0 C-12 -4 -4 -6 0 -4" stroke="#2f3a48" stroke-width="2.4" fill="none"></path><circle cx="-3" cy="-9" r="3" fill="#e8c09a" stroke="{INK}" stroke-width=".6"></circle><text class="sc-note" x="0" y="-14" font-family="Alegreya, Georgia, serif" font-style="italic" font-size="8" fill="#2a2018">z</text></g>')
    pig = lambda x, s: (f'<g transform="translate({x} 150) scale({s})"><ellipse cx="0" cy="-5" rx="8" ry="5" fill="#f0b0a8" stroke="{INK}" stroke-width=".8"></ellipse><circle cx="-8" cy="-7" r="3.4" fill="#f0b0a8" stroke="{INK}" stroke-width=".8"></circle>'
                        f'<ellipse cx="-11" cy="-6.6" rx="1.4" ry="1.1" fill="#e08a8a" stroke="{INK}" stroke-width=".5"></ellipse><path d="M-8 -10 l-1 -2 l2 1 Z" fill="#f0b0a8" stroke="{INK}" stroke-width=".5"></path><circle cx="-8.4" cy="-7.8" r=".6" fill="{INK}"></circle>'
                        f'<path d="M8 -6 q3 -1 2 -3" stroke="{INK}" stroke-width=".7" fill="none"></path><path d="M-5 0 V-1 M-2 0 V-1 M3 0 V-1 M6 0 V-1" stroke="{INK}" stroke-width="1.2"></path></g>')
    P.append(f'<g class="tg-pig">{pig(690, .9)}</g>' + pig(676, .7))
    # the beach fire under the palms (left of the pier)
    P.append('<defs><linearGradient id="tgfl" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#ffe680"></stop><stop offset=".5" stop-color="#ff9a2a"></stop><stop offset="1" stop-color="#e0401a" stop-opacity="0"></stop></linearGradient><radialGradient id="tgfg"><stop offset="0" stop-color="#ffb050" stop-opacity=".7"></stop><stop offset="1" stop-color="#ff8030" stop-opacity="0"></stop></radialGradient></defs>'
             '<ellipse class="th-fire-glow" cx="532" cy="148" rx="24" ry="14" fill="url(#tgfg)"></ellipse>'
             + ''.join(f'<path class="th-fl{1 + i % 3}" style="animation-delay:-{i*.13:.2f}s" d="M{x} 150 C{x-w} {150-hh*.4:.1f} {x-w*.4:.1f} {150-hh*.8:.1f} {x} {150-hh} C{x+w*.5:.1f} {150-hh*.7:.1f} {x+w} {150-hh*.35:.1f} {x} 150 Z" fill="url(#tgfl)"></path>' for i, (x, w, hh) in enumerate([(526, 4, 12), (532, 5, 17), (538, 4, 11)]))
             + f'<path d="M522 151 L542 147 M522 147 L542 151" stroke="#4a2c14" stroke-width="2"></path>'
             + ''.join(f'<circle class="th-emb" style="animation-delay:-{i*.4:.1f}s" cx="{528 + i*2}" cy="136" r="1" fill="#ffb040"></circle>' for i in range(5)))
    h.append(svg(0, 0, 920, 210, ''.join(P), z=1))
    # pirate ships moored at the pier, and the «Месть» coming in
    h.append(ship('revenge', 770, 58, cls='w-calm', wl=160, z=1, flip=True, alt=''))
    h.append(ship('pearl', 828, 50, cls='w-calm', wl=158, z=1, style='animation-delay: -2s', flip=True, alt=''))
    h.append(ship('revenge', 250, 126, cls='w-calm', alt='«Месть» заходит в гавань Тортуги'))
    h.append(sea('front', pal))
    # sun road and lights on the water
    h.append(svg(0, 0, 920, 210, ''.join(f'<path class="sc-glint" style="animation-delay:-{i*.3:.1f}s" d="M{x-L/2:.0f} {y} h{L}" stroke="#ffe0a0" stroke-width="2" stroke-linecap="round"></path>' for i, (x, y, L) in enumerate([(640, 172, 30), (700, 180, 22), (660, 190, 40), (620, 200, 26), (532, 168, 14)])), z=4))
    h.append(svg(0, 0, 920, 210, flapping_gull(500, 40, .7) + flapping_gull(530, 30, .55), z=3, cls='w-gulls', style='animation-duration: 30s'))
    return ('linear-gradient(#e89a5a 0%, #f2c27a 45%, #f6dca8 80%, #f8e6c0 100%)', ''.join(h), 'Тортуга: остров-черепаха на закате — форт с чёрным флагом, город, таверна «Ром», пристань с аркой «ТОРТУГА»', '')


CSS = scenes4.CSS + CSS5
RAIN = scenes4.RAIN
rain = scenes4.rain
strip_old_rain = scenes4.strip_old_rain
SCENES = dict(scenes4.SCENES)
SCENES['caravan'] = s_caravan
SCENES['wet'] = s_wet
SCENES['tortuga'] = s_tortuga
