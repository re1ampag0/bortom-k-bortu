// Shared tracing and counters with weather-window.
import {measureWindows} from '../scene-window/measure.mjs';
await measureWindows({out:'docs/screenshots/ship-window/checks',url:process.argv[2]??'http://127.0.0.1:5322/bortom-k-bortu/',tag:process.argv[3]??'after'});
