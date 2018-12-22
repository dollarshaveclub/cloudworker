const fetch = require('@dollarshaveclub/node-fetch')
const Request = fetch.Request
const Response = fetch.Response
const Headers = fetch.Headers

async function fetchShim (...args) {
  const req = new Request(...args)

  // In Cloudflare Workers, host header
  // is ignored
  req.headers.delete('host')

  // In Cloudflare Workers, no upstream requests
  // get chunked
  req.headers.set('transfer-encoding', '')

  const resp = await fetch(req)
  const shim = new ShimResponse(resp)
  freezeHeaders(shim.headers)
  return shim
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
