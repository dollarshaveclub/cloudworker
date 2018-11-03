#!/usr/bin/env node

const program = require('commander')
const Cloudworker = require('..')
const path = require('path')
const { read } = require('../lib/utils')

let file = null

program
  .usage('[options] <file>')
  .option('-p, --port <port>', 'Port', 3000)
  .option('-d, --debug', 'Debug', false)
  .action(f => { file = f })
  .parse(process.argv)

if (typeof file !== 'string') {
  console.error('no file specified')
  process.exit(1)
}

console.log('Starting up...')
const fullpath = path.resolve(process.cwd(), file)
const script = read(fullpath)
const server = new Cloudworker({workerScript: script, debug: program.debug}).listen(program.port)
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
