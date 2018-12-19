const LRU = require('lru-cache')
const CFCachePolicy = require('./cloudflareCachePolicy')
const {Request} = require('../fetch')

class CacheFactory {
  constructor () {
    Object.defineProperty(this, 'default', {
      value: new Cache(),
      writable: false,
    })
  }

  open (name) {
    return new Cache()
  }
}

class Cache {
  constructor () {
    this.cache = new LRU()
  }

  async put (req, res) {
    const cacheKey = this.cacheKey(req)
    const cacheReq = this.cacheReq(req)
    const cacheRes = res
    const policy = new CFCachePolicy(cacheReq, cacheRes)

    if (!policy.storable() || policy.timeToLive() === 0) {
      return Promise.resolve(undefined)
    }

    // Request is cacheable so remove set-cookie header if present
    cacheRes.headers.delete('set-cookie')

    return new Promise((resolve, reject) => {
      this.cache.set(cacheKey, cacheRes, policy.timeToLive())
      resolve(undefined)
    })
  }

  async match (req, options = {}) {
    const cacheKey = this.cacheKey(req)

    return new Promise((resolve, reject) => {
      let cachedRes = this.cache.get(cacheKey)
      if (cachedRes !== undefined) {
        cachedRes = cachedRes.clone()
        cachedRes.headers.set('cf-cache-status', 'HIT')
      }

      resolve(cachedRes)
    })
  }

  async delete (req, options = {}) {
    const cacheKey = this.cacheKey(req)
    const cacheReq = this.cacheReq(req)

    if (cacheReq.method !== 'GET' || options.ignoreMethod) {
      return Promise.resolve(undefined)
    }

    return new Promise((resolve, reject) => {
      const cachedRes = this.cache.peek(cacheKey)
      if (cachedRes === undefined) {
        resolve(false)
      }

      this.cache.del(cacheKey)
      resolve(true)
    })
  }

  cacheKey (req) {
    var key = ''
    if (typeof req === 'string' || req instanceof String) {
      key = req
    } else {
      key = req.url
    }

    return key
  }

  cacheReq (req) {
    if (typeof req === 'string' || req instanceof String) {
      return new Request(req)
    }

    return req
  }
}

module.exports = CacheFactory
module.exports._Cache = Cache
