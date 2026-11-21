// differences.js — pick and apply the differences between the two panels.
// A difference is always an edit of the scene data itself (drop a prop,
// recolour it, move it, resize it, or add a new one), so the right panel is
// a true rendering of the same scene with exactly N differences.

import { makeRng, shuffle } from './random.js';
import { PANEL_W, PANEL_H, THEMES } from './scenes.js';

// Colours a recolour difference may switch a prop to. They stay plausible
// inside the scene, so the change hides in plain sight.
const RECOLOURS = ['#ff5a76', '#3fa7ff', '#ffd94a', '#2fae5f', '#ff8c42', '#c8b6ff', '#7fe0c3'];

const TYPES = ['remove', 'recolour', 'move', 'resize', 'add'];

// Choose `count` differences for a level. Returns [{x, y, r, type, itemId}].
// x/y is the panel-space point a click must land near; r the tolerance.
export function chooseDifferences(scene, count, seed) {
  const rng = makeRng(seed ^ 0x51ab);
  const theme = THEMES[scene.theme];
  const candidates = shuffle(
    scene.items.filter((it) => it.diffable),
    rng,
  );
  const diffs = [];
  const used = new Set();
  let typeIndex = Math.floor(rng.next() * TYPES.length);
  for (const item of candidates) {
    if (diffs.length >= count) break;
    if (used.has(item.id)) continue;
    const type = TYPES[typeIndex % TYPES.length];
    typeIndex += 1;
    if (type === 'add') continue; // adds are placed after, from the theme's spots
    const tol = Math.max(24, Math.min(34, item.s * 0.55));
    diffs.push({ x: item.x, y: item.y, r: tol, type, itemId: item.id });
    used.add(item.id);
  }
  // Fill remaining slots with "add" differences: a small extra prop that
  // only exists on the right panel.
  const spots = shuffle(theme.extra.slice(), rng);
  let spotIndex = 0;
  while (diffs.length < count && spotIndex < spots.length) {
    const spot = spots[spotIndex++];
    const [kind, sx, sy, ss, c, c2] = spot;
    // Never stack an add on top of a prop that already sits there.
    const clash = scene.items.some(
      (it) => Math.hypot(it.x - sx, it.y - sy) < it.s * 0.6 + 18,
    );
    if (clash) continue;
    diffs.push({ x: sx, y: sy, r: 30, type: 'add', itemId: 'add' + diffs.length, add: { kind, x: sx, y: sy, s: ss, c, c2 } });
  }
  // If the theme ran out of clean spots, top up with extra recolour/moves.
  let guard = 0;
  while (diffs.length < count && guard++ < 40) {
    const item = candidates[Math.floor(rng.next() * candidates.length)];
    if (!item || used.has(item.id)) continue;
    diffs.push({
      x: item.x,
      y: item.y,
      r: Math.max(24, Math.min(34, item.s * 0.55)),
      type: rng.chance(0.5) ? 'recolour' : 'move',
      itemId: item.id,
    });
    used.add(item.id);
  }
  return diffs;
}

// Produce the right panel's item list by editing a copy of the left list.
export function applyDifferences(items, diffs, seed) {
  const rng = makeRng(seed ^ 0xadd);
  const byId = new Map(items.map((it) => [it.id, { ...it }]));
  const out = items.map((it) => byId.get(it.id));
  for (const d of diffs) {
    if (d.type === 'add') {
      out.push({ id: d.itemId, kind: d.add.kind, x: d.add.x, y: d.add.y, s: d.add.s, c: d.add.c, c2: d.add.c2, rot: 0, diffable: false });
      continue;
    }
    const it = byId.get(d.itemId);
    if (!it) continue;
    if (d.type === 'remove') {
      const i = out.indexOf(it);
      if (i >= 0) out.splice(i, 1);
    } else if (d.type === 'recolour') {
      const choices = RECOLOURS.filter((col) => col !== it.c && col !== it.c2);
      it.c = choices[Math.floor(rng.next() * choices.length)];
    } else if (d.type === 'move') {
      const dx = rng.chance(0.5) ? rng.range(48, 84) : -rng.range(48, 84);
      const dy = rng.range(-30, 30);
      it.x = Math.min(PANEL_W - 40, Math.max(40, it.x + dx));
      it.y = Math.min(PANEL_H - 40, Math.max(40, it.y + dy));
    } else if (d.type === 'resize') {
      it.s *= rng.chance(0.5) ? 0.55 : 1.6;
    }
  }
  return out;
}

// Find the nearest unfound difference to a panel-space point, or null.
export function hitDifference(diffs, found, px, py) {
  let best = null;
  let bestD = Infinity;
  for (let i = 0; i < diffs.length; i++) {
    if (found.has(i)) continue;
    const d = Math.hypot(diffs[i].x - px, diffs[i].y - py);
    if (d < diffs[i].r && d < bestD) {
      best = i;
      bestD = d;
    }
  }
  return best;
}
