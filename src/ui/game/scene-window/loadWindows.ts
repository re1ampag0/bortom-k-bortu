// Only dynamic edges here: large scene manifests and the ship catalogue stay out of the entry bundle.
let ship:Promise<typeof import('../ship-window/ShipWindow')>|undefined;
let weather:Promise<typeof import('../weather-window/WeatherScene')>|undefined;
export const loadShipWindow=()=>ship??=import('../ship-window/ShipWindow');
export const loadWeatherScene=()=>weather??=import('../weather-window/WeatherScene');
/** Same promises for idle preparation and the first press; no duplicate metadata or image work. */
export async function prepareInfoWindows(weatherName?:string){
 await Promise.all([
  loadShipWindow().then(module=>module.prepareShipWindow()),
  loadWeatherScene().then(module=>weatherName?module.prepareWeatherScene(weatherName):undefined),
 ]);
}
