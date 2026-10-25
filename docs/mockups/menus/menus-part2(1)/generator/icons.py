import os
D='''<defs>
<linearGradient id="br" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff0b8"/><stop offset=".3" stop-color="#e2bf62"/><stop offset=".68" stop-color="#9a7020"/><stop offset="1" stop-color="#d8b05a"/></linearGradient>
<linearGradient id="brH" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#7a5616"/><stop offset=".22" stop-color="#fff0b8"/><stop offset=".45" stop-color="#e2bf62"/><stop offset=".8" stop-color="#8f6b20"/><stop offset="1" stop-color="#c9a048"/></linearGradient>
<radialGradient id="brR" cx=".35" cy=".3" r=".8"><stop offset="0" stop-color="#fff3c4"/><stop offset=".35" stop-color="#e2bf62"/><stop offset=".8" stop-color="#8f6b20"/><stop offset="1" stop-color="#5e4210"/></radialGradient>
<linearGradient id="ir" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#5d6569"/><stop offset=".16" stop-color="#e4ecef"/><stop offset=".3" stop-color="#8a9498"/><stop offset=".62" stop-color="#4a5256"/><stop offset=".86" stop-color="#2a2f32"/><stop offset="1" stop-color="#6a7276"/></linearGradient>
<linearGradient id="oak" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#a87444"/><stop offset=".1" stop-color="#d09a66"/><stop offset=".25" stop-color="#94623a"/><stop offset=".8" stop-color="#6e4526"/><stop offset="1" stop-color="#4a2c14"/></linearGradient>
<linearGradient id="oakH" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#4a2c14"/><stop offset=".3" stop-color="#c79260"/><stop offset=".55" stop-color="#94623a"/><stop offset="1" stop-color="#4a2c14"/></linearGradient>
<radialGradient id="knob" cx=".38" cy=".32" r=".75"><stop offset="0" stop-color="#d8a06a"/><stop offset=".6" stop-color="#7a4a24"/><stop offset="1" stop-color="#3a2210"/></radialGradient>
<linearGradient id="lea" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#9a3e28"/><stop offset=".45" stop-color="#6e2416"/><stop offset="1" stop-color="#3e120a"/></linearGradient>
<linearGradient id="leaV" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8a5a3a"/><stop offset=".3" stop-color="#5a3420"/><stop offset="1" stop-color="#2e180c"/></linearGradient>
<linearGradient id="pap" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fbf5e4"/><stop offset="1" stop-color="#e2d2a8"/></linearGradient>
<linearGradient id="papL" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#efe3c2"/><stop offset=".75" stop-color="#f8f0dc"/><stop offset="1" stop-color="#c9b588"/></linearGradient>
<linearGradient id="papR" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#c9b588"/><stop offset=".25" stop-color="#f8f0dc"/><stop offset="1" stop-color="#efe3c2"/></linearGradient>
<linearGradient id="sand" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f2d590"/><stop offset="1" stop-color="#b98a3a"/></linearGradient>
<linearGradient id="fold" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#000" stop-opacity=".18"/><stop offset=".3" stop-color="#fff" stop-opacity=".22"/><stop offset=".55" stop-color="#000" stop-opacity=".16"/><stop offset=".8" stop-color="#fff" stop-opacity=".18"/><stop offset="1" stop-color="#000" stop-opacity=".22"/></linearGradient>
<radialGradient id="ao" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#000" stop-opacity=".55"/><stop offset="1" stop-color="#000" stop-opacity="0"/></radialGradient>
<radialGradient id="lens" cx=".4" cy=".35" r=".7"><stop offset="0" stop-color="#e8f6ff"/><stop offset=".3" stop-color="#6aa4c4"/><stop offset="1" stop-color="#14324a"/></radialGradient>
<linearGradient id="glass" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#cfe6ee" stop-opacity=".5"/><stop offset=".25" stop-color="#ffffff" stop-opacity=".15"/><stop offset=".7" stop-color="#a8c8d4" stop-opacity=".12"/><stop offset="1" stop-color="#cfe6ee" stop-opacity=".45"/></linearGradient>
</defs>'''
def w(name, vb, body):
    open(name+'.svg','w').write(f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{vb}" width="128" height="128">{D}{body}</svg>')

# ---------- crossed cutlasses
def saber():
    s='<g>'
    s+='<path d="M16 -2.6 C 34 -3.4 48 -5.4 59 -10 C 53 -3.4 41 2.8 16 2.8 Z" fill="url(#ir)" stroke="#1c2022" stroke-width=".7"/>'
    s+='<path d="M18 -.7 C 34 -1.2 45 -3 53 -6" stroke="#fff" stroke-width=".55" fill="none" opacity=".75"/>'
    s+='<path d="M17 2.6 C 38 2.4 50 -2 58.4 -9.4" stroke="#fff" stroke-width=".4" fill="none" opacity=".5"/>'
    # grip
    s+='<rect x="-1.5" y="-2.7" width="13.5" height="5.4" rx="2.2" fill="url(#leaV)" stroke="#1a0e06" stroke-width=".6"/>'
    for i in range(6):
        x=-0.6+i*2.1
        s+=f'<path d="M{x} -2.6 L{x+1.6} 2.6" stroke="#1a0e06" stroke-width=".55"/><path d="M{x+.5} -2.5 L{x+1.9} 2" stroke="#c99a6a" stroke-width=".3" opacity=".7"/>'
    # guard: knuckle bow + shell
    s+='<path d="M14 4 C 8 10.5 -1 10 -4 3.6" stroke="#5e4210" stroke-width="2.6" fill="none" stroke-linecap="round"/>'
    s+='<path d="M14 4 C 8 10.5 -1 10 -4 3.6" stroke="url(#brH)" stroke-width="1.6" fill="none" stroke-linecap="round"/>'
    s+='<path d="M11.5 -6.5 C 17.5 -6 18.5 -1 17.6 3.6 C 16.8 7.4 13 8.6 11 7.6 C 13.4 4 13.6 -2.4 11.5 -6.5 Z" fill="url(#br)" stroke="#5e4210" stroke-width=".6"/>'
    s+='<path d="M13 -4.6 C 15.4 -3 15.6 1.6 14 5" stroke="#fff6d0" stroke-width=".5" fill="none" opacity=".8"/>'
    s+='<circle cx="-4.2" cy="0" r="3.1" fill="url(#brR)" stroke="#5e4210" stroke-width=".6"/><circle cx="-5" cy="-1" r=".9" fill="#fff8dc" opacity=".8"/>'
    return s+'</g>'
sb=saber()
w('ic_cutlasses','0 0 64 64',
 '<ellipse cx="32" cy="58" rx="26" ry="3.4" fill="url(#ao)"/>'
 f'<g transform="translate(13 50) rotate(-44)">{sb}</g>'
 f'<g transform="translate(51 50) scale(-1 1) rotate(-44)">{sb}</g>')

# ---------- signal flags
def flag(y,h,body,clip):
    return body
fl='<ellipse cx="14" cy="60.5" rx="10" ry="2.4" fill="url(#ao)"/>'
fl+='<rect x="10.3" y="4" width="3.6" height="56" rx="1.2" fill="url(#oakH)" stroke="#2a180a" stroke-width=".6"/>'
fl+='<circle cx="12.1" cy="4" r="2.8" fill="url(#brR)" stroke="#5e4210" stroke-width=".6"/>'
fl+='<path d="M14 7 L15.5 7 M15.5 7 V54" stroke="#3a2a1a" stroke-width=".7"/>'
# flag 1 blue/white checks
fl+='<clipPath id="f1"><path d="M15.5 8 C 26 6 36 10 52 7.5 L52 21.5 C 36 24 26 19.5 15.5 21.5 Z"/></clipPath>'
fl+='<g clip-path="url(#f1)"><rect x="15" y="5" width="38" height="20" fill="#f4efe0"/>'
for i in range(4):
  for j in range(2):
    if (i+j)%2==0: fl+=f'<rect x="{15.5+i*9.2}" y="{4+j*9.6}" width="9.2" height="9.6" fill="#1f4f86"/>'
fl+='<rect x="15" y="5" width="38" height="20" fill="url(#fold)"/></g>'
fl+='<path d="M15.5 8 C 26 6 36 10 52 7.5 L52 21.5 C 36 24 26 19.5 15.5 21.5 Z" fill="none" stroke="#1a2a3a" stroke-width=".6"/>'
# flag 2 yellow with red diagonal cross
fl+='<clipPath id="f2"><path d="M15.5 25 C 26 23 36 27 52 24.5 L52 38.5 C 36 41 26 36.5 15.5 38.5 Z"/></clipPath>'
fl+='<g clip-path="url(#f2)"><rect x="15" y="22" width="38" height="20" fill="#e8b830"/><path d="M14 22 L54 42 M14 42 L54 22" stroke="#b3281e" stroke-width="5"/><rect x="15" y="22" width="38" height="20" fill="url(#fold)"/></g>'
fl+='<path d="M15.5 25 C 26 23 36 27 52 24.5 L52 38.5 C 36 41 26 36.5 15.5 38.5 Z" fill="none" stroke="#5a3a10" stroke-width=".6"/>'
# pennant red/white swallowtail
fl+='<clipPath id="f3"><path d="M15.5 42 C 28 41 40 44 56 43.5 L48 48.5 L56 53.5 C 40 53 28 56 15.5 55 Z"/></clipPath>'
fl+='<g clip-path="url(#f3)"><rect x="15" y="40" width="42" height="18" fill="#b3281e"/><rect x="15" y="40" width="13" height="18" fill="#f4efe0"/><rect x="15" y="40" width="42" height="18" fill="url(#fold)"/></g>'
fl+='<path d="M15.5 42 C 28 41 40 44 56 43.5 L48 48.5 L56 53.5 C 40 53 28 56 15.5 55 Z" fill="none" stroke="#4a120c" stroke-width=".6"/>'
fl+='<g fill="#2a1a0c"><circle cx="15.5" cy="8" r=".9"/><circle cx="15.5" cy="21.5" r=".9"/><circle cx="15.5" cy="25" r=".9"/><circle cx="15.5" cy="38.5" r=".9"/><circle cx="15.5" cy="42" r=".9"/><circle cx="15.5" cy="55" r=".9"/></g>'
w('ic_flags','0 0 64 64',fl)

# ---------- hourglass
hg='<ellipse cx="32" cy="60.5" rx="22" ry="2.6" fill="url(#ao)"/>'
# back post
hg+='<rect x="30.6" y="11" width="2.8" height="42" fill="url(#brH)" opacity=".55"/>'
# glass + sand
hg+='<path d="M20 12 C 20 24 29.6 27.6 30.4 32 C 29.6 36.4 20 40 20 52 L44 52 C 44 40 34.4 36.4 33.6 32 C 34.4 27.6 44 24 44 12 Z" fill="#9fc4d2" fill-opacity=".18"/>'
hg+='<path d="M22.6 19.5 C 24.6 25.5 29.6 28.6 31 31.4 L33 31.4 C 34.4 28.6 39.4 25.5 41.4 19.5 C 36 21 28 21 22.6 19.5 Z" fill="url(#sand)"/>'
hg+='<path d="M32 31.4 V47" stroke="#e2bc6a" stroke-width=".9"/>'
hg+='<path d="M21.2 52 C 23 46.6 28.4 44.4 32 44 C 35.6 44.4 41 46.6 42.8 52 Z" fill="url(#sand)"/>'
hg+='<g fill="#fff3c8" opacity=".7"><circle cx="27" cy="48.4" r=".35"/><circle cx="35" cy="47.2" r=".3"/><circle cx="30" cy="23" r=".3"/><circle cx="37" cy="22.6" r=".35"/></g>'
hg+='<path d="M20 12 C 20 24 29.6 27.6 30.4 32 C 29.6 36.4 20 40 20 52 L44 52 C 44 40 34.4 36.4 33.6 32 C 34.4 27.6 44 24 44 12 Z" fill="url(#glass)" stroke="#d8eef4" stroke-width=".8" stroke-opacity=".75"/>'
hg+='<path d="M22.6 14 C 22.8 21 26.6 25 29 28.4 M22.6 50 C 22.8 44 25.4 40.6 28 38.4" stroke="#fff" stroke-width="1.2" fill="none" stroke-linecap="round" opacity=".75"/>'
# posts
for x in (15,46):
    hg+=f'<rect x="{x}" y="11" width="3" height="42" fill="url(#brH)" stroke="#5e4210" stroke-width=".5"/>'
    for y in (19,32,45):
        hg+=f'<ellipse cx="{x+1.5}" cy="{y}" rx="2.6" ry="1.9" fill="url(#brR)" stroke="#5e4210" stroke-width=".5"/>'
# caps
for y in (5.5,51.5):
    hg+=f'<rect x="12" y="{y}" width="40" height="7" rx="2" fill="url(#oak)" stroke="#2a180a" stroke-width=".8"/>'
    hg+=f'<path d="M14 {y+2.6} C 24 {y+1.6} 38 {y+3.4} 50 {y+2.4} M14 {y+4.6} C 26 {y+5.4} 36 {y+3.8} 50 {y+4.8}" stroke="#5a3618" stroke-width=".4" fill="none" opacity=".7"/>'
    hg+=f'<path d="M13 {y+.9} H51" stroke="#f0c68c" stroke-width=".7" opacity=".6"/>'
    for x in (16.5,47.5):
        hg+=f'<circle cx="{x}" cy="{y+3.5}" r="1.4" fill="url(#brR)" stroke="#5e4210" stroke-width=".4"/>'
w('ic_hourglass','0 0 64 64',hg)

# ---------- logbook + quill
lb='<ellipse cx="32" cy="59.5" rx="25" ry="3" fill="url(#ao)"/>'
lb+='<path d="M48 10 H53 C 54 10 54.6 11 54.6 12 V54 C 54.6 55 54 56 53 56 H48 Z" fill="url(#pap)" stroke="#8a6a3a" stroke-width=".5"/>'
for y in range(13,55,2):
    lb+=f'<path d="M48.5 {y} H54" stroke="#b9a274" stroke-width=".3"/>'
lb+='<rect x="10" y="7.5" width="40" height="50" rx="3" fill="url(#lea)" stroke="#2a0c06" stroke-width=".9"/>'
lb+='<rect x="10" y="7.5" width="6.5" height="50" rx="2.5" fill="#3e120a" opacity=".55"/>'
for y in (14,24,41,51):
    lb+=f'<rect x="10" y="{y}" width="6.5" height="2" rx="1" fill="#a24a30" stroke="#2a0c06" stroke-width=".4"/>'
lb+='<rect x="19.5" y="11.5" width="27" height="42" rx="1.5" fill="none" stroke="#e2bf62" stroke-width=".7" stroke-dasharray="1.6 1.2" opacity=".85"/>'
lb+='<g transform="translate(33 32.5)"><circle r="7.5" fill="none" stroke="#e2bf62" stroke-width=".8"/><path d="M0 -9 L1.6 -1.6 L9 0 L1.6 1.6 L0 9 L-1.6 1.6 L-9 0 L-1.6 -1.6 Z" fill="url(#br)" stroke="#7a5616" stroke-width=".4"/><circle r="1.2" fill="#6e2416"/></g>'
lb+='<path d="M44 7.5 H50 V13.5 Z M44 57.5 H50 V51.5 Z" fill="url(#br)" stroke="#5e4210" stroke-width=".5"/>'
lb+='<path d="M38 57 V63 L40 61 L42 63 V57" fill="#c0392b" stroke="#5a120c" stroke-width=".5"/>'
lb+='<g fill="#000" opacity=".18"><circle cx="24" cy="46" r=".6"/><circle cx="41" cy="20" r=".5"/><circle cx="28" cy="19" r=".4"/></g>'
# quill
lb+='<g transform="translate(36 58) rotate(-58)">'
lb+='<path d="M0 0 L5 -0.6 C 18 -6 34 -6.4 46 -2 C 34 2.6 18 3 5 0.6 Z" fill="#f6f0e2" stroke="#8a7a5a" stroke-width=".5"/>'
for i in range(9):
    x=9+i*4
    lb+=f'<path d="M{x} 0 L{x+3} -{3.6-abs(i-4)*.3}" stroke="#b8a888" stroke-width=".35"/><path d="M{x} 0 L{x+3} {3.2-abs(i-4)*.3}" stroke="#b8a888" stroke-width=".35"/>'
lb+='<path d="M-1 0 H47" stroke="#8a7a5a" stroke-width=".7"/><path d="M-3 0 L0 -.6 V.6 Z" fill="#2a1a0c"/></g>'
w('ic_logbook','0 0 64 64',lb)

# ---------- open book
ob='<ellipse cx="32" cy="57" rx="28" ry="3" fill="url(#ao)"/>'
ob+='<path d="M3 15 L3 52 C 14 50 26 50 32 54.5 C 38 50 50 50 61 52 L61 15 Z" fill="url(#lea)" stroke="#2a0c06" stroke-width=".8"/>'
ob+='<path d="M5 50 C 16 48.4 26 48.4 32 52 C 38 48.4 48 48.4 59 50" stroke="#e0d0a8" stroke-width="1.4" fill="none"/>'
ob+='<path d="M32 15 C 24 10.5 13 10.5 6 13 L6 48 C 13 45.6 24 45.6 32 50 Z" fill="url(#papL)" stroke="#8a6a3a" stroke-width=".5"/>'
ob+='<path d="M32 15 C 40 10.5 51 10.5 58 13 L58 48 C 51 45.6 40 45.6 32 50 Z" fill="url(#papR)" stroke="#8a6a3a" stroke-width=".5"/>'
ob+='<rect x="9.5" y="17" width="5" height="5" fill="#8e2b22"/><path d="M11 19.5 h2" stroke="#f3d690" stroke-width="1"/>'
for i,y in enumerate(range(18,44,3)):
    x0=16 if y<23 else 10
    ob+=f'<path d="M{x0} {y+ (0 if y<23 else 0)} C {x0+6} {y-.6} 22 {y-.4} 29 {y+.6}" stroke="#7a6a4a" stroke-width=".55" fill="none" opacity=".55"/>'
ob+='<g transform="translate(45 25)"><circle r="6.5" fill="none" stroke="#7a6a4a" stroke-width=".55" opacity=".7"/><path d="M0 -8 L1.3 -1.3 L8 0 L1.3 1.3 L0 8 L-1.3 1.3 L-8 0 L-1.3 -1.3 Z" fill="#8e2b22" opacity=".85"/></g>'
for y in (36,39,42):
    ob+=f'<path d="M36 {y} C 42 {y-.6} 48 {y-.4} 55 {y+.6}" stroke="#7a6a4a" stroke-width=".55" fill="none" opacity=".55"/>'
ob+='<path d="M32 15 V50" stroke="#6a5030" stroke-width=".8" opacity=".6"/>'
ob+='<path d="M30.5 49 V60 L32.5 58 L34.5 60 V49" fill="#c0392b" stroke="#5a120c" stroke-width=".5"/>'
w('ic_book','0 0 64 64',ob)

# ---------- cards fan
def card(rot, band, sym):
    c=f'<g transform="rotate({rot} 32 60)">'
    c+='<rect x="21.5" y="15.5" width="21" height="31" rx="2.6" fill="#000" opacity=".28" transform="translate(1.2 1.2)"/>'
    c+='<rect x="21.5" y="15.5" width="21" height="31" rx="2.6" fill="url(#pap)" stroke="#8a6a24" stroke-width=".8"/>'
    c+=f'<path d="M24.1 15.5 H39.9 A2.6 2.6 0 0 1 42.5 18.1 V21.5 H21.5 V18.1 A2.6 2.6 0 0 1 24.1 15.5 Z" fill="{band}"/>'
    c+='<rect x="23" y="17" width="18" height="29" rx="1.6" fill="none" stroke="#c9a048" stroke-width=".5" opacity=".8"/>'
    c+=sym
    c+='<path d="M25 39 H39 M25 41.6 H36" stroke="#8a7a5a" stroke-width=".7" opacity=".7"/>'
    c+='<circle cx="24.6" cy="18.6" r="2.2" fill="url(#brR)" stroke="#5e4210" stroke-width=".4"/>'
    return c+'</g>'
cd='<ellipse cx="32" cy="58" rx="22" ry="2.6" fill="url(#ao)"/>'
cd+=card(-22,'#5f6266','<circle cx="32" cy="30" r="4.2" fill="url(#ir)" stroke="#1c2022" stroke-width=".5"/>')
cd+=card(0,'#5b3c7a','<path d="M29 24.5 V36" stroke="#3a2a1a" stroke-width=".9"/><path d="M29.4 25 C 32 24 34 26.4 37 25 L35.4 28 L37 31 C 34 32.4 32 30 29.4 31 Z" fill="#5b3c7a"/>')
cd+=card(22,'#2f5f8a','<path d="M32 24 C 37 27 37 32 32 36 C 27 32 27 27 32 24 Z" fill="#2f5f8a" opacity=".85"/><path d="M34 28.4 C 33 26.6 30.4 26.8 30 29 C 29.7 30.8 31.4 32 33.4 31.4 M30 27.6 L30 29.2 L31.6 29.2" stroke="#e8f0f6" stroke-width=".8" fill="none" stroke-linecap="round"/>')
w('ic_cards','0 0 64 64',cd)

# ---------- ship wheel
wh='<ellipse cx="32" cy="61" rx="22" ry="2.4" fill="url(#ao)"/>'
wh+='<g id="sp"><rect x="-1.5" y="-29" width="3" height="23" rx="1.2" fill="url(#oakH)" stroke="#2a180a" stroke-width=".45"/><ellipse cx="0" cy="-26.4" rx="2.3" ry="3.2" fill="url(#knob)" stroke="#2a180a" stroke-width=".45"/><circle cx="0" cy="-30.2" r="1.7" fill="url(#knob)" stroke="#2a180a" stroke-width=".45"/></g>'
wh='<ellipse cx="32" cy="61.5" rx="22" ry="2.4" fill="url(#ao)"/><g transform="translate(32 32)">'
spoke='<rect x="-1.5" y="-29" width="3" height="23" rx="1.2" fill="url(#oakH)" stroke="#2a180a" stroke-width=".45"/><ellipse cx="0" cy="-26.6" rx="2.3" ry="3.1" fill="url(#knob)" stroke="#2a180a" stroke-width=".45"/><circle cx="0" cy="-30.3" r="1.6" fill="url(#knob)" stroke="#2a180a" stroke-width=".45"/>'
for k in range(8):
    wh+=f'<g transform="rotate({k*45})">{spoke}</g>'
wh+='<path d="M0 -22 A22 22 0 1 1 0 22 A22 22 0 1 1 0 -22 Z M0 -16.5 A16.5 16.5 0 1 0 0 16.5 A16.5 16.5 0 1 0 0 -16.5 Z" fill="url(#oak)" fill-rule="evenodd" stroke="#2a180a" stroke-width=".8"/>'
wh+='<circle r="19.2" fill="none" stroke="#5a3618" stroke-width=".4" stroke-dasharray="6 3 9 4" opacity=".7"/>'
wh+='<path d="M-15.5 -15.5 A22 22 0 0 1 15.5 -15.5" stroke="#f0c68c" stroke-width=".9" fill="none" opacity=".6"/>'
for k in range(8):
    wh+=f'<g transform="rotate({k*45+22.5})"><rect x="-1.1" y="-22.2" width="2.2" height="5.9" fill="url(#brH)" stroke="#5e4210" stroke-width=".35"/></g>'
wh+='<circle r="8" fill="url(#brR)" stroke="#5e4210" stroke-width=".7"/><circle r="4.4" fill="none" stroke="#7a5616" stroke-width=".6"/><circle r="2.2" fill="#5e4210"/>'
for k in range(8):
    wh+=f'<circle cx="0" cy="-6.2" r=".75" fill="#fff3c4" stroke="#7a5616" stroke-width=".3" transform="rotate({k*45})"/>'
wh+='</g>'
w('ic_wheel','0 0 64 64',wh)

# ---------- spyglass
sg='<ellipse cx="32" cy="58.5" rx="27" ry="2.8" fill="url(#ao)"/><g transform="translate(8 50) rotate(-36)">'
sg+='<rect x="0" y="-3" width="7" height="6" rx="1.4" fill="url(#br)" stroke="#5e4210" stroke-width=".5"/><ellipse cx="0" cy="0" rx="1" ry="2.4" fill="#2a1a0a"/>'
sg+='<rect x="7" y="-4" width="15" height="8" fill="url(#leaV)" stroke="#1a0e06" stroke-width=".5"/><path d="M8 -2.6 H21 M8 2.6 H21" stroke="#c99a6a" stroke-width=".4" stroke-dasharray="1 1"/>'
sg+='<rect x="21" y="-4.8" width="2.4" height="9.6" rx=".6" fill="url(#br)" stroke="#5e4210" stroke-width=".5"/>'
sg+='<rect x="23.4" y="-5" width="14" height="10" fill="url(#br)" stroke="#5e4210" stroke-width=".5"/>'
sg+='<rect x="37.4" y="-5.8" width="2.6" height="11.6" rx=".6" fill="url(#br)" stroke="#5e4210" stroke-width=".5"/>'
sg+='<rect x="40" y="-6.2" width="11" height="12.4" fill="url(#br)" stroke="#5e4210" stroke-width=".5"/>'
sg+='<path d="M24 -2 H37 M41 -2.6 H50" stroke="#fff8dc" stroke-width=".7" opacity=".8"/>'
sg+='<path d="M28 3 H35 M43 3.6 H48" stroke="#7a5616" stroke-width=".4" opacity=".8"/>'
sg+='<rect x="51" y="-7.2" width="4" height="14.4" rx="1" fill="url(#br)" stroke="#5e4210" stroke-width=".6"/>'
sg+='<ellipse cx="55" cy="0" rx="1.8" ry="6.4" fill="url(#lens)" stroke="#5e4210" stroke-width=".5"/><ellipse cx="54.8" cy="-2.6" rx=".5" ry="1.4" fill="#fff" opacity=".9"/>'
sg+='</g>'
w('ic_spyglass','0 0 64 64',sg)

# ---------- ship bell
bl='<rect x="10" y="3" width="44" height="5" rx="1.4" fill="url(#oak)" stroke="#2a180a" stroke-width=".6"/><path d="M12 4.2 H52" stroke="#f0c68c" stroke-width=".5" opacity=".6"/>'
bl+='<path d="M27 8 V12 H37 V8" fill="none" stroke="url(#brH)" stroke-width="2.4"/><path d="M27 8 V12 H37 V8" fill="none" stroke="#5e4210" stroke-width=".4"/>'
bl+='<path d="M28.5 13.5 C 28.5 10.5 35.5 10.5 35.5 13.5" fill="none" stroke="#7a5616" stroke-width="2"/>'
bl+='<path d="M19.5 45 C 20 30 22 16.5 32 14 C 42 16.5 44 30 44.5 45 L48.5 49.5 L15.5 49.5 Z" fill="url(#brH)" stroke="#5e4210" stroke-width=".8"/>'
bl+='<path d="M20.6 24 C 26 22 38 22 43.4 24 M19.9 40 C 26 38.4 38 38.4 44.1 40 M19.7 42.4 C 26 40.8 38 40.8 44.3 42.4" stroke="#7a5616" stroke-width=".7" fill="none"/>'
bl+='<path d="M24 30 H40" stroke="#7a5616" stroke-width=".35" opacity=".8"/><text x="32" y="34.6" font-family="Georgia,serif" font-size="5" font-weight="700" text-anchor="middle" fill="#7a5616" opacity=".85" letter-spacing=".5">1720</text>'
bl+='<path d="M24.6 18.5 C 22.8 26 22.2 36 22.4 46" stroke="#fff6d0" stroke-width="1.4" fill="none" opacity=".75" stroke-linecap="round"/>'
bl+='<ellipse cx="32" cy="49.5" rx="16.5" ry="3" fill="url(#br)" stroke="#5e4210" stroke-width=".6"/><ellipse cx="32" cy="49.6" rx="13.2" ry="1.8" fill="#2a1c08"/>'
bl+='<path d="M32 49 V54" stroke="#3a2a10" stroke-width="1.2"/><circle cx="32" cy="54.6" r="2.4" fill="url(#brR)" stroke="#5e4210" stroke-width=".5"/>'
bl+='<path d="M32 57 C 31 59 33 60 32 63.5" stroke="#8a6a44" stroke-width="2.6" fill="none"/><path d="M32 57 C 31 59 33 60 32 63.5" stroke="#d8bc8a" stroke-width="1.6" fill="none" stroke-dasharray="1 .8"/>'
w('ic_bell','0 0 64 64',bl)

# ---------- key
ky='<ellipse cx="32" cy="58" rx="26" ry="2.6" fill="url(#ao)"/><g transform="translate(13 46) rotate(-34)">'
ky+='<path d="M0 -11 A11 11 0 1 1 0 11 A11 11 0 1 1 0 -11 Z M0 -6.4 A6.4 6.4 0 1 0 0 6.4 A6.4 6.4 0 1 0 0 -6.4 Z" fill="url(#br)" fill-rule="evenodd" stroke="#5e4210" stroke-width=".7"/>'
for a in (-120,0,120):
    ky+=f'<g transform="rotate({a})"><circle cx="-11.6" cy="0" r="2.4" fill="url(#brR)" stroke="#5e4210" stroke-width=".5"/></g>'
ky+='<path d="M-3.4 -3.4 C -1 -1 1 -1 3.4 -3.4 C 1 -1 1 1 3.4 3.4 C 1 1 -1 1 -3.4 3.4 C -1 1 -1 -1 -3.4 -3.4 Z" fill="url(#brR)" stroke="#5e4210" stroke-width=".5"/>'
ky+='<path d="M-8 -6 A9 9 0 0 1 4 -9" stroke="#fff6d0" stroke-width=".9" fill="none" opacity=".75"/>'
ky+='<rect x="10.5" y="-2.6" width="4" height="5.2" rx="1" fill="url(#br)" stroke="#5e4210" stroke-width=".5"/>'
ky+='<rect x="14.5" y="-1.8" width="31" height="3.6" fill="url(#br)" stroke="#5e4210" stroke-width=".5"/><rect x="18" y="-2.4" width="2" height="4.8" fill="url(#br)" stroke="#5e4210" stroke-width=".4"/>'
ky+='<path d="M15 -.8 H45" stroke="#fff6d0" stroke-width=".5" opacity=".8"/>'
ky+='<path d="M36 1.8 H46 V12 H43 V8.4 H40.6 V12 H36 Z" fill="url(#br)" stroke="#5e4210" stroke-width=".55"/>'
ky+='</g>'
w('ic_key','0 0 64 64',ky)

# ---------- swap medallion
sw='<circle cx="32" cy="32" r="29" fill="url(#brR)" stroke="#5e4210" stroke-width="1"/><circle cx="32" cy="32" r="24.5" fill="none" stroke="#7a5616" stroke-width=".8"/>'
sw+='<circle cx="32" cy="32" r="26.6" fill="none" stroke="#fff3c4" stroke-width=".6" stroke-dasharray="1.2 1.6" opacity=".7"/>'
for dy,sx in ((1,0),(0,1)):
    pass
arr='<path d="M17 27 H43 M37 21 L44 27 L37 33" fill="none" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round"/><path d="M47 39 H21 M27 33 L20 39 L27 45" fill="none" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round"/>'
sw+=f'<g stroke="#fff6d0" transform="translate(0 .8)" opacity=".7">{arr}</g><g stroke="#4a3208">{arr}</g>'
w('ic_swap','0 0 64 64',sw)

# ---------- compass (easter egg: needle not to north)
cp='<ellipse cx="32" cy="60" rx="24" ry="2.6" fill="url(#ao)"/><circle cx="32" cy="32" r="28" fill="url(#brR)" stroke="#5e4210" stroke-width="1"/><circle cx="32" cy="32" r="23" fill="url(#pap)" stroke="#7a5616" stroke-width="1"/>'
for k in range(32):
    L=3 if k%4==0 else 1.6
    cp+=f'<path d="M32 9.6 V{9.6+L}" stroke="#5a4a30" stroke-width="{.8 if k%4==0 else .45}" transform="rotate({k*11.25} 32 32)"/>'
cp+='<text x="32" y="17.6" font-family="Georgia,serif" font-size="5.4" font-weight="700" text-anchor="middle" fill="#8e2b22">N</text>'
cp+='<g transform="translate(32 32) rotate(118)"><path d="M0 -17 L3 0 L0 3 L-3 0 Z" fill="#8e2b22" stroke="#4a120c" stroke-width=".4"/><path d="M0 17 L3 0 L0 -3 L-3 0 Z" fill="#2a3a4a" stroke="#141c24" stroke-width=".4"/></g>'
cp+='<circle cx="32" cy="32" r="2" fill="url(#brR)" stroke="#5e4210" stroke-width=".4"/>'
cp+='<path d="M16 20 A20 20 0 0 1 30 12.4" stroke="#fff" stroke-width="1.6" fill="none" opacity=".55" stroke-linecap="round"/>'
w('ic_compass','0 0 64 64',cp)

# ---------- boatswain's pipe
bp='<ellipse cx="32" cy="56" rx="26" ry="2.6" fill="url(#ao)"/>'
bp+='<path d="M9 40 C 14 36 24 30 40 27" stroke="#5e4210" stroke-width="5.6" fill="none" stroke-linecap="round"/>'
bp+='<path d="M9 40 C 14 36 24 30 40 27" stroke="url(#br)" stroke-width="4" fill="none" stroke-linecap="round"/>'
bp+='<path d="M11 38.4 C 17 34.4 26 29.6 38 27.4" stroke="#fff6d0" stroke-width=".9" fill="none" opacity=".8"/>'
bp+='<path d="M14 42 C 22 44 34 44 44 40 L 46 36 C 36 39 24 39 16 38 Z" fill="url(#br)" stroke="#5e4210" stroke-width=".7"/>'
bp+='<circle cx="47" cy="29" r="9" fill="url(#brR)" stroke="#5e4210" stroke-width=".8"/>'
bp+='<ellipse cx="47.6" cy="24.6" rx="3.4" ry="1.6" fill="#3a2608"/>'
bp+='<circle cx="44" cy="26" r="2" fill="#fff8dc" opacity=".8"/>'
bp+='<circle cx="8" cy="40.6" r="2.2" fill="#3a2608"/>'
bp+='<path d="M30 42.6 C 30 48 34 51 38 50" stroke="#8a7a5a" stroke-width="1.2" fill="none" stroke-dasharray="1.6 1"/>'
bp+='<circle cx="30" cy="42.4" r="1.6" fill="none" stroke="url(#brH)" stroke-width="1.2"/>'
w('ic_pipe','0 0 64 64',bp)
