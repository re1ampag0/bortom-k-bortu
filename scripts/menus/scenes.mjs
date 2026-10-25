// The sole menu adapter of the existing exporter. Root selection belongs here.
import{extractScenes}from'../scene-window/extract.mjs';
const boats=['pearl','revenge','endeavour','dutch','engraved_ink'];
const boards={...Object.fromEntries(['CoinSpark','Main','Phone','Pirates','Company','PiratesPhone','CompanyPhone','Panel','Blood','Deep',...boats.map(n=>'Boat_'+n),...boats.filter(n=>n!=='engraved_ink').map(n=>'Dock_'+n)].map(n=>[n,n])),'Chart_main':'ChartMain','Chart_mainPhone':'ChartPhoneMain','Chart_prep':'ChartPrep','Chart_prepPhone':'ChartPhone','Chart_net':'ChartNet','Chart_netPhone':'ChartPhone'};
await extractScenes({weather:true,menu:true,sceneSelector:'#menu-art',out:'src/ui/menus/art',manifestPath:'src/ui/menus/scenes.json',sourceDir:'docs/mockups/menus',sourceURL:'http://127.0.0.1:5340',boards});

// Opponent boats are deliberately anonymous dark silhouettes, never team artwork.
const {readFileSync,writeFileSync}=await import('node:fs');
const silhouette='src/ui/menus/art/Boat_engraved_ink-asset-ship_engraved_ink.svg';
writeFileSync(silhouette,readFileSync(silhouette,'utf8').replace(/(fill|stroke|stop-color)="(?!none)[^"]*"/g,(_,attr)=>`${attr}="${attr==='stroke'?'#12232d':'#050c10'}"`));
