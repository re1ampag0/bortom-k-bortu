// Only the Storm has a separate Phone artboard. For other comparisons rearrange
// their accepted desktop board using Phone's geometry; never substitute Storm art.
export async function phoneReference(page){
 await page.evaluate(()=>{
  const scene=document.querySelector('[class*="-scene"]'),root=scene.parentElement,plaque=[...scene.children].find(e=>e.querySelector('h1')),close=scene.querySelector('button');
  const card=[...root.querySelectorAll('div')].find(e=>e.style.width==='236px'&&e.style.height==='352px'),right=card.parentElement,body=right.parentElement,left=body.firstElementChild;
  Object.assign(root.style,{width:'390px',height:'auto',minHeight:'1180px',border:'0',borderRadius:'0',overflow:'hidden'});
  const header=document.createElement('div');header.style.cssText='position:relative;width:390px;height:196px;overflow:hidden;flex:none';root.insertBefore(header,scene);header.append(scene);
  Object.assign(scene.style,{width:'920px',height:'210px',transform:'translateX(-234.333px) scale(.933333)',transformOrigin:'0 0',flex:'none'});
  header.after(plaque);Object.assign(plaque.style,{position:'relative',left:'auto',top:'auto',borderRadius:'0',boxSizing:'border-box',width:'390px',height:'auto',minHeight:'98px',flex:'none',padding:'10px 20px 12px'});plaque.querySelector('h1').style.fontSize='26px';
  if(close){header.append(close);Object.assign(close.style,{position:'absolute',left:'auto',right:'14px',top:'14px',zIndex:'8'});}
  Object.assign(body.style,{display:'flex',flexDirection:'column',height:'auto',gap:'16px',padding:'16px 16px 20px',boxSizing:'border-box'});
  Object.assign(left.style,{width:'100%',flex:'none',minWidth:'0',order:'1'});Object.assign(right.style,{order:'0',alignSelf:'center',flex:'none'});
  for(const grid of left.querySelectorAll('[style*="grid-template-columns"]'))grid.style.gridTemplateColumns='1fr';
  for(const grid of left.querySelectorAll('[style*="display: grid"]'))for(const cell of grid.children)cell.style.flexWrap='wrap';
  const chart=[...root.children].find(e=>e.tagName==='svg');if(chart)chart.remove();
 });
 // Static original Phone chart, behind the rearranged body.
 const chart=await page.request.get('http://127.0.0.1:5330/artboards/Phone.dc.html');const source=await chart.text(),svg=source.match(/<svg[^>]+width="390" height="1000"[\s\S]*?<\/svg>/)?.[0];
 if(svg)await page.evaluate(svg=>{const root=document.querySelector('[class*="-scene"]').parentElement.parentElement;root.insertAdjacentHTML('afterbegin',svg);},svg);
}
