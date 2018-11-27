const fs = require('fs')
const {KeyValueStore} = require('./kv')
module.exports.read = f => fs.readFileSync(f).toString('utf-8')
module.exports.extractKVBindings = (setFlagValues) => {
  const bindings = {}
  for (const flag of setFlagValues) {
    const comps = flag.split('.')
    if (comps.length < 2 || comps[1].split('=').length < 2) {
      throw new Error('Invalid set flag format. Expected format of [variable].[key]=[value]')
    }

    const variable = comps[0]
    const kvFragment = comps.slice(1).join('.')
    const kvComponents = kvFragment.split('=')
    const key = kvComponents[0]
    const value = kvComponents.slice(1).join('=')

    if (!bindings[variable]) {
      bindings[variable] = new KeyValueStore()
    }

    bindings[variable].put(key, value)
  }

  return bindings
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
