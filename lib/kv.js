const fs = require('fs')
const streams = require('web-streams-polyfill')
const LIST_MAX_LIMIT = 1000

class KeyValueStore {
  constructor (path) {
    this.store = new Map()

    // When a path is set enable the persistence functionality
    if (path && path.length > 0) {
      this.path = path

      // Check if the KV store file exists
      if (fs.existsSync(this.path)) {
        // Read from the KV store file and parse as JSON
        const data = JSON.parse(fs.readFileSync(this.path, { encoding: 'utf8' }))

        // Bind the data from the KV store file to the store
        for (const [key, value] of Object.entries(data)) this.store.set(key, Buffer.from(value))
      }
    }
  }

  put (key, value) {
    this.store.set(key, Buffer.from(value))

    // Save the KV store file
    if (this.path) this.save()

    return Promise.resolve(undefined)
  }

  get (key, type = 'text') {
    const validTypes = ['text', 'arrayBuffer', 'json', 'stream']
    if (!validTypes.includes(type)) {
      throw new TypeError('Unknown response type. Possible types are "text", "arrayBuffer", "json", and "stream".')
    }

    const value = this.store.get(key)
    if (value === undefined) {
      return Promise.resolve(null)
    }

    switch (type) {
      case 'text':
        return Promise.resolve(value.toString())
      case 'arrayBuffer':
        return Promise.resolve(Uint8Array.from(value).buffer)
      case 'json':
        return Promise.resolve(JSON.parse(value.toString()))
      case 'stream':

        const { readable, writable } = new streams.TransformStream()
        const writer = writable.getWriter()
        writer.write(Uint8Array.from(value)).then(() => writer.close())
        return Promise.resolve(readable)
    }
  }

  delete (key) {
    if (!this.store.has(key)) {
      throw new Error('HTTP DELETE request failed: 404 Not Found')
    }

    this.store.delete(key)

    // Save the KV store file
    if (this.path) this.save()

    return Promise.resolve(undefined)
  }

  save () {
    // Check if the store is persistent
    if (this.path) {
      // Create a dataset for the KV pairs
      const data = {}

      // Add each of the KV pairs to the data
      for (const [key, value] of this.store) data[key] = value

      // Write the KV pairs to the file
      fs.writeFileSync(this.path, JSON.stringify(data))
    }
  }

  list (options = {prefix: null, limit: 1000, cursor: 0}) {
    if (options.limit === undefined || options.limit > LIST_MAX_LIMIT) options.limit = LIST_MAX_LIMIT
    if (options.cursor === undefined) {
      options.cursor = 0
    } else {
      options.cursor = parseInt(options.cursor)
    }

    let keys = Array.from(this.store.keys())

    if (options.prefix !== null) {
      keys = keys.filter((key) =>
        key.startsWith(options.prefix)
      )
    }
    const keyCountBeforePagination = keys.length
    if (options.cursor !== 0) {
      keys = keys.slice(options.cursor)
    }

    const listComplete = options.cursor + keys.length === keyCountBeforePagination && keys.length <= options.limit
    let nextCursor = options.cursor

    if (!listComplete) {
      keys = keys.slice(0, options.limit)
      nextCursor += keys.length
    }

    return Promise.resolve({
      keys: keys.map(key => ({
        name: key,
      })),
      list_complete: listComplete,
      cursor: listComplete ? '' : nextCursor.toString(),
    })
  }
}

module.exports = { KeyValueStore }
