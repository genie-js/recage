const Struct = require('awestruct')
const ct = require('./types')

const t = Struct.types
const objectList = t.array('selectedCount', t.int32)

function makeActionCodec (id, name, shape) {
  const struct = Struct(shape)
  struct.id = id
  struct.actionName = name
  return struct
}

// 0x00
exports.order = makeActionCodec(0x00, 'order', [
  ['playerNumber', t.int8],
  t.skip(2),
  ['targetId', t.int32],
  ['selectedCount', t.int32],
  ['x', t.float],
  ['y', t.float],
  // if selectedCount == 0xff, the same group is used as in the last command, and no units array is present
  ['units', t.if((struct) => struct.selectedCount < 0xff, objectList)]
])

// 0x01
exports.stop = makeActionCodec(0x01, 'stop', [
  ['selectedCount', t.int8],
  ['units', objectList]
])

// 0x02
exports.work = makeActionCodec(0x02, 'work', [
  t.skip(3),
  ['target', t.int32],
  ['selectedCount', t.int8],
  t.skip(3),
  ['x', t.float],
  ['y', t.float],
  ['units', objectList]
])

// 0x03
exports.move = makeActionCodec(0x03, 'move', [
  ['playerNumber', t.int8],
  t.skip(2),
  ['targetId', t.int32],
  ['selectedCount', t.int8],
  t.skip(3),
  ['x', t.float],
  ['y', t.float],
  // if selectedCount == 0xff, the same group is used as in the last command, and no units array is present
  ['units', t.if((struct) => struct.selectedCount < 0xff, objectList)]
])

// 0x04
exports.create = makeActionCodec(0x04, 'create', [
  t.skip(1),
  ['category', t.uint16],
  ['playerNumber', t.int8],
  t.skip(1),
  ['x', t.float],
  ['y', t.float],
  ['z', t.float]
])

// 0x05
exports.addAttribute = makeActionCodec(0x05, 'addAttribute', [
  ['playerNumber', t.int8],
  ['attribute', t.int8],
  t.skip(1),
  ['amount', t.float]
])

// 0x06
exports.giveAttribute = makeActionCodec(0x06, 'giveAttribute', [
  ['playerNumber', t.int8],
  ['targetNumber', t.int8],
  ['attribute', t.int8],
  ['amount', t.float]
])

// 0x0a
exports.aiOrder = makeActionCodec(0x0a, 'aiOrder', [
  // ???
  ['u0', t.int8],
  ['u1', t.int8],
  ['u2', t.int8],
  ['u3', t.int32],
  ['u4', t.buffer(4)],
  ['u5', t.int32],
  ['u6', t.int16],
  ['u7', t.int32],
  ['u8', t.int32],
  ['u9', t.int32],
  ['u10', t.int32],
  ['u11', t.int32],
  ['u12', t.int16],
  ['u13', t.int8]
])

// 0x0b
exports.resign = makeActionCodec(0x0b, 'resign', [
  ['playerNumber', t.int8],
  ['playerNum', t.int8],
  ['dropped', t.int8]
])

// 0x0c
exports.addWaypoint = makeActionCodec(0x0c, 'addWaypoint', [
])

// 0x0d
exports.pause = makeActionCodec(0x0d, 'pause', [
  // Doesn't occur in savegames.
])

// 0x10
exports.groupWaypoint = makeActionCodec(0x10, 'groupWaypoint', [
  ['playerNumber', t.int8],
  t.skip(2),
  ['unitId', t.int32],
  ['waypointsCount', t.int8],
  t.skip(1),
])

// 0x12
exports.unitAiState = makeActionCodec(0x12, 'unitAiState', [
  ['selectedCount', t.int8],
  ['state', t.int8],
  ['units', objectList]
])

// 0x13
exports.guard = makeActionCodec(0x13, 'guard', [
  ['selectedCount', t.int8],
  t.skip(2),
  ['targetId', t.int32],
  ['units', objectList]
])

// 0x14
exports.follow = makeActionCodec(0x14, 'follow', [
  ['selectedCount', t.int8],
  t.skip(2),
  ['targetId', t.int32],
  ['units', objectList]
])

const patrolWaypoints = Struct([
  ['xs', t.array(10, t.float)],
  ['ys', t.array(10, t.float)],
]).map(
  // {xs, ys} → [{x, y}]
  function decode ({ xs, ys }) {
    return xs.map((x, index) => ({
      x,
      y: ys[index]
    }))
  },
  // [{x, y}] → {xs, ys}
  function encode (coords) {
    const xs = []
    const ys = []
    let i = 0
    for (; i < coords.length; i++) {
      xs.push(coords[i].x)
      ys.push(coords[i].y)
    }
    for (; i < 10; i++) {
      xs.push(0)
      ys.push(0)
    }
    return { xs, ys }
  }
)
exports.patrol = makeActionCodec(0x15, 'patrol', [
  ['selectedCount', t.int8],
  ['waypointsCount', t.int16],
  ['waypoints', patrolWaypoints]
  ['units', objectList]
])

// 0x16
exports.scout = makeActionCodec(0x16, 'scout', [
])

// 0x17
exports.formFormation = makeActionCodec(0x17, 'formFormation', [
  ['selectedCount', t.int8],
  ['playerNumber', t.int8],
  t.skip(1),
  ['formation', t.int32],
  ['units', objectList]
])

// 0x18
exports.breakFormation = makeActionCodec(0x18, 'breakFormation', [
  // ???
])

// 0x19
exports.wheelFormation = makeActionCodec(0x19, 'wheelFormation', [
])

// 0x1A
exports.aboutFaceFormation = makeActionCodec(0x1A, 'aboutFaceFormation', [
])

// 0x1B
exports.save = makeActionCodec(0x1B, 'save', [
  // Does not occur in savegames.
  ['exit', t.bool],
  ['playerNumber', t.int8],
  // NUL-delimited file name, followed by uninitialized memory
  ['filename', t.string(260).mapRead(str => str.replace(/\0.*$/, ''))],
  ['checksum', t.int32]
])

// 0x1C
exports.formationParameters = makeActionCodec(0x1C, 'formationParameters', [
])

// 0x1d
exports.autoFormations = makeActionCodec(0x1D, 'autoFormations', [
])

// 0x1e
exports.lockFormation = makeActionCodec(0x1E, 'lockFormation', [
])

// 0x1f
exports.groupMultiWaypoints = makeActionCodec(0x1F, 'groupMultiWaypoints', [
])

// 0x20
exports.chapter = makeActionCodec(0x20, 'chapter', [
])

// 0x21
exports.attackMove = makeActionCodec(0x21, 'attackMove', [
])

// 0x22
exports.attackMoveTarget = makeActionCodec(0x22, 'attackMoveTarget', [
  // ???
])

// 0x35
exports.aiCommand = makeActionCodec(0x35, 'aiCommand', [
  // ???
  // ai related?
  // UserPatch only
])

// 0x64
exports.make = makeActionCodec(0x64, 'make', [
  t.skip(3),
  ['buildingId', t.int32],
  ['playerNumber', t.int8],
  t.skip(1),
  ['unitType', t.int16],
  t.int32 // apparently always -1?
])

// 0x65
exports.research = makeActionCodec(0x65, 'research', [
  t.skip(1),
  ['buildingId', t.int32],
  ['playerNumber', t.int16],
  ['techId', t.int16],
  t.int32 // always -1?
])

// 0x66
exports.build = makeActionCodec(0x66, 'build', [
  ['builderCount', t.int8],
  ['playerNumber', t.int16],
  ['x', t.float],
  ['y', t.float],
  ['buildingId', t.int32],
  ['frame', t.int32],
  ['builders', t.array('builderCount', t.int32)]
])

// 0x67
exports.game = makeActionCodec(0x67, 'game', [
  ['command', t.int8],
  ['playerNumber', t.int8],

  // Diplomacy.
  t.if((x) => x.command === 0x00, Struct([
    t.skip(1),
    ['otherPlayerNumber', t.int8],
    t.skip(3),
    t.float,
    ['relation', t.int8],
    t.skip(3)
  ])),

  // Game speed.
  t.if((x) => x.command === 0x01, Struct([
    t.skip(1),
    t.skip(4),
    ['speed', t.float],
    t.skip(4)
  ])),

  // Quick Build ("Aegis").
  t.if((x) => x.command === 0x04, Struct([
    ['quickBuildEnabled', t.bool],
    t.skip(12)
  ])),

  // Cheat.
  t.if((x) => x.command === 0x06, Struct([
    t.skip(1),
    ['cheatId', t.int16]
    t.skip(10)
  ])),

  // Allied Victory.
  t.if((x) => x.command === 0x05, Struct([
    t.skip(1),
    ['status', t.bool],
    t.skip(11)
  ])),

  // Unknown (Unused?)
  t.if((x) => x.command === 0x09, Struct([
    t.skip(1),
    t.int16,
    t.skip(10)
  ])),

  // Treason.
  t.if((x) => x.command === 0x0a, Struct([
    t.skip(13),
  ])),

  // Strategic Numbers.
  t.if((x) => x.command === 0x0b, Struct([
    t.skip(1),
    ['strategicNumber', t.int16],
    ['value', t.int32],
    t.skip(6)
  ])),

  // Farm reseeds.
  t.if((x) => x.command === 0x0d || x.command === 0x0e, Struct([
    t.skip(1),
    ['amount', t.int16],
    t.skip(10)
  ]))
])

// 0x68
exports.explore = makeActionCodec(0x68, 'explore', [
])

// 0x69
exports.buildWall = makeActionCodec(0x69, 'buildWall', [
  ['selectedCount', t.int8],
  ['playerNumber', t.int8],
  ['start', Struct([
    ['x', t.int8],
    ['y', t.int8]
  ])],
  ['end', Struct([
    ['x', t.int8],
    ['y', t.int8]
  ])],
  t.skip(1),
  ['buildingId', t.int16],
  t.skip(2),
  t.const([ 0xFF, 0xFF, 0xFF, 0xFF ]),
  ['builders', objectList]
])

// 0x6a
exports.cancelBuild = makeActionCodec(0x6A, 'cancelBuild', [
  t.skip(3),
  ['target', t.int32],
  ['player', t.int32]
])

// 0x6b
exports.attackGround = makeActionCodec(0x6B, 'attackGround', [
  ['selectedCount', t.int8],
  t.skip(2),
  ['x', t.float],
  ['y', t.float],
  ['units', objectList]
])

// 0x6c
exports.tribeGiveAttribute = makeActionCodec(0x6c, 'tribeGiveAttribute', [
  ['playerNumber', t.int8],
  ['targetNumber', t.int8],
  ['attribute', t.int8],
  ['amount', t.float],
  ['fee', t.float]
])

// 0x6d
exports.tradeAttribute = makeActionCodec(0x6d, 'tradeAttribute', [
  // Seems unused, unsure what this is supposed to do
  ['selectedCount', t.int8],
  t.skip(2),
  ['attribute', t.int32],
  ['units', objectList]
])

// 0x6e
exports.repair = makeActionCodec(0x6e, 'repair', [
  ['selectedCount', t.int8],
  t.skip(2),
  ['targetId', t.int32],
  ['repairers', objectList]
])

// 0x6f
exports.ungarrison = makeActionCodec(0x6f, 'ungarrison', [
  ['selectedCount', t.int8],
  t.skip(2),
  ['x', t.float],
  ['y', t.float],
  ['ungarrisonType', t.int8],
  t.skip(3),
  ['ungarrisonId', t.int32],
  ['buildings', objectList]
])

// 0x70
exports.multiQueue = makeActionCodec(0x70, 'multiQueue', [
  t.skip(3),
  ['unitType', t.int16],
  ['selectedCount', t.int8],
  ['amount', t.int8],
  ['buildings', objectList]
])

// 0x72
exports.gate = makeActionCodec(0x72, 'gate', [
  t.skip(3),
  ['gateId', t.int32]
])

// 0x73
exports.flare = makeActionCodec(0x73, 'flare', [
  t.skip(3),
  t.int32,
  ['receivers', t.array(9, t.int8)],
  t.skip(3),
  ['x', t.float],
  ['y', t.float],
  ['player', t.int8],
  ['playerNum', t.int8],
  t.skip(2),
])

// 0x74
exports.special = makeActionCodec(0x74, 'special', [
  ['selectedCount', t.int8],
  t.skip(3),
  ['targetId', t.int32],
  ['action', t.int8],
  t.skip(3),
  ['units', objectList]
])

// 0x75
exports.unitOrder = makeActionCodec(0x75, 'unitOrder', [
  // ???
  ['selectedCount', t.int8],
  t.skip(2),
  ['targetId', t.int32],
  // 0x01 == pack trebuchet
  // 0x02 == unpack trebuchet
  // 0x05 == garrison
  // 0x03, 0x04, 0x06 == ???
  ['action', t.int8],
  t.skip(3),
  ['x', t.float],
  ['y', t.float],
  ['param', t.int32],
  ['units', objectList]
])

// 0x76
exports.diplomacy = makeActionCodec(0x76, 'diplomacy', [
  // This action makes demands of a player, in exchange for an alliance
  // or whatever. I think AI scripts now implement this manually though,
  // and this action is unused.
])

// 0x77
exports.queue = makeActionCodec(0x77, 'queue', [
  t.skip(3),
  ['building', t.int32],
  ['unitType', t.int16],
  ['amount', t.int16]
])

// 0x78
exports.setGatherPoint = makeActionCodec(0x78, 'setGatherPoint', [
  ['selectedCount', t.int8],
  t.skip(2),
  ['targetId', t.int32], // 0xffffffff if there is no target object (i.e. the target is a location)
  ['targetType', t.int32], // 0xffff0000 if there is no target object, object type otherwise?
  ['x', t.float],
  ['y', t.float],
  ['objects', objectList]
])

// 0x79
exports.setRetreatPoint = makeActionCodec(0x79, 'setRetreatPoint', [
  t.skip(3),
  ['unitId', t.int32]
])

// 0x7a
exports.sellCommodity = makeActionCodec(0x7A, 'sellCommodity', [
  ['player', t.int8],
  ['resource', t.int8],
  // market commands store the amount as a byte containing 1 or 5 for 100 and 500 (shift-click)
  ['amount', t.int8.mapRead((amount) => amount * 100)],
  ['marketId', t.int32]
])

// 0x7b
exports.buyCommodity = makeActionCodec(0x7b, 'buyCommodity', [
  ['player', t.int8],
  ['resource', t.int8],
  ['amount', t.int8.mapRead((amount) => amount * 100)],
  ['marketId', t.int32]
])

// 0x7c
exports.offBoardTrade = makeActionCodec(0x7c, 'offBoardTrade', [
  // Unused.
])

// 0x7d
exports.unitTransform = makeActionCodec(0x7d, 'unitTransform', [
  // Unused?
  ['selectedCount', t.int8],
  ['playerNumber', t.int8],
  t.skip(1),
  t.int32,
  t.skip(4),
  ['objects', objectList]
])

// 0x7e
exports.dropRelic = makeActionCodec(0x7e, 'dropRelic', [
  t.skip(3),
  ['unitId', t.int32]
])

// 0x7f
exports.townBell = makeActionCodec(0x7f, 'townBell', [
  t.skip(3),
  ['buildingId', t.int32],
  ['active', t.int32], // whether the bell turns "on" or "off", 1 if villagers enter tc, 0 if villagers exit
  t.skip(3)
])

// 0x80
exports.backToWork = makeActionCodec(0x80, 'backToWork', [
  t.skip(3),
  ['buildingId', t.int32]
])

// 0xff
// UserPatch multiplayer postgame data

const militaryAchievements = Struct([
  ['score', t.int16],
  ['unitsKilled', t.int16],
  ['hitPointsKilled', t.int16],
  ['unitsLost', t.int16],
  ['buildingsRazed', t.int16],
  ['hitPointsRazed', t.int16],
  ['buildingsLost', t.int16],
  ['unitsConverted', t.int16]
])

const economyAchievements = Struct([
  ['score', t.int16],
  t.skip(2),
  ['foodCollected', t.int32],
  ['woodCollected', t.int32],
  ['stoneCollected', t.int32],
  ['goldCollected', t.int32],
  ['tributeSent', t.int16],
  ['tributeReceived', t.int16],
  ['tradeProfit', t.int16],
  ['relicGold', t.int16]
])

const techAchievements = Struct([
  ['score', t.int16],
  t.skip(2),
  ['feudalTime', t.int32],
  ['castleTime', t.int32],
  ['imperialTime', t.int32],
  ['mapExploration', t.int8],
  ['researchCount', t.int8],
  ['researchPercent', t.int8]
])

const societyAchievements = Struct([
  ['score', t.int16],
  ['totalWonders', t.int8],
  ['totalCastles', t.int8],
  ['relics', t.int8],
  t.skip(1),
  ['villagerHigh', t.int16]
])

const playerAchievements = Struct([
  ['name', t.string(16).mapRead((n) => n.trim())],
  ['totalScore', t.int16],
  ['totalScores', t.array(8, t.int16)],
  ['victory', ct.bool],
  ['civilization', t.int8],
  ['color', t.int8],
  ['team', t.int8],
  ['allyCount', t.int8],
  ct.const(-1),
  ['mvp', ct.bool],
  t.skip(3),
  ['result', t.int8],
  t.skip(3),
  ['military', militaryAchievements],
  t.skip(32),
  ['economy', economyAchievements],
  t.skip(16),
  ['tech', techAchievements],
  t.skip(1),
  ['society', societyAchievements],
  t.skip(84)
])

exports.postgame = makeActionCodec(0xff, 'postgame', [
  t.skip(3),
  ['scenarioFilename', t.string(32).mapRead((n) => n.trim())],
  t.skip(4),
  ['duration', t.int32],
  ['allowCheats', ct.bool],
  ['complete', ct.bool],
  t.skip(14),
  ['mapSize', t.int8],
  ['mapId', t.int8],
  ['population', t.int8],
  t.skip(1),
  ['victory', t.int8],
  ['startingAge', t.int8],
  ['resources', t.int8],
  ['allTechs', ct.bool],
  ['teamTogether', ct.bool],
  ['revealMap', t.int8],
  ['isDeathMatch', t.bool],
  ['isRegicide', t.bool],
  t.skip(1),
  ['lockTeams', ct.bool],
  ['lockSpeed', ct.bool],
  ['u5', t.buffer(1)], // TRIBE_Game__unknown5
  ['players', t.array(8, playerAchievements)],
  t.skip(4)
])
