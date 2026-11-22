// The screenshot scenes behind ?shot=title|play|win|loss.
// Each one plays the real rules forward from a fresh game, steered by the
// same autopilot that drives the AI, so every frame is what a real game
// looks like and the same seed always gives the same frame.
import { SCREEN_OVER, SCREEN_PLAY, SCREEN_TITLE } from './render.js';
import { playCard, endPlayerTurn, startGame, updateGame } from './state.js';
import { chooseAiPlays, autopilotPlays } from './ai.js';

const MAX_ROUNDS = 30;

/** Play one full player turn with the autopilot, then let the AI answer. */
function playRound(game) {
  const plays = autopilotPlays(game.player, game.ai, game.random);
  for (const uid of plays) {
    if (game.phase === 'over') return;
    playCard(game, game.player, uid);
  }
  if (game.phase === 'over') return;
  endPlayerTurn(game);
  let guard = 0;
  while (game.phase === 'ai' && guard < 200) {
    updateGame(game, 1);
    guard += 1;
  }
}

/**
 * Set `game` to the named scene and return the screen to draw over it.
 * - title: fresh game, title screen.
 * - play: four real rounds in, mid-table with full hands and a log.
 * - win: the autopilot wins; the AI passes every turn.
 * - loss: the player passes every turn while the AI plays its best.
 */
export function stageShot(name, game) {
  if (name === 'title') return { screen: SCREEN_TITLE };
  startGame(game);
  if (name === 'play') {
    for (let round = 0; round < 2 && game.phase !== 'over'; round += 1) playRound(game);
    // Start one more round and play two cards so the table shows action.
    if (game.phase === 'player') {
      const plays = autopilotPlays(game.player, game.ai, game.random).slice(0, 2);
      for (const uid of plays) playCard(game, game.player, uid);
    }
    return { screen: SCREEN_PLAY };
  }
  if (name === 'win') {
    // The AI passes: its plays are discarded, so the autopilot wins outright.
    for (let round = 0; round < MAX_ROUNDS && game.phase !== 'over'; round += 1) {
      const plays = autopilotPlays(game.player, game.ai, game.random);
      for (const uid of plays) {
        if (game.phase === 'over') break;
        playCard(game, game.player, uid);
      }
      if (game.phase === 'over') break;
      game.player.chainElement = null;
      game.player.chainCount = 0;
      game.phase = 'ai';
      game.aiQueue = [];
      updateGame(game, 1);
    }
    return { screen: game.phase === 'over' ? SCREEN_OVER : SCREEN_PLAY };
  }
  if (name === 'loss') {
    // The player passes every turn while the AI plays its best cards.
    for (let round = 0; round < MAX_ROUNDS && game.phase !== 'over'; round += 1) {
      game.player.chainElement = null;
      game.player.chainCount = 0;
      game.phase = 'ai';
      game.aiQueue = chooseAiPlays(game.ai, game.player, game.random, 1);
      let guard = 0;
      while (game.phase === 'ai' && guard < 200) {
        updateGame(game, 1);
        guard += 1;
      }
    }
    return { screen: game.phase === 'over' ? SCREEN_OVER : SCREEN_PLAY };
  }
  return { screen: SCREEN_TITLE };
}
