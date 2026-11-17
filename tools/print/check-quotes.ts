// Russian quotes on the printed sheets (v8, item 3): only «ёлочки» — no „German“, “English” or "straight" quotes in the
// text a player reads. Reads the built pages out/print/html/*.html: the tags, styles and scripts are dropped, the text
// left is searched. Used by `npm run print -- --check` (check.ts).
import fs from 'node:fs';
import path from 'node:path';
import { HTML_DIR } from './kit';

export function checkQuotes(): { errors: string[]; files: number } {
  const errors: string[] = []; let files = 0;
  if (!fs.existsSync(HTML_DIR)) return { errors, files };
  for (const f of fs.readdirSync(HTML_DIR).filter(n => n.endsWith('.html') && !n.startsWith('_')).sort()) {
    files++;
    const text = fs.readFileSync(path.join(HTML_DIR, f), 'utf8').replace(/<(style|script)[^>]*>[\s\S]*?<\/\1>/g, ' ').replace(/<[^>]*>/g, ' ')
      .replace(/&quot;/g, '"').replace(/&#34;/g, '"').replace(/&amp;/g, '&');
    for (const m of text.matchAll(/.{0,24}[„“”"].{0,24}/g)) errors.push(`${f}: not «ёлочки» — «${m[0].replace(/\s+/g, ' ').trim()}»`);
  }
  return { errors, files };
}
