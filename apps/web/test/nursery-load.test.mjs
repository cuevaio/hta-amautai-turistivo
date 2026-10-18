import {test} from 'node:test'
import assert from 'node:assert/strict'
import {changeNurseryLoad} from '../src/features/rooms/model/nursery-load.ts'
test('grouping and opening conserve quantity, including noncanonical representations',()=>{
 const before={trays:2,units:17},grouped=changeNurseryLoad(before,'group')
 assert.deepEqual(grouped,{trays:3,units:7})
 assert.deepEqual(changeNurseryLoad(grouped,'ungroup'),before)
 assert.equal(changeNurseryLoad(grouped,'group'),grouped)
})
test('pickup, removal and exchanges respect inventory limits',()=>{
 const empty={trays:0,units:0};assert.equal(changeNurseryLoad(empty,'remove-unit'),empty);assert.equal(changeNurseryLoad(empty,'ungroup'),empty)
 const full={trays:9,units:9};assert.equal(changeNurseryLoad(full,'unit'),full);assert.equal(changeNurseryLoad(full,'tray'),full)
 assert.deepEqual(changeNurseryLoad(full,'ungroup'),{trays:8,units:19})
 assert.deepEqual(changeNurseryLoad(empty,'tray'),{trays:1,units:0})
})
