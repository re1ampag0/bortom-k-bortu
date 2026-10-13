// Secret placement (RULES.md 2.2): each human team decides which ship is on the left, unseen by the other team.
// Bots place at random (createGame without positions). Two people on one screen: Pirates → hand-over → Company.
import { useState } from 'react';
import type { MatchSetup } from '../../engine/match';
import type { GameData, Side } from '../../engine/types';
import { Curtain } from './Curtain';
import { SIDE_LABEL } from './text';

export function Placement({
  data,
  setup,
  note,
  onDone,
  onBack,
}: {
  data: GameData;
  setup: MatchSetup;
  note: string;
  onDone: (setup: MatchSetup) => void;
  onBack: () => void;
}) {
  const humans = (['ПИРАТЫ', 'КОМПАНИЯ'] as Side[]).filter((side) => setup.players[side] === 'human');
  const [index, setIndex] = useState(0);
  const [hidden, setHidden] = useState(false);
  const [positions, setPositions] = useState<Partial<Record<Side, [string, string]>>>({});
  const side = humans[index];
  const ships = data.ships.filter((x) => x.side === side).map((x) => x.code);
  const [order, setOrder] = useState<[string, string]>([ships[0], ships[1]]);

  if (hidden) {
    return (
      <Curtain
        side={side}
        reason="тайная расстановка"
        title={`Передайте устройство ${SIDE_LABEL[side].dat}`}
        summary={[]}
        onReady={() => setHidden(false)}
      />
    );
  }

  const ship = (code: string) => data.ships.find((x) => x.code === code)!;
  const done = () => {
    const all = { ...positions, [side]: order };
    if (index + 1 < humans.length) {
      const next = humans[index + 1];
      const nextShips = data.ships.filter((x) => x.side === next).map((x) => x.code);
      setPositions(all);
      setIndex(index + 1);
      setOrder([nextShips[0], nextShips[1]]);
      if (!setup.openHands) setHidden(true);
      return;
    }
    onDone({ ...setup, game: { ...setup.game, positions: all } });
  };

  return (
    <main className="setup placement" data-testid="placement">
      <header className="setup-head">
        <h1>{SIDE_LABEL[side].name}: расстановка</h1>
        {note && index === 0 && <p className="note">{note}</p>}
        <p className="muted">
          Кто слева, кто справа? Корабли напротив друг друга стреляют без штрафа. Противник увидит расстановку только в
          начале партии.
        </p>
      </header>
      <div className="slots">
        {order.map((code, i) => (
          <div key={code} className="slot" style={{ borderColor: ship(code).color }}>
            <span className="muted">{i === 0 ? 'Слева' : 'Справа'}</span>
            <b style={{ color: ship(code).color }}>{ship(code).name}</b>
            <span className="muted">{ship(code).captain}</span>
          </div>
        ))}
      </div>
      <div className="row buttons">
        <button className="btn" onClick={() => setOrder([order[1], order[0]])}>
          ⇄ Поменять местами
        </button>
        <button className="btn primary" data-testid="placement-done" onClick={done}>
          Готово
        </button>
        <button className="link" onClick={onBack}>
          Назад
        </button>
      </div>
    </main>
  );
}
