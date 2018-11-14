const utils = require('../utils')

describe('utils', () => {
  test('extractKVBindings throws on invalid format', async () => {
    expect(() => { utils.extractKVBindings(['invalidFormat=test']) }).toThrow()
  })

  test('extractKVBindings parses properly', async () => {
    const bindings = utils.extractKVBindings(['test.key=value', 'another.key1=value1'])
    const {test, another} = bindings

    expect(await test.get('key')).toEqual('value')
    expect(await another.get('key1')).toEqual('value1')
  })
})
