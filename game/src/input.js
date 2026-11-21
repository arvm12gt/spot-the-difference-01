// input.js — mouse and keyboard input for Difference Hunter.
// Clicks land on a panel in panel space (shared by both pictures, so a
// difference can be clicked on either side); buttons and keys drive the
// menus, hints and restarts.

import { PANEL_LEFT, PANEL_RIGHT, getButtons } from './render.js';
import { PANEL_W, PANEL_H } from './scenes.js';
import { hitDifference } from './differences.js';

function panelAt(cx, cy) {
  const panels = [
    { origin: PANEL_LEFT, panel: 'left' },
    { origin: PANEL_RIGHT, panel: 'right' },
  ];
  for (const p of panels) {
    if (
      cx >= p.origin.x &&
      cx < p.origin.x + PANEL_W &&
      cy >= p.origin.y &&
      cy < p.origin.y + PANEL_H
    ) {
      return { panel: p.panel, x: cx - p.origin.x, y: cy - p.origin.y };
    }
  }
  return null;
}

export function attachInput(canvas, game) {
  canvas.addEventListener('click', (ev) => {
    const rect = canvas.getBoundingClientRect();
    const cx = ((ev.clientX - rect.left) / rect.width) * canvas.width;
    const cy = ((ev.clientY - rect.top) / rect.height) * canvas.height;
    // Buttons first: they sit on top of everything.
    for (const b of getButtons()) {
      if (cx >= b.x && cx < b.x + b.w && cy >= b.y && cy < b.y + b.h) {
        game.pressButton(b.action);
        return;
      }
    }
    if (game.screen !== 'playing') return;
    const hit = panelAt(cx, cy);
    if (!hit) return;
    const idx = hitDifference(game.diffs, game.found, hit.x, hit.y);
    if (idx === null) {
      game.onMiss(hit.panel, hit.x, hit.y);
    } else {
      game.onFound(idx);
    }
  });

  window.addEventListener('keydown', (ev) => {
    if (ev.repeat) return;
    const key = ev.key.toLowerCase();
    if (key === 'enter' || key === ' ') {
      if (game.screen !== 'playing') {
        game.pressButton(game.screen === 'title' ? 'start' : game.screen === 'levelClear' ? 'next' : game.screen === 'levelFail' ? 'retry' : 'again');
        ev.preventDefault();
      }
    } else if (key === 'h' && game.screen === 'playing') {
      game.pressButton('hint');
    } else if (key === 'r' && game.screen === 'playing') {
      game.pressButton('restart');
    } else if (key === 'm') {
      game.pressButton('mute');
    } else if (key === 'escape' && game.screen === 'playing') {
      game.pressButton('menu');
    }
  });
}
