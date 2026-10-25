// Offline preparation of the accepted illustrations with the existing window exporter.
import{extractScenes}from'../scene-window/extract.mjs';
await extractScenes({weather:true,menu:true,out:'src/ui/menus/art',manifestPath:'src/ui/menus/scenes.json',sourceDir:'docs/mockups/menus',sourceURL:'http://127.0.0.1:5340',boards:{'Chart_main':'ChartMain','Chart_mainPhone':'ChartPhoneMain','Chart_prep':'ChartPrep','Chart_prepPhone':'ChartPhone','Chart_net':'ChartNet','Chart_netPhone':'ChartPhone'}});
