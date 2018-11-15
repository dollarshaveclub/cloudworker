const fs = require('fs')
const {KeyValueStore} = require('./kv')
module.exports.read = f => fs.readFileSync(f).toString('utf-8')

module.exports.extractKVBindings = (setFlagValues) => {
  const bindings = {}
  for (const flag of setFlagValues) {
    const comps = flag.split('.')

    if (comps.length !== 2 || comps[1].split('=').length !== 2) {
      throw new Error('Invalid set flag format. Expected format of [variable].[key]=[value]')
    }
    const variable = comps[0]
    const [key, value] = comps[1].split('=')

    if (!bindings[variable]) {
      bindings[variable] = new KeyValueStore()
    }

    bindings[variable].put(key, value)
  }

  return bindings
}
