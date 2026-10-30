// Inputs of the data editor: a number, a text, a track, the diagonal damage, «в колоде». A changed field is outlined
// and has «↺» — «Вернуть как в основном»; a wrong value shows its problem under the field.
import { memo } from 'react';
import { TRACKS } from '../../engine/data';
import { TRACK_NAMES, fieldProblem, getAt, opName, parseNumber, type Field, type Path, type Raw } from './model';

export type Edit = (path: Path, value: unknown) => void;

export interface FieldProps {
  field: Field;
  raw: Raw;
  base: Raw;
  readOnly: boolean;
  onEdit: Edit;
}

const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);

export const FieldInput = memo(function FieldInput({ field, value, was, readOnly, onEdit }: { field: Field; value: unknown; was: unknown; readOnly: boolean; onEdit: Edit }) {
  const f = field;
  const changed = f.kind === 'bool' ? !!value !== !!was : !same(value, was);
  const problem = fieldProblem(f, value);
  const id = `f-${f.path.join('-')}`;
  const label = f.op ? (
    <span className="admin-op" title="Имя операции меняется только в коде">
      <code>{f.op}</code>
      {opName(f.op) && <small> {opName(f.op)}</small>}
    </span>
  ) : (
    f.label
  );
  let input;
  switch (f.kind) {
    case 'int':
    case 'num':
      input = (
        <input
          id={id}
          inputMode={f.kind === 'int' ? 'numeric' : 'decimal'}
          value={typeof value === 'number' ? String(value).replace('.', ',') : String(value ?? '')}
          disabled={readOnly}
          aria-invalid={!!problem || undefined}
          onChange={(e) => onEdit(f.path, parseNumber(e.target.value))}
        />
      );
      break;
    case 'text':
      input = <input id={id} className="admin-text" value={String(value ?? '')} disabled={readOnly} onChange={(e) => onEdit(f.path, e.target.value)} />;
      break;
    case 'long':
      input = <textarea id={id} rows={2} value={String(value ?? '')} disabled={readOnly} onChange={(e) => onEdit(f.path, e.target.value)} />;
      break;
    case 'track':
      input = (
        <select id={id} value={String(value)} disabled={readOnly} onChange={(e) => onEdit(f.path, e.target.value)}>
          {TRACKS.map((t) => (
            <option key={t} value={t}>
              {TRACK_NAMES[t]}
            </option>
          ))}
        </select>
      );
      break;
    case 'diag': {
      const d = (value ?? {}) as Raw;
      const fixed = d.fixed !== undefined;
      const n = fixed ? d.fixed : d.offset;
      input = (
        <span className="admin-diag">
          <select
            aria-label="Как считать урон по диагонали"
            value={fixed ? 'fixed' : 'offset'}
            disabled={readOnly}
            onChange={(e) => onEdit(f.path, e.target.value === 'fixed' ? { fixed: Math.max(0, Number(n) || 0) } : { offset: Number(n) || 0 })}
          >
            <option value="offset">Пушки +</option>
            <option value="fixed">всегда</option>
          </select>
          <input
            id={id}
            inputMode="numeric"
            value={typeof n === 'number' ? String(n).replace('-', '−') : String(n ?? '')}
            disabled={readOnly}
            aria-invalid={!!problem || undefined}
            onChange={(e) => onEdit(f.path, { [fixed ? 'fixed' : 'offset']: parseNumber(e.target.value) })}
          />
        </span>
      );
      break;
    }
    case 'bool':
      // The field is «off»; the box shows «в колоде».
      input = <input id={id} type="checkbox" checked={!value} disabled={readOnly} onChange={(e) => onEdit(f.path, e.target.checked ? undefined : true)} />;
      break;
  }
  return (
    <div className={`admin-field k-${f.kind}${changed ? ' changed' : ''}${problem ? ' bad' : ''}`} data-testid={id}>
      <label htmlFor={id}>{label}</label>
      <span className="admin-input">
        {input}
        {changed && !readOnly && (
          <button className="admin-revert" title="Вернуть как в основном" aria-label={`Вернуть как в основном: ${f.label}`} onClick={() => onEdit(f.path, structuredClone(was))}>
            ↺
          </button>
        )}
      </span>
      {changed && <small className="admin-was">в основном: {showValue(f, was)}</small>}
      {problem && <small className="admin-problem">{problem}</small>}
    </div>
  );
});

function showValue(f: Field, x: unknown): string {
  if (f.kind === 'bool') return x ? 'выключена' : 'в колоде';
  if (f.kind === 'track') return TRACK_NAMES[String(x)] ?? String(x);
  if (f.kind === 'diag') {
    const d = (x ?? {}) as Raw;
    return d.fixed !== undefined ? `всегда ${d.fixed}` : `Пушки ${d.offset < 0 ? '−' : '+'} ${Math.abs(d.offset)}`;
  }
  if (f.kind === 'text' || f.kind === 'long') {
    const t = String(x ?? '');
    return t.length > 40 ? `${t.slice(0, 40)}…` : t || '(пусто)';
  }
  return typeof x === 'number' ? String(x).replace('.', ',') : String(x);
}

/** A field bound to the data: reads its value and the main value by its path. */
export function Bound({ field, raw, base, readOnly, onEdit }: FieldProps) {
  return <FieldInput field={field} value={getAt(raw, field.path)} was={getAt(base, field.path)} readOnly={readOnly} onEdit={onEdit} />;
}
