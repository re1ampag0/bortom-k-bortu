import re
def seat(t, blob, wy, refl_h, wl_frac=.85, pad=16, refl=True, alt=None):
    """Replace the <img class="bob..." src=blob ...> tag by a waterline-clipped ship + wake + reflection."""
    pat=r'([ \t]*)<img class="(bob[^"]*)" src="/_blob/'+blob+r'" alt="([^"]*)" style="([^"]*)">'
    ms=list(re.finditer(pat,t)); assert len(ms)==1,(blob,len(ms))
    m=ms[0]; ind,cls,alt_,st=m.groups()
    g=lambda k: float(re.search(k+r': (-?[\d.]+)px',st).group(1))
    L,T,W,H=g('left'),g('top'),g('width'),g('height')
    flip='scaleX(-1)' in st
    filt=re.search(r'filter: ([^;]+(?:\)[^;]*)?);?',st)
    filt=('filter: '+filt.group(1)+';') if filt else ''
    wl=round(H*wl_frac); top=wy-wl
    tr='transform: scaleX(-1); ' if flip else ''
    d=cls.replace('bob','')
    out=''
    if refl:
        sc='scale(-1, -1)' if flip else 'scaleY(-1)'
        out+=f'{ind}<div aria-hidden="true" style="position: absolute; left: {L:g}px; top: {wy}px; width: {W:g}px; height: {refl_h}px; overflow: hidden; -webkit-mask-image: linear-gradient(rgba(0,0,0,.85), rgba(0,0,0,0)); mask-image: linear-gradient(rgba(0,0,0,.85), rgba(0,0,0,0)); opacity: .22; filter: blur(1px)"><img class="bobR{d}" src="/_blob/{blob}" alt="" style="position: absolute; left: 0; top: {-(H-wl):g}px; width: {W:g}px; height: {H:g}px; transform: {sc}"></div>\n'
    out+=f'{ind}<div style="position: absolute; left: {L:g}px; top: {top-pad:g}px; width: {W:g}px; height: {wl+pad}px; overflow: hidden"><img class="{cls}" src="/_blob/{blob}" alt="{alt_}" style="position: absolute; left: 0; top: {pad}px; width: {W:g}px; height: {H:g}px; {tr}{filt}"></div>\n'
    k=W/150
    x1=W*0.13+10; x2=W*0.88+10; s=1 if flip else -1; bow=(x2+1) if flip else (x1-1); y=6
    out+=f'{ind}<svg aria-hidden="true" width="{W+20:g}" height="14" viewBox="0 0 {W+20:g} 14" style="position: absolute; left: {L-10:g}px; top: {wy-6}px; overflow: visible"><g fill="none" stroke-linecap="round"><path d="M{x1:.1f} {y} Q{(x1+x2)/2:.1f} {y+1.4*k:.1f} {x2:.1f} {y}" stroke="#e2eef4" stroke-width="{max(.8,1*k):.2f}" opacity=".55"></path><path d="M{bow:.1f} {y-.8} q{s*5*k:.1f} -.5 {s*9*k:.1f} {2*k:.1f} M{bow+s*1.6*k:.1f} {y+2*k:.1f} q{s*6*k:.1f} -.4 {s*11*k:.1f} {2.2*k:.1f}" stroke="#eef5f8" stroke-width="{max(.7,.9*k):.2f}" opacity=".6"></path></g></svg>'
    return t[:m.start()]+out+t[m.end():]
