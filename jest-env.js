// fixes https://github.com/facebook/jest/issues/3186
const NodeEnvironment = require('jest-environment-node')

module.exports = class ArrayBufferEnvironment extends NodeEnvironment {
  constructor (config) {
    super(config)
    this.global.ArrayBuffer = ArrayBuffer
  }
}
