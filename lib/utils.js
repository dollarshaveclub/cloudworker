const fs = require('fs')
const {promisify} = require('util')
const pathModule = require('path')
const tmp = require('tmp')
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

/**
 * Recursively generate a list of files in a given directory and its subdirectories.
 *
 * @param {string} path The path to the directory. Should end with a trailing separator.
 *
 * @returns {Array<string>} List of files in the directory and its subdirectories, relative to path.
 */
async function getDirEntries (path) {
  const readdir = promisify(fs.readdir)

  let entries = []

  const dir = await readdir(path, { withFileTypes: true })
  for (const entry of dir) {
    if (entry.isDirectory()) {
      entries = entries.concat(await getDirEntries(`${path}${entry.name}${pathModule.sep}`))
    } else {
      entries.push(`${path}${entry.name}`)
    }
  }

  return entries
}

/*
 * Create a JSON file suitable for populating an in-memory KV store, as well as a manifest
 * file mapping paths to entries in the KV store.
 *
 * @param {string} path The path to the directory to generate the KV file JSON from.
 * @param {string} file The path to the JSON file.
 *
 * @returns {Object}
 *   @property {string} file The path to the KV store JSON file.
 *   @property {string} manifestFile The path to the manifest binding JSON file.
 */
async function populateKVFile (path, file) {
  const appendFile = promisify(fs.appendFile)
  const readFile = promisify(fs.readFile)
  if (path.slice(-1) !== pathModule.sep) path += pathModule.sep
  const entries = await getDirEntries(path)

  await appendFile(file, '{\n')
  let entry, contents
  for (let index = 0; index < entries.length; index++) {
    entry = entries[index]
    contents = await readFile(`${entry}`, { encoding: 'utf-8' })
    entry = entry.replace(path, '')

    await appendFile(
      file,
      `  ${JSON.stringify(entry)}: ${JSON.stringify(contents)}` +
      (index < entries.length - 1 ? ',' : '') +
      '\n'
    )
  }
  await appendFile(file, '}\n')

  const manifestFile = file.replace('.json', '-manifest.json')
  const manifestKeys = {}
  for (const key of entries) {
    const shortKey = key.replace(path, '')
    manifestKeys[shortKey] = shortKey
  }

  await appendFile(manifestFile, JSON.stringify(manifestKeys))

  return { file, manifestFile }
}

/**
 * Generate the necessary KV store and binding for a static site using the
 * assets in a given directory.
 *
 * @param {string} bucketPath The path to the static site's asset bucket.
 *
 * @returns {Object}
 *   @property {string} siteKvFile The --kv-file param for the static content KV file.
 *   @property {string} siteManifest The --bind-file param for the static content manifest file.
 */
module.exports.generateSite = async (bucketPath) => {
  const tmpFile = tmp.fileSync({ prefix: 'cloudworker-', postfix: '.json' })
  const { file, manifestFile } = await populateKVFile(bucketPath, tmpFile.name)
  return {
    siteKvFile: `__STATIC_CONTENT=${file}`,
    siteManifest: `__STATIC_CONTENT_MANIFEST=${manifestFile}`,
  }
}
