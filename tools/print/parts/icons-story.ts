// The story icons of the boards (parts/icons.ts draws the rest): one for each ship ability, in the log beside its name,
// and one for each Legend, under the Legend card once it is played. Same engraved manner and the same kit (icons-kit.ts):
// contour + hatching clipped to the shape, light from the upper left, a 100×100 local box, no filters, no text.
import { K, circ } from './icons-kit';

export type StoryName =
  | 'madPlan' | 'swiftWind' | 'greekFire' | 'tritonSword' | 'treasury' | 'heartChest' | 'soulService' | 'dive'
  | 'legendJack' | 'legendBottle' | 'legendArmada' | 'legendKraken';

export const STORY_NAMES: StoryName[] = [
  'madPlan', 'swiftWind', 'greekFire', 'tritonSword', 'treasury', 'heartChest', 'soulService', 'dive',
  'legendJack', 'legendBottle', 'legendArmada', 'legendKraken',
];

export const STORY_TITLES: Record<StoryName, string> = {
  madPlan: 'Безумный план', swiftWind: 'Быстрее ветра', greekFire: 'Греческий огонь', tritonSword: 'Меч Тритона',
  treasury: 'Казна Компании', heartChest: 'Сердце Дейви Джонса', soulService: 'Вечная служба', dive: 'Погружение',
  legendJack: 'Легенда: Джек ускользает', legendBottle: 'Легенда: Корабль в бутылке', legendArmada: 'Легенда: Армада Компании',
  legendKraken: 'Легенда: Кракен',
};

/** placeholder until drawn */
const todo = (k: K) => k.shape(circ(50, 50, 40), { fill: 'light' });

export const STORY: Record<StoryName, (k: K) => string> = {
  madPlan: todo, swiftWind: todo, greekFire: todo, tritonSword: todo, treasury: todo, heartChest: todo, soulService: todo, dive: todo,
  legendJack: todo, legendBottle: todo, legendArmada: todo, legendKraken: todo,
};
