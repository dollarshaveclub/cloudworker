const arrayBufferIsEqual = require('arraybuffer-equal')

expect.extend({
  arrayBufferIsEqual (left, right) {
    return {pass: arrayBufferIsEqual(left, right)}
  },
})
