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
  ['numberOfChapters', t.int32],
])

/**
 * Recorded Game Body parser stream. Receives body data, outputs the commands.
 *
 * @param {Object} options Parser Options.
 *    `saveSync`: Whether to output sync packets. There can be a lot of these, and they
 *                may not be very interesting. Defaults to `true`.
 */

class BodyParser extends Transform {
  constructor (options = {}) {
    super({
      writableObjectMode: false,
      readableObjectMode: true
    })

    this.saveSync = options.saveSync != null ? options.saveSync : true
    this.buffer = null
    this.currentTime = null
  }

  _transform (chunk, enc, next) {
    if (this.buffer) {
      chunk = Buffer.concat([ this.buffer, chunk ])
      this.buffer = null
    }

    var offs = 0
    var size = chunk.length

    var odType
    var command

    while (offs < size - 8) {
      odType = chunk.readInt32LE(offs)
      offs += 4
      if (odType === 4 || odType === 3) {
        command = chunk.readInt32LE(offs)
        offs += 4
        if (command === 0x01f4) {
          this.push({
            type: 'start',
            time: 0,
            ...StartCommand.read({ buf: chunk, offset: offs })
          })
          offs += 20
        } else if (command === -1) {
          var chatLength = chunk.readUInt32LE(offs)
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
      } else if (odType === 2) {
        if (offs > size - 8) {
          offs -= 4
          break
        }
        // we read sync commands with the standard buffer methods because their length is not constant
        // we cannot know in advance if the command is completely within the current buffer, so we need
        // to be able to backtrack at different locations
        // an alternative would be to wrap a sync Struct() in a try-catch, but that is kinda expensive
        // compared to this
        var pack = {}
        var backtrack = offs - 4
        pack.time = chunk.readInt32LE(offs)
        offs += 4
        pack.u0 = chunk.readInt32LE(offs)
        offs += 4
        if (pack.u0 === 0) {
          if (offs > size - 28) {
            offs = backtrack
            break
          }
          if (this.saveSync) {
            pack.u1 = chunk.readInt32LE(offs)
            offs += 4
            pack.u2 = chunk.slice(offs, offs + 4)
            offs += 4
            pack.u3 = chunk.readInt32LE(offs)
            offs += 4
            pack.u4 = chunk.readInt32LE(offs)
            offs += 4
            pack.u5 = chunk.readInt32LE(offs)
            offs += 4
            pack.u6 = chunk.slice(offs, offs + 4)
            offs += 4
            pack.u7 = chunk.readInt32LE(offs)
            offs += 4
          } else {
            offs += 28
          }
        }
        if (offs > size - 12) {
          offs = backtrack
          break
        }
        if (this.saveSync) {
          pack.x = chunk.readFloatLE(offs)
          offs += 4
          pack.y = chunk.readFloatLE(offs)
          offs += 4
          pack.player = chunk.readInt32LE(offs)
          offs += 4

          this.push({
            type: 'sync',
            time: this.currentTime,
            data: pack
          })
        } else {
          offs += 12
        }
        this.currentTime += pack.time
      } else if (odType === 1) {
        var length = chunk.readInt32LE(offs)
        offs += 4
        if (offs + length + 3 >= size) {
          offs -= 8
          break
        }

        var action = TriageAction.read({ buf: chunk, offset: offs })
        if (action) {
          this.push({
            type: 'action',
            time: this.currentTime,
            id: action.actionId,
            name: action.actionName,
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
        throw new Error('Unknown odType: ' + odType)
      }
    }

    if (offs < size) {
      this.buffer = chunk.slice(offs)
    }

    next()
  }
}

module.exports = BodyParser
