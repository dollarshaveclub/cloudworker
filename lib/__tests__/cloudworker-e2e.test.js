const utils = require('../utils')
const wasm = require('../wasm')
const Cloudworker = require('../cloudworker')
const { KeyValueStore } = require('../kv')
const axios = require('axios')
const path = require('path')

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
