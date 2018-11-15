const fs = require('fs')
const path = require('path')

async function loadBindings (varToPath) {
  const bindings = {}
  const vars = Object.keys(varToPath)
  for (const variable of vars) {
    bindings[variable] = await loadPath(varToPath[variable])
  }

  return bindings
}

async function loadPath (file) {
  const fullpath = path.resolve(process.cwd(), file)
  const source = fs.readFileSync(fullpath)
  return loadBuffer(source)
}

async function loadBuffer (buffer) {
  const typedArray = new Uint8Array(buffer)
  return WebAssembly.compile(typedArray)
}

module.exports.loadPath = loadPath
module.exports.loadBuffer = loadBuffer
module.exports.loadBindings = loadBindings
