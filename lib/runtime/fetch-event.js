class FetchEvent {
  constructor (type, init) {
    this.request = init.request
  }

  respondWith () {
    throw new Error('unimplemented')
  }

  waitUntil () {
    throw new Error('unimplemented')
  }

  passThroughOnException () {

  }
}

module.exports.FetchEvent = FetchEvent
