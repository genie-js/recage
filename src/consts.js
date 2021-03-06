// From UserpatchConst.per
exports.AIOrderType = {
  Attack: 700,
  Defend: 701,
  Build: 702,
  Heal: 703,
  Convert: 704,
  Explore: 705,
  Stop: 706,
  Runaway: 707,
  Retreat: 708,
  Gather: 709,
  Move: 710,
  Patrol: 711,
  Follow: 712,
  Hunt: 713,
  Transport: 714,
  Trade: 715,
  Evade: 716,
  Enter: 717,
  Repair: 718,
  Train: 719,
  Research: 720,
  Unload: 721,
  Relic: 731
}

exports.AIFactType = {
  // This fact needs to be reevaluated every time.
  Volatile: 1,
  // This fact changes sometimes. It can be cached, and manually cleared.
  Cached: 2,
  // This fact never changes.
  Constant: 3
}

const ActionType = {
  Order: 0x00,
  Stop: 0x01,
  Work: 0x02,
  Move: 0x03,
  Create: 0x04,
  AddAttribute: 0x05,
  GiveAttribute: 0x06,
  AIOrder: 0x0a,
  Resign: 0x0b,
  AddWaypoint: 0x0c,
  Pause: 0x0d,
  GroupWaypoint: 0x10,
  UnitAIState: 0x12,
  Group: 0x13,
  Follow: 0x14,
  Patrol: 0x15,
  Scout: 0x16,
  FormFormation: 0x17,
  BreakFormation: 0x18,
  WheelFormation: 0x19,
  AboutFaceFormation: 0x1a,
  Save: 0x1b,
  FormationParameters: 0x1c,
  AutoFormations: 0x1d,
  LockFormation: 0x1e,
  GroupMultiWaypoints: 0x1f,
  Chapter: 0x20,
  AttackMove: 0x21,
  AttackMoveTarget: 0x22,
  AICommand: 0x35,
  Make: 0x64,
  Research: 0x65,
  Build: 0x66,
  Game: 0x67,
  Explore: 0x68,
  BuildWall: 0x69,
  CancelBuild: 0x6a,
  AttackGround: 0x6b,
  TribeGiveAttribute: 0x6c,
  TradeAttribute: 0x6d,
  Repair: 0x6e,
  Ungarrison: 0x6f,
  MultiQueue: 0x70,
  Gate: 0x72,
  Flare: 0x73,
  Special: 0x74,
  UnitOrder: 0x75,
  Diplomacy: 0x76,
  Queue: 0x77,
  SetGatherPoint: 0x78,
  SetRetreatPoint: 0x79,
  SellCommodity: 0x7a,
  BuyCommodity: 0x7b,
  OffBoardTrade: 0x7c,
  UnitTransform: 0x7d,
  DropRelic: 0x7e,
  TownBell: 0x7f,
  BackToWork: 0x80,
  DefinitiveQueue: 0x81,
  PostgameData: 0xff
}
exports.ActionType = ActionType

const ActionName = {}
Object.keys(ActionType).forEach((name) => {
  ActionName[ActionType[name]] = name
})
exports.ActionName = ActionName
