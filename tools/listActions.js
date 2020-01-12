#!/usr/bin/env node

const { inspect } = require('util')
const { Transform } = require('stream')
const RecordedGame = require('../src/RecordedGame')
const BodyParser = require('../src/BodyParser')
const chalk = require('chalk')
const args = require('minimist')(process.argv.slice(2), {
  alias: {
    saveSync: 'sync',
    saveViewLock: 'view-lock',
  },
  number: ['id']
})
const { ActionName } = RecordedGame

function filter (op) {
  if (args.type && op.type !== args.type) {
    return false
  }
  if (args.id != null && op.type === 'action' && op.data.actionType == args.id) {
    return false
  }
  return true
}

const stream = RecordedGame(args._[0])
  .getBodyStream()
  .pipe(new BodyParser(args))
  .pipe(Transform({
    objectMode: true,
    transform (chunk, enc, cb) {
      if (filter(chunk)) {
        this.push(chunk)
      }
      cb()
    }
  }))

function p(n, len = 2) {
  let s = n.toString()
  while (s.length < len) s = `0${s}`
  return s
}
function formatTime (ms) {
  const s = Math.floor(ms / 1000)
  const m = Math.floor(s / 60)
  const h = Math.floor(m / 60)
  return `[${h}:${p(m % 60)}:${p(s % 60)}.${p(ms % 1000, 3)}]`
}

if (args.raw) {
  stream.on('data', console.log)
} else {
  stream.on('data', (op) => {
    const time = formatTime(op.time)
    if (op.type === 'action') {
      console.log(
        chalk.grey(time),
        chalk.red(ActionName[op.data.actionType]),
        inspect(op.data, { colors: true, breakLength: Infinity }))
    } else if (op.type === 'sync') {
      console.log(
        chalk.grey(time),
        chalk.yellow('sync'),
        `${op.data.time}ms`
      )
    } else if (op.type === 'view') {
      console.log(
        chalk.grey(time),
        chalk.blue('view'),
        `${op.x.toFixed(2)}×${op.y.toFixed(2)}`
      )
    } else if (op.type === 'start') {
      console.log(
        chalk.grey(time),
        chalk.white('start'),
        op.isMultiplayer ? 'multiplayer' : 'single player',
        `pov=${op.pov}`,
        `revealMap=${op.revealMap}`,
        op.recordSequenceNumbers ? 'with seq numbers' : '',
        op.numberOfChapters > 0 ? `(${op.numberOfChapters} chapters)` : ''
      )
    } else if (op.type === 'chat') {
      console.log(
        chalk.grey(time),
        chalk.green('chat'),
        op.message
      )
    }
  })
}
