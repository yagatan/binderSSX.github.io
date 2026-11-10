const origin='https://yagatan.github.io';
const digest=async value=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value))),b=>b.toString(16).padStart(2,'0')).join('');
function field(value,max){if(typeof value!=='string')return '';value=value.trim();return value.length<=max?value:''}
export default {async fetch(req,env){
 const url=new URL(req.url);
 const headers={'Content-Type':'application/json','Cache-Control':'no-store','Vary':'Origin','X-Content-Type-Options':'nosniff'};
 if(req.headers.get('Origin')===origin)Object.assign(headers,{'Access-Control-Allow-Origin':origin,'Access-Control-Allow-Headers':'Content-Type','Access-Control-Allow-Methods':'GET, POST, OPTIONS'});
 const reply=(data,status=200)=>new Response(JSON.stringify(data),{status,headers});
 if(req.method==='OPTIONS')return new Response(null,{status:204,headers});
 if(req.method==='GET'&&['/','/index.html'].includes(url.pathname))return new Response(PAGE,{headers:{'Content-Type':'text/html; charset=utf-8','Referrer-Policy':'no-referrer'}});
 const db=env.DB;const path=url.pathname;const thread=/^\/api\/topics\/([1-9]\d{0,12})$/.exec(path);
 try{
 if(req.method==='GET'&&path==='/api/topics')return reply((await db.prepare('SELECT t.id,t.title,t.nick,(SELECT COUNT(*) FROM replies r WHERE r.topic=t.id) AS replies FROM topics t ORDER BY id DESC').all()).results);
 if(req.method==='GET'&&thread){const t=await db.prepare('SELECT nick,body,created FROM topics WHERE id=?').bind(thread[1]).first();if(!t)return reply({error:'Тема не найдена'},404);return reply([t,...(await db.prepare('SELECT nick,body,created FROM replies WHERE topic=? ORDER BY id').bind(thread[1]).all()).results])}
 if(req.method!=='POST')return reply({error:'Страница не найдена'},404);
 const requestOrigin=req.headers.get('Origin');if(requestOrigin&&requestOrigin!==origin&&requestOrigin!==url.origin)return reply({error:'Источник запроса недоступен'},403);
 if(!req.headers.get('Content-Type')?.startsWith('application/json'))return reply({error:'Требуется JSON'},415);
 const raw=await req.text();if(raw.length>12000)return reply({error:'Слишком длинный запрос'},413);
 let data;try{data=JSON.parse(raw)}catch{}if(!data||typeof data!=='object')return reply({error:'Проверь поля формы'},400);
 if(['/api/license','/api/verify'].includes(path)){
 const hwid=field(data.hwid,180);if(!/^[a-zA-Z0-9{}:_-]{4,180}$/.test(hwid))return reply({error:'Проверь HWID и скопируй его целиком.'},400);
 const device=await digest(hwid.toUpperCase());
 if(path==='/api/verify'){const row=await db.prepare('SELECT 1 AS valid FROM licenses WHERE device=? AND license=?').bind(device,field(data.key,80)).first();return reply({valid:!!row})}
 const key='YG-'+crypto.randomUUID().toUpperCase();await db.prepare('INSERT INTO licenses(device,license) VALUES(?,?) ON CONFLICT(device) DO NOTHING').bind(device,key).run();
 const row=await db.prepare('SELECT license AS key FROM licenses WHERE device=?').bind(device).first();return reply(row)}
 if(path!=='/api/topics'&&!thread)return reply({error:'Страница не найдена'},404);
 const nick=field(data.nick,32),body=field(data.body,2500),title=field(data.title,100);
 if(!nick||!body||(!thread&&!title))return reply({error:'Заполни все поля и проверь длину сообщения.'},400);
 if(thread&&!(await db.prepare('SELECT id FROM topics WHERE id=?').bind(thread[1]).first()))return reply({error:'Тема не найдена'},404);
 const now=Date.now(),actor=await digest('forum:'+ (req.headers.get('CF-Connecting-IP')||req.headers.get('oai-authenticated-user-id')||'guest'));
 const allowance=await db.prepare('INSERT INTO cooldown(actor,until_ms) VALUES(?,?) ON CONFLICT(actor) DO UPDATE SET until_ms=excluded.until_ms WHERE cooldown.until_ms<=? RETURNING actor').bind(actor,now+5000,now).first();
 if(!allowance)return reply({error:'Подожди несколько секунд перед следующей публикацией.'},429);
 if(thread)await db.prepare('INSERT INTO replies(topic,nick,body,created) VALUES(?,?,?,?)').bind(thread[1],nick,body,now).run();
 else await db.prepare('INSERT INTO topics(title,nick,body,created) VALUES(?,?,?,?)').bind(title,nick,body,now).run();
 return reply({ok:true},201)
 }catch{return reply({error:'Сервис временно недоступен. Попробуй ещё раз.'},503)}
}};
