import {test} from 'node:test'
import assert from 'node:assert/strict'
import {initialFair,fairTask,fairAnswer,fairStep} from '../src/modules/rooms/domain/fair.ts'
const participant=()=>({id:'p',name:'Test',score:0,solved:0,started:true,caught:0,mistakes:0,paused:false,activeMs:0,lastEventAt:0,version:1})
const room={id:'r',region:'coast',createdAt:'',kind:'fair',mode:'practice'}
test('every fair task has exactly one valid packet and counts remain within twenty',()=>{
 for(let band=0;band<3;band++)for(let sequence=0;sequence<1000;sequence++){
  const t=fairTask({...initialFair(),band,sequence}),answer=fairAnswer(t)
  assert.equal(t.choices.length,3);assert.equal(new Set(t.choices).size,3)
  assert.ok(t.choices.includes(answer));assert.ok(answer>=1&&answer<=20)
  assert.equal(t.leftA+t.leftB,t.target)
  for(const n of t.choices){const result=t.operation==='remove'?t.base-n:t.base+n;assert.ok(result>=0&&result<=20)}
 }
})
test('fair distinguishes amount removed from remaining amount and requires a supplied choice',()=>{
 const s={...initialFair(),sequence:2},t=fairTask(s)
 assert.equal(t.operation,'remove')
 assert.equal(t.base-fairAnswer(t),t.target)
 assert.throws(()=>fairStep(participant(),s,room,{answer:21}),{code:'invalid_room_input'})
 for(const n of [0,-1,1.2,NaN,Infinity])assert.throws(()=>fairStep(participant(),s,room,{answer:n}),{code:'invalid_room_input'})
})
test('fair scoring, assistance and persisted loss keep the shared policy',()=>{
 let p=participant(),s=initialFair()
 for(let i=0;i<5;i++){const r=fairStep(p,s,room,{answer:fairAnswer(fairTask(s))});p=r.participant;s=r.state}
 assert.equal(p.score,550)
 let r=fairStep(p,s,room,{help:true});p=r.participant;s=r.state
 r=fairStep(p,s,room,{answer:fairAnswer(fairTask(s))});p=r.participant;s=r.state
 assert.equal(p.score,590);assert.equal(s.streak,0)
 for(let i=0;i<3;i++){const t=fairTask(s);r=fairStep(p,s,room,{answer:t.choices.find(n=>n!==fairAnswer(t))});p=r.participant;s=r.state}
 assert.equal(p.score,530);assert.equal(p.mistakes,3)
 assert.throws(()=>fairStep(p,s,room,{answer:fairAnswer(fairTask(s))}),{code:'room_conflict'})
})
test('adaptive skills advance independently; challenge paths are reproducible across regions',()=>{
 let p=participant(),s=initialFair()
 for(let i=0;i<20;i++){const r=fairStep(p,s,room,{answer:fairAnswer(fairTask(s))});p=r.participant;s=r.state}
 assert.deepEqual(s.bands,[1,1,1,1])
 p=participant();s=initialFair()
 for(let i=0;i<600;i++){
  const input={answer:fairAnswer(fairTask(s))}
  const a=fairStep(p,s,{...room,mode:'challenge'},input)
  const b=fairStep({...p,id:'other'},s,{...room,region:'jungle',mode:'challenge'},input)
  assert.deepEqual(a.state,b.state);assert.equal(a.delta,b.delta)
  p=a.participant;s=a.state
 }
 assert.ok(p.score>60000)
})
