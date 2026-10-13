// The background of the start and preparation screens: faded rhumb lines of two compass roses, as on an old sea chart.
import { memo } from 'react';

export const Rhumbs = memo(function Rhumbs() {
  const lines: string[] = [];
  for (const [cx, cy] of [
    [300, 420],
    [820, 180],
  ]) {
    for (let i = 0; i < 32; i++) {
      const a = (i * Math.PI) / 16;
      lines.push(`M${cx} ${cy}L${(cx + 1600 * Math.cos(a)).toFixed(1)} ${(cy + 1600 * Math.sin(a)).toFixed(1)}`);
    }
  }
  return (
    <svg className="rhumbs" viewBox="0 0 1000 1000" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <defs>
        <radialGradient id="rhumbs-bg" cx="30%" cy="40%" r="80%">
          <stop offset="0" stopColor="#F5EDDB" />
          <stop offset="1" stopColor="#E6D8BA" />
        </radialGradient>
      </defs>
      <rect width="1000" height="1000" fill="url(#rhumbs-bg)" />
      <path d={lines.join('')} stroke="#C9B48C" strokeWidth="1" opacity=".55" fill="none" />
      <g fill="none" stroke="#C9B48C" opacity=".7">
        <circle cx="300" cy="420" r="70" />
        <circle cx="300" cy="420" r="74" />
      </g>
    </svg>
  );
});
