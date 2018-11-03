const { FetchEvent } = require('../fetch-event')

describe('FetchEvent', () => {
  test('FetchEvent callbacks', () => {
    let respondWithCbSet = false
    let waitUntilCbSet = false
    const event = new FetchEvent({}, () => { respondWithCbSet = true }, () => { waitUntilCbSet = true })

    event.waitUntil()
    event.respondWith()

    expect(respondWithCbSet).toEqual(true)
    expect(waitUntilCbSet).toEqual(true)
  })
})
