const Struct = require('awestruct')
const associate = require('associate-arrays')
const ct = require('./types')
const resourceNames = require('./resourceNames')
const { TriageObject } = require('genie-dat/lib/object')

const t = Struct.types

const dynamicArray = (sizeType, elementType) =>
  Struct([
    ['size', sizeType],
    ['elements', t.array('size', elementType)]
  ]).map(
    // When reading, return the elements only.
    r => r.elements,
    // When writing, turn an elements array into a size and elements field.
    elements => ({
      size: elements.length,
      elements
    })
  )

const StringTable = Struct([
  ['maxStrings', t.int16],
  ['numStrings', t.int16],
  // thanks ES for dumping pointers lol
  ['stringsPointer', t.int32],
  ['strings', t.array('numStrings', ct.string(t.int32))]
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
  ['u1', t.int16],
  ['u2', t.int16],
  ['u3', t.int16],
  ['scripts', t.array(8, AIScript)],
  ['u0', t.buffer(104)],
  ['timers', t.array(8, t.array(10, t.int32))],
  ['sharedGoals', t.array(256, t.int32)],
  ['zero', t.buffer(4096)]
])

const MapZone = (sizeX, sizeY) => Struct([
  ['info', t.array(255, t.int8)],
  ['tiles', t.array(255, t.int32)],
  ['zoneMap', ct.matrix(`../${sizeY}`, `../${sizeX}`, t.int8)],
  ['passabilityRulesNum', t.int32],
  ['passabilityRules', t.array('passabilityRulesNum', t.float)],
  ['u4', t.int32]
])

const VisibilityMap = Struct([
  ['x', t.int32],
  ['y', t.int32],
  ['visibility', ct.matrix('x', 'y', t.int32)]
])

const ObstructionManager = Struct([
  ['dataCount', t.int32],
  ['u0', t.int32],
  ['u1', t.array('dataCount', t.int32)],
  ['u2', t.array('dataCount', Struct([
    ['obstructionsCount', t.int32],
    ['obstructionsData', t.array('obstructionsCount', t.buffer(8))]
  ]))]
])

const Tile = Struct([
  ['terrain', t.int8],
  t.if(s => s.terrain === -1, Struct([
    ['terrain', t.int8],
    ['elevation', t.int8],
    ['originalTerrain', t.int8]
  ])).else(Struct([
    ['elevation', t.int8]
  ]))
])

const MapData = Struct([
  ['size', Struct([
    ['x', t.int32],
    ['y', t.int32]
  ])],
  ['zonesCount', t.int32],
  ['zones', t.array('zonesCount', MapZone('size.x', 'size.y'))],
  ['allVisible', t.bool],
  ['fogOfWar', t.bool],
  ['terrain', ct.matrix('size.x', 'size.y', Tile)],
  ['obstructions', ObstructionManager],
  ['visibilityMap', VisibilityMap],
  ['u0', t.int32],
  ['u1Count', t.int32],
  ['u1', t.array('u1Count', t.buffer(27))]
])

const PlayerTech = Struct([
  ['count', t.int16],
  ['techs', t.array('count', Struct([
    ['researchDone', t.int32],
    ['state', t.int16]
  ]))]
])

const TechTreeCommon = Struct([
  ['slotsUsed', t.int32],
  ['unitResearch', t.array('slotsUsed', t.int32)],
  ['mode', t.array('slotsUsed', t.int32)]
])

const TechTreeAge = Struct([
  ['id', t.int32],
  ['status', t.int8],
  ['buildings', dynamicArray(t.uint8, t.int32)],
  ['units', dynamicArray(t.uint8, t.int32)],
  ['techs', dynamicArray(t.uint8, t.int32)],
  TechTreeCommon,
  ['buildingLevelCount', t.int8],
  ['buildingsPerZone', t.int8],
  ['groupLengthPerZone', t.int8],
  ['maxAgeLength', t.int8],
  ['lineMode', t.int32]
])

const TechTreeBuilding = Struct([
  ['id', t.int32],
  ['status', t.int8],
  ['buildings', dynamicArray(t.uint8, t.int32)],
  ['units', dynamicArray(t.uint8, t.int32)],
  ['techs', dynamicArray(t.uint8, t.int32)],
  TechTreeCommon,
  ['locationInAge', t.int8],
  ['unitsTechsTotal', t.int8],
  ['unitsTechsFirst', t.int8],
  ['lineMode', t.int32],
  ['enablingResearch', t.int32]
])

const TechTreeUnit = Struct([
  ['id', t.int32],
  ['status', t.int8],
  ['upperBuilding', t.int32],
  TechTreeCommon,
  ['verticalLine', t.int32],
  ['units', dynamicArray(t.uint8, t.int32)],
  ['locationInAge', t.int32],
  ['requiredResearch', t.int32],
  ['lineMode', t.int32],
  ['enablingResearch', t.int32]
])

const TechTreeResearch = Struct([
  ['id', t.int32],
  ['status', t.int8],
  ['upperBuilding', t.int32],
  ['buildings', dynamicArray(t.uint8, t.int32)],
  ['units', dynamicArray(t.uint8, t.int32)],
  ['techs', dynamicArray(t.uint8, t.int32)],
  TechTreeCommon,
  ['verticalLine', t.int32],
  ['locationInAge', t.int32],
  ['lineMode', t.int32]
])

const TechTree = Struct([
  ['ageCount', t.uint8],
  ['buildingCount', t.uint8],
  ['unitCount', t.uint8],
  ['researchCount', t.uint8],
  ['totalUnitTechGroups', t.int32],
  ['ages', t.array('ageCount', TechTreeAge)],
  ['buildings', t.array('buildingCount', TechTreeBuilding)],
  ['units', t.array('unitCount', TechTreeUnit)],
  ['researchs', t.array('researchCount', TechTreeResearch)]
])

const HistoryInfo = Struct([
  t.skip(1),
  ['entriesCount', t.int32],
  ['eventsCount', t.int32],
  ['maxEntries', t.int32],
  t.skip(1),
  ['entries', t.array('entriesCount', Struct([
    ['zero', t.int16],
    ['one', t.int16]
  ]))],
  ['eventsCount2', t.int32],
  ['events', t.array('eventsCount2', Struct([
    ['next', t.int8],
    ['time', t.int32],
    ['worldTime', t.int32],
    ['event', t.int32],
    ['v19', t.int32],
    ['l+8', t.int32]
  ]))],
  t.skip(17 * 4),
  ['list0', t.array(8, t.uint16)],
  ['list1', t.array(8, t.uint32)],
  ['list2', t.array(8, t.uint16)],
  ['list3', t.array(8, t.uint32)],
  t.skip(3 * 4 + 2 * 2),
  t.skip(1)
])

const View = Struct([
  ['x', t.float],
  ['y', t.float]
])

const RGEPlayer = playersCount => Struct([
  ['type', t.int8],
  ct.const([11]),
  ['relations', t.array(`../${playersCount}`, t.int8)],
  ['unitDiplomacy', t.array(9, t.int32)],
  ['alliedLOS', t.int32],
  ['alliedVictory', t.int8],
  ['name', ct.string(t.int16)],
  ct.const([22]),
  ['attributesCount', t.int32],
  ct.const([33]),
  ['attributes',
    t.array('attributesCount', t.float).map(
      (arr) => {
        let names = resourceNames
        if (arr.length > names.length) {
          const more = arr.splice(names.length, arr.length - names.length)
          names = [...names, 'unnamed']
          arr.push(more)
        } else if (arr.length < names.length) {
          names = names.slice(0, arr.length)
        }
        return associate(names, arr)
      }
    )
  ],
  ct.const([11]),
  ['view', View],
  ['savedViewsCount', t.int32],
  ['savedViews', t.array('savedViewsCount', View)],
  ['map', Struct([
    ['x', t.int16],
    ['y', t.int16]
  ])],
  ['culture', t.int8],
  ['civilization', t.int8],
  ['gameStatus', t.int8],
  ['resigned', t.int8],
  ct.const([11]),
  ['color', t.int8],
  ct.const([11]),
  ['u0', t.int32],
  ['u1', t.int32],
  t.skip(1800),
  t.skip(200),
  t.skip(1800),
  t.skip(200),
  ['totalUnitsCount', t.int16],
  ['totalBuildingsCount', t.int16],
  ['unitsCount', t.int16],
  ['buildingsCount', t.int16],
  t.skip(4 * 7 + 16 * 3 + 4 * 10 + 1),
  ['selectionCount', t.int32],
  t.if('selectionCount', Struct([
    ['u0', t.int32],
    ['u1', t.int32],
    ['selected', t.array('../selectionCount', t.int32)]
  ])),
  ct.const([11])
])

const ObjectTypeList = Struct([
  ['objects', dynamicArray(t.int32, TriageObject)]
])

const TribePlayer = playersCount => Struct([
  RGEPlayer(`../${playersCount}`),
  ct.const([11]),
  ['type2', t.int8],
  t.buffer(16 + 1 + 12 + 1 + 16),
  ['playerTech', PlayerTech],
  ['updateHistoryCount', t.int32],
  ['historyInfo', HistoryInfo],
  ['ruinHeldTime', t.int32],
  ['artifactHeldTime', t.int32],
  ct.const([11]),
  ['unknownList', t.array(9, Struct([
    ['diplo0', t.int8],
    ['diplo1', t.int8],
    ['diplo2', t.int8],
    ['start', t.int8],
    ['this+156', t.int8],
    ['this+140+16', t.int32],
    ['more', t.array(8, t.int8)],
    ['a9', t.int32],
    ['length', t.int32],
    ['str', t.string('length')],
    ['end', t.int8]
  ]))],
  ['u7712', t.int16],
  ct.const([33]),
  ['u7714', t.buffer(0x14)],
  ['u7734', t.buffer(0x14)],
  ct.const([33]),
  t.skip(25 * 4),
  ['techTree', TechTree],
  ct.const([33]),
  ['includesAi', t.int32], // something is host?
  ct.const([33]),
  t.if(s => s.type === 2 /* Gaia */, t.skip(
    8 +
    5 * 12 +
    4 * 4 +
    0x24 * 2 +
    4 +
    0x28 +
    4 * 2 +
    0xC8 +
    4 +
    0x28
  )),
  ct.const([33]),
  ObjectTypeList
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
  ['u7', t.int32],
  ['u8', t.int8],
  ['u9', t.int8],
  ['playerTurn', t.int32],
  ['playerTimeDelta', t.array(9, t.int32)],
  ['mapData', MapData],
  ['u13', t.int32], // what is this? 10060 in AoK recorded games, 40600 in AoC and on…
  ['players', t.array('playersCount', TribePlayer('playersCount'))]
])

exports.player = TribePlayer
