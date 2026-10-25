"""Shared board shell, CSS and small HTML helpers for the menu boards (dc.html format)."""

FONTS = ('<link rel="preconnect" href="https://fonts.googleapis.com">'
         '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Alegreya:ital,wght@0,500;0,700;1,400;1,500&amp;family=Alegreya+SC:wght@500;700;800&amp;family=Alegreya+Sans:wght@400;500;700&amp;family=Old+Standard+TT:wght@400;700&amp;display=swap">')

BRASS_BORDER = 'linear-gradient(140deg,#fff0b8 0%,#e2bf62 14%,#8a6420 32%,#f0d27a 50%,#9a7020 68%,#e8c870 84%,#6a4a14 100%) border-box'
SCREWS = ('radial-gradient(circle at 13px 13px,#fff3c4 0 1.2px,#e0bd62 1.6px 2.4px,#5c4615 2.8px 3.4px,rgba(0,0,0,0) 3.8px),'
          'radial-gradient(circle at calc(100% - 13px) 13px,#fff3c4 0 1.2px,#e0bd62 1.6px 2.4px,#5c4615 2.8px 3.4px,rgba(0,0,0,0) 3.8px),'
          'radial-gradient(circle at 13px calc(100% - 13px),#fff3c4 0 1.2px,#e0bd62 1.6px 2.4px,#5c4615 2.8px 3.4px,rgba(0,0,0,0) 3.8px),'
          'radial-gradient(circle at calc(100% - 13px) calc(100% - 13px),#fff3c4 0 1.2px,#e0bd62 1.6px 2.4px,#5c4615 2.8px 3.4px,rgba(0,0,0,0) 3.8px)')

CSS = r'''
body{margin:0}
a{color:#e0bd62}a:hover{color:#f0d27a}
.sc{font-family:'Alegreya SC',Georgia,serif}
/* sea-chart background: portolan rhumb lines, coasts with water-lining, soundings, frame (assets/bg) */
.chart{background:#0e1b26 url(../assets/bg/chart-prep.svg) center/cover no-repeat}
.chart.ph{background-image:url(../assets/bg/chart-phone.svg)}
/* brass plaque: bevelled metal frame, engraved inner line, four screws, navy leather inside */
.plaque{position:relative;border:3px solid transparent;border-radius:12px;
 background:SCREWS,radial-gradient(ellipse 120% 70% at 50% 0%,rgba(255,236,180,.10),rgba(0,0,0,0) 60%),repeating-linear-gradient(135deg,rgba(255,255,255,.012) 0 2px,rgba(0,0,0,.02) 2px 4px),linear-gradient(#223443,#121e29 70%,#0e1820) padding-box,BRASS border-box;
 box-shadow:inset 0 0 0 1px #4a3610,inset 0 0 0 7px rgba(0,0,0,0),inset 0 0 0 8px rgba(224,189,98,.22),inset 0 1px 0 9px rgba(255,240,190,.03),0 14px 28px rgba(0,0,0,.55),0 2px 0 rgba(0,0,0,.4);overflow:hidden}
.plaque::after{content:"";position:absolute;inset:-40% -60%;background:linear-gradient(105deg,rgba(255,255,255,0) 42%,rgba(255,246,214,.10) 50%,rgba(255,255,255,0) 58%);translate:-60% 0;transition:translate .9s ease;pointer-events:none}
.plaque:hover::after{translate:60% 0}
.cream{position:relative;border:3px solid transparent;border-radius:12px;
 background:radial-gradient(ellipse at 82% 8%,rgba(255,255,255,.55),rgba(255,255,255,0) 50%),radial-gradient(ellipse at 10% 100%,rgba(150,110,50,.2),rgba(150,110,50,0) 55%),linear-gradient(#f6efdc,#e6d6ae) padding-box,BRASS border-box;
 color:#2a1e12;box-shadow:inset 0 0 0 1px #8a6a24,inset 0 0 0 6px rgba(0,0,0,0),inset 0 0 0 7px rgba(138,106,36,.32),0 14px 28px rgba(0,0,0,.55)}
/* medallion: brass ring, enamel face */
.medal{width:68px;height:68px;border-radius:50%;flex:none;display:flex;align-items:center;justify-content:center;position:relative;
 background:radial-gradient(circle at 50% 38%,#fffaf0 0 46%,#efe3c4 70%,#d2bf90) padding-box,linear-gradient(150deg,#fff0b8,#c9a048 35%,#6a4a14 60%,#e2bf62 85%,#8a6420) border-box;border:4px solid transparent;
 box-shadow:inset 0 0 0 1.5px #6a4a14,inset 0 3px 6px rgba(0,0,0,.18),0 4px 10px rgba(0,0,0,.5),0 0 0 1px rgba(0,0,0,.35)}
.medal img{display:block}
.go{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-top:auto;height:30px;font-family:'Alegreya SC',Georgia,serif;font-weight:700;font-size:15.5px;letter-spacing:.02em;color:#f0d27a;text-decoration:none}
.go svg{flex:none}
.btn-gold{display:inline-flex;align-items:center;justify-content:center;gap:10px;min-height:46px;padding:0 22px;border-radius:9px;border:2px solid #4a3610;
 background:radial-gradient(ellipse 80% 60% at 50% 0%,rgba(255,255,255,.55),rgba(255,255,255,0) 60%),linear-gradient(#f8e29c,#d6ad54 50%,#a8822e 51%,#c69a40);
 color:#24180a;font-family:'Alegreya SC',Georgia,serif;font-weight:800;font-size:17px;letter-spacing:.04em;line-height:1;text-decoration:none;text-shadow:0 1px 0 rgba(255,246,214,.6);
 box-shadow:inset 0 1px 0 rgba(255,255,255,.75),inset 0 -2px 0 rgba(90,60,10,.35),0 3px 0 #4a3610,0 8px 16px rgba(0,0,0,.45)}
.round{width:58px;height:58px;border-radius:50%;flex:none;display:flex;align-items:center;justify-content:center;
 background:radial-gradient(circle at 40% 30%,#3a5064,#15212c 70%) padding-box,linear-gradient(150deg,#fff0b8,#c9a048 35%,#5c4615 60%,#e2bf62 85%,#7a5a1e) border-box;border:3px solid transparent;
 box-shadow:inset 0 0 0 1.5px #2a1e0c,inset 0 6px 10px rgba(255,255,255,.05),0 5px 12px rgba(0,0,0,.5)}
.round img{display:block}
.tool{display:flex;align-items:center;gap:12px;color:#ecf1f4;text-decoration:none;font-family:'Alegreya SC',Georgia,serif;font-weight:700;font-size:16.5px;letter-spacing:.02em;line-height:1}
.gold-text{background:linear-gradient(#fff6d0 0%,#f6dc8c 38%,#d8a948 56%,#f2d482 70%,#b8862c 100%);-webkit-background-clip:text;background-clip:text;color:transparent}
.eyebrow{font-family:'Alegreya SC',Georgia,serif;font-weight:700;letter-spacing:.32em;color:#c9a048}
/* motion: transform/opacity only */
@keyframes bob{0%,100%{translate:0 0;rotate:0deg}50%{translate:0 -3px;rotate:.7deg}}
@keyframes bobR{0%,100%{translate:0 0}50%{translate:0 3px}}
@keyframes twinkle{0%,100%{opacity:1}50%{opacity:.25}}
@keyframes beam{0%,100%{rotate:-9deg;opacity:.7}50%{rotate:7deg;opacity:1}}
@keyframes bottle{0%,100%{translate:0 0;rotate:0deg}25%{translate:-10px -1.5px;rotate:-6deg}50%{translate:-22px 0;rotate:0deg}75%{translate:-12px 1.5px;rotate:5deg}}
@keyframes barrel{0%,100%{translate:0 0;rotate:-3deg}50%{translate:8px 2px;rotate:4deg}}
@keyframes gulls{0%,100%{translate:0 0}50%{translate:46px -8px}}
@keyframes clouds{0%,100%{translate:0 0}50%{translate:36px 0}}
@keyframes clouds2{0%,100%{translate:0 0}50%{translate:-28px 0}}
@keyframes flicker{0%,100%{opacity:1}40%{opacity:.7}55%{opacity:.95}70%{opacity:.6}}
@keyframes rise{from{opacity:0;translate:0 14px}to{opacity:1;translate:0 0}}
@keyframes meteor{0%,14%{opacity:0;translate:60px -24px}16%{opacity:1}24%{opacity:.9}28%{opacity:0;translate:-170px 68px}100%{opacity:0;translate:-170px 68px}}
@keyframes wing{0%,100%{scale:1 1}50%{scale:1 .55}}
@keyframes rays{0%,100%{opacity:.75}50%{opacity:1}}
@keyframes pulseGlow{0%,100%{opacity:.55}50%{opacity:1}}
@keyframes coinSpin{0%,30%,38%,80%,88%,100%{scale:1 1}34%,84%{scale:.06 1}}@keyframes coinFront{0%,33.9%{opacity:1}34%,83.9%{opacity:0}84%,100%{opacity:1}}@keyframes coinBack{0%,33.9%{opacity:0}34%,83.9%{opacity:1}84%,100%{opacity:0}}
@keyframes fortFlag{0%,100%{transform:scaleX(1)}50%{transform:scaleX(.82)}}
.bob{animation:bob 6.4s ease-in-out infinite}
.bob.d1{animation-delay:-1.6s;animation-duration:7.2s}.bob.d2{animation-delay:-3.1s;animation-duration:5.8s}.bob.d3{animation-delay:-4.4s;animation-duration:6.8s}
.bobR{animation:bobR 6.4s ease-in-out infinite}
.bobR.d1{animation-delay:-1.6s;animation-duration:7.2s}.bobR.d2{animation-delay:-3.1s;animation-duration:5.8s}.bobR.d3{animation-delay:-4.4s;animation-duration:6.8s}
.tw{animation:twinkle 3.6s ease-in-out infinite}.tw2{animation:twinkle 5.2s ease-in-out -2s infinite}.tw3{animation:twinkle 4.4s ease-in-out -1s infinite}
.beam{animation:beam 7s ease-in-out infinite}
.bottle{transform-box:fill-box;transform-origin:center;animation:bottle 16s ease-in-out infinite}
.barrel{transform-box:fill-box;transform-origin:center;animation:barrel 9s ease-in-out infinite}
.gulls{animation:gulls 22s ease-in-out infinite}.gull{transform-box:fill-box;transform-origin:center;animation:wing .9s ease-in-out infinite}.gull.g2{animation-delay:-.4s}.gull.g3{animation-delay:-.7s}
.clouds{animation:clouds 48s ease-in-out infinite}.clouds2{animation:clouds2 60s ease-in-out infinite}
.flick{animation:flicker 2.4s ease-in-out infinite}.flick.d1,.flickd1{animation:flicker 2.4s ease-in-out -.8s infinite}.flick.d2,.flickd2{animation:flicker 2.4s ease-in-out -1.5s infinite}.flickd3{animation:flicker 2.6s ease-in-out -2s infinite}.flick.d0{animation-delay:-.3s}
.meteor{animation:meteor 9s cubic-bezier(.3,0,.7,1) infinite}
.rays{transform-box:fill-box;transform-origin:center bottom;animation:rays 5s ease-in-out infinite}
.pulse{animation:pulseGlow 3.2s ease-in-out infinite}
.coin{position:relative;display:block;animation:coinSpin 12s ease-in-out infinite}.coin img{display:block}.coin .back{position:absolute;left:0;top:0;width:100%;height:100%;opacity:0}.coin .front{animation:coinFront 12s linear infinite}.coin .back{animation:coinBack 12s linear infinite}
.fortFlag{transform-box:fill-box;transform-origin:left center;animation:fortFlag 2.2s ease-in-out infinite}
.rise{animation:rise .7s cubic-bezier(.2,.7,.2,1) both}.rise.d1{animation-delay:.08s}.rise.d2{animation-delay:.16s}.rise.d3{animation-delay:.24s}.rise.d4{animation-delay:.32s}
.lift{transition:translate .25s ease,filter .25s ease}.lift:hover{translate:0 -4px;filter:brightness(1.07)}
.lift:hover .medal img,.lift:hover .round img{rotate:-8deg;scale:1.07}
.medal img,.round img{transition:rotate .3s ease,scale .3s ease}
.lift.spin:hover .round img{rotate:120deg;scale:1.07}
@media (prefers-reduced-motion: reduce){*,*::before,*::after{animation:none !important;transition:none !important}}
/* optical centring: Alegreya SC small caps sit low in the line box, lift them */
'''.replace('SCREWS', SCREWS).replace('BRASS', BRASS_BORDER.replace(' border-box', ''))


def board(title, W, H, body, extra_css=''):
    return f'''<!doctype html>
<html lang="ru">
<head>
<meta charset="utf-8">
<title>{title}</title>
<script src="./vendor/react.js"></script>
<script src="./vendor/react-dom.js"></script>
<script src="./support.js"></script>
</head>
<body>
<x-dc>
<helmet>
{FONTS}
<style>{CSS}{extra_css}</style>
</helmet>
{body}
</x-dc>
<script type="text/x-dc" data-dc-script data-props='{{"$preview":{{"width":{W},"height":{H}}}}}'>
class Component extends DCLogic {{
  renderVals() {{ return {{}}; }}
}}
</script>
</body>
</html>
'''


ARROW = '<svg aria-hidden="true" width="22" height="14" viewBox="0 0 22 14"><path d="M1 7 H19 M13 1.5 L19.5 7 L13 12.5" stroke="#f0d27a" stroke-width="1.9" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>'
ARROW_L = '<svg aria-hidden="true" width="20" height="14" viewBox="0 0 20 14"><path d="M19 7 H2 M8 1.5 L1.5 7 L8 12.5" stroke="#f0d27a" stroke-width="1.9" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>'
CHEV = '<svg aria-hidden="true" width="12" height="20" viewBox="0 0 12 20"><path d="M2 2 L10 10 L2 18" stroke="#f0d27a" stroke-width="2.2" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>'


def flourish(w=220, color='#c9a048'):
    """Engraved divider: tapered rules, scrolls and a compass star in the middle."""
    h = 20
    c = w / 2
    return (f'<svg aria-hidden="true" width="{w}" height="{h}" viewBox="0 0 {w} {h}">'
            f'<defs><linearGradient id="fl{w}" x1="0" x2="1"><stop offset="0" stop-color="{color}" stop-opacity="0"/><stop offset=".5" stop-color="{color}"/><stop offset="1" stop-color="{color}" stop-opacity="0"/></linearGradient></defs>'
            f'<path d="M0 10 H{c - 26} M{c + 26} 10 H{w}" stroke="url(#fl{w})" stroke-width="1.3"/>'
            f'<path d="M{c - 26} 10 C {c - 22} 4 {c - 15} 4 {c - 14} 9 C {c - 13.5} 12 {c - 17} 12.6 {c - 18} 10.4" stroke="{color}" stroke-width="1.1" fill="none"/>'
            f'<path d="M{c + 26} 10 C {c + 22} 4 {c + 15} 4 {c + 14} 9 C {c + 13.5} 12 {c + 17} 12.6 {c + 18} 10.4" stroke="{color}" stroke-width="1.1" fill="none"/>'
            f'<path d="M{c} 1 L{c + 2.4} 7.6 L{c + 9} 10 L{c + 2.4} 12.4 L{c} 19 L{c - 2.4} 12.4 L{c - 9} 10 L{c - 2.4} 7.6 Z" fill="{color}"/>'
            f'<path d="M{c} 4 L{c + 1.2} 10 L{c} 16 L{c - 1.2} 10 Z" fill="#fff3c4" opacity=".8"/>'
            f'<circle cx="{c - 32}" cy="10" r="1.4" fill="{color}"/><circle cx="{c + 32}" cy="10" r="1.4" fill="{color}"/></svg>')
