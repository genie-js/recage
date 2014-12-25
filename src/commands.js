var Struct = require('awestruct')
  , int8 = Struct.types.int8
  , uint8 = Struct.types.uint8
  , int16 = Struct.types.int16
  , int32 = Struct.types.int32
  , float = Struct.types.float
  , array = Struct.types.array
  , _if = Struct.types.if
  , char = Struct.types.char
  , ct = require('./types')

var objectList = array('selectedCount', int32)

// 0x00
exports.attack = Struct({
  playerId: int8
, u0: ct.buf(2)
, targetId: int32
, selectedCount: int32
, x: float
, y: float
  // if selectedCount == 0xff, the same group is used as in the last command, and no units array is present
, units: _if(function () { return this.selectedCount < 0xff }, objectList)
})

// 0x01
exports.stop = Struct({
  selectedCount: int8
, units: array('selectedCount', int32)
})

// 0x02
exports.x02 = Struct({
  u0: ct.buf(3)
, u1: int32
, u2: int32
, u3: float
, 'building?': int16
, u5: array(2, uint8)
, u6: int32
, u7: uint8
})

// 0x03
exports.move = Struct({
  playerId: int8
, u0: ct.buf(2)
, targetId: ct.buf(4)
, selectedCount: int32
, x: float
, y: float
, units: _if(function () { return this.selectedCount < 0xff }, objectList)
})

// 0x0a
exports.x0a = Struct({
  // ???
  u0: int8
, u1: int8
, u2: int8
, u3: int32
, u4: ct.buf(4)
, u5: int32
, u6: int16
, u7: int32
, u8: int32
, u9: int32
, u10: int32
, u11: int32
, u12: int16
, u13: int8
})

// 0x0b
exports.resign = Struct({
  playerId: int8
, playerNum: int8
, u0: int8
})

// 0x10
exports.waypoint = Struct({
  // ???
  u0: int8
, u1: uint8
, u2: array(2, uint8)
, u3: _if(function () { return this.u1 === 0x01 }, int32)
, u4: uint8
})

// 0x12
exports.stance = Struct({
  selectedCount: int8
, stance: int8
, units: objectList
})

// 0x13
exports.guard = Struct({
  u0: ct.buf(2)
, selectedCount: int32
, target: int32
, units: objectList
})

// 0x14
exports.follow = Struct({
  selectedCount: int8
, u0: ct.buf(2)
, target: int32
, units: objectList
})

// 0x15
exports.patrol = Struct({
  // ???
})

// 0x17
exports.formation = Struct({
  selectedCount: int8
, u0: ct.buf(2)
, formation: int32
, units: objectList
})

// 0x18
exports.save = Struct({
  // ???
})

// 0x22
exports.x22 = Struct({
  // ???
})

// 0x35
exports.x35 = Struct({
  // ???
  // ai related?
})

// 0x64
exports.aiTrain = Struct({
  u0: ct.buf(3)
, building: int32
, unitType: int16
, num: int16
})

// 0x65
exports.research = Struct({
  u0: ct.buf(3)
, building: int32
, player: int16
, research: int16
, u1: ct.buf(4)
})

// 0x66
exports.build = Struct({
  builderCount: int8
, player: int16
, x: float
, y: float
, building: int16
, // ???
})

// 0x67
exports.speed = Struct({
  u0: ct.buf(4)
, speed: float
, u1: ct.buf(4)
, u2: ct.buf(4)
})

// 0x69
exports.wall = Struct({
  // ???
})

// 0x6a
exports.delete = Struct({
  u0: ct.buf(3)
, target: int32
, player: int32
})

// 0x6b
exports.attackGround = Struct({
  selectedCount: int8
, u0: ct.buf(2)
, // ???
})

// 0x6c
exports.tribute = Struct({
  from: int8
, to: int8
, resource: int8
, amount: float
, fee: float
})

// 0x6e
exports.x6e = Struct({
  // ???
})

// 0x6f
exports.unload = Struct({
  player: int8
, u0: ct.buf(2)
, u1: float
, u2: float
, u3: int32
, u4: int32
, building: int32
, u5: uint8 // unit type?
})

// 0x73
exports.flare = Struct({
  u0: ct.buf(3)
, u1: ct.buf(4)
, receivers: array(9, int8)
, u2: ct.buf(3)
, x: float
, y: float
, player: int8
, playerNum: int8
, u3: ct.buf(2)
})

// 0x75
exports.garrison = Struct({
  // ???
  selectedCount: int8
, u0: ct.buf(2)
, building: int32 // sometimes -1? cancels vil production if -1 on a tc
, u1: int32 // normally 5, different if building=-1
, u2: float
, u3: float
, u4: int32
, units: objectList
})

// 0x77
exports.train = Struct({
  u0: ct.buf(3)
, building: int32
, unitType: int16
, num: int16
})

// 0x78
exports.gatherPoint = Struct({
  selectedCount: int8
, u0: ct.buf(2)
, target: int32 // 0xffffffff if there is no target object
, targetType: int32 // 0xffff0000 if there is no target object
, x: float
, y: float
, objects: objectList
})

// 0x7a
exports.sell = Struct({
  player: int8
, resource: int8
, amount: int8.transform(function (amount) { return amount * 100 })
, u0: ct.buf(4)
})

// 0x7b
exports.buy = Struct({
  player: int8
, resource: int8
, amount: int8.transform(function (amount) { return amount * 100 })
, u0: ct.buf(4)
})

// 0x7f
exports.bell = Struct({
  u0: ct.buf(3)
, building: int32
, active: int32
})

// 0x80
exports.ungarrison = Struct({
  u0: ct.buf(3)
, building: int32
})

// 0xff
exports.postgame = Struct({
  u0: ct.buf(3)
, scenarioFilename: char(32).transform(function (n) { return n.trim() })
, u1: ct.buf(4)
, duration: int32
, allowCheats: ct.bool
, complete: ct.bool
, u2: ct.buf(14)
, mapSize: int8
, mapId: int8
, population: int8
, u3: ct.buf(1)
, victory: int8
, startingAge: int8
, resources: int8
, allTechs: ct.bool
, teamTogether: ct.bool
, revealMap: int8
, u4: ct.buf(3)
, lockTeams: ct.bool
, lockSpeed: ct.bool
, u5: ct.buf(1)
, players: array(8, Struct({
    name: char(16).transform(function (n) { return n.trim() })
  , totalScore: int16
  , totalScores: array(8, int16)
  , victory: ct.bool
  , civilization: int8
  , color: int8
  , team: int8
  , u0: ct.buf(2)
  , mvp: ct.bool
  , u1: ct.buf(3)
  , result: int8
  , u2: ct.buf(3)
  , military: Struct({
      score: int16
    , kills: int16
    , u0: int16
    , unitsLost: int16
    , razes: int16
    , u1: int16
    , buildingsLost: int16
    , conversions: int16
    })
  , u3: ct.buf(32)
  , economy: Struct({
      score: int16
    , u0: int16
    , foodCollected: int32
    , woodCollected: int32
    , stoneCollected: int32
    , goldCollected: int32
    , tributeSent: int16
    , tributeReceived: int16
    , tradeProfit: int16
    , relicGold: int16
    })
  , u4: ct.buf(16)
  , tech: Struct({
      score: int16
    , u0: int16
    , feudalTime: int32
    , castleTime: int32
    , imperialTime: int32
    , mapExploration: int8
    , researchCount: int8
    , researchPercent: int8
    })
  , u5: ct.buf(1)
  , society: Struct({
      score: int16
    , totalWonders: int8
    , totalCastles: int8
    , relics: int8
    , u0: int8
    , villagerHigh: int16
    })
  , u6: ct.buf(84)
  }))
, u6: ct.buf(4)
})