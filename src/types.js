const Struct = require('awestruct')
const t = Struct.types

exports.longBool = t.int32.mapRead((i) => i !== 0)

exports.matrix = (x, y, type) => t.array(x, t.array(y, type))

exports.const = function constant (bytes) {
  const length = bytes.length
  return Struct.Type({
    read (opts) {
      bytes.forEach((b) => {
        const v = opts.buf[opts.offset++]
        if (v !== b) {
          throw new Error(`expected ${b}, got ${v}`)
        }
      })
      // opts.offset += length
      // return bytes
    },
    write (opts) {
      opts.buf.write(bytes, opts.offset, length)
      opts.offset += length
    }
  })
}
