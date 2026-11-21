# Difference Hunter — a spot-the-difference game

[![bounty](https://make.fun/badge/best-spot-the-difference-game-20261121-0451.svg)](https://make.fun/bounty/best-spot-the-difference-game-20261121-0451)
[![rank](https://make.fun/badge/best-spot-the-difference-game-20261121-0451/arvm12gt/spot-the-difference-01/rank.svg)](https://make.fun/bounty/best-spot-the-difference-game-20261121-0451)
[![reward](https://make.fun/badge/best-spot-the-difference-game-20261121-0451/arvm12gt/spot-the-difference-01/reward.svg)](https://make.fun/bounty/best-spot-the-difference-game-20261121-0451)

Entry for the [make.fun bounty “Make the best spot the difference game”](https://make.fun/bounty/best-spot-the-difference-game-20261121-0451).

Two near-identical pictures, side by side. One of them is hiding differences —
find them all before the clock runs out.

## How it plays

- **5 levels, 5 → 9 differences each.** Every scene is drawn procedurally
  from a seed (sunny beach, cozy room, space station, then harder remixes),
  so the pictures are never a static pair with hand-placed dots: the right
  panel is the same scene data with exactly N edits applied — a prop removed,
  recoloured, moved, resized, or added.
- **Click a difference on either picture.** Found ones get a red ring and a
  check on both panels; the HUD counts `FOUND n / N` and how many are left.
- **Time pressure you can feel:** each level has its own countdown, and
  clearing with time left pays a bonus. Three wrong clicks fail the level.
- **Hints that behave:** H (or the Hint button) rings one unfound difference
  in gold for a few seconds — 3 per level, −25 points each.
- **Combos:** quick successive finds pay +25 per chain step.
- **Feel:** a two-note chime on every find, a buzz on a miss, an arpeggio on
  a clear — all synthesised with WebAudio, zero audio files.
- Title screen, level-clear and game-clear screens, restart, mute, and a
  `?shot=` staging mode (`title` / `play` / `win`, `?seed=` fixes the scenes)
  used to take the screenshots.

## Play it

```sh
node serve.ts   # then open http://localhost:8080
```

No build step, no network request, no library — plain HTML5 Canvas and ES
modules under `game/`. The hand-in program is `main.ts` (Node 22, standard
library only); it copies `game/` and `screenshots/` to `/output` and writes
`/output/dossier.json` with the vendored `vendor/makefun-game.ts`.

## Layout

| File | Job |
| --- | --- |
| `game/index.html` | Page shell + canvas |
| `game/src/main.js` | Boot, loop, `?shot=` / `?seed=` |
| `game/src/game.js` | Levels, scoring, timer, hints, mistakes |
| `game/src/scenes.js` | Procedural scene painters (beach / room / space) |
| `game/src/differences.js` | Pick + apply the N differences |
| `game/src/render.js` | HUD, panels, markers, screens |
| `game/src/input.js` | Mouse + keyboard |
| `game/src/audio.js` | Synthesised sound effects |
| `game/src/random.js` | Seeded RNG (mulberry32) |
| `game/src/shots.js` | Deterministic screenshot staging |
