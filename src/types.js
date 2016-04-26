import Struct, {
  Type as StructType,
  types as t
} from 'awestruct'

export function string (sizeType) {
  return StructType({
    read (opts) {
      const size = sizeType.read(opts)
      return t.char(size).read(opts)
    },
    write () {},
    size () {}
  })
}

export function buf (size) {
  return StructType({
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

export const bool = t.int8.mapRead((i) => i !== 0)
export const longBool = t.int32.mapRead((i) => i !== 0)

export const matrix = (x, y, type) => t.array(x, t.array(y, type))

export const tile = Struct({
  terrain: t.int8,
  elevation: t.int8
})
