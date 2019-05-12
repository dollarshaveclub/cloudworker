const runtime = require('../runtime')
const vm = require('vm')

describe('runtime', () => {
  test('context allows overriding of properties via bindings', async () => {
    const dummyFactory = Symbol('dummy factory')
    const someMockFetch = Symbol('some mock fetch')
    const context = new runtime.Context(() => {}, dummyFactory, {fetch: someMockFetch})
    expect(context.fetch).toBe(someMockFetch)
  })

  test('context has expected properties', async () => {
    const expected = [
      'console',
      'setTimeout',
      'clearTimeout',
      'setInterval',
      'clearInterval',
      'addEventListener',
      'fetch',
      'Request',
      'Response',
      'Headers',
      'URL',
      'ReadableStream',
      'WritableStream',
      'TransformStream',
      'FetchEvent',
      'caches',
      'crypto',
      'TextDecoder',
      'TextEncoder',
      'atob',
      'btoa',
      'ArrayBuffer',
      'Int8Array',
      'Uint8Array',
      'Uint8ClampedArray',
      'Int16Array',
      'Uint16Array',
      'Int32Array',
      'Uint32Array',
      'Float32Array',
      'Float64Array',
      'Object',
      'constructor'
    ].sort()

    const dummyFactory = Symbol('dummy factory')
    const got = Object.getOwnPropertyNames(new runtime.Context(() => {}, dummyFactory)).sort()
    expect(got).toEqual(expected)
  })

  test('instanceof from different realm works', () => {
    const dummyFactory = Symbol('dummy factory')
    const bindings = {
      instanceOfObject: (obj) => { return obj instanceof Object},
      isArrayBufferView: (ab) => { return ArrayBuffer.isView(ab)},
    }
    const context = new runtime.Context(() => {}, dummyFactory, bindings)
    
    const objTest = vm.runInNewContext("instanceOfObject(new Object())", context)
    const arrayBufferViewTest = vm.runInNewContext("isArrayBufferView(new Uint16Array())", context)

    expect(objTest).toEqual(true)
    expect(arrayBufferViewTest).toEqual(true)
  })
})
