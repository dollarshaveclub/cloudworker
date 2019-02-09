const runtime = require('./lib/runtime')
const kv = require('./lib/kv')

module.exports = require('./lib/cloudworker')

module.exports.fetch = runtime.fetch
module.exports.FetchEvent = runtime.FetchEvent
module.exports.URL = runtime.URL
module.exports.Headers = runtime.Headers
module.exports.Request = runtime.Request
module.exports.Response = runtime.Response
module.exports.ReadableStream = runtime.ReadableStream
module.exports.WritableStream = runtime.WritableStream
module.exports.TransformStream = runtime.TransformStream
module.exports.TextDecoder = runtime.TextDecoder
module.exports.TextEncoder = runtime.TextEncoder
module.exports.atob = runtime.atob
module.exports.btoa = runtime.btoa
module.exports.KeyValueStore = kv.KeyValueStore
