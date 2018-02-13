const { Buffer } = require('safe-buffer')
const through = require('through2')
const Struct = require('awestruct')
const actions = require('./actions')

const actionCodecs = {}
Object.keys(actions).forEach((name) => {
  var actionCodec = actions[name]
  actionCodecs[actionCodec.id] = actionCodec
})

const Action = Struct.Type({
  read (opts) {
    var actionId = opts.buf.readUInt8(opts.offset++)
    if (actionCodecs[actionId]) {
      var action = actionCodecs[actionId].read(opts)
      return Object.assign(action, {
        actionId,
        actionName: actionCodecs[actionId].actionName
      })
    }
  }
})

/**
 * Recorded Game Body parser stream. Receives body data, outputs the commands.
 *
 * @param {Object} options Parser Options.
 *    `saveSync`: Whether to output sync packets. There can be a lot of these, and they
 *                may not be very interesting. Defaults to `true`.
 */

function BodyParser (options = {}) {
  var saveSync = options.saveSync != null ? options.saveSync : true
  var buffer = null
  var currentTime = null

  return through({ writableObjectMode: false, readableObjectMode: true }, onwrite)

  function onwrite (chunk, enc, next) {
    if (buffer) {
      chunk = Buffer.concat([ buffer, chunk ])
      buffer = null
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
            buf: chunk.slice(offs, offs + 20)
          })
          offs += 20
        } else if (command === -1) {
          var chatLength = chunk.readUInt32LE(offs)
          offs += 4
          this.push({
            type: 'chat',
            time: currentTime,
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
          if (saveSync) {
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
        if (saveSync) {
          pack.x = chunk.readFloatLE(offs)
          offs += 4
          pack.y = chunk.readFloatLE(offs)
          offs += 4
          pack.player = chunk.readInt32LE(offs)
          offs += 4

          this.push({
            type: 'sync',
            time: currentTime,
            data: pack
          })
        } else {
          offs += 12
        }
        currentTime += pack.time
      } else if (odType === 1) {
        var length = chunk.readInt32LE(offs)
        offs += 4
        if (offs + length + 3 >= size) {
          offs -= 8
          break
        }

        var action = Action.read({ buf: chunk, offset: offs })
        if (action) {
          this.push({
            type: 'action',
            time: currentTime,
            id: action.actionId,
            name: action.actionName,
            length: length,
            data: action
          })
        } else {
          this.push({
            type: 'unknown',
            time: currentTime,
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
      buffer = chunk.slice(offs)
    }

    next()
  }
}

module.exports = BodyParser
