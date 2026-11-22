// Mouse + keyboard input, in logical 1280x720 stage coordinates.
// Clicks are reported as actions; the main loop decides what they mean.
import { STAGE_W, STAGE_H } from './render.js';

export const ACTION_CONFIRM = 1 << 0; // Space / Enter / click on a button
export const ACTION_END_TURN = 1 << 1;

export function createInput(canvas, renderer, getState) {
  let actions = 0;
  let clickedCardUid = null;
  let hoverUid = null;

  function toStage(event) {
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((event.clientX - rect.left) / rect.width) * STAGE_W,
      y: ((event.clientY - rect.top) / rect.height) * STAGE_H,
    };
  }

  function inside(point, rect) {
    return rect && point.x >= rect.x && point.x <= rect.x + rect.w && point.y >= rect.y && point.y <= rect.y + rect.h;
  }

  canvas.addEventListener('mousemove', (event) => {
    const point = toStage(event);
    const regions = renderer.hitRegions(getState().game, getState().screen);
    hoverUid = null;
    for (const card of regions.cards) {
      if (inside(point, card)) hoverUid = card.uid;
    }
    renderer.setHover(hoverUid);
    canvas.style.cursor = hoverUid ? 'pointer' : 'default';
  });

  canvas.addEventListener('click', (event) => {
    const point = toStage(event);
    const { game, screen } = getState();
    const regions = renderer.hitRegions(game, screen);
    for (const card of regions.cards) {
      if (inside(point, card)) {
        clickedCardUid = card.uid;
        return;
      }
    }
    if (inside(point, regions.endTurn)) actions |= ACTION_END_TURN;
    else if (inside(point, regions.start)) actions |= ACTION_CONFIRM;
    else if (inside(point, regions.again)) actions |= ACTION_CONFIRM;
    else if (screen === 'title' || screen === 'over') actions |= ACTION_CONFIRM;
  });

  window.addEventListener('keydown', (event) => {
    if (event.repeat) return;
    if (event.code === 'Space' || event.code === 'Enter') {
      event.preventDefault();
      actions |= ACTION_CONFIRM;
    } else if (event.code === 'KeyR') {
      actions |= ACTION_CONFIRM;
    } else if (/^Digit[1-7]$/.test(event.code)) {
      const index = Number(event.code.slice(5)) - 1;
      const { game } = getState();
      if (game.player.hand[index]) clickedCardUid = game.player.hand[index].uid;
    }
  });

  return {
    takeActions() {
      const taken = actions;
      actions = 0;
      return taken;
    },
    takeClickedCard() {
      const uid = clickedCardUid;
      clickedCardUid = null;
      return uid;
    },
  };
}
