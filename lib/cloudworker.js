const http = require('http')
const vm = require('vm')
const runtime = require('./runtime')
const EventEmitter = require('events')
const moment = require('moment')

class Cloudworker {
  constructor ({workerScript, debug = false}) {
    this.debug = debug
    this.dispatcher = new EventEmitter()
    this.context = new runtime.Context((event, handler) => {
      this.dispatcher.on(event, handler)
    })

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

    const event = new runtime.FetchEvent(request, respondWith, () => {})

    try {
      await this.dispatcher.emit('fetch', event)
    } catch (error) {
      res.end()
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

    if (srcRes.body instanceof runtime.Stream) {
      srcRes.body.pipe(dstRes)
      srcRes.body.on('end', () => {
        dstRes.end()
        if (callback) {
          callback()
        }
      })
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
