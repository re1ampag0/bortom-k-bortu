// The floor of the line widths (tools/print/README.md, «Правила печатного HTML» 2): a copier's laser loses a line thinner
// than MIN_STROKE mm or prints it grey. The drawings keep to it where they are made (the engraved icons and the emblems
// widen their hatching's gap with its strokes, so a shade keeps its tone); floorStrokes() then raises whatever stroke is
// still thinner on the built page — measured at its real size on the sheet, through every transform over it — before the
// page is printed and saved; check-layout.ts checkStrokes() reads the saved pages back (--check).
import type { Page } from '@playwright/test';

export const MIN_STROKE = 0.15;

/** raises every painted SVG stroke on the page under MIN_STROKE mm to it; returns how many were raised */
export async function floorStrokes(page: Page, min = MIN_STROKE): Promise<number> {
  return page.evaluate((min) => {
    const MM = 96 / 25.4; let n = 0;
    for (const g of Array.from(document.querySelectorAll('section.sheet path,section.sheet line,section.sheet polyline,section.sheet polygon,section.sheet rect,section.sheet circle,section.sheet ellipse'))) {
      if (!(g instanceof SVGGeometryElement) || g.closest('defs,clipPath,mask,pattern,symbol,marker')) continue;
      const st = getComputedStyle(g);
      if (st.stroke === 'none' || st.display === 'none') continue;
      const sw = parseFloat(st.strokeWidth); if (!(sw > 0)) continue;
      const m = g.getScreenCTM(); if (!m) continue;
      const k = Math.sqrt(Math.abs(m.a * m.d - m.b * m.c));
      if (!(k > 0) || sw * k / MM >= min - 0.001) continue;
      g.style.strokeWidth = String(Math.ceil(min * MM / k * 1e4) / 1e4); n++;
    }
    return n;
  }, min);
}
