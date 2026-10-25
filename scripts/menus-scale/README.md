# Menu frames (not tests)

Baseline commit: `49f62b6`, including the separate approved phone typography commit.
Create a detached worktree at that commit and link/install its dependencies.

Run the unmodified game server on5350 with ALLOWED_ORIGINS for127.0.0.1:5351 and:5352;
use a temporary DATA_DIR. `vite-node server/main.ts -- --port 5350` avoids a server build.
`serve.mjs before <worktree>` and `serve.mjs after <current-root>` provide the two Vite servers.
The helper server definitions normalize build/version labels for both snapshots.
The frame proxy normalizes only the displayed room code, not the server state or game rules.
A development response substitutes Fragment for StrictMode to avoid the existing development
WebSocket cleanup; no product source is changed by that substitution.

- `PHASE=before node scripts/menus-scale/capture.mjs`: six control sizes on the baseline.
- `KEYBOARD=1 node scripts/menus-scale/capture.mjs`: the current25-size matrix, eight screens each.
- `SIZES=390x844 SCREENS=rules node scripts/menus-scale/capture.mjs`: replace only selected frames.
- `node scripts/menus-scale/compare.mjs`: exact RGBA pixel differences, with the permitted action-strip mask.
- `PHASE=disabled DISABLE=1` with capture/compare verifies the legacy switch.
- `node scripts/menus-scale/report.mjs`: contact sheets, native-pixel text/border crops and JSON layout report.
- `node scripts/menus-scale/safe-area.mjs`: extra safe-area frame; reports whether CDP or explicitly labelled CSS emulation was used.

Frames freeze the existing captureScene clock at0 and disable screenshot animations. No assertions,
e2e suite, engine simulation, compilation, performance trace or new runtime animation loop is involved.
The viewport inventory includes1024×650 as a notebook; its Chromium mobile emulation is deliberately
also exercised. WebKit is used for emulated devices only if its existing executable is available.
