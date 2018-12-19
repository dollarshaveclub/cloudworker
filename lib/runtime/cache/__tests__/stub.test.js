const StubCacheFactory = require('../stub')

describe('stub', () => {
  test('cache factory returns a stubbed cache', () => {
    const caches = new StubCacheFactory()
    const cacheOpen = caches.open('test')
    const cacheDefault = caches.default

    expect(cacheDefault).toBeInstanceOf(StubCacheFactory._StubCache)
    expect(cacheOpen).toBeInstanceOf(StubCacheFactory._StubCache)
  })

  test('cache methods return expected values', () => {
    const caches = new StubCacheFactory()
    const cache = caches.default

    expect(cache.put({}, {})).resolves.toBe(undefined)
    expect(cache.match({}, {})).resolves.toBe(undefined)
    expect(cache.delete({}, {})).resolves.toBe(false)
  })
})
