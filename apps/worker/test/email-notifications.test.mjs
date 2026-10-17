import { URL } from "node:url"
const { crypto, Response } = globalThis
import { test } from "node:test"
import assert from "node:assert/strict"
import { DatabaseSync } from "node:sqlite"
import { readFileSync } from "node:fs"
import { d1Email } from "../src/modules/notifications/infrastructure/d1-email.ts"
import { emailService, dispatchEmail } from "../src/modules/notifications/application/email-service.ts"
import { stalwartEmail } from "../src/modules/notifications/infrastructure/stalwart-email.ts"
import { createApp } from "../src/app.ts"
const actor = {tenantId:"user:alice",userId:"alice"}
const other = {tenantId:"user:bob",userId:"bob"}
const email = "alice@example.test"
function setup() {
 const sqlite = new DatabaseSync(":memory:")
 for (const name of ["0001_projects","0002_notifications","0003_email_notifications"]) sqlite.exec(readFileSync(new URL("../migrations/"+name+".sql",import.meta.url),"utf8"))
 sqlite.prepare("INSERT INTO tenants(id,kind,name,created_by) VALUES(?,'personal','Alice','alice'),(?,'personal','Bob','bob')").run(actor.tenantId,other.tenantId)
 const DB = {
  prepare(sql) {
   let values=[]
   return {bind(...args){values=args;return this},
    async first(){return sqlite.prepare(sql).get(...values) ?? null},
    async all(){return {results:sqlite.prepare(sql).all(...values)}},
    async run(){return {meta:{changes:Number(sqlite.prepare(sql).run(...values).changes)}}},
   }
  },
  async batch(statements) {
   sqlite.exec("BEGIN")
   try { const results=[]; for(const s of statements) results.push(await s.run()); sqlite.exec("COMMIT"); return results }
   catch(e) {sqlite.exec("ROLLBACK");throw e}
  },
 }
 let now=1800000000000
 const secure={id:()=>crypto.randomUUID(),code:()=>"123456",hash:async(id,code)=>id+":"+code}
 const sends=[]
 let result={status:"accepted",providerId:"submission"}
 const provider={configured:()=>true,async send(n){sends.push(n);return result}}
 const repo=d1Email(DB)
 const service=emailService(repo,provider,secure,()=>now)
 async function verified() {await service.requestCode(actor,email);await service.verify(actor,email,"123456")}
 return {sqlite,DB,repo,service,provider,sends,verified,now:()=>now,tick(ms){now+=ms},result(r){result=r},key:()=>crypto.randomUUID()}
}
test("email verification, tenant isolation, idempotency and cancellation persist in SQL", async()=>{
 const s=setup()
 await assert.rejects(s.service.schedule(actor,email,{title:"Reminder",scheduledAt:s.now(),requestKey:s.key()}),e=>e.code==="email_not_verified")
 await s.verified()
 const input={title:"Reminder",scheduledAt:s.now()+60000,requestKey:s.key()}
 const n=await s.service.schedule(actor,email,input)
 assert.equal((await s.service.schedule(actor,email,input)).id,n.id)
 await assert.rejects(s.service.schedule(actor,email,{...input,title:"Different"}),e=>e.code==="email_request_conflict")
 assert.equal((await s.repo.list(other)).length,0)
 const sameOrg={...actor,userId:"another-member"}
 assert.equal((await s.repo.list(sameOrg)).length,0)
 assert.equal(await s.repo.cancel(sameOrg,n.id),false)
 await assert.rejects(s.service.cancel(other,n.id),e=>e.code==="email_not_pending")
 await s.service.cancel(actor,n.id)
 assert.equal(s.sqlite.prepare("SELECT status FROM email_notifications WHERE id=?").get(n.id).status,"cancelled")
})
test("verification rejects cross-account, wrong, exhausted and expired codes",async()=>{
 const s=setup()
 await s.service.requestCode(actor,email)
 await assert.rejects(s.service.verify(other,email,"123456"))
 await assert.rejects(s.service.verify(actor,"changed@example.test","123456"))
 for(let i=0;i<5;i++) await assert.rejects(s.service.verify(actor,email,"000000"))
 await assert.rejects(s.service.verify(actor,email,"123456"))
 s.tick(60001)
 await s.service.requestCode(actor,email)
 s.tick(600001)
 await assert.rejects(s.service.verify(actor,email,"123456"))
})
test("verification throttles per-user and daily recipient requests",async()=>{
 const s=setup()
 await s.service.requestCode(actor,email)
 await assert.rejects(s.service.requestCode(actor,email),e=>e.code==="email_rate_limited")
 for(let i=1;i<5;i++){s.tick(60001);await s.service.requestCode(actor,email)}
 s.tick(60001)
 await assert.rejects(s.service.requestCode(actor,email),e=>e.code==="email_rate_limited")
 assert.equal(s.sqlite.prepare("SELECT count(*) AS n FROM email_notifications").get().n,5)
})
test("dispatch records acceptance, erases bodies and never resends accepted mail",async()=>{
 const s=setup();await s.verified()
 const n=await s.service.schedule(actor,email,{title:"Reminder",scheduledAt:s.now(),requestKey:s.key()})
 await dispatchEmail(s.repo,s.provider,s.now())
 assert.equal(s.sends.length,1)
 assert.equal((await s.repo.list(actor)).find(x=>x.id===n.id).status,"accepted")
 assert.equal(s.sqlite.prepare("SELECT body FROM email_notifications").get().body,"")
 await dispatchEmail(s.repo,s.provider,s.now())
 assert.equal(s.sends.length,1)
})
test("opt-out cancels queued email independently of WhatsApp",async()=>{
 const s=setup();await s.verified()
 await s.service.schedule(actor,email,{title:"Reminder",scheduledAt:s.now(),requestKey:s.key()})
 await s.service.preferences(actor,email,false)
 await dispatchEmail(s.repo,s.provider,s.now())
 assert.equal(s.sends.length,0)
 assert.equal(s.sqlite.prepare("SELECT count(*) AS n FROM notification_contacts").get().n,0)
 await assert.rejects(s.service.schedule(actor,email,{title:"Reminder",scheduledAt:s.now(),requestKey:s.key()}))
 await assert.rejects(s.service.preferences(actor,"changed@example.test",true))
})
test("definite pre-submission failures retry with a bound; uncertain submission never retries",async()=>{
 const s=setup();await s.verified();
 const n=await s.service.schedule(actor,email,{title:"Reminder",scheduledAt:s.now(),requestKey:s.key()});
 s.result({status:"retry",error:"email_unavailable"})
 for(let i=0;i<6;i++){await dispatchEmail(s.repo,s.provider,s.now());s.tick(600001)}
 // Definite failures stop after five attempts or the expiry boundary.
 assert.equal((await s.repo.list(actor)).find(x=>x.id===n.id).status,"failed")
 const t=setup();await t.verified();
 const uncertain=await t.service.schedule(actor,email,{title:"Reminder",scheduledAt:t.now(),requestKey:t.key()});
 t.result({status:"uncertain",error:"submission_unknown"})
 await dispatchEmail(t.repo,t.provider,t.now())
 t.tick(60000);await dispatchEmail(t.repo,t.provider,t.now())
 assert.equal(t.sends.length,1)
 assert.equal((await t.repo.list(actor)).find(x=>x.id===uncertain.id).status,"uncertain")
})
test("expired claims become uncertain and expired pending messages cannot send",async()=>{
 const s=setup();await s.verified()
 await s.repo.claim(s.now());s.tick(300001)
 await dispatchEmail(s.repo,s.provider,s.now())
 assert.equal(s.sends.length,0)
 assert.equal((await s.repo.list(actor))[0].status,"uncertain")
 const t=setup();await t.verified();t.tick(600001)
 await dispatchEmail(t.repo,t.provider,t.now())
 assert.equal(t.sends.length,0)
 assert.equal((await t.repo.list(actor))[0].status,"expired")
})
test("HTTP email endpoints require authentication, origin and consent; reject destination spoofing",async()=>{
 const s=setup()
 let identity={user:{id:"alice",email},sessionId:"session"}
 const app=createApp(async()=>identity)
 const env={DB:s.DB,APP_ORIGINS:"https://amautai.test",WORKOS_COOKIE_PASSWORD:"fixture",EMAIL_JMAP_SESSION_URL:"https://mail.test/jmap/session",EMAIL_JMAP_USERNAME:"sender",EMAIL_JMAP_PASSWORD:"fixture",EMAIL_FROM:"sender@example.test"}
 const request=(path,method="GET",body,origin="https://amautai.test")=>app.request("https://amautai.test/api/notifications/email"+path,{method,headers:{Origin:origin,"X-Amautai-Request":"1","Content-Type":"application/json"},...(body?{body:JSON.stringify(body)}:{})},env)
 assert.equal((await request("")).status,200)
 assert.equal((await request("/verify/request","POST",{consent:false})).status,400)
 assert.equal((await request("/verify/request","POST",{consent:true,email:"victim@example.test"})).status,400)
 assert.equal((await request("/verify/request","POST",{consent:true},"https://evil.test")).status,403)
 assert.equal((await request("/verify/request","POST",{consent:true})).status,200)
 assert.equal((await s.repo.contact(actor)).email,email)
 identity=null
 assert.equal((await request("")).status,401)
})
const core="urn:ietf:params:jmap:core",mail="urn:ietf:params:jmap:mail",submission="urn:ietf:params:jmap:submission"
test("JMAP validates sender, composes text and reports acceptance rather than delivery",async()=>{
 const original=globalThis.fetch
 const calls=[]
 globalThis.fetch=async(url,init)=>{
  calls.push({url,init})
  if(calls.length===1) return Response.json({apiUrl:"https://mail.test/jmap/",primaryAccounts:{[mail]:"a",[submission]:"a"}})
  if(calls.length===2) return Response.json({methodResponses:[["Identity/get",{list:[{id:"i",email:"sender@example.test"}]},"identity"],["Mailbox/query",{ids:["drafts"]},"drafts"]]})
  return Response.json({methodResponses:[["Email/set",{created:{message:{id:"m"}}},"message"],["EmailSubmission/set",{created:{send:{id:"s"}}},"submit"]]})
 }
 try{
  const p=stalwartEmail({sessionUrl:"https://mail.test/jmap/session",username:"sender",password:"secret",from:"sender@example.test"})
  const result=await p.send({id:"uuid",email,body:"Text",title:"Title"})
  assert.deepEqual(result,{status:"accepted",providerId:"s"})
  assert.ok(calls.every(c=>c.init.redirect==="manual"))
  const data=JSON.parse(calls[2].init.body)
  assert.deepEqual(data.using,[core,mail,submission])
  assert.equal(data.methodCalls[0][1].create.message.to[0].email,email)
  assert.equal(data.methodCalls[1][1].create.send.emailId,"#message")
 }finally{globalThis.fetch=original}
})
test("JMAP timeout during submission stays uncertain; discovery failure is retryable",async()=>{
 const original=globalThis.fetch
 let call=0
 globalThis.fetch=async()=>{
  call++
  if(call===1) return Response.json({apiUrl:"https://mail.test/jmap/",primaryAccounts:{[mail]:"a",[submission]:"a"}})
  if(call===2) return Response.json({methodResponses:[["Identity/get",{list:[{id:"i",email:"sender@example.test"}]},"identity"],["Mailbox/query",{ids:["drafts"]},"drafts"]]})
  throw new Error("timeout")
 }
 try{
  const p=stalwartEmail({sessionUrl:"https://mail.test/jmap/session",username:"sender",password:"secret",from:"sender@example.test"})
  assert.equal((await p.send({id:"id",email,body:"Text",title:"Title"})).status,"uncertain")
  globalThis.fetch=async()=>{throw new Error("offline")}
  assert.equal((await p.send({})).status,"retry")
  assert.equal(stalwartEmail({sessionUrl:"http://mail.test"}).configured(),false)
 }finally{globalThis.fetch=original}
})
test("JMAP refuses cross-origin credential forwarding",async()=>{
 const original=globalThis.fetch
 let calls=0
 globalThis.fetch=async()=>{calls++;return Response.json({apiUrl:"https://evil.test/jmap/",primaryAccounts:{}})}
 try{
  const p=stalwartEmail({sessionUrl:"https://mail.test/jmap/session",username:"sender",password:"secret",from:"sender@example.test"})
  assert.equal((await p.send({})).status,"failed")
  assert.equal(calls,1)
 }finally{globalThis.fetch=original}
})

test("JMAP refuses redirect responses without sending credentials to another endpoint",async()=>{
 const original=globalThis.fetch
 let calls=0
 globalThis.fetch=async()=>{calls++;return new Response(null,{status:302,headers:{Location:"https://evil.test/"}})}
 try{
  const p=stalwartEmail({sessionUrl:"https://mail.test/jmap/session",username:"sender",password:"secret",from:"sender@example.test"})
  assert.equal((await p.send({})).status,"retry")
  assert.equal(calls,1)
 }finally{globalThis.fetch=original}
})
