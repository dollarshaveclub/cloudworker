const fetch = require('node-fetch')
const Request = fetch.Request
const Response = fetch.Response
const Headers = fetch.Headers

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

  clone () {
    const resp = super.clone()
    if (this.headers.frozen) {
      freezeHeaders(resp.headers)
    }
    return resp
  }
}

class ShimRequest extends Request {
  constructor (...args) {
    const init = args[1] || {}
    const headers = args[0].headers || init.headers || {}

    // node-fetch preserves the original ''Content-Type' headers
    // This can cause unexpected behavior when creating a request
    // from an existing request or set of headers
    // Rather than calling super and then
    // deleting the headers, we clean the input
    // so that the Content-Type detection
    // will be performed by super.
    const toDelete = ['Content-Type'].map(s => s.toLowerCase())
    if (headers instanceof Headers) {
      toDelete.forEach(key => headers.delete(key))
    } else {
      Object.keys(headers).forEach(key => {
        if (toDelete.includes(key.toLowerCase())) {
          delete headers[key]
        }
      })
    }

    super(...args)
  }

  clone () {
    const req = super.clone()
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
