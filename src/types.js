const Struct = require('awestruct')
const t = Struct.types

exports.string = function string (sizeType) {
  return Struct.Type({
    read (opts) {
      const size = sizeType.read(opts)
      return t.char(size).read(opts)
    },
    write () {},
    size () {}
  })
}

exports.buf = function buf (size) {
  return Struct.Type({
    read (opts) {
      const length = Struct.getValue(opts.struct, size)
      const result = opts.buf.slice(opts.offset, opts.offset + length)
      opts.offset += length
      return result
    },
    write () {},
    size: (struct) => Struct.getValue(struct, size)
  })
}

exports.bool = t.int8.mapRead((i) => i !== 0)
exports.longBool = t.int32.mapRead((i) => i !== 0)

exports.matrix = (x, y, type) => t.array(x, t.array(y, type))

exports.tile = Struct({
  terrain: t.int8,
  elevation: t.int8
})

exports.const = function constant (bytes) {
  const length = bytes.length
  return Struct.Type({
    read (opts) {
      opts.offset += length
      return bytes
    },
    write (opts) {
      opts.buf.write(bytes, opts.offset, length)
      opts.offset += length
    }
  })
}
