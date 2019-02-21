const { KeyValueStore } = require('../kv')
const fs = require('fs')
const path = require('path')
const streams = require('@mattiasbuelens/web-streams-polyfill/ponyfill')

describe('kv', () => {
  test('KeyValueStore text', async () => {
    const kv = new KeyValueStore()
    kv.put('hello', 'world')

    const value = await kv.get('hello')
    expect(typeof value).toBe('string')
    expect(value).toEqual('world')

    const valueTest = await kv.get('hello', 'text')
    expect(typeof valueTest).toBe('string')
    expect(valueTest).toEqual('world')
  })

  test('KeyValueStore json', async () => {
    const kv = new KeyValueStore()
    kv.put('json', '{"json" : "object"}')

    const valueJson = await kv.get('json', 'json')
    expect(valueJson).toBeInstanceOf(Object)
    expect(valueJson).toEqual({json: 'object'})
  })

  test('KeyValueStore arrayBuffer', async () => {
    const kv = new KeyValueStore()
    kv.put('hello', 'world')

    const valueArrayBuffer = await kv.get('hello', 'arrayBuffer')

    // workaround for https://github.com/facebook/jest/issues/3186
    expect(valueArrayBuffer.constructor.name).toEqual('ArrayBuffer')
    expect(valueArrayBuffer).arrayBufferIsEqual(Uint8Array.from(Buffer.from('world')).buffer)
  })

  test('KeyValueStore stream', async () => {
    const kv = new KeyValueStore()
    kv.put('hello', 'world')

    const valueStream = await kv.get('hello', 'stream')
    expect(valueStream).toBeInstanceOf(streams.ReadableStream)
    const reader = valueStream.getReader()

    var done = false
    var readValue
    while (!done) {
      const res = await reader.read()
      done = res.done

      if (res.value) {
        readValue = res.value
      }
    }

    expect(done).toEqual(true)
    expect(readValue).toBeInstanceOf(Uint8Array)
    expect(readValue).toEqual(Uint8Array.from(Buffer.from('world')))
  })

  test('KeyValueStore get of invalid type throws', async () => {
    const kv = new KeyValueStore()
    kv.put('hello', 'world')

    expect(() => { kv.get('hello', 'invalid') }).toThrowError(new TypeError('Unknown response type. Possible types are "text", "arrayBuffer", "json", and "stream".'))
  })

  test('KeyValueStore delete of key', async () => {
    const kv = new KeyValueStore()
    kv.put('hello', 'world')

    expect(await kv.get('hello')).toEqual('world')
    await kv.delete('hello')
    expect(await kv.get('hello')).toEqual(null)
  })

  test('KeyValueStore delete throws on nonexistent key', async () => {
    const kv = new KeyValueStore()
    expect(() => { kv.delete('hello') }).toThrowError(new Error('HTTP DELETE request failed: 404 Not Found'))
  })

  test('KeyValueStore persistence', async (cb) => {
    const kv = new KeyValueStore(path.resolve('test-kv.json'))
    kv.put('hello', 'world')

    const kv2 = new KeyValueStore(path.resolve('test-kv.json'))

    // Remove the file (as only testing)
    fs.unlinkSync(kv2.path)
    const value = await kv2.get('hello')
    expect(value).toEqual('world')

    cb()
  })
})
