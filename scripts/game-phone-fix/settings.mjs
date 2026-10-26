// Short UI evidence for the requested settings and URL-only diagnostic lifetime.
import {chromium} from '@playwright/test';import {readFileSync,writeFileSync} from 'node:fs';
const root='docs/screenshots/game-phone-fix',f=JSON.parse(readFileSync(root+'/fixtures.json')),out={},b=await chromium.launch({executablePath:'/usr/bin/chromium'}),p=await b.newPage({viewport:{width:1366,height:660},deviceScaleFactor:2});
try{
 await p.addInitScript(r=>{localStorage.clear();localStorage.setItem('bortom-perf','1');localStorage.setItem('bortom-k-bortu.save',JSON.stringify(r))},f.table.record);
 await p.goto('http://127.0.0.1:5363/bortom-k-bortu/?speed=instant');await p.getByTestId('resume-go').click();await p.waitForTimeout(200);
 out.normal={panels:await p.getByTestId('perf-panel').count(),legacyFlag:await p.evaluate(()=>localStorage.getItem('bortom-perf'))};
 await p.getByTestId('settings-btn').click();out.default=await p.getByTestId('view-play-sheet').getAttribute('aria-pressed');await p.getByTestId('view-play-scroll').click();out.persisted=await p.evaluate(()=>JSON.parse(localStorage.getItem('bortom-k-bortu.settings')).view.play);await p.screenshot({path:root+'/settings.png',scale:'css'});
 await p.getByTestId('settings').getByRole('button',{name:'Закрыть',exact:true}).click();out.immediate=await p.getByTestId('game').getAttribute('data-play-layout');
 await p.goto('http://127.0.0.1:5363/bortom-k-bortu/?speed=instant&perf=1');await p.getByTestId('resume-go').click();await p.waitForTimeout(150);out.enabled={panels:await p.getByTestId('perf-panel').count(),stored:await p.evaluate(()=>localStorage.getItem('bortom-perf'))};await p.getByRole('button',{name:'Закрыть диагностику'}).click();out.closed=await p.getByTestId('perf-panel').count();
}finally{writeFileSync(root+'/settings.json',JSON.stringify(out,null,2));await b.close();}console.log(JSON.stringify(out));
