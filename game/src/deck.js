// Deck, hand and discard handling: shuffle with the seeded random source,
// draw with reshuffle from the discard pile when the deck runs dry.
import { buildDeckList, cardById } from './cards.js';

export function createDeck(random) {
  const ids = buildDeckList();
  for (let i = ids.length - 1; i > 0; i -= 1) {
    const j = random.int(i + 1);
    [ids[i], ids[j]] = [ids[j], ids[i]];
  }
  return ids.map((id) => ({ uid: `${id}-${Math.floor(random.next() * 1e9)}`, ...cardById(id) }));
}

export function drawCards(side, count, log) {
  let drawn = 0;
  for (let i = 0; i < count; i += 1) {
    if (side.deck.length === 0) {
      if (side.discard.length === 0) break;
      side.deck = side.discard;
      side.discard = [];
      for (let a = side.deck.length - 1; a > 0; a -= 1) {
        const b = Math.floor(Math.random() * (a + 1));
        [side.deck[a], side.deck[b]] = [side.deck[b], side.deck[a]];
      }
      log.push(`${side.name} mengocok ulang tumpukan buangan.`);
    }
    side.hand.push(side.deck.pop());
    drawn += 1;
  }
  return drawn;
}
