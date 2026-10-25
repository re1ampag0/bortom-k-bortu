def bunting(W, H=26, spans=4, cls=''):
    cols=['#b3281e','#f4efe0','#1f4f86','#e8b830','#2c6658']
    s=f'<svg aria-hidden="true" class="{cls}" width="{W}" height="{H}" viewBox="0 0 {W} {H}" style="position: absolute; left: 0; top: 0">'
    seg=W/spans; k=0
    for i in range(spans):
        x0=i*seg; x1=x0+seg; sag=12
        s+=f'<path d="M{x0:.1f} 2 Q {x0+seg/2:.1f} {2+2*sag} {x1:.1f} 2" stroke="#8a6a44" stroke-width="1.2" fill="none"></path>'
        n=int(seg//28)
        for j in range(1,n):
            tt=j/n; x=(1-tt)**2*x0+2*(1-tt)*tt*(x0+seg/2)+tt*tt*x1; y=(1-tt)**2*2+2*(1-tt)*tt*(2+2*sag)+tt*tt*2
            c=cols[k%5]; k+=1
            s+=f'<path d="M{x-5:.1f} {y:.1f} L{x+5:.1f} {y:.1f} L{x:.1f} {y+10:.1f} Z" fill="{c}" opacity=".85"></path><path d="M{x-5:.1f} {y:.1f} L{x:.1f} {y+10:.1f}" stroke="#000" stroke-opacity=".2" stroke-width="1"></path>'
        s+=f'<circle cx="{x1:.1f}" cy="2" r="2.4" fill="#c9a048"></circle>'
    return s+'</svg>'
