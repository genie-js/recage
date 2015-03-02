var Struct = require('awestruct')
  , fs = require('fs')
  , zlib = require('zlib')
  , concat = require('concat-stream')
  , Readable = require('stream').Readable
  , PassThrough = require('stream').PassThrough
  , h = require('./header')
  , BodyParser = require('./BodyParser')

module.exports = RecordedGame

function RecordedGame(path) {
  if (!(this instanceof RecordedGame)) return new RecordedGame(path)

  if (typeof path === 'string') {
    this.path = path
  }
  else if (Buffer.isBuffer(path)) {
    this.buf = path
    this.headerLen = path.readInt32LE(0)
    this.nextHeader = path.readInt32LE(4)
  }
  this.fd = null
}

/**
 * @private
 */
RecordedGame.prototype.sliceStream = function (start, end) {
  if (this.path) {
    return fs.createReadStream(this.path, { fd: this.fd, start: start, end: end })
  }
  else if (this.buf) {
    var s = Readable()
    s._read = function () {
      s.push(this.buf.slice(start, end))
      s.push(null)
    }.bind(this)
    return s
  }
}

RecordedGame.prototype.open = function (cb) {
  var rec = this
  fs.open(this.path, 'r', function (e, fd) {
    if (e) return cb(e)
    rec.fd = fd
    var headerLenBuf = Buffer(8)
    fs.read(fd, headerLenBuf, 0, 8, 0, function (e) {
      if (e) return cb(e)
      rec.headerLen = headerLenBuf.readInt32LE(0)
      rec.nextHeader = headerLenBuf.readInt32LE(4)
      cb(null, fd)
    })
  })
}

RecordedGame.prototype.getHeaderStream = function () {
  if (this.headerLen) {
    return this.sliceStream(8, this.headerLen + 8)
  }
  var stream = PassThrough()
  this.open(function (e, fd) {
    if (e) stream.emit('error', e)
    else {
      this.sliceStream(8, this.headerLen + 8).pipe(stream)
    }
  }.bind(this))
  return stream
}

RecordedGame.prototype.getBodyStream = function () {
  if (this.headerLen) {
    return this.sliceStream(this.headerLen)
  }
  var stream = PassThrough()
  this.open(function (e, fd) {
    if (e) stream.emit('error', e)
    else {
      this.sliceStream(this.headerLen).pipe(stream)
    }
  }.bind(this))
  return stream
}

RecordedGame.prototype.parseHeader = function (cb) {
  var inflate = zlib.createInflateRaw()

  return this.getHeaderStream()
    .pipe(inflate)
    .pipe(concat(function (buf) {
      var opts = { buf: buf, offset: 0 }
      const header = h.header(opts)
      const gaia = h.player(opts, header))
      cb(null, header)
    }))
    .on('error', function (e) { cb(e) })
}

RecordedGame.prototype.parseBody = function (options, cb) {
  if (typeof options === 'function') {
    cb = options
    options = {}
  }
  var b = BodyParser(options)
  this.getBodyStream().pipe(b)
    .pipe(concat(function (rec) { cb(null, rec) }))
    .on('error', function (e) { cb(e) })

  return b
}