// tools/card-art/scenes/backs4/sea.cjs — the full-bleed back of the sea deck (user's plan 12.11, п. 14). The concept of
// the earlier sea backs (tools/print/cards.ts seaBackSvg, backs.cjs SCENES1.sea): the open sea without the decks' ships,
// the weather and the compass rose. Here: a heavy sky after a squall, the sun breaking through a gap in the clouds and
// throwing rays down onto the sea, lit patches on the water under them; a rain curtain still hanging far on the left; a
// far brig on the horizon for scale; long swells with foam on their crests; gulls in the light. The compass rose — no
// letters — is drawn as a faint gilt ghost in the sky round the sun, its points running along the rays.
// One light: the sun in the gap. Contract — that of backs.cjs (see its head): the title on the dark cloud at the top,
// the crest and the name on the darkened near water.
'use strict';
const K = require('../kit/index.cjs');
const { nid, f } = K;

const W = 200, H = 280, B = 10;
const HZ = 160;
const PLACES = { title: { y: 30 }, crest: { y: 214, d: 36 }, letter: null, name: { y: 248 } };
const SUN = { x: 112, y: 96 };

/** One near swell seen from the side (copied from backs.cjs swellCrest, KIT-CANDIDATE there). */
function swellCrest(u, L, o) {
  const x = o.x, y = o.y, w = o.w, h = o.h, R = K.rng(o.seed || 1), lean = o.lean || .2, P = L.pal, fm = o.foam != null ? o.foam : 1;
  const x0 = x - w / 2, x1 = x + w / 2, px = x + lean * w * .18, py = y - h, th = h * 1.3;
  const sea = P.sea, top = K.mix(sea[0], P.sky[3], .35), face = K.mix(sea[1], sea[2], .35), deep = K.mix(sea[2], L.shadowTint, .25), glow = K.mix(sea[0], '#bfeee0', .45);
  const foam = K.mix('#f6fcff', L.keyColor, .3), g = nid('wv', u), gw = nid('wq', u), bl = nid('wl', u), mk = nid('wm', u), mg = nid('wn', u);
  const ridge = `M${f(x0)} ${f(y)}C${f(x0 + w * .25)} ${f(y - h * .15)} ${f(px - w * .2)} ${f(py)} ${f(px)} ${f(py)}C${f(px + w * .1)} ${f(py)} ${f(px + w * .16)} ${f(y - h * .45)} ${f(x1)} ${f(y + h * .25)}`;
  const body = ridge + `L${f(x1)} ${f(y + th)}C${f(x + w * .2)} ${f(y + th * 1.15)} ${f(x - w * .2)} ${f(y + th * .85)} ${f(x0)} ${f(y + th)}Z`;
  let out = `<defs><linearGradient id="${g}" gradientUnits="userSpaceOnUse" x1="0" y1="${f(py)}" x2="0" y2="${f(y + th)}"><stop offset="0" stop-color="${top}" stop-opacity=".95"/><stop offset=".35" stop-color="${face}" stop-opacity=".9"/><stop offset=".75" stop-color="${deep}" stop-opacity=".55"/><stop offset="1" stop-color="${deep}" stop-opacity="0"/></linearGradient>`
    + `<radialGradient id="${gw}" gradientUnits="userSpaceOnUse" cx="${f(px + w * .05)}" cy="${f(py + h * .45)}" r="${f(w * .22)}"><stop offset="0" stop-color="${glow}" stop-opacity=".55"/><stop offset="1" stop-color="${glow}" stop-opacity="0"/></radialGradient>`
    + `<filter id="${bl}" x="-20%" y="-50%" width="140%" height="200%"><feGaussianBlur stdDeviation=".35"/></filter>`
    + `<linearGradient id="${mg}" gradientUnits="userSpaceOnUse" x1="${f(x0)}" y1="0" x2="${f(x1)}" y2="0"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset=".22" stop-color="#fff"/><stop offset=".72" stop-color="#fff"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>`
    + `<mask id="${mk}" maskUnits="userSpaceOnUse" x="${f(x0 - 2)}" y="${f(py - 6)}" width="${f(w + 4)}" height="${f(h + th + 12)}"><rect x="${f(x0 - 2)}" y="${f(py - 6)}" width="${f(w + 4)}" height="${f(h + th + 12)}" fill="url(#${mg})"/></mask></defs><g mask="url(#${mk})">`;
  out += `<path d="${body}" fill="url(#${g})"/><path d="${body}" fill="url(#${gw})"/>`;
  out += `<path d="${ridge}" fill="none" stroke="${K.mix(top, '#ffffff', .4)}" stroke-width=".7" opacity=".7" stroke-linecap="round"/>`;
  let lace = '';
  for (let i = 0, n = Math.round(46 * fm); i < n; i++) {
    const t = R(), xx = x0 + w * (.25 + t * .6), near = 1 - Math.min(1, Math.abs(xx - px) / (w * .32)), yy = py + (1 - near) * h * .55 + (R() - .3) * 1.6, r = (.35 + R() * .9) * (.5 + near) * (.4 + .6 * fm);
    if (near <= 0) continue;
    lace += `<ellipse cx="${f(xx)}" cy="${f(yy)}" rx="${f(r * (1.3 + R()))}" ry="${f(r * .6)}" opacity="${f(.45 + R() * .5)}"/>`;
  }
  for (let i = 0, n = Math.round(7 * fm); i < n; i++) { const sx = px - w * (.05 + R() * .3), sy = py + h * (.25 + R() * .5), l = w * (.08 + R() * .14); lace += `<path d="M${f(sx)} ${f(sy)}q${f(-l / 2)} ${f(h * .12)} ${f(-l)} ${f(h * .28)}" stroke="${foam}" stroke-width="${f(.3 + R() * .35)}" fill="none" opacity="${f(.35 + R() * .3)}"/>`; }
  return out + `<g fill="${foam}" filter="url(#${bl})">${lace}</g></g>`;
}

/** The compass rose without letters: 16 points (4 long, 4 middle, 8 short), each split into a lit and a shaded half, two
 *  thin rings; gilt, faint, laid by screen over the sky round the sun. */
function rose(u, cx, cy, r) {
  const g = nid('rg', u), m = nid('rm', u), pt = (a, d) => [cx + Math.cos(a) * d, cy + Math.sin(a) * d];
  let s = '';
  for (let i = 0; i < 16; i++) {
    const a = -Math.PI / 2 + i * Math.PI / 8, L = i % 4 === 0 ? r : i % 2 === 0 ? r * .7 : r * .46, hw = i % 4 === 0 ? .17 : i % 2 === 0 ? .2 : .24, base = L * hw;
    const tip = pt(a, L), l = pt(a - Math.PI / 2, base * .9), rr = pt(a + Math.PI / 2, base * .9), c = [cx, cy];
    s += `<path d="M${f(c[0])} ${f(c[1])}L${f(l[0])} ${f(l[1])}L${f(tip[0])} ${f(tip[1])}Z" fill="#ffe7a8" opacity="${i % 4 === 0 ? .9 : .7}"/>`
      + `<path d="M${f(c[0])} ${f(c[1])}L${f(rr[0])} ${f(rr[1])}L${f(tip[0])} ${f(tip[1])}Z" fill="#c8963c" opacity="${i % 4 === 0 ? .7 : .5}"/>`;
  }
  s += `<circle cx="${cx}" cy="${cy}" r="${f(r * .56)}" fill="none" stroke="#ffe7a8" stroke-width=".5"/><circle cx="${cx}" cy="${cy}" r="${f(r * .6)}" fill="none" stroke="#ffe7a8" stroke-width=".25" stroke-dasharray="1 1.6"/>`;
  // the rose fades out towards its tips: it is a ghost in the air, not a drawing on top
  return `<defs><radialGradient id="${g}" gradientUnits="userSpaceOnUse" cx="${cx}" cy="${cy}" r="${r}"><stop offset="0" stop-color="#fff" stop-opacity=".2"/><stop offset=".3" stop-color="#fff" stop-opacity="1"/><stop offset=".7" stop-color="#fff" stop-opacity=".6"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient>`
    + `<mask id="${m}" maskUnits="userSpaceOnUse" x="${cx - r}" y="${cy - r}" width="${2 * r}" height="${2 * r}"><rect x="${cx - r}" y="${cy - r}" width="${2 * r}" height="${2 * r}" fill="url(#${g})"/></mask></defs>`
    + `<g mask="url(#${m})" opacity=".3" style="mix-blend-mode:screen">${s}</g>`;
}

function sea() {
  const u = 'bs' + (sea.n = (sea.n || 0) + 1);
  const base = K.LIGHTS.sea;
  const light = Object.assign({}, base, { haze: .4, key: { type: 'sun', color: '#fff0c8', power: .95, x: SUN.x, y: SUN.y }, fill: { color: '#4f7f94', power: .5 }, rim: { az: 0, color: '#fff4d6', power: .6 } });
  const L = K.makeLight(light, { horizon: HZ });
  // a stormy afternoon: slate-teal sky, the sea of the deck's colour
  L.pal = Object.assign({}, L.pal, { sky: ['#1c3644', '#36606e', '#7fa6aa', '#d8d8bc'], sea: ['#6a9ea2', '#1f5664', '#0b2832'], cloudLit: '#fff4dc', cloudShade: '#3c5866' });
  let s = K.sky(u, L, { horizon: HZ, stars: false, seed: 16 });
  // the heavy overcast at the top: a dark soft lid over the sky (the title sits on it)
  { const g = nid('ov', u); s += `<defs><linearGradient id="${g}" gradientUnits="userSpaceOnUse" x1="0" y1="-14" x2="0" y2="100"><stop offset="0" stop-color="#0e222c" stop-opacity=".92"/><stop offset=".45" stop-color="#16303c" stop-opacity=".6"/><stop offset="1" stop-color="#1c3a46" stop-opacity="0"/></linearGradient></defs><rect x="-20" y="-20" width="240" height="130" fill="url(#${g})"/>`; }
  s += rose(u, SUN.x, SUN.y, 50);
  s += K.sunMoon(u, L, { r: 6.5 });
  // the clouds round the gap: lit at the edges turned to the sun, dark bodies
  s += K.cloud(u, L, { x: 42, y: 88, w: 104, h: 30, seed: 61, far: .15 });
  s += K.cloud(u, L, { x: 176, y: 80, w: 92, h: 26, seed: 63, far: .2 });
  s += K.cloud(u, L, { x: 150, y: 120, w: 70, h: 14, seed: 64, far: .45 });
  s += K.cloud(u, L, { x: 60, y: 126, w: 80, h: 16, seed: 65, far: .5 });
  // the rain curtain far on the left: soft slanting streaks from under the cloud to the horizon
  { const rg = nid('rn', u), bl = nid('rb', u), R = K.rng(7); let st = '';
    for (let i = 0; i < 26; i++) { const x = -8 + R() * 64, w = 1 + R() * 3.5; st += `<path d="M${f(x)} 112L${f(x + w)} 112L${f(x + w - 7)} ${HZ}L${f(x - 7)} ${HZ}Z" opacity="${f(.25 + R() * .5)}"/>`; }
    s += `<defs><linearGradient id="${rg}" gradientUnits="userSpaceOnUse" x1="0" y1="112" x2="0" y2="${HZ}"><stop offset="0" stop-color="#4a6670" stop-opacity="0"/><stop offset=".3" stop-color="#4a6670" stop-opacity=".55"/><stop offset="1" stop-color="#5c7a82" stop-opacity=".7"/></linearGradient><filter id="${bl}" filterUnits="userSpaceOnUse" x="-30" y="100" width="120" height="${HZ - 90}"><feGaussianBlur stdDeviation="1.6"/></filter></defs><g fill="url(#${rg})" filter="url(#${bl})">${st}</g>`; }
  s += K.cloudBank(u, L, { y: HZ - 1, h: 7, x0: -30, x1: 230, n: 7, seed: 66, far: .75 });
  // rays from the gap down onto the sea (screen, soft)
  { const rg = nid('ry', u), bl = nid('rb', u), R = K.rng(11); let rays = '';
    for (let i = 0; i < 8; i++) { const a = 58 + i * 9.5 + (R() - .5) * 4, sp = 1.4 + R() * 2.4, len = 230, p = d => [SUN.x + Math.cos((a + d) * Math.PI / 180) * len, SUN.y + Math.sin((a + d) * Math.PI / 180) * len];
      const [ax, ay] = p(-sp), [bx, by] = p(sp); rays += `<path d="M${SUN.x} ${SUN.y}L${f(ax)} ${f(ay)}L${f(bx)} ${f(by)}Z" opacity="${f(.4 + R() * .6)}"/>`; }
    s += `<defs><linearGradient id="${rg}" gradientUnits="userSpaceOnUse" x1="0" y1="${SUN.y}" x2="0" y2="${HZ + 40}"><stop offset="0" stop-color="#fff2cc" stop-opacity=".4"/><stop offset=".7" stop-color="#fff2cc" stop-opacity=".16"/><stop offset="1" stop-color="#fff2cc" stop-opacity="0"/></linearGradient>`
      + `<filter id="${bl}" filterUnits="userSpaceOnUse" x="-60" y="60" width="320" height="200"><feGaussianBlur stdDeviation="2.4"/></filter></defs><g fill="url(#${rg})" filter="url(#${bl})" style="mix-blend-mode:screen">${rays}</g>`; }
  s += K.water(u, L, { horizon: HZ, bottom: 300, swell: .95, seed: 9, glitter: SUN.x });
  // lit patches on the water where the rays touch it
  for (const [x, y, r, p] of [[96, HZ + 6, 34, .35], [138, HZ + 12, 26, .25], [70, HZ + 16, 22, .18]]) s += K.localGlow(u, { x, y, color: '#fff0c8', power: p, radius: r }, { squash: .18, core: false });
  // a far brig on the horizon, grey in the haze, for scale (not a ship of the decks)
  s += K.ship(u, L, { kind: 'brig', x: 160, y: HZ + .8, scale: .26, detail: 'far', flip: true, sails: 'full' });
  // gulls in the light
  for (const [x, y, k] of [[84, 128, 1.3], [96, 136, .9], [146, 104, .8]]) s += `<path d="M${x - 3 * k} ${y}q${1.5 * k} ${-1.6 * k} ${3 * k} ${.1 * k}q${1.5 * k} ${-1.7 * k} ${3 * k} ${-.1 * k}q${-1.5 * k} ${.5 * k} ${-3 * k} ${.9 * k}q${-1.5 * k} ${-.4 * k} ${-3 * k} ${-.9 * k}z" fill="#1c2e36" opacity=".85"/>`;
  // long swells with foam on the crests, at the sides (the middle stays calm for the crest and the name)
  s += swellCrest(u, L, { x: 34, y: 186, w: 60, h: 3.4, seed: 3, lean: .3, foam: .7 }) + swellCrest(u, L, { x: 168, y: 196, w: 54, h: 3, seed: 4, lean: .25, foam: .6 })
    + swellCrest(u, L, { x: 132, y: 176, w: 40, h: 2, seed: 5, lean: .2, foam: .4 });
  // the near water goes dark under the crest and the name
  { const gw = nid('gw', u); s += `<defs><linearGradient id="${gw}" gradientUnits="userSpaceOnUse" x1="0" y1="200" x2="0" y2="240"><stop offset="0" stop-color="#06161c" stop-opacity="0"/><stop offset="1" stop-color="#06161c" stop-opacity=".6"/></linearGradient></defs><rect x="-20" y="200" width="240" height="110" fill="url(#${gw})"/>`; }
  s += swellCrest(u, L, { x: 18, y: 262, w: 70, h: 4.5, seed: 8, lean: .3, foam: .5 }) + swellCrest(u, L, { x: 190, y: 270, w: 64, h: 4, seed: 9, lean: .2, foam: .45 });
  const g = nid('vg', u);
  s += `<defs><radialGradient id="${g}" gradientUnits="userSpaceOnUse" cx="${SUN.x}" cy="130" r="210"><stop offset=".5" stop-color="#04121a" stop-opacity="0"/><stop offset="1" stop-color="#04121a" stop-opacity=".45"/></radialGradient></defs><rect x="-10" y="-10" width="220" height="300" fill="url(#${g})"/>`;
  const body = `<g transform="translate(100 140) scale(1.1) translate(-100 -140)">${s}</g>`;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${-B} ${-B} ${W + 2 * B} ${H + 2 * B}" width="100%" height="100%">${body}</svg>`;
  return Object.assign({ svg, ground: '#16404e', tone: 'dark', bleed: B }, JSON.parse(JSON.stringify(PLACES)));
}

module.exports = { draw: () => sea() };
