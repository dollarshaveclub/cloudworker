const textEncoding = require('../text-encoder.js')

describe('text-encoder', () => {
  test('able to fetch encoding from text decoder', async () => {
    const asciiDecoder = new textEncoding.TextDecoder('cp1251')
    expect(await asciiDecoder.encoding).toEqual('windows-1251')
  })

  test('able to obtain ignoreBom from text decoder', async () => {
    const asciiDecoder = new textEncoding.TextDecoder('ascii', { ignoreBOM: false })
    expect(await asciiDecoder.encoding).toEqual('windows-1252')
    expect(await asciiDecoder.ignoreBOM).toEqual(false)

    const asciiDecoder2 = new textEncoding.TextDecoder('ascii', { ignoreBOM: true })
    expect(await asciiDecoder2.encoding).toEqual('windows-1252')
    expect(await asciiDecoder2.ignoreBOM).toEqual(true)
  })

  test('able to obtain fatal from text decoder', async () => {
    const asciiDecoder = new textEncoding.TextDecoder('ascii', { fatal: false })
    expect(await asciiDecoder.encoding).toEqual('windows-1252')
    expect(await asciiDecoder.fatal).toEqual(false)

    const asciiDecoder2 = new textEncoding.TextDecoder('ascii', { fatal: true })
    expect(await asciiDecoder2.encoding).toEqual('windows-1252')
    expect(await asciiDecoder2.fatal).toEqual(true)
  })
})
