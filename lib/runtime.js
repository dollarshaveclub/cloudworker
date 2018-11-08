const { Request, Response, fetch, Headers, freezeHeaders } = require('./runtime/fetch')
const { URL } = require('./runtime/url')
const { Stream } = require('./runtime/stream')
const { FetchEvent } = require('./runtime/fetch-event')
const caches = require('./runtime/caches')

class Context {
  constructor (addEventListener) {
    this.console = console
    this.addEventListener = addEventListener
    this.fetch = fetch
    this.Request = Request
    this.Response = Response
    this.Headers = Headers
    this.URL = URL
    this.Stream = Stream
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
  Stream,
  URL,
}
