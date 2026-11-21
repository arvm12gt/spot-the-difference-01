// game.js — the state machine of Difference Hunter: levels, scoring, timer,
// hints, mistakes and the screens between them. Rendering lives in
// render.js; input lives in input.js; this file only decides what happens.

import { buildScene, themeForLevel } from './scenes.js';
import { chooseDifferences, applyDifferences } from './differences.js';
import { playFound, playMiss, playClear, playHint, toggleMute, isMuted } from './audio.js';

export const TOTAL_LEVELS = 5;
export const DIFFS_PER_LEVEL = [5, 6, 7, 8, 9];
export const TIME_LIMITS = [120, 105, 95, 85, 75];
export const MAX_MISTAKES = 3;
export const HINTS_PER_LEVEL = 3;

export class DifferenceHunter {
  constructor(runSeed) {
    this.runSeed = runSeed >>> 0;
    this.totalLevels = TOTAL_LEVELS;
    this.maxMistakes = MAX_MISTAKES;
    this.score = 0;
    this.level = 1;
    this.muted = isMuted();
    this.frozen = false; // staged screenshots freeze the clock
    this.message = 'Find the differences — click one on either picture.';
    this.messageColor = '#e8ecf1';
    this.buildLevel(1);
    this.screen = 'title';
  }

  levelSeed(level) {
    return (this.runSeed + level * 1000 + 17) >>> 0;
  }

  buildLevel(level) {
    this.level = level;
    const themeKey = themeForLevel(level);
    const seed = this.levelSeed(level);
    this.scene = buildScene(themeKey, seed, level);
    this.leftItems = this.scene.items;
    this.diffs = chooseDifferences(this.scene, DIFFS_PER_LEVEL[level - 1], seed);
    this.rightItems = applyDifferences(this.scene.items, this.diffs, seed);
    this.found = new Set();
    this.lastFound = -1;
    this.lastFoundAt = 0;
    this.combo = 0;
    this.mistakes = 0;
    this.hintsLeft = HINTS_PER_LEVEL;
    this.hintFlash = null;
    this.missFlash = null;
    this.timeLimit = TIME_LIMITS[level - 1];
    this.timeLeft = this.timeLimit;
    this.levelStartScore = this.score;
    this.levelBonus = 0;
    this.levelScore = 0;
    this.failReason = null;
  }

  get timeLeftSeconds() {
    return this.timeLeft;
  }

  tick(dt, now) {
    if (this.screen !== 'playing' || this.frozen) return;
    this.timeLeft -= dt;
    if (this.hintFlash && now > this.hintFlash.until) this.hintFlash = null;
    if (this.missFlash && now > this.missFlash.until) this.missFlash = null;
    if (this.timeLeft <= 0) {
      this.timeLeft = 0;
      this.failLevel('time');
    }
  }

  onFound(idx) {
    const now = performance.now();
    const fast = now - this.lastFoundAt < 5000;
    this.combo = fast ? this.combo + 1 : 1;
    const comboBonus = (this.combo - 1) * 25;
    this.found.add(idx);
    this.lastFound = idx;
    this.lastFoundAt = now;
    this.score += 100 + comboBonus;
    playFound();
    const left = this.diffs.length - this.found.size;
    if (left === 0) {
      this.clearLevel();
      return;
    }
    this.message =
      'Nice catch!' +
      (comboBonus > 0 ? ' Combo x' + this.combo + ' (+' + comboBonus + ')' : '') +
      ' — ' +
      left +
      ' more to find.';
    this.messageColor = '#7fe0c3';
  }

  onMiss(panel, x, y) {
    this.mistakes += 1;
    this.combo = 0;
    this.missFlash = { panel, x, y, until: performance.now() + 700 };
    playMiss();
    if (this.mistakes >= this.maxMistakes) {
      this.failLevel('misses');
      return;
    }
    this.message =
      'Not there — that was miss ' + this.mistakes + ' of ' + this.maxMistakes + '. Look closer!';
    this.messageColor = '#ff8c42';
  }

  clearLevel() {
    this.levelBonus = Math.ceil(this.timeLeft) * 5 + (this.maxMistakes - this.mistakes) * 50;
    this.levelScore = this.score - this.levelStartScore + this.levelBonus;
    this.score += this.levelBonus;
    this.message = 'Level ' + this.level + ' clear! Time bonus +' + this.levelBonus + '.';
    this.messageColor = '#7fe0c3';
    this.screen = 'levelClear';
    playClear();
  }

  failLevel(reason) {
    this.failReason = reason;
    this.message =
      reason === 'time' ? "Time's up — the differences got away." : 'Three misses — the level resets.';
    this.messageColor = '#ff5a76';
    this.screen = 'levelFail';
    playMiss();
  }

  pressButton(action) {
    if (action === 'start') {
      this.score = 0;
      this.buildLevel(1);
      this.screen = 'playing';
      this.message = 'Level 1: find ' + this.diffs.length + ' differences. Good hunting!';
      this.messageColor = '#e8ecf1';
    } else if (action === 'next') {
      if (this.level < this.totalLevels) {
        this.buildLevel(this.level + 1);
        this.screen = 'playing';
        this.message =
          'Level ' + this.level + ': find ' + this.diffs.length + ' differences in ' + this.scene.themeName + '.';
        this.messageColor = '#e8ecf1';
      } else {
        this.screen = 'gameClear';
      }
    } else if (action === 'retry') {
      this.buildLevel(this.level);
      this.screen = 'playing';
      this.message = 'Level ' + this.level + ', fresh eyes. Find ' + this.diffs.length + ' differences.';
      this.messageColor = '#e8ecf1';
    } else if (action === 'again') {
      this.score = 0;
      this.runSeed = (Date.now() % 100000) >>> 0;
      this.buildLevel(1);
      this.screen = 'playing';
      this.message = 'A brand-new hunt — find ' + this.diffs.length + ' differences!';
      this.messageColor = '#e8ecf1';
    } else if (action === 'hint') {
      this.useHint();
    } else if (action === 'restart') {
      this.buildLevel(this.level);
      this.screen = 'playing';
      this.message = 'Level ' + this.level + ' restarted. ' + this.diffs.length + ' differences to find.';
      this.messageColor = '#e8ecf1';
    } else if (action === 'mute') {
      this.muted = toggleMute();
    } else if (action === 'menu') {
      this.buildLevel(1);
      this.screen = 'title';
      this.message = 'Find the differences — click one on either picture.';
      this.messageColor = '#e8ecf1';
    }
  }

  useHint() {
    if (this.screen !== 'playing') return;
    if (this.hintsLeft <= 0) {
      this.message = 'No hints left on this level — trust your eyes!';
      this.messageColor = '#ff8c42';
      return;
    }
    const remaining = this.diffs.map((_, i) => i).filter((i) => !this.found.has(i));
    if (remaining.length === 0) return;
    const idx = remaining[Math.floor(Math.random() * remaining.length)];
    this.hintsLeft -= 1;
    this.score = Math.max(0, this.score - 25);
    this.hintFlash = { index: idx, until: performance.now() + 2400 };
    playHint();
    this.message = 'Hint: look inside the gold ring (−25 points, ' + this.hintsLeft + ' left).';
    this.messageColor = '#ffd94a';
  }
}
