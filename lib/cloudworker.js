const http = require('http')
const vm = require('vm')
const runtime = require('./runtime')
const EventEmitter = require('events')
const moment = require('moment')
const nodeStream = require('stream')
class Cloudworker {
  constructor (workerScript, {debug = false, bindings = {}} = {}) {
    this.debug = debug
    this.dispatcher = new EventEmitter()
    this.context = new runtime.Context((eventType, handler) => {
      const wrapper = (event) => {
        Promise.resolve(handler(event)).catch((error) => { event.onError(error) })
      }
      this.dispatcher.on(eventType, wrapper)
    }, bindings)

    this.load(workerScript, this.context)
  }

  listen (...args) {
    const server = http.createServer(this.handle.bind(this))
    return server.listen(...args)
  }

  async handle (req, res) {
    const start = new Date()

    var url = 'http://' + req.headers['host'] + req.url
    const request = new runtime.Request(url, {headers: req.headers, body: req.body, method: req.method})
    runtime.freezeHeaders(request.headers)

    const respondWith = async (callBackResp) => {
      const loggingCb = () => {
        const end = new Date()
        this.logRequest(req, res, start, end)
      }

      try {
        callBackResp = await callBackResp
        this.pipe(callBackResp, res, loggingCb)
      } catch (error) {
        this.logDebugError(error)
        res.statusCode = 500
        res.end()
        loggingCb()
      }
    }

    const error = async (error) => {
      this.logDebugError(error)
      res.statusCode = 500
      res.end()

      const end = new Date()
      this.logRequest(req, res, start, end)
    }

    const event = new runtime.FetchEvent(request, respondWith, () => {}, error)

    try {
      await this.dispatcher.emit('fetch', event)
    } catch (error) {
      res.statusCode = 500
      res.end()
      this.logDebugError(error)
    }
  }

  pipe (srcRes, dstRes, callback) {
    var newHeaders = {}
    var oldHeaders = srcRes.headers
    oldHeaders.forEach((val, key) => {
      newHeaders[key] = val
    })

    delete newHeaders['content-length']
    delete newHeaders['content-encoding']

    dstRes.writeHead(srcRes.status, srcRes.statusText, newHeaders)

    if (srcRes.body instanceof nodeStream.Stream) {
      srcRes.body.on('end', () => {
        dstRes.end()
        if (callback) {
          callback()
        }
      })
      srcRes.body.on('error', (error) => {
        this.logDebugError(error)
        dstRes.end() // too late to return a 500 unfortunately
        if (callback) {
          callback()
        }
      })
      srcRes.body.pipe(dstRes, {end: false})
    } else if (typeof srcRes.body === 'string') {
      dstRes.end(srcRes.body)
      if (callback) {
        callback()
      }
    } else {
      srcRes.buffer().then(buffer => {
        dstRes.write(buffer)
        dstRes.end()
        if (callback) {
          callback()
        }
      })
    }
  }

  load (workerScript, context) {
    vm.createContext(context)
    vm.runInContext(workerScript, context)
  }

  logRequest (request, response, start, end) {
    const duration = (end - start) / 1000 // convert from milliseconds to seconds
    const date = moment(start).format('DD/MMM/Y:HH:mm:ss ZZ')
    const targetHost = request.headers['host'] || '-'
    const client = request.headers['x-forwarded-for'] || request.connection.remoteAddress
    this.logDebug(`${client} - - [${date}] ${targetHost} "${request.method} ${request.url} HTTP/${request.httpVersion}" ${response.statusCode} ${duration}`)
  }

  logDebugError (str) {
    if (!this.debug) return
    console.error(str)
  }

  logDebug (str) {
    if (!this.debug) return
    console.log(str)
  }
}

module.exports = Cloudworker
