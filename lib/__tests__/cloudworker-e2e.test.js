const utils = require('../utils')
const wasm = require('../wasm')
const Cloudworker = require('../cloudworker')
const { KeyValueStore } = require('../kv')
const axios = require('axios')
const path = require('path')
const http = require('http')
const stream = require('stream')
const defaultAxiosOpts = {validateStatus: () => true}

describe('cloudworker-e2e', async () => {
  test('simple 200', async () => {
    const script = `
      addEventListener('fetch', event => {
        event.respondWith(new Response('hello', {status: 200}))
      })
    `
    const server = new Cloudworker(script).listen(8080)
    const res = await axios.get('http://localhost:8080', defaultAxiosOpts)
    expect(res.status).toEqual(200)
    expect(res.data).toEqual('hello')
    await server.close()
  })

  test('simple non-200', async () => {
    const script = `
      addEventListener('fetch', event => {
        event.respondWith(new Response('goodbye', {status: 400}))
      })
    `
    const server = new Cloudworker(script).listen(8080)
    const res = await axios.get('http://localhost:8080', defaultAxiosOpts)
    expect(res.status).toEqual(400)
    expect(res.data).toEqual('goodbye')
    await server.close()
  })

  test('simple streaming response', async () => {
    const script = `
      addEventListener('fetch', event => {
        const want = new Uint16Array([66])
        const { readable, writable } = new TransformStream()
        const writer = writable.getWriter()
        writer.write(new Uint16Array([66])).then(() => writer.close())
        event.respondWith(new Response(readable))
      })
    `
    const server = new Cloudworker(script).listen(8080)
    const res = await axios.get('http://localhost:8080', defaultAxiosOpts)
    expect(res.status).toEqual(200)
    expect(res.data).toEqual('B') // 66
    expect(res.headers['transfer-encoding'].includes('chunked')).toEqual(true)
    await server.close()
  })

  test('simple post', async () => {
    const script = `
      addEventListener('fetch', async event => {
        const incoming = event.request
        const body = await incoming.text()
        event.respondWith(new Response(body))
      })
    `

    const server = new Cloudworker(script).listen(8080)
    const res = await axios.post('http://localhost:8080', 'testdata', defaultAxiosOpts)
    expect(res.data).toEqual('testdata')

    await server.close()
  })

  test('simple post not chunked', async () => {
    const script = `
      addEventListener('fetch', async event => {
        const incoming = event.request
        const upstream = new Request('http://localhost:8081/', { body: incoming.body, method: incoming.method })
        const resp = await fetch(upstream)
        event.respondWith(resp)
      })
    `
    const server = new Cloudworker(script).listen(8080)
    const upstream = http.createServer((req, res) => {
      const te = req.headers['transfer-encoding'] || ''
      expect(te.includes('chunked')).toEqual(false)
      res.end()
    }).listen(8081)

    expect.assertions(1)
    await axios.post('http://localhost:8080', 'testdata', defaultAxiosOpts)
    await server.close()
    await upstream.close()
  })

  test('simple post chunked', async () => {
    const script = `
      addEventListener('fetch', async event => {
        const incoming = event.request
        console.log(new Map(incoming.headers))
        const upstream = new Request('http://localhost:8081/', { body: incoming.body, method: incoming.method })
        const resp = await fetch(upstream)
        event.respondWith(resp)
      })
    `

    const server = new Cloudworker(script).listen(8080)
    const upstream = http.createServer(async (req, res) => {
      const te = req.headers['transfer-encoding'] || ''
      expect(te.includes('chunked')).toEqual(true)
      res.end()
    }).listen(8081)

    expect.assertions(1)

    var body = new stream.Readable()
    body.push('test-data')
    body.push(null)

    await axios.post('http://localhost:8080', body, defaultAxiosOpts)
    await server.close()
    await upstream.close()
  })

  test('wasm', async () => {
    const script = utils.read(path.join(__dirname, 'fixtures/worker-wasm-simple.js'))
    const bindings = {Wasm: await wasm.loadPath(path.join(__dirname, 'fixtures/simple.wasm'))}
    const server = new Cloudworker(script, {bindings: bindings}).listen(8080)
    const res = await axios.get('http://localhost:8080', defaultAxiosOpts)
    expect(res.status).toEqual(200)
    expect(res.data).toEqual(42)
    await server.close()
  })

  test('kv', async () => {
    const script = utils.read(path.join(__dirname, 'fixtures/worker-kv-simple.js'))
    const store = new KeyValueStore()
    store.put('hello', 'world')
    const bindings = {TestNamespace: store}
    const server = new Cloudworker(script, {bindings: bindings}).listen(8080)
    const res = await axios.get('http://localhost:8080', defaultAxiosOpts)
    expect(res.status).toEqual(200)
    expect(res.data).toEqual('world')
    await server.close()
  })

  test('streams', async () => {
    const script = utils.read(path.join(__dirname, 'fixtures/worker-streams.js'))
    const server = new Cloudworker(script).listen(8080)
    const res = await axios.get('http://localhost:8080', defaultAxiosOpts)
    expect(res.status).toEqual(200)
    expect(res.data).toEqual('B')
    await server.close()
  })
})
