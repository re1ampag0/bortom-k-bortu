// The coin of the draw (docs/TZ.md, «Детали», п. 6): a skull for the Pirates, the gold crest of the Company.
import type { Side } from '../../engine/types';

export function Coin({ face, spinning }: { face: Side | null; spinning: boolean }) {
  const cls = spinning ? `spin-${face === 'КОМПАНИЯ' ? 'company' : 'pirates'}` : face === 'КОМПАНИЯ' ? 'show-company' : 'show-pirates';
  return (
    <div className="coin" aria-hidden="true">
      <div className={`coin-inner ${cls}`}>
        <svg className="coin-face" viewBox="0 0 80 80">
          <circle cx="40" cy="40" r="38" fill="#3a332c" stroke="#a8812e" strokeWidth="3" />
          <circle cx="40" cy="40" r="32" fill="none" stroke="#a8812e" strokeWidth="1" opacity=".6" />
          <path d="M40 18c-11 0-19 7.5-19 18 0 6 3 10 7 12.5V55h6v-4h3v4h6v-4h3v4h6v-6.5c4-2.5 7-6.5 7-12.5 0-10.5-8-18-19-18Z" fill="#f1e8d4" />
          <circle cx="32.5" cy="37" r="5" fill="#3a332c" />
          <circle cx="47.5" cy="37" r="5" fill="#3a332c" />
          <path d="M40 42l-3 5h6Z" fill="#3a332c" />
          <path d="M20 62l40-8M20 54l40 8" stroke="#f1e8d4" strokeWidth="3" strokeLinecap="round" />
        </svg>
        <svg className="coin-face back" viewBox="0 0 80 80">
          <circle cx="40" cy="40" r="38" fill="#c8a04a" stroke="#8a6a22" strokeWidth="3" />
          <circle cx="40" cy="40" r="32" fill="none" stroke="#8a6a22" strokeWidth="1" opacity=".7" />
          <path d="M26 24h28v16c0 10-7 16-14 19-7-3-14-9-14-19Z" fill="#e8c46a" stroke="#6e531a" strokeWidth="2" />
          <path d="M40 24v35M26 36h28" stroke="#6e531a" strokeWidth="2" />
          <path d="M30 20l4-6 6 5 6-5 4 6Z" fill="#e8c46a" stroke="#6e531a" strokeWidth="1.5" />
          <text x="33" y="33" fontSize="8" fontFamily="Alegreya" fontWeight="700" fill="#6e531a" textAnchor="middle">
            V
          </text>
          <text x="47" y="51" fontSize="8" fontFamily="Alegreya" fontWeight="700" fill="#6e531a" textAnchor="middle">
            E
          </text>
        </svg>
      </div>
    </div>
  );
}
