const caches = require('../caches')

describe('caches', () => {
  test('caches return a new cache', () => {
    const cacheOpen = caches.open('test')
    const cacheDefault = caches.default()

    expect(cacheOpen).toBeDefined()
    expect(cacheDefault).toBeDefined()
  })

  test('cache methods return expected values', () => {
    const cache = caches.default()

    expect(cache.put({}, {})).resolves.toBe(undefined)
    expect(cache.match({}, {})).resolves.toBe(undefined)
    expect(cache.delete({}, {})).resolves.toBe(false)
  })
})
