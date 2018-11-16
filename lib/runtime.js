const { Request, Response, fetch, Headers, freezeHeaders } = require('./runtime/fetch')
const { URL } = require('./runtime/url')
const { ReadableStream, WritableStream, TransformStream } = require('./runtime/stream')
const { FetchEvent } = require('./runtime/fetch-event')
const caches = require('./runtime/caches')

class Context {
  constructor (addEventListener, bindings = {}) {
    Object.assign(this, bindings)
    this.console = console
    this.addEventListener = addEventListener
    this.fetch = fetch
    this.Request = Request
    this.Response = Response
    this.Headers = Headers
    this.URL = URL
    this.ReadbleStream = ReadableStream
    this.FetchEvent = FetchEvent
    this.caches = caches
  }
}

module.exports = {
  Context,
  caches,
  fetch,
  FetchEvent,
  freezeHeaders,
  Headers,
  Request,
  Response,
  ReadableStream,
  WritableStream,
  TransformStream,
  URL,
}
