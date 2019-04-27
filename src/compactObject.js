const Struct = require('awestruct')
const ct = require('./types')
const t = Struct.types

// Flag used for UserPatch 1.5 effects data
const UP_EXTENDED_FLAG = -16
const UP_EXTENDED_FLAG_UNSIGNED = 32767

const StaticObject = Struct([
  ['type', t.int8],
  ['id', t.int16],
  ['copyId', t.int16],
  ['baseId', t.int16],
  ['class', t.int16],
  ['hotkeyId', t.int32],
  ['available', t.bool],
  ['hiddenInEditor', t.int8],
  t.if(s => s.hiddenInEditor === UP_EXTENDED_FLAG, Struct([
    ['deathObjectId', t.int16],
    ['stringId', t.int16],
    ['descriptionId', t.int16],
    ['flags', t.uint32],
    ['helpStringId', t.int32],
    ['terrainRestriction', t.int16],
    ['hiddenInEditor', t.bool],
  ])),
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
  t.if(s => s.buildPtsRequired === UP_EXTENDED_FLAG, Struct([
    ['originalPierceArmor', t.int16],
    ['originalArmor', t.int16],
    ['originalWeapon', t.int16],
    ['originalWeaponRange', t.float],
    ['areaEffectLevel', t.uint8],
    ['frameDelay', t.int16],
    ['buildAt', t.int16],
    ['buttonLocation', t.uint8],
    ['rearAttackModifier', t.float],
    ['heroFlag', t.uint8],
    ['buildPtsRequired', t.int16]
  ])),
  ['volleyFireAmount', t.float],
  ['maxAttacksInVolley', t.int8]
])

const BuildingObject = Struct([
  CombatObject,
  ['buildingFacet', t.int16],
  t.if(s => s.buildingFacet === UP_EXTENDED_FLAG_UNSIGNED, Struct([
    ['a', t.int8],
    ['b', t.int8],
    ['garrisonHealRate', t.float],
    ['buildingFacet', t.int16],
  ]))
])

const TreeObject = StaticObject

// TODO upstream a `switch` type and a peek function
const TriageCompactObject = Struct.Type({
  read (opts, struct) {
    const type = opts.buf[opts.offset]
    switch (type) {
      case 10: return StaticObject.read(opts, struct)
      case 20: return AnimatedObject.read(opts, struct)
      case 25: return DoppelgangerObject.read(opts, struct)
      case 30: return MovingObject.read(opts, struct)
      case 40: return ActionObject.read(opts, struct)
      case 50: return BaseCombatObject.read(opts, struct)
      case 60: return MissileObject.read(opts, struct)
      case 70: return CombatObject.read(opts, struct)
      case 80: return BuildingObject.read(opts, struct)
      case 90: return TreeObject.read(opts, struct)
      default: throw new Error(`Encountered unknown object type: ${type}`)
    }
  },
  write (opts, value) {
    switch (value.type) {
      case 10: return StaticObject.write(opts, value)
      case 20: return AnimatedObject.write(opts, value)
      case 25: return DoppelgangerObject.write(opts, value)
      case 30: return MovingObject.write(opts, value)
      case 40: return ActionObject.write(opts, value)
      case 50: return BaseCombatObject.write(opts, value)
      case 60: return MissileObject.write(opts, value)
      case 70: return CombatObject.write(opts, value)
      case 80: return BuildingObject.write(opts, value)
      case 90: return TreeObject.write(opts, value)
      default: throw new Error(`Encountered unknown object type: ${type}`)
    }
  },
  size (opts, value) {
    switch (value.type) {
      case 10: return StaticObject.size(opts, value)
      case 20: return AnimatedObject.size(opts, value)
      case 25: return DoppelgangerObject.size(opts, value)
      case 30: return MovingObject.size(opts, value)
      case 40: return ActionObject.size(opts, value)
      case 50: return BaseCombatObject.size(opts, value)
      case 60: return MissileObject.size(opts, value)
      case 70: return CombatObject.size(opts, value)
      case 80: return BuildingObject.size(opts, value)
      case 90: return TreeObject.size(opts, value)
      default: throw new Error(`Encountered unknown object type: ${type}`)
    }
  }
})

module.exports = {
  TriageCompactObject
}
