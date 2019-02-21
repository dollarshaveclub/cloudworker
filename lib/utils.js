const fs = require('fs')
const {KeyValueStore} = require('./kv')
module.exports.read = f => fs.readFileSync(f).toString('utf-8')
module.exports.extractKVBindings = (kvSetFlags, kvFileFlags) => {
  const bindings = {}

  const filepaths = extractKVPaths(kvFileFlags)

  for (const [variable, path] of Object.entries(filepaths)) {
    bindings[variable] = new KeyValueStore(path)
  }

  for (const flag of kvSetFlags) {
    const comps = flag.split('.')
    if (comps.length < 2 || comps[1].split('=').length < 2) {
      throw new Error('Invalid kv-set flag format. Expected format of [variable].[key]=[value]')
    }

    const variable = comps[0]
    const kvFragment = comps.slice(1).join('.')
    const kvComponents = kvFragment.split('=')
    const key = kvComponents[0]
    const value = kvComponents.slice(1).join('=')

    if (!bindings[variable]) {
      bindings[variable] = new KeyValueStore(filepaths[variable])
    }

    bindings[variable].put(key, value)
  }

  return bindings
}

const extractKVPaths = (kvFileFlags) => {
  const paths = {}

  if (!kvFileFlags) return paths

  for (const flag of kvFileFlags) {
    const components = flag.split('=')

    if (flag.length < 2) {
      throw new Error('Invalid kv-file flag format. Expected format of [variable]=[value]')
    }

    paths[components[0]] = components[1]
  }

  return paths
}

module.exports.parseWasmFlags = (wasmFlags) => {
  const bindings = {}
  for (const flag of wasmFlags) {
    const comps = flag.split('=')
    if (comps.length !== 2) {
      throw new Error('Invalid wasm flag format. Expected format of [variable=path]')
    }
    const [variable, path] = comps
    bindings[variable] = path
  }
  return bindings
}
