# Card icons drawn for print: bold silhouettes that read at 6–8 mm, light on the type colour, one light source (top left).
# Each icon is a 64 × 64 SVG; the medal behind it is drawn by the card.
L = '#fff3d6'   # lit face
M = '#e8d2a4'   # mid tone
D = '#6b4a24'   # dark line / shadow
def svg(body, defs=''):
    return f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><defs>{defs}</defs>{body}</svg>'

ball_g = '<radialGradient id="b" cx=".34" cy=".3" r=".8"><stop offset="0" stop-color="#9aa2a8"/><stop offset=".3" stop-color="#4a5054"/><stop offset="1" stop-color="#121416"/></radialGradient>'
fire_g = '<linearGradient id="f" x1="1" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff6c8"/><stop offset=".5" stop-color="#ffc23a"/><stop offset="1" stop-color="#ff7a1a"/></linearGradient>'
ICONS = {
 # Charge: a round shot flying with a trail of fire — «добавь к своему Залпу»
 'charge': svg(
   '<path d="M40 22 Q30 8 10 10 Q22 16 22 22 Q12 22 6 30 Q20 28 26 34 Z" fill="url(#f)" stroke="#8a2a08" stroke-width="1.6" stroke-linejoin="round"/>'
   '<circle cx="38" cy="36" r="16" fill="url(#b)" stroke="#fff3d6" stroke-width="2.4"/>'
   '<path d="M28 30 a12 12 0 0 1 9 -6" stroke="#e8eef2" stroke-width="3" fill="none" stroke-linecap="round" opacity=".85"/>'
   '',
   ball_g + fire_g),
 # Order: a sealed scroll — a captain's order
 'order': svg(
   '<path d="M16 12 h30 a6 6 0 0 1 0 12 h-2 v26 a6 6 0 0 1 -6 6 h-24 a6 6 0 0 1 0 -12 h2 v-26 a6 6 0 0 1 0 -6 z" fill="#f6ead0" stroke="#3a2a14" stroke-width="2.6" stroke-linejoin="round"/>'
   '<path d="M46 12 a6 6 0 0 0 0 12" fill="#d8c08e" stroke="#3a2a14" stroke-width="2.2"/><path d="M14 44 a6 6 0 0 0 0 12" fill="#d8c08e" stroke="#3a2a14" stroke-width="2.2"/>'
   '<path d="M24 24 h14 M24 30 h14 M24 36 h9" stroke="#8a6a3c" stroke-width="2.4" stroke-linecap="round"/>'
   '<path d="M36 46 l-3 12 l5 -3 l3 4 l1 -12 z" fill="#8e2420" stroke="#3a0a08" stroke-width="1.2"/>'
   '<circle cx="40" cy="44" r="7.5" fill="#b8302a" stroke="#4a0e0a" stroke-width="2"/><circle cx="40" cy="44" r="3.4" fill="none" stroke="#ffd2b8" stroke-width="1.4" opacity=".8"/>'),
 # Repair: a shipwright's mallet over a fresh plank with nails
 'repair': svg(
   '<rect x="8" y="40" width="46" height="12" rx="2" fill="#e2bc80" stroke="#3a2a14" stroke-width="2.4"/><path d="M12 46 h38" stroke="#b88a4a" stroke-width="1.4"/>'
   '<circle cx="16" cy="46" r="1.8" fill="#3a2a14"/><circle cx="46" cy="46" r="1.8" fill="#3a2a14"/>'
   '<g transform="rotate(-38 34 26)"><rect x="31" y="20" width="6" height="34" rx="2.5" fill="#c49a62" stroke="#3a2a14" stroke-width="2.2"/>'
   '<rect x="20" y="8" width="28" height="14" rx="3" fill="#f2e2c0" stroke="#3a2a14" stroke-width="2.6"/><path d="M23 11 h22" stroke="#ffffff" stroke-width="2" opacity=".8"/>'
   '<path d="M26 8 v14 M42 8 v14" stroke="#8a6a3c" stroke-width="1.8"/></g>'),
 # Reaction: a raised shield taking a hit — played in the enemy's turn
 'reaction': svg(
   '<path d="M32 6 L54 14 Q54 40 32 58 Q10 40 10 14 Z" fill="#f2e6cc" stroke="#3a2a14" stroke-width="2.8" stroke-linejoin="round"/>'
   '<path d="M32 12 L48 18 Q48 38 32 51 Z" fill="#c8b48a" opacity=".7"/>'
   '<path d="M18 24 Q26 18 32 24 T46 24" stroke="#5a7a96" stroke-width="3.4" fill="none" stroke-linecap="round"/>'
   '<path d="M18 33 Q26 27 32 33 T46 33" stroke="#5a7a96" stroke-width="3.4" fill="none" stroke-linecap="round"/>'
   '<path d="M14 15 L32 9" stroke="#ffffff" stroke-width="2.2" stroke-linecap="round" opacity=".8"/>'),
 # Souls: a pale flame with a curl — the currency of the Dutchman
 'soul': svg(
   '<path d="M32 4 Q42 18 46 28 Q52 44 40 54 Q32 60 24 54 Q12 44 18 30 Q20 38 26 40 Q22 24 32 4 Z" fill="#dffcf6" stroke="#0b5752" stroke-width="2.6" stroke-linejoin="round"/>'
   '<path d="M32 22 Q38 32 36 42 Q34 48 30 46 Q26 42 30 36" stroke="#3fb8aa" stroke-width="2.6" fill="none" stroke-linecap="round"/>'),
 # Powder: a small keg — the price in Powder
 'powder': svg(
   '<path d="M18 10 Q14 32 18 54 H46 Q50 32 46 10 Z" fill="#c49a62" stroke="#2a1a0a" stroke-width="2.6" stroke-linejoin="round"/>'
   '<path d="M15 20 Q32 24 49 20 M15 44 Q32 48 49 44" stroke="#3a3a3a" stroke-width="4" fill="none"/>'
   '<path d="M26 12 Q24 32 26 52 M38 12 Q40 32 38 52" stroke="#8a6a3c" stroke-width="1.6" fill="none"/>'
   '<path d="M22 14 Q20 30 22 50" stroke="#f2d8a8" stroke-width="2" fill="none" opacity=".8"/>'),
}
if __name__ == '__main__':
    import json, os
    out = os.path.dirname(__file__)
    for k, v in ICONS.items(): open(os.path.join(out, k + '.svg'), 'w').write(v)
    print('ok')
