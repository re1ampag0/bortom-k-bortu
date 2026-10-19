// The «Turk's head» ring around the round brass buttons (docs/mockups/a5/A5Rig.html «Круглые кнопки: латунь в турецком узле»,
// turksHead + ringBtn of rig/src/rig3_tpl.html): three strands woven over and under round a circle, like the wrapping of a
// wheel or a bell rope. It is one picture, drawn once; the brass disc with the icon lies inside it (game.css .round-disc).
const R1 = (n: number) => Math.round(n * 10) / 10;

/**
 * The woven ring on a 64 × 64 field: the centre (cx, cy), the mean radius r, the swing A of a strand, B lobes round the ring,
 * the thickness w of a strand. The parts of the strands that go under are drawn first, those that go over — after them.
 */
function turksHead(cx: number, cy: number, r: number, A: number, B: number, w: number): string {
  const N = 720;
  const c = ['#3e2a10', '#b8935a', '#f2dfae'];
  const under: string[][][] = [];
  const over: string[][][] = [];
  for (let s = 0; s < 3; s++) {
    const ph = (s * Math.PI * 2) / 3;
    let cur: string[][] | null = null;
    let sign = 0;
    for (let i = 0; i <= N; i++) {
      const t = (i / N) * Math.PI * 2;
      const th = B * t + ph;
      const rr = r + A * Math.sin(th);
      const p = [String(R1(cx + Math.cos(t) * rr)), String(R1(cy + Math.sin(t) * rr))];
      const sg = Math.cos(th) >= 0 ? 1 : -1;
      if (sg !== sign) {
        if (cur) {
          cur.push(p);
          (sign > 0 ? over : under).push(cur);
        }
        cur = [p];
        sign = sg;
      } else cur!.push(p);
    }
    if (cur) (sign > 0 ? over : under).push(cur);
  }
  const draw = (pts: string[][]) => {
    const d = 'M' + pts.map((p) => p.join(' ')).join(' L');
    return (
      `<path d="${d}" fill="none" stroke="${c[0]}" stroke-width="${R1(w + 1.6)}" stroke-linecap="butt" stroke-linejoin="round"/>` +
      `<path d="${d}" fill="none" stroke="${c[1]}" stroke-width="${w}" stroke-linejoin="round"/>` +
      `<path d="${d}" fill="none" stroke="${c[2]}" stroke-width="${R1(w * 0.3)}" stroke-linejoin="round" opacity=".75" transform="translate(-.25 -.35)"/>`
    );
  };
  return under.map(draw).join('') + over.map(draw).join('');
}

/** The knot with its soft shadow, a 64 × 64 picture without ids (any number of copies is safe). */
export const KNOT_SVG =
  `<svg viewBox="0 0 64 64" aria-hidden="true" focusable="false"><circle cx="32" cy="33.6" r="29" fill="#000" opacity=".28"/>` +
  `${turksHead(32, 32, 26, 2.6, 7, 3.4)}</svg>`;
