const Struct = require('awestruct')
const associate = require('associate-arrays')
const ct = require('./types')
const resourceNames = require('./resourceNames')
const { TriageCompactObject } = require('./compactObject')
const { TriageObject } = require('./object')
const TechTree = require('genie-dat/lib/tech-tree')

const t = Struct.types

const StringTable = Struct([
  ['maxStrings', t.int16],
  ['numStrings', t.int16],
  // thanks ES for dumping pointers lol
  ['stringsPointer', t.int32],
  ['strings', t.array('numStrings', t.dynstring(t.int32))]
])

const AIList = Struct([
  ['inUse', t.int32],
  ['id', t.int32],
  ['maxRules', t.int16],
  ['numRules', t.int16],
  ['rulePointer', t.int32],
  ['rules', t.array('numRules', Struct([
    ['inUse', t.int32],
    ['enable', t.int32],
    ['ruleId', t.int16],
    ['nextInGroup', t.int16],
    ['numFacts', t.int8],
    ['numFactsActions', t.int8],
    t.skip(2), // padding
    ['data', t.array(16, Struct([
      ['type', t.int32],
      ['id', t.int16],
      t.skip(2), // padding
      ['params', t.array(4, t.int32)]
    ]))]
  ]))]
])

const AIGroupTable = Struct([
  ['maxGroups', t.int16],
  ['numGroups', t.int16],
  ['groupsPointer', t.int32],
  ['groups', t.array('numGroups', t.int16)]
])

const AIScripts = Struct([
  ['stringTable', StringTable],
  ['maxFacts', t.int16],
  ['maxActions', t.int16],
  ['maxLists', t.int16],
  ['lists', t.array('maxLists', AIList)],
  ['groups', t.array('maxLists', AIGroupTable)],
  ['gameOptions', Struct([
    ['languageSaveVersion', t.float],
    ['languageVersion', t.float],
    ['deathMatch', t.int32],
    ['regicide', t.int32],
    ['mapSize', t.int32],
    ['mapType', t.int32],
    ['startingResources', t.int32],
    ['startingAge', t.int32],
    ['cheatsEnabled', t.int32],
    ['difficulty', t.int32]
  ])],
  ['timers', t.array(8, t.array(10, t.int32))],
  ['sharedGoals', t.array(256, t.int32)],
  ['signals', t.array(256, t.int32)],
  ['triggers', t.array(256, t.int32)],
  ['taunts', t.array(8, t.array(256, t.int8))]
])

const MapZone = (sizeX, sizeY) => Struct([
  ['info', t.array(255, t.int8)],
  ['tiles', t.array(255, t.int32)],
  ['zoneMap', ct.matrix(`../${sizeY}`, `../${sizeX}`, t.int8)],
  ['passabilityRulesNum', t.int32],
  ['passabilityRules', t.array('passabilityRulesNum', t.float)],
  ['numZones', t.int32]
])

const VisibilityMap = Struct([
  ['x', t.int32],
  ['y', t.int32],
  ['visibility', ct.matrix('x', 'y', t.int32)]
])

const ObstructionManager = Struct([
  ['dataCount', t.int32],
  ['capacity', t.int32],
  ['ids', t.array('dataCount', t.int32)],
  ['u2', t.array('dataCount', Struct([
    ['obstructionsCount', t.int32],
    ['points', t.array('obstructionsCount', Struct([
      ['x', t.int32],
      ['y', t.int32]
    ]))]
  ]))]
])

const Tile = Struct([
  ['terrain', t.int8],
  // In UserPatch, the original terrain is also stored.
  // It sets the terrain type to -1 to identify the new tile storage format.
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
  ['visibilityMap', VisibilityMap]
])

const ParticleSystem = Struct([
  ['worldTime', t.int32],
  ['particles', t.dynarray(t.int32, Struct([
    ['start', t.int32],
    ['facet', t.int32],
    ['update', t.int32],
    ['spriteId', t.int16],
    ['x', t.float],
    ['y', t.float],
    ['z', t.float],
    ['flags', t.int8]
  ]))]
])

const PlayerTech = Struct([
  ['techs', t.dynarray(t.int16, Struct([
    ['timeProgress', t.float],
    ['state', t.int16],
    ['modifiers', t.array(3, t.int16)],
    ['timeModifier', t.int16]
  ]))]
])

const HistoryInfo = Struct([
  t.skip(1),
  ['entriesCount', t.int32],
  ['eventsCount', t.int32],
  ['maxEntriesCount', t.int32],
  t.skip(1),
  ['entries', t.array('entriesCount', Struct([
    ['civilianPop', t.int16],
    ['militaryPop', t.int16]
  ]))],
  ['eventsCount2', t.int32],
  ['events', t.array('eventsCount2', Struct([
    ['type', t.int8],
    ['timeSlice', t.int32],
    ['worldTime', t.int32],
    ['data1', t.float],
    ['data2', t.float],
    ['data3', t.float]
  ]))],
  ['razings', t.int32],
  ['hitPointsRazed', t.int32],
  ['razedByOthers', t.int32],
  ['hitPointsRazedByOthers', t.int32],
  ['kills', t.int32],
  ['hitPointsKilled', t.int32],
  ['killedByOthers', t.int32],
  ['hitPointsKilledByOthers', t.int32],
  ['razingsWeight', t.int32],
  ['killsWeight', t.int32],
  ['razingsPercent', t.int32],
  ['killsPercent', t.int32],
  ['razingMode', t.int32],
  ['battleMode', t.int32],
  ['updateCount', t.int32],
  ['oldCurrentUnitsCreated', t.int32],
  ['oldCurrentBuildingsBuilt', t.int32],
  ['oldKills', t.array(8, t.uint16)],
  ['oldKillBVs', t.array(8, t.uint32)],
  ['oldRazings', t.array(8, t.uint16)],
  ['oldRazingBVs', t.array(8, t.uint32)],
  ['runningAverageBVPercent', t.int32],
  ['runningTotalBVKills', t.int32],
  ['runningTotalBVRazings', t.int32],
  ['runningTotalKills', t.int16],
  ['runningTotalRazings', t.int16],
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
  ['name', t.dynstring(t.int16)],
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
  ['savedViews', t.dynarray(t.int32, View)],
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
  ['pathingAttemptCapValue', t.int32],
  ['pathingDelayCapValue', t.int32],
  ['objectCategoriesCount', t.array(900, t.int16)],
  ['objectGroupsCount', t.array(100, t.int16)],
  ['builtObjectCategoriesCount', t.array(900, t.int16)],
  ['builtObjectGroupsCount', t.array(100, t.int16)],
  ['totalUnitsCount', t.int16],
  ['totalBuildingsCount', t.int16],
  ['builtUnitsCount', t.int16],
  ['builtBuildingsCount', t.int16],
  ['lineRatio', t.int32],
  ['columnRatio', t.int32],
  ['minColumnDistance', t.int32],
  ['columnToLineDistance', t.int32],
  ['autoFormations', t.int32],
  ['formationsInfluenceDistance', t.float],
  ['breakAutoFormationsBySpeed', t.float],
  ['pendingDebits', t.array(4, t.float)],
  ['escrowAmounts', t.array(4, t.float)],
  ['escrowPercents', t.array(4, t.float)],
  ['scrollVectorX', t.float],
  ['scrollVectorY', t.float],
  ['scrollEndX', t.float],
  ['scrollEndY', t.float],
  ['scrollStartX', t.float],
  ['scrollStartY', t.float],
  ['scrollTotalDistance', t.float],
  ['scrollDistance', t.float],
  ['easiestReactionPercent', t.float],
  ['easierReactionPercent', t.float],
  ['taskUngroupedSoldiers', t.bool],
  ['selectedCount', t.int32],
  t.if('selectedCount', Struct([
    ['selectedObjectId', t.int32],
    ['selectedObjectProperties', t.int32],
    ['selected', t.array('../selectedCount', t.int32)]
  ])),
  ct.const([11])
])

const ObjectTypeList = Struct([
  ['numObjects', t.int32],
  ['availableObjects', t.array('numObjects', ct.longBool)],
  ct.const([11]), // >= 10.55
  ['objects', t.array(
    s => s.availableObjects.filter(Boolean).length,
    Struct([
      ct.const([22]), // >= 10.55
      TriageCompactObject,
      ct.const([33]) // >= 10.55
    ])
  )]
])

const GaiaWolfInfo = Struct([
  ['id', t.int32],
  ['distance', t.float]
])

const PlayerVisibleMap = Struct([
  ['width', t.int32],
  ['height', t.int32],
  ['exploredTilesCount', t.int32],
  ['player', t.int16],
  ['tiles', t.array('height', t.array('width', t.int8))]
])

const VisibleResourceRec = Struct([
  ['objectId', t.int32],
  ['distance', t.int8],
  ['zone', t.int8],
  ['x', t.int8],
  ['y', t.int8]
])

const VisibleResources = Struct.Type({
  read (opts) {
    const listsCount = opts.buf.readUInt32LE(opts.offset)
    opts.offset += 4
    const lists = []
    for (let i = 0; i < listsCount; i++) {
      lists.push({
        size: opts.buf.readUInt32LE(opts.offset),
        used: opts.buf.readUInt32LE(opts.offset + 4),
        records: []
      })
      opts.offset += 8
    }
    lists.forEach((list) => {
      for (let j = 0; j < list.used; j++) {
        list.records.push(VisibleResourceRec.read(opts))
      }
    })
    return lists
  }
})

const ObjectList = Struct([
  ['size', t.int32],
  ['growSize', t.int32],
  ['items', Struct.Type({
    read (opts) {
      const result = []
      for (let i = 0; ; i++) {
        if (opts.path !== null) opts.path.push(i)
        const object = TriageObject.read(opts)
        if (opts.path !== null) opts.path.pop()
        if (object.type === 0) break
        result.push(object)
      }
      return result
    }
  })]
])

const TribePlayer = playersCount => Struct([
  RGEPlayer(`../${playersCount}`),
  ct.const([11]),
  ['type2', t.int8],
  ['updateCount', t.int32],
  ['updateCountNeedHelp', t.int32],
  ['alertedEnemyCount', t.int32],
  ['regularAttackCount', t.int32],
  ['regularAttackMode', t.int8],
  ['regularAttackX', t.float],
  ['regularAttackY', t.float],
  ['townAttackCount', t.int32],
  ['townAttackMode', t.int8],
  ['townAttackX', t.float],
  ['townAttackY', t.float],
  ['fogUpdate', t.int32],
  ['updateTime', t.float],
  ['upPrePlayerTech', t.buffer(0x1FF0)],
  ['playerTech', PlayerTech],
  ['updateHistoryCount', t.int32],
  ['historyInfo', HistoryInfo],
  ['ruinHeldTime', t.int32],
  ['artifactHeldTime', t.int32],
  t.skip(1), // ct.const([11]),
  ['diploStuff', t.array(9, Struct([
    ['diplo0', t.int8],
    ['diplo1', t.int8],
    ['diplo2', t.int8],
    ['start', t.int8],
    ['this+156', t.int8],
    ['this+140+16', t.int32],
    ['more', t.array(8, t.int8)],
    ['a9', t.int32],
    ['str', t.dynstring(t.int8)],
    ['end', t.int8]
  ]))],
  ['fealty', t.int16],
  t.skip(1), // ct.const([33]),
  ['offboardTradeRouteExplored', t.buffer(20)],
  ['offboardTradeRouteBeingExplored', t.buffer(20)],
  t.skip(1), // ct.const([33]),
  ['maxTradeAmount', t.int32],
  ['oldMaxTradeAmount', t.int32],
  ['maxTradeLimit', t.int32],
  ['currentWoodLimit', t.int32],
  ['currentFoodLimit', t.int32],
  ['currentStoneLimit', t.int32],
  ['currentOreLimit', t.int32],
  ['commodityVolumeDelta', t.int32],
  ['tradeVigRate', t.float],
  ['tradeRefreshTimer', t.int32],
  ['tradeRefreshRate', t.int32],
  ['prodQueueOn', t.int8],
  ['chanceToDodgeMissiles', t.int8],
  ['chanceForArchersToMaintainDistance', t.int8],
  ['openGatesForPathingCount', t.int32],
  ['farmQueueCount', t.int32],
  ['nomadTcBuildLock', t.int32],
  ['oldKills', t.int32],
  ['oldRazings', t.int32],
  ['battleFlag', t.int32],
  ['razingsFlag', t.int32],
  ['totalKills', t.int32],
  ['totalRazings', t.int32],
  ['oldHitPoints', t.int32],
  ['totalHitPoints', t.int32],
  ['oldPlayerKills', t.array(9, t.int32)],
  ['techTree', TechTree],
  ct.const([11]),
  t.if(s => s.type === 3, Struct([
    ['includesAi', t.int32]
    // read AI state if above == 1
  ])),
  ct.const([11]),
  t.if(s => s.type === 2 /* Gaia */, Struct([
    ['updateTime', t.int32],
    ['updateNature', t.int32],
    ['creatures', t.array(5, Struct([
      ['growthRate', t.float],
      ['remainder', t.float],
      ['max', t.int32]
    ]))],
    ['nextWolfAttackUpdateTime', t.uint32],
    ['wolfAttackUpdateInterval', t.uint32],
    ['wolfAttackStopTime', t.uint32],
    ['minVillagerDistance', t.float],
    ['tcPositionX', t.array(9, t.float)],
    ['tcPositionY', t.array(9, t.float)],
    ['wolfCurrentPlayer', t.int32],
    ['wolfCurrentVillagerList', t.array(10, t.int32)],
    ['wolfCurrentVillager', t.int32],
    ['wolfVillagerCount', t.int32],
    ['wolfList', t.array(25, GaiaWolfInfo)],
    ['currentWolf', t.int32],
    ['wolfCount', t.array(10, t.int32)]
  ])),
  ct.const([11]),
  ObjectTypeList,
  ct.const([11]),
  ['visibleMap', PlayerVisibleMap],
  ['visibleResources', VisibleResources],
  ct.const([11]),
  ['objects', ObjectList],
  ['sleepingObjects', ObjectList],
  ['doppelgangerObjects', ObjectList],
  ct.const([11])
])

const Header = Struct([
  ['versionString', t.char(8)],
  ['version', t.float],
  ['includeAi', ct.longBool],
  ['ai', t.if('includeAi', AIScripts)],
  ['oldTime', t.int32],
  ['worldTime', t.int32],
  ['oldWorldTime', t.int32],
  ['worldTimeDelta', t.int32],
  ['worldTimeDeltaSeconds', t.float],
  ['timer', t.float],
  ['gameSpeed', t.float],
  ['tempPause', t.int8],
  ['nextObjectId', t.int32],
  ['nextReusableObjectId', t.int32],
  ['randomSeed', t.int32],
  ['randomSeed2', t.int32],
  ['currentPlayer', t.int16],
  ['playersCount', t.int16],
  ['quickBuildEnabled', t.bool],
  ['cheatsEnabled', t.bool],
  ['gameMode', t.int8],
  ['campaign', t.int32],
  ['campaignPlayer', t.int32],
  ['campaignScenario', t.int32],
  ['kingCampaign', t.int32],
  ['kingCampaignPlayer', t.int8],
  ['kingCampaignScenario', t.int8],
  ['playerTurn', t.int32],
  ['playerTimeDelta', t.array(9, t.uint32)],
  ['mapData', MapData],
  ['particleSystem', ParticleSystem],
  ['u13', t.int32], // what is this? 10060 in AoK recorded games, 40600 in AoC and on…
  ['players', t.array('playersCount', TribePlayer('playersCount'))]
])

module.exports = {
  Header,
  TribePlayer
}
