const { Buffer } = require('safe-buffer')
const fs = require('fs')
const inflate = require('inflate-raw/stream')
const concat = require('concat-stream')
const fromBuffer = require('from2-buffer')
const { PassThrough } = require('stream')
const h = require('./header')
const BodyParser = require('./BodyParser')

class RecordedGame {
  constructor (path) {
    if (typeof path === 'string') {
      this.path = path
    } else if (Buffer.isBuffer(path)) {
      this.buf = path
      this.headerLen = path.readInt32LE(0)
      this.nextHeader = path.readInt32LE(4)
    }

    this.fd = null
  }

  /**
   * @private
   */
  sliceStream (start, end) {
    if (this.path) {
      return fs.createReadStream(this.path, { fd: this.fd, start, end })
    } else if (this.buf) {
      return fromBuffer(this.buf.slice(start, end))
    }
  }

  open (cb) {
    fs.open(this.path, 'r', (e, fd) => {
      if (e) return cb(e)
      this.fd = fd
      const headerLenBuf = Buffer.alloc(8)
      fs.read(fd, headerLenBuf, 0, 8, 0, (e) => {
        if (e) return cb(e)
        this.headerLen = headerLenBuf.readInt32LE(0)
        this.nextHeader = headerLenBuf.readInt32LE(4)
        cb(null, fd)
      })
    })
  }

  getHeaderStream () {
    if (this.headerLen) {
      return this.sliceStream(8, this.headerLen + 8)
    }
    const stream = new PassThrough()
    this.open((e, fd) => {
      if (e) {
        stream.emit('error', e)
      } else {
        this.sliceStream(8, this.headerLen + 8).pipe(stream)
      }
    })
    return stream
  }

  getBodyStream () {
    if (this.headerLen) {
      return this.sliceStream(this.headerLen)
    }
    const stream = new PassThrough()
    this.open((e, fd) => {
      if (e) {
        stream.emit('error', e)
      } else {
        this.sliceStream(this.headerLen).pipe(stream)
      }
    })
    return stream
  }

  parseHeader (cb) {
    return this.getHeaderStream()
      .pipe(inflate())
      .pipe(concat((buf) => {
        const opts = { buf, offset: 0 }
        const header = h.header(opts)
        cb(null, header)
      }))
      .on('error', (e) => {
        cb(e)
      })
  }

  parseBody (options, cb) {
    if (typeof options === 'function') {
      cb = options
      options = {}
    }
    const b = new BodyParser(options)
    this.getBodyStream()
      .pipe(b)
      .pipe(concat((rec) => {
        cb(null, rec)
      }))
      .on('error', (e) => {
        cb(e)
      })

    return b
  }
}

module.exports = function (path) {
  return new RecordedGame(path)
}
module.exports.RecordedGame = RecordedGame
