const CachePolicy = require('http-cache-semantics')
const {URL} = require('../url')
const REQ_METHOD = Symbol('REQ_METHOD')

class CloudflareCachePolicy extends CachePolicy {
  constructor (req, res, opts = {}) {
    const policyReq = CloudflareCachePolicy.cachePolicyRequestFromRequest(req, opts.ignoreMethod === true)
    const policyRes = CloudflareCachePolicy.cachePolicyResponseFromResponse(res)

    super(policyReq, policyRes, {shared: true, ...opts})

    this[REQ_METHOD] = policyReq.method
  }

  static cachePolicyRequestFromRequest (req, ignoreMethod) {
    const headers = CloudflareCachePolicy.headersToObject(req.headers)
    delete headers['cache-control'] // Cloudflare doesn't care about request cache-control

    return {
      url: new URL(req.url).pathname,
      method: ignoreMethod ? 'GET' : req.method,
      headers: CloudflareCachePolicy.headersToObject(req.headers),
    }
  }

  static cachePolicyResponseFromResponse (res) {
    const headers = CloudflareCachePolicy.headersToObject(res.headers)
    const cacheControl = headers['cache-control'] || ''
    const pruneSetCookie = cacheControl.toLowerCase().includes('private=set-cookie')

    if (pruneSetCookie) {
      // clean up the cache control directive so we don't confuse our parent class
      // if we didn't do this, it'd treat cache-control as being entirely private
      headers['cache-control'] = cacheControl.replace('private=set-cookie', '')
      delete headers['set-cookie']
    }

    return {
      status: res.status,
      headers: headers,
    }
  }

  static headersToObject (headers) {
    const headersObj = {}
    for (const [key, value] of headers) {
      headersObj[key] = value
    }
    return headersObj
  }

  storable () {
    const hasSetCookie = this.responseHeaders()['set-cookie'] !== undefined
    const isGet = this[REQ_METHOD] === 'GET'
    return !hasSetCookie && isGet && super.storable()
  }
}

module.exports = CloudflareCachePolicy
