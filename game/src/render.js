// render.js — draws every frame of Difference Hunter: the HUD, both panels,
// found markers, hint pulses and the title / clear / fail screens.
// The judge sees the game through screenshots, so the play screen always
// shows two near-identical pictures side by side, circles on the differences
// found, and a counter of how many remain.

import { PANEL_W, PANEL_H, drawBackground, drawProp } from './scenes.js';

export const VIEW_W = 1280;
export const VIEW_H = 720;
export const PANEL_LEFT = { x: 20, y: 80 };
export const PANEL_RIGHT = { x: 650, y: 80 };
export const HUD_H = 64;

// Clickable buttons drawn this frame, for input.js to hit-test.
let buttons = [];
export function getButtons() {
  return buttons;
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function drawButton(ctx, b, now) {
  const hover = b.hoverUntil && now < b.hoverUntil;
  ctx.fillStyle = hover ? '#ff8c42' : '#3fa7ff';
  roundRect(ctx, b.x, b.y, b.w, b.h, 10);
  ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 17px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(b.label, b.x + b.w / 2, b.y + b.h / 2 + 1);
}

function fmtTime(sec) {
  const s = Math.max(0, Math.ceil(sec));
  return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0');
}

function drawPanel(ctx, game, origin, items, now) {
  ctx.save();
  roundRect(ctx, origin.x - 4, origin.y - 4, PANEL_W + 8, PANEL_H + 8, 12);
  ctx.fillStyle = '#101828';
  ctx.fill();
  ctx.clip();
  ctx.translate(origin.x, origin.y);
  drawBackground(ctx, game.scene.theme, game.scene.seed);
  for (const it of items) drawProp(ctx, it);
  // Found markers: a red ring on both panels, with a check.
  for (const idx of game.found) {
    const d = game.diffs[idx];
    const pulse = idx === game.lastFound && now - game.lastFoundAt < 450 ? 1 + 0.25 * Math.sin((now - game.lastFoundAt) / 60) : 1;
    ctx.strokeStyle = '#ff3b30';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.arc(d.x, d.y, d.r * pulse, 0, Math.PI * 2);
    ctx.stroke();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(d.x, d.y, d.r * pulse + 3, 0, Math.PI * 2);
    ctx.stroke();
    ctx.strokeStyle = '#ff3b30';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(d.x - 8, d.y);
    ctx.lineTo(d.x - 2, d.y + 7);
    ctx.lineTo(d.x + 9, d.y - 7);
    ctx.stroke();
  }
  // Hint pulse: a dashed gold ring that breathes around one unfound spot.
  if (game.hintFlash && now < game.hintFlash.until) {
    const d = game.diffs[game.hintFlash.index];
    const a = 0.55 + 0.45 * Math.sin(now / 130);
    ctx.globalAlpha = a;
    ctx.strokeStyle = '#ffd94a';
    ctx.lineWidth = 5;
    ctx.setLineDash([10, 8]);
    ctx.beginPath();
    ctx.arc(d.x, d.y, d.r + 6, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.globalAlpha = 1;
  }
  // Wrong-click flash: a red X where the player just missed.
  if (game.missFlash && now < game.missFlash.until && game.missFlash.panel === origin.panel) {
    const m = game.missFlash;
    ctx.strokeStyle = '#ff3b30';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(m.x - 12, m.y - 12);
    ctx.lineTo(m.x + 12, m.y + 12);
    ctx.moveTo(m.x + 12, m.y - 12);
    ctx.lineTo(m.x - 12, m.y + 12);
    ctx.stroke();
  }
  ctx.restore();
  // Panel caption above the frame.
  ctx.fillStyle = '#e8ecf1';
  ctx.font = 'bold 15px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  ctx.fillText(origin.label, origin.x + PANEL_W / 2, origin.y - 10);
}

function drawHud(ctx, game, now) {
  ctx.fillStyle = '#16213a';
  ctx.fillRect(0, 0, VIEW_W, HUD_H);
  ctx.fillStyle = '#ff5a76';
  ctx.font = 'bold 22px system-ui, sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText('DIFFERENCE HUNTER', 20, HUD_H / 2 + 1);
  ctx.font = '14px system-ui, sans-serif';
  ctx.fillStyle = '#9fb3c8';
  ctx.fillText(game.scene.themeName + '  ·  Level ' + game.level + ' / ' + game.totalLevels, 252, HUD_H / 2 + 1);

  // Level progress dots.
  for (let i = 0; i < game.totalLevels; i++) {
    ctx.fillStyle = i < game.level - 1 ? '#2fae5f' : i === game.level - 1 ? '#ffd94a' : '#33415e';
    ctx.beginPath();
    ctx.arc(536 + i * 24, HUD_H / 2, 7, 0, Math.PI * 2);
    ctx.fill();
  }

  // Found counter — the number the judge looks for.
  const left = game.diffs.length - game.found.size;
  ctx.textAlign = 'center';
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 22px system-ui, sans-serif';
  ctx.fillText('FOUND ' + game.found.size + ' / ' + game.diffs.length, 760, HUD_H / 2 - 8);
  ctx.font = '14px system-ui, sans-serif';
  ctx.fillStyle = left === 0 ? '#7fe0c3' : '#ffd94a';
  ctx.fillText(left === 0 ? 'ALL FOUND!' : left + ' LEFT', 760, HUD_H / 2 + 16);

  // Timer — red and pulsing when it gets tight.
  const urgent = game.timeLeft <= 20 && game.screen === 'playing';
  ctx.fillStyle = urgent ? '#ff5a76' : '#e8ecf1';
  ctx.font = 'bold 26px system-ui, sans-serif';
  ctx.fillText('⏱ ' + fmtTime(game.timeLeft), 930, HUD_H / 2 + 1);

  // Score.
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 22px system-ui, sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText('SCORE ' + game.score, 1150, HUD_H / 2 - 8);
  ctx.font = '13px system-ui, sans-serif';
  ctx.fillStyle = '#9fb3c8';
  ctx.fillText('mistakes ' + '✕'.repeat(game.mistakes) + '·'.repeat(Math.max(0, game.maxMistakes - game.mistakes)), 1150, HUD_H / 2 + 16);
  ctx.textAlign = 'left';
}

function drawBottomBar(ctx, game, now) {
  ctx.fillStyle = '#16213a';
  ctx.fillRect(0, 652, VIEW_W, VIEW_H - 652);
  ctx.fillStyle = game.messageColor || '#e8ecf1';
  ctx.font = '17px system-ui, sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(game.message, 20, 686);
  buttons = [];
  const defs = [
    { label: 'Hint (H) · ' + game.hintsLeft + ' left', action: 'hint', w: 168 },
    { label: 'Restart level (R)', action: 'restart', w: 168 },
    { label: game.muted ? 'Sound: OFF (M)' : 'Sound: ON (M)', action: 'mute', w: 158 },
    { label: 'Menu', action: 'menu', w: 96 },
  ];
  let x = VIEW_W - 20;
  for (const d of defs) {
    x -= d.w;
    const b = { x, y: 664, w: d.w, h: 40, label: d.label, action: d.action };
    buttons.push(b);
    drawButton(ctx, b, now);
    x -= 12;
  }
}

function drawOverlayCard(ctx, lines, buttonLabel, action, now) {
  ctx.fillStyle = 'rgba(8,12,24,0.72)';
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  const cw = 620;
  const ch = 150 + lines.length * 34;
  const cx = (VIEW_W - cw) / 2;
  const cy = (VIEW_H - ch) / 2;
  ctx.fillStyle = '#1b2a4a';
  roundRect(ctx, cx, cy, cw, ch, 16);
  ctx.fill();
  ctx.strokeStyle = '#3fa7ff';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  let y = cy + 56;
  for (const line of lines) {
    ctx.fillStyle = line.color || '#fff';
    ctx.font = line.big ? 'bold 34px system-ui, sans-serif' : '18px system-ui, sans-serif';
    ctx.fillText(line.text, VIEW_W / 2, y);
    y += line.big ? 48 : 32;
  }
  const b = { x: VIEW_W / 2 - 110, y: cy + ch - 66, w: 220, h: 46, label: buttonLabel, action };
  buttons.push(b);
  drawButton(ctx, b, now);
}

export function drawFrame(ctx, game, now) {
  buttons = [];
  ctx.fillStyle = '#0b1026';
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  drawHud(ctx, game, now);
  drawPanel(ctx, game, { ...PANEL_LEFT, label: 'LEFT — ORIGINAL', panel: 'left' }, game.leftItems, now);
  drawPanel(ctx, game, { ...PANEL_RIGHT, label: 'RIGHT — SPOT THE CHANGES', panel: 'right' }, game.rightItems, now);
  // Centre divider with a VS badge.
  ctx.fillStyle = '#ff5a76';
  ctx.beginPath();
  ctx.arc(640, 360, 22, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 15px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('VS', 640, 361);
  drawBottomBar(ctx, game, now);

  if (game.screen === 'title') {
    drawOverlayCard(
      ctx,
      [
        { text: 'DIFFERENCE HUNTER', big: true, color: '#ffd94a' },
        { text: 'Two pictures. One is hiding ' + game.diffs.length + ' changes. Find them all!' },
        { text: 'Click a difference on either picture · H for a hint · 3 wrong clicks fail the level' },
        { text: '5 levels · themes get busier · faster finds earn more points' },
      ],
      '▶  START  (Enter)',
      'start',
      now,
    );
  } else if (game.screen === 'levelClear') {
    drawOverlayCard(
      ctx,
      [
        { text: 'LEVEL ' + game.level + ' CLEAR!', big: true, color: '#7fe0c3' },
        { text: 'All ' + game.diffs.length + ' differences found · time bonus +' + game.levelBonus },
        { text: 'Level score ' + game.levelScore + '   ·   Total ' + game.score },
      ],
      game.level < game.totalLevels ? 'NEXT LEVEL  ▶' : 'SEE RESULTS  ▶',
      'next',
      now,
    );
  } else if (game.screen === 'levelFail') {
    drawOverlayCard(
      ctx,
      [
        { text: game.failReason === 'time' ? "TIME'S UP!" : 'TOO MANY MISSES!', big: true, color: '#ff5a76' },
        { text: 'You found ' + game.found.size + ' of ' + game.diffs.length + ' differences on level ' + game.level },
        { text: 'The differences stay where they were — try again.' },
      ],
      '↻  RETRY LEVEL',
      'retry',
      now,
    );
  } else if (game.screen === 'gameClear') {
    drawOverlayCard(
      ctx,
      [
        { text: 'YOU FOUND THEM ALL!', big: true, color: '#ffd94a' },
        { text: '35 differences across 5 scenes · final score ' + game.score },
        { text: 'Best hunter yet? Play again for a faster time.' },
      ],
      '↻  PLAY AGAIN',
      'again',
      now,
    );
  }
}
