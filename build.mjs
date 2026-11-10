import {readFileSync,writeFileSync,mkdirSync,copyFileSync} from 'node:fs';
const html=readFileSync('docs/index.html','utf8');
mkdirSync('dist/server',{recursive:true});mkdirSync('dist/.openai',{recursive:true});
writeFileSync('dist/server/index.js','const PAGE='+JSON.stringify(html)+';\n'+readFileSync('server/worker.mjs','utf8'));
copyFileSync('.openai/hosting.json','dist/.openai/hosting.json');
