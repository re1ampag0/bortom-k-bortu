// Scene helpers, fourth pass: ships sit in the water, contact shadows, supports for hanging things.
const { img } = require('./art3.cjs'); const { woodTex, stoneTex } = require('./bg4.cjs');
const SHIPS = new Set(['pearl', 'revenge', 'endeavour', 'dutch']);
let n = 0;
// a ship on the water: reflection, dark contact band, foam along the waterline, bow and stern wash
function afloat(k, x, y, s, r, u, o = {}) {
  const w = 64 * s, wl = y + .232 * w, hw = w * .34, id = 'af' + u + (n++);
  const im = img(k, x, y, s, r, u);
  const refl = `<clipPath id="${id}"><rect x="${x - w / 2}" y="${wl}" width="${w}" height="${w / 2}"/></clipPath><filter id="${id}b" x="-10%" y="-10%" width="120%" height="120%"><feGaussianBlur stdDeviation=".4 1.2"/></filter>
    <g clip-path="url(#${id})" opacity="${o.night ? .16 : .22}" filter="url(#${id}b)"><g transform="translate(0 ${2 * wl}) scale(1 -1)">${img(k, x, y, s, -r, u).replace(/filter="url\(#drop[^)]*\)"/, '')}</g></g>`;
  const foam = `<ellipse cx="${x}" cy="${wl + .4}" rx="${hw}" ry="${(w * .022).toFixed(2)}" fill="#04121a" opacity=".38"/>
    <path d="M${x - hw} ${wl}q${hw * .5} ${1.3} ${hw} 0t${hw} 0" stroke="#f4fcff" stroke-width="${(w * .009 + .3).toFixed(2)}" fill="none" opacity="${o.night ? .5 : .8}"/>
    <path d="M${x + hw - 1} ${wl - .4}q${w * .06} ${-w * .02} ${w * .12} ${w * .008}M${x + hw} ${wl + 1}q${w * .08} ${-w * .005} ${w * .16} ${w * .012}M${x - hw + 1} ${wl - .2}q${-w * .07} ${-w * .012} ${-w * .14} ${w * .01}M${x - hw} ${wl + 1.2}q${-w * .1} ${0} ${-w * .2} ${w * .016}" stroke="#ffffff" stroke-width="${(w * .007 + .25).toFixed(2)}" fill="none" opacity="${o.night ? .4 : .7}"/>`;
  return refl + im + foam;
}
const shadow = (u, x, y, rx, op = .45, ry) => `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry || rx * .2}" fill="#120a04" opacity="${op}" filter="url(#soft${u})"/>`;
// wooden belfry under a hanging bell image (bell art includes its yoke beam)
function belfry(u, x, y, s, floor = 112) {
  const w = 64 * s, top = y - .47 * w, dx = .33 * w;
  return `${shadow(u, x, floor + 1, dx + 10, .5)}${[-1, 1].map(sg => `<rect x="${x + sg * dx - 2.6}" y="${top - 2}" width="5.2" height="${floor - top + 2}" fill="url(#oakH${u})" stroke="#2a1608" stroke-width=".5"/>
    <path d="M${x + sg * dx} ${floor - 2}l${sg * 10} 0 0 -2 ${-sg * 10} -14z" fill="url(#oak${u})" stroke="#2a1608" stroke-width=".4"/><rect x="${x + sg * dx - 4}" y="${floor - 3}" width="8" height="3" fill="#2a1608"/>`).join('')}
    <rect x="${x - dx - 5}" y="${top - 5}" width="${2 * dx + 10}" height="5" rx="1" fill="url(#oak${u})" stroke="#2a1608" stroke-width=".5"/>${[-1, 1].map(sg => `<circle cx="${x + sg * dx}" cy="${top - 2.5}" r="1.2" fill="url(#iron${u})"/>`).join('')}`;
}
module.exports = { SHIPS, afloat, shadow, belfry, woodTex, stoneTex };
