// main.js — boot for Difference Hunter: build the game, wire input, run the
// loop, and honour ?shot= / ?seed= so screenshots are reproducible.

import { DifferenceHunter } from './game.js';
import { attachInput } from './input.js';
import { drawFrame, VIEW_W, VIEW_H } from './render.js';
import { applyShot } from './shots.js';

const params = new URLSearchParams(window.location.search);
const seedParam = Number(params.get('seed'));
const runSeed = Number.isFinite(seedParam) && seedParam > 0 ? seedParam : Date.now() % 100000;
const shot = params.get('shot') || '';

const canvas = document.getElementById('game');
canvas.width = VIEW_W;
canvas.height = VIEW_H;

const game = new DifferenceHunter(runSeed);
if (shot) applyShot(game, shot);
attachInput(canvas, game);

// Debug handle for play-testing: window.__spot.game, .shot(), .foundAll().
window.__spot = {
  game,
  shot(name) {
    applyShot(game, name);
  },
  foundAll() {
    for (let i = 0; i < game.diffs.length; i++) {
      if (!game.found.has(i)) game.onFound(i);
    }
  },
};

const ctx = canvas.getContext('2d');
let last = performance.now();

function frame(now) {
  const dt = Math.min(0.1, (now - last) / 1000);
  last = now;
  game.tick(dt, now);
  drawFrame(ctx, game, now);
  requestAnimationFrame(frame);
}

requestAnimationFrame(frame);
