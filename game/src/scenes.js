// scenes.js — procedural scene painters for Difference Hunter.
// Each theme is a fixed cast of props placed by a seed. The left panel draws
// the cast as built; the right panel draws the same cast with differences
// applied, so every difference is exact, never hand-annotated.

import { makeRng } from './random.js';

export const PANEL_W = 610;
export const PANEL_H = 560;

// One prop of a scene. x/y/s are in panel space; c is its main colour,
// c2 its accent; rot a rotation in radians. diffable props can carry a
// difference; background pieces live in drawBackground instead.
function prop(id, kind, x, y, s, c, c2) {
  return { id, kind, x, y, s, c, c2: c2 || c, rot: 0, diffable: true };
}

const BEACH_PROPS = [
  ['sun', 'sun', 96, 92, 46, '#ffd94a', '#ff9d2e'],
  ['cloud1', 'cloud', 260, 78, 52, '#ffffff', '#e8f4ff'],
  ['cloud2', 'cloud', 470, 120, 38, '#ffffff', '#e8f4ff'],
  ['boat', 'boat', 452, 318, 52, '#e2574c', '#ffffff'],
  ['umbrella', 'umbrella', 150, 330, 78, '#ff5a76', '#fff3d6'],
  ['palm', 'palm', 556, 300, 96, '#2fae5f', '#8a5a2b'],
  ['towel', 'towel', 330, 448, 62, '#3fa7ff', '#ffd94a'],
  ['ball', 'ball', 300, 512, 30, '#ff5a76', '#3fa7ff'],
  ['bucket', 'bucket', 448, 492, 34, '#ff9d2e', '#e2574c'],
  ['castle', 'castle', 512, 470, 40, '#e8c98f', '#c9a35f'],
  ['starfish', 'starfish', 216, 508, 24, '#ff8c42', '#e2574c'],
  ['crab', 'crab', 120, 516, 26, '#e2574c', '#8a2f28'],
  ['shell1', 'shell', 386, 528, 16, '#ffb3c8', '#ffffff'],
  ['shell2', 'shell', 62, 462, 14, '#c8b6ff', '#ffffff'],
  ['glasses', 'glasses', 250, 452, 26, '#222831', '#3fa7ff'],
];

const BEACH_EXTRA = [
  ['shell', 500, 528, 15, '#ffd94a', '#ffffff'],
  ['shell', 150, 540, 13, '#7fe0c3', '#ffffff'],
  ['starfish', 420, 452, 18, '#c8b6ff', '#e2574c'],
];

const ROOM_PROPS = [
  ['window', 'window', 128, 150, 92, '#9fd8ff', '#ffffff'],
  ['frame1', 'frame', 330, 130, 44, '#ff8c42', '#ffd94a'],
  ['frame2', 'frame', 428, 122, 36, '#3fa7ff', '#ffffff'],
  ['clock', 'clock', 520, 118, 34, '#ffffff', '#222831'],
  ['sofa', 'sofa', 250, 400, 130, '#e2574c', '#c94b40'],
  ['cushion1', 'cushion', 190, 392, 30, '#ffd94a', '#ff9d2e'],
  ['cushion2', 'cushion', 310, 394, 30, '#3fa7ff', '#2b6cb0'],
  ['lamp', 'lamp', 500, 330, 52, '#ffd94a', '#8a5a2b'],
  ['plant', 'plant', 74, 420, 58, '#2fae5f', '#e2574c'],
  ['rug', 'rug', 300, 508, 120, '#7fb3ff', '#ff8c42'],
  ['cat', 'cat', 392, 500, 34, '#5b4a68', '#ffd94a'],
  ['books', 'books', 520, 470, 40, '#3fa7ff', '#e2574c'],
  ['mug', 'mug', 470, 356, 18, '#2fae5f', '#ffffff'],
  ['vase', 'vase', 330, 330, 26, '#7fe0c3', '#ffffff'],
  ['shelf', 'shelf', 540, 260, 60, '#8a5a2b', '#3fa7ff'],
];

const ROOM_EXTRA = [
  ['mug', 150, 356, 16, '#ff5a76', '#ffffff'],
  ['books', 96, 470, 30, '#ffd94a', '#e2574c'],
  ['cushion', 250, 392, 24, '#7fe0c3', '#2fae5f'],
];

const SPACE_PROPS = [
  ['planet', 'planet', 470, 120, 64, '#ff9d6b', '#c65b7c'],
  ['rocket', 'rocket', 150, 200, 62, '#e8ecf1', '#e2574c'],
  ['astronaut', 'astronaut', 300, 300, 52, '#e8ecf1', '#3fa7ff'],
  ['satellite', 'satellite', 460, 330, 56, '#9fb3c8', '#ffd94a'],
  ['porthole', 'porthole', 92, 420, 48, '#9fd8ff', '#c8d6e5'],
  ['panel', 'panel', 330, 470, 66, '#3d5a80', '#7fe0c3'],
  ['alien', 'alien', 220, 470, 36, '#7fe07a', '#222831'],
  ['rock', 'rock', 520, 500, 30, '#8d99ae', '#6c757d'],
  ['flag', 'flag', 420, 452, 40, '#e2574c', '#ffffff'],
  ['telescope', 'telescope', 160, 500, 44, '#ffd94a', '#3d5a80'],
  ['tank', 'tank', 540, 420, 30, '#ff8c42', '#e8ecf1'],
  ['comet', 'comet', 330, 90, 40, '#bde0fe', '#ffffff'],
  ['moon', 'moon', 60, 120, 30, '#e8e8e8', '#c8c8c8'],
  ['wrench', 'wrench', 250, 540, 24, '#9fb3c8', '#6c757d'],
  ['flower', 'flower', 500, 180, 26, '#c8b6ff', '#7fe07a'],
];

const SPACE_EXTRA = [
  ['rock', 330, 540, 20, '#8d99ae', '#6c757d'],
  ['flower', 180, 120, 20, '#ffd94a', '#7fe07a'],
  ['moon', 540, 90, 22, '#e8e8e8', '#c8c8c8'],
];

export const THEMES = {
  beach: { name: 'Sunny Beach', props: BEACH_PROPS, extra: BEACH_EXTRA },
  room: { name: 'Cozy Room', props: ROOM_PROPS, extra: ROOM_EXTRA },
  space: { name: 'Space Station', props: SPACE_PROPS, extra: SPACE_EXTRA },
};

export const THEME_ORDER = ['beach', 'room', 'space', 'beach', 'room'];

export function themeForLevel(level) {
  return THEME_ORDER[(level - 1) % THEME_ORDER.length];
}

// Build the prop cast for one level. Higher levels add small deco props so
// the picture gets busier and the hunt gets harder.
export function buildScene(themeKey, seed, level) {
  const theme = THEMES[themeKey];
  const rng = makeRng(seed);
  const items = theme.props.map((p) => {
    const it = prop(p[0], p[1], p[2], p[3], p[4], p[5], p[6]);
    it.x += rng.range(-10, 10);
    it.y += rng.range(-7, 7);
    it.s *= rng.range(0.94, 1.06);
    it.rot = rng.range(-0.06, 0.06);
    return it;
  });
  const decoCount = level >= 4 ? 3 : level >= 3 ? 2 : 0;
  for (let i = 0; i < decoCount; i++) {
    const spot = theme.extra[i % theme.extra.length];
    items.push(
      prop('deco' + i, spot[0], spot[1] + rng.range(-6, 6), spot[2], spot[3], spot[4], spot[5]),
    );
  }
  return { theme: themeKey, themeName: theme.name, seed, items, rng };
}

// Paint the backdrop of a theme (never diffable: it is identical on both sides).
export function drawBackground(ctx, themeKey, seed) {
  const rng = makeRng(seed ^ 0x9e3779b9);
  if (themeKey === 'beach') {
    const sky = ctx.createLinearGradient(0, 0, 0, 320);
    sky.addColorStop(0, '#7ec8f7');
    sky.addColorStop(1, '#cfeeff');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, PANEL_W, 320);
    const sea = ctx.createLinearGradient(0, 300, 0, 410);
    sea.addColorStop(0, '#2f9be8');
    sea.addColorStop(1, '#7cc7f2');
    ctx.fillStyle = sea;
    ctx.fillRect(0, 300, PANEL_W, 110);
    ctx.fillStyle = '#f7e3b0';
    ctx.fillRect(0, 410, PANEL_W, PANEL_H - 410);
    ctx.strokeStyle = 'rgba(255,255,255,0.65)';
    ctx.lineWidth = 4;
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      const y = 322 + i * 26;
      for (let x = 0; x <= PANEL_W; x += 24) {
        ctx.lineTo(x, y + Math.sin((x + i * 90) / 46) * 4);
      }
      ctx.stroke();
    }
  } else if (themeKey === 'room') {
    ctx.fillStyle = '#f3ddc0';
    ctx.fillRect(0, 0, PANEL_W, 380);
    ctx.fillStyle = '#b98a5e';
    ctx.fillRect(0, 380, PANEL_W, PANEL_H - 380);
    ctx.fillStyle = '#a87a4e';
    for (let y = 400; y < PANEL_H; y += 34) ctx.fillRect(0, y, PANEL_W, 3);
    ctx.fillStyle = '#fff8ec';
    ctx.fillRect(0, 372, PANEL_W, 10);
  } else {
    ctx.fillStyle = '#0b1026';
    ctx.fillRect(0, 0, PANEL_W, PANEL_H);
    for (let i = 0; i < 90; i++) {
      const x = rng.range(0, PANEL_W);
      const y = rng.range(0, PANEL_H);
      const r = rng.range(0.6, 2.2);
      ctx.fillStyle = rng.chance(0.2) ? '#ffe9a8' : '#ffffff';
      ctx.globalAlpha = rng.range(0.4, 1);
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    const neb = ctx.createRadialGradient(120, 480, 10, 120, 480, 180);
    neb.addColorStop(0, 'rgba(120,90,200,0.35)');
    neb.addColorStop(1, 'rgba(120,90,200,0)');
    ctx.fillStyle = neb;
    ctx.fillRect(0, 300, 320, 260);
  }
}

// Draw one prop. Every prop is drawn from its own fields, so a difference
// that edits a field (colour, position, size, presence) shows up exactly.
export function drawProp(ctx, it) {
  const { x, y, s, c, c2 } = it;
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(it.rot || 0);
  ctx.scale(s / 50, s / 50);
  ctx.lineWidth = 2.5;
  ctx.strokeStyle = 'rgba(30,30,40,0.55)';
  ctx.fillStyle = c;
  switch (it.kind) {
    case 'sun':
      ctx.fillStyle = c;
      ctx.beginPath();
      ctx.arc(0, 0, 26, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = c2;
      ctx.lineWidth = 5;
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2;
        ctx.beginPath();
        ctx.moveTo(Math.cos(a) * 32, Math.sin(a) * 32);
        ctx.lineTo(Math.cos(a) * 42, Math.sin(a) * 42);
        ctx.stroke();
      }
      break;
    case 'cloud':
      ctx.fillStyle = c;
      ctx.beginPath();
      ctx.arc(-18, 4, 15, 0, Math.PI * 2);
      ctx.arc(0, -6, 19, 0, Math.PI * 2);
      ctx.arc(20, 4, 14, 0, Math.PI * 2);
      ctx.fill();
      break;
    case 'boat': {
      ctx.fillStyle = c2;
      ctx.beginPath();
      ctx.moveTo(0, -26);
      ctx.lineTo(0, 6);
      ctx.lineTo(24, 6);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = c;
      ctx.beginPath();
      ctx.moveTo(-30, 6);
      ctx.lineTo(32, 6);
      ctx.lineTo(22, 22);
      ctx.lineTo(-20, 22);
      ctx.closePath();
      ctx.fill();
      break;
    }
    case 'umbrella':
      ctx.fillStyle = c;
      ctx.beginPath();
      ctx.moveTo(-40, 0);
      ctx.arc(0, 0, 40, Math.PI, 0);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = c2;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, 40, Math.PI * 1.25, Math.PI * 1.75);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#8a5a2b';
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(0, 44);
      ctx.stroke();
      break;
    case 'palm':
      ctx.strokeStyle = '#8a5a2b';
      ctx.lineWidth = 7;
      ctx.beginPath();
      ctx.moveTo(0, 48);
      ctx.quadraticCurveTo(6, 0, -4, -34);
      ctx.stroke();
      ctx.fillStyle = c;
      for (let i = 0; i < 5; i++) {
        const a = -Math.PI / 2 + (i - 2) * 0.5;
        ctx.beginPath();
        ctx.ellipse(Math.cos(a) * 26 - 4, -34 + Math.sin(a) * 16, 26, 8, a, 0, Math.PI * 2);
        ctx.fill();
      }
      break;
    case 'towel':
      ctx.fillStyle = c;
      ctx.fillRect(-34, -16, 68, 32);
      ctx.fillStyle = c2;
      ctx.fillRect(-34, -4, 68, 8);
      ctx.strokeRect(-34, -16, 68, 32);
      break;
    case 'ball':
      ctx.fillStyle = c;
      ctx.beginPath();
      ctx.arc(0, 0, 20, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = c2;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, 20, -0.6, 0.9);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#fff';
      ctx.beginPath();
      ctx.arc(0, 0, 20, 0, Math.PI * 2);
      ctx.stroke();
      break;
    case 'bucket':
      ctx.fillStyle = c;
      ctx.beginPath();
      ctx.moveTo(-16, -14);
      ctx.lineTo(16, -14);
      ctx.lineTo(12, 16);
      ctx.lineTo(-12, 16);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = c2;
      ctx.fillRect(-16, -14, 32, 6);
      break;
    case 'castle':
      ctx.fillStyle = c;
      ctx.fillRect(-20, -6, 40, 24);
      ctx.fillRect(-20, -22, 10, 18);
      ctx.fillRect(-5, -26, 10, 22);
      ctx.fillRect(10, -22, 10, 18);
      ctx.fillStyle = c2;
      ctx.fillRect(-20, -6, 40, 5);
      break;
    case 'starfish':
      ctx.fillStyle = c;
      ctx.beginPath();
      for (let i = 0; i < 5; i++) {
        const a = -Math.PI / 2 + (i * 2 * Math.PI) / 5;
        const a2 = a + Math.PI / 5;
        ctx.lineTo(Math.cos(a) * 20, Math.sin(a) * 20);
        ctx.lineTo(Math.cos(a2) * 8, Math.sin(a2) * 8);
      }
      ctx.closePath();
      ctx.fill();
      break;
    case 'crab':
      ctx.fillStyle = c;
      ctx.beginPath();
      ctx.ellipse(0, 0, 20, 13, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillRect(-26, -16, 8, 8);
      ctx.fillRect(18, -16, 8, 8);
      ctx.strokeStyle = c;
      ctx.lineWidth = 4;
      for (const sx of [-1, 1]) {
        ctx.beginPath();
        ctx.moveTo(sx * 18, 6);
        ctx.lineTo(sx * 30, 14);
        ctx.stroke();
      }
      break;
    case 'shell':
      ctx.fillStyle = c;
      ctx.beginPath();
      ctx.arc(0, 2, 13, Math.PI, 0);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = c2;
      ctx.beginPath();
      ctx.moveTo(-8, 0);
      ctx.lineTo(-4, -10);
      ctx.moveTo(0, 0);
      ctx.lineTo(0, -12);
      ctx.moveTo(8, 0);
      ctx.lineTo(4, -10);
      ctx.stroke();
      break;
    case 'glasses':
      ctx.strokeStyle = c;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(-11, 0, 9, 0, Math.PI * 2);
      ctx.arc(11, 0, 9, 0, Math.PI * 2);
      ctx.moveTo(-2, 0);
      ctx.lineTo(2, 0);
      ctx.stroke();
      ctx.fillStyle = c2;
      ctx.beginPath();
      ctx.arc(-11, 0, 9, 0, Math.PI * 2);
      ctx.arc(11, 0, 9, 0, Math.PI * 2);
      ctx.fill();
      break;
    case 'window':
      ctx.fillStyle = c;
      ctx.fillRect(-34, -30, 68, 60);
      ctx.fillStyle = '#fff';
      ctx.fillRect(-30, -26, 60, 52);
      ctx.fillStyle = '#ffd94a';
      ctx.beginPath();
      ctx.arc(12, -12, 10, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#7ec8f7';
      ctx.beginPath();
      ctx.moveTo(-30, 26);
      ctx.lineTo(10, 26);
      ctx.lineTo(30, 10);
      ctx.lineTo(30, 26);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#8a5a2b';
      ctx.lineWidth = 4;
      ctx.strokeRect(-34, -30, 68, 60);
      ctx.beginPath();
      ctx.moveTo(0, -30);
      ctx.lineTo(0, 30);
      ctx.moveTo(-34, 0);
      ctx.lineTo(34, 0);
      ctx.stroke();
      break;
    case 'frame':
      ctx.fillStyle = '#8a5a2b';
      ctx.fillRect(-20, -16, 40, 32);
      ctx.fillStyle = c;
      ctx.fillRect(-16, -12, 32, 24);
      ctx.fillStyle = c2;
      ctx.beginPath();
      ctx.arc(0, 0, 7, 0, Math.PI * 2);
      ctx.fill();
      break;
    case 'clock':
      ctx.fillStyle = c;
      ctx.beginPath();
      ctx.arc(0, 0, 20, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#222831';
      ctx.beginPath();
      ctx.arc(0, 0, 20, 0, Math.PI * 2);
      ctx.moveTo(0, 0);
      ctx.lineTo(0, -12);
      ctx.moveTo(0, 0);
      ctx.lineTo(9, 4);
      ctx.stroke();
      break;
    case 'sofa':
      ctx.fillStyle = c2;
      ctx.fillRect(-62, -18, 124, 40);
      ctx.fillStyle = c;
      ctx.fillRect(-62, -30, 124, 22);
      ctx.fillRect(-62, -30, 18, 52);
      ctx.fillRect(44, -30, 18, 52);
      ctx.fillStyle = '#5b2f2a';
      ctx.fillRect(-56, 22, 8, 8);
      ctx.fillRect(48, 22, 8, 8);
      break;
    case 'cushion':
      ctx.fillStyle = c;
      ctx.beginPath();
      ctx.arc(0, 0, 16, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = c2;
      ctx.beginPath();
      ctx.arc(0, 0, 7, 0, Math.PI * 2);
      ctx.fill();
      break;
    case 'lamp':
      ctx.fillStyle = '#8a5a2b';
      ctx.fillRect(-3, -6, 6, 34);
      ctx.fillStyle = c;
      ctx.beginPath();
      ctx.moveTo(-20, -6);
      ctx.lineTo(20, -6);
      ctx.lineTo(14, -30);
      ctx.lineTo(-14, -30);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = c2;
      ctx.fillRect(-22, 28, 44, 6);
      break;
    case 'plant':
      ctx.fillStyle = c2;
      ctx.beginPath();
      ctx.moveTo(-14, 6);
      ctx.lineTo(14, 6);
      ctx.lineTo(10, 26);
      ctx.lineTo(-10, 26);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = c;
      for (let i = 0; i < 5; i++) {
        const a = -Math.PI / 2 + (i - 2) * 0.45;
        ctx.beginPath();
        ctx.ellipse(Math.cos(a) * 14, -2 + Math.sin(a) * 12, 16, 6, a, 0, Math.PI * 2);
        ctx.fill();
      }
      break;
    case 'rug':
      ctx.fillStyle = c;
      ctx.beginPath();
      ctx.ellipse(0, 0, 62, 18, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = c2;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.ellipse(0, 0, 46, 12, 0, 0, Math.PI * 2);
      ctx.stroke();
      break;
    case 'cat':
      ctx.fillStyle = c;
      ctx.beginPath();
      ctx.ellipse(0, 4, 20, 12, 0, 0, Math.PI * 2);
      ctx.arc(14, -10, 10, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(8, -18);
      ctx.lineTo(11, -28);
      ctx.lineTo(15, -18);
      ctx.moveTo(16, -18);
      ctx.lineTo(19, -28);
      ctx.lineTo(22, -18);
      ctx.fill();
      ctx.strokeStyle = c;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(-18, 0);
      ctx.quadraticCurveTo(-32, -8, -30, -18);
      ctx.stroke();
      break;
    case 'books':
      for (let i = 0; i < 3; i++) {
        ctx.fillStyle = [c, c2, '#ffd94a'][i];
        ctx.fillRect(-16, -12 + i * 9, 32, 7);
      }
      break;
    case 'mug':
      ctx.fillStyle = c;
      ctx.fillRect(-10, -10, 20, 20);
      ctx.strokeStyle = c;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(12, 0, 6, -Math.PI / 2, Math.PI / 2);
      ctx.stroke();
      break;
    case 'vase':
      ctx.fillStyle = c;
      ctx.beginPath();
      ctx.moveTo(-8, -16);
      ctx.quadraticCurveTo(-16, 0, -8, 16);
      ctx.lineTo(8, 16);
      ctx.quadraticCurveTo(16, 0, 8, -16);
      ctx.closePath();
      ctx.fill();
      break;
    case 'shelf':
      ctx.fillStyle = c;
      ctx.fillRect(-30, -4, 60, 8);
      for (let i = 0; i < 3; i++) {
        ctx.fillStyle = [c2, '#ffd94a', '#3fa7ff'][i];
        ctx.fillRect(-24 + i * 18, -24, 12, 20);
      }
      break;
    case 'planet':
      ctx.fillStyle = c;
      ctx.beginPath();
      ctx.arc(0, 0, 26, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = c2;
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.ellipse(0, 4, 38, 10, -0.35, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = 'rgba(255,255,255,0.35)';
      ctx.beginPath();
      ctx.arc(-9, -9, 7, 0, Math.PI * 2);
      ctx.fill();
      break;
    case 'rocket':
      ctx.fillStyle = c;
      ctx.beginPath();
      ctx.moveTo(0, -30);
      ctx.quadraticCurveTo(16, -6, 12, 14);
      ctx.lineTo(-12, 14);
      ctx.quadraticCurveTo(-16, -6, 0, -30);
      ctx.fill();
      ctx.fillStyle = c2;
      ctx.beginPath();
      ctx.arc(0, -8, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ff9d2e';
      ctx.beginPath();
      ctx.moveTo(-6, 14);
      ctx.lineTo(0, 30);
      ctx.lineTo(6, 14);
      ctx.closePath();
      ctx.fill();
      break;
    case 'astronaut':
      ctx.fillStyle = c;
      ctx.beginPath();
      ctx.arc(0, -12, 13, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = c2;
      ctx.beginPath();
      ctx.arc(0, -12, 13, 0, Math.PI * 2);
      ctx.globalAlpha = 0.35;
      ctx.fill();
      ctx.globalAlpha = 1;
      ctx.fillStyle = c;
      ctx.beginPath();
      ctx.ellipse(0, 8, 15, 18, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = c;
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.moveTo(-13, 0);
      ctx.lineTo(-26, -8);
      ctx.moveTo(13, 0);
      ctx.lineTo(26, -6);
      ctx.stroke();
      break;
    case 'satellite':
      ctx.fillStyle = c;
      ctx.fillRect(-10, -8, 20, 16);
      ctx.fillStyle = c2;
      ctx.fillRect(-32, -4, 22, 8);
      ctx.fillRect(10, -4, 22, 8);
      ctx.strokeStyle = '#e8ecf1';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(0, -8);
      ctx.lineTo(0, -20);
      ctx.stroke();
      break;
    case 'porthole':
      ctx.fillStyle = c2;
      ctx.beginPath();
      ctx.arc(0, 0, 24, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = c;
      ctx.beginPath();
      ctx.arc(0, 0, 18, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#7fe0c3';
      ctx.beginPath();
      ctx.arc(-6, -6, 5, 0, Math.PI * 2);
      ctx.fill();
      break;
    case 'panel':
      ctx.fillStyle = c;
      ctx.fillRect(-34, -20, 68, 40);
      ctx.fillStyle = c2;
      for (let i = 0; i < 3; i++) {
        ctx.beginPath();
        ctx.arc(-20 + i * 20, -8, 5, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.fillStyle = '#ffd94a';
      ctx.fillRect(-24, 6, 48, 6);
      break;
    case 'alien':
      ctx.fillStyle = c;
      ctx.beginPath();
      ctx.ellipse(0, 0, 16, 19, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#222831';
      ctx.beginPath();
      ctx.ellipse(-6, -4, 4, 6, -0.3, 0, Math.PI * 2);
      ctx.ellipse(6, -4, 4, 6, 0.3, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = c;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(-6, -18);
      ctx.lineTo(-10, -28);
      ctx.moveTo(6, -18);
      ctx.lineTo(10, -28);
      ctx.stroke();
      break;
    case 'rock':
      ctx.fillStyle = c;
      ctx.beginPath();
      ctx.moveTo(-16, 8);
      ctx.lineTo(-10, -10);
      ctx.lineTo(8, -12);
      ctx.lineTo(16, 6);
      ctx.closePath();
      ctx.fill();
      break;
    case 'flag':
      ctx.strokeStyle = '#c8d6e5';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(0, -22);
      ctx.lineTo(0, 18);
      ctx.stroke();
      ctx.fillStyle = c;
      ctx.beginPath();
      ctx.moveTo(0, -22);
      ctx.lineTo(22, -16);
      ctx.lineTo(0, -10);
      ctx.closePath();
      ctx.fill();
      break;
    case 'telescope':
      ctx.strokeStyle = c2;
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.moveTo(-18, 8);
      ctx.lineTo(18, -8);
      ctx.stroke();
      ctx.fillStyle = c;
      ctx.beginPath();
      ctx.arc(20, -9, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = c2;
      ctx.beginPath();
      ctx.moveTo(0, 2);
      ctx.lineTo(0, 20);
      ctx.moveTo(-10, 20);
      ctx.lineTo(10, 20);
      ctx.stroke();
      break;
    case 'tank':
      ctx.fillStyle = c;
      ctx.beginPath();
      ctx.ellipse(0, 0, 11, 20, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = c2;
      ctx.fillRect(-11, -8, 22, 6);
      break;
    case 'comet':
      ctx.strokeStyle = c;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(-22, 14);
      ctx.lineTo(6, -8);
      ctx.stroke();
      ctx.fillStyle = c2;
      ctx.beginPath();
      ctx.arc(10, -10, 8, 0, Math.PI * 2);
      ctx.fill();
      break;
    case 'moon':
      ctx.fillStyle = c;
      ctx.beginPath();
      ctx.arc(0, 0, 16, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = c2;
      ctx.beginPath();
      ctx.arc(-5, -3, 4, 0, Math.PI * 2);
      ctx.arc(6, 5, 3, 0, Math.PI * 2);
      ctx.fill();
      break;
    case 'wrench':
      ctx.strokeStyle = c;
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.moveTo(-12, 12);
      ctx.lineTo(12, -12);
      ctx.stroke();
      ctx.fillStyle = c;
      ctx.beginPath();
      ctx.arc(14, -14, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#0b1026';
      ctx.beginPath();
      ctx.arc(16, -16, 3.5, 0, Math.PI * 2);
      ctx.fill();
      break;
    case 'flower':
      ctx.fillStyle = c;
      for (let i = 0; i < 5; i++) {
        const a = (i / 5) * Math.PI * 2;
        ctx.beginPath();
        ctx.arc(Math.cos(a) * 9, Math.sin(a) * 9, 6, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.fillStyle = c2;
      ctx.beginPath();
      ctx.arc(0, 0, 5, 0, Math.PI * 2);
      ctx.fill();
      break;
    default:
      ctx.fillStyle = c;
      ctx.fillRect(-14, -14, 28, 28);
  }
  ctx.restore();
}
