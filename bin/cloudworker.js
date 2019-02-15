#!/usr/bin/env node

const program = require('commander')
const Cloudworker = require('..')
const fs = require('fs')
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
  .option('-s, --set [variable.key=value]', 'Binds variable to a local implementation of Workers KV and sets key to value', collect, [])
  .option('-g, --global [variable=value]', 'Binds global variable to script', collect, [])
  .option('-w, --wasm [variable=path]', 'Binds variable to wasm located at path', collect, [])
  .option('-c, --enable-cache', 'Enables cache <BETA>', false)
  .option('-r, --watch', 'Watch the worker script and restart the worker when changes are detected', false)
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
  const globals = utils.extractGlobals(program.global)
  const bindings = utils.extractKVBindings(program.set)
  Object.assign(bindings, wasmBindings)

  const opts = {debug: program.debug, enableCache: program.enableCache, bindings: bindings, globals: globals}
  let server = new Cloudworker(script, opts).listen(program.port)

  console.log(`Listening on ${program.port}`)

  let stopping = false
  let reloading = false

  if (program.watch) {
    fs.watchFile(fullpath, () => {
      reloading = true
      console.log('Changes to the worker script detected - reloading...')

      server.close(() => {
        if (stopping) return

        reloading = false
        console.log('Successfully reloaded!')

        server = new Cloudworker(utils.read(fullpath), opts).listen(program.port)
      })
    })
  }

  function shutdown () {
    if (stopping) return

    stopping = true
    console.log('\nShutting down...')
    server.close(terminate)

    if (reloading) server.on('close', terminate)
  }

  function terminate () {
    console.log('Goodbye!')
    process.exit(0)
  }

  process.on('SIGINT', () => {
    shutdown()
  })

  process.on('SIGTERM', () => {
    shutdown()
  })
}
