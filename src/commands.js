const Struct = require('awestruct')
const ct = require('./types')

const t = Struct.types
const objectList = t.array('selectedCount', t.int32)

function Command (name, shape) {
  const struct = Struct(shape)
  struct.commandName = name
  return struct
}

// 0x00
exports.attack = Command('attack', {
  playerId: t.int8,
  u0: t.buffer(2),
  targetId: t.int32,
  selectedCount: t.int32,
  x: t.float,
  y: t.float,
  // if selectedCount == 0xff, the same group is used as in the last command, and no units array is present
  units: t.if((struct) => struct.selectedCount < 0xff, objectList)
})

// 0x01
exports.stop = Command('stop', {
  selectedCount: t.int8,
  units: t.array('selectedCount', t.int32)
})

// 0x02
exports.work = Command('work', {
  u0: t.buffer(3),
  u1: t.int32,
  u2: t.int32,
  u3: t.float,
  'building?': t.int16,
  u5: t.array(2, t.uint8),
  u6: t.int32,
  u7: t.uint8
})

// 0x03
exports.move = Command('move', {
  playerId: t.int8,
  u0: t.buffer(2),
  targetId: t.buffer(4),
  selectedCount: t.int32,
  x: t.float,
  y: t.float,
  // if selectedCount == 0xff, the same group is used as in the last command, and no units array is present
  units: t.if((struct) => struct.selectedCount < 0xff, objectList)
})

// 0x0a
exports.aiOrder = Command('aiOrder', {
  // ???
  u0: t.int8,
  u1: t.int8,
  u2: t.int8,
  u3: t.int32,
  u4: t.buffer(4),
  u5: t.int32,
  u6: t.int16,
  u7: t.int32,
  u8: t.int32,
  u9: t.int32,
  u10: t.int32,
  u11: t.int32,
  u12: t.int16,
  u13: t.int8
})

// 0x0b
exports.resign = Command('resign', {
  playerId: t.int8,
  playerNum: t.int8,
  u0: t.int8
})

// 0x10
exports.waypoint = Command('waypoint', {
  // ???
  u0: t.int8,
  u1: t.uint8,
  u2: t.array(2, t.uint8),
  u3: t.if((struct) => struct.u1 === 0x01, t.int32),
  u4: t.uint8
})

// 0x12
exports.unitAiState = Command('unitAiState', {
  selectedCount: t.int8,
  state: t.int8,
  units: objectList
})

// 0x13
exports.guard = Command('guard', {
  u0: t.buffer(2),
  selectedCount: t.int32,
  target: t.int32,
  units: objectList
})

// 0x14
exports.follow = Command('follow', {
  selectedCount: t.int8,
  u0: t.buffer(2),
  target: t.int32,
  units: objectList
})

// 0x15
exports.patrol = Command('patrol', {
  // ???
})

// 0x17
exports.formation = Command('formation', {
  selectedCount: t.int8,
  u0: t.buffer(2),
  formation: t.int32,
  units: objectList
})

// 0x18
exports.breakFormation = Command('breakFormation', {
  // ???
})

// 0x22
exports.attackMoveTarget = Command('attackMoveTarget', {
  // ???
})

// 0x35
exports.aiCommand = Command('aiCommand', {
  // ???
  // ai related?
  // UserPatch only
})

// 0x64
exports.aiTrain = Command('aiTrain', {
  u0: t.buffer(3),
  building: t.int32,
  unitType: t.int16,
  num: t.int16
})

// 0x65
exports.research = Command('research', {
  u0: t.buffer(3),
  building: t.int32,
  player: t.int16,
  research: t.int16,
  u1: t.buffer(4)
})

// 0x66
exports.build = Command('build', {
  builderCount: t.int8,
  player: t.int16,
  x: t.float,
  y: t.float,
  building: t.int16
  // ???
  // builder IDs somewhere?
})

// 0x67
exports.speed = Command('speed', {
  u0: t.buffer(4),
  speed: t.float,
  u1: t.buffer(4),
  u2: t.buffer(4)
})

// 0x69
exports.wall = Command('wall', {
  // ???
  // AI only, probably
})

// 0x6a
exports.del = Command('del', {
  u0: t.buffer(3),
  target: t.int32,
  player: t.int32
})

// 0x6b
exports.attackGround = Command('attackGround', {
  selectedCount: t.int8,
  u0: t.buffer(2)
  // ???
})

// 0x6c
exports.tribute = Command('tribute', {
  from: t.int8,
  to: t.int8,
  resource: t.int8,
  amount: t.float,
  fee: t.float
})

// 0x6e
exports.repair = Command('repair', {
  // ???
})

// 0x6f
exports.unload = Command('unload', {
  player: t.int8,
  u0: t.buffer(2),
  u1: t.float,
  u2: t.float,
  u3: t.int32,
  u4: t.int32,
  from: t.int32,
  u5: t.uint8 // unit type?
})

// 0x73
exports.flare = Command('flare', {
  u0: t.buffer(3),
  u1: t.buffer(4),
  receivers: t.array(9, t.int8),
  u2: t.buffer(3),
  x: t.float,
  y: t.float,
  player: t.int8,
  playerNum: t.int8,
  u3: t.buffer(2)
})

// 0x75
exports.garrison = Command('garrison', {
  // ???
  selectedCount: t.int8,
  u0: t.buffer(2),
  building: t.int32, // when -1, cancels queued production in building id in `units`
  u1: t.int32, // normally 5, different if building=-1 (research id? queue pos? unit id?)
  u2: t.float,
  u3: t.float,
  u4: t.int32,
  units: objectList
})

// 0x77
exports.train = Command('train', {
  u0: t.buffer(3),
  building: t.int32,
  unitType: t.int16,
  num: t.int16
})

// 0x78
exports.gatherPoint = Command('gatherPoint', {
  selectedCount: t.int8,
  u0: t.buffer(2),
  target: t.int32, // 0xffffffff if there is no target object (i.e. the target is a location)
  targetType: t.int32, // 0xffff0000 if there is no target object, object type otherwise?
  x: t.float,
  y: t.float,
  objects: objectList
})

// 0x7a
exports.sell = Command('sell', {
  player: t.int8,
  resource: t.int8,
  // market commands store the amount as a byte containing 1 or 5 for 100 and 500 (shift-click)
  amount: t.int8.mapRead((amount) => amount * 100),
  u0: t.buffer(4)
})

// 0x7b
exports.buy = Command('buy', {
  player: t.int8,
  resource: t.int8,
  amount: t.int8.mapRead((amount) => amount * 100),
  u0: t.buffer(4)
})

// 0x7f
exports.townBell = Command('townBell', {
  u0: t.buffer(3),
  building: t.int32,
  active: t.int32 // whether the bell turns "on" or "off", 1 if villagers enter tc, 0 if villagers exit
})

// 0x80
exports.backToWork = Command('backToWork', {
  u0: t.buffer(3),
  building: t.int32
})

// 0xff
// UserPatch multiplayer postgame data
exports.postgame = Command('postgame', {
  u0: t.buffer(3),
  scenarioFilename: t.string(32).mapRead((n) => n.trim()),
  u1: t.buffer(4),
  duration: t.int32,
  allowCheats: ct.bool,
  complete: ct.bool,
  u2: t.buffer(14),
  mapSize: t.int8,
  mapId: t.int8,
  population: t.int8,
  u3: t.buffer(1),
  victory: t.int8,
  startingAge: t.int8,
  resources: t.int8,
  allTechs: ct.bool,
  teamTogether: ct.bool,
  revealMap: t.int8,
  u4: t.buffer(3),
  lockTeams: ct.bool,
  lockSpeed: ct.bool,
  u5: t.buffer(1),
  players: t.array(8, Struct({
    name: t.string(16).mapRead((n) => n.trim()),
    totalScore: t.int16,
    totalScores: t.array(8, t.int16),
    victory: ct.bool,
    civilization: t.int8,
    color: t.int8,
    team: t.int8,
    u0: t.buffer(2),
    mvp: ct.bool,
    u1: t.buffer(3),
    result: t.int8,
    u2: t.buffer(3),
    military: Struct({
      score: t.int16,
      kills: t.int16,
      u0: t.int16,
      unitsLost: t.int16,
      razes: t.int16,
      u1: t.int16,
      buildingsLost: t.int16,
      conversions: t.int16
    }),
    u3: t.buffer(32),
    economy: Struct({
      score: t.int16,
      u0: t.int16,
      foodCollected: t.int32,
      woodCollected: t.int32,
      stoneCollected: t.int32,
      goldCollected: t.int32,
      tributeSent: t.int16,
      tributeReceived: t.int16,
      tradeProfit: t.int16,
      relicGold: t.int16
    }),
    u4: t.buffer(16),
    tech: Struct({
      score: t.int16,
      u0: t.int16,
      feudalTime: t.int32,
      castleTime: t.int32,
      imperialTime: t.int32,
      mapExploration: t.int8,
      researchCount: t.int8,
      researchPercent: t.int8
    }),
    u5: t.buffer(1),
    society: Struct({
      score: t.int16,
      totalWonders: t.int8,
      totalCastles: t.int8,
      relics: t.int8,
      u0: t.int8,
      villagerHigh: t.int16
    }),
    u6: t.buffer(84)
  })),
  u6: t.buffer(4)
})
