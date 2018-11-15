class FetchEvent {
  constructor (request, respondWithCb, waitUntilCb, onErrorCb) {
    this.respondWith = respondWithCb
    this.waitUntil = waitUntilCb
    this.request = request
    this.onError = onErrorCb
  }

  passThroughOnException () {

  }
}

module.exports.FetchEvent = FetchEvent
