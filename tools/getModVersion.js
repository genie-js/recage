// Known mods
const modNames = {
  1: 'WololoKingdoms',
  2: 'Portuguese Civ Mod'
}
// Optional
const modVersionFormatters = {
  // 572 → 5.7.2
  1: (v) => v.toString().split('').join('.'),
  // 321 → 3.2a
  2: (v) => {
    const [major, minor, str] = v.toString().split('')
    const sub = String.fromCharCode('a'.charCodeAt() + parseInt(str, 10) - 1)
    return `${major}.${minor}${sub}`
  }
}

if (process.argv.length < 3) {
  console.log('No rec game file given. Usage: node tools/getModVersion ./rec.mgz')
  process.exit(2)
}

// Extract the header stream
const rec = require('fs').readFileSync(process.argv[2])
const recView = new DataView(rec.buffer)
const headerLength = recView.getUint32(0)
const compressedHeader = rec.buffer.slice(8, 8 + headerLength)
const uncompressedHeader = require('zlib').inflateRawSync(Buffer.from(compressedHeader))
const view = new DataView(uncompressedHeader.buffer)

const LE = true // little endian

const recVersion = view.getFloat32(8, LE)
if (Math.floor(recVersion * 100) !== 1176) {
  console.log('Not an AoC 1.0c or UserPatch file', recVersion)
  process.exit(0)
}

let offset = 12
const includeAi = view.getUint32(offset, LE)
offset += 4

if (includeAi !== 0) {
  // String table
  offset += 2
  const numStrings = view.getInt16(offset, LE)
  offset += 6
  // skip each string individually
  for (let i = 0; i < numStrings; i++) {
    const length = view.getUint32(offset, LE)
    offset += 4 + length
  }

  // Script info
  offset += 6
  for (let i = 0; i < 8; i++) {
    offset += 10
    const numRules = view.getInt16(offset, LE)
    offset += 6
    // skip AI rules for this player
    offset += numRules * (16 + 16 * 24)
  }
  offset += 5544
}

offset += 47
const numPlayers = view.getInt8(offset, LE)
offset += 63

// Skip map data
const mapSizeX = view.getInt32(offset, LE)
const mapSizeY = view.getInt32(offset + 4, LE)
const numZones = view.getInt32(offset + 8, LE)
offset += 12
for (let i = 0; i < numZones; i++) {
  offset += 1275 + mapSizeX * mapSizeY
  const numPassabilityRules = view.getInt32(offset, LE)
  offset += 8 + numPassabilityRules * 4
}
offset += 2
// skip map tiles—these differ between UP 1.4 and 1.5
for (let i = 0; i < mapSizeX * mapSizeY; i++) {
  const terrain = view.getInt8(offset, LE)
  if (terrain === -1) {
    // UP 1.5
    offset += 4
  } else {
    // UP 1.4 and below
    offset += 2
  }
}

// skip obstruction manager
const numObstructions = view.getInt32(offset, LE)
offset += 8 + numObstructions * 4
for (let i = 0; i < numObstructions; i++) {
  const numData = view.getInt32(offset, LE)
  offset += 4 + numData * 8
}
offset += 12 + mapSizeX * mapSizeY * 4 // visibility map
const numUnknown = view.getInt32(offset, LE)
offset += 8 + numUnknown * 27

// Now at the start of the GAIA player!
offset += numPlayers + 43
const nameLength = view.getInt16(offset, LE)
offset += 3 + nameLength

// Finally…at the resources section
const numAttributes = view.getInt32(offset, LE)
offset += 5

let modId = 0
if (numAttributes > 198) {
  const modIdentifierAttr = view.getFloat32(offset + 198 * 4, LE)
  const feitoriaAttr = numAttributes > 205 ? view.getFloat32(offset + 205 * 4, LE) : 0

  if (modIdentifierAttr > 0) {
    modId = modIdentifierAttr
  } else if (feitoriaAttr > 0) {
    modId = 1000 // Old WololoKingdoms
  }
}

const modType = Math.floor(modId / 1000)
const modVersion = Math.floor(modId % 1000)

if (modType === 0) {
  console.log('Mod: None')
} else if (modNames[modType]) {
  console.log('Mod:', modNames[modType])
  console.log('Version:', modVersionFormatters[modType](modVersion))
} else {
  console.log(`Mod: Unknown (${modType})`)
  console.log('Version:', modVersion)
}
