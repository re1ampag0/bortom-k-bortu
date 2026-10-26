# Menu and information-window preparation

The family adapters still call `scripts/scene-window/extract.mjs` (2x PNG intermediates).
Each then calls `prepareScenes()` in `prepare.mjs`: detached SVG rasterization, WebP/usage-cohort
atlases, content-addressed shared bank, proven loop repairs, ship motion corrections,
posters, unused-file collection and lazy per-scene manifests. The temporary Vite server
belongs to this offline operation and is closed afterwards. Python requires Pillow.

`node scripts/menus-speed/prepare.mjs` repeats the post-export stage. Original PNGs are
removed only after links have been rewritten. Revisions make motion and texture edits
idempotent. `quality-map.json` prevents an already optimized WebP being compressed again.
The loop inventory identifies layers from the current boards; after changing the boards,
regenerate `seams-before-fix.json` with `seams.mjs` before applying new loop fixes.

`dev.mjs` exposes the existing PreparedScene via `scene.html` for own frame scripts.
`seams.mjs` samples every infinite non-alternate animation at 0, duration−16.67ms and
duration. Native animation IDs isolate each animation when a layer owns several.
It records raw pixel counts; >12 channel levels on >100 pixels (or >0.01% on a larger
scene) is a visible seam. Tiny isolated antialias edge differences remain in raw results.
`LAYERS=ship:Г:120,...` restricts re-capture to modified layers.

`network.mjs` runs once against original production HTTP server :5380 and changed :5384,
with fresh browser contexts per version/network/viewport, Fast4G 9Mbps and Slow4G1.6Mbps,
150ms latency. Subsequent transitions use that context's cache. Response bytes are CDP
encodedDataLength, including headers; simultaneous idle downloads belong to the observed
interval. First visible frame and complete live scene are separate milestones.
It neither invokes Playwright's test runner nor asserts timing budgets.
