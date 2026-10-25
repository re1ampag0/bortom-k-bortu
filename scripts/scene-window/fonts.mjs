import {createRequire} from 'node:module';
import {dirname,resolve} from 'node:path';
import {readFileSync} from 'node:fs';
const require=createRequire(import.meta.url);
let referenceFonts='';
for(const [pkg,variants]of Object.entries({'alegreya':['500','700','400-italic'],'alegreya-sc':['500','700'],'alegreya-sans':['400','500','700'],'old-standard-tt':['400','700']}))for(const subset of ['latin','cyrillic'])for(const variant of variants){
 const path=require.resolve(`@fontsource/${pkg}/${subset}-${variant}.css`);
 referenceFonts+=readFileSync(path,'utf8').replace(/url\(([^)]+)\)/g,(_m,file)=>`url(data:font/woff2;base64,${readFileSync(resolve(dirname(path),file)).toString('base64')})`);
}
export {referenceFonts};
