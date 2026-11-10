import {readFileSync,writeFileSync,mkdirSync,copyFileSync,existsSync} from 'node:fs';
const html=readFileSync('docs/index.html','utf8');
mkdirSync('dist/server',{recursive:true});mkdirSync('dist/.openai',{recursive:true});
writeFileSync('dist/server/index.js','const PAGE='+JSON.stringify(html)+';\n'+readFileSync('server/worker.mjs','utf8'));
if(existsSync('.openai/hosting.json')) copyFileSync('.openai/hosting.json','dist/.openai/hosting.json');
