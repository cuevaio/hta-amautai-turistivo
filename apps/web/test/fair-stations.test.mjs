import {test} from 'node:test'
import assert from 'node:assert/strict'
import {FairVisitGate,fairLayout,fairStationAt} from '../src/game-runtime/fair-stations.ts'
test('a delivery visit evaluates once even after a pending response or new task',()=>{
 const g=new FairVisitGate()
 assert.equal(g.update('delivery',0,true,true),false)
 assert.equal(g.update('delivery',250,true,true),true)
 assert.equal(g.update('delivery',700,true,false),false)
 assert.equal(g.update('delivery',1000,true,true),false)
 g.update(null,1100,true,true)
 g.update('delivery',1200,true,true)
 assert.equal(g.update('delivery',1450,true,true),true)
})
test('moving and empty deliveries cannot consume a valid future arrival',()=>{
 const g=new FairVisitGate()
 g.update('delivery',0,false,true)
 assert.equal(g.update('delivery',500,true,false),false)
 assert.equal(g.update('delivery',600,true,true),false)
 assert.equal(g.update('delivery',850,true,true),true)
})
test('both layouts separate supplies, delivery and safe spawn with visible delivery edges',()=>{
 for(const compact of [false,true]){
  const l=fairLayout(compact)
  assert.equal(fairStationAt(l.spawn.x,l.spawn.y,compact),null)
  l.supplies.forEach((p,i)=>assert.equal(fairStationAt(p.x,p.y,compact),i))
  assert.equal(fairStationAt(l.delivery.x+90,l.delivery.y,compact),'delivery')
  for(const p of l.supplies)assert.ok(Math.abs(p.y-l.delivery.y)>100)
 }
})

test('the heavier pan drops, equal counts level, and both arms remain symmetric', async()=>{
 const {balanceAngle,balanceEnds}=await import('../src/game-runtime/fair-balance-state.ts')
 for(const left of [0,1,8,20])for(const right of [0,1,8,20]){
  const angle=balanceAngle(left,right),ends=balanceEnds(300,280,147.5,angle)
  assert.equal(Math.sign(angle),Math.sign(right-left))
  assert.ok(Math.abs(angle)<=.115)
  assert.ok(Math.abs(ends.left.y+ends.right.y-560)<.00001)
  if(right>left)assert.ok(ends.right.y>ends.left.y)
  if(left===right)assert.equal(ends.left.y,ends.right.y)
 }
})
