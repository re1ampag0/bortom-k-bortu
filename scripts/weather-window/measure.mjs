import {measureWindows} from '../scene-window/measure.mjs';
await measureWindows({weather:true,keys:process.env.WEATHER_KEYS?.split(','),out:'docs/screenshots/weather-window/checks',url:process.argv[2]??'http://127.0.0.1:5331/bortom-k-bortu/',tag:'final'});
