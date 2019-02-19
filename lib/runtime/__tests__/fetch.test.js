const fetchMock = require('jest-fetch-mock')
const fetch = require('@dollarshaveclub/node-fetch')

// Make fetch.Request, fetch.Response, etc etc available
// on the mock. There's probably a better way.
Object.keys(fetch).forEach(key => {
  fetchMock[key] = fetch[key]
})

jest.doMock('@dollarshaveclub/node-fetch', () => {
  // Make fetch.Request, fetch.Response, etc etc available
  // on the mock. There's probably a better way.
  Object.keys(fetch).forEach(key => {
    fetchMock[key] = fetch[key]
  })

  return fetchMock
})

const { Request, Response, Headers, freezeHeaders, bindCfProperty } = require('../fetch')

const shimFetch = require('../fetch').fetch

describe('fetch', () => {
  beforeEach(() => {
    fetchMock.resetMocks()
  })

  test('Request clone returns new request', () => {
    const someRequest = new Request('https://google.com')
    const cloned = someRequest.clone()
    // not same object
    expect(cloned).not.toBe(someRequest)
    // but same fields
    expect(cloned).toEqual(someRequest)
    // is a ShimRequest
    expect(cloned.constructor).toEqual(someRequest.constructor)
  })

  test('Request clone freezes headers if cloned headers frozen', () => {
    const someRequest = new Request('https://google.com')
    freezeHeaders(someRequest.headers)
    const cloned = someRequest.clone()
    expect(() => { cloned.headers.set('test', 'test') }).toThrowError()
  })

  test('Request clone does not freeze headers if cloned headers were not frozen', () => {
    const someRequest = new Request('https://google.com')
    const cloned = someRequest.clone()
    expect(() => { cloned.headers.set('test', 'test') }).not.toThrowError()
  })

  test('Response has redirect', async () => {
    const redirect = Response.redirect('https://google.com', 301)

    expect(await redirect.text()).toEqual('')
    expect(redirect.status).toEqual(301)
    expect(redirect.headers.get('Location')).toEqual('https://google.com')
  })

  test('Response has default redirect status of 302', () => {
    const redirect = Response.redirect('https://google.com')
    expect(redirect.status).toEqual(302)
  })

  test('Response clone returns new response', async () => {
    const someResponse = Response.redirect('https://google.com', 302)
    const cloned = someResponse.clone()

    const expectBody = await someResponse.buffer()
    const cloneBody = await cloned.buffer()

    // not same object
    expect(cloned).not.toBe(someResponse)

    // but same fields
    expect(cloned.status).toEqual(someResponse.status)
    expect(cloneBody).toEqual(expectBody)

    // is same type
    expect(cloned.constructor).toEqual(someResponse.constructor)
  })

  test('Response clone freezes headers if cloned headers frozen', () => {
    const someResponse = Response.redirect('https://google.com', 302)
    freezeHeaders(someResponse.headers)
    const cloned = someResponse.clone()
    expect(() => { cloned.headers.set('test', 'test') }).toThrowError()
  })

  test('Response clone does not freeze headers if cloned headers were not frozen', () => {
    const someResponse = Response.redirect('https://google.com', 302)
    const cloned = someResponse.clone()
    expect(() => { cloned.headers.set('test', 'test') }).not.toThrowError()
  })

  test('fetch freezes response headers', async () => {
    fetchMock.mockResponse('', {headers: new Headers()})
    const resp = await shimFetch('https://www.google.com')
    expect(() => { resp.headers.set('test', 'test') }).toThrowError()
  })

  test('fetch deletes host header from header object', async () => {
    fetchMock.mockResponse('')
    await shimFetch('https://www.google.com', {headers: new Headers({host: 'test.com'})})

    const headers = fetchMock.mock.calls[0][0].headers || fetchMock.mock.calls[0][1].headers || {}
    expect(new Headers(headers).get('host')).toBeNull()
  })

  test('fetch deletes host header from object', async () => {
    fetchMock.mockResponse('')
    await shimFetch('https://www.google.com', {headers: {Host: 'test.com'}})

    const headers = fetchMock.mock.calls[0][0].headers || fetchMock.mock.calls[0][1].headers || {}
    expect(new Headers(headers).get('host')).toBeNull()
  })

  test('fetch deletes host header from Request with Header object', async () => {
    fetchMock.mockResponse('')
    await shimFetch(new Request('https://www.google.com', {headers: new Headers({host: 'test.com'})}))

    const headers = fetchMock.mock.calls[0][0].headers || fetchMock.mock.calls[0][1].headers || {}
    expect(new Headers(headers).get('host')).toBeNull()
  })

  test('fetch deletes host header from Request with object', async () => {
    fetchMock.mockResponse('')
    await shimFetch(new Request('https://www.google.com', {headers: {host: 'test.com'}}))

    const headers = fetchMock.mock.calls[0][0].headers || fetchMock.mock.calls[0][1].headers || {}
    expect(new Headers(headers).get('host')).toBeNull()
  })

  test('no cf property on Request', () => {
    const someRequest = new Request('https://google.com')
    expect(someRequest.cf).toBeUndefined()
  })

  test('bind cf property', () => {
    const someRequest = new Request('https://google.com')
    bindCfProperty(someRequest)
    expect(someRequest.cf.tlsVersion).toEqual('TLSv1.2')
    expect(someRequest.cf.tlsCipher).toEqual('ECDHE-ECDSA-CHACHA20-POLY1305')
    expect(someRequest.cf.country).toEqual('US')
    expect(someRequest.cf.colo).toEqual('LAX')
  })

  test('cf property preserved across clone', () => {
    const someRequest = new Request('https://google.com')
    bindCfProperty(someRequest)
    const cloned = someRequest.clone()
    expect(cloned.cf.tlsVersion).toEqual('TLSv1.2')
    expect(cloned.cf.tlsCipher).toEqual('ECDHE-ECDSA-CHACHA20-POLY1305')
    expect(cloned.cf.country).toEqual('US')
    expect(cloned.cf.colo).toEqual('LAX')
  })
})
