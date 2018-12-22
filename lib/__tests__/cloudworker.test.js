const Cloudworker = require('../cloudworker')
const runtime = require('../runtime')
const httpMocks = require('node-mocks-http')
const simpleScript = `addEventListener('fetch', event => {
  event.respondWith(new Response('hello', {status: 200}))
})
`
describe('cloudworker', () => {
  test('log does nothing if debug is false', async () => {
    const cw = new Cloudworker(simpleScript)
    global.console = {error: jest.fn(), log: jest.fn()}
    cw.logDebug('test')
    cw.logDebugError('test')
    expect(console.error).not.toBeCalled()
    expect(console.log).not.toBeCalled()
  })

  test('log if debug is true', () => {
    const cw = new Cloudworker(simpleScript, {debug: true})
    global.console = {error: jest.fn(), log: jest.fn()}
    cw.logDebug('test')
    cw.logDebugError('test')
    expect(console.error).toBeCalled()
    expect(console.log).toBeCalled()
  })

  test('pipe sends appropriate headers', async () => {
    const cw = new Cloudworker(simpleScript)
    const srcRes = new runtime.Response('world', {headers: {'content-length': '100', 'content-encoding': '200', other: 'value'}})
    const dstRes = httpMocks.createResponse()
    await cw.pipe(srcRes, dstRes)
    expect(dstRes.getHeader('other')).toEqual(['value'])
    expect(dstRes.getHeader('content-length')).toEqual(undefined)
    expect(dstRes.getHeader('content-encoding')).toEqual(undefined)
  })

  test('pipe sends headers with multiple values', async () => {
    const cw = new Cloudworker(simpleScript)
    const cookie1 = 'foo=value1'
    const cookie2 = 'bar=value2'

    // manually add multiple set-cookie headers
    // so runtime.Headers doesn't collapse
    // it into a comma separated string
    const headers = new runtime.Headers()
    headers.append('set-cookie', cookie1)
    headers.append('set-cookie', cookie2)

    const srcRes = new runtime.Response('world', {headers: headers})
    const dstRes = httpMocks.createResponse()
    await cw.pipe(srcRes, dstRes)
    expect(dstRes.getHeader('Set-Cookie')).toEqual([cookie1, cookie2])
  })

  test('pipe pipes string body', async () => {
    const cw = new Cloudworker(simpleScript)
    const srcRes = new runtime.Response('world')
    const dstRes = httpMocks.createResponse()
    await cw.pipe(srcRes, dstRes)
    expect(dstRes._getBuffer()).toEqual(Buffer.from('world', 'utf8'))
  })

  test('pipe pipes buffer body', async () => {
    const cw = new Cloudworker(simpleScript)
    const want = new Uint8Array([65])
    const srcRes = new runtime.Response(want)
    const dstRes = httpMocks.createResponse({eventEmitter: require('events').EventEmitter})
    expect.assertions(1)
    dstRes.on('end', () => {
      expect(dstRes._getBuffer().compare(want)).toEqual(0)
    })
    await cw.pipe(srcRes, dstRes)
  })

  test('pipe pipes stream body', done => {
    const cw = new Cloudworker(simpleScript)
    const want = new Uint8Array([66])
    const { readable, writable } = new runtime.TransformStream()
    const writer = writable.getWriter()
    writer.write(want).then(() => writer.close())
    const srcRes = new runtime.Response(readable)

    const dstRes = httpMocks.createResponse({eventEmitter: require('events').EventEmitter})
    dstRes.on('end', () => {
      expect(dstRes._getBuffer().compare(want)).toEqual(0)
      done()
    })

    cw.pipe(srcRes, dstRes)
  })
})
