import config from '../../playwright.config';
export default {...config,testDir:process.cwd()+'/e2e',use:{...config.use,baseURL:process.env.SHIP_URL??'http://127.0.0.1:5325/bortom-k-bortu/'},
 webServer:process.env.SHIP_URL?undefined:{command:'node scripts/ship-window/e2e-site.mjs',url:'http://127.0.0.1:5325/bortom-k-bortu/',cwd:process.cwd(),reuseExistingServer:true,timeout:120000},
 projects:config.projects?.filter(p=>p.name==='chromium').map(p=>({...p,grep:undefined,grepInvert:undefined,use:{...p.use,launchOptions:{executablePath:'/usr/bin/chromium'}}}))};
