// Same offline exporter as weather-window; retain the ship-specific source/data adapters.
import {extractScenes} from '../scene-window/extract.mjs';
const phone=process.argv.includes('--phone');
await extractScenes({phone,out:'src/ui/game/ship-window/art',manifestPath:'src/ui/game/ship-window/scenes.json',sourceDir:'docs/mockups/ship-window',sourceURL:'http://127.0.0.1:5319',boards:phone?{'Г-phone':'Phone'}:{'Ж':'Main','М':'Revenge','И':'Endeavour','Г':'Dutchman'}});
