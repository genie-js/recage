const Struct = require('awestruct')
const { ActionType } = require('./consts')
const ct = require('./types')

const t = Struct.types
const ObjectList = t.array('selectedCount', t.int32)

// 0x00
const OrderAction = Struct([
  ['playerNumber', t.int8],
  t.skip(2),
  ['targetId', t.int32],
  ['selectedCount', t.int32],
  ['x', t.float],
  ['y', t.float],
  // if selectedCount == 0xff, the same group is used as in the last command, and no units array is present
  ['units', t.if((struct) => struct.selectedCount < 0xff, ObjectList)]
])

// 0x01
const StopAction = Struct([
  ['selectedCount', t.int8],
  ['units', ObjectList]
])

// 0x02
const WorkAction = Struct([
  t.skip(3),
  ['target', t.int32],
  ['selectedCount', t.int8],
  t.skip(3),
  ['x', t.float],
  ['y', t.float],
  ['units', ObjectList]
])

// 0x03
const MoveAction = Struct([
  ['playerNumber', t.int8],
  t.skip(2),
  ['targetId', t.int32],
  ['selectedCount', t.int8],
  t.skip(3),
  ['x', t.float],
  ['y', t.float],
  // if selectedCount == 0xff, the same group is used as in the last command, and no units array is present
  ['units', t.if((struct) => struct.selectedCount < 0xff, ObjectList)]
])

// 0x04
const CreateAction = Struct([
  t.skip(1),
  ['category', t.uint16],
  ['playerNumber', t.int8],
  t.skip(1),
  ['x', t.float],
  ['y', t.float],
  ['z', t.float]
])

// 0x05
const AddAttributeAction = Struct([
  ['playerNumber', t.int8],
  ['attribute', t.int8],
  t.skip(1),
  ['amount', t.float]
])

// 0x06
const GiveAttributeAction = Struct([
  ['playerNumber', t.int8],
  ['targetNumber', t.int8],
  ['attribute', t.int8],
  ['amount', t.float]
])

// 0x0a
const AIOrderAction = Struct([
  ['selectedCount', t.int8],
  ['playerId', t.int8],
  ['issuer', t.int8],
  // If one object is selected it's embedded here
  t.if(s => s.selectedCount === 1, Struct([
    ['objectIds', t.array(1, t.int32)]
  ])).else(t.skip(4)),
  // see consts.AIOrderType
  ['orderType', t.int16],
  ['orderPriority', t.int8],
  t.skip(1), // padding
  ['targetId', t.int32],
  ['targetPlayerId', t.int8],
  t.skip(3),
  ['targetLocation', Struct([
    ['x', t.float],
    ['y', t.float],
    ['z', t.float]
  ])],
  ['range', t.float],
  // Should this order be executed immediately or queued?
  ['immediate', t.int8],
  // add to front of the queue?
  ['addToFront', t.int8],
  // If more than 1 object is selected a list is placed at the end
  t.if(s => s.selectedCount > 1, Struct([
    ['objectIds', t.array('../selectedCount', t.int32)]
  ]))
])

// 0x0b
const ResignAction = Struct([
  ['playerNumber', t.int8],
  ['playerNum', t.int8],
  ['dropped', t.int8]
])

// 0x0c
const AddWaypointAction = Struct([
])

// 0x0d
const PauseAction = Struct([
  // Doesn't occur in savegames.
])

// 0x10
const GroupWaypointAction = Struct([
  ['playerNumber', t.int8],
  t.skip(2),
  ['unitId', t.int32],
  ['waypointsCount', t.int8],
  t.skip(1)
])

// 0x12
const UnitAIStateAction = Struct([
  ['selectedCount', t.int8],
  ['state', t.int8],
  ['units', ObjectList]
])

// 0x13
const GroupAction = Struct([
  ['selectedCount', t.int8],
  t.skip(2),
  ['targetId', t.int32],
  ['units', ObjectList]
])

// 0x14
const FollowAction = Struct([
  ['selectedCount', t.int8],
  t.skip(2),
  ['targetId', t.int32],
  ['units', ObjectList]
])

const PatrolWaypoints = Struct([
  ['xs', t.array(10, t.float)],
  ['ys', t.array(10, t.float)]
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

const PatrolAction = Struct([
  ['selectedCount', t.int8],
  ['waypoints', t.dynarray(t.int16, PatrolWaypoints)],
  ['units', ObjectList]
])

// 0x16
const ScoutAction = Struct([
])

// 0x17
const FormFormationAction = Struct([
  ['selectedCount', t.int8],
  ['playerNumber', t.int8],
  t.skip(1),
  ['formation', t.int32],
  ['units', ObjectList]
])

// 0x18
const BreakFormationAction = Struct([
  // ???
])

// 0x19
const WheelFormationAction = Struct([
])

// 0x1A
const AboutFaceFormationAction = Struct([
])

// 0x1B
const SaveAction = Struct([
  // Does not occur in savegames.
  ['exit', t.bool],
  ['playerNumber', t.int8],
  // NUL-delimited file name, followed by uninitialized memory
  ['filename', t.string(260).mapRead(str => str.replace(/\0.*$/, ''))],
  ['checksum', t.int32]
])

// 0x1C
const FormationParametersAction = Struct([
])

// 0x1d
const AutoFormationsAction = Struct([
])

// 0x1e
const LockFormationAction = Struct([
])

// 0x1f
const GroupMultiWaypointsAction = Struct([
])

// 0x20
const ChapterAction = Struct([
])

// 0x21
const AttackMoveAction = Struct([
])

// 0x22
const AttackMoveTargetAction = Struct([
  // ???
])

// 0x35
const AICommandAction = Struct([
  // ???
  // ai related?
  // UserPatch only
])

// 0x64
const MakeAction = Struct([
  t.skip(3),
  ['buildingId', t.int32],
  ['playerNumber', t.int8],
  t.skip(1),
  ['unitType', t.int16],
  t.int32 // apparently always -1?
])

// 0x65
const ResearchAction = Struct([
  t.skip(1),
  ['buildingId', t.int32],
  ['playerNumber', t.int16],
  ['techId', t.int16],
  t.int32 // always -1?
])

// 0x66
const BuildAction = Struct([
  ['builderCount', t.int8],
  ['playerNumber', t.int16],
  ['x', t.float],
  ['y', t.float],
  ['buildingId', t.int32],
  ['frame', t.int32],
  ['builders', t.array('builderCount', t.int32)]
])

// 0x67
const GameAction = Struct([
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
    ['cheatId', t.int16],
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
    t.skip(13)
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
const ExploreAction = Struct([
])

// 0x69
const BuildWallAction = Struct([
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
  ct.const([0xff, 0xff, 0xff, 0xff]),
  ['builders', ObjectList]
])

// 0x6a
const CancelBuildAction = Struct([
  t.skip(3),
  ['target', t.int32],
  ['player', t.int32]
])

// 0x6b
const AttackGroundAction = Struct([
  ['selectedCount', t.int8],
  t.skip(2),
  ['x', t.float],
  ['y', t.float],
  ['units', ObjectList]
])

// 0x6c
const TribeGiveAttributeAction = Struct([
  ['playerNumber', t.int8],
  ['targetNumber', t.int8],
  ['attribute', t.int8],
  ['amount', t.float],
  ['fee', t.float]
])

// 0x6d
const TradeAttributeAction = Struct([
  // Seems unused, unsure what this is supposed to do
  ['selectedCount', t.int8],
  t.skip(2),
  ['attribute', t.int32],
  ['units', ObjectList]
])

// 0x6e
const RepairAction = Struct([
  ['selectedCount', t.int8],
  t.skip(2),
  ['targetId', t.int32],
  ['repairers', ObjectList]
])

// 0x6f
const UngarrisonAction = Struct([
  ['selectedCount', t.int8],
  t.skip(2),
  ['x', t.float],
  ['y', t.float],
  ['ungarrisonType', t.int8],
  t.skip(3),
  ['ungarrisonId', t.int32],
  ['buildings', ObjectList]
])

// 0x70
const MultiQueueAction = Struct([
  t.skip(3),
  ['unitType', t.int16],
  ['selectedCount', t.int8],
  ['amount', t.int8],
  ['buildings', ObjectList]
])

// 0x72
const GateAction = Struct([
  t.skip(3),
  ['gateId', t.int32]
])

// 0x73
const FlareAction = Struct([
  t.skip(3),
  t.int32,
  ['receivers', t.array(9, t.int8)],
  t.skip(3),
  ['x', t.float],
  ['y', t.float],
  ['player', t.int8],
  ['playerNum', t.int8],
  t.skip(2)
])

// 0x74
const SpecialAction = Struct([
  ['selectedCount', t.int8],
  t.skip(3),
  ['targetId', t.int32],
  ['action', t.int8],
  t.skip(3),
  ['units', ObjectList]
])

// 0x75
const UnitOrderAction = Struct([
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
  ['units', ObjectList]
])

// 0x76
const DiplomacyAction = Struct([
  // This action makes demands of a player, in exchange for an alliance
  // or whatever. I think AI scripts now implement this manually though,
  // and this action is unused.
])

// 0x77
const QueueAction = Struct([
  t.skip(3),
  ['building', t.int32],
  ['unitType', t.int16],
  ['amount', t.int16]
])

// 0x78
const SetGatherPointAction = Struct([
  ['selectedCount', t.int8],
  t.skip(2),
  ['targetId', t.int32], // 0xffffffff if there is no target object (i.e. the target is a location)
  ['targetType', t.int32], // 0xffff0000 if there is no target object, object type otherwise?
  ['x', t.float],
  ['y', t.float],
  ['objects', ObjectList]
])

// 0x79
const SetRetreatPointAction = Struct([
  t.skip(3),
  ['unitId', t.int32]
])

// 0x7a
const SellCommodityAction = Struct([
  ['player', t.int8],
  ['resource', t.int8],
  // market commands store the amount as a byte containing 1 or 5 for 100 and 500 (shift-click)
  ['amount', t.int8.mapRead((amount) => amount * 100)],
  ['marketId', t.int32]
])

// 0x7b
const BuyCommodityAction = Struct([
  ['player', t.int8],
  ['resource', t.int8],
  ['amount', t.int8.mapRead((amount) => amount * 100)],
  ['marketId', t.int32]
])

// 0x7c
const OffBoardTradeAction = Struct([
  // Unused.
])

// 0x7d
const UnitTransformAction = Struct([
  // Unused?
  ['selectedCount', t.int8],
  ['playerNumber', t.int8],
  t.skip(1),
  t.int32,
  t.skip(4),
  ['objects', ObjectList]
])

// 0x7e
const DropRelicAction = Struct([
  t.skip(3),
  ['unitId', t.int32]
])

// 0x7f
const TownBellAction = Struct([
  t.skip(3),
  ['buildingId', t.int32],
  ['active', t.int32], // whether the bell turns "on" or "off", 1 if villagers enter tc, 0 if villagers exit
  t.skip(3)
])

// 0x80
const BackToWorkAction = Struct([
  t.skip(3),
  ['buildingId', t.int32]
])

// 0xff
// UserPatch multiplayer postgame data

const MilitaryAchievements = Struct([
  ['score', t.uint16],
  ['unitsKilled', t.uint16],
  ['hitPointsKilled', t.uint16],
  ['unitsLost', t.uint16],
  ['buildingsRazed', t.uint16],
  ['hitPointsRazed', t.uint16],
  ['buildingsLost', t.uint16],
  ['unitsConverted', t.uint16]
])

const EconomyAchievements = Struct([
  ['score', t.uint16],
  t.skip(2),
  ['foodCollected', t.int32],
  ['woodCollected', t.int32],
  ['stoneCollected', t.int32],
  ['goldCollected', t.int32],
  ['tributeSent', t.uint16],
  ['tributeReceived', t.uint16],
  ['tradeProfit', t.uint16],
  ['relicGold', t.uint16]
])

const TechAchievements = Struct([
  ['score', t.uint16],
  t.skip(2),
  ['feudalTime', t.int32],
  ['castleTime', t.int32],
  ['imperialTime', t.int32],
  ['mapExploration', t.int8],
  ['researchCount', t.int8],
  ['researchPercent', t.int8]
])

const SocietyAchievements = Struct([
  ['score', t.uint16],
  ['totalWonders', t.int8],
  ['totalCastles', t.int8],
  ['relics', t.int8],
  t.skip(1),
  ['villagerHigh', t.uint16]
])

const PlayerAchievements = Struct([
  ['name', t.string(16).mapRead((n) => n.trim())],
  ['totalScore', t.uint16],
  ['totalScores', t.array(8, t.uint16)],
  ['victory', t.bool],
  ['civilization', t.int8],
  ['color', t.int8],
  ['team', t.int8],
  ['allyCount', t.int8],
  t.skip(1),
  ['mvp', t.bool],
  t.skip(3),
  ['result', t.int8],
  t.skip(3),
  ['military', MilitaryAchievements],
  t.skip(32),
  ['economy', EconomyAchievements],
  t.skip(16),
  ['tech', TechAchievements],
  t.skip(1),
  ['society', SocietyAchievements],
  t.skip(84)
])

const PostgameData = Struct([
  t.skip(3),
  ['scenarioFilename', t.string(32).mapRead((n) => n.trim())],
  t.skip(4),
  ['duration', t.int32],
  ['allowCheats', t.bool],
  ['complete', t.bool],
  t.skip(14),
  ['mapSize', t.int8],
  ['mapId', t.int8],
  ['population', t.int8],
  t.skip(1),
  ['victory', t.int8],
  ['startingAge', t.int8],
  ['resources', t.int8],
  ['allTechs', t.bool],
  ['teamTogether', t.bool],
  ['revealMap', t.int8],
  ['isDeathMatch', t.bool],
  ['isRegicide', t.bool],
  t.skip(1),
  ['lockTeams', t.bool],
  ['lockSpeed', t.bool],
  ['u5', t.buffer(1)], // TRIBE_Game__unknown5
  ['players', t.array(8, PlayerAchievements)],
  t.skip(4)
])

const actionCodecs = {
  [ActionType.Order]: OrderAction,
  [ActionType.Stop]: StopAction,
  [ActionType.Work]: WorkAction,
  [ActionType.Move]: MoveAction,
  [ActionType.Create]: CreateAction,
  [ActionType.AddAttribute]: AddAttributeAction,
  [ActionType.GiveAttribute]: GiveAttributeAction,
  [ActionType.AIOrder]: AIOrderAction,
  [ActionType.Resign]: ResignAction,
  [ActionType.AddWaypoint]: AddWaypointAction,
  [ActionType.Pause]: PauseAction,
  [ActionType.GroupWaypoint]: GroupWaypointAction,
  [ActionType.UnitAIState]: UnitAIStateAction,
  [ActionType.Group]: GroupAction,
  [ActionType.Follow]: FollowAction,
  [ActionType.Patrol]: PatrolAction,
  [ActionType.Scout]: ScoutAction,
  [ActionType.FormFormation]: FormFormationAction,
  [ActionType.BreakFormation]: BreakFormationAction,
  [ActionType.WheelFormation]: WheelFormationAction,
  [ActionType.AboutFaceFormation]: AboutFaceFormationAction,
  [ActionType.Save]: SaveAction,
  [ActionType.FormationParameters]: FormationParametersAction,
  [ActionType.AutoFormations]: AutoFormationsAction,
  [ActionType.LockFormation]: LockFormationAction,
  [ActionType.GroupMultiWaypoints]: GroupMultiWaypointsAction,
  [ActionType.Chapter]: ChapterAction,
  [ActionType.AttackMove]: AttackMoveAction,
  [ActionType.AttackMoveTarget]: AttackMoveTargetAction,
  [ActionType.AICommand]: AICommandAction,
  [ActionType.Make]: MakeAction,
  [ActionType.Research]: ResearchAction,
  [ActionType.Build]: BuildAction,
  [ActionType.Game]: GameAction,
  [ActionType.Explore]: ExploreAction,
  [ActionType.BuildWall]: BuildWallAction,
  [ActionType.CancelBuild]: CancelBuildAction,
  [ActionType.AttackGround]: AttackGroundAction,
  [ActionType.TribeGiveAttribute]: TribeGiveAttributeAction,
  [ActionType.TradeAttribute]: TradeAttributeAction,
  [ActionType.Repair]: RepairAction,
  [ActionType.Ungarrison]: UngarrisonAction,
  [ActionType.MultiQueue]: MultiQueueAction,
  [ActionType.Gate]: GateAction,
  [ActionType.Flare]: FlareAction,
  [ActionType.Special]: SpecialAction,
  [ActionType.UnitOrder]: UnitOrderAction,
  [ActionType.Diplomacy]: DiplomacyAction,
  [ActionType.Queue]: QueueAction,
  [ActionType.SetGatherPoint]: SetGatherPointAction,
  [ActionType.SetRetreatPoint]: SetRetreatPointAction,
  [ActionType.SellCommodity]: SellCommodityAction,
  [ActionType.BuyCommodity]: BuyCommodityAction,
  [ActionType.OffBoardTrade]: OffBoardTradeAction,
  [ActionType.UnitTransform]: UnitTransformAction,
  [ActionType.DropRelic]: DropRelicAction,
  [ActionType.TownBell]: TownBellAction,
  [ActionType.BackToWork]: BackToWorkAction,
  [ActionType.PostgameData]: PostgameData
}

const TriageAction = Struct([
  ['actionType', t.uint8],
  ...Object.keys(actionCodecs).map((id) =>
    t.if(s => s.actionType === Number(id), actionCodecs[id])
  )
])

module.exports = {
  OrderAction,
  StopAction,
  WorkAction,
  MoveAction,
  CreateAction,
  AddAttributeAction,
  GiveAttributeAction,
  AIOrderAction,
  ResignAction,
  AddWaypointAction,
  PauseAction,
  GroupWaypointAction,
  UnitAIStateAction,
  GroupAction,
  FollowAction,
  PatrolAction,
  ScoutAction,
  FormFormationAction,
  BreakFormationAction,
  WheelFormationAction,
  AboutFaceFormationAction,
  SaveAction,
  FormationParametersAction,
  AutoFormationsAction,
  LockFormationAction,
  GroupMultiWaypointsAction,
  ChapterAction,
  AttackMoveAction,
  AttackMoveTargetAction,
  AICommandAction,
  MakeAction,
  ResearchAction,
  BuildAction,
  GameAction,
  ExploreAction,
  BuildWallAction,
  CancelBuildAction,
  AttackGroundAction,
  TribeGiveAttributeAction,
  TradeAttributeAction,
  RepairAction,
  UngarrisonAction,
  MultiQueueAction,
  GateAction,
  FlareAction,
  SpecialAction,
  UnitOrderAction,
  DiplomacyAction,
  QueueAction,
  SetGatherPointAction,
  SetRetreatPointAction,
  SellCommodityAction,
  BuyCommodityAction,
  OffBoardTradeAction,
  UnitTransformAction,
  DropRelicAction,
  TownBellAction,
  BackToWorkAction,
  PostgameData,
  TriageAction
}
