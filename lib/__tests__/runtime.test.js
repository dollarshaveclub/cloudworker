const runtime = require('../runtime')

describe('runtime', () => {
  test('context allows overriding of properties via bindings', async () => {
    const dummyFactory = Symbol('dummy factory')
    const someMockFetch = Symbol('some mock fetch')
    const context = new runtime.Context(() => {}, dummyFactory, {fetch: someMockFetch})
    expect(context.fetch).toBe(someMockFetch)
  })
})
