var Struct = require('awestruct')
  , t = Struct.types

exports.string = function (sizeType) {
  return Struct.Type({
    read: function (opts) {
      var size = sizeType.read(opts)
      return t.char(size).read(opts)
    }
  , write: function () {}
  , size: function () {}
  })
}

exports.buf = function (size) {
  return Struct.Type({
    read: function (opts) {
      var length = Struct.getValue(opts.struct, size)
        , result = opts.buf.slice(opts.offset, opts.offset + length)
      opts.offset += length
      return result
    },
    write: function (opts, value) { throw 'lol' },
    size: function (struct) { return Struct.getValue(struct, size) }
  })
}

exports.bool = t.int8.transform(function (i) { return i !== 0 })
exports.longBool = t.int32.transform(function (i) { return i !== 0 })