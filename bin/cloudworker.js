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
  .option('-s, --kv-set [variable.key=value]', 'Binds variable to a local implementation of Workers KV and sets key to value', collect, [])
  .option('-f, --kv-file [variable=path]', 'Set the filepath for value peristence for the local implementation of Workers KV', collect, [])
  .option('-w, --wasm [variable=path]', 'Binds variable to wasm located at path', collect, [])
  .option('-c, --enable-cache', 'Enables cache <BETA>', false)
  .option('-r, --watch', 'Watch the worker script and restart the worker when changes are detected', false)
  .option('-s, --set [variable.key=value]', '(Deprecated) Binds variable to a local implementation of Workers KV and sets key to value', collect, [])
  .option('--tls-key <tlsKey>', 'Optional. Path to encryption key for serving requests with TLS enabled. Must specify --tls-cert when using this option.')
  .option('--tls-cert <tlsCert>', 'Optional. Path to certificate for serving requests with TLS enabled. Must specify --tls-key when using this option.')
  .option('--https-port <httpsPort>', 'Optional. Port to listen on for HTTPS requests. Must specify --tls-cert and --tls-key when using this option. May not be the same value as --port.', 3001)
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
  const bindings = utils.extractKVBindings(program.kvSet.concat(program.set), program.kvFile)
  Object.assign(bindings, wasmBindings)

  // Add a warning log for deprecation
  if (program.set.length > 0) console.warn('Warning: Flag --set is now deprecated, please use --kv-set instead')

  if ((program.tlsKey && !program.tlsCert) || (!program.tlsKey && program.tlsCert)) {
    console.error('Both --tls-key and --tls-cert must be set when using TLS.')
    process.exit(1)
  }

  let tlsKey = ''
  let tlsCert = ''
  if (program.tlsKey && program.tlsCert) {
    try {
      tlsKey = fs.readFileSync(program.tlsKey)
      tlsCert = fs.readFileSync(program.tlsCert)
    } catch (err) {
      console.error('Error reading TLS configuration')
      console.error(err)
      process.exit(1)
    }
    if (program.port === program.httpsPort) {
      console.error('HTTP port and HTTPS port must be different')
      process.exit(1)
    }
  }

  const opts = {
    debug: program.debug,
    enableCache: program.enableCache,
    bindings: bindings,
    tlsKey: tlsKey,
    tlsCert: tlsCert,
  }
  let worker = new Cloudworker(script, opts)
  let server = worker.listen(program.port)
  console.log(`Listening on ${program.port} for HTTP requests`)

  let httpsServer = null
  if (tlsKey && tlsCert) {
    httpsServer = worker.httpsListen(program.httpsPort)
    console.log(`Listening on ${program.httpsPort} for HTTPS requests`)
  }

  let stopping = false
  let reloading = false

  if (program.watch) {
    fs.watchFile(fullpath, () => {
      reloading = true
      console.log('Changes to the worker script detected - reloading...')

      server.close(() => {
        if (stopping) {
          if (httpsServer) {
            httpsServer.close(() => { })
          }
          return
        }

        worker = new Cloudworker(utils.read(fullpath), opts)
        server = worker.listen(program.port)

        if (httpsServer) {
          httpsServer.close(() => {
            httpsServer = worker.httpsListen(program.httpsPort)
          })
        }
        reloading = false
        console.log('Successfully reloaded server!')
      })
    })
  }

  function shutdown () {
    if (stopping) return

    stopping = true
    console.log('\nShutting down...')
    server.close(terminate)
    if (httpsServer) {
      httpsServer.close(terminate)
    }

    if (reloading) {
      server.on('close', terminate)
      if (httpsServer) {
        httpsServer.on('close', terminate)
      }
    }
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
