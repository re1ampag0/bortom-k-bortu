import config from '../../playwright.config';
export default {
  ...config,
  testDir:process.cwd()+'/e2e',
  use:{...config.use,baseURL:'http://127.0.0.1:4191/bortom-k-bortu/'},
  webServer:{command:'node scripts/fx-ambient/e2e-site.mjs',url:'http://127.0.0.1:4191/bortom-k-bortu/',cwd:process.cwd(),reuseExistingServer:false,timeout:120000},
  projects:config.projects?.filter(project=>project.name==='chromium').map(project=>({...project,use:{...project.use,launchOptions:{executablePath:'/usr/bin/chromium'}}})),
};
