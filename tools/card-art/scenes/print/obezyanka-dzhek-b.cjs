// «Обезьянка Джек» (Жемчужина, ПРИКАЗ: возьмите случайную карту из руки противника) — variant B of the method
// trial: a new shot. Low angle up the shrouds at night: a small monkey in a red jacket (own drawing, an animal
// silhouette) scrambles up the ratlines against a huge full moon, a stolen playing card (back up, own pattern)
// held high in one paw; from below, the officer's hand with a lace cuff grabs at its tail — and misses. The moon is
// the one light: everything near it is contre-jour with cool rims; the card catches the moonlight on the dark sky.
'use strict';
const K = require('../kit/index.cjs');
const PK = require('../portrait-kit.cjs');
const { f, nid, linGrad, radGrad, rng } = K;

const HZ = 168;
const MOON = { x: 90, y: 76, r: 31 };
const light = { time: 'night', haze: .35, key: { type: 'moon', x: MOON.x, y: MOON.y, el: 34, color: '#c9dcff', power: .8 },
  fill: { color: '#3d5680', power: .4 }, rim: { az: 0, color: '#d8e8ff', power: .8 } };
const skel = { horizon: HZ, eye: 6, light: 'the full moon behind the monkey (contre-jour)', items: [
  ['monkey', 70, 36, 52, 76, 'ratlines'], ['card', 116, 18, 18, 22, 'in the paw'], ['hand', 22, 104, 50, 50, 'from the deck below'],
  ['shrouds', 20, -20, 140, 190, 'chains at the rail → masthead'], ['sail', 150, -10, 60, 130, 'yard']] };

function rimmed(d, body, rimCol, dx, dy) {
  return `<path d="${d}" fill="${rimCol}"/><path d="${d}" fill="${body}" transform="translate(${dx} ${dy})"/>`;
}

module.exports = { name: 'Обезьянка Джек', variant: 'b', kind: 'deck', status: 'draft', cam: { x: 0, y: 0, w: 200 }, light, skel,
  scene: u => {
    const L = K.makeLight(light, { horizon: HZ, eye: 6 });
    const R = rng(21);
    // ——— night sky, stars, thin clouds lit by the moon, the big moon itself
    let bg = K.sky(u, L, { horizon: HZ, stars: 60, seed: 9 }) + K.sunMoon(u, L, { r: MOON.r, seed: 3 });
    bg += K.cloud(u, L, { x: 30, y: 128, w: 70, h: 9, seed: 4, far: .4 }) + K.cloud(u, L, { x: 150, y: 140, w: 80, h: 8, seed: 12, far: .5 });
    bg += K.water(u, L, { horizon: HZ, bottom: 290, swell: .4, seed: 5, glitter: MOON.x });
    // ——— the black sail and its yard top right, the mast: the Pearl's rig, tattered, the moon on its edge
    { const sg = nid('sg', u), sd = 'M150 -12L214 -12L214 118Q196 112 184 116Q176 96 170 104Q160 70 156 74Q153 40 150 -12Z';
      bg += `<defs>${linGrad(sg, 150, 0, 214, 0, [[0, '#1c2230'], [.3, '#10141c'], [1, '#07090e']])}</defs><path d="${sd}" fill="url(#${sg})"/>`
        + `<path d="M150 -12Q153 40 156 74Q160 70 170 104Q176 96 184 116Q196 112 214 118" stroke="#a8c4e8" stroke-width=".8" fill="none" opacity=".8"/>`
        + `<path d="M176 30q4 8 1 14q-5 -5 -1 -14zM196 70q5 6 2 12q-5 -4 -2 -12z" fill="#2a3a58" opacity=".9"/>`
        + [10, 34, 58, 82].map(y => `<path d="M${f(151 + y * .05)} ${y}Q182 ${y + 6} 214 ${y + 3}" stroke="#05070a" stroke-width=".7" fill="none" opacity=".7"/>`).join('');
      bg += K.shadeCyl(u, 172, -12, 174, 300, 4.2, L, 'oak', { seed: 5, rim: true }); }
    // ——— the shrouds: from the chains at the rail (bottom left) up to the masthead (off the top right), ratlines
    const top = [168, -40], feet = [[4, 196], [30, 200], [56, 204], [82, 208]];
    const at = (i, t) => [feet[i][0] + (top[0] - feet[i][0]) * t, feet[i][1] + (top[1] - feet[i][1]) * t];
    let rig = '';
    for (let k = 0; k < 22; k++) { const t = .04 + k * .043; for (let i = 0; i < 3; i++) { const a = at(i, t), b = at(i + 1, t), sag = 1.2; rig += `<path d="M${f(a[0])} ${f(a[1])}Q${f((a[0] + b[0]) / 2)} ${f((a[1] + b[1]) / 2 + sag)} ${f(b[0])} ${f(b[1])}" stroke="#0a0c12" stroke-width=".9" fill="none"/><path d="M${f(a[0])} ${f(a[1] - .5)}Q${f((a[0] + b[0]) / 2)} ${f((a[1] + b[1]) / 2 + sag - .5)} ${f(b[0])} ${f(b[1] - .5)}" stroke="#7a90b0" stroke-width=".3" fill="none" opacity=".55"/>`; } }
    for (let i = 0; i < 4; i++) { const a = at(i, 0), b = at(i, 1); rig += `<path d="M${f(a[0])} ${f(a[1])}L${f(b[0])} ${f(b[1])}" stroke="#05060a" stroke-width="2.1"/><path d="M${f(a[0] + .8)} ${f(a[1])}L${f(b[0] + .5)} ${f(b[1])}" stroke="#9ab4d8" stroke-width=".45" opacity=".6"/>`; }
    bg += rig;
    // ——— the officer's hand from below: navy sleeve, lace cuff, fingers spread, grabbing at the tail — too late
    const hg = nid('hs', u);
    let fg = `<defs><linearGradient id="${hg}" x1="1" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#b8a0a0"/><stop offset=".35" stop-color="#6a5050"/><stop offset="1" stop-color="#2a1c20"/></linearGradient></defs>`
      + PK.arm(u, 6, 198, 54, 128, { w0: 22, w1: 12, cloth: '#1c2848', dark: '#070a14', light: '#3a5080', cuff: 'lace', pose: 'open', side: -1, s: 1.9, twist: -20, skin: `url(#${hg})` });
    fg += `<path d="M20 186L44 146" stroke="#c9a048" stroke-width="1.4" opacity=".8"/>` + [0, 1, 2].map(i => `<circle cx="${f(26 + i * 6)}" cy="${f(178 - i * 10)}" r="1.2" fill="#d8b058"/>`).join('');
    // ——— the monkey: one silhouette on the moon, rim-lit; red jacket, a long curled tail
    const body = 'M96.6 52.6C93 50 87.4 50.4 85 54.6C82.2 54.4 80 56.8 81.2 59.6C82.4 61.8 84.4 62 85.6 61.4C86.4 63.6 88 65.4 90 66.4'
      + 'C86 68 83 70 80.4 72.6L72 70.4L70.6 74L80 78.6C82 80.6 84.4 81 86.6 80.4C85.8 84.6 86.2 88.6 87.6 92'
      + 'C83 95 79.6 98.6 77.6 103.6L71.6 105L72.6 108.4L80.6 107.4C84 104.6 88 100.4 91.6 97.2C94 98.6 96.6 99 98.8 98.6'
      + 'C100.4 102 101.2 106 100.4 110.4L95.6 113L97.6 115.6L104 113.6C106 108.6 106.8 102.6 105.4 96.6C107.6 93.6 108.6 89.4 108 85'
      + 'C109.4 80.4 109 75 107.6 71C110.6 66 113.8 58 116.4 50L121.2 44.4L118 41.8L112.6 47.6C108.6 54.6 105.4 60.6 103.4 64.4'
      + 'C101.6 62.6 100 61.8 99 61.2C101 59 101.2 55.6 99.8 54C102.6 53.6 104 51 102.8 48.6C101.6 46.6 99 46.6 97.6 48.2Z';
    const tail = 'M88.6 92.4C80 98 72 104 66 112C60 120 62 130 70 132C76 133 80 128 77 123C75 120 71 121 71.4 124.4C70 122 70.6 119 73.4 118.4C79 117.6 82.6 123 80.4 129C77.6 136 66.4 136.6 61.8 129.6C56.4 121.6 61.6 110 70 103C76 98 82 94 86.6 90.8Z';
    let mk = rimmed(tail, '#1a1012', '#c8dcff', -.7, .9) + rimmed(body, '#1e1214', '#d8e8ff', -.8, 1);
    // the red jacket over the torso: a deep red, warm buttons; brass on the cuff catches the moon
    { const jg = nid('jk', u), jd = 'M90 66Q96 62.6 103 64L109.6 54.4L113.2 57.6L107.6 70C108.2 76 108.4 84 106 92L104.4 96.4Q97 99.4 91 96.6L84.4 104.6L81.8 99.4C85.6 94 86.2 88 86.6 82.4L80.8 79.8L81.4 74.4L87.6 70.2Z';
      mk += `<defs>${linGrad(jg, 112, 56, 84, 98, [[0, '#9a2a26'], [.35, '#6a1418'], [1, '#2a070a']])}</defs><path d="${jd}" fill="url(#${jg})" stroke="#1a0406" stroke-width=".4"/>`
        + `<path d="M103 64L109.6 54.4L113.2 57.6L107.6 70C108.2 76 108.4 84 106 92" stroke="#e8f0ff" stroke-width=".6" fill="none" opacity=".75"/>`
        + `<path d="M108.6 57.6L112 60.4M86 71.4L82 76" stroke="#e0b050" stroke-width="1.2"/>`
        + `<path d="M97.6 65.6L96.4 96.6" stroke="#e0b050" stroke-width=".7" opacity=".8"/>` + [73, 80, 87].map(y => `<circle cx="${f(97.4 - (y - 73) * .04)}" cy="${y}" r=".85" fill="#f0c860"/>`).join('')
        + `<path d="M93.4 65.2Q96.6 70 98.4 65.2Q97 69.6 95.6 70.6Q94 69 93.4 65.2Z" fill="#e8e4dc"/>`
        + `<path d="M91 96.6L84.4 104.6M95 97.4L89.6 104" stroke="#2a070a" stroke-width=".6" opacity=".8"/>`; }
    // the face turned to us, a little light from the sky on it: muzzle, eyes catching the moon
    { const fgr = nid('fc', u);
      mk += `<defs>${radGrad(fgr, 92, 57, 8, [[0, '#9a7a60'], [1, '#3a2418']])}</defs><ellipse cx="90.6" cy="58.4" rx="5.8" ry="5" fill="url(#${fgr})"/>`
        + `<circle cx="88.6" cy="56.8" r=".85" fill="#0a0604"/><circle cx="92.6" cy="56.6" r=".85" fill="#0a0604"/><circle cx="88.9" cy="56.5" r=".3" fill="#eaf2ff"/><circle cx="92.9" cy="56.3" r=".3" fill="#eaf2ff"/>`
        + `<path d="M88.4 61q2.2 1.4 4.4 0" stroke="#1a0c06" stroke-width=".5" fill="none"/><ellipse cx="90.6" cy="59.6" rx="1.4" ry=".7" fill="#2a1a10"/>`; }
    fg += `<g transform="translate(95 85) scale(1.22) translate(-95 -80)">${mk}</g>`;
    // ——— the stolen card, high in the paw: an own back pattern, lit by the moon (cool edge to the moon side)
    fg += PK.cardBack(u, 130, 31, 22, 1.2, 1, '#6a1a1c', '#efe2c0');
    fg += `<g transform="translate(95 85) scale(1.22) translate(-95 -80)">` + rimmed('M117.4 46.6C116.6 44 118 41.6 120.6 41.2C122.8 41 124.2 43 123.4 45.2C122.6 47.4 119.2 48.6 117.4 46.6Z', '#24161a', '#d8e8ff', -.5, .5) + '</g>';
    // ——— the deck rail at the bottom, a lantern on the rail post (dim, far from the action), dark under the glass
    fg += K.bulwark(u, L, { x1: -10, x2: 210, y: 236, h: 40, kind: 'oak', posts: 30, seed: 6 });
    const gl = nid('gl', u);
    fg += `<defs>${linGrad(gl, 0, 170, 0, 290, [[0, '#060810', 0], [.5, '#060810', .45], [1, '#04050a', .8]])}</defs><rect x="-10" y="170" width="220" height="120" fill="url(#${gl})"/>`;
    return [bg, fg];
  } };
