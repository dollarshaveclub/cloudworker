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
      'Array',
      'ArrayBuffer',
      'Atomics',
      'BigInt',
      'BigInt64Array',
      'BigUint64Array',
      'Boolean',
      'DataView',
      'Date',
      'Error',
      'EvalError',
      'FetchEvent',
      'Float32Array',
      'Float64Array',
      'Function',
      'Headers',
      'Int16Array',
      'Int32Array',
      'Int8Array',
      'Intl',
      'JSON',
      'Map',
      'Math',
      'NaN',
      'Number',
      'Object',
      'Promise',
      'Proxy',
      'RangeError',
      'ReadableStream',
      'ReferenceError',
      'Reflect',
      'RegExp',
      'Request',
      'Response',
      'Set',
      'SharedArrayBuffer',
      'String',
      'Symbol',
      'SyntaxError',
      'TextDecoder',
      'TextEncoder',
      'TransformStream',
      'TypeError',
      'URIError',
      'URL',
      'URLSearchParams',
      'Uint16Array',
      'Uint32Array',
      'Uint8Array',
      'Uint8ClampedArray',
      'WeakMap',
      'WebAssembly',
      'WritableStream',
      'addEventListener',
      'atob',
      'btoa',
      'caches',
      'clearInterval',
      'clearTimeout',
      'console',
      'constructor',
      'crypto',
      'decodeURI',
      'decodeURIComponent',
      'encodeURI',
      'encodeURIComponent',
      'escape',
      'fetch',
      'globalThis',
      'isFinite',
      'isNaN',
      'parseFloat',
      'parseInt',
      'self',
      'setInterval',
      'setTimeout',
      'undefined',
      'unescape',
    ].sort()

    const dummyFactory = Symbol('dummy factory')
    const got = Object.getOwnPropertyNames(new runtime.Context(() => {}, dummyFactory)).sort()
    expect(got).toEqual(expected)
  })

  test('instanceof from different realm works', () => {
    const dummyFactory = Symbol('dummy factory')
    const bindings = {
      instanceOfObject: (obj) => { return obj instanceof Object },
      isArrayBufferView: (ab) => { return ArrayBuffer.isView(ab) },
    }
    const context = new runtime.Context(() => {}, dummyFactory, bindings)

    const objTest = vm.runInNewContext('instanceOfObject(new Object())', context)
    const arrayBufferViewTest = vm.runInNewContext('isArrayBufferView(new Uint16Array())', context)

    expect(objTest).toEqual(true)
    expect(arrayBufferViewTest).toEqual(true)
  })
})
