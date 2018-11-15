#!/usr/bin/env node

const program = require('commander')
const Cloudworker = require('..')
const path = require('path')
const utils = require('../lib/utils')
const wasmLoader = require('../lib/wasm')

let file = null

function collect (val, memo) {
  memo.push(val)
  return memo
}

program
  .usage('[options] <file>')
  .option('-p, --port <port>', 'Port', 3000)
  .option('-d, --debug', 'Debug', false)
  .option('-s, --set [variabe.key=value]', 'Binds variable to a local implementation of Workers KV and sets key to value', collect, [])
  .option('-w, --wasm [variable=path]', 'Binds variable to wasm located at path', collect, [])
  .action(f => { file = f })
  .parse(process.argv)

if (typeof file !== 'string') {
  console.error('no file specified')
  process.exit(1)
}

const wasmBindings = utils.parseWasmFlags(program.wasm)
wasmLoader.loadBindings(wasmBindings).then(res => {
  run(file, res)
}).catch(error => {
  console.error(error)
  process.exit(1)
})

function run (file, wasmBindings) {
  console.log('Starting up...')
  const fullpath = path.resolve(process.cwd(), file)
  const script = utils.read(fullpath)
  const bindings = utils.extractKVBindings(program.set)
  Object.assign(bindings, wasmBindings)

  const server = new Cloudworker({workerScript: script, debug: program.debug, bindings: bindings}).listen(program.port)
  console.log(`Listening on ${program.port}`)

  let stopping = false
  function shutdown () {
    if (stopping) return

    stopping = true
    console.log('\nShutting down...')
    server.close(() => {
      console.log('Goodbye!')
      process.exit(0)
    })
  }

  process.on('SIGINT', () => {
    shutdown()
  })

  process.on('SIGTERM', () => {
    shutdown()
  })
}
