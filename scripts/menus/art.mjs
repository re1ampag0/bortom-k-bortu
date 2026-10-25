// Offline preparation of the accepted illustrations with the existing window exporter.
import{extractScenes}from'../scene-window/extract.mjs';
await extractScenes({weather:true,menu:true,out:'src/ui/menus/art',manifestPath:'src/ui/menus/scenes.json',sourceDir:'docs/mockups/menus',sourceURL:'http://127.0.0.1:5340',boards:Object.fromEntries(['Main','Phone','Pirates','Company','PiratesPhone','CompanyPhone','Panel','Blood','Deep'].map(n=>[n,n]))});
