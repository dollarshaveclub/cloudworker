module.exports = {
  extends: [
    'dollarshaveclub',
  ],
  rules: {
    'no-console': 0,
  },
  plugins: ['jest'],
  env: {
    'jest/globals': true,
  },
  globals: {
    WebAssembly: true,
    Atomics: true,
    BigInt: true,
    BigInt64Array: true,
    BigUint64Array: true,
    SharedArrayBuffer: true
  }
}