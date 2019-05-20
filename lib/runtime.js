const { Request, Response, fetch, Headers, freezeHeaders, bindCfProperty } = require('./runtime/fetch')
const { URL, URLSearchParams } = require('./runtime/url')
const { ReadableStream, WritableStream, TransformStream } = require('./runtime/stream')
const { FetchEvent } = require('./runtime/fetch-event')
const { crypto } = require('./runtime/crypto')
const { TextDecoder, TextEncoder } = require('./runtime/text-encoder')
const { atob, btoa } = require('./runtime/base64')

class Context {
  constructor (addEventListener, cacheFactory, bindings = {}) {
    this.setTimeout = setTimeout
    this.clearTimeout = clearTimeout
    this.setInterval = setInterval
    this.clearInterval = clearInterval
    this.addEventListener = addEventListener
    this.fetch = fetch
    this.Request = Request
    this.Response = Response
    this.Headers = Headers
    this.URL = URL
    this.URLSearchParams = URLSearchParams
    this.ReadableStream = ReadableStream
    this.WritableStream = WritableStream
    this.TransformStream = TransformStream
    this.FetchEvent = FetchEvent
    this.caches = cacheFactory
    this.crypto = crypto
    this.TextDecoder = TextDecoder
    this.TextEncoder = TextEncoder
    this.atob = atob
    this.btoa = btoa

    // These are necessary to use "instanceof" within a vm
    this.Array = Array
    this.ArrayBuffer = ArrayBuffer
    this.Atomics = Atomics
    this.BigInt = BigInt
    this.BigInt64Array = BigInt64Array
    this.BigUint64Array = BigUint64Array
    this.Boolean = Boolean
    this.DataView = DataView
    this.Date = Date
    this.Error = Error
    this.EvalError = EvalError
    this.Float32Array = Float32Array
    this.Float64Array = Float64Array
    this.Function = Function
    this.Int8Array = Int8Array
    this.Int16Array = Int16Array
    this.Int32Array = Int32Array
    this.Intl = Intl
    this.JSON = JSON
    this.Map = Map
    this.Math = Math
    this.NaN = NaN
    this.Number = Number
    this.Object = Object
    this.Promise = Promise
    this.Proxy = Proxy
    this.RangeError = RangeError
    this.ReferenceError = ReferenceError
    this.Reflect = Reflect
    this.RegExp = RegExp
    this.Set = Set
    this.SharedArrayBuffer = SharedArrayBuffer
    this.String = String
    this.Symbol = Symbol
    this.SyntaxError = SyntaxError
    this.TypeError = TypeError
    this.URIError = URIError
    this.Uint8Array = Uint8Array
    this.Uint8ClampedArray = Uint8ClampedArray
    this.Uint16Array = Uint16Array
    this.Uint32Array = Uint32Array
    this.WeakMap = WeakMap
    this.WebAssembly = WebAssembly
    this.console = console
    this.constructor = constructor
    this.decodeURI = decodeURI
    this.decodeURIComponent = decodeURIComponent
    this.encodeURI = encodeURI
    this.encodeURIComponent = encodeURIComponent
    this.escape = escape
    this.globalThis = this
    this.isFinite = isFinite
    this.isNaN = isNaN
    this.parseFloat = parseFloat
    this.parseInt = parseInt
    this.self = this
    this.undefined = undefined
    this.unescape = unescape

    Object.assign(this, bindings)
  }
}

module.exports = {
  Context,
  fetch,
  FetchEvent,
  freezeHeaders,
  bindCfProperty,
  Headers,
  Request,
  Response,
  ReadableStream,
  WritableStream,
  TransformStream,
  URL,
  URLSearchParams,
  TextDecoder,
  TextEncoder,
  atob,
  btoa,
}
