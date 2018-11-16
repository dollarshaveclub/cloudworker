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

  test('pipe sends appropriate headers', () => {
    const cw = new Cloudworker(simpleScript)
    const srcRes = new runtime.Response('world', {headers: {'content-length': '100', 'content-encoding': '200', other: 'value'}})
    const dstRes = httpMocks.createResponse()
    cw.pipe(srcRes, dstRes)
    expect(dstRes.getHeader('other')).toEqual('value')
    expect(dstRes.getHeader('content-length')).toEqual(undefined)
    expect(dstRes.getHeader('content-encoding')).toEqual(undefined)
  })

  test('pipe pipes string body', () => {
    const cw = new Cloudworker(simpleScript)
    const srcRes = new runtime.Response('world')
    const dstRes = httpMocks.createResponse()
    cw.pipe(srcRes, dstRes)
    expect(dstRes._getData()).toEqual('world')
  })

  test('pipe pipes buffer body', () => {
    const cw = new Cloudworker(simpleScript)
    const want = new Uint8Array([65])
    const srcRes = new runtime.Response(want)
    const dstRes = httpMocks.createResponse({eventEmitter: require('events').EventEmitter})
    expect.assertions(1)
    dstRes.on('end', () => {
      expect(dstRes._getBuffer().compare(want)).toEqual(0)
    })
    cw.pipe(srcRes, dstRes)
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
