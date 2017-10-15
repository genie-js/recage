const { Buffer } = require('safe-buffer')
const { Inflate } = require('pako/lib/inflate')
const through = require('through2')

exports.createInflateRaw = function createInflateRaw () {
  const inflater = Inflate({ raw: true })
  const stream = through(onwrite, onend)
  inflater.onData = (chunk) => {
    stream.push(chunk)
  }
  inflater.onEnd = (status) => {
    stream.push(null)
  }
  function onwrite (chunk, enc, cb) {
    inflater.push(chunk, false)
    cb()
  }
  function onend () {
    inflater.push(Buffer.alloc(0), true)
  }

  return stream
}
