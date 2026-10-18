import {test} from 'node:test'
import assert from 'node:assert/strict'
import {NurseryStationGate,nurseryLayout,nurseryStationAt,nurseryStationEnabled} from '../src/game-runtime/nursery-stations.ts'
test('each station visit triggers one action; re-entry enables a new action',()=>{
 const gate=new NurseryStationGate()
 assert.equal(gate.tick('unit',true,true,0),false)
 assert.equal(gate.tick('unit',true,true,260),true)
 assert.equal(gate.tick('unit',true,true,5000),false)
 gate.tick(null,true,true,6000)
 assert.equal(gate.tick('unit',true,true,7000),false)
 assert.equal(gate.tick('unit',true,true,7260),true)
})
test('pending requests, motion and disabled exchanges cannot consume a visit',()=>{
 const gate=new NurseryStationGate()
 assert.equal(gate.tick('group',false,true,0),false)
 assert.equal(gate.tick('group',false,true,3000),false)
 assert.equal(gate.tick('group',true,false,3500),false)
 assert.equal(gate.tick('group',true,true,4000),false)
 assert.equal(gate.tick('group',true,true,4260),true)
})
test('explicit pickup consumes dwell and a stationary garden never resubmits',()=>{
 const gate=new NurseryStationGate()
 gate.consume('tray');assert.equal(gate.tick('tray',true,true,5000),false)
 gate.enter(null);gate.tick('garden',true,true,6000)
 assert.equal(gate.tick('garden',true,true,6260),true)
 assert.equal(gate.tick('garden',false,true,6500),false)
 assert.equal(gate.tick('garden',true,true,10000),false)
})
test('desktop and mobile share station meaning, have no overlapping activation zones, and spawn off all stations',()=>{
 for(const compact of [false,true]){
  const layout=nurseryLayout(compact)
  assert.equal(nurseryStationAt(layout.spawn,compact),null)
  for(const [key,p]of Object.entries(layout.stations)){
   assert.equal(nurseryStationAt(p,compact),key)
   for(const [other,q]of Object.entries(layout.stations))if(key!==other)assert.ok(Math.hypot(p.x-q.x,p.y-q.y)>96)
  }
 }
 assert.equal(nurseryStationEnabled('group',0,9),false)
 assert.equal(nurseryStationEnabled('group',0,10),true)
 assert.equal(nurseryStationEnabled('ungroup',0,99),false)
 assert.equal(nurseryStationEnabled('tray',9,0),false)
 assert.equal(nurseryStationEnabled('unit',9,9),false)
})

test('the visible garden accepts arrival at its outer edge without overlapping another station',()=>{
 for(const compact of [false,true]){
  const layout=nurseryLayout(compact),garden=layout.stations.garden
  assert.equal(nurseryStationAt({x:garden.x+70,y:garden.y+20},compact),'garden')
  assert.equal(nurseryStationAt({x:garden.x-78,y:garden.y-55},compact),'garden')
  assert.notEqual(nurseryStationAt({x:garden.x+79,y:garden.y},compact),'garden')
 }
})
