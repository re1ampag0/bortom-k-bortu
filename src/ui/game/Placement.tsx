// Secret placement (RULES.md 2.2): each human team decides which ship is on the left, unseen by the other team.
// Bots place at random (createGame without positions). Two people on one screen: Pirates → hand-over → Company.
import { useState } from 'react';
import type { MatchSetup } from '../../engine/match';
import type { GameData, Side } from '../../engine/types';
import { Curtain } from './Curtain';
import { SIDE_LABEL } from './text';
import {MenuSurface,Icon,Arrow} from '../menus/Menus';
import {PlacementBoard} from '../menus/PlacementBoard';

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

  return <MenuSurface kind="prep"><main className="menu-placement" data-testid="placement">
    <header><div className="menu-kicker">Тайная расстановка</div><h1 className="menu-title">{SIDE_LABEL[side].name}: кто слева, кто справа?</h1><p className="menu-subtitle">Напротив корабль бьёт в полную силу, по диагонали на 1 слабее. {side==='ПИРАТЫ'?'Компания':'Пираты'} увидит расстановку только в начале боя.</p>{index===0&&<p className="menu-placement-verdict"><Icon name="coin" size={24}/>{note.startsWith('Монета')?'Монета выбрала: вы':'Вы'} за {SIDE_LABEL[side].acc}. Пираты ходят первыми.</p>}</header>
    <PlacementBoard data={data} side={side} order={order} onSwap={()=>setOrder([order[1],order[0]])}/>
    <footer className="menu-placement-actions"><button className="menu-link" onClick={onBack}><Arrow back/>Назад</button><button className="menu-link" onClick={()=>setOrder([order[1],order[0]])}><Icon name="swap"/>Переставить корабли</button><button className="menu-primary" data-testid="placement-done" onClick={done}>Готово</button></footer>
   </main></MenuSurface>;
}
