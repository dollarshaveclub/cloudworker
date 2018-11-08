const fs = require('fs')

module.exports.read = module.exports.read = f => fs.readFileSync(f).toString('utf-8')
