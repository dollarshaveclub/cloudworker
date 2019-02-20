const fs = require('fs')
const {KeyValueStore} = require('./kv')
module.exports.read = f => fs.readFileSync(f).toString('utf-8')
module.exports.extractKVBindings = (setFlagValues, setFlagPaths) => {
  const bindings = {}
  for (const flag of setFlagValues) {
    const comps = flag.split('.')
    if (comps.length < 2 || comps[1].split('=').length < 2) {
      throw new Error('Invalid kv-set flag format. Expected format of [variable].[key]=[value]')
    }

    const variable = comps[0]
    const kvFragment = comps.slice(1).join('.')
    const kvComponents = kvFragment.split('=')
    const key = kvComponents[0]
    const value = kvComponents.slice(1).join('=')

    let filepath

    if (setFlagPaths) {
      // Find a variable path from the paths which matches the variable
      const variablePath = setFlagPaths.find(value => {
        if (value.split('=').length < 2) {
          throw new Error('Invalid kv-file flag format. Expected format of [variable]=[value]')
        }
        return (value.indexOf(variable + '=') > -1)
      })

      // If there is is a variable matching, then get the path name from it
      if (variablePath) filepath = variablePath.split('=')[1]
    }

    if (!bindings[variable]) {
      bindings[variable] = new KeyValueStore(filepath)
    }

    bindings[variable].put(key, value)
  }

  if (setFlagPaths.length > 0 && setFlagValues.length === 0) {
    for (const flag of setFlagPaths) {
      const components = flag.split('=')

      if (flag.length < 2) {
        throw new Error('Invalid kv-file flag format. Expected format of [variable]=[value]')
      }

      if (!bindings[components[0]]) {
        bindings[components[0]] = new KeyValueStore(components[1])
      }
    }
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
