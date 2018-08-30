# recage

Age of Empires 2 Recorded Game parser in Node.js. Provides a lowish-level
interface to reading recorded game file headers and commands.

This library only intends to support UserPatch v1.4 recordings at the moment. If
you want something that works for many more versions, try [PHP RecAnalyst][].

## Usage

```js
const RecordedGame = require('recage')
const game = RecordedGame('/path/to/rec.mgz')
// Or:
//   const buffer = fs.readFileSync('/path/to/rec.mgz')
//   const game = RecordedGame(buffer)

// Parse the recorded game file header into an object:
game.parseHeader(function onheader (err, header) {
  if (err) throw err
  console.log('header data', header)
})

// Parse the body into an array of command objects:
game.parseBody(function onbody (err, body) {
  if (err) throw err
  body.forEach((command) => {
    if (command.type === 'chat') {
      console.log('[' + command.time + ']', command.message)
    }
  })
})
```

## License

[GPL-3.0][]

[GPL-3.0]: ./LICENSE.md
[PHP RecAnalyst]: https://github.com/goto-bus-stop/recanalyst
