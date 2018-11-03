class Caches {
  static open (name) {
    return new Cache()
  }

  static default () {
    return new Cache()
  }
}

class Cache {
  async put (req, resp) {
    return Promise.resolve(undefined)
  }

  async match (request, options) {
    return Promise.resolve(undefined)
  }
  async delete (request, options) {
    return Promise.resolve(false)
  }
}

module.exports = Caches
