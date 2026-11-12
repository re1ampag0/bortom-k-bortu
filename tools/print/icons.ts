// The card icons of the approved mock-up (docs/mockups/print/Icons2.html): type medal, Powder coin, Soul flask.
// Their CSS has blurred shadows and conic gradients, which Chromium would rasterise into every copy in the PDF, so
// each icon is rasterised once to a PNG (about 700 dpi on the card) and placed as a picture (review-print 10).
import { dataUri, read, setFlaskInline, type Ctx } from './kit';
import { TYPE, SEA, type CardType } from './colors';

/** One mock-up pixel in millimetres (300 px = 63 mm). */
export const PX = 0.21;
/** The icon pictures: box in mock-up px and where the icon itself (44 px wide) starts inside the box. */
export const BOX = { medal: { w: 56, h: 58, ox: 6, oy: 5 }, flask: { w: 54, h: 66, ox: 5, oy: 5, iw: 44, ih: 54 } };

const MEDAL_CSS = `.m2{position:relative;display:block;width:44px;height:44px;border-radius:50%;flex:none;
  background:radial-gradient(circle at 50% 50%,rgba(0,0,0,0) 17.4px,rgba(255,240,190,.9) 17.9px,rgba(0,0,0,0) 18.8px),
    radial-gradient(circle at 50% 3px,#fff3c8 1.3px,#7a5616 1.9px,rgba(0,0,0,0) 2.2px),radial-gradient(circle at 50% 41px,#fff3c8 1.3px,#7a5616 1.9px,rgba(0,0,0,0) 2.2px),
    radial-gradient(circle at 3px 50%,#fff3c8 1.3px,#7a5616 1.9px,rgba(0,0,0,0) 2.2px),radial-gradient(circle at 41px 50%,#fff3c8 1.3px,#7a5616 1.9px,rgba(0,0,0,0) 2.2px),
    linear-gradient(155deg,var(--tl) 0%,var(--t) 42%,var(--td) 100%);
  box-shadow:0 0 0 1.6px #e2b75c,0 0 0 3px #3a220e,0 3px 6px rgba(0,0,0,.6),inset 0 1px 1px rgba(255,255,255,.55),inset 0 -1px 2px rgba(0,0,0,.35)}
.m2::before{content:'';position:absolute;inset:4.5px;border-radius:50%;
  background:repeating-radial-gradient(circle at 50% 50%,rgba(120,85,30,0) 0 2.2px,rgba(120,85,30,.045) 2.2px 2.8px),radial-gradient(circle at 40% 32%,#fffaf0,#f1e3c0 58%,#cdb383);
  box-shadow:inset 0 2px 3px rgba(70,45,10,.45),inset 0 -1px 1px rgba(255,255,255,.8),0 0 0 .8px rgba(58,34,14,.7)}
.m2 img{position:absolute;left:5.5px;top:5.5px;width:33px;height:33px;z-index:1;filter:drop-shadow(0 1px 1px rgba(0,0,0,.45))}
.m2::after{content:'';position:absolute;inset:4.5px;border-radius:50%;z-index:2;pointer-events:none;
  background:radial-gradient(ellipse 70% 45% at 36% 18%,rgba(255,255,255,.55),rgba(255,255,255,0) 70%)}
.p2{position:relative;display:block;width:44px;height:44px;border-radius:50%;flex:none;
  background:repeating-conic-gradient(rgba(255,255,255,.16) 0 5deg,rgba(0,0,0,.25) 5deg 10deg),radial-gradient(circle at 35% 28%,#7a8186,#33383b 48%,#0d0f10);
  box-shadow:0 0 0 1.6px #e2b75c,0 0 0 3px #3a220e,0 3px 6px rgba(0,0,0,.6),inset 0 1px 1px rgba(255,255,255,.35)}
.p2::before{content:'';position:absolute;inset:3.5px;border-radius:50%;
  background:radial-gradient(circle,rgba(255,255,255,.05) .6px,rgba(0,0,0,0) .9px) 0 0/3px 3px,radial-gradient(circle at 36% 28%,#5d6468,#23272a 52%,#0b0c0d);
  box-shadow:inset 0 2px 3px rgba(0,0,0,.65),inset 0 -1px 1px rgba(255,255,255,.18),0 0 0 .8px rgba(0,0,0,.6)}
.p2::after{content:'';position:absolute;inset:7px;border-radius:50%;box-shadow:0 0 0 .8px rgba(226,183,92,.55);
  background:radial-gradient(ellipse 70% 40% at 38% 16%,rgba(255,255,255,.28),rgba(255,255,255,0) 70%)}
.p2 b{position:absolute;left:0;right:0;top:22px;height:0;z-index:1;display:flex;align-items:center;justify-content:center;
  font:800 25px/1 'Alegreya Sans',sans-serif;font-variant-numeric:lining-nums;color:#fff1c8;
  text-shadow:0 1px 0 #000,0 -1px 0 rgba(255,255,255,.18),0 0 4px rgba(0,0,0,.8)}
.s-tok2{position:relative;display:block;width:44px;height:54px;filter:drop-shadow(0 2px 3px rgba(0,0,0,.75))}
.s-tok2 img{display:block;width:44px;height:54px}
.s-tok2 b{position:absolute;left:0;right:0;top:36.4px;height:0;display:flex;align-items:center;justify-content:center;font:800 25px/1 'Alegreya Sans',sans-serif;font-variant-numeric:lining-nums;color:#fffbe8;text-shadow:0 0 3px #063a36,0 1px 2px #063a36,0 0 1px #063a36}
.at{position:absolute;left:6px;top:5px}.af{position:absolute;left:5px;top:5px}`;

// The sea deck's medal: a compass rose engraved like the type drawings (dark brown line on the light disc).
const ROSE = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><g stroke="#3a220e" stroke-linejoin="round">
<circle cx="32" cy="32" r="23" fill="none" stroke-width="1.6"/><circle cx="32" cy="32" r="19.5" fill="none" stroke-width=".7" stroke-dasharray="1.2 2.2"/>
<path d="M32 12l4.4 15.6L32 32zM52 32l-15.6 4.4L32 32zM32 52l-4.4-15.6L32 32zM12 32l15.6-4.4L32 32z" fill="#2f8a96" stroke-width="1.1"/>
<path d="M32 12l-4.4 15.6L32 32zM52 32l-15.6-4.4L32 32zM32 52l4.4-15.6L32 32zM12 32l15.6 4.4L32 32z" fill="#f4e6c2" stroke-width="1.1"/>
<path d="M44.7 19.3l-7 8.3-1.3-1.3zM44.7 44.7l-8.3-7 1.3-1.3zM19.3 44.7l7-8.3 1.3 1.3zM19.3 19.3l8.3 7-1.3 1.3z" fill="#b8893a" stroke-width=".8"/>
<circle cx="32" cy="32" r="2.6" fill="#e2b75c" stroke-width="1"/><path d="M32 4.5l2.2 5h-4.4z" fill="#8e2420" stroke-width=".8"/></g></svg>`;
export const ROSE_URI = 'data:image/svg+xml;base64,' + Buffer.from(ROSE).toString('base64');

export const typeIconUri = (type: CardType) => dataUri(`docs/mockups/print/icons/ic_t_${TYPE[type].key}.svg`);
export const flaskUri = () => 'data:image/svg+xml;base64,' + Buffer.from(read('docs/mockups/print/icons/soul-flask.svg')).toString('base64');

export async function makeIcons(ctx: Ctx): Promise<void> {
  const m = BOX.medal, f = BOX.flask;
  const medal = (vars: { t: string; td: string; tl: string }, src: string) => `<span class="m2 at" style="--t:${vars.t};--td:${vars.td};--tl:${vars.tl}"><img src="${src}"></span>`;
  for (const type of Object.keys(TYPE) as CardType[]) await ctx.raster(`medal-${TYPE[type].key}`, medal(TYPE[type], typeIconUri(type)), m.w, m.h, 6, MEDAL_CSS);
  await ctx.raster('medal-sea', medal(SEA, ROSE_URI), m.w, m.h, 6, MEDAL_CSS);
  for (let n = 0; n <= 4; n++) await ctx.raster(n ? `coin-${n}` : 'coin', `<span class="p2 at">${n ? `<b>${n}</b>` : ''}</span>`, m.w, m.h, n ? 6 : 12, MEDAL_CSS);
  for (let n = 0; n <= 5; n++) await ctx.raster(n ? `flask-${n}` : 'flask', `<span class="s-tok2 af"><img src="${flaskUri()}">${n ? `<b>${n}</b>` : ''}</span>`, f.w, f.h, n ? 6 : 12, MEDAL_CSS);
  // the small flask inside a line of text: no shadow box around it
  setFlaskInline(await ctx.raster('flask-inline', `<img src="${flaskUri()}" style="width:26px;height:32px">`, 26, 32, 8));
}

/** <img> of an icon whose 44 px body starts at (x, y) mm and is d mm wide (9.2 by default). */
export function iconImg(ctx: Ctx, name: string, x: number, y: number, d = 9.24, cls = ''): string {
  const b = name.startsWith('flask') ? BOX.flask : BOX.medal, k = d / (44 * PX) * PX;
  return `<img class="ic ${cls}" src="${ctx.icon(name)}" style="position:absolute;left:${(x - b.ox * k).toFixed(3)}mm;top:${(y - b.oy * k).toFixed(3)}mm;width:${(b.w * k).toFixed(3)}mm;height:${(b.h * k).toFixed(3)}mm" alt="">`;
}
