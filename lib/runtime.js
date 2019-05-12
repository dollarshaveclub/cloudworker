const { Request, Response, fetch, Headers, freezeHeaders, bindCfProperty } = require('./runtime/fetch')
const { URL, URLSearchParams } = require('./runtime/url')
const { ReadableStream, WritableStream, TransformStream } = require('./runtime/stream')
const { FetchEvent } = require('./runtime/fetch-event')
const { crypto } = require('./runtime/crypto')
const { TextDecoder, TextEncoder } = require('./runtime/text-encoder')
const { atob, btoa } = require('./runtime/base64')

class Context {
  constructor (addEventListener, cacheFactory, bindings = {}) {
    this.console = console
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
    this.ArrayBuffer = ArrayBuffer
    this.Int8Array = Int8Array
    this.Uint8Array = Uint8Array
    this.Uint8ClampedArray = Uint8ClampedArray
    this.Int16Array = Int16Array
    this.Uint16Array = Uint16Array
    this.Int32Array = Int32Array
    this.Uint32Array = Uint32Array
    this.Float32Array = Float32Array
    this.Float64Array = Float64Array
    this.Object = Object
    this.constructor = constructor

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
