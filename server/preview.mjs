import http from 'node:http';
import {DatabaseSync} from 'node:sqlite';
import {readFileSync} from 'node:fs';
import worker from '../dist/server/index.js';
const db=new DatabaseSync(':memory:');
db.exec(readFileSync('drizzle/0000_portal.sql','utf8'));
const DB={prepare(sql){const query=db.prepare(sql);function bind(...args){return {first:()=>query.get(...args),all:()=>({results:query.all(...args)}),run:()=>query.run(...args)}}return {...bind(),bind}}};
const args=process.argv.slice(2);
const option=(name,fallback)=>args.includes(name)?args[args.indexOf(name)+1]:fallback;
http.createServer(async(req,res)=>{
 const chunks=[];for await(const chunk of req)chunks.push(chunk);
 const request=new Request('http://'+req.headers.host+req.url,{method:req.method,headers:req.headers,body:req.method==='POST'?Buffer.concat(chunks):undefined});
 const response=await worker.fetch(request,{DB});res.writeHead(response.status,Object.fromEntries(response.headers));res.end(Buffer.from(await response.arrayBuffer()));
}).listen(Number(option('--port','4173')),option('--host','127.0.0.1'));
