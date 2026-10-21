// ui-4: presentation only. Callers keep all decisions, limits and actions from the current panels.
import type { ReactNode } from 'react';
import { OakButton, type Btn } from './Table';
import './decision-sheet.css';

export function DecisionSheet({title, sub, hold, testid, children, actions, tools}: {
  title: string;
  sub?: string;
  hold?: { powder: number; cap: number };
  testid?: string;
  children?: ReactNode;
  actions: ReactNode;
  tools?: ReactNode;
}) {
  return <section className="panel oak-sheet decision-sheet" data-testid={testid}>
    <header className="cs-head">
      <b className="cs-title">{title}</b>
      {hold && <span className="cs-hold">Трюм {hold.powder} из {hold.cap}</span>}
      {tools}
    </header>
    {sub && <p className="ds-note">{sub}</p>}
    {children && <div className="ds-body">{children}</div>}
    {actions}
  </section>;
}

/** Keep the paper refusal(s) beside one oak primary action, including the existing disabled reason. */
export function DecisionActions({cancel, primary}: {cancel: ReactNode; primary: Btn}) {
  return <div className="panel-actions ds-actions">
    <div className="ds-cancel">{cancel}</div>
    <OakButton b={primary} className="primary" />
  </div>;
}

export function DecisionStepper({label, value, onMinus, onPlus, minusDisabled, plusDisabled}: {
  label: ReactNode;
  value: number;
  onMinus: () => void;
  onPlus: () => void;
  minusDisabled?: boolean;
  plusDisabled?: boolean;
}) {
  return <div className="stepper ds-stepper">
    <span>{label}</span>
    <button type="button" className="btn ds-round" aria-label="Уменьшить" disabled={minusDisabled} onClick={onMinus}>−</button>
    <b>{value}</b>
    <button type="button" className="btn ds-round" aria-label="Увеличить" disabled={plusDisabled} onClick={onPlus}>+</button>
  </div>;
}
