var Struct = require('awestruct')
  , ct = require('./types')
  , playerStats = require('./player-stats')

var int32 = Struct.types.int32
  , int16 = Struct.types.int16
  , int8 = Struct.types.int8
  , float = Struct.types.float
  , char = Struct.types.char
  , array = Struct.types.array
  , _if = Struct.types.if

var stringTable = Struct({
  u0: int16 // 5000, max strings?
, numStrings: int16
, u1: int32
, strings: array('numStrings', ct.string(int32))
, u2: ct.buf(6)
})

module.exports = Struct({
  version: char(8)
, subVersion: float
, includeAi: ct.longBool
, ai: _if('includeAi', Struct({
    stringTable: stringTable
  , ai: array(8, Struct({
      u0: int32
    , seq: int32
    , maxRules: int16
    , numRules: int16
    , u1: int32
    , rules: array('numRules', Struct({
        u0: ct.buf(12)
      , numFacts: 'int8'
      , numFactsActions: 'int8'
      , zero: int16
      , data: array(16, Struct({
          type: int32
        , id: int16
        , u0: int16
        , params: array(4, int32)
        }))
      }))
    }))
  , u0: ct.buf(104)
  , timers: array(8, array(10, int32))
  , sharedGoals: array(256, int32)
  , zero: ct.buf(4096)
  }))
, u0: 'uint32'
, gameSpeed1: int32
, u1: int32
, gameSpeed2: int32
, u2: float
, u3: int32
, u4: ct.buf(21)
, owner: int16
, playersCount: int8
, u5: int32
, u6: ct.buf(12)
, u7: ct.buf(14)
, u8: array(8, int32)
, mapSize: Struct({
    x: int32
  , y: int32
  })
, u9len: int32 // AI only?
, u9: array('u9len', Struct({
    u0: ct.buf(255)
  , u1: array(255, int32)
  , u2: array('../mapSize.y', array('../mapSize.x', int8))
  , u3len: int32
  , u3: array('u3len', float)
  , u4: int32
  }))
, u10: ct.buf(2)
, map: array('mapSize.x', array('mapSize.y', Struct({
    terrain: int8
  , elevation: int8
  })))
, u11: ct.buf(120)
, mapSize1: Struct({
    x: int32
  , y: int32
  })
, u12: array('mapSize.x', array('mapSize.y', int32))
, u13: array(2, int32)
, u14: ct.buf(7)
, players: array(/*'playersCount' ← not finished*/0, Struct({
    diploFrom: array('../playersCount', int8)
  , diploTo: array(9, int8)
  , u0: ct.buf(5 + 24 + 2)
  , name: ct.string(int16)
  , u1: int8
  , civHeaderLen: int32 // 198
  , u2: int8
  , civHeader: playerStats
  , u3: int8
  , u4: array(2, float)
  , u5: ct.buf(9)
  , civilization: int8
  , u6: ct.buf(3)
  , color: int8
    // 455
  , u7: ct.buf(function () { return 629 - this.civHeaderLen + 41 - 1-8-9-1-3-1 })
  , position: Struct({
      x: float
    , y: float
    })
  , u11: ct.buf(9)
  , civilization2: int8
  , u12: ct.buf(3)
  , color2: int8
  , u8: ct.buf(function() { return 4183 - (629 - this.civHeaderLen + 41 - 1-8-9-1-3-1) - 8 - 10 - 4 })
  , pad: ct.buf(41249)
  , pad2: ct.buf(function () { return this.$parent.mapSize.x * this.$parent.mapSize.y })
//  , u9: float
//  , researchCount: int32
//  , u10: int16
//  , researchStats: array('researchCount', Struct({
//      status: int16
//    , u0: buf(12)
//    }))
//  , stuff: buf((41249,16226))
//  , stuff2: buf(function () { return this.$parent.mapSize.x * this.$parent.mapSize.y })
//  , idk: buf(65537)
  }))
})
