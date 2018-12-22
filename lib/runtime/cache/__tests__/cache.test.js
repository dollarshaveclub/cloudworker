const CacheFactory = require('../cache')
const fetch = require('../../fetch')

const compareResponses = async (expected, actual) => {
  const expectBody = await expected.buffer()
  const actualBody = await actual.buffer()

  // not same object
  expect(expected).not.toBe(actual)

  // but same fields
  expect(expected.status).toEqual(actual.status)
  expect(expectBody).toEqual(actualBody)
}

describe('cache', () => {
  test('cache factory returns a cache', () => {
    const caches = new CacheFactory(false)
    const cacheOpen = caches.open('test')
    const cacheDefault = caches.default

    expect(cacheDefault).toBeInstanceOf(CacheFactory._Cache)
    expect(cacheOpen).toBeInstanceOf(CacheFactory._Cache)
  })

  test('cache basic put / match / delete', async (done) => {
    const caches = new CacheFactory(false)
    const cache = caches.default
    const req = new fetch.Request('https://www.dollarshaveclub.com/test')
    const res = new fetch.Response('testBody', {headers: {expires: 'Wed, 21 Oct 2920 07:28:00 GMT'}})
    const put = await cache.put(req, res.clone())
    let cached = await cache.match(req)

    const expectedCachedRes = res.clone()
    expectedCachedRes.headers.set('cf-cache-status', 'HIT')

    expect(put).toBe(undefined)
    await compareResponses(expectedCachedRes, cached)

    const deleted = await cache.delete(req)
    cached = await cache.match(req)

    expect(deleted).toEqual(true)
    expect(cached).toBe(undefined)
    done()
  })

  test('cache clones matched response', async (done) => {
    const caches = new CacheFactory(false)
    const cache = caches.default
    const req = new fetch.Request('https://www.dollarshaveclub.com/test')
    const res = new fetch.Response('testBody', {headers: {expires: 'Wed, 21 Oct 2920 07:28:00 GMT'}})

    await cache.put(req, res.clone())
    const cached1 = await cache.match(req)
    const cached2 = await cache.match(req)

    const expectedCachedRes1 = res.clone()
    const expectedCachedRes2 = res.clone()
    expectedCachedRes1.headers.set('cf-cache-status', 'HIT')
    expectedCachedRes2.headers.set('cf-cache-status', 'HIT')

    await compareResponses(expectedCachedRes1, cached1)
    await compareResponses(expectedCachedRes2, cached2)

    expect(cached2).not.toBe(cached1)
    done()
  })

  test('cache expires after max-age', async (done) => {
    const caches = new CacheFactory(false)
    const cache = caches.default
    const req = new fetch.Request('https://www.dollarshaveclub.com/test')
    const res = new fetch.Response('testBody', {headers: {'cache-control': 'max-age=1'}})
    const put = await cache.put(req, res.clone())
    expect(put).toBe(undefined)

    const expectedCachedRes = res.clone()
    expectedCachedRes.headers.set('cf-cache-status', 'HIT')

    const checkCache = async (done) => {
      const expected = res.clone()
      const cached = await cache.match(req)
      await compareResponses(expected, cached)
    }

    await checkCache()

    for (let then = Date.now() + 500; then > Date.now();); // Spin for .5 seconds

    await checkCache()

    for (let then = Date.now() + 510; then > Date.now();); // Spin for .51 seconds

    const cached = await cache.match(req)
    expect(cached).toBe(undefined)
    done()
  })

  test('cache expires after s-maxage', async (done) => {
    const caches = new CacheFactory(false)
    const cache = caches.default
    const req = new fetch.Request('https://www.dollarshaveclub.com/test')
    const res = new fetch.Response('testBody', {headers: {'cache-control': 'max-age=6000, s-maxage=2'}})

    const put = await cache.put(req, res.clone())
    let cached = await cache.match(req)

    const expectedCachedRes = res.clone()
    expectedCachedRes.headers.set('cf-cache-status', 'HIT')

    expect(put).toBe(undefined)
    await compareResponses(expectedCachedRes, cached)

    for (let then = Date.now() + 2100; then > Date.now();); // Spin for 2.1 seconds

    cached = await cache.match(req)
    expect(cached).toBe(undefined)
    done()
  })

  test('cache does not cache private responses', async (done) => {
    const caches = new CacheFactory(false)
    const cache = caches.default

    const req = new fetch.Request('https://www.dollarshaveclub.com/test')
    const res = new fetch.Response('testBody', {headers: {'cache-control': 'private'}})

    const put = await cache.put(req, res.clone())
    expect(put).toBe(undefined)

    const cached = await cache.match(req)
    expect(cached).toEqual(undefined)
    done()
  })

  test('cache does not cache no-store responses', async (done) => {
    const caches = new CacheFactory(false)
    const cache = caches.default

    const req = new fetch.Request('https://www.dollarshaveclub.com/test')
    const res = new fetch.Response('testBody', {headers: {'cache-control': 'no-store'}})

    const put = await cache.put(req, res.clone())
    expect(put).toBe(undefined)

    const cached = await cache.match(req)
    expect(cached).toEqual(undefined)
    done()
  })

  test('cache does not cache no-cache responses', async (done) => {
    const caches = new CacheFactory(false)
    const cache = caches.default

    const req = new fetch.Request('https://www.dollarshaveclub.com/test')
    const res = new fetch.Response('testBody', {headers: {'cache-control': 'no-cache'}})

    const put = await cache.put(req, res.clone())
    expect(put).toBe(undefined)

    const cached = await cache.match(req)
    expect(cached).toEqual(undefined)
    done()
  })

  test('cache does not cache set-cookie responses', async (done) => {
    const caches = new CacheFactory(false)
    const cache = caches.default

    const req = new fetch.Request('https://www.dollarshaveclub.com/test')
    const res = new fetch.Response('testBody', {headers: {'set-cookie': 'blahblah'}})

    const put = await cache.put(req, res.clone())
    expect(put).toBe(undefined)

    const cached = await cache.match(req)
    expect(cached).toEqual(undefined)
    done()
  })

  test('cache caches set-cookie responses with private=set-cookie cache control', async (done) => {
    const caches = new CacheFactory(false)
    const cache = caches.default

    const req = new fetch.Request('https://www.dollarshaveclub.com/test')
    const res = new fetch.Response('testBody', {headers: {'set-cookie': 'blahblah', 'cache-control': 'max-age=60, private=set-cookie'}})

    const put = await cache.put(req, res.clone())
    expect(put).toBe(undefined)

    const cached = await cache.match(req)

    const expectedCachedRes = res.clone()
    expectedCachedRes.headers.set('cf-cache-status', 'HIT')
    expectedCachedRes.headers.delete('set-cookie')

    await compareResponses(expectedCachedRes, cached)
    done()
  })
})
