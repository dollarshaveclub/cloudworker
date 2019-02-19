const util = require('util')

class TextDecoder extends util.TextDecoder {
  constructor () {
    if (arguments.length > 0 && arguments[0] !== 'utf-8') {
      throw new RangeError('TextDecoder only supports utf-8 encoding')
    }

    super(...arguments)
  }
}

module.exports.TextDecoder = TextDecoder
module.exports.TextEncoder = util.TextEncoder
