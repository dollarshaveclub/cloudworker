const textEncoding = require('text-encoding')

function CustomTextDecoder (label, options) {
  if (!(this instanceof CustomTextDecoder)) {
    throw TypeError('Called as a function. Did you forget \'new\'?')
  }
  this.decoder = new textEncoding.TextDecoder(label, options)
  return this
}

CustomTextDecoder.prototype.decode = function decode (input, options) {
  if (Object.prototype.toString.call(input) === '[object Uint8Array]') {
    const buffer = new ArrayBuffer(input.length)
    const view = new Uint8Array(buffer)
    view.set(input)
    return this.decoder.decode(
      view,
      options)
  }

  return this.decoder.decode(input, options)
}

Object.defineProperty(CustomTextDecoder.prototype, 'encoding', {
  /** @this {CustomTextDecoder} */
  get: function () { return this.decoder.encoding },
})

Object.defineProperty(CustomTextDecoder.prototype, 'fatal', {
  /** @this {CustomTextDecoder} */
  get: function () { return this.decoder.fatal },
})

Object.defineProperty(CustomTextDecoder.prototype, 'ignoreBOM', {
  /** @this {CustomTextDecoder} */
  get: function () { return this.decoder.ignoreBOM },
})

module.exports.TextDecoder = CustomTextDecoder
module.exports.TextEncoder = textEncoding.TextEncoder
