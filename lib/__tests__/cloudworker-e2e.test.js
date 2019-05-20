const utils = require('../utils')
const wasm = require('../wasm')
const Cloudworker = require('../cloudworker')
const { KeyValueStore } = require('../kv')
const axios = require('axios')
const path = require('path')
const http = require('http')
const defaultAxiosOpts = {validateStatus: () => true}

describe('cloudworker-e2e', async () => {
  test('simple 200', async (cb) => {
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
    cb()
  })

  test('simple non-200', async (cb) => {
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
    cb()
  })

  test('simple streaming response', async (cb) => {
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
    cb()
  })

  test('simple post', async (cb) => {
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
    cb()
  })

  test('simple post not chunked', async (cb) => {
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

    expect.assertions()
    const res = await axios.post('http://localhost:8080', 'testdata', defaultAxiosOpts)
    expect(res.status).toEqual(200)

    await server.close()
    await upstream.close()
    cb()
  })

  test('simple upstream response', async (cb) => {
    const script = `
      addEventListener('fetch', async event => {
        const incoming = event.request
        const upstream = new Request('http://localhost:8081/')
        const resp = await fetch(upstream)
        event.respondWith(resp)
      })
    `
    const server = new Cloudworker(script).listen(8080)
    const upstream = http.createServer((req, res) => {
      res.writeHead(404)
      res.write('test of upstream non-200 status')
      res.end()
    }).listen(8081)

    expect.assertions(2)
    const res = await axios.get('http://localhost:8080', defaultAxiosOpts)
    expect(res.status).toEqual(404)
    expect(res.data).toEqual('test of upstream non-200 status')

    await server.close()
    await upstream.close()
    cb()
  })

  test('cache', async (cb) => {
    const script = utils.read(path.join(__dirname, 'fixtures/cache-simple.js'))
    const server = new Cloudworker(script, {enableCache: true}).listen(8080)

    await axios.get('http://localhost:8080', defaultAxiosOpts)

    const check = async () => {
      const res = await axios.get('http://localhost:8080', defaultAxiosOpts)
      expect(res.status).toEqual(200)
      expect(res.data).toEqual('hello')
      expect(res.headers['cf-cache-status']).toEqual('HIT')
    }

    await check() // Make sure we can read it multiple times from the cache
    await check()
    await check()

    for (let then = Date.now() + 1100; then > Date.now();); // Spin for 1.1 seconds

    const res = await axios.get('http://localhost:8080', defaultAxiosOpts)
    expect(res.status).toEqual(200)
    expect(res.data).toEqual('hello')
    expect(res.headers['cf-cache-status']).toBeUndefined()

    await server.close()
    cb()
  })

  test('wasm', async (cb) => {
    const script = utils.read(path.join(__dirname, 'fixtures/worker-wasm-simple.js'))
    const bindings = {Wasm: await wasm.loadPath(path.join(__dirname, 'fixtures/simple.wasm'))}
    const server = new Cloudworker(script, {bindings: bindings}).listen(8080)
    const res = await axios.get('http://localhost:8080', defaultAxiosOpts)
    expect(res.status).toEqual(200)
    expect(res.data).toEqual(42)
    await server.close()
    cb()
  })

  test('kv', async (cb) => {
    const script = utils.read(path.join(__dirname, 'fixtures/worker-kv-simple.js'))
    const store = new KeyValueStore()
    store.put('hello', 'world')
    const bindings = {TestNamespace: store}
    const server = new Cloudworker(script, {bindings: bindings}).listen(8080)
    const res = await axios.get('http://localhost:8080', defaultAxiosOpts)
    expect(res.status).toEqual(200)
    expect(res.data).toEqual('world')
    await server.close()
    cb()
  })

  test('streams', async (cb) => {
    const script = utils.read(path.join(__dirname, 'fixtures/worker-streams.js'))
    const server = new Cloudworker(script).listen(8080)
    const res = await axios({method: 'get', url: 'http://localhost:8080', responseType: 'arraybuffer'})
    expect(res.status).toEqual(200)
    expect(Buffer.from(res.data)).toEqual(Buffer.from(new Uint16Array([10, 20])))
    await server.close()
    cb()
  })

  test('post upstream and echo response using streams', async (cb) => {
    const script = utils.read(path.join(__dirname, 'fixtures/worker-streams-cf.js'))
    const server = new Cloudworker(script).listen(8080)

    let postedBody = ''
    const upstream = http.createServer((req, res) => {
      req.on('data', chunk => {
        postedBody += chunk.toString()
        res.write(postedBody)
      })
      req.on('end', () => {
        res.end()
      })
    }).listen(8081)

    expect.assertions(3)
    const expectedBody = 'testdata'
    const res = await axios.post('http://localhost:8080', 'testdata', defaultAxiosOpts)
    expect(postedBody).toEqual(expectedBody)
    expect(res.status).toEqual(200)
    expect(res.data).toEqual(expectedBody)

    await server.close()
    await upstream.close()
    cb()
  })

  test('github issue 32', async (cb) => {
    const script = utils.read(path.join(__dirname, 'fixtures/github-issue-32.js'))
    const server = new Cloudworker(script).listen(8080)
    const res = await axios.get('http://localhost:8080', defaultAxiosOpts)
    expect(res.status).toEqual(200)
    await server.close()
    cb()
  })

  test('github issue 33', async (cb) => {
    const script = utils.read(path.join(__dirname, 'fixtures/github-issue-33.js'))
    const server = new Cloudworker(script).listen(8080)
    const res = await axios.get('http://localhost:8080', defaultAxiosOpts)
    expect(res.status).toEqual(200)
    await server.close()
    cb()
  })

  test('simple decode base64', async (cb) => {
    const script = `
      addEventListener('fetch', event => {
        event.respondWith(new Response(atob('SGVsbG8gV29ybGQh'), {status: 200}))
      })
    `
    const server = new Cloudworker(script).listen(8080)
    const res = await axios.get('http://localhost:8080', defaultAxiosOpts)
    expect(res.status).toEqual(200)
    expect(res.data).toEqual('Hello World!')
    await server.close()
    cb()
  })

  test('simple encode base64', async (cb) => {
    const script = `
      addEventListener('fetch', event => {
        event.respondWith(new Response(btoa('Hello World!'), {status: 200}))
      })
    `
    const server = new Cloudworker(script).listen(8080)
    const res = await axios.get('http://localhost:8080', defaultAxiosOpts)
    expect(res.status).toEqual(200)
    expect(res.data).toEqual('SGVsbG8gV29ybGQh')
    await server.close()
    cb()
  })

  test('github issue 41', async cb => {
    const script = `
      addEventListener('fetch', async event => {
        const response = await fetch("https://example.com")
        event.respondWith(new Response(response))
      })
    `
    const customFetch = () => Promise.resolve('mocked response')
    const server = new Cloudworker(script, {
      bindings: { fetch: customFetch },
    }).listen(8080)
    const res = await axios.get('http://localhost:8080', defaultAxiosOpts)
    expect(res.data).toEqual('mocked response')
    await server.close()
    cb()
  })

  test('simple text encoder', async (cb) => {
    const script = `
      addEventListener('fetch', event => {
        const encoder = new TextEncoder()
        const { readable, writable } = new TransformStream()
        const writer = writable.getWriter()
        writer.write(encoder.encode('hello')).then(() => writer.close())
        event.respondWith(new Response(readable, {status: 200}))
      })
    `
    const server = new Cloudworker(script).listen(8080)
    const res = await axios.get('http://localhost:8080', defaultAxiosOpts)
    expect(res.status).toEqual(200)
    expect(res.data).toEqual('hello')
    await server.close()
    cb()
  })

  test('simple text encoder and decoder', async (cb) => {
    const script = `
      addEventListener('fetch', event => {
        const helloBytes = new Uint8Array([104, 101, 108, 108, 111])
        const decoder = new TextDecoder()
        const { readable, writable } = new TransformStream()
        const writer = writable.getWriter()
        writer.write(new TextEncoder().encode(decoder.decode(helloBytes))).then(() => writer.close())
        event.respondWith(new Response(readable, {status: 200}))
      })
    `
    const server = new Cloudworker(script).listen(8080)
    const res = await axios.get('http://localhost:8080', defaultAxiosOpts)
    expect(res.status).toEqual(200)
    expect(res.data).toEqual('hello')
    await server.close()
    cb()
  })

  test('utf-8 decoder can be specified', async (cb) => {
    const script = `
      addEventListener('fetch', event => {
        const euroSymbol = new Uint8Array([226, 130, 172])
        const decoder = new TextDecoder()
        const utfDecoder = new TextDecoder('utf-8')
        const sameDecodedValues = (decoder.decode(euroSymbol)) === (utfDecoder.decode(euroSymbol))
        const { readable, writable } = new TransformStream()
        const writer = writable.getWriter()
        writer.write(new TextEncoder().encode(sameDecodedValues)).then(() => writer.close())
        event.respondWith(new Response(readable, {status: 200}))
      })
    `
    const server = new Cloudworker(script).listen(8080)
    const res = await axios.get('http://localhost:8080', defaultAxiosOpts)
    expect(res.status).toEqual(200)
    expect(res.data).toEqual(true)
    await server.close()
    cb()
  })

  test('simple sha256 encode', async (cb) => {
    const script = utils.read(path.join(__dirname, 'fixtures/sha256-encode.js'))
    const server = new Cloudworker(script).listen(8080)
    const res = await axios.get('http://localhost:8080', defaultAxiosOpts)
    expect(res.status).toEqual(200)
    // taken from `echo -n "hello" | shasum -a 256`
    expect(res.data).toEqual('2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824')
    await server.close()
    cb()
  })

  test('simple md5 encode', async (cb) => {
    const script = utils.read(path.join(__dirname, 'fixtures/md5-encode.js'))
    const server = new Cloudworker(script).listen(8080)
    const res = await axios.get('http://localhost:8080', defaultAxiosOpts)
    expect(res.status).toEqual(200)
    // taken from `echo -n "hello" | md5`
    expect(res.data).toEqual('5d41402abc4b2a76b9719d911017c592')
    await server.close()
    cb()
  })

  test('simple hmac sign', async (cb) => {
    const script = utils.read(path.join(__dirname, 'fixtures/hmac-sign.js'))
    const server = new Cloudworker(script).listen(8080)
    const res = await axios.get('http://localhost:8080/', defaultAxiosOpts)
    expect(res.status).toEqual(200)
    expect(res.data).toEqual('http://localhost:8080/?mac=ae0342a9b989d76cfc457439f615ed72651ba7bce1994361621a003f6ade5508&expiry=1362078000000')
    await server.close()
    cb()
  })

  test('simple hmac verify', async (cb) => {
    const script = utils.read(path.join(__dirname, 'fixtures/hmac-verify.js'))
    const server = new Cloudworker(script).listen(8080)
    const res = await axios.get('http://localhost:8080/verify/bob?mac=ae0342a9b989d76cfc457439f615ed72651ba7bce1994361621a003f6ade5508&expiry=1362078000000', defaultAxiosOpts)
    expect(res.status).toEqual(403)
    expect(res.data).toEqual('URL expired')
    await server.close()
    cb()
  })

  test('test cloudflare generate and verify recipes', async (cb) => {
    const cf_verify_script = utils.read(path.join(__dirname, 'fixtures/cf-verify.js'))
    const cf_generate_script = utils.read(path.join(__dirname, 'fixtures/cf-generate.js'))
    const server = new Cloudworker(cf_generate_script).listen(8080)
    const res = await axios.get('http://localhost:8080/generate/bob', defaultAxiosOpts)
    expect(res.status).toEqual(200)
    const verifyUrl = res.data
    await server.close()

    const server2 = new Cloudworker(cf_verify_script).listen(8080)
    const verifiedRes = await axios.get(verifyUrl, defaultAxiosOpts)
    expect(verifiedRes.status).toEqual(200)
    expect(verifiedRes.data).toEqual(true)

    await server2.close()
    cb()
  })

  test('Request cf property', async (cb) => {
    const script = `
      addEventListener('fetch', event => {
        const req = event.request
        const cloned = req.clone()
        const resp = new Response('', {
        headers: {
          'x-tlsVersion': cloned.cf.tlsVersion,
          'x-tlsCipher': cloned.cf.tlsCipher,
          'x-country': cloned.cf.country,
          'x-colo': cloned.cf.colo,
          }
        })
        event.respondWith(resp)
      })
    `
    const server = new Cloudworker(script).listen(8080)
    const res = await axios.get('http://localhost:8080', defaultAxiosOpts)
    expect(res.headers['x-tlsversion']).toEqual('TLSv1.2')
    expect(res.headers['x-tlscipher']).toEqual('ECDHE-ECDSA-CHACHA20-POLY1305')
    expect(res.headers['x-country']).toEqual('US')
    expect(res.headers['x-colo']).toEqual('LAX')
    await server.close()
    cb()
  })

  test('Request CF-Connecting-IP', async (cb) => {
    const script = `
      addEventListener('fetch', event => {
        const req = event.request
        const resp = new Response('', {
        headers: {
          'CF-Connecting-IP': req.headers.get('CF-Connecting-IP')
          }
        })
        event.respondWith(resp)
      })
    `
    const server = new Cloudworker(script).listen(8080)
    const res = await axios.get('http://localhost:8080', defaultAxiosOpts)
    expect(res.headers['CF-Connecting-IP'.toLowerCase()]).toBeDefined()
    await server.close()
    cb()
  })

  test('self', async (cb) => {
    const script = `
      self.addEventListener('fetch', event => {
        event.respondWith(new Response('hello', {status: 200}))
      })
    `
    const server = new Cloudworker(script).listen(8080)
    const res = await axios.get('http://localhost:8080', defaultAxiosOpts)
    expect(res.status).toEqual(200)
    expect(res.data).toEqual('hello')
    await server.close()
    cb()
  })

  test('eval throws', async (cb) => {
    const script = `
      addEventListener('fetch', event => {
        eval('console.log("test")')
        event.respondWith(new Response('hello', {status: 200}))
      })
    `
    const server = new Cloudworker(script).listen(8080)
    const res = await axios.get('http://localhost:8080', defaultAxiosOpts)
    expect(res.status).toEqual(500)
    await server.close()
    cb()
  })
})
