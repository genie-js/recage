const { Buffer } = require('safe-buffer')
const { Transform } = require('stream')
const Struct = require('awestruct')
const actions = require('./actions')

const UNKNOWN_COMMAND = {}
const unknown = () => UNKNOWN_COMMAND

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
class BodyParser extends Transform {
  constructor (options = {}) {
    super({
      writableObjectMode: false,
      readableObjectMode: true
    })

    this.options = options
    this.saveSync = options.saveSync != null ? options.saveSync : true

    this.buffer = null
    this.currentTime = 0
  }

  /**
   * Parses incoming body data.
   *
   * @param {Buffer} buf Data chunk.
   * @param {string} enc Encoding. (Not used.)
   * @param {function()} cb Function to call after processing this chunk.
   * @private
   */
  _transform (buf, enc, cb) {
    if (this.buffer) {
      buf = Buffer.concat([ this.buffer, buf ])
      this.buffer = null
    }

    var offs = 0
    var size = buf.length

    var odType
    var command

    while (offs < size - 8) {
      odType = buf.readInt32LE(offs)
      offs += 4
      if (odType === 4 || odType === 3) {
        command = buf.readInt32LE(offs)
        offs += 4
        if (command === 0x01f4) {
          this.push({
            type: 'start',
            time: 0,
            buf: buf.slice(offs, offs + 20)
          })
          offs += 20
        } else if (command === -1) {
          var chatLength = buf.readUInt32LE(offs)
          offs += 4
          this.push({
            type: 'chat',
            time: this.currentTime,
            length: chatLength,
            message: buf.toString('utf8', offs, offs + chatLength)
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
        pack.time = buf.readInt32LE(offs)
        offs += 4
        pack.u0 = buf.readInt32LE(offs)
        offs += 4
        if (pack.u0 === 0) {
          if (offs > size - 28) {
            offs = backtrack
            break
          }
          if (this.saveSync) {
            pack.u1 = buf.readInt32LE(offs)
            offs += 4
            pack.u2 = buf.slice(offs, offs + 4)
            offs += 4
            pack.u3 = buf.readInt32LE(offs)
            offs += 4
            pack.u4 = buf.readInt32LE(offs)
            offs += 4
            pack.u5 = buf.readInt32LE(offs)
            offs += 4
            pack.u6 = buf.slice(offs, offs + 4)
            offs += 4
            pack.u7 = buf.readInt32LE(offs)
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
          pack.x = buf.readFloatLE(offs)
          offs += 4
          pack.y = buf.readFloatLE(offs)
          offs += 4
          pack.player = buf.readInt32LE(offs)
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
        var length = buf.readInt32LE(offs)
        offs += 4
        if (offs + length + 3 >= size) {
          offs -= 8
          break
        }

        var action = Action.read({ buf, offset: offs })
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
            buf: buf.slice(offs, offs + length)
          })
        }
        offs += length
        offs += 4
      } else {
        throw new Error('Unknown odType: ' + odType)
      }
    }

    if (offs < size) {
      this.buffer = buf.slice(offs)
    }

    cb()
  }
}

module.exports = function (options) {
  return new BodyParser(options)
}
module.exports.BodyParser = BodyParser
