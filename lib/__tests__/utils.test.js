const { KeyValueStore } = require('../kv')
const fs = require('fs')
const path = require('path')
const utils = require('../utils')

describe('utils', () => {
  test('extractKVBindings throws on invalid format', async () => {
    expect(() => { utils.extractKVBindings(['invalidFormat=test'], []) }).toThrow()
  })

  test('extractKVBindings parses properly', async () => {
    const bindings = utils.extractKVBindings(['test.key=value', 'another.key1=value1'], [])
    const {test, another} = bindings

    expect(await test.get('key')).toEqual('value')
    expect(await another.get('key1')).toEqual('value1')
  })

  test('extractKVBindings allows = and . in value', async () => {
    const bindings = utils.extractKVBindings(['test.key=somevalue=.test1'])
    const {test} = bindings

    expect(await test.get('key')).toEqual('somevalue=.test1')
  })

  test('extractKVBindings existing persistence', async (cb) => {
    const kv = new KeyValueStore(path.resolve('test-kv.json'))
    kv.put('hello', 'world')

    const bindings = utils.extractKVBindings([], ['test=test-kv.json'])
    const {test} = bindings

    fs.unlinkSync(kv.path)
    expect(await test.get('hello')).toEqual('world')

    cb()
  })
})
