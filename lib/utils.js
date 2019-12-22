const fs = require('fs')
const {KeyValueStore} = require('./kv')
module.exports.read = f => fs.readFileSync(f).toString('utf-8')
module.exports.extractKVBindings = (kvSetFlags, kvFileFlags) => {
  const bindings = {}

  const filepaths = parseFlags('kv-file', kvFileFlags)

  for (const [variable, path] of Object.entries(filepaths)) {
    bindings[variable] = new KeyValueStore(path)
  }

  const kvStores = parseFlags('kv-set', kvSetFlags, true)

  for (const [variable, obj] of Object.entries(kvStores)) {
    if (!bindings[variable]) {
      bindings[variable] = new KeyValueStore(filepaths[variable])
    }

    for (const [key, value] of Object.entries(obj)) {
      bindings[variable].put(key, value)
    }
  }

  return bindings
}

module.exports.extractBindings = (bindingFlags, bindingFileFlags) => {
  return Object.assign(
    {},
    parseFlags('bind', bindingFlags),
    parseFlags('bind-file', bindingFileFlags, false, (variable, filepath) => {
      if (!fs.existsSync(filepath)) {
        throw new Error(`Invalid bind-file path "${filepath}"`)
      }

      return fs.readFileSync(filepath).toString('utf-8')
    })
  )
}

module.exports.parseWasmFlags = (wasmFlags) => parseFlags('wasm', wasmFlags)

/**
 * Parse flags into bindings.
 *
 * @param {string} type Type of binding being parsed.
 * @param {Array<string>} flags Command line flags to parse.
 * @param {boolean} objectVariable Whether the variable represents an object name and key
 * @param {Function} handleVariable Function to call for custom variable/value handling.
 *
 * @returns {Object} bindings The variable bindings parsed from the flags.
 */
function parseFlags (type, flags = [], objectVariable = false, handleVariable = null) {
  const bindings = {}

  for (const flag of flags) {
    if (objectVariable) {
      const comps = flag.split('.')
      if (comps.length < 2 || comps[1].split('=').length < 2) {
        throw new Error(`Invalid ${type} flag format. Expected format of [variable].[key]=[value]`)
      }

      const variable = comps[0]
      const kvFragment = comps.slice(1).join('.')
      const kvComponents = kvFragment.split('=')
      const key = kvComponents[0]
      const value = kvComponents.slice(1).join('=')

      bindings[variable] = Object.assign({}, bindings[variable], { [key]: value })
    } else {
      const comps = flag.split('=')
      if (comps.length < 2) {
        throw new Error(`Invalid ${type} flag format. Expected format of [variable]=[value]`)
      }

      const variable = comps[0]
      const value = comps.slice(1).join('=')
      if (handleVariable) bindings[variable] = handleVariable(variable, value)
      else bindings[variable] = value
    }
  }

  return bindings
}
