const Struct = require('awestruct')
const ct = require('./types')
const t = Struct.types

const StaticObject = Struct([
  ['id', t.int16],
  ['copyId', t.int16],
  ['baseId', t.int16],
  ['class', t.int16],
  ['hotkeyId', t.int32],
  ['available', t.bool],
  ['hiddenInEditor', t.bool],
  ['hp', t.int16],
  ['los', t.float],
  ['garrisonCapacity', t.int8],
  ['radius', Struct([
    ['x', t.float],
    ['y', t.float]
  ])],
  ['attributeMaxAmount', t.int16],
  ['attributeAmountHeld', t.float],
  ['disabled', t.bool]
])

const AnimatedObject = Struct([
  StaticObject,
  ['speed', t.float]
])

const DoppelgangerObject = Struct([
  AnimatedObject
])

const MovingObject = Struct([
  AnimatedObject,
  ['turnSpeed', t.float]
])

const ActionObject = Struct([
  MovingObject,
  ['searchRadius', t.float],
  ['workRate', t.float]
])

const HitType = Struct([
  ['type', t.int16],
  ['amount', t.int16]
])

const BaseCombatObject = Struct([
  ActionObject,
  ['baseArmor', t.int16],
  ['attacks', t.dynarray(t.uint16, HitType)],
  ['armors', t.dynarray(t.uint16, HitType)],
  ['attacks', t.float],
  ['weaponRangeMax', t.float],
  ['baseHitChance', t.int16],
  ['projectileObjectId', t.int16],
  ['defenseTerrainBonus', t.int16],
  ['weaponRangeMax', t.float],
  ['areaOfEffect', t.float],
  ['weaponRangeMin', t.float]
])

const MissileObject = Struct([
  BaseCombatObject,
  ['targetingType', t.int8]
])

const ResourceCost = Struct([
  ['type', t.int16],
  ['amount', t.int16],
  ['enabled', t.int16]
])

const CombatObject = Struct([
  BaseCombatObject,
  ['buildInventory', t.array(3, ResourceCost)],
  ['buildPtsRequired', t.int16],
  ['volleyFireAmount', t.float],
  ['maxAttacksInVolley', t.int8]
])

const BuildingObject = Struct([
  CombatObject,
  ['buildingFacet', t.int16]
])

const TreeObject = StaticObject

const TriageCompactObject = Struct([
  ['type', t.int8],
  t.if(s => s.type === 10, StaticObject),
  t.if(s => s.type === 20, AnimatedObject),
  t.if(s => s.type === 25, DoppelgangerObject),
  t.if(s => s.type === 30, MovingObject),
  t.if(s => s.type === 40, ActionObject),
  t.if(s => s.type === 50, BaseCombatObject),
  t.if(s => s.type === 60, MissileObject),
  t.if(s => s.type === 70, CombatObject),
  t.if(s => s.type === 80, BuildingObject),
  t.if(s => s.type === 90, TreeObject)
])

module.exports = {
  TriageCompactObject
}
