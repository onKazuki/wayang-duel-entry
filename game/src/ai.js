// The dalang's mind: the AI opponent picks its plays each round.
// It reads the table — its own life, the player's guard element, its energy —
// and favours advantage hits, healing when hurt, shields when threatened, and
// same-element chains for the combo bonus. It never sees the player's hand.
import { ELEMENTS } from './cards.js';

// Score one card in the AI's hand, given the table. Higher is better to play now.
function scoreCard(card, ai, foe) {
  let score = 0;
  const foeGuard = foe.guard ? ELEMENTS[foe.guard] : null;
  if (card.kind === 'hero') {
    score += card.atk * 2;
    if (foeGuard && ELEMENTS[card.element].beats === foeGuard.id) score += 5; // advantage hit
    if (card.heal && ai.life <= 10) score += card.heal * 3;
    if (card.block) score += card.block;
    if (card.draw) score += 2;
  } else {
    if (card.damage) {
      score += card.damage * 2;
      if (foeGuard && ELEMENTS[card.element].beats === foeGuard.id) score += 4;
    }
    if (card.block && ai.life <= 12) score += card.block * 1.5;
    if (card.block && ai.life > 12) score += 1;
    if (card.draw) score += 3;
    if (card.energy) score += 4;
    if (card.heal && ai.life <= 10) score += card.heal * 3;
  }
  score -= card.cost * 1.2; // prefer cheap value
  return score;
}

// Choose the AI's plays for one turn: greedily take the best-value card it can
// afford, then re-score the rest, until energy runs out or nothing is worth it.
// `skill` 0..1 scales how often it takes the best card (1 = always best).
export function chooseAiPlays(ai, foe, random, skill = 1) {
  const plays = [];
  let energy = ai.energy;
  const hand = [...ai.hand];
  let lastElement = null;
  while (true) {
    const affordable = hand.map((card, index) => ({ card, index, score: scoreCard(card, ai, foe) }))
      .filter((entry) => entry.card.cost <= energy && entry.score > 0);
    if (affordable.length === 0) break;
    affordable.sort((a, b) => b.score - a.score);
    let pick = affordable[0];
    if (skill < 1 && affordable.length > 1 && random.next() > skill) pick = affordable[1];
    if (lastElement === pick.card.element) pick.score += 2; // chain bonus
    plays.push(pick.card.uid);
    energy -= pick.card.cost;
    hand.splice(pick.index, 1);
    lastElement = pick.card.element;
    if (plays.length >= 6) break;
  }
  return plays;
}

// The autopilot that stages screenshot scenes and drives play-tests: it plays
// the best-value cards for `side` until energy runs out.
export function autopilotPlays(side, foe, random) {
  return chooseAiPlays(side, foe, random, 1);
}
