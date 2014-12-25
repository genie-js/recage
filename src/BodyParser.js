var Transform = require('stream').Transform
  , util = require('util')
  , commands = require('./commands')

var UNKNOWN_COMMAND = {}
  , unknown = function () { return UNKNOWN_COMMAND }
unknown.read = unknown

var commandMap = {
  0x00: commands.attack
, 0x01: commands.stop
, 0x02: commands.x02
, 0x03: commands.move
, 0x0a: commands.x0a
, 0x0b: commands.resign
, 0x10: commands.waypoint
, 0x12: commands.stance
, 0x13: commands.guard
, 0x14: commands.follow
, 0x15: commands.patrol
, 0x17: commands.formation
, 0x18: commands.save
, 0x22: (commands.x22, unknown)
, 0x35: (commands.x35, unknown)
, 0x64: commands.aiTrain
, 0x65: commands.research
, 0x66: commands.build
, 0x67: commands.speed
, 0x69: commands.wall
, 0x6a: commands.delete
, 0x6b: commands.attackGround
, 0x6c: commands.tribute
, 0x6e: (commands.x6e, unknown)
, 0x6f: commands.unload
, 0x73: commands.flare
, 0x75: commands.garrison
, 0x77: commands.train
, 0x78: commands.gatherPoint
, 0x7a: commands.sell
, 0x7b: commands.buy
, 0x7f: commands.bell
, 0x80: commands.ungarrison
, 0xff: commands.postgame
}

module.exports = BodyParser

/**
 * Recorded Game Body parser stream. Receives body data, outputs the commands.
 *
 * @param {Object} options Parser Options.
 *    `saveSync`: Whether to output sync packets. There can be a lot of these, and they
 *                may not be very interesting. Defaults to `true`.
 */
function BodyParser(options) {
  if (!(this instanceof BodyParser)) return new BodyParser(options)

  Transform.call(this)

  this.buffer = null
  this.currentTime = 0

  options = options || {}
  this.saveSync = options.saveSync != null ? options.saveSync : true

  this._writableState.objectMode = false
  this._readableState.objectMode = true
}
util.inherits(BodyParser, Transform)

/**
 * Parses incoming body data.
 *
 * @param {Buffer} buf Data chunk.
 * @param {string} enc Encoding. (Not used.)
 * @param {function()} cb Function to call after processing this chunk.
 * @private
 */
BodyParser.prototype._transform = function (buf, enc, cb) {
  if (this.buffer) {
    buf = Buffer.concat([ this.buffer, buf ])
    this.buffer = null
  }

  var offs = 0
    , size = buf.length

  var odType
    , command

  while (offs < size - 8) {
    odType = buf.readInt32LE(offs), offs += 4
    if (odType === 4 || odType === 3) {
      command = buf.readInt32LE(offs)
      offs += 4
      if (command === 0x01f4) {
        this.push({ type: 'start'
                  , buf: buf.slice(offs, offs + 20) })
        offs += 20
      }
      else if (command === -1) {
        var length = buf.readUInt32LE(offs)
        offs += 4
        this.push({ type: 'chat'
                  , time: this.currentTime
                  , length: length
                  , message: buf.toString('utf8', offs, offs + length) })
        offs += length
      }
      else {
        throw 'other command'
      }
    }
    else if (odType === 2) {
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
        , backtrack = offs - 4
      pack.time = buf.readInt32LE(offs), offs += 4
      pack.u0 = buf.readInt32LE(offs), offs += 4
      if (pack.u0 === 0) {
        if (offs > size - 28) {
          offs = backtrack
          break
        }
        if (this.saveSync) {
          pack.u1 = buf.readInt32LE(offs), offs += 4
          pack.u2 = buf.slice(offs, offs + 4), offs += 4
          pack.u3 = buf.readInt32LE(offs), offs += 4
          pack.u4 = buf.readInt32LE(offs), offs += 4
          pack.u5 = buf.readInt32LE(offs), offs += 4
          pack.u6 = buf.slice(offs, offs + 4), offs += 4
          pack.u7 = buf.readInt32LE(offs), offs += 4
        }
        else {
          offs += 28
        }
      }
      if (offs > size - 12) {
        offs = backtrack
        break
      }
      if (this.saveSync) {
        pack.x = buf.readFloatLE(offs), offs += 4
        pack.y = buf.readFloatLE(offs), offs += 4
        pack.player = buf.readInt32LE(offs), offs += 4

        this.push({ type: 'sync'
                  , time: this.currentTime
                  , data: pack })
      }
      else {
        offs += 12
      }
      this.currentTime += pack.time
    }
    else if (odType === 1) {
      var length = buf.readInt32LE(offs)
      offs += 4
      if (offs + length + 3 > size) {
        offs -= 8
        break
      }
      command = buf.readUInt8(offs), offs += 1
      if (command in commandMap) {
        var value = commandMap[command].read(buf.slice(offs))
        this.push({ type: 'command'
                  , time: this.currentTime
                  , command: command
                  , length: length
                  , data: value })
      }
      else {
        this.push({ type: 'unknown'
                  , time: this.currentTime
                  , command: command
                  , length: length
                  , buf: buf.slice(offs, offs + length) })
      }
      offs += length + 3
    }
    else {
      throw new Error('Unknown odType: ' + odType)
    }
  }

  if (offs < size - 1) {
    this.buffer = buf.slice(offs)
  }

  cb()

}