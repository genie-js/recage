var RecordedGame = require('recage').default
var Buffer = require('buffer').Buffer
var file = require('file-component')

var terrainColors = require('./terrainColors.json')

function onFile (input) {
  file(input).toArrayBuffer(function (err, result) {
    var r = RecordedGame(Buffer(result))
    r.parseHeader(onHeader)
  })
}

function onHeader (err, header) {
  render(document.querySelector('#map'), header.map)
}

function render (canvas, map) {
  var context = canvas.getContext('2d')
  var size = map.length
  var tileSize = canvas.width / size
  map.forEach(function (row, y) {
    row.forEach(function (tile, x) {
      context.fillStyle = terrainColors[tile.terrain]
      context.fillRect(x * tileSize, y * tileSize, tileSize, tileSize)
    })
  }, [])
}

exports.onFile = onFile
