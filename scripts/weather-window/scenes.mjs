import {extractScenes} from '../scene-window/extract.mjs';
const groups=[{storm:'Main',fog:'Fog',tortuga:'Tortuga',wind:'Wind',clear:'ClearSky'},{wet:'WetPowder',calm:'Calm',wave:'NinthWave',maelstrom:'Maelstrom',mermaids:'Mermaids',rum:'Rum'},{caravan:'Caravan',reefs:'Reefs',thunder:'Thunder',fleet:'Fleet',moon:'Moonlight',current:'Current'}];
const stage=Number(process.argv[2]??0);
await extractScenes({weather:true,out:'src/ui/game/weather-window/art',manifestPath:'src/ui/game/weather-window/scenes.json',sourceDir:'docs/mockups/weather-window',sourceURL:'http://127.0.0.1:5330',phone:process.argv.includes('--phone'),boards:process.argv.includes('--phone')?{'storm-phone':'Phone'}:groups[stage]});

// Keep the runtime scene chunks in sync with each offline export.
await import('../menus-speed/prepare.mjs').then(m=>m.prepareScenes());
