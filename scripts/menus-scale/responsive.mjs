// Convert viewport-dependent menu layout rules to the shared mode. Keep the exact legacy/game fallback.
import postcss from 'postcss';import{readFileSync,writeFileSync}from'node:fs';
for(const file of ['menus.css','menus-fix2.css','menus-fix3.css']){
 const path='src/ui/menus/'+file,root=postcss.parse(readFileSync(path,'utf8'));
 root.walkAtRules('media',rule=>{
  const p=rule.params;let mode=null;
  if(/max-width:\s*(700|999)px/.test(p))mode='phone';
  else if(/min-width:\s*(701|1000)px/.test(p))mode='scene';
  else if(!/min-width:\s*1600px/.test(p))return;
  if(mode){const enabled=rule.clone({params:'all'});enabled.walkRules(r=>{r.selectors=r.selectors.map(s=>`:where(body[data-menuscale="1"][data-menu-layout="${mode}"]) ${s}`);});rule.after(enabled);}
  rule.walkRules(r=>{r.selectors=r.selectors.map(s=>`:where(body:not([data-menuscale="1"])) ${s}`);});
 });
 root.walkDecls(d=>{if(/^(border|box-shadow|outline)/.test(d.prop))d.value=d.value.replace(/(?<![\w.])1\.5px/g,'var(--menu-stroke-15, 1.5px)').replace(/(?<![\w.])1px/g,'var(--menu-stroke-1, 1px)');});
 writeFileSync(path,root.toString());
}
