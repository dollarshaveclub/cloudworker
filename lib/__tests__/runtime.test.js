const runtime = require('../runtime')

describe('runtime', () => {
  test('context allows overriding of properties via bindings', async () => {
    const dummyFactory = Symbol('dummy factory')
    const someMockFetch = Symbol('some mock fetch')
    const context = new runtime.Context(() => {}, dummyFactory, {fetch: someMockFetch})
    expect(context.fetch).toBe(someMockFetch)
  })

  test('context has expected properties', async () => {
    const expected = [
      'console',
      'addEventListener',
      'fetch',
      'Request',
      'Response',
      'Headers',
      'URL',
      'ReadableStream',
      'WritableStream',
      'TransformStream',
      'FetchEvent',
      'caches',
      'crypto',
      'TextDecoder',
      'TextEncoder',
      'atob',
      'btoa',
    ].sort()

    const dummyFactory = Symbol('dummy factory')
    const got = Object.getOwnPropertyNames(new runtime.Context(() => {}, dummyFactory)).sort()
    expect(got).toEqual(expected)
  })
})
