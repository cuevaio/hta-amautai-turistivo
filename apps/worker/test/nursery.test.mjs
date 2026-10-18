import {test} from 'node:test'
import assert from 'node:assert/strict'
import {initialNursery,nurseryTask,nurseryCorrect,nurseryStep} from '../src/modules/rooms/domain/nursery.ts'
const participant=()=>({id:'p',name:'Test',score:0,solved:0,started:true,caught:0,mistakes:0,paused:false,activeMs:0,lastEventAt:0,version:1})
const room={id:'r',region:'coast',createdAt:'',kind:'nursery',mode:'practice'}
const solution=t=>t.skill===2?{trays:Math.floor(t.target/10)-1,units:t.target%10+10}:{trays:Math.floor(t.target/10),units:t.target%10}
test('free representations accept equivalent decompositions; exchange missions require their announced form',()=>{
 const task={...nurseryTask(initialNursery()),target:37}
 assert.equal(nurseryCorrect(task,3,7),true)
 assert.equal(nurseryCorrect(task,2,17),true)
 assert.equal(nurseryCorrect(task,3,5),false)
 assert.equal(nurseryCorrect({...task,skill:1},2,17),false)
 assert.equal(nurseryCorrect({...task,skill:1},3,7),true)
 assert.equal(nurseryCorrect({...task,skill:2},2,17),true)
 assert.equal(nurseryCorrect({...task,skill:2},3,7),false)
})
test('scores, streaks, help, errors, and loss retain the agreed policy',()=>{
 let state=initialNursery(),p=participant()
 for(let i=0;i<5;i++) {const next=nurseryStep(p,state,room,solution(nurseryTask(state)));p=next.participant;state=next.state}
 assert.equal(p.score,550)
 const hint=nurseryStep(p,state,room,{help:true})
 const assisted=nurseryStep(hint.participant,hint.state,room,solution(nurseryTask(state)))
 assert.equal(assisted.participant.score,590)
 assert.equal(assisted.state.streak,0)
 p=assisted.participant;state=assisted.state
 for(let i=0;i<3;i++){const next=nurseryStep(p,state,room,{trays:0,units:0});p=next.participant;state=next.state}
 assert.equal(p.score,530);assert.equal(p.mistakes,3)
 assert.throws(()=>nurseryStep(p,state,room,solution(nurseryTask(state))),{code:'room_conflict'})
})
test('adaptive skills advance independently; challenge tasks remain equal and solvable through continued play',()=>{
 let state=initialNursery(),p=participant()
 for(let i=0;i<15;i++){const next=nurseryStep(p,state,room,solution(nurseryTask(state)));p=next.participant;state=next.state}
 assert.deepEqual(state.bands,[1,1,1])
 state=initialNursery();p=participant()
 for(let i=0;i<600;i++){
  const task=nurseryTask(state);assert.ok(task.target>=10&&task.target<=99)
  assert.equal(nurseryCorrect(task,...Object.values(solution(task))),true)
  const next=nurseryStep(p,state,{...room,mode:'challenge'},solution(task))
  const other=nurseryStep({...p,id:'other'},state,{...room,mode:'challenge'},solution(task))
  assert.deepEqual(nurseryTask(next.state),nurseryTask(other.state));assert.equal(next.delta,other.delta)
  p=next.participant;state=next.state
 }
 assert.ok(p.score>60000)
})
test('invalid representations cannot reach scoring',()=>{
 for(const action of [{trays:-1,units:0},{trays:1.5,units:0},{trays:10,units:0},{trays:9,units:10},{trays:0,units:NaN}])assert.throws(()=>nurseryStep(participant(),initialNursery(),room,action),{code:'invalid_room_input'})
})
