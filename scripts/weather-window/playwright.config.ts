import config from '../ship-window/playwright.config';
export default {...config,use:{...config.use,baseURL:process.env.WEATHER_URL??'http://127.0.0.1:5331/bortom-k-bortu/'},webServer:undefined};
