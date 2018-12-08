#!/usr/bin/env node
const { Transform } = require('stream')
const RecordedGame = require('../src/RecordedGame')
const BodyParser = require('../src/BodyParser')
const args = require('minimist')(process.argv.slice(2))

RecordedGame(args._[0])
  .getBodyStream()
  .pipe(new BodyParser())
  .pipe(Transform({
    objectMode: true,
    transform (chunk, enc, cb) {
      if ((!args.type || chunk.type === args.type) &&
          (args.id == null || chunk.type === 'action' && chunk.data.actionType == args.id)) {
        this.push(chunk)
      }
      cb()
    }
  }))
  .on('data', console.log)
