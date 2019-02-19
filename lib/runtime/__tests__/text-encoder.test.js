const textEncoding = require('../text-encoder.js')

describe('text-encoder', () => {
  test('text decoder defaults to utf-8', () => {
    const decoder = new textEncoding.TextDecoder()
    expect(decoder.encoding).toEqual('utf-8')
  })

  test('able to fetch encoding from text decoder', () => {
    const decoder = new textEncoding.TextDecoder('utf-8')
    expect(decoder.encoding).toEqual('utf-8')
  })

  test('able to obtain ignoreBom from text decoder', () => {
    const decoder = new textEncoding.TextDecoder('utf-8', { ignoreBOM: false })
    expect(decoder.encoding).toEqual('utf-8')
    expect(decoder.ignoreBOM).toEqual(false)

    const decoder2 = new textEncoding.TextDecoder('utf-8', { ignoreBOM: true })
    expect(decoder2.encoding).toEqual('utf-8')
    expect(decoder2.ignoreBOM).toEqual(true)
  })

  test('able to obtain fatal from text decoder', () => {
    const decoder = new textEncoding.TextDecoder('utf-8', { fatal: false })
    expect(decoder.encoding).toEqual('utf-8')
    expect(decoder.fatal).toEqual(false)

    const decoder2 = new textEncoding.TextDecoder('utf-8', { fatal: true })
    expect(decoder2.encoding).toEqual('utf-8')
    expect(decoder2.fatal).toEqual(true)
  })

  test('text decoder throws on anything other than utf-8', () => {
    expect(() => {
      const decoder = new textEncoding.TextDecoder('ascii', { fatal: false })
      console.log(decoder) // prevent linting error due to decoder not being used
    }).toThrow(new ReferenceError('TextDecoder only supports utf-8 encoding'))
  })
})
