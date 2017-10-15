const Struct = require('awestruct')
const ct = require('./types')
const resources = require('./resources')

const t = Struct.types

const StringTable = Struct([
  ['maxStrings', t.int16],
  ['numStrings', t.int16],
  ['u1', t.int32],
  ['strings', t.array('numStrings', ct.string(t.int32))],
  ['u2', t.buffer(6)]
])

const AIScript = Struct([
  ['u0', t.int32],
  ['seq', t.int32],
  ['maxRules', t.int16],
  ['numRules', t.int16],
  ['u1', t.int32],
  ['rules', t.array('numRules', Struct([
    ['u0', t.buffer(12)],
    ['numFacts', t.int8],
    ['numFactsActions', t.int8],
    ['zero', t.int16],
    ['data', t.array(16, Struct([
      ['type', t.int32],
      ['id', t.int16],
      ['u0', t.int16],
      ['params', t.array(4, t.int32)]
    ]))]
  ]))]
])

const AIScripts = Struct([
  ['stringTable', StringTable],
  ['scripts', t.array(8, AIScript)],
  ['u0', t.buffer(104)],
  ['timers', t.array(8, t.array(10, t.int32))],
  ['sharedGoals', t.array(256, t.int32)],
  ['zero', t.buffer(4096)]
])

const VisibilityMap = Struct([
  ['x', t.int32],
  ['y', t.int32],
  ['visibility', ct.matrix('x', 'y', t.int32)]
])

const mapData = Struct([
  ['size', Struct([
    ['x', t.int32],
    ['y', t.int32]
  ])],
  ['zonesCount', t.int32],
  ['zones', t.array('zonesCount', Struct([
    ['u0', t.buffer(255)],
    ['u1', t.array(255, t.int32)],
    ['u2', ct.matrix('../size.y', '../size.x', t.int8)],
    ['u3len', t.int32],
    ['u3', t.array('u3len', t.float)],
    ['u4', t.int32]
  ]))],
  ['allVisible', t.bool],
  ['fogOfWar', t.bool],
  ['terrain', ct.matrix('size.x', 'size.y', ct.tile)],
  ['obstructions', Struct([
    ['dataCount', t.int32],
    ['u0', t.int32],
    ['u1', t.array('dataCount', t.int32)],
    ['u2', t.array('dataCount', Struct([
      ['obstructionsCount', t.int32],
      ['obstructionsData', t.array('obstructionsCount', t.buffer(8))]
    ]))]
  ])],
  ['visibilityMap', VisibilityMap],
  ['u0', t.int32],
  ['u1Count', t.int32],
  ['u1', t.array('u1Count', t.buffer(27))]
])

const player = Struct([
  ['diploFrom', t.array('../playersCount', t.int8)],
  ['diploTo', t.array(9, t.int8)],
  ['u0', t.buffer(34)],
  ['name', ct.string(t.int16)],
  ct.const([22]),
  ['resourcesCount', t.int32],
  ct.const([33]),
  ['resources', resources],
  ['u3', t.int8],
  ['camera', Struct([
    ['x', t.float],
    ['y', t.float]
  ])],
  ['u5', t.buffer(9)],
  ['civilization', t.int8],
  ['u6', t.buffer(3)],
  ['color', t.int8],
  // 455
  ['u7', t.buffer((s) => s.$parent.playersCount + 70)],
  ['u8', t.buffer(792)],
  ['pad', t.buffer(41249)],
  ['pad2', t.buffer((s) => s.$parent.mapData.size.x * s.$parent.mapData.size.y)]
])

exports.header = Struct([
  ['versionString', t.char(8)],
  ['version', t.float],
  ['includeAi', ct.longBool],
  ['ai', t.if('includeAi', AIScripts)],
  ['u0', t.uint32],
  ['gameSpeed1', t.int32],
  ['u1', t.int32],
  ['gameSpeed2', t.int32],
  ['u2', t.float],
  ['u3', t.int32],
  ['u4', t.buffer(21)],
  ['owner', t.int16],
  ['playersCount', t.int8],
  ['quickBuildEnabled', t.bool],
  ['cheatsEnabled', t.bool],
  ['gameMode', t.int16],
  ['u6', t.buffer(12)],
  ['u7', t.buffer(14)],
  ['u8', t.array(8, t.int32)],
  ['mapData', mapData],
  ['u13', t.int32] // what is this? 10060 in AoK recorded games, 40600 in AoC and on…
])

exports.player = player
