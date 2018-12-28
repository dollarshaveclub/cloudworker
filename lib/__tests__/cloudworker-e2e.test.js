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

  test('simple sha256 encode', async (cb) => {
    const script = `
      addEventListener('fetch', event => {
        const url = new URL(event.request.url)
        event.respondWith(respondWithHelloAsSHA256())
      })

      function byteStringToUint8Array(byteString) {
        const ui = new Uint8Array(byteString.length)
        for (let i = 0; i < byteString.length; ++i) {
          ui[i] = byteString.charCodeAt(i)
        }
        return ui
      }

      function toHexString(buffer) {
        var s = '', h = '0123456789abcdef';
        (new Uint8Array(buffer)).forEach((v) => { s += h[v >> 4] + h[v & 15]; })
        return s;
      }

      async function respondWithHelloAsSHA256() {
        const sha = await toSHA256("hello")
        return new Response(sha, {status: 200})
      }

      async function toSHA256(message) {
        let hash = await crypto.subtle.digest('SHA-256', byteStringToUint8Array(message))
        return toHexString(hash)
      }
    `
    const server = new Cloudworker(script).listen(8080)
    const res = await axios.get('http://localhost:8080', defaultAxiosOpts)
    expect(res.status).toEqual(200)
    // taken from `echo -n "hello" | shasum -a 256`
    expect(res.data).toContain('2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824')
    await server.close()
    cb()
  })

  test('simple hmac sign', async (cb) => {
    const script = `
      addEventListener('fetch', event => {
        const url = new URL(event.request.url)
        event.respondWith(generateSignedUrl(url))
      })

      function toHexString(buffer) {
        var s = '', h = '0123456789abcdef';
        (new Uint8Array(buffer)).forEach((v) => { s += h[v >> 4] + h[v & 15]; })
        return s;
      }

      async function generateSignedUrl(url) {
        // We'll need some super-secret data to use as a symmetric key.
        const secretKeyData = byteStringToUint8Array("my secret symmetric key")
        const key = await crypto.subtle.importKey(
          "raw", secretKeyData,
          { name: "HMAC", hash: "SHA-256" },
          false, [ "sign" ]
        )

        // Signed requests expire after one minute. Note that you could choose
        // expiration durations dynamically, depending on, e.g. the path or a query
        // parameter.
        const expirationMs = 60000
        const expiry = new Date('Feb 28 2013 19:00:00 UTC').getTime()
        const dataToAuthenticate = '/verify/bob1362078000000'

        const mac = await crypto.subtle.sign(
          "HMAC", key,
          byteStringToUint8Array(dataToAuthenticate)
        )

        // mac is an ArrayBuffer, so make it hex
        const hex64Mac = toHexString(mac)

        url.searchParams.set("mac", hex64Mac)
        url.searchParams.set("expiry", expiry)

        return new Response(url)
      }

      function byteStringToUint8Array(byteString) {
        const ui = new Uint8Array(byteString.length)
        for (let i = 0; i < byteString.length; ++i) {
          ui[i] = byteString.charCodeAt(i)
        }
        return ui
      }
    `
    const server = new Cloudworker(script).listen(8080)
    const res = await axios.get('http://localhost:8080', defaultAxiosOpts)
    expect(res.status).toEqual(200)
    expect(res.data).toContain('?mac=ae0342a9b989d76cfc457439f615ed72651ba7bce1994361621a003f6ade5508&expiry=1362078000000')
    await server.close()
    cb()
  })

  test('simple hmac verify', async (cb) => {
    const script = `
      addEventListener('fetch', event => {
        event.respondWith(verifyAndFetch(event.request))
      })

      function fromHexStringToUint8Array(str) {
        var a = [];
        for (var i = 0, len = str.length; i < len; i+=2) {
          a.push(parseInt(str.substr(i,2),16));
        }
        return new Uint8Array(a);
      }

      async function verifyAndFetch(request) {
        const url = new URL(request.url)

        // We'll need some super-secret data to use as a symmetric key.
        // const encoder = new TextEncoder()
        const secretKeyData = byteStringToUint8Array("my secret symmetric key")
        const key = await crypto.subtle.importKey(
          "raw", secretKeyData,
          { name: "HMAC", hash: "SHA-256" },
          false, [ "verify" ]
        )

        // Extract the query parameters we need and run the HMAC algorithm on the
        // parts of the request we're authenticating: the path and the expiration
        // timestamp.
        const expiry = Number(url.searchParams.get("expiry"))
        const dataToAuthenticate = url.pathname + expiry

        // The received MAC is Base64-encoded, so we have to go to some trouble to
        // get it into a buffer type that crypto.subtle.verify() can read.
        const receivedMacBase64 = url.searchParams.get("mac")
        const receivedMac = fromHexStringToUint8Array(receivedMacBase64)

        // Use crypto.subtle.verify() to guard against timing attacks. Since HMACs use
        // symmetric keys, we could implement this by calling crypto.subtle.sign() and
        // then doing a string comparison -- this is insecure, as string comparisons
        // bail out on the first mismatch, which leaks information to potential
        // attackers.
        const verified = await crypto.subtle.verify(
          "HMAC", key,
          receivedMac,
          byteStringToUint8Array(dataToAuthenticate)
        )

        if (!verified) {
          const body = "Invalid MAC"
          return new Response(body, { status: 403 })
        }

        if (Date.now() > expiry) {
          const body = "URL expired"
          return new Response(body, { status: 403 })
        }

        // We've verified the MAC and expiration time; we're good to pass the request
        // through.
        return fetch(request)
      }

      // Convert a ByteString (a string whose code units are all in the range
      // [0, 255]), to a Uint8Array. If you pass in a string with code units larger
      // than 255, their values will overflow!
      function byteStringToUint8Array(byteString) {
        const ui = new Uint8Array(byteString.length)
        for (let i = 0; i < byteString.length; ++i) {
          ui[i] = byteString.charCodeAt(i)
        }
        return ui
      }
    `
    const server = new Cloudworker(script).listen(8080)
    const res = await axios.get('http://localhost:8080/verify/bob?mac=ae0342a9b989d76cfc457439f615ed72651ba7bce1994361621a003f6ade5508&expiry=1362078000000', defaultAxiosOpts)
    expect(res.status).toEqual(403)
    expect(res.data).toContain('URL expired')
    await server.close()
    cb()
  })

})
