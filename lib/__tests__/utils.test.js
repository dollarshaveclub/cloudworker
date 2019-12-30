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

  test('extractKVBindings throws on invalid filepath format', async () => {
    expect(() => { utils.extractKVBindings([], ['invalid format']) }).toThrow()
  })

  test('extractKVBindings handles files and sets', async (cb) => {
    const kv = new KeyValueStore(path.resolve('test-kv.json'))
    kv.put('hello', 'world')

    const bindings = utils.extractKVBindings(['test.this=great'], ['test=test-kv.json'])
    const {test} = bindings

    fs.unlinkSync(kv.path)
    expect(await test.get('hello')).toEqual('world')
    expect(await test.get('this')).toEqual('great')

    cb()
  })

  test('extractBindings throws on invalid format', async () => {
    expect(() => { utils.extractBindings(['invalid format'], []) }).toThrow()
  })

  test('extractBindings parses properly', async () => {
    const bindings = utils.extractBindings(['foo=bar', 'baz=qux'], [])
    expect(bindings.foo).toEqual('bar')
    expect(bindings.baz).toEqual('qux')
  })

  test('extractBindings allows = in value', async () => {
    const bindings = utils.extractBindings(['foo="const bar=\'abc\';"'], [])
    expect(bindings.foo).toEqual('"const bar=\'abc\';"')
  })

  test('extractBindings handles file as binding value', async () => {
    const content = JSON.stringify({
      foo: 'abc',
      bar: 12345,
      baz: {
        qux: ['a', 'b', 'c', 'd'],
        plugh: [ { id: 987 }, { id: 876 } ],
      },
    })
    const path = '/tmp/__cloudworker_test.json'
    await fs.writeFileSync(path, content)

    const bindings = utils.extractBindings([], [`__DATA=${path}`])
    expect(bindings.__DATA).toEqual(content)

    await fs.unlinkSync(path)
  })

  test('extractBindings throws on invalid file format', async () => {
    expect(() => { utils.extractBindings([], ['invalid file format']) }).toThrow()
  })

  test('extractBindings throws on nonexistent path', async () => {
    expect(() => { utils.extractBindings([], ['foo=/tmp/__cloudworker_fake_file.json']) }).toThrow()
  })

  test('parseWasmFlags throws on invalid format', async () => {
    expect(() => { utils.parseWasmFlags(['invalid format']) }).toThrow()
  })

  test('parseWasmFlags parses properly', async () => {
    const bindings = utils.parseWasmFlags(['foo=bar'])
    expect(bindings.foo).toEqual('bar')
  })

  test('generateSite throws on nonexistent path', async () => {
    expect.assertions(1)
    try {
      await utils.generateSite('/not/a/real/bucket/path')
    } catch (e) {
      expect(e).toBeDefined()
    }
  })

  describe('generateSite', () => {
    const path = '/tmp/__cloudworker_test'
    const subdir = '/subdir'

    beforeAll(async () => {
      await fs.mkdirSync(path)
      await fs.mkdirSync(`${path}${subdir}`)
      await fs.writeFileSync(`${path}/a`, 'a123')
      await fs.writeFileSync(`${path}${subdir}/b`, 'b456')
    })

    test('generateSite recurses down a directory tree', async () => {
      const { siteKvFile, siteManifest } = await utils.generateSite(path)

      const siteKVFileContent = fs.readFileSync(siteKvFile.split('=')[1], 'utf-8')
      const siteManifestContent = fs.readFileSync(siteManifest.split('=')[1], 'utf-8')

      expect(siteKVFileContent).toEqual("{\n  \"a\": \"a123\",\n  \"subdir/b\": \"b456\"\n}\n") // eslint-disable-line
      expect(siteManifestContent).toEqual(JSON.stringify({
        'a': 'a',
        'subdir/b': 'subdir/b',
      }))
    })

    test('handles a path with a trailing slash the same', async () => {
      const { siteKvFile, siteManifest } = await utils.generateSite(path)

      const siteKVFileContent = fs.readFileSync(siteKvFile.split('=')[1], 'utf-8')
      const siteManifestContent = fs.readFileSync(siteManifest.split('=')[1], 'utf-8')

      const { siteKvFile: siteKvFile2, siteManifest: siteManifest2 } = await utils.generateSite(`${path}/`)

      const siteKVFileContent2 = fs.readFileSync(siteKvFile2.split('=')[1], 'utf-8')
      const siteManifestContent2 = fs.readFileSync(siteManifest2.split('=')[1], 'utf-8')

      expect(siteKVFileContent2).toEqual(siteKVFileContent)
      expect(siteManifestContent2).toEqual(siteManifestContent)
    })

    afterAll(async () => {
      await fs.unlinkSync(`${path}/a`)
      await fs.unlinkSync(`${path}${subdir}/b`)
      await fs.rmdirSync(`${path}${subdir}`)
      await fs.rmdirSync(path)
    })
  })
})
