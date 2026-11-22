// Boot and the one loop: input is read every frame, the AI's queued plays
// advance on a timer, and the renderer paints what is there. The game moves
// between three screens: title, table, and win/loss.
//
// ?seed=N fixes the shuffle. ?shot=title|play|win|loss (with &seed=N) stages
// that scene instead of running the loop, paints it twice and sets
// window.__shotReady for a screenshot.
import { createRandom } from './random.js';
import { createGame, startGame, playCard, endPlayerTurn, updateGame, resetGame } from './state.js';
import { ACTION_CONFIRM, ACTION_END_TURN, createInput } from './input.js';
import { createRenderer, SCREEN_OVER, SCREEN_PLAY, SCREEN_TITLE } from './render.js';
import { stageShot } from './shots.js';
import { autopilotPlays } from './ai.js';
import { unlockAudio, playCardSound, damageSound, shieldSound, endTurnSound, winSound, loseSound } from './audio.js';

const params = new URLSearchParams(window.location.search);
const shot = params.get('shot');
const seedParam = Number.parseInt(params.get('seed') ?? '', 10);
const seed = Number.isInteger(seedParam) ? seedParam : Math.floor(Math.random() * 4294967296);

const canvas = document.getElementById('game');
const status = document.getElementById('status');
const game = createGame(createRandom(seed));
const renderer = createRenderer(canvas);

let screen = SCREEN_TITLE;
let announcedWin = false;

function announce(message) {
  status.textContent = message;
}

function runShot(name) {
  const scene = stageShot(name, game);
  screen = scene.screen;
  let painted = 0;
  function paint() {
    renderer.draw(game, screen);
    painted += 1;
    if (painted < 2) requestAnimationFrame(paint);
    else {
      // One more paint after a beat: the viewport override lands after load
      // on some targets, and the canvas is sized from it — repaint once it
      // has settled so the frame fills the screenshot.
      setTimeout(() => {
        renderer.draw(game, screen);
        window.__shotReady = true;
      }, 500);
    }
  }
  requestAnimationFrame(paint);
}

function runGame() {
  const input = createInput(canvas, renderer, () => ({ game, screen }));
  let last = performance.now();

  function begin() {
    resetGame(game);
    startGame(game);
    screen = SCREEN_PLAY;
    announcedWin = false;
    announce(`Ronde 1. Nyawamu 20, Dalang Seta 20. Mainkan kartumu.`);
  }

  function handleActions() {
    const actions = input.takeActions();
    const clicked = input.takeClickedCard();
    if (clicked && screen === SCREEN_PLAY && game.phase === 'player') {
      const card = game.player.hand.find((c) => c.uid === clicked);
      if (card && card.cost <= game.player.energy) {
        const beforeLife = game.ai.life;
        const beforeBlock = game.ai.block;
        unlockAudio();
        if (playCard(game, game.player, clicked)) {
          if (card.damage || card.kind === 'hero') damageSound();
          else if (card.block) shieldSound();
          else playCardSound();
          if (game.ai.life < beforeLife || game.ai.block > beforeBlock) {
            announce(`${card.name} dimainkan. Dalang Seta: ${game.ai.life} nyawa.`);
          }
          if (game.phase === 'over') endDuel();
        }
      }
    }
    if (actions & ACTION_END_TURN && screen === SCREEN_PLAY && game.phase === 'player') {
      unlockAudio();
      endTurnSound();
      endPlayerTurn(game);
    }
    if (actions & ACTION_CONFIRM) {
      if (screen === SCREEN_TITLE) {
        unlockAudio();
        begin();
      } else if (screen === SCREEN_OVER) {
        unlockAudio();
        begin();
      } else if (screen === SCREEN_PLAY && game.phase === 'player') {
        endTurnSound();
        endPlayerTurn(game);
      }
    }
  }

  function endDuel() {
    screen = SCREEN_OVER;
    if (!announcedWin) {
      announcedWin = true;
      if (game.winner === 'player') {
        winSound();
        announce(`Menang! Dalang Seta tumbang di ronde ${game.round}. Tekan R untuk main lagi.`);
      } else {
        loseSound();
        announce(`Kalah. Dalang Seta menang di ronde ${game.round}. Tekan R untuk main lagi.`);
      }
    }
  }

  function frame(now) {
    requestAnimationFrame(frame);
    const dt = Math.min((now - last) / 1000, 0.25);
    last = now;
    handleActions();
    if (screen === SCREEN_PLAY) {
      updateGame(game, dt);
      if (game.phase === 'over') endDuel();
    }
    renderer.draw(game, screen);
  }

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) last = performance.now();
  });

  announce('Wayang Duel. Klik atau tekan Spasi untuk mulai.');
  requestAnimationFrame(frame);
}

// A handle for play-testing from the console or automation: the game's own
// input functions, nothing hidden.
window.__wayang = {
  game,
  get screen() {
    return screen;
  },
  start: () => {
    if (screen === SCREEN_TITLE || screen === SCREEN_OVER) {
      resetGame(game);
      startGame(game);
      screen = SCREEN_PLAY;
    }
  },
  playCard: (uid) => playCard(game, game.player, uid),
  endTurn: () => endPlayerTurn(game),
  // The same best-value autopilot the screenshot scenes use, for play-testing.
  autopilot: () => autopilotPlays(game.player, game.ai, game.random),
};

if (shot) runShot(shot);
else runGame();
