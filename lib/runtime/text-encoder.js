const textEncoding = require('text-encoding')

function CustomTextDecoder () {
  if (!(this instanceof CustomTextDecoder)) {
    throw TypeError('Called as a function. Did you forget \'new\'?')
  }
  this.decoder = new textEncoding.TextDecoder()
  return this
}

CustomTextDecoder.prototype.decode = function decode (input, options) {
  if (Object.prototype.toString.call(input) === '[object Uint8Array]') {
    var buffer = new ArrayBuffer(input.length)
    var view = new Uint8Array(buffer)
    view.set(input)
    return this.decoder.decode(
      view,
      options)
  }

  return this.decoder.decode(input, options)
}

module.exports.TextDecoder = CustomTextDecoder
module.exports.TextEncoder = textEncoding.TextEncoder
