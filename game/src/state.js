// The duel itself: rounds, energy, playing cards, damage, block, combos,
// element advantage, and the win/loss conditions. No rendering or input here.
import { ELEMENTS } from './cards.js';
import { createDeck, drawCards } from './deck.js';
import { chooseAiPlays } from './ai.js';

export const MAX_LIFE = 20;
export const START_HAND = 5;
export const DRAW_PER_ROUND = 2;
export const MAX_ENERGY = 10;

function createSide(name, random) {
  return {
    name,
    life: MAX_LIFE,
    block: 0,
    energy: 0,
    hand: [],
    deck: createDeck(random),
    discard: [],
    guard: null, // element of the last hero this side played
    chainElement: null, // element of the last card this side played this turn
    chainCount: 0,
  };
}

export function createGame(random) {
  const game = {
    random,
    round: 1,
    phase: 'title', // title | player | ai | over
    player: createSide('Kamu', random),
    ai: createSide('Dalang Seta', random),
    log: ['Selamat datang di panggung wayang.'],
    winner: null, // 'player' | 'ai'
    lastPlayed: { player: null, ai: null },
    floats: [], // {x, y, text, color, born, life}
    aiQueue: [], // uids the AI still has to play, one per beat
    aiTimer: 0,
    roundsPlayed: 0,
    damageDealt: { player: 0, ai: 0 },
    cardsPlayed: { player: 0, ai: 0 },
    startedAt: Date.now(),
  };
  drawCards(game.player, START_HAND, game.log);
  drawCards(game.ai, START_HAND, game.log);
  game.player.energy = 3;
  game.ai.energy = 3;
  return game;
}

export function startGame(game) {
  game.phase = 'player';
  game.log.push('Ronde 1 — giliranmu. Mainkan kartumu, lalu akhiri giliran.');
}

function addFloat(game, side, text, color) {
  game.floats.push({
    x: 580,
    y: side === 'player' ? 470 : 130,
    text,
    color,
    born: performance.now(),
    life: 1100,
  });
}

function dealDamage(game, attacker, defender, amount, label) {
  let rest = amount;
  let absorbed = 0;
  if (defender.block > 0) {
    absorbed = Math.min(defender.block, rest);
    defender.block -= absorbed;
    rest -= absorbed;
  }
  defender.life = Math.max(0, defender.life - rest);
  game.damageDealt[attacker === game.player ? 'player' : 'ai'] += rest;
  game.log.push(`${label}: ${rest} luka${absorbed > 0 ? ` (${absorbed} ditahan perisai)` : ''}.`);
  addFloat(game, defender === game.player ? 'player' : 'ai', `-${rest}`, '#ff6b6b');
  if (defender.life <= 0) {
    game.phase = 'over';
    game.winner = attacker === game.player ? 'player' : 'ai';
    game.log.push(attacker === game.player ? 'Dalang Seta tumbang. Kamu menang!' : 'Nyawamu habis. Dalang Seta menang.');
  }
}

// Resolve one played card. Returns false when the card cannot be played.
export function playCard(game, side, uid) {
  if (game.phase !== 'player' && side === game.player) return false;
  if (game.phase !== 'ai' && side === game.ai) return false;
  const foe = side === game.player ? game.ai : game.player;
  const index = side.hand.findIndex((card) => card.uid === uid);
  if (index === -1) return false;
  const card = side.hand[index];
  if (card.cost > side.energy) return false;

  side.energy -= card.cost;
  side.hand.splice(index, 1);
  side.discard.push(card);
  game.lastPlayed[side === game.player ? 'player' : 'ai'] = card;
  game.cardsPlayed[side === game.player ? 'player' : 'ai'] += 1;

  const element = ELEMENTS[card.element];
  let combo = 0;
  if (side.chainElement === card.element) {
    side.chainCount += 1;
    combo = 1;
  } else {
    side.chainElement = card.element;
    side.chainCount = 1;
  }
  let advantage = 0;
  if (foe.guard && element.beats === foe.guard) advantage = 2;

  const parts = [`${side.name} memainkan ${card.name}`];
  if (card.kind === 'hero') {
    side.guard = card.element;
    let damage = card.atk + advantage + combo;
    parts.push(`— ${damage} luka`);
    if (advantage > 0) parts.push('(elemen unggul +2)');
    if (combo > 0) parts.push('(kombo +1)');
    game.log.push(parts.join(' '));
    dealDamage(game, side, foe, damage, `${card.name} menyerang`);
  } else {
    if (card.damage) {
      const damage = card.damage + advantage + combo;
      parts.push(`— ${damage} luka`);
      if (advantage > 0) parts.push('(elemen unggul +2)');
      if (combo > 0) parts.push('(kombo +1)');
      game.log.push(parts.join(' '));
      dealDamage(game, side, foe, damage, card.name);
    } else {
      game.log.push(parts.join(' '));
    }
  }
  if (game.phase === 'over') return true;
  if (card.block) {
    side.block += card.block;
    game.log.push(`${side.name} mendapat +${card.block} perisai.`);
    addFloat(game, side === game.player ? 'player' : 'ai', `+${card.block} 🛡`, '#8ec2ff');
  }
  if (card.heal) {
    const healed = Math.min(card.heal, MAX_LIFE - side.life);
    side.life += healed;
    game.log.push(`${side.name} pulih ${healed} nyawa.`);
    addFloat(game, side === game.player ? 'player' : 'ai', `+${healed} ❤`, '#7de8a0');
  }
  if (card.draw) {
    const drawn = drawCards(side, card.draw, game.log);
    if (drawn > 0) game.log.push(`${side.name} mengambil ${drawn} kartu.`);
  }
  if (card.energy) {
    side.energy = Math.min(MAX_ENERGY, side.energy + card.energy);
    game.log.push(`${side.name} mendapat +${card.energy} energi.`);
  }
  return true;
}

export function endPlayerTurn(game) {
  if (game.phase !== 'player') return;
  game.player.chainElement = null;
  game.player.chainCount = 0;
  game.aiQueue = chooseAiPlays(game.ai, game.player, game.random, 0.92);
  game.aiTimer = 0.55;
  game.phase = 'ai';
  game.log.push('Dalang Seta berpikir…');
}

// Advance the AI's queued plays, one per beat. dt is seconds.
export function updateGame(game, dt) {
  const now = performance.now();
  game.floats = game.floats.filter((float) => now - float.born < float.life);
  if (game.phase !== 'ai') return;
  game.aiTimer -= dt;
  if (game.aiTimer > 0) return;
  const uid = game.aiQueue.shift();
  if (uid === undefined) {
    startNextRound(game);
    return;
  }
  playCard(game, game.ai, uid);
  game.aiTimer = 0.65;
}

function startNextRound(game) {
  if (game.phase === 'over') return;
  game.round += 1;
  game.roundsPlayed += 1;
  game.ai.chainElement = null;
  game.ai.chainCount = 0;
  game.player.block = 0;
  game.ai.block = 0;
  const energy = Math.min(MAX_ENERGY, 2 + game.round);
  game.player.energy = energy;
  game.ai.energy = energy;
  drawCards(game.player, DRAW_PER_ROUND, game.log);
  drawCards(game.ai, DRAW_PER_ROUND, game.log);
  game.phase = 'player';
  game.log.push(`Ronde ${game.round} — giliranmu. Energi ${energy}.`);
}

export function resetGame(game) {
  const fresh = createGame(game.random);
  Object.assign(game, fresh);
  game.startedAt = Date.now();
}
