const CacheFactory = require('../cache')
const fetch = require('../../fetch')

describe('cache', () => {
  test('cache factory returns a cache', () => {
    const caches = new CacheFactory(false)
    const cacheOpen = caches.open('test')
    const cacheDefault = caches.default

    expect(cacheDefault).toBeInstanceOf(CacheFactory._Cache)
    expect(cacheOpen).toBeInstanceOf(CacheFactory._Cache)
  })

  test('cache basic put / match / delete', async () => {
    const caches = new CacheFactory(false)
    const cache = caches.default
    const req = new fetch.Request('https://www.dollarshaveclub.com/test')
    const res = new fetch.Response('testBody', {headers: {expires: 'Wed, 21 Oct 2920 07:28:00 GMT'}})
    const put = await cache.put(req, res.clone())
    let cached = await cache.match(req)

    const expectedCachedRes = res.clone()
    expectedCachedRes.headers.set('cf-cache-status', 'HIT')

    expect(put).toBe(undefined)
    expect(cached).toEqual(expectedCachedRes)

    const deleted = await cache.delete(req)
    cached = await cache.match(req)

    expect(deleted).toEqual(true)
    expect(cached).toBe(undefined)
  })

  test('cache clones matched response', async () => {
    const caches = new CacheFactory(false)
    const cache = caches.default
    const req = new fetch.Request('https://www.dollarshaveclub.com/test')
    const res = new fetch.Response('testBody', {headers: {expires: 'Wed, 21 Oct 2920 07:28:00 GMT'}})

    await cache.put(req, res.clone())
    const cached1 = await cache.match(req)
    const cached2 = await cache.match(req)

    const expectedCachedRes = res.clone()
    expectedCachedRes.headers.set('cf-cache-status', 'HIT')

    expect(cached1).toEqual(expectedCachedRes)
    expect(cached2).toEqual(expectedCachedRes)
    expect(cached2).not.toBe(cached1)
  })

  test('cache expires after max-age', async () => {
    const caches = new CacheFactory(false)
    const cache = caches.default
    const req = new fetch.Request('https://www.dollarshaveclub.com/test')
    const res = new fetch.Response('testBody', {headers: {'cache-control': 'max-age=1'}})
    const put = await cache.put(req, res.clone())
    expect(put).toBe(undefined)

    const expectedCachedRes = res.clone()
    expectedCachedRes.headers.set('cf-cache-status', 'HIT')

    const checkCache = async () => {
      const cached = await cache.match(req)
      expect(cached).toEqual(expectedCachedRes)
    }

    checkCache()

    for (let then = Date.now() + 500; then > Date.now();); // Spin for .5 seconds

    checkCache()

    for (let then = Date.now() + 510; then > Date.now();); // Spin for .51 seconds

    const cached = await cache.match(req)
    expect(cached).toBe(undefined)
  })

  test('cache expires after s-maxage', async () => {
    const caches = new CacheFactory(false)
    const cache = caches.default
    const req = new fetch.Request('https://www.dollarshaveclub.com/test')
    const res = new fetch.Response('testBody', {headers: {'cache-control': 'max-age=6000, s-maxage=2'}})

    const put = await cache.put(req, res.clone())
    let cached = await cache.match(req)

    const expectedCachedRes = res.clone()
    expectedCachedRes.headers.set('cf-cache-status', 'HIT')

    expect(put).toBe(undefined)
    expect(cached).toEqual(expectedCachedRes)

    for (let then = Date.now() + 2100; then > Date.now();); // Spin for 2.1 seconds

    cached = await cache.match(req)
    expect(cached).toBe(undefined)
  })

  test('cache does not cache private responses', async () => {
    const caches = new CacheFactory(false)
    const cache = caches.default

    const req = new fetch.Request('https://www.dollarshaveclub.com/test')
    const res = new fetch.Response('testBody', {headers: {'cache-control': 'private'}})

    const put = await cache.put(req, res.clone())
    expect(put).toBe(undefined)

    const cached = await cache.match(req)
    expect(cached).toEqual(undefined)
  })

  test('cache does not cache no-store responses', async () => {
    const caches = new CacheFactory(false)
    const cache = caches.default

    const req = new fetch.Request('https://www.dollarshaveclub.com/test')
    const res = new fetch.Response('testBody', {headers: {'cache-control': 'no-store'}})

    const put = await cache.put(req, res.clone())
    expect(put).toBe(undefined)

    const cached = await cache.match(req)
    expect(cached).toEqual(undefined)
  })

  test('cache does not cache no-cache responses', async () => {
    const caches = new CacheFactory(false)
    const cache = caches.default

    const req = new fetch.Request('https://www.dollarshaveclub.com/test')
    const res = new fetch.Response('testBody', {headers: {'cache-control': 'no-cache'}})

    const put = await cache.put(req, res.clone())
    expect(put).toBe(undefined)

    const cached = await cache.match(req)
    expect(cached).toEqual(undefined)
  })

  test('cache does not cache set-cookie responses', async () => {
    const caches = new CacheFactory(false)
    const cache = caches.default

    const req = new fetch.Request('https://www.dollarshaveclub.com/test')
    const res = new fetch.Response('testBody', {headers: {'set-cookie': 'blahblah'}})

    const put = await cache.put(req, res.clone())
    expect(put).toBe(undefined)

    const cached = await cache.match(req)
    expect(cached).toEqual(undefined)
  })

  test('cache caches set-cookie responses with private=set-cookie cache control', async () => {
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

    expect(cached).toEqual(expectedCachedRes)
  })
})
