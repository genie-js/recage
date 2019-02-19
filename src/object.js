const struct = require('awestruct')
const t = struct.types
const ct = require('./types')

const XYPos = struct([
  ['x', t.int16],
  ['y', t.int16]
])

const ActiveSprite = struct([
  ['id', t.int16],
  ['x', t.int32],
  ['y', t.int32]
])

const AnimatedSprite = struct([
  ActiveSprite,
  ['frame', t.int16],
  ['animateInterval', t.int32],
  ['animateLast', t.int32],
  ['lastFrame', t.int16],
  ['frameChanged', t.int8],
  ['frameLooped', t.int8],
  ['animateFlag', t.int8]
])

const ActiveSpriteList = struct.Type({
  read (opts) {
    const list = []
    while (true) {
      const type = opts.buf[opts.offset++]
      if (type === 0) break
      if (type === 1) {
        list.push(ActiveSprite.read(opts))
      }
      if (type === 2) {
        list.push(AnimatedSprite.read(opts))
      }
    }
    return list
  }
})

const StaticObject = struct([
  ['ownerId', t.int8],
  ['objectType', t.int8],
  ['sprite', t.int16],
  ['insideId', t.int32],
  ['hp', t.int32],
  ['objectState', t.int8],
  ['sleepFlag', t.int8],
  ['doppleFlag', t.int8],
  ['goToSleepFlag', t.int8],
  ['id', t.int32],
  ['facet', t.int8],
  ['position', struct([
    ['x', t.int32],
    ['y', t.int32],
    ['z', t.int32]
  ])],
  ['screenOffset', XYPos],
  ['shadowOffset', XYPos],
  ['selectedGroup', t.int8],
  ['attritubeTypeHeld', t.int16],
  ['attributeAmountHeld', t.int32],
  ['workerCount', t.int8],
  ['currentDamage', t.int8],
  ['damagedLatelyTimer', t.int8],
  ['underAttack', t.int8],
  ['pathingGroupMembers', t.dynarray(t.int32, t.int32)],
  ['groupId', t.int32],
  ['unk', t.int8],
  ['spriteList', ActiveSpriteList]
])

const AnimatedObject = struct([
  StaticObject,
  ['speed', t.float]
])

const DoppelgangerObject = AnimatedObject

const Waypoint = struct([
  ['x', t.float],
  ['y', t.float],
  ['z', t.float],
  ['facetToNextWaypoint', t.int8],
  t.skip(3) // padding
])

const MovingObject = struct([
  AnimatedObject,
  ['trailRemainder', t.int32],
  ['velocity', struct([
    ['x', t.float],
    ['y', t.float],
    ['z', t.float]
  ])],
  ['angle', t.float],
  ['turnTowardsTime', t.int32],
  ['turnTimer', t.int32],
  ['continueCounter', t.int32],
  ['currentTerrainException1', t.int32],
  ['currentTerrainException2', t.int32],
  ['waitingToMove', t.int8],
  ['waitDelaysCount', t.int8],
  ['onGround', t.int8],
  ['hasPathData', ct.longBool],
  ['hasPathData2', ct.longBool],
  ['hasPathData3', ct.longBool],
  // TODO load path data if exists
  ['waypoints', t.dynarray(t.int32, Waypoint)],
  ['currentWaypoint', t.int32],
  ['ptr', t.buffer(16)],
  ['goal', t.buffer(16)],
  ['collisionAvoidanceDistance', t.int32],
  ['actionRange', t.int32],
  ['targetId', t.int32],
  ['targetRadiusX', t.int32],
  ['targetRadiusY', t.int32],
  ['userDefinedWaypointsCount', t.int8],
  ['maxUserDefinedWaypoints', t.int8],
  ['userDefinedWaypoints', t.array('userDefinedWaypointsCount', t.array(3, t.int8))],
  ['finalUserDefinedWaypoint', t.int8],
  ['minInitialPoint', struct([
    ['x', t.int32],
    ['y', t.int32]
  ])],
  ['maxInitialPoint', struct([
    ['x', t.int32],
    ['y', t.int32]
  ])],
  ['closestDistanceToWaypoint', t.int32],
  ['lastFacet', t.int8],
  ['lastFacet2', t.int8]
])

const ActionAttack = struct([
])

const ActionBird = struct([
])

const ActionExplore = struct([
])

const ActionGather = struct([
])

const ActionMissile = struct([
])

const ActionMoveTo = struct([
])

const ActionMake = struct([
])

const TriageAction = struct([
  ['type', t.int16],
  ['action', struct([
    t.if(s => s.$parent.type === 9, ActionAttack),
    t.if(s => s.$parent.type === 10, ActionBird),
    t.if(s => s.$parent.type === 4, ActionExplore),
    t.if(s => s.$parent.type === 5, ActionGather),
    t.if(s => s.$parent.type === 8, ActionMissile),
    t.if(s => s.$parent.type === 1, ActionMoveTo),
    t.if(s => s.$parent.type === 21, ActionMake)
  ])]
])

const ActionList = struct.Type({
  read (opts) {
    const list = []
    while (true) {
      const { type, action } = TriageAction.read(opts)
      if (type === 0) break
      list.push(action)
    }
    return list
  }
})

const ActionObject = struct([
  MovingObject,
  ['waiting', t.bool],
  ['commandFlag', t.int8],
  ['actions', ActionList]
])

const TriageObject = struct([
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
  StaticObject,
  AnimatedObject,
  MovingObject,
  ActionObject,
  TriageObject
}
