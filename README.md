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

Copyright (C) 2018  Renée Kooi <renee@kooi.me>

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program.  If not, see <https://www.gnu.org/licenses/>.

[GPL-3.0]: ./LICENSE.md
[PHP RecAnalyst]: https://github.com/goto-bus-stop/recanalyst
