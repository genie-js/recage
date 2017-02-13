import fs from 'fs'
import zlib from 'zlib'
import concat from 'concat-stream'
import { Readable, PassThrough } from 'stream'
import * as h from './header'
import BodyParser from './BodyParser'

export default function (path) {
  return new RecordedGame(path)
}

export class RecordedGame {
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
      var s = Readable()
      s._read = () => {
        s.push(this.buf.slice(start, end))
        s.push(null)
      }
      return s
    }
  }

  open (cb) {
    fs.open(this.path, 'r', (e, fd) => {
      if (e) return cb(e)
      this.fd = fd
      const headerLenBuf = Buffer(8)
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
    const stream = PassThrough()
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
    const stream = PassThrough()
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
    const inflate = zlib.createInflateRaw()

    return this.getHeaderStream()
      .pipe(inflate)
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
    const b = BodyParser(options)
    this.getBodyStream().pipe(b)
      .pipe(concat((rec) => {
        cb(null, rec)
      }))
      .on('error', (e) => {
        cb(e)
      })

    return b
  }
}
