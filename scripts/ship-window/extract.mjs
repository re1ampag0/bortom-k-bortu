// Read-only source: the accepted artboards. Export static artwork and presentation styles, never their game data/runtime.
import {chromium} from '@playwright/test';
import {mkdirSync,writeFileSync} from 'node:fs';
const root='src/ui/game/ship-window/art';mkdirSync(root,{recursive:true});
const browser=await chromium.launch({executablePath:'/usr/bin/chromium'});
const page=await browser.newPage({viewport:{width:920,height:640},deviceScaleFactor:3});
const catalogue={};
try{for(const [code,name]of Object.entries({'Ж':'Main','М':'Revenge','И':'Endeavour','Г':'Dutchman'})){
 await page.goto(`http://127.0.0.1:5319/artboards/${name}.dc.html`);await page.evaluate(()=>document.fonts.ready);
 const result=await page.evaluate(()=>{
  for(const a of document.getAnimations()){a.pause();a.currentTime=0;}
  const root=[...document.querySelectorAll('div')].find(e=>e.style.width==='920px'&&e.style.height==='640px');
  const scene=root.firstElementChild,body=root.children[2],left=body.children[0],card=body.children[1].firstElementChild,footer=root.lastElementChild;
  const style=e=>e?Object.fromEntries([...e.style].map(k=>[k.replace(/-([a-z])/g,(_,c)=>c.toUpperCase()),e.style.getPropertyValue(k)])):{};
  const title=scene.querySelector('h1');
  const plaque=title.parentElement.parentElement;const medal=plaque.querySelector('svg');
  const headings=[...left.querySelectorAll('h3')],rows=headings.map(h=>h.parentElement.parentElement);
  const staticSvg=source=>{
   const clone=source.cloneNode(true),a=[source,...source.querySelectorAll('*')],b=[clone,...clone.querySelectorAll('*')];
   for(let i=0;i<a.length;i++){
    const s=getComputedStyle(a[i]);for(const k of ['transform','transform-origin','opacity','filter','fill','stroke','stroke-width','stroke-dasharray','stroke-dashoffset','mix-blend-mode'])b[i].style.setProperty(k,s.getPropertyValue(k));
    b[i].style.animation='none';b[i].style.transition='none';
   }
   clone.querySelectorAll('animate,animateTransform,animateMotion,script').forEach(e=>e.remove());
   clone.setAttribute('xmlns','http://www.w3.org/2000/svg');clone.style.position='static';clone.style.left='';clone.style.top='';
   return new XMLSerializer().serializeToString(clone);
  };
  const cardImage=card.querySelector('img'),cardArt=cardImage.parentElement,cardHeader=cardArt.previousElementSibling;
  const nameEl=[...card.querySelectorAll('div')].find(e=>e.style.fontSize==='20px');
  const big=nameEl.nextElementSibling;
  const cost=cardHeader.querySelector('span');
  const styles={root:style(root),scene:style(scene),body:style(body),left:style(left),motto:style(left.firstElementChild),tracks:style(left.children[1]),featureHeading:style(left.querySelector('h2')),featureRow:style(rows[0]),featureMedal:style(rows[0].firstElementChild),featureCopy:style(headings[0].parentElement),featureName:style(headings[0]),featureText:style(headings[0].nextElementSibling),plaque:style(plaque),plaqueText:style(title.parentElement),title:style(title),team:style(title.previousElementSibling),captain:style(title.nextElementSibling),medal:style(medal),close:style(scene.querySelector('button')),card:style(card),cardHeader:style(cardHeader),cardArt:style(cardArt),cardImage:style(cardImage),cardName:style(nameEl),cardBig:style(big),cardTextBox:style(card.querySelector('p').parentElement),cardText:style(card.querySelector('p')),cardFoot:style(card.querySelector('[class$="-foot"]')),cost:style(cost),footer:style(footer),count:style(footer.querySelector('span')),discard:style(footer.querySelector('button'))};
  const assets={body:staticSvg(root.children[1]),medal:staticSvg(plaque.querySelector('svg')),close:staticSvg(scene.querySelector('button svg')),discard:staticSvg(footer.querySelector('button svg')),features:rows.map(row=>staticSvg(row.querySelector('svg'))),legend:cardImage.getAttribute('src')};
  const decor=plaque.querySelector(':scope > svg');if(decor&&decor!==plaque.querySelector('svg'))assets.plaque=staticSvg(decor);
  plaque.style.visibility='hidden';scene.querySelector('button').style.visibility='hidden';
  return {styles,assets};
 });
 for(const [key,value]of Object.entries(result.assets)){
  if(key==='features')value.forEach((svg,i)=>writeFileSync(`${root}/${name}-feature-${i}.svg`,svg));
  else if(key==='legend'){
   const {readFileSync}=await import('node:fs');writeFileSync(`${root}/${name}-legend.svg`,readFileSync('docs/mockups/ship-window/'+value.replace('../','')));
  }else writeFileSync(`${root}/${name}-${key}.svg`,value);
 }
 await page.locator('[class$="-scene"]').screenshot({path:`${root}/${name}-scene.png`});
 catalogue[code]={name,styles:result.styles};
 console.log(name,'exported');
}}finally{await browser.close();}
writeFileSync('src/ui/game/ship-window/catalogue.json',JSON.stringify(catalogue,null,1)+'\n');
