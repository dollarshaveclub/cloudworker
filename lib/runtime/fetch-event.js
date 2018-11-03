class FetchEvent {
  constructor (request, respondWithCb, waitUntilCb) {
    this.respondWith = respondWithCb
    this.waitUntil = waitUntilCb
    this.request = request
  }

  passThroughOnException () {

  }
}

module.exports.FetchEvent = FetchEvent
