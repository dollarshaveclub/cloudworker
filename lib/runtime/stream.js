const streams = require('web-streams-polyfill')

module.exports.ReadableStream = streams.ReadableStream
module.exports.WritableStream = streams.WritableStream
module.exports.TransformStream = streams.TransformStream
