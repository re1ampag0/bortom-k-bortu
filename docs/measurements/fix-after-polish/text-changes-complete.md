# Полный исходный diff текстовых узлов UI

Сравнение с main1b929914. В каждом файле: удалённые и добавленные строки; шаблоны оставлены с выражениями. Включены и изменения разметки, чтобы список не терял строки. Человеческие замены перечислены в отчёте.

## src/ui/Catalog.tsx

Было:

```tsx
. Всего карт:
```
```tsx
: в колодах
```

Стало:

```tsx
. Всего
```
```tsx
карт. В колодах
```

## src/ui/game/Alarm.tsx

Было:



Стало:

```tsx
Реакция
```
```tsx
'Выберите карту'
```
```tsx
`Цена ${price.cost} Пороха`
```
```tsx
Трюм
```
```tsx
из
```

## src/ui/game/Game.tsx

Было:

```tsx
'Партия окончена: ничья'
```
```tsx
`Партия окончена: победа: ${SIDE_LABEL[s.winner].name}`
```
```tsx
`Ждём: ${SIDE_LABEL[d.side].name} (бот) ${decideVerb(d.side)}, ответить ли Реакцией…`
```
```tsx
`Ждём: ${SIDE_LABEL[d.side].name}: ${curtainReason(s, data, d.kind)}`
```
```tsx
`${nick(s.volley?.shooter ?? s.card?.ship ?? d.seats[0])}: ${s.volley ? 'Залп' : 'карта'}: ответите Реакцией?`
```
```tsx
`${nick(mode.seat)}: «${cardByCode(data, mode.card).name}»: выберите параметры`
```
```tsx
`Ждём: ${who(d!.seats)}: Реакция…`
```
```tsx
`Ход окончен: ждём: ${who(left.length > 0 ? left : d!.seats)}`
```
```tsx
`Ждём: ${who(d!.seats)}: ${curtainReason(s, data, d!.kind)}`
```
```tsx
: ход закончится, когда нажмёте вы
```
```tsx
: ждёт вас
```
```tsx
`Сыграть: когда ${nick(holder)} должна утонуть. Порох: ${s.teams[s.ships[holder].side].powder} из ${c.cost}`
```

Стало:

```tsx
'Партия окончена. Ничья'
```
```tsx
`Партия окончена. Победа ${SIDE_LABEL[s.winner].gen}`
```
```tsx
`Ждём Реакцию ${SIDE_LABEL[d.side].gen}. Бот думает…`
```
```tsx
`Ждём ${SIDE_LABEL[d.side].acc}: ${curtainReason(s, data, d.kind)}`
```
```tsx
`${nick(s.volley?.shooter ?? s.card?.ship ?? d.seats[0])} ${s.volley ? 'даёт Залп' : `играет «${cardByCode(data,s.card!.card).name}»`}. Ответите Реакцией?`
```
```tsx
`${nick(mode.seat)}, «${cardByCode(data, mode.card).name}»: выберите параметры`
```
```tsx
`Ждём Реакцию ${SIDE_LABEL[d!.side].gen}…`
```
```tsx
`Ход окончен. Ждём ${who(left.length > 0 ? left : d!.seats)}`
```
```tsx
`Ждём ${who(d!.seats)}: ${curtainReason(s, data, d!.kind)}`
```
```tsx
"те же корабли, новая партия"
```
```tsx
. Ход закончится, когда нажмёте вы
```
```tsx
, ждёт вас
```
```tsx
`Сыграть, когда ${nick(holder)} должна утонуть. Порох: ${s.teams[s.ships[holder].side].powder} из ${c.cost}`
```

## src/ui/game/NetParts.tsx

Было:

```tsx
не в сети.
```
```tsx
`${missing.length>1?' ждут капитанов.':' ждёт капитана.'} Друг может вернуться по ссылке комнаты.`
```

Стало:

```tsx
вышел из игры.
```
```tsx
`${missing.length>1?' ждут капитанов.':' ждёт капитана.'} Партия не приостановлена. Друг может вернуться по ссылке комнаты или вы можете занять его место ботом.`
```

## src/ui/game/Panels.tsx

Было:

```tsx
'Разложите карты моря: первая выбранная откроется первой. «i»: карта целиком.'
```

Стало:

```tsx
'Разложите карты моря. Первая выбранная откроется первой. Нажмите «i», чтобы прочитать карту целиком.'
```

## src/ui/game/Table.tsx

Было:

```tsx
Море · весь раунд
```
```tsx
'В начале хода своей команды: −1 Корпус за каждый Пожар. Потушить: сбросьте 1 карту с руки: снимите 1 Пожар (в свой ход, сколько угодно раз).'
```
```tsx
`Легенда: ${legendName}${affordable ? '' : ': не хватает Пороха или Душ'}`
```

Стало:

```tsx
Море ·
```
```tsx
'В начале хода своей команды теряется 1 Корпус за каждый Пожар. Чтобы потушить 1 Пожар, сбросьте 1 карту с руки. В свой ход это можно делать сколько угодно раз.'
```
```tsx
`Капитан «${d.nickGenitive}» на борту`
```
```tsx
`Легенда «${legendName}»${affordable ? '' : '. Не хватает Пороха или Душ'}`
```

## src/ui/game/alarm.ts

Было:

```tsx
`${name(v.shooter)} выстрелил по ${to(v.target)}: ответите Реакцией?`
```
```tsx
`${name(v.shooter)} даёт Залп по ${to(v.target)}: ответите Реакцией?`
```
```tsx
`${name(s.card.ship)}: «${c.name}»${target}: ответите Реакцией?`
```

Стало:

```tsx
`${name(v.shooter)} выстрелил по ${to(v.target)}. Ответите Реакцией?`
```
```tsx
`${name(v.shooter)} даёт Залп по ${to(v.target)}. Ответите Реакцией?`
```
```tsx
`${name(s.card.ship)} играет «${c.name}»${target}. Ответите Реакцией?`
```

## src/ui/game/fx/FxScene.tsx

Было:

```tsx
Последнее: «Жемчужина» откладывает в Планы: 2 карты: а вот это очень длинная запись журнала, которую строка обрежет многоточием.
```

Стало:

```tsx
Последнее: «Жемчужина» откладывает 2 карты в План. Это длинная запись журнала, которую строка обрежет многоточием.
```

## src/ui/game/fx/misc.ts

Было:

```tsx
`${nick(ctx, plans.seat)}: План: ${plans.count} рубашкой вниз`
```

Стало:

```tsx
`${nick(ctx, plans.seat)} откладывает в План ${plans.count} рубашкой вниз`
```

## src/ui/game/fx/sea.ts

Было:

```tsx
`: Раунд ${c.round}: `
```
```tsx
`Раунд ${c.round}: новая карта моря`
```

Стало:

```tsx
`<span class="round-orn" aria-hidden="true">◆</span> Раунд ${roman(c.round ?? ctx.display.round)} <span class="round-orn" aria-hidden="true">◆</span>`
```
```tsx
`Раунд ${roman(c.round ?? ctx.display.round)}. Новая карта моря`
```

## src/ui/game/fx/volley.ts

Было:

```tsx
`${nick(ctx, by)}: Сердце Дейви Джонса: ещё один Залп ${gen(ctx, c.ship)}`
```

Стало:

```tsx
`${nick(ctx, by)} использует Сердце Дейви Джонса. Ещё один Залп ${gen(ctx, c.ship)}`
```

## src/ui/game/victoryStats.ts

Было:

```tsx
`Залп на ${st(c).kills.find((k) => k.ship === last)!.volley}: ${nick(data, last)} на дне`
```
```tsx
`${st(c).dmgIn} урона: и на плаву`
```

Стало:

```tsx
`Залп на ${st(c).kills.find((k) => k.ship === last)!.volley}. ${nick(data, last)} на дне`
```
```tsx
`${st(c).dmgIn} урона, и на плаву`
```

## src/ui/game/weather-window/model.ts

Было:

```tsx
`Трюм ${s.teams[side].powder}: до ${Math.min(r.seaTortuga,s.teams[side].powder)} Пороха: столько же карт`
```

Стало:

```tsx
`В Трюме ${s.teams[side].powder}. До ${Math.min(r.seaTortuga,s.teams[side].powder)} Пороха можно обменять на столько же карт`
```

## src/ui/start/Prep.tsx

Было:

```tsx
`Жребий: ${mode === 'bots' ? 'вы' : 'держащий устройство'}: ${SIDE_LABEL[coin.side].name}`
```

Стало:

```tsx
`Монета выбрала ${SIDE_LABEL[coin.side].acc}. ${mode === 'bots' ? 'Вы играете за эту команду.' : 'За неё играет тот, кто держит устройство.'}`
```