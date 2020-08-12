const { KeyValueStore } = require('../kv')
const fs = require('fs')
const path = require('path')
const streams = require('web-streams-polyfill')

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

  // test('KeyValueStore list', async (cb) => {
  //   const kv = new KeyValueStore()
  //   kv.put('hello', 'world')
  //   kv.put('foo', 'bar')
  //
  //   const value = await kv.list()
  //   expect(value).toEqual({
  //     keys: [{ name: 'hello' }, { name: 'foo' }],
  //     list_complete: true,
  //     cursor: '',
  //   })
  //
  //   cb()
  // })

  test('KeyValueStore list with prefix', async (cb) => {
    const kv = new KeyValueStore()
    kv.put('hello', 'world')
    kv.put('foo', 'bar')
    kv.put('foo:bar', 'foobard')

    const value = await kv.list({ prefix: 'foo' })
    expect(value).toEqual({
      keys: [{ name: 'foo' }, { name: 'foo:bar' }],
      list_complete: true,
      cursor: '',
    })

    cb()
  })

  test('KeyValueStore list with prefix and pagination', async (cb) => {
    const kv = new KeyValueStore()
    kv.put('foo:1', 'foobard')
    kv.put('foo:2', 'foobard')
    kv.put('foo:3', 'foobard')
    kv.put('foo:4', 'foobard')
    kv.put('foo:5', 'foobard')
    kv.put('foo:6', 'foobard')
    kv.put('foo:7', 'foobard')
    kv.put('foo:8', 'foobard')
    kv.put('foo:9', 'foobard')
    kv.put('foo:10', 'foobard')
    kv.put('foo:11', 'foobard')
    kv.put('foo:12', 'foobard')
    kv.put('foo:13', 'foobard')
    kv.put('foo:14', 'foobard')
    kv.put('foo:15', 'foobard')
    kv.put('foo:16', 'foobard')
    kv.put('foo:17', 'foobard')

    const firstPage = await kv.list({prefix: 'foo', limit: 5})
    expect(firstPage).toEqual({
      keys: [{name: 'foo:1'}, {name: 'foo:2'}, {name: 'foo:3'}, {name: 'foo:4'}, {name: 'foo:5'}],
      list_complete: false,
      cursor: '5',
    })

    const secondPage = await kv.list({prefix: 'foo', limit: 5, cursor: firstPage.cursor})
    expect(secondPage).toEqual({
      keys: [{name: 'foo:6'}, {name: 'foo:7'}, {name: 'foo:8'}, {name: 'foo:9'}, {name: 'foo:10'}],
      list_complete: false,
      cursor: '10',
    })

    const thirdPage = await kv.list({prefix: 'foo', limit: 5, cursor: secondPage.cursor})
    expect(thirdPage).toEqual({
      keys: [{name: 'foo:11'}, {name: 'foo:12'}, {name: 'foo:13'}, {name: 'foo:14'}, {name: 'foo:15'}],
      list_complete: false,
      cursor: '15',
    })

    const fourthPage = await kv.list({prefix: 'foo', limit: 5, cursor: thirdPage.cursor})
    expect(fourthPage).toEqual({
      keys: [{name: 'foo:16'}, {name: 'foo:17'}],
      list_complete: true,
      cursor: '',
    })

    cb()
  })
})
