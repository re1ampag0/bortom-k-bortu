import { Fragment, type ReactNode } from 'react';

/** Renders card text with the only markup used in the data: <b>…</b> and <br/>. Everything else is plain text. */
export function RichText({ html }: { html: string }) {
  const out: ReactNode[] = [];
  let bold = false;
  html.split(/(<b>|<\/b>|<br\s*\/?>)/).forEach((part, i) => {
    if (part === '<b>') bold = true;
    else if (part === '</b>') bold = false;
    else if (/^<br/.test(part)) out.push(<br key={i} />);
    else if (part) out.push(bold ? <b key={i}>{part}</b> : <Fragment key={i}>{part}</Fragment>);
  });
  return <>{out}</>;
}
