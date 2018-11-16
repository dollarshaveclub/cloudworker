const { Request, Response, Headers, freezeHeaders } = require('../fetch')
const { ReadableStream, TransformStream } = require('../stream')
const nodeStream = require('stream')

const shimFetch = require('../fetch').fetch
const fetch = require('jest-fetch-mock')

describe('fetch', () => {
  beforeEach(() => {
    fetch.resetMocks()
  })

  test('New Request ignores content-type header', () => {
    const someRequest = new Request('https://google.com', {method: 'Post', body: 'text', headers: {'content-type': 'test'}})
    expect(someRequest.headers.get('Content-Type')).not.toEqual('test')
  })

  test('Request clone returns new request', () => {
    const someRequest = new Request('https://google.com')
    const cloned = someRequest.clone()
    // not same object
    expect(cloned).not.toBe(someRequest)
    // but same fields
    expect(cloned).toEqual(someRequest)
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

  test('Response has redirect', () => {
    const redirect = Response.redirect('https://google.com', 301)

    expect(redirect.body).toEqual('')
    expect(redirect.status).toEqual(301)
    expect(redirect.headers.get('Location')).toEqual('https://google.com')
  })

  test('Response has default redirect status of 302', () => {
    const redirect = Response.redirect('https://google.com')
    expect(redirect.status).toEqual(302)
  })

  test('Response clone returns new response', () => {
    const someResponse = Response.redirect('https://google.com', 302)
    const cloned = someResponse.clone()
    // not same object
    expect(cloned).not.toBe(someResponse)
    // but same fields
    expect(cloned).toEqual(someResponse)
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

  test('Response wraps ReadableStream', () => {
    const res = new Response(new ReadableStream())
    expect(res.body).toBeInstanceOf(nodeStream.Stream)
  })

  test('Response throws on write of non-TypedArray on stream', (done) => {
    const { readable, writable } = new TransformStream()
    const writer = writable.getWriter()
    writer.write(16).then(() => writer.close())
    const res = new Response(readable)
    res.body.on('error', (error) => {
      expect(error).toBeInstanceOf(TypeError)
      done()
    })
  })

  test('fetch freezes response headers', async () => {
    fetch.mockResponse('', {headers: new Headers()})
    const resp = await shimFetch('https://www.google.com')
    expect(() => { resp.headers.set('test', 'test') }).toThrowError()
  })

  test('fetch deletes host header from header object', async () => {
    fetch.mockResponse('')
    await shimFetch('https://www.google.com', {headers: new Headers({host: 'test.com'})})

    const headers = fetch.mock.calls[0][0].headers || fetch.mock.calls[0][1].headers || {}
    expect(new Headers(headers).get('host')).toBeNull()
  })

  test('fetch deletes host header from object', async () => {
    fetch.mockResponse('')
    await shimFetch('https://www.google.com', {headers: {Host: 'test.com'}})

    const headers = fetch.mock.calls[0][0].headers || fetch.mock.calls[0][1].headers || {}
    expect(new Headers(headers).get('host')).toBeNull()
  })

  test('fetch deletes host header from Request with Header object', async () => {
    fetch.mockResponse('')
    await shimFetch(new Request('https://www.google.com', {headers: new Headers({host: 'test.com'})}))

    const headers = fetch.mock.calls[0][0].headers || fetch.mock.calls[0][1].headers || {}
    expect(new Headers(headers).get('host')).toBeNull()
  })

  test('fetch deletes host header from Request with object', async () => {
    fetch.mockResponse('')
    await shimFetch(new Request('https://www.google.com', {headers: {host: 'test.com'}}))

    const headers = fetch.mock.calls[0][0].headers || fetch.mock.calls[0][1].headers || {}
    expect(new Headers(headers).get('host')).toBeNull()
  })
})
