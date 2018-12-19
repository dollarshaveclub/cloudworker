class StubCacheFactory {
  constructor () {
    Object.defineProperty(this, 'default', {
      value: new StubCache(),
      writable: false,
    })
  }

  open (name) {
    return new StubCache()
  }
}

class StubCache {
  async put (req, resp) {
    return undefined
  }

  async match (request, options) {
    return undefined
  }
  async delete (request, options) {
    return false
  }
}

module.exports = StubCacheFactory
module.exports._StubCache = StubCache
