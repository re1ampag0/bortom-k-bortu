# Game-scale frames

Baseline: main `4463481`, separate worktree `/workspace/game-scale-before`.
Serve both with the same helper (no production/server build):

```
node scripts/game-scale/serve.mjs before /workspace/game-scale-before
node scripts/game-scale/serve.mjs after /workspace/game-scale
PHASE=both node scripts/game-scale/capture.mjs
node scripts/game-scale/compare.mjs
PHASE=disabled SIZES=1366x660,390x844,430x932,320x568,1280x600,844x390 node scripts/game-scale/capture.mjs
PHASE=disabled SIZES=1366x660,390x844,430x932,320x568,1280x600,844x390 node scripts/game-scale/compare.mjs
node scripts/game-scale/viewport.mjs
node scripts/game-scale/lift.mjs
node scripts/game-scale/report.mjs
```

The fixture is an ordinary saved game: seed1, round2 after two legal endTurn actions,
five cards in the Pearl's hand. Regenerate with `npx vite-node scripts/game-scale/scenario.ts`.
No engine fixture patch, rule change or hidden-state override is used.

These are screenshot/geometry helpers, not new tests. State preparation uses the real DOM
handlers via click; button hit-testing is inventoried separately with elementFromPoint.
Both versions use the same capture.mjs: preload fonts/decode images, a paused Playwright clock,
normal finite animation endpoints committed to styles, ambient CSS/SMIL phase0,
and reset window/root/stage/board scrolling. Card-strip scrolling is preserved for hand-bottom.
No color tolerance, resampling, or image replacement is used for the pixel comparison.
The optional MAIN_ONLY/OUTPUT variables preserve diagnostics of the earlier unstable helper;
main-self is historical diagnostic output, not the final comparison.

Chromium `/usr/bin/chromium`, DPR1 laptop / DPR3 device emulation. GAME_SCALE_CHROMIUM can
select an existing alternative executable. WebKit was unavailable; real browser bars/insets
cannot be certified by Chromium emulation. viewport.mjs labels the visualViewport simulation.
See the progress report for the tablet fallback, small-text warnings and approved diff regions.
