// The card catalogue: every card in Wayang Duel, with its element, cost and effect.
// Elements are told apart by colour AND shape, never by text alone:
//   Api (fire)   - red    - triangle
//   Air (water)  - blue   - circle
//   Tanah (earth)- amber  - square
//   Angin (wind) - teal   - diamond
// Element advantage runs Api > Angin > Tanah > Air > Api: a hero whose element
// beats the other side's guard element deals +2 damage.

export const ELEMENTS = {
  api: { id: 'api', name: 'Api', color: '#e5484d', dark: '#7d1a1e', light: '#ff8a80', shape: 'triangle', beats: 'angin', glyph: '▲' },
  air: { id: 'air', name: 'Air', color: '#3e8fe8', dark: '#174a80', light: '#8ec2ff', shape: 'circle', beats: 'api', glyph: '●' },
  tanah: { id: 'tanah', name: 'Tanah', color: '#c98a2b', dark: '#6e4a12', light: '#ffcf7d', shape: 'square', beats: 'air', glyph: '■' },
  angin: { id: 'angin', name: 'Angin', color: '#2fbf9b', dark: '#0f5c48', light: '#7de8cf', shape: 'diamond', beats: 'tanah', glyph: '◆' },
};

// Heroes: original wayang figures of the old epics, drawn and named here from the
// public-domain stories, never from any commercial game.
export const HEROES = [
  { id: 'arjuna', name: 'Arjuna', kind: 'hero', element: 'api', cost: 3, atk: 4, text: 'Panah api menembus 4.' },
  { id: 'bima', name: 'Bima', kind: 'hero', element: 'tanah', cost: 4, atk: 5, text: 'Gada raksasa: 5 luka.' },
  { id: 'srikandi', name: 'Srikandi', kind: 'hero', element: 'angin', cost: 2, atk: 3, text: 'Panah angin cepat: 3 luka.' },
  { id: 'gatotkaca', name: 'Gatotkaca', kind: 'hero', element: 'tanah', cost: 4, atk: 4, block: 2, text: '4 luka, +2 perisai.' },
  { id: 'rahwana', name: 'Rahwana', kind: 'hero', element: 'api', cost: 5, atk: 6, text: 'Raja raksasa: 6 luka.' },
  { id: 'semar', name: 'Semar', kind: 'hero', element: 'air', cost: 2, atk: 2, heal: 2, text: '2 luka, pulih 2 nyawa.' },
  { id: 'hanoman', name: 'Hanoman', kind: 'hero', element: 'angin', cost: 3, atk: 4, text: 'Kera putih: 4 luka.' },
  { id: 'drupadi', name: 'Drupadi', kind: 'hero', element: 'air', cost: 3, atk: 3, draw: 1, text: '3 luka, ambil 1 kartu.' },
  { id: 'kresna', name: 'Kresna', kind: 'hero', element: 'api', cost: 3, atk: 3, block: 2, text: '3 luka, +2 perisai.' },
  { id: 'nakula', name: 'Nakula', kind: 'hero', element: 'tanah', cost: 2, atk: 3, text: 'Kembar pedang: 3 luka.' },
  { id: 'sadewa', name: 'Sadewa', kind: 'hero', element: 'air', cost: 1, atk: 2, text: 'Si bungsu: 2 luka.' },
  { id: 'kunti', name: 'Dewi Kunti', kind: 'hero', element: 'angin', cost: 2, atk: 2, heal: 3, text: '2 luka, pulih 3 nyawa.' },
];

// Actions: one-shot plays from the dalang's repertoire.
export const ACTIONS = [
  { id: 'keris', name: 'Keris Pusaka', kind: 'action', element: 'api', cost: 2, damage: 4, text: 'Tusuk keris: 4 luka.' },
  { id: 'gamelan', name: 'Perisai Gamelan', kind: 'action', element: 'tanah', cost: 2, block: 6, text: 'Gong berbunyi: +6 perisai.' },
  { id: 'topeng', name: 'Tari Topeng', kind: 'action', element: 'angin', cost: 1, draw: 2, text: 'Topeng menari: ambil 2 kartu.' },
  { id: 'bayangan', name: 'Bayangan', kind: 'action', element: 'air', cost: 2, damage: 2, draw: 1, text: '2 luka, ambil 1 kartu.' },
  { id: 'gending', name: 'Gending Rampak', kind: 'action', element: 'tanah', cost: 1, energy: 2, text: 'Irama cepat: +2 energi.' },
  { id: 'rangda', name: 'Topeng Rangda', kind: 'action', element: 'api', cost: 2, damage: 3, heal: 0, text: 'Topeng murka: 3 luka.' },
];

export const ALL_CARDS = [...HEROES, ...ACTIONS];

export function cardById(id) {
  return ALL_CARDS.find((card) => card.id === id) ?? null;
}

export function elementOf(card) {
  return ELEMENTS[card.element];
}

// A starting deck: one of each hero, two of each action. 24 cards.
export function buildDeckList() {
  const list = [];
  for (const hero of HEROES) list.push(hero.id);
  for (const action of ACTIONS) list.push(action.id, action.id);
  return list;
}
