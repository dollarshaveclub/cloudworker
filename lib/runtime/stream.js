const streams = require('@mattiasbuelens/web-streams-polyfill/ponyfill')

module.exports.ReadableStream = streams.ReadableStream
module.exports.WritableStream = streams.WritableStream
module.exports.TransformStream = streams.TransformStream
