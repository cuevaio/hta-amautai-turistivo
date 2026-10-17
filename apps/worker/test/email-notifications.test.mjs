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
const actor={tenantId:"user:alice",userId:"alice"},other={tenantId:"user:bob",userId:"bob"}
const email="alice@example.test",account={email,emailVerified:true}
function migrate(sqlite,name) {sqlite.exec(readFileSync(new URL("../migrations/"+name+".sql",import.meta.url),"utf8"))}
function setup() {
 const sqlite=new DatabaseSync(":memory:")
 for(const name of ["0001_projects","0002_notifications","0003_email_notifications","0004_email_account_preferences"])migrate(sqlite,name)
 sqlite.prepare("INSERT INTO tenants(id,kind,name,created_by) VALUES(?,'personal','Alice','alice'),(?,'personal','Bob','bob')").run(actor.tenantId,other.tenantId)
 const DB={
  prepare(sql){let values=[];return{
   bind(...args){values=args;return this},
   async first(){return sqlite.prepare(sql).get(...values)??null},
   async all(){return{results:sqlite.prepare(sql).all(...values)}},
   async run(){return{meta:{changes:Number(sqlite.prepare(sql).run(...values).changes)}}},
  }},
  async batch(statements){sqlite.exec("BEGIN");try{const result=[];for(const s of statements)result.push(await s.run());sqlite.exec("COMMIT");return result}catch(e){sqlite.exec("ROLLBACK");throw e}},
 }
 let now=1800000000000,result={status:"accepted",providerId:"submission"}
 const sends=[],secure={id:()=>crypto.randomUUID()}
 const provider={configured:()=>true,async send(n){sends.push(n);return result}}
 const repo=d1Email(DB),service=emailService(repo,provider,secure,()=>now)
 const input=()=>({title:"Reminder",scheduledAt:now,requestKey:crypto.randomUUID()})
 return{sqlite,DB,repo,service,provider,sends,input,now:()=>now,tick(ms){now+=ms},result(r){result=r}}
}
test("login-verified account can send immediately without another code or activation",async()=>{
 const s=setup()
 assert.equal((await s.service.overview(actor,account)).contact.enabled,true)
 const n=await s.service.schedule(actor,account,s.input(),true)
 assert.equal(n.kind,"test")
 assert.equal((await s.repo.list(actor)).length,1)
 assert.equal((await s.repo.contact(actor)).verified_at,s.now())
 assert.equal((await s.repo.contact(actor)).enabled,1)
 assert.equal(s.sqlite.prepare("SELECT consent_at FROM email_contacts").get().consent_at,0)
 await dispatchEmail(s.repo,s.provider,s.now())
 assert.equal(s.sends.length,1)
 assert.equal(s.sends[0].email,email)
 assert.equal((await s.repo.list(actor))[0].status,"accepted")
})
test("an unverified login email cannot enqueue or enable notifications",async()=>{
 const s=setup(),unverified={...account,emailVerified:false}
 assert.equal((await s.service.overview(actor,unverified)).contact.enabled,false)
 await assert.rejects(s.service.schedule(actor,unverified,s.input()),e=>e.code==="email_verification_required")
 await assert.rejects(s.service.preferences(actor,unverified,true),e=>e.code==="email_verification_required")
 assert.equal(await s.repo.contact(actor),null)
})
test("tenant/user isolation, idempotency, conflicts and cancellation persist in SQL",async()=>{
 const s=setup(),input=s.input()
 const n=await s.service.schedule(actor,account,input)
 assert.equal((await s.service.schedule(actor,account,input)).id,n.id)
 await assert.rejects(s.service.schedule(actor,account,{...input,title:"Different"}),e=>e.code==="email_request_conflict")
 assert.equal((await s.repo.list(other)).length,0)
 const member={...actor,userId:"another-member"}
 assert.equal((await s.repo.list(member)).length,0)
 assert.equal(await s.repo.cancel(member,n.id),false)
 await assert.rejects(s.service.cancel(other,n.id),e=>e.code==="email_not_pending")
 await s.service.cancel(actor,n.id)
 assert.equal((await s.repo.list(actor))[0].status,"cancelled")
})
test("opt-out persists across refresh, schedules and verified email changes; explicit enable restores it",async()=>{
 const s=setup()
 await s.service.schedule(actor,account,s.input())
 await s.service.preferences(actor,account,false)
 assert.equal((await s.service.overview(actor,account)).contact.enabled,false)
 await assert.rejects(s.service.schedule(actor,account,s.input()),e=>e.code==="email_disabled")
 const changed={email:"changed@example.test",emailVerified:true}
 await assert.rejects(s.service.schedule(actor,changed,s.input()),e=>e.code==="email_disabled")
 await dispatchEmail(s.repo,s.provider,s.now())
 assert.equal(s.sends.length,0)
 await s.service.preferences(actor,changed,true)
 await s.service.schedule(actor,changed,s.input())
 await dispatchEmail(s.repo,s.provider,s.now())
 assert.equal(s.sends[0].email,changed.email)
 assert.equal(s.sqlite.prepare("SELECT count(*) AS n FROM notification_contacts").get().n,0)
})
test("changing the trusted account email cancels pending mail to the old address",async()=>{
 const s=setup()
 const old=await s.service.schedule(actor,account,s.input())
 const changed={email:"new@example.test",emailVerified:true}
 await s.service.schedule(actor,changed,s.input())
 assert.equal((await s.repo.list(actor)).find(n=>n.id===old.id).status,"cancelled")
 await dispatchEmail(s.repo,s.provider,s.now())
 assert.deepEqual(s.sends.map(n=>n.email),[changed.email])
})
test("daily limit remains enforced and an existing key can be replayed at the limit",async()=>{
 const s=setup(),first=s.input()
 const n=await s.service.schedule(actor,account,first)
 for(let i=1;i<20;i++)await s.service.schedule(actor,account,s.input())
 await assert.rejects(s.service.schedule(actor,account,s.input()),e=>e.code==="email_rate_limited")
 assert.equal((await s.service.schedule(actor,account,first)).id,n.id)
})
test("dispatch records acceptance, erases bodies and never resends accepted mail",async()=>{
 const s=setup();await s.service.schedule(actor,account,s.input())
 await dispatchEmail(s.repo,s.provider,s.now())
 assert.equal(s.sends.length,1)
 assert.equal((await s.repo.list(actor))[0].status,"accepted")
 assert.equal(s.sqlite.prepare("SELECT body FROM email_notifications").get().body,"")
 await dispatchEmail(s.repo,s.provider,s.now())
 assert.equal(s.sends.length,1)
})
test("definite failures retry at most five times; uncertain submission never retries",async()=>{
 const s=setup();await s.service.schedule(actor,account,s.input())
 s.result({status:"retry",error:"email_unavailable"})
 for(let i=0;i<6;i++){await dispatchEmail(s.repo,s.provider,s.now());s.tick(600001)}
 assert.equal((await s.repo.list(actor))[0].status,"failed")
 assert.equal(s.sends.length,5)
 const t=setup();await t.service.schedule(actor,account,t.input())
 t.result({status:"uncertain",error:"submission_unknown"})
 await dispatchEmail(t.repo,t.provider,t.now());t.tick(60000);await dispatchEmail(t.repo,t.provider,t.now())
 assert.equal(t.sends.length,1)
 assert.equal((await t.repo.list(actor))[0].status,"uncertain")
})
test("expired claims become uncertain and expired pending messages cannot send",async()=>{
 const s=setup();await s.service.schedule(actor,account,s.input())
 await s.repo.claim(s.now());s.tick(300001)
 await dispatchEmail(s.repo,s.provider,s.now())
 assert.equal(s.sends.length,0)
 assert.equal((await s.repo.list(actor))[0].status,"uncertain")
 const t=setup();await t.service.schedule(actor,account,t.input());t.tick(3600001)
 await dispatchEmail(t.repo,t.provider,t.now())
 assert.equal(t.sends.length,0)
 assert.equal((await t.repo.list(actor))[0].status,"expired")
})
test("migration distinguishes legacy opt-outs from pending OTP and retires queued verification",async()=>{
 const db=new DatabaseSync(":memory:")
 for(const name of ["0001_projects","0002_notifications","0003_email_notifications"])migrate(db,name)
 db.exec("INSERT INTO tenants(id,kind,name,created_by) VALUES('t','personal','Fixture','u')")
 db.exec("INSERT INTO email_contacts(tenant_id,user_id,email,enabled,verified_at,consent_at,requested_at) VALUES('t','pending','pending@example.test',0,NULL,1,1),('t','disabled','disabled@example.test',0,1,1,1)")
 db.exec("INSERT INTO email_notifications(id,tenant_id,user_id,email,kind,title,body,scheduled_at,expires_at,created_at,next_attempt,request_key) VALUES('old','t','pending','pending@example.test','verification','Code','private',1,2,1,1,'old')")
 migrate(db,"0004_email_account_preferences")
 assert.equal(db.prepare("SELECT opted_out FROM email_contacts WHERE user_id='pending'").get().opted_out,0)
 assert.equal(db.prepare("SELECT opted_out FROM email_contacts WHERE user_id='disabled'").get().opted_out,1)
 assert.equal(db.prepare("SELECT status FROM email_notifications").get().status,"cancelled")
 assert.equal(db.prepare("SELECT body FROM email_notifications").get().body,"")
})
test("HTTP requires auth/origin, uses the server's verification state and rejects recipient spoofing",async()=>{
 const s=setup()
 let identity={user:{id:"alice",email,emailVerified:true},sessionId:"session"}
 const app=createApp(async()=>identity)
 const env={DB:s.DB,APP_ORIGINS:"https://amautai.test",WORKOS_COOKIE_PASSWORD:"fixture",EMAIL_JMAP_SESSION_URL:"https://mail.test/jmap/session",EMAIL_JMAP_USERNAME:"sender",EMAIL_JMAP_PASSWORD:"fixture",EMAIL_FROM:"sender@example.test"}
 const request=(path,method="GET",body,origin="https://amautai.test")=>app.request("https://amautai.test/api/notifications/email"+path,{method,headers:{Origin:origin,"X-Amautai-Request":"1","Content-Type":"application/json"},...(body?{body:JSON.stringify(body)}:{})},env)
 assert.equal((await (await request("")).json()).contact.enabled,true)
 assert.equal((await request("/test","POST",{requestKey:crypto.randomUUID(),email:"victim@example.test"})).status,400)
 assert.equal((await request("/test","POST",{requestKey:crypto.randomUUID()},"https://evil.test")).status,403)
 assert.equal((await request("/test","POST",{requestKey:crypto.randomUUID()})).status,200)
 assert.equal((await s.repo.contact(actor)).email,email)
 assert.equal((await request("/verify/request","POST",{consent:true})).status,410)
 assert.equal((await request("/verify","POST",{code:"123456"})).status,410)
 identity={...identity,user:{...identity.user,emailVerified:false}}
 assert.equal((await request("/test","POST",{requestKey:crypto.randomUUID()})).status,403)
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
