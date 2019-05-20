const Crypto = require('node-webcrypto-ossl')

module.exports.crypto = new Crypto()

const subtleDigest = module.exports.crypto.subtle.digest
module.exports.crypto.subtle.digest = function digest (algorithm, data) {
  if (typeof algorithm === 'string' && algorithm.toLowerCase() === 'md5') {
    return new Promise(resolve => {
      const hash = require('crypto')
        .createHash('md5')
        .update(data)
        .digest()

      resolve(hash.buffer)
    })
  }

  return subtleDigest.apply(this, arguments)
}
