const http = require('http')
const https = require('https')
const vm = require('vm')
const runtime = require('./runtime')
const EventEmitter = require('events')
const moment = require('moment')
const StubCacheFactory = require('./runtime/cache/stub')
const CacheFactory = require('./runtime/cache/cache')

class Cloudworker {
  constructor (workerScript, {debug = false, bindings = {}, enableCache = false, tlsKey = null, tlsCert = null} = {}) {
    if (!workerScript || typeof workerScript !== 'string') {
      throw new TypeError('worker script must be a string')
    }

    this.debug = debug
    this.dispatcher = new EventEmitter()
    this.tlsKey = tlsKey
    this.tlsCert = tlsCert
    const eventListener = (eventType, handler) => {
      const wrapper = (event) => {
        Promise.resolve(handler(event)).catch((error) => { event.onError(error) })
      }
      this.dispatcher.on(eventType, wrapper)
    }

    const cacheFactory = enableCache ? new CacheFactory() : new StubCacheFactory()
    this.context = new runtime.Context(eventListener, cacheFactory, bindings)

    this._load(workerScript, this.context)
  }

  async dispatch (request) {
    if (!(request instanceof runtime.Request)) {
      throw new TypeError('argument must be a Request')
    }

    runtime.bindCfProperty(request)
    runtime.freezeHeaders(request.headers)
    const promise = new Promise((resolve, reject) => {
      const respondWith = async (callBackResp) => {
        resolve(await callBackResp)
      }

      const error = async (error) => {
        reject(error)
      }

      const event = new runtime.FetchEvent('fetch', {request: request})
      event.respondWith = respondWith
      event.waitUntil = () => {}
      event.onError = error
      this.dispatcher.emit('fetch', event)
    })
    return promise
  }

  listen (...args) {
    const server = http.createServer(this._handle.bind(this))
    return server.listen(...args)
  }

  httpsListen (...args) {
    const options = {
      key: this.tlsKey,
      cert: this.tlsCert,
    }
    const server = https.createServer(options, this._handle.bind(this))
    return server.listen(...args)
  }

  async _handle (req, res) {
    const start = new Date()

    let url = ''
    if (!req.connection.encrypted) {
      url = 'http://' + req.headers['host'] + req.url
    } else {
      url = 'https://' + req.headers['host'] + req.url
    }

    let body = null
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      const te = req.headers['transfer-encoding'] || ''
      // If transfer encoding is chunked, stream body
      if (te.split(',').map(s => s.trim()).includes('chunked')) {
        body = req
      } else { // otherwise, read body into buffer
        const temp = new runtime.Request(url, {headers: req.headers, body: req, method: req.method})
        body = await temp.buffer()
      }
    }

    const request = new runtime.Request(url, {headers: req.headers, body: body, method: req.method})
    runtime.bindCfProperty(request)
    request.headers.set('CF-Connecting-IP', req.connection.remoteAddress)
    runtime.freezeHeaders(request.headers)

    const respondWith = async (callBackResp) => {
      const log = () => {
        const end = new Date()
        this._logRequest(req, res, start, end)
      }

      try {
        callBackResp = await callBackResp
        await this._pipe(callBackResp, res)
      } catch (error) {
        this._logDebugError(error)
        res.statusCode = 500
        res.end()
      } finally {
        log()
      }
    }

    const error = async (error) => {
      this._logDebugError(error)
      res.statusCode = 500
      res.end()

      const end = new Date()
      this._logRequest(req, res, start, end)
    }

    const event = new runtime.FetchEvent('fetch', {request: request})
    event.respondWith = respondWith
    event.waitUntil = () => {}
    event.onError = error

    try {
      await this.dispatcher.emit('fetch', event)
    } catch (error) {
      res.statusCode = 500
      res.end()
      this._logDebugError(error)
    }
  }

  async _pipe (srcRes, dstRes) {
    const headers = srcRes.headers.raw()
    const buffer = await srcRes.buffer()

    // remove content-length and content-encoding
    // node-fetch decompresses compressed responses
    // so these headers are usually wrong
    delete headers['content-length']
    delete headers['content-encoding']
    dstRes.writeHead(srcRes.status, srcRes.statusText, headers)
    dstRes.write(buffer)
    dstRes.end()
  }

  _load (workerScript, context) {
    vm.createContext(context, {codeGeneration: {strings: false}})
    vm.runInContext(workerScript, context)
  }

  _logRequest (request, response, start, end) {
    const duration = (end - start) / 1000 // convert from milliseconds to seconds
    const date = moment(start).format('DD/MMM/Y:HH:mm:ss ZZ')
    const targetHost = request.headers['host'] || '-'
    const client = request.headers['x-forwarded-for'] || request.connection.remoteAddress
    this._logDebug(`${client} - - [${date}] ${targetHost} "${request.method} ${request.url} HTTP/${request.httpVersion}" ${response.statusCode} ${duration}`)
  }

  _logDebugError (str) {
    if (!this.debug) return
    console.error(str)
  }

  _logDebug (str) {
    if (!this.debug) return
    console.log(str)
  }
}

module.exports = Cloudworker
