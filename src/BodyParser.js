const Struct = require('awestruct')
const { Buffer } = require('safe-buffer')
const { Transform } = require('stream')
const { TriageAction } = require('./actions')
const t = Struct.types
const ct = require('./types')

const StartCommand = Struct([
  ['isMultiplayer', ct.longBool],
  ['pov', t.int32],
  ['revealMap', t.int32],
  ['recordSequenceNumbers', t.int32],
  // not 100% sure about this
  ['numberOfChapters', t.int32]
])

const CHECKSUM_INTERVAL = 500

const OP_ACTION = 1
const OP_SYNC = 2
const OP_VIEWLOCK = 3
const OP_META = 4

/**
 * Recorded Game Body parser stream. Receives body data, outputs the commands.
 *
 * @param {Object} options Parser Options.
 *    `saveSync`: Whether to output sync packets. There can be a lot of these, and they
 *                may not be very interesting. Defaults to `true`.
 *    `saveViewLock`: Whether to output view lock packets. There are a lot of these, and
 *                they may not be very interesting. Defaults to `true`.
 */

class BodyParser extends Transform {
  constructor (options = {}) {
    super({
      writableObjectMode: false,
      readableObjectMode: true
    })

    this.saveSync = options.saveSync != null ? options.saveSync : true
    this.saveViewLock = options.saveViewLock != null ? options.saveViewLock : true
    this.buffer = null
    this.nextChecksum = CHECKSUM_INTERVAL
    this.currentTime = 0
  }

  _transform (chunk, enc, next) {
    if (this.buffer) {
      chunk = Buffer.concat([ this.buffer, chunk ])
      this.buffer = null
    }

    let offs = 0
    const size = chunk.length

    let operationType
    let command

    while (offs < size - 8) {
      operationType = chunk.readInt32LE(offs)
      offs += 4
      if (operationType === OP_VIEWLOCK) {
        if (offs >= size - 12) {
          offs -= 4
          break
        }
        if (!this.saveViewLock) {
          offs += 12
          continue
        }

        // const ViewLock = Struct([
        //   ['x', t.float],
        //   ['y', t.float],
        //   ['playerId', t.int32]
        // ])
        const x = chunk.readFloatLE(offs)
        const y = chunk.readFloatLE(offs + 4)
        const player = chunk.readInt32LE(offs + 8)
        offs += 12

        this.push({
          type: 'view',
          time: this.currentTime,
          player,
          x,
          y
        })
      } else if (operationType === OP_META) {
        command = chunk.readInt32LE(offs)
        offs += 4
        if (command === 0x01f4) {
          this.push(Object.assign(
            { type: 'start', time: this.currentTime },
            StartCommand.read({ buf: chunk, offset: offs })
          ))
          offs += 20
        } else if (command === -1) {
          const chatLength = chunk.readUInt32LE(offs)
          offs += 4
          this.push({
            type: 'chat',
            time: this.currentTime,
            length: chatLength,
            message: chunk.toString('utf8', offs, offs + chatLength)
          })
          offs += chatLength
        } else {
          throw new TypeError('other command')
        }
      } else if (operationType === OP_SYNC) {
        const backtrack = offs - 4
        // we read sync commands with the standard buffer methods because their length is not constant
        // we cannot know in advance if the command is completely within the current buffer, so we need
        // to be able to backtrack at different locations
        // an alternative would be to wrap a sync Struct() in a try-catch, but that is kinda expensive
        // compared to this
        const sync = {
          time: chunk.readInt32LE(offs)
        }
        offs += 4

        const containsChecksum = this.nextChecksum === 1
        if (containsChecksum) {
          if (offs > size - 28) {
            offs = backtrack
            break
          }
          // const Checksums = Struct([
          //   ct.const([0, 0]),
          //   ['checksum', t.int32],
          //   ['positionChecksum', t.int32],
          //   ct.const([0, 0]),
          //   ['actionChecksum', t.int32]
          // ])
          if (this.saveSync) {
            offs += 4 // always 0
            offs += 4 // always 0
            sync.checksum = chunk.readInt32LE(offs)
            offs += 4
            sync.positionChecksum = chunk.readInt32LE(offs)
            offs += 4
            offs += 4 // always 0
            offs += 4 // always 0
            sync.actionChecksum = chunk.readInt32LE(offs)
            offs += 4
          } else {
            offs += 28
          }
        }

        if (this.saveSync) {
          this.push({
            type: 'sync',
            time: this.currentTime,
            data: sync
          })
        }

        this.currentTime += sync.time
        if (containsChecksum) {
          this.nextChecksum = CHECKSUM_INTERVAL
        } else {
          this.nextChecksum -= 1
        }
      } else if (operationType === OP_ACTION) {
        const length = chunk.readInt32LE(offs)
        offs += 4
        if (offs + length + 3 >= size) {
          offs -= 8
          break
        }

        const action = TriageAction.read({ buf: chunk, offset: offs })
        if (action) {
          this.push({
            type: 'action',
            time: this.currentTime,
            id: action.actionType,
            length: length,
            data: action
          })
        } else {
          this.push({
            type: 'unknown',
            time: this.currentTime,
            command: command,
            length: length,
            buf: chunk.slice(offs, offs + length)
          })
        }
        offs += length
        offs += 4
      } else {
        throw new Error('Unknown operationType: ' + operationType)
      }
    }

    if (offs < size) {
      this.buffer = chunk.slice(offs)
    }

    next()
  }
}

module.exports = BodyParser
