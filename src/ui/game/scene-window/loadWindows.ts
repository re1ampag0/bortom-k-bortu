import {queueSceneWarm} from './idle';
// Only dynamic edges here: large scene manifests and the ship catalogue stay out of the entry bundle.
let ship:Promise<typeof import('../ship-window/ShipWindow')>|undefined;
let weather:Promise<typeof import('../weather-window/WeatherScene')>|undefined;
export const loadShipWindow=()=>ship??=import('../ship-window/ShipWindow');
export const loadWeatherScene=()=>weather??=import('../weather-window/WeatherScene');
/** Sequential idle work shares the promises used by a real press. */
export async function prepareInfoWindows(weatherName?:string){
 for(const code of ['Ж','М','И','Г'])await queueSceneWarm(()=>loadShipWindow().then(module=>module.prepareShipWindow(code)));
 if(weatherName)await queueSceneWarm(()=>loadWeatherScene().then(module=>module.prepareWeatherScene(weatherName)));
}
