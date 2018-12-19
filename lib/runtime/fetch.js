const fetch = require('node-fetch')
const Request = fetch.Request
const Response = fetch.Response
const Headers = fetch.Headers
const nodeStream = require('stream')
const streams = require('@mattiasbuelens/web-streams-polyfill/ponyfill')
const util = require('util')

async function fetchShim (...args) {
  const init = args[1] || {}
  const headers = args[0].headers || init.headers || {}
  // Cloudflare strips the Host header
  if (headers instanceof Headers) {
    headers.delete('Host')
  } else {
    Object.keys(headers).forEach(key => {
      if (key.toLowerCase() === 'host') {
        delete headers[key]
      }
    })
  }

  const resp = await fetch(...args)
  freezeHeaders(resp.headers)
  return resp
}

function freezeHeaders (headers) {
  Object.defineProperty(headers, 'set', {
    value: (url, status) => {
      throw new TypeError("Can't modify immutable headers")
    },
    writable: false,
  })
  headers.frozen = true
}

class ShimResponse extends Response {
  static redirect (url, status) {
    return new ShimResponse('', {status: status || 302, headers: {Location: url}})
  }

  constructor (...args) {
    // Copied from node-fetch's Response class
    let body = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : null
    const opts = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {}

    // Cloudflare supports returning a web-streams ReadableStream as a response body
    // node-fetch does not. To overcome this limitation, we push the contents
    // into a Node Reabable stream.
    if (body instanceof streams.ReadableStream) {
      // Enable object mode so we can push things other than Uint8 and strings.
      // Cloudflare supports pushing TypedArrays and ArrayBuffers.
      // We assert the type while streaming it and then
      // convert it to a Buffer so that it can be piped
      // to a ServerResponse
      var wrapper = new nodeStream.Readable({objectMode: false})
      const doRead = (reader) => {
        reader.read().then((res) => {
          if (res.value) {
            if (!util.types.isArrayBuffer(res.value) && !util.types.isTypedArray(res.value)) {
              const error = TypeError('TransformStreams may only transport bytes, i.e. ArrayBuffers or ArrayBufferViews. Use as an arbitrary object transport is not implemented.')
              wrapper.destroy(error)
              return
            }

            wrapper.push(Buffer.from(res.value))
          }

          if (res.done) {
            wrapper.push(null)
          } else {
            doRead(reader)
          }
        })
      }
      doRead(body.getReader())
      body = wrapper
    }

    super(body, opts)
  }

  clone () {
    const cloned = super.clone()
    const res = new ShimResponse(cloned.body, {
      url: cloned.url,
      status: cloned.status,
      statusText: cloned.statusText,
      headers: cloned.headers,
      ok: cloned.ok,
    })

    if (this.headers.frozen) {
      freezeHeaders(res.headers)
    }

    return res
  }
}

class ShimRequest extends Request {
  clone () {
    const cloned = super.clone()
    const req = new ShimRequest(cloned)
    if (this.headers.frozen) {
      freezeHeaders(req.headers)
    }

    return req
  }
}

module.exports.fetch = fetchShim
module.exports.Request = ShimRequest
module.exports.Response = ShimResponse
module.exports.Headers = Headers
module.exports.freezeHeaders = freezeHeaders
