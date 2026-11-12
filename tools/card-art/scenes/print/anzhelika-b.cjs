// «Анжелика» (Месть, ПРИКАЗ: возьмите 2 карты, передайте союзнику 1) — variant B of the method trial: a new shot.
// Two ships of one side sail close, side by side, at sunset. From the bulwark of the «Месть» the captain's daughter
// (own figure, a silhouette against the low sun: tricorn with a plume, hair in the wind, coat, sabre at the hip)
// leans out and hands a sealed letter across the gap; a sailor of the «Жемчужина» leans over his rail and takes it.
// The low sun sits in the gap right under the two hands: the one light, everything is contre-jour with warm rims,
// the letter glows. The find: the hand-over from ship to ship, in one gesture, above the glass.
'use strict';
const K = require('../kit/index.cjs');
const { f, nid, linGrad, radGrad, rng } = K;

const HZ = 114;
const SUN = { x: 112, y: 54 };
const light = { time: 'dusk', haze: .5, key: { type: 'sun', x: SUN.x, y: SUN.y, el: 26, color: '#ffc27a', power: 1 },
  fill: { color: '#5b3350', power: .35 }, rim: { az: 0, color: '#ffcf8a', power: .8 } };
const skel = { horizon: HZ, eye: 3, light: 'the low sun in the gap between the hulls (contre-jour)', items: [
  ['woman', 26, 22, 70, 112, 'deck of the Revenge, behind the bulwark'], ['letter', 124, 70, 24, 12, 'in two hands'],
  ['sailor', 146, 62, 40, 40, 'behind the rail of the Pearl'], ['pearl', 120, -40, 100, 180, 'water'],
  ['bulwark', -10, 116, 140, 34, 'deck']] };

// a silhouette lit from behind: the shape in the rim colour, the same shape in the body colour shifted away from
// the light on top of it — a thin warm edge stays on the sides that face the sun
function rimmed(u, d, body, rimCol, dx, dy, op = 1) {
  return `<path d="${d}" fill="${rimCol}" opacity="${op}"/><path d="${d}" fill="${body}" transform="translate(${dx} ${dy})"/>`;
}

module.exports = { name: 'Анжелика', variant: 'b', kind: 'deck', status: 'draft', cam: { x: 0, y: 0, w: 200 }, light, skel,
  scene: u => {
    const L = K.makeLight(light, { horizon: HZ, eye: 3 });
    const R = rng(11);
    // ——— sky, sun, clouds lit from below, the sea with the sun's path through the gap
    let bg = K.sky(u, L, { horizon: HZ, stars: false, seed: 4 }) + K.sunMoon(u, L, { r: 8 });
    bg += K.cloudBank(u, L, { y: 30, h: 10, x0: -20, x1: 100, n: 3, seed: 5, far: .35 }) + K.cloud(u, L, { x: 92, y: 84, w: 60, h: 7, seed: 8, far: .6 });
    bg += K.water(u, L, { horizon: HZ, bottom: 290, swell: .55, seed: 6, glitter: SUN.x });
    // a far third ship on the horizon at the left (the enemy line), small, in the haze
    bg += K.ship(u, L, { kind: 'endeavour', x: 30, y: HZ + 1, scale: .15, detail: 'far', flip: true, seed: 3 });
    // ——— the «Жемчужина» close alongside on the right: her stern quarter fills the right edge (true scale to the
    // people — the ship is far bigger than the frame): tarred planking, the quarter gallery with a lit window, the
    // spanker boom and the foot of a black sail coming into the top. The sun is behind her: the wall is in shadow
    // with a warm rim on the stern edge; the window's light is the second, small, warm source.
    let fg = '';
    { const wall = 'M147.4 30C147 52 149 78 154 104C156 116 158 130 160 160L212 160L212 30Z', wg = nid('pw', u), wc = nid('pc', u);
      bg += `<defs>${linGrad(wg, 148, 0, 212, 0, [[0, '#3a2a2c'], [.12, '#211719'], [.6, '#161014'], [1, '#0c0a0e']])}<clipPath id="${wc}"><path d="${wall}"/></clipPath></defs>`
        + `<path d="${wall}" fill="url(#${wg})"/>`;
      let pl = '';
      // planks following the sheer (they rise to the stern), wales darker and thicker, a few nail heads
      for (let i = 0; i < 16; i++) { const y = 26 + i * 8.6, k = i === 6 || i === 11; pl += `<path d="M146 ${f(y)}Q178 ${f(y + 9)} 214 ${f(y + 16)}" stroke="${k ? '#07050a' : '#0a080c'}" stroke-width="${k ? 3.2 : .7}" fill="none"/>` + (k ? `<path d="M146 ${f(y - 1.4)}Q178 ${f(y + 7.6)} 214 ${f(y + 14.6)}" stroke="#5a4038" stroke-width=".5" fill="none" opacity=".7"/>` : `<path d="M146 ${f(y + .8)}Q178 ${f(y + 9.8)} 214 ${f(y + 16.8)}" stroke="#4a3836" stroke-width=".35" fill="none" opacity=".45"/>`); }
      for (let i = 0; i < 18; i++) { const x = 156 + (i % 6) * 10 + (i % 2) * 3, y = 40 + Math.floor(i / 6) * 34 + (x - 150) * .3; pl += `<circle cx="${f(x)}" cy="${f(y)}" r=".45" fill="#6a5048" opacity=".6"/>`; }
      // the quarter gallery: a carved bulge with three windows, the lowest sash open and lit; carved scroll under it
      const gw = nid('gw', u);
      pl += `<defs>${radGrad(gw, 171, 70, 18, [[0, '#ffe2a0'], [.5, '#ffb050'], [1, '#a04a18']])}</defs>`
        + `<path d="M154 44Q176 38 200 46L201 92Q178 86 156 92Z" fill="#1c1216" stroke="#060406" stroke-width=".8"/>`
        + `<path d="M154 44Q176 38 200 46" stroke="#8a6a3a" stroke-width="1.2" fill="none"/><path d="M156 92Q178 86 201 92" stroke="#8a6a3a" stroke-width="1" fill="none"/>`
        + `<path d="M158 56Q176 51 196 57L196 84Q176 80 158 85Z" fill="url(#${gw})"/>`
        + [167, 177, 187].map(x => `<path d="M${x} ${f(54 + (x - 177) * .02)}V${f(83 - (x - 158) * .06)}" stroke="#2a1608" stroke-width="1.6"/>`).join('')
        + `<path d="M158 68Q176 64 196 69" stroke="#2a1608" stroke-width="1.2" fill="none"/>`
        + `<path d="M156 96Q166 106 158 116Q170 108 168 96Z" fill="#2a1a14" stroke="#7a5a32" stroke-width=".5"/>`;
      // a gun port below, its lid hauled up (red inside), the muzzle out — the Pearl is ready for a fight
      pl += `<path d="M182 108L196 110L196 121L182 119Z" fill="#050304"/><path d="M181.4 107.4L196 109.4L197.6 98.6L183 96.6Z" fill="#4a1210" stroke="#060406" stroke-width=".6"/>`
        + `<path d="M183.6 113.6Q189 112.6 194 113.8L194 117Q189 118 183.6 117Z" fill="#1a1c20"/><ellipse cx="183.8" cy="115.3" rx="1.2" ry="1.8" fill="#2e3036"/><ellipse cx="183.8" cy="115.3" rx=".6" ry="1" fill="#020202"/>`;
      // the warm rim on the stern edge facing the sun, and the window's light on the frame round it
      bg += `<g clip-path="url(#${wc})">${pl}</g>` + `<path d="M148 30C147 52 149 78 154 104C156 116 158 130 160 160" stroke="#ffc27a" stroke-width="1.1" fill="none" opacity=".85"/>`
        + `<path d="M149.6 30C148.8 52 150.6 78 155.6 104" stroke="#ffe0a8" stroke-width=".4" fill="none" opacity=".6"/>`;
      bg += K.localGlow(u, { x: 172, y: 70, color: '#ffb050', power: .5, radius: 30 }, { core: false });
      // the taffrail: a carved rail on turned balusters along the top of the stern, a warm edge to the sun
      bg += `<path d="M146 31Q178 25 214 28L214 33Q178 30 147.4 36Z" fill="#1a1014" stroke="#060406" stroke-width=".6"/><path d="M146 31Q178 25 214 28" stroke="#d09858" stroke-width=".8" fill="none"/>`
        + `<path d="M147 22Q178 16 214 19L214 22.6Q178 19.6 147.4 25.4Z" fill="#1e1418" stroke="#060406" stroke-width=".5"/><path d="M147 22Q178 16 214 19" stroke="#ffc27a" stroke-width=".7" fill="none"/>`
        + [151, 158, 165, 172, 179, 186, 193, 200, 207].map(x => { const y0 = 24.6 - (x - 147) * .06, y1 = 30.4 - (x - 147) * .05; return `<path d="M${x} ${f(y0)}Q${x - 1.3} ${f((y0 + y1) / 2)} ${x} ${f(y1)}Q${x + 1.3} ${f((y0 + y1) / 2)} ${x} ${f(y0)}" fill="#150e12" stroke="#a87a48" stroke-width=".3"/>`; }).join('');
      // the spanker boom over the stern and the foot of the black sail; its sheet rope down to the taffrail
      const sg = nid('bs', u);
      bg += `<defs>${linGrad(sg, 0, -10, 0, 22, [[0, '#0c0a0e'], [1, '#2a2226']])}</defs><path d="M120 -10L214 -10L214 10Q170 16 128 18Z" fill="url(#${sg})"/>`
        + `<path d="M128 18Q170 16 214 10" stroke="#e0a868" stroke-width=".7" fill="none" opacity=".8"/><path d="M146 4l5 -3l2 4z" fill="#ffb878" opacity=".55"/>`
        + K.shadeCyl(u, 104, 21, 214, 13, 2.2, L, 'oak', { seed: 3 }) + `<path d="M138 19L148 31" stroke="#2a1a10" stroke-width=".7"/><path d="M118 20.4L126 0M110 21L104 -10" stroke="#2a1a10" stroke-width=".55"/>`; }
    // ——— the sailor of the Pearl leaning out of the lit window, his arm down to the letter: a silhouette on the light
    const sail = 'M187 84L185 74C186 69 183 65 178 64C177 59 174 56 169 56C164 56 160.6 59.4 161 64C161.2 66 162 68 163.4 69C159 71 154 73 150.6 75.4L143 77.4L143.6 82.2L150 82.4C155 82 160 80 165 78L166 84Z';
    { const sg = nid('sl', u); fg += `<defs>${linGrad(sg, 140, 0, 184, 0, [[0, '#2a1c1c'], [.5, '#160e10'], [1, '#0e0a0e']])}</defs>` + rimmed(u, sail, `url(#${sg})`, '#ffcf8a', 1, .5); }
    fg += `<path d="M161 61.6Q166 55.4 174 56.4Q177.6 58 178 62Q170 59.6 161 61.6Z" fill="#8a1c1c"/><path d="M163 58.6Q169 56 174.6 57" stroke="#ff9a6a" stroke-width=".5" fill="none"/>`
      + rimmed(u, 'M161.4 60Q157 58.4 154 60.6Q157 61.6 160.6 62.4Z', '#8a1c1c', '#ffb070', .5, .4);
    // ——— the letter between the two hands: a roll of parchment with a ribbon and a red seal, lit through by the sun
    const lg = nid('lt', u);
    bg += ''; fg += `<defs>${linGrad(lg, 0, 72, 0, 81, [[0, '#fff0c8'], [.45, '#f0c888'], [1, '#8a5a34']])}</defs>`
      + `<path d="M124.5 72.6L145.6 77.2Q147.2 79.6 145 81.4L123.8 77.4Q122 75 124.5 72.6Z" fill="url(#${lg})" stroke="#4a2a14" stroke-width=".35"/>`
      + `<ellipse cx="124.2" cy="75" rx="1.3" ry="2.4" transform="rotate(12 124.2 75)" fill="#e0b47a" stroke="#4a2a14" stroke-width=".3"/>`
      + `<path d="M126 75.5L144 79.4" stroke="#fff6dc" stroke-width=".5" opacity=".7"/>`
      + `<path d="M134.6 75.6Q135 80 133 84.6M135.6 76Q137 80.4 136.4 85.6" stroke="#8e1e1c" stroke-width="1" fill="none" stroke-linecap="round"/>`
      + `<circle cx="135.2" cy="77.6" r="2" fill="#a01c18" stroke="#4a0806" stroke-width=".35"/><circle cx="134.6" cy="77" r=".6" fill="#ff9a7a" opacity=".8"/>`;
    // the sailor's hand over the far end of the roll (he takes it)
    fg += rimmed(u, 'M141.6 76.6Q145.4 75.2 147.6 77.4Q148.8 80.2 146.8 82.6Q143.4 83.6 141.2 82Q140.4 79.2 141.6 76.6Z', '#2a1810', '#ffc27a', .5, .35);
    // ——— the captain's daughter, contre-jour: one silhouette with a warm rim on the sun's side
    const hair = 'M58.5 36.6C50 40 44 45.6 35.4 45C39.4 48.6 43.6 49 46.4 49.8C40.2 53.6 33 54.2 26.6 52.6C32.4 57.6 41.6 59 50.6 56.6C54 58.6 57.6 60.4 61 58Z';
    const body = 'M76 37.6L77.2 42L78.4 44.2Q80.2 46.4 81.4 47.7Q80.4 48.7 78.8 48.9L79.2 50.3L78.2 51.3L79 52.5Q78.8 54.5 77.6 55.5Q75.4 57 72.8 57.2L71.6 60.4'
      + 'C74 61.4 77 62.4 80 63.4C92 65 101 67.6 110.4 70L120.4 71.4L122.4 70.2L124.6 79.6L120.4 79.4C110 78.4 100 77.8 92 77C88 76.6 85.4 76.4 84 77'
      + 'C85 84 84 90 80.6 97C79 101 80 106 83 112L88 134L44 134L50 112C52.6 106 53.4 101 52.4 96C49.6 88 46.6 78 48.4 70C50 65 54 62 60.4 60.2L59.4 54.2C55.4 49.4 55.2 43.4 57.4 38Z';
    const hat = 'M48.6 36.4Q57.6 30.6 66 32.8Q74.6 30.4 85 32.6Q87.4 35 83.8 37.2Q72.4 39.6 66 38.4Q57.8 40.4 50 39.4Q46.8 38.6 48.6 36.4ZM55.6 34Q56.6 23.6 66 22.8Q75.4 22.6 77.4 33Z';
    const plume = 'M60 27.6Q49 18.4 36.6 24.8Q42 23.6 46 25.2Q40.6 26.4 37.6 30.2Q47.6 26.2 58.6 31.4Z';
    fg += rimmed(u, hair, '#1a0c0c', '#ffb46a', 1.1, .3) + rimmed(u, plume, '#24100e', '#ffbe78', 1, .4);
    // the body: dark wine coat; a soft lift on the side to the sun so it is not a hole
    const cg = nid('cg', u);
    fg += `<defs>${linGrad(cg, 44, 0, 124, 0, [[0, '#120708'], [.55, '#2a0e12'], [1, '#4a1a18']])}</defs>` + rimmed(u, body, `url(#${cg})`, '#ffc27a', -1.1, .4);
    fg += rimmed(u, hat, '#100808', '#ffcc88', -1, .5);
    // the hat band and the coat's details catching the rim: lapel line, buttons, the cuff
    fg += `<path d="M57 34.6Q66 32.6 76.6 33.6" stroke="#5a1a16" stroke-width="1" fill="none"/>`
      + `<path d="M78.6 63Q82 72 82.4 80M74 61Q71 70 70 84" stroke="#5a2018" stroke-width=".6" fill="none" opacity=".8"/>`
      + [0, 1, 2].map(i => `<circle cx="${f(82.6 - i * .9)}" cy="${f(82 + i * 6)}" r=".8" fill="#c8964a" opacity=".8"/>`).join('')
      + `<path d="M115.6 70.6L114.2 79" stroke="#6a2a20" stroke-width="2.4"/><path d="M116.6 70.8L115.4 79" stroke="#ffc27a" stroke-width=".4" opacity=".7"/>`;
    // her gloved fist round the near end of the roll
    fg += rimmed(u, 'M121.6 71Q126.6 69.2 129.4 71.4Q131 75.2 129 79.2Q125.6 81 122.4 80.2Q120.4 75.4 121.6 71Z', '#2a1612', '#ffd090', .55, .35);
    // the sabre at her hip: brass basket and grip, the scabbard down behind the bulwark
    { const sg = nid('sb', u);
      fg += `<defs>${radGrad(sg, 74, 103, 6, [[0, '#ffd890'], [.5, '#a87a34'], [1, '#3a2410']])}</defs>`
        + `<path d="M70.4 106.6L82.6 98.2" stroke="#1a0e08" stroke-width="2.4" stroke-linecap="round"/><path d="M71 106L82.4 98.4" stroke="#6a4a2a" stroke-width=".5"/>`
        + `<path d="M66.6 108.4Q68.6 101 75.4 101.8Q76.2 107.6 70.6 110.6Q67.6 111 66.6 108.4Z" fill="url(#${sg})" stroke="#2a1606" stroke-width=".4"/>`
        + `<path d="M68 109.6L58 132" stroke="#1a0c08" stroke-width="2.8" stroke-linecap="round"/><path d="M68.8 110L59 132" stroke="#8a5a2a" stroke-width=".4" opacity=".7"/>`; }
    // ——— the near bulwark of the «Месть» across the bottom-left (cuts the figure at the waist), her deck below
    fg += K.bulwark(u, L, { x1: -10, x2: 210, y: 152, h: 34, kind: 'oak', posts: 30, seed: 4 });
    { const dc = nid('dk', u); fg += `<defs><clipPath id="${dc}"><rect x="-10" y="152" width="220" height="140"/></clipPath></defs><g clip-path="url(#${dc})">${K.deck(u, L, { horizon: HZ, top: 152, bottom: 290, vx: 70, kind: 'pine-deck', plank: 13, seed: 9 })}</g>`; }
    // a coil and a belaying rail at the bulwark (the deck is lived in), a dark floor under the glass
    fg += K.coil(u, L, { x: 34, y: 176, s: 1.3, seed: 5 }) + K.coil(u, L, { x: 96, y: 166, s: .9, seed: 8 });
    const gl = nid('gl', u);
    fg += `<defs>${linGrad(gl, 0, 150, 0, 290, [[0, '#120806', 0], [.4, '#120806', .5], [1, '#0a0404', .85]])}</defs><rect x="-10" y="150" width="220" height="140" fill="url(#${gl})"/>`;
    // ——— the sun's light round the hands and the letter: the one source, warm over everything near it
    fg += K.localGlow(u, { x: SUN.x, y: SUN.y - 4, color: '#ffc27a', power: .55, radius: 40 }, { core: false });
    void R; return [bg, fg];
  } };
