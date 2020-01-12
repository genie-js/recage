#!/usr/bin/env node

const fs = require('fs')
const bytes = require('bytes')
const args = require('minimist')(process.argv.slice(2))

const filename = args._[0]
const size = args._[1]

if (!filename || args.h || args.help) {
  console.log('Usage:')
  console.log('  node padRecSize.js filename targetSize > output')
  console.log('')
  console.log('Example:')
  console.log('  node padRecSize.js input.mgz 5MB > output.mgz')
  process.exit(args.h || args.help ? 0 : 1)
}

const input = fs.readFileSync(filename)
const targetSize = bytes.parse(size)

if (!isFinite(targetSize)) {
  console.error('must provide a target size')
  process.exit(1)
}

if (input.length > targetSize) {
  console.error('input rec is larger than target size')
  process.exit(1)
}

if (process.stdout.isTTY) {
  console.error('the standard output must be redirected to a file')
  process.exit(1)
}

const paddingSize = targetSize - input.length
const output = Buffer.alloc(targetSize)
input.copy(output)

// Append a rec game command
output.writeUInt32LE(1, input.length)
// of size `paddingSize`
output.writeUInt32LE(paddingSize, input.length + 4)
// and of an unused type `FE`
output.writeUInt8(0xFE, input.length + 4)
// with a whole bunch of NUL bytes as content
// and that advances the in-game timer by 0ms
output.writeUInt32LE(0, targetSize - 4)

process.stdout.end(output)
