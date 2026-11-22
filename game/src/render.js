// All drawing: the wayang stage, the table, the cards, and the four screens
// (title, table, win, loss). Everything is drawn in code on one canvas —
// no image assets. The logical stage is 1280x720 and scales to the window.
import { ELEMENTS } from './cards.js';
import { MAX_LIFE, MAX_ENERGY } from './state.js';

export const SCREEN_TITLE = 'title';
export const SCREEN_PLAY = 'play';
export const SCREEN_OVER = 'over';

export const STAGE_W = 1280;
export const STAGE_H = 720;
const CARD_W = 148;
const CARD_H = 208;
const CARD_GAP = 14;

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function drawElementShape(ctx, element, cx, cy, size) {
  ctx.fillStyle = element.color;
  ctx.beginPath();
  if (element.shape === 'triangle') {
    ctx.moveTo(cx, cy - size);
    ctx.lineTo(cx + size, cy + size * 0.8);
    ctx.lineTo(cx - size, cy + size * 0.8);
  } else if (element.shape === 'circle') {
    ctx.arc(cx, cy, size, 0, Math.PI * 2);
  } else if (element.shape === 'square') {
    ctx.rect(cx - size * 0.85, cy - size * 0.85, size * 1.7, size * 1.7);
  } else {
    ctx.moveTo(cx, cy - size);
    ctx.lineTo(cx + size, cy);
    ctx.lineTo(cx, cy + size);
    ctx.lineTo(cx - size, cy);
  }
  ctx.closePath();
  ctx.fill();
}

// A stylised wayang puppet silhouette, drawn from the card's element colour.
function drawPuppet(ctx, card, cx, cy, scale) {
  const element = ELEMENTS[card.element];
  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(scale, scale);
  ctx.fillStyle = element.dark;
  ctx.beginPath(); // tall headdress
  ctx.moveTo(-14, -52);
  ctx.lineTo(0, -86);
  ctx.lineTo(14, -52);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = element.color;
  ctx.beginPath(); // head
  ctx.arc(0, -38, 20, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#f7ead0';
  ctx.beginPath(); // face profile
  ctx.moveTo(-4, -52);
  ctx.lineTo(16, -44);
  ctx.lineTo(14, -30);
  ctx.lineTo(-4, -26);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = element.dark;
  ctx.fillRect(-6, -40, 7, 2); // eye
  ctx.fillStyle = element.color;
  ctx.beginPath(); // shoulders / body
  ctx.moveTo(-26, 46);
  ctx.quadraticCurveTo(-30, -8, -12, -14);
  ctx.lineTo(12, -14);
  ctx.quadraticCurveTo(30, -8, 26, 46);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#f7ead0';
  ctx.lineWidth = 2;
  ctx.beginPath(); // chest ornament
  ctx.moveTo(-14, 6);
  ctx.lineTo(0, 22);
  ctx.lineTo(14, 6);
  ctx.stroke();
  ctx.restore();
}

function drawLifeBar(ctx, x, y, w, life, max, label, alignRight) {
  ctx.save();
  ctx.font = 'bold 20px Georgia, serif';
  ctx.fillStyle = '#f7ead0';
  ctx.textAlign = alignRight ? 'right' : 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(label, alignRight ? x + w : x, y - 16);
  ctx.fillStyle = '#241a12';
  roundRect(ctx, x, y, w, 22, 6);
  ctx.fill();
  const ratio = Math.max(0, life / max);
  const grad = ctx.createLinearGradient(x, y, x + w, y);
  grad.addColorStop(0, '#e5484d');
  grad.addColorStop(1, '#ff8a5c');
  ctx.fillStyle = ratio > 0.25 ? grad : '#e5484d';
  if (ratio > 0) {
    roundRect(ctx, x + 2, y + 2, (w - 4) * ratio, 18, 5);
    ctx.fill();
  }
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 17px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.fillText(`${life} / ${max}`, x + w / 2, y + 12);
  ctx.restore();
}

function drawCard(ctx, card, x, y, w, h, options = {}) {
  const element = ELEMENTS[card.element];
  const hovered = options.hovered === true;
  const dimmed = options.dimmed === true;
  const scale = w / CARD_W;
  ctx.save();
  if (hovered) ctx.translate(0, -14);
  ctx.shadowColor = 'rgba(0,0,0,0.5)';
  ctx.shadowBlur = hovered ? 16 : 8;
  ctx.shadowOffsetY = 4;
  ctx.fillStyle = '#f7ead0';
  roundRect(ctx, x, y, w, h, 10 * scale);
  ctx.fill();
  ctx.shadowColor = 'transparent';
  ctx.lineWidth = 3 * scale;
  ctx.strokeStyle = element.color;
  ctx.stroke();
  ctx.fillStyle = element.color;
  roundRect(ctx, x, y, w, 34 * scale, 10 * scale);
  ctx.fill();
  ctx.fillRect(x, y + 24 * scale, w, 10 * scale);
  // Element glyph + name in the top band.
  drawElementShape(ctx, element, x + 18 * scale, y + 17 * scale, 9 * scale);
  ctx.fillStyle = '#fff8e8';
  ctx.font = `bold ${15 * scale}px Georgia, serif`;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(element.name.toUpperCase(), x + 32 * scale, y + 18 * scale);
  // Cost gem.
  ctx.fillStyle = '#b8860b';
  ctx.beginPath();
  ctx.arc(x + w - 18 * scale, y + 17 * scale, 13 * scale, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#fff2c0';
  ctx.lineWidth = 2 * scale;
  ctx.stroke();
  ctx.fillStyle = '#fff8e8';
  ctx.font = `bold ${16 * scale}px Georgia, serif`;
  ctx.textAlign = 'center';
  ctx.fillText(String(card.cost), x + w - 18 * scale, y + 18 * scale);
  // Puppet art.
  drawPuppet(ctx, card, x + w / 2, y + 96 * scale, scale * 0.9);
  // Name.
  ctx.fillStyle = '#241a12';
  ctx.font = `bold ${17 * scale}px Georgia, serif`;
  ctx.textAlign = 'center';
  ctx.fillText(card.name, x + w / 2, y + 152 * scale, w - 12 * scale);
  // Values: attack for heroes, effect for actions.
  ctx.font = `bold ${20 * scale}px Georgia, serif`;
  if (card.kind === 'hero') {
    ctx.fillStyle = '#a31218';
    ctx.textAlign = 'left';
    ctx.fillText(`⚔ ${card.atk}`, x + 12 * scale, y + 180 * scale);
    if (card.block) {
      ctx.fillStyle = '#174a80';
      ctx.textAlign = 'right';
      ctx.fillText(`🛡 ${card.block}`, x + w - 12 * scale, y + 180 * scale);
    }
  } else {
    ctx.fillStyle = '#5c3a10';
    ctx.textAlign = 'center';
    ctx.fillText(card.damage ? `⚔ ${card.damage}` : card.block ? `🛡 ${card.block}` : '✦', x + w / 2, y + 180 * scale);
  }
  // Rules text.
  ctx.fillStyle = '#5c3a10';
  ctx.font = `${12.5 * scale}px Georgia, serif`;
  ctx.textAlign = 'center';
  ctx.fillText(card.text, x + w / 2, y + h - 12 * scale, w - 14 * scale);
  if (dimmed) {
    ctx.fillStyle = 'rgba(20,12,6,0.55)';
    roundRect(ctx, x, y, w, h, 10 * scale);
    ctx.fill();
  }
  ctx.restore();
}

function drawCardBack(ctx, x, y, w, h) {
  ctx.save();
  ctx.fillStyle = '#5c1a1a';
  roundRect(ctx, x, y, w, h, 8);
  ctx.fill();
  ctx.strokeStyle = '#d4a017';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.strokeStyle = '#d4a017';
  ctx.lineWidth = 1;
  roundRect(ctx, x + 6, y + 6, w - 12, h - 12, 6);
  ctx.stroke();
  drawElementShape(ctx, ELEMENTS.api, x + w / 2, y + h / 2 - 6, 12);
  ctx.fillStyle = '#d4a017';
  ctx.font = 'bold 10px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.fillText('WAYANG', x + w / 2, y + h - 14);
  ctx.restore();
}

function drawStage(ctx) {
  const grad = ctx.createLinearGradient(0, 0, 0, STAGE_H);
  grad.addColorStop(0, '#1c130c');
  grad.addColorStop(0.5, '#2b1d12');
  grad.addColorStop(1, '#17100a');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, STAGE_W, STAGE_H);
  // The kelir (wayang screen): a warm glowing screen behind the centre.
  const glow = ctx.createRadialGradient(640, 330, 60, 640, 330, 520);
  glow.addColorStop(0, 'rgba(255, 214, 130, 0.20)');
  glow.addColorStop(1, 'rgba(255, 214, 130, 0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, STAGE_W, STAGE_H);
  // Decorative border.
  ctx.strokeStyle = '#8a6a2f';
  ctx.lineWidth = 4;
  ctx.strokeRect(6, 6, STAGE_W - 12, STAGE_H - 12);
  ctx.strokeStyle = 'rgba(212, 160, 23, 0.5)';
  ctx.lineWidth = 1;
  ctx.strokeRect(14, 14, STAGE_W - 28, STAGE_H - 28);
}

function drawTopBar(ctx, game) {
  ctx.save();
  ctx.fillStyle = '#f7ead0';
  ctx.font = 'bold 24px Georgia, serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText('WAYANG DUEL', 28, 36);
  ctx.font = '15px Georgia, serif';
  ctx.fillStyle = '#d8c49a';
  ctx.textAlign = 'center';
  ctx.fillText(`Ronde ${game.round}`, 640, 36);
  ctx.textAlign = 'right';
  ctx.fillText(`Kartu di dek: ${game.player.deck.length}`, 1252, 36);
  ctx.restore();
}

function drawEnergy(ctx, energy, max) {
  ctx.save();
  ctx.fillStyle = '#f7ead0';
  ctx.font = 'bold 16px Georgia, serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText('Energi', 28, 470);
  for (let i = 0; i < max; i += 1) {
    const x = 100 + i * 24;
    ctx.beginPath();
    ctx.arc(x, 470, 9, 0, Math.PI * 2);
    ctx.fillStyle = i < energy ? '#ffd166' : '#3a2c1c';
    ctx.fill();
    ctx.strokeStyle = '#d4a017';
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }
  ctx.restore();
}

function drawLog(ctx, game) {
  ctx.save();
  const x = 1010;
  const y = 210;
  const w = 244;
  const h = 196;
  ctx.fillStyle = 'rgba(12, 8, 4, 0.72)';
  roundRect(ctx, x, y, w, h, 8);
  ctx.fill();
  ctx.strokeStyle = '#8a6a2f';
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.fillStyle = '#d4a017';
  ctx.font = 'bold 14px Georgia, serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillText('— JALAN CERITA —', x + 12, y + 10);
  ctx.font = '13px Georgia, serif';
  ctx.fillStyle = '#e8dcc0';
  const lines = game.log.slice(-7);
  lines.forEach((line, i) => {
    ctx.fillText(line, x + 12, y + 34 + i * 22, w - 24);
  });
  ctx.restore();
}

function drawGuardBadge(ctx, game) {
  ctx.save();
  const drawOne = (side, x, y) => {
    if (!side.guard) return;
    const element = ELEMENTS[side.guard];
    ctx.fillStyle = 'rgba(12, 8, 4, 0.72)';
    roundRect(ctx, x, y, 172, 30, 6);
    ctx.fill();
    drawElementShape(ctx, element, x + 18, y + 15, 8);
    ctx.fillStyle = '#f7ead0';
    ctx.font = 'bold 13px Georgia, serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(`Penjaga: ${element.name}`, x + 32, y + 16);
  };
  drawOne(game.ai, 300, 92);
  drawOne(game.player, 300, 436);
  ctx.restore();
}

function drawTable(ctx, game, hoverUid) {
  drawStage(ctx);
  drawTopBar(ctx, game);
  // Opponent: life bar left, hand of backs right.
  drawLifeBar(ctx, 28, 96, 260, game.ai.life, MAX_LIFE, 'Dalang Seta', false);
  if (game.ai.block > 0) {
    ctx.save();
    ctx.fillStyle = '#8ec2ff';
    ctx.font = 'bold 16px Georgia, serif';
    ctx.textAlign = 'left';
    ctx.fillText(`🛡 ${game.ai.block}`, 486, 108);
    ctx.restore();
  }
  const backW = 52;
  const backH = 76;
  const backs = Math.min(game.ai.hand.length, 7);
  const backsX = 1252 - backs * (backW + 6);
  for (let i = 0; i < backs; i += 1) {
    drawCardBack(ctx, backsX + i * (backW + 6), 76, backW, backH);
  }
  drawGuardBadge(ctx, game);
  // Centre: the two last-played cards face each other across the screen.
  ctx.save();
  ctx.fillStyle = '#d8c49a';
  ctx.font = 'italic 15px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.fillText('~ layar kelir ~', 640, 196);
  ctx.restore();
  const centreY = 224;
  if (game.lastPlayed.ai) {
    drawCard(ctx, game.lastPlayed.ai, 520, centreY, 110, 154, {});
    ctx.save();
    ctx.fillStyle = '#d8c49a';
    ctx.font = 'bold 13px Georgia, serif';
    ctx.textAlign = 'center';
    ctx.fillText('DALANG', 575, centreY - 14);
    ctx.restore();
  }
  if (game.lastPlayed.player) {
    drawCard(ctx, game.lastPlayed.player, 660, centreY, 110, 154, {});
    ctx.save();
    ctx.fillStyle = '#ffd166';
    ctx.font = 'bold 13px Georgia, serif';
    ctx.textAlign = 'center';
    ctx.fillText('KAMU', 715, centreY - 14);
    ctx.restore();
  }
  if (!game.lastPlayed.ai && !game.lastPlayed.player) {
    ctx.save();
    ctx.fillStyle = '#8a6a2f';
    ctx.font = 'italic 18px Georgia, serif';
    ctx.textAlign = 'center';
    ctx.fillText('Belum ada kartu dimainkan — giliranmu.', 640, 300);
    ctx.restore();
  }
  drawLog(ctx, game);
  // Player: life bar, block, energy, hand.
  drawLifeBar(ctx, 28, 440, 260, game.player.life, MAX_LIFE, 'Kamu', false);
  if (game.player.block > 0) {
    ctx.save();
    ctx.fillStyle = '#8ec2ff';
    ctx.font = 'bold 16px Georgia, serif';
    ctx.textAlign = 'left';
    ctx.fillText(`🛡 ${game.player.block}`, 486, 452);
    ctx.restore();
  }
  drawEnergy(ctx, game.player.energy, MAX_ENERGY);
  if (game.player.chainCount >= 2) {
    ctx.save();
    ctx.fillStyle = '#ffd166';
    ctx.font = 'bold 16px Georgia, serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(`KOMBO ${ELEMENTS[game.player.chainElement].name} ×${game.player.chainCount}!`, 340, 472);
    ctx.restore();
  }
  // The hand lives in the 28..1088 strip so it never slides under the
  // End Turn button; it shrinks its cards when it grows past that width.
  const hand = game.player.hand;
  const cardGap = hand.length > 7 ? 10 : CARD_GAP;
  const HAND_MAX_W = 1060;
  let cardW = CARD_W;
  let totalW = hand.length * cardW + (hand.length - 1) * cardGap;
  if (totalW > HAND_MAX_W) {
    cardW = Math.floor((HAND_MAX_W - (hand.length - 1) * cardGap) / hand.length);
    totalW = hand.length * cardW + (hand.length - 1) * cardGap;
  }
  const cardH = Math.round((cardW * CARD_H) / CARD_W);
  const startX = 28 + (HAND_MAX_W - totalW) / 2;
  const handY = 496 + (CARD_H - cardH);
  hand.forEach((card, i) => {
    const x = startX + i * (cardW + cardGap);
    drawCard(ctx, card, x, handY, cardW, cardH, {
      hovered: hoverUid === card.uid,
      dimmed: game.phase === 'player' && card.cost > game.player.energy,
    });
  });
  // End turn button.
  const btn = { x: 1090, y: 640, w: 162, h: 52 };
  ctx.save();
  ctx.fillStyle = game.phase === 'player' ? '#c98a2b' : '#4a3a26';
  roundRect(ctx, btn.x, btn.y, btn.w, btn.h, 10);
  ctx.fill();
  ctx.strokeStyle = '#ffd166';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillStyle = '#fff8e8';
  ctx.font = 'bold 18px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(game.phase === 'ai' ? 'Dalang main…' : 'Akhiri Giliran ⏎', btn.x + btn.w / 2, btn.y + btn.h / 2 + 1);
  ctx.restore();
  // Floating damage / heal numbers. Concurrent ones spread sideways so two
  // events in one beat never print on top of each other.
  const now = performance.now();
  const alive = game.floats.filter((float) => now - float.born < float.life);
  alive.forEach((float, index) => {
    const age = (now - float.born) / float.life;
    const spread = (index - (alive.length - 1) / 2) * 64;
    ctx.save();
    ctx.globalAlpha = 1 - age;
    ctx.fillStyle = float.color;
    ctx.font = 'bold 30px Georgia, serif';
    ctx.textAlign = 'center';
    ctx.fillText(float.text, float.x + spread, float.y - age * 46);
    ctx.restore();
  });
  return { endTurn: btn, handStartX: startX, handY, cardW, cardGap, cardH };
}

function drawTitle(ctx, game) {
  drawStage(ctx);
  // Decorative fan of cards behind the title.
  const fan = [
    { id: 'arjuna', name: 'Arjuna', kind: 'hero', element: 'api', cost: 3, atk: 4, text: 'Panah api menembus 4.' },
    { id: 'semar', name: 'Semar', kind: 'hero', element: 'air', cost: 2, atk: 2, heal: 2, text: '2 luka, pulih 2 nyawa.' },
    { id: 'srikandi', name: 'Srikandi', kind: 'hero', element: 'angin', cost: 2, atk: 3, text: 'Panah angin cepat: 3 luka.' },
    { id: 'bima', name: 'Bima', kind: 'hero', element: 'tanah', cost: 4, atk: 5, text: 'Gada raksasa: 5 luka.' },
  ];
  ctx.save();
  fan.forEach((card, i) => {
    ctx.save();
    ctx.translate(640 + (i - 1.5) * 170, 470);
    ctx.rotate((i - 1.5) * 0.1);
    ctx.translate(-74, -104);
    drawCard(ctx, card, 0, 0, CARD_W, CARD_H, {});
    ctx.restore();
  });
  ctx.restore();
  ctx.save();
  ctx.fillStyle = 'rgba(12, 8, 4, 0.55)';
  ctx.fillRect(0, 96, STAGE_W, 190);
  ctx.fillStyle = '#ffd166';
  ctx.font = 'bold 84px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('WAYANG DUEL', 640, 168);
  ctx.fillStyle = '#f7ead0';
  ctx.font = 'italic 26px Georgia, serif';
  ctx.fillText('Duel kartu wayang — kamu melawan Dalang Seta', 640, 228);
  ctx.font = '18px Georgia, serif';
  ctx.fillStyle = '#d8c49a';
  ctx.fillText('20 nyawa • energi gamelan naik tiap ronde • elemen Api › Angin › Tanah › Air • kombo se-elemen +1', 640, 262);
  ctx.restore();
  ctx.save();
  ctx.fillStyle = '#c98a2b';
  roundRect(ctx, 520, 640, 240, 56, 12);
  ctx.fill();
  ctx.strokeStyle = '#ffd166';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillStyle = '#fff8e8';
  ctx.font = 'bold 22px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('▶  MULAI MAIN', 640, 669);
  ctx.restore();
}

function drawOver(ctx, game) {
  drawTable(ctx, game, null);
  const won = game.winner === 'player';
  ctx.save();
  ctx.fillStyle = 'rgba(12, 8, 4, 0.72)';
  ctx.fillRect(0, 0, STAGE_W, STAGE_H);
  ctx.fillStyle = won ? '#ffd166' : '#e5484d';
  ctx.font = 'bold 76px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(won ? '★ MENANG! ★' : 'KALAH', 640, 240);
  ctx.fillStyle = '#f7ead0';
  ctx.font = 'italic 26px Georgia, serif';
  ctx.fillText(
    won ? 'Dalang Seta tumbang — panggung ini milikmu!' : 'Dalang Seta memenangkan panggung kali ini.',
    640, 310,
  );
  ctx.font = '20px Georgia, serif';
  ctx.fillStyle = '#d8c49a';
  ctx.fillText(
    `Ronde ${game.round}  •  Kartu dimainkan: ${game.cardsPlayed.player}  •  Luka diberikan: ${game.damageDealt.player}`,
    640, 360,
  );
  ctx.fillStyle = '#c98a2b';
  roundRect(ctx, 520, 420, 240, 56, 12);
  ctx.fill();
  ctx.strokeStyle = '#ffd166';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillStyle = '#fff8e8';
  ctx.font = 'bold 22px Georgia, serif';
  ctx.fillText('↻  MAIN LAGI', 640, 449);
  ctx.restore();
}

export function createRenderer(canvas) {
  const ctx = canvas.getContext('2d');
  let hoverUid = null;
  let layout = { endTurn: null, handStartX: 0, handY: 0 };

  function fitCanvas() {
    const scale = Math.min(window.innerWidth / STAGE_W, window.innerHeight / STAGE_H);
    canvas.width = STAGE_W;
    canvas.height = STAGE_H;
    canvas.style.width = `${Math.floor(STAGE_W * scale)}px`;
    canvas.style.height = `${Math.floor(STAGE_H * scale)}px`;
  }

  return {
    fitCanvas,
    setHover(uid) {
      hoverUid = uid;
    },
    draw(game, screen) {
      fitCanvas();
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      if (screen === SCREEN_TITLE) {
        drawTitle(ctx, game);
        layout = { endTurn: null, handStartX: 0, handY: 0, start: { x: 520, y: 640, w: 240, h: 56 } };
      } else if (screen === SCREEN_OVER) {
        drawOver(ctx, game);
        layout = { endTurn: null, handStartX: 0, handY: 0, again: { x: 520, y: 420, w: 240, h: 56 } };
      } else {
        layout = drawTable(ctx, game, hoverUid);
      }
    },
    // Hit regions in logical 1280x720 coordinates, for the input layer.
    hitRegions(game, screen) {
      if (screen === SCREEN_TITLE) {
        return { start: layout.start ?? { x: 520, y: 640, w: 240, h: 56 }, cards: [], endTurn: null, again: null };
      }
      if (screen === SCREEN_OVER) {
        return { again: layout.again ?? { x: 520, y: 420, w: 240, h: 56 }, cards: [], endTurn: null, start: null };
      }
      const cards = game.player.hand.map((card, i) => ({
        uid: card.uid,
        x: layout.handStartX + i * (layout.cardW + layout.cardGap),
        y: layout.handY - (hoverUid === card.uid ? 14 : 0),
        w: layout.cardW,
        h: layout.cardH,
      }));
      return { cards, endTurn: layout.endTurn, start: null, again: null };
    },
  };
}
