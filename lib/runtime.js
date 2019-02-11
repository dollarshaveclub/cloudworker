const { Request, Response, fetch, Headers, freezeHeaders, bindCfProperty } = require('./runtime/fetch')
const { URL } = require('./runtime/url')
const { ReadableStream, WritableStream, TransformStream } = require('./runtime/stream')
const { FetchEvent } = require('./runtime/fetch-event')
const { crypto } = require('./runtime/crypto')
const { TextDecoder, TextEncoder } = require('./runtime/text-encoder')
const { atob, btoa } = require('./runtime/base64')

class Context {
  constructor (addEventListener, cacheFactory, bindings = {}) {
    this.console = console
    this.addEventListener = addEventListener
    this.fetch = fetch
    this.Request = Request
    this.Response = Response
    this.Headers = Headers
    this.URL = URL
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
  TextDecoder,
  TextEncoder,
  atob,
  btoa,
}
