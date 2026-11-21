// shots.js — deterministic staging for screenshots.
// ?shot=title  the title screen over a fresh level-1 scene
// ?shot=play   mid-hunt on level 3: 3 of 7 found, 4 left, clock at 0:47
// ?shot=win    the game-clear screen after all five levels
// A staged shot freezes the clock so the capture is stable.

export function applyShot(game, shot) {
  if (shot === 'play') {
    game.buildLevel(3);
    game.screen = 'playing';
    game.found = new Set([0, 1, 2]);
    game.lastFound = 2;
    game.lastFoundAt = performance.now();
    game.score = 350;
    game.timeLeft = 47;
    game.mistakes = 1;
    game.hintsLeft = 2;
    game.message = 'Nice catch! Combo x2 (+25) — 4 more to find.';
    game.messageColor = '#7fe0c3';
    game.frozen = true;
  } else if (shot === 'win') {
    game.buildLevel(5);
    game.screen = 'gameClear';
    game.found = new Set(game.diffs.map((_, i) => i));
    game.score = 2850;
    game.frozen = true;
  } else {
    // title (default): a fresh level-1 scene behind the title card.
    game.buildLevel(1);
    game.screen = 'title';
    game.frozen = true;
  }
  return game;
}
