const struct = require('awestruct')
const ObjectTypes = require('genie-dat/lib/object')
const ct = require('./types')
const t = struct.types

const XYPos = struct([
  ['x', t.int16],
  ['y', t.int16]
])

const Vector = struct([
  ['x', t.float],
  ['y', t.float],
  ['z', t.float]
])

const ActiveSprite = struct([
  ['id', t.int16],
  ['x', t.int32],
  ['y', t.int32],
  ['frame', t.int16],
  ['invisible', t.bool]
])

const AnimatedSprite = struct([
  ActiveSprite,
  ['animateInterval', t.int32],
  ['animateLast', t.int32],
  ['lastFrame', t.int16],
  ['frameChanged', t.int8],
  ['frameLooped', t.int8],
  ['animateFlag', t.int8],
  ['lastSpeed', t.float]
])

const ActiveSpriteNode = struct([
  ['type', t.int8],
  t.if(s => s.type === 1, struct([
    ['sprite', ActiveSprite]
  ])),
  t.if(s => s.type === 2, struct([
    ['sprite', AnimatedSprite]
  ])),
  t.if(s => s.type > 0, struct([
    ['order', t.int8],
    ['flag', t.int8],
    ['count', t.int8]
  ]))
])

const ActiveSpriteList = struct.Type({
  read (opts) {
    const list = []
    let last = ActiveSpriteNode.read(opts)
    while (last.type > 0) {
      list.push(last)
      last = ActiveSpriteNode.read(opts)
    }
    return list
  }
})

const StaticObject = struct([
  ['ownerId', t.int8],
  ['objectType', t.int16],
  ['sprite', t.int16],
  ['insideId', t.int32],
  ['hp', t.float],
  ['objectState', t.int8],
  ['sleepFlag', t.int8],
  ['doppleFlag', t.int8],
  ['goToSleepFlag', t.int8],
  ['id', t.int32],
  ['facet', t.int8],
  ['position', Vector],
  ['screenOffset', XYPos],
  ['shadowOffset', XYPos],
  // if version < 11.58
  // ['selectedGroup', t.int8],
  ['attributeTypeHeld', t.int16],
  ['attributeAmountHeld', t.float],
  ['workerCount', t.int8],
  ['currentDamage', t.int8],
  ['damagedLatelyTimer', t.int8],
  ['underAttack', t.int8],
  ['pathingGroupMembers', t.dynarray(t.int32, t.int32)],
  ['groupId', t.int32],
  ['rooAlreadyCalled', t.int8],
  ['hasSpriteList', t.bool],
  t.if('hasSpriteList', struct([
    ['spriteList', ActiveSpriteList]
  ]))
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

const PathData = struct([
  ['id', t.int32],
  ['linkedPathType', t.int32],
  ['waypointLevel', t.int32],
  ['pathId', t.int32],
  ['waypoint', t.int32],
  ['disableFlags', t.int32],
  ['enableFlags', t.int32],
  ['state', t.int32],
  ['range', t.float],
  ['targetId', t.int32],
  ['pauseTime', t.float],
  ['continueCounter', t.int32],
  ['flags', t.int32]
])

const MovementData = struct([
  ['velocity', Vector],
  ['acceleration', Vector]
])

const MovingObject = struct([
  AnimatedObject,
  ['trailRemainder', t.int32],
  ['velocity', Vector],
  ['angle', t.float],
  ['turnTowardsTime', t.int32],
  ['turnTimer', t.int32],
  ['continueCounter', t.int32],
  ['currentTerrainException1', t.int32],
  ['currentTerrainException2', t.int32],
  ['waitingToMove', t.int8],
  ['waitDelaysCount', t.int8],
  ['onGround', t.int8],
  ['pathData', t.dynarray(t.int32, PathData)],
  ['hasFuturePathData', ct.longBool],
  t.if('hasFuturePathData', struct([
    ['futurePathData', PathData]
  ])),
  ['hasMovementData', ct.longBool],
  t.if('hasMovementData', struct([
    ['movementData', MovementData]
  ])),
  ['position', Vector],
  ['orientationForward', Vector],
  ['orientationRight', Vector],
  ['lastMoveTime', t.uint32],
  ['userDefinedWaypoints', t.dynarray(t.int32, Vector)],
  ['hasSubstitutePosition', ct.longBool],
  ['substitutePosition', Vector],
  ['consecutiveSubstituteCount', t.int32],
])

const ActionList = struct.Type({
  read (opts) {
    const list = []
    while (true) {
      const { type, action } = TriageAction.read(opts)
      if (type === 0) break
      console.log(type, action)
      list.push(action)
    }
    return list
  }
})

const ActionBase = struct([
  ['state', t.int8],
  ['targetObjectPointer', t.int32],
  ['targetObjectPointer2', t.int32],
  ['targetObjectId', t.int32],
  ['targetObjectId2', t.int32],
  ['targetPosition', Vector],
  ['timer', t.float],
  ['targetMovedState', t.int8],
  ['taskId', t.int16],
  ['subActionValue', t.int8],
  ['subActions', ActionList],
  ['sprite', t.int16]
])

const ActionAttack = struct([
  ActionBase,
  ['range', t.float],
  ['minRange', t.float],
  ['missileId', t.int16],
  ['frameDelay', t.int16],
  ['needToAttack', t.int16],
  ['wasSameOwner', t.int16],
  ['indirectFireFlag', t.int8],
  ['moveSprite', t.int16],
  ['fightSprite', t.int16],
  ['waitSprite', t.int16],
  ['lastTargetPosition', Vector]
])

const ActionBird = ActionBase

const ActionExplore = ActionBase

const ActionGatherBase = struct([
  ActionBase,
  ['targetType', t.int32],
  ['numberStops', t.int8],
  ['currentStop', t.int8],
  ['timePerStop', t.float],
  ['timeAtCurrentStop', t.float],
  ['lastStopX', t.int8],
  ['lastStopY', t.int8],
  ['farmX', t.float],
  ['farmY', t.float]
])

const ActionGuard = ActionBase

const ActionMissile = struct([
  ActionBase,
  ['velocity', Vector],
  ['ballisticVelocity', t.float],
  ['ballisticAcceleration', t.float],
  ['distance', t.float]
])

const ActionMoveTo = struct([
  ActionBase,
  ['range', t.float]
])

const ActionEnter = struct([
  ActionBase,
  ['firstTime', t.int32]
])

const ActionTransport = ActionBase

const ActionBuild = struct([
  ActionBase,
  ['newBuilders', t.int32]
])

const ActionMakeObject = struct([
  ActionBase,
  ['objectType', t.int16],
  ['workDone', t.float],
  ['uniqueId', t.int32]
])

const ActionMakeTech = struct([
  ActionBase,
  ['techId', t.int16],
  ['uniqueId', t.int32]
])

const ActionConvert = struct([
  ActionBase
  // TODO
])

const ActionRepair = struct([
  ActionBase,
  ['saveTargetCommand', t.int8],
  ['newBuilders', t.int32]
])

const ActionDiscoveryArtifact = struct([
  ActionBase,
  ['flags', t.dynarray(t.int8, t.int8)]
])

const ActionHunt = struct([
  ActionBase
  // TODO
])

const ActionTrade = struct([
  ActionBase
  // TODO
])

const ActionWonder = struct([
  ActionBase,
  ['wonderTime', t.float],
  ['hunBonus', t.bool]
])

const ActionFarm = ActionBase

const ActionGather = struct([
  ActionBase,
  ['targetType', t.int32]
])

const ActionHousing = struct([
  ActionBase,
  ['uniqueId', t.int32]
])

const ActionPack = struct([
  ActionBase
  // TODO
])

const ActionUnpack = struct([
  ActionBase
  // TODO
])

const ActionOffboardTrade = struct([
  ActionBase
  // TODO
])

const ActionPickupRelic = ActionBase

const ActionCharge = ActionBase

const ActionUnitTransform = struct([
  ActionBase,
  ['transformId', t.int32]
])

const ActionCapture = ActionBase

const ActionDeliverRelic = ActionBase

const ActionShepherd = ActionBase

const ActionHeal = ActionBase

const ActionMake = struct([
  ActionBase,
  ['workTimer', t.float]
])

const ActionArtifact = ActionBase

const TriageAction = struct([
  ['type', t.int16],
  ['action', struct([
    t.if(s => s.$parent.type === 1, ActionMoveTo),
    t.if(s => s.$parent.type === 3, ActionEnter),
    t.if(s => s.$parent.type === 4, ActionExplore),
    t.if(s => s.$parent.type === 5, ActionGatherBase),
    t.if(s => s.$parent.type === 8, ActionMissile),
    t.if(s => s.$parent.type === 9, ActionAttack),
    t.if(s => s.$parent.type === 10, ActionBird),
    t.if(s => s.$parent.type === 12, ActionTransport),
    t.if(s => s.$parent.type === 13, ActionGuard),
    t.if(s => s.$parent.type === 21, ActionMake),
    t.if(s => s.$parent.type === 101, ActionBuild),
    t.if(s => s.$parent.type === 102, ActionMakeObject),
    t.if(s => s.$parent.type === 103, ActionMakeTech),
    t.if(s => s.$parent.type === 104, ActionConvert),
    t.if(s => s.$parent.type === 105, ActionHeal),
    t.if(s => s.$parent.type === 106, ActionRepair),
    t.if(s => s.$parent.type === 107, ActionArtifact),
    t.if(s => s.$parent.type === 108, ActionDiscoveryArtifact),
    t.if(s => s.$parent.type === 110, ActionHunt),
    t.if(s => s.$parent.type === 111, ActionTrade),
    t.if(s => s.$parent.type === 120, ActionWonder),
    t.if(s => s.$parent.type === 121, ActionFarm),
    t.if(s => s.$parent.type === 122, ActionGather),
    t.if(s => s.$parent.type === 123, ActionHousing),
    t.if(s => s.$parent.type === 124, ActionPack),
    t.if(s => s.$parent.type === 125, ActionUnpack),
    t.if(s => s.$parent.type === 131, ActionOffboardTrade),
    t.if(s => s.$parent.type === 132, ActionPickupRelic),
    t.if(s => s.$parent.type === 133, ActionCharge),
    t.if(s => s.$parent.type === 134, ActionUnitTransform),
    t.if(s => s.$parent.type === 135, ActionCapture),
    t.if(s => s.$parent.type === 136, ActionDeliverRelic),
    t.if(s => s.$parent.type === 149, ActionShepherd),
  ])]
])

const ActionObject = struct([
  MovingObject,
  ['waiting', t.bool],
  ['commandFlag', t.int8],
  ['selectedGroupInfo', t.int16],
  ['actions', ActionList]
])

const BaseCombatObject = struct([
  ActionObject,
  ['formationId', t.int8],
  ['formationRow', t.int8],
  ['formationCol', t.int8],
  ['attackTimer', t.float],
  ['captureFlag', t.int8],
  t.skip(1),
  ['largeObjectRadius', t.int8],
  ['attackCount', t.int32]
])

const MissileObject = struct([
  BaseCombatObject,
  ['maxRange', t.float],
  ['firedFromId', t.int32],
  ['ownBase', t.bool],
  ['base', t.if('ownBase', ObjectTypes.TriageObject)]
])

const Path = struct([])

const UnitAI = struct([
  ['mood', t.int32],
  ['currentOrder', t.int32],
  ['currentOrderPriority', t.int32],
  ['currentAction', t.int32],
  ['currentTarget', t.int32],
  ['currentTargetType', t.int32],
  ['currentTargetLocation', Vector],
  ['desiredTargetDistance', t.float],
  ['lastAction', t.int32],
  ['lastOrder', t.int32],
  ['lastTarget', t.int32],
  ['lastTargetType', t.int32],
  ['lastUpdateTime', t.uint32],
  ['idleTimer', t.uint32],
  ['idleTimeout', t.uint32],
  ['adjustedIdleTimeout', t.uint32],
  ['secondaryTimer', t.uint32],
  ['lookAroundTimer', t.uint32],
  ['lookAroundTimeout', t.uint32],
  ['defendTarget', t.int32],
  ['defenseBuffer', t.float],
  ['lastWorldPosition', Waypoint],
  ['orders', t.dynarray(t.int32, t.buffer(36))],
  ['notifications', t.dynarray(t.int32, t.buffer(24))],
  ['attackingUnits', t.dynarray(t.int32, t.int32)],
  ['stopAfterTargetKilled', t.bool],
  ['state', t.int8],
  ['statePositionX', t.float],
  ['statePositionY', t.float],
  ['timeSinceEnemySighting', t.uint32],
  ['alertMode', t.int8],
  ['alertModeObjectId', t.int32],
  ['hasPatrolPath', ct.longBool],
  ['patrolPath', t.if('hasPatrolPath', Path)],
  ['patrolCurrentWaypoint', t.int32],
  ['orderHistory', t.dynarray(t.int32, t.buffer(44))],
  ['lastRetargetTime', t.uint32],
  ['randomizedRetargetTimer', t.uint32],
  ['retargetEntries', t.dynarray(t.int32, t.buffer(8))],
  ['bestUnitToAttack', t.int32],
  ['formationType', t.int8]
])

const CombatObject = struct([
  BaseCombatObject,
  ['nextVolley', t.int8],
  ['usingSpecialAttackAnimation', t.int8],
  ['ownBase', t.bool],
  ['base', t.if('ownBase', ObjectTypes.TriageObject)],
  ['attributeAmounts', t.array(6, t.int16)],
  ['decayTimer', t.int16],
  ['raiderBuildCountdown', t.int32],
  ['lockedDownCount', t.int32],
  ['insideGarrisonCount', t.int8],
  ['hasAi', ct.longBool],
  ['unitAi', t.if('hasAi', UnitAI)],
  ['townBellFlag', t.int8],
  ['townBellTargetId', t.int32],
  ['townBellTargetX', t.float],
  ['townBellTargetY', t.float],
  ['townBellTargetId2', t.int32],
  ['townBellTargetType', t.int32],
  ['townBellAction', t.int32],
  ['berserkerTimer', t.float],
  ['numBuilders', t.int8],
  ['numHealers', t.int8]
])

const BuildingObject = struct([
  CombatObject
])

const TreeObject = StaticObject

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
  DoppelgangerObject,
  MovingObject,
  ActionObject,
  BaseCombatObject,
  MissileObject,
  CombatObject,
  BuildingObject,
  TreeObject,
  TriageObject
}
